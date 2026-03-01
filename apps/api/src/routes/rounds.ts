import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, and, asc, max } from "drizzle-orm";
import { createDb } from "../db";
import {
  clubs,
  rounds,
  events,
  mediaItems,
  clubMembers,
  clubMemberProgress,
  users,
} from "../db/schema";
import { authMiddleware } from "../lib/auth-middleware";
import { derivePhase } from "../lib/phases";
import { calculatePacing } from "../lib/pacing";

type Env = {
  Bindings: {
    DATABASE_URL: string;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
  };
  Variables: {
    user: { id: string; name: string; email: string; image: string | null };
  };
};

async function isClubAdmin(
  db: ReturnType<typeof createDb>,
  clubId: string,
  userId: string,
) {
  const [m] = await db
    .select()
    .from(clubMembers)
    .where(
      and(
        eq(clubMembers.clubId, clubId),
        eq(clubMembers.userId, userId),
        eq(clubMembers.role, "admin"),
      ),
    );
  return !!m;
}

const roundsRouter = new Hono<Env>();
roundsRouter.use("/*", authMiddleware);

// GET /clubs/:clubId/rounds — List all rounds for a club with derived phase
roundsRouter.get("/clubs/:clubId/rounds", async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const clubId = c.req.param("clubId");

  const clubRounds = await db
    .select()
    .from(rounds)
    .where(eq(rounds.clubId, clubId))
    .orderBy(asc(rounds.order));

  const result = await Promise.all(
    clubRounds.map(async (round) => {
      let event = null;
      if (round.eventId) {
        const [e] = await db
          .select()
          .from(events)
          .where(eq(events.id, round.eventId));
        event = e ?? null;
      }
      const phase = derivePhase(round, event);
      return { ...round, phase, event };
    }),
  );

  return c.json(result);
});

// GET /clubs/:clubId/rounds/current — Get current round with full context
roundsRouter.get("/clubs/:clubId/rounds/current", async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const clubId = c.req.param("clubId");
  const user = c.get("user");

  const [club] = await db.select().from(clubs).where(eq(clubs.id, clubId));
  if (!club) return c.json({ error: "Club not found" }, 404);
  if (!club.currentRoundId)
    return c.json({ error: "No current round" }, 404);

  const [round] = await db
    .select()
    .from(rounds)
    .where(eq(rounds.id, club.currentRoundId));
  if (!round) return c.json({ error: "Round not found" }, 404);

  // Linked event
  let event = null;
  if (round.eventId) {
    const [e] = await db
      .select()
      .from(events)
      .where(eq(events.id, round.eventId));
    event = e ?? null;
  }

  // Linked media
  let media = null;
  if (round.mediaItemId) {
    const [m] = await db
      .select()
      .from(mediaItems)
      .where(eq(mediaItems.id, round.mediaItemId));
    media = m ?? null;
  }

  const phase = derivePhase(round, event);

  // Progress array
  const progress = await db
    .select({
      userId: clubMemberProgress.userId,
      currentPage: clubMemberProgress.currentPage,
      status: clubMemberProgress.status,
      updatedAt: clubMemberProgress.updatedAt,
      userName: users.name,
      userImage: users.image,
    })
    .from(clubMemberProgress)
    .innerJoin(users, eq(clubMemberProgress.userId, users.id))
    .where(
      and(
        eq(clubMemberProgress.clubId, clubId),
        ...(round.mediaItemId
          ? [eq(clubMemberProgress.mediaItemId, round.mediaItemId)]
          : []),
      ),
    );

  // Pacing for current user
  let pacing = null;
  if (
    media &&
    media.mediaType === "book" &&
    media.pageCount &&
    event
  ) {
    const userProgress = progress.find((p) => p.userId === user.id);
    const currentPage = userProgress?.currentPage ?? 0;
    pacing = calculatePacing(
      currentPage,
      media.pageCount,
      event.startsAt,
      round.startedAt,
    );
  }

  return c.json({
    ...round,
    phase,
    event,
    media,
    selectionMode: club.selectionMode,
    progress,
    pacing,
  });
});

// POST /clubs/:clubId/rounds — Start a new round (admin only)
roundsRouter.post("/clubs/:clubId/rounds", async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const clubId = c.req.param("clubId");
  const user = c.get("user");

  if (!(await isClubAdmin(db, clubId, user.id))) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const [club] = await db.select().from(clubs).where(eq(clubs.id, clubId));
  if (!club) return c.json({ error: "Club not found" }, 404);

  // Complete current round if one exists
  if (club.currentRoundId) {
    await db
      .update(rounds)
      .set({ completedAt: new Date() })
      .where(eq(rounds.id, club.currentRoundId));
  }

  // Find next order number
  const [maxOrder] = await db
    .select({ maxOrder: max(rounds.order) })
    .from(rounds)
    .where(eq(rounds.clubId, clubId));
  const nextOrder = (maxOrder?.maxOrder ?? -1) + 1;

  // Create new round
  const [newRound] = await db
    .insert(rounds)
    .values({
      clubId,
      order: nextOrder,
    })
    .returning();

  // Update club's currentRoundId
  await db
    .update(clubs)
    .set({ currentRoundId: newRound.id })
    .where(eq(clubs.id, clubId));

  return c.json({ ...newRound, phase: "selection" as const }, 201);
});

// POST /clubs/:clubId/rounds/current/select — Admin picks media for the round
const selectSchema = z.object({
  mediaItemId: z.string().uuid(),
});

roundsRouter.post(
  "/clubs/:clubId/rounds/current/select",
  zValidator("json", selectSchema),
  async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const clubId = c.req.param("clubId");
    const user = c.get("user");
    const body = c.req.valid("json");

    if (!(await isClubAdmin(db, clubId, user.id))) {
      return c.json({ error: "Forbidden" }, 403);
    }

    const [club] = await db.select().from(clubs).where(eq(clubs.id, clubId));
    if (!club || !club.currentRoundId)
      return c.json({ error: "No current round" }, 404);

    const [updated] = await db
      .update(rounds)
      .set({
        mediaItemId: body.mediaItemId,
        selectedBy: user.id,
      })
      .where(eq(rounds.id, club.currentRoundId))
      .returning();

    return c.json(updated);
  },
);

// POST /clubs/:clubId/rounds/current/event — Create event for current round
const createEventSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  location: z.string().optional(),
  startsAt: z.string(),
  endsAt: z.string().optional(),
});

roundsRouter.post(
  "/clubs/:clubId/rounds/current/event",
  zValidator("json", createEventSchema),
  async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const clubId = c.req.param("clubId");
    const user = c.get("user");
    const body = c.req.valid("json");

    if (!(await isClubAdmin(db, clubId, user.id))) {
      return c.json({ error: "Forbidden" }, 403);
    }

    const [club] = await db.select().from(clubs).where(eq(clubs.id, clubId));
    if (!club || !club.currentRoundId)
      return c.json({ error: "No current round" }, 404);

    const [event] = await db
      .insert(events)
      .values({
        clubId,
        title: body.title,
        description: body.description ?? null,
        location: body.location ?? null,
        startsAt: new Date(body.startsAt),
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
      })
      .returning();

    // Link event to round
    const [updated] = await db
      .update(rounds)
      .set({ eventId: event.id })
      .where(eq(rounds.id, club.currentRoundId))
      .returning();

    return c.json({ round: updated, event }, 201);
  },
);

// POST /clubs/:clubId/rounds/current/advance — Complete current round
roundsRouter.post("/clubs/:clubId/rounds/current/advance", async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const clubId = c.req.param("clubId");
  const user = c.get("user");

  if (!(await isClubAdmin(db, clubId, user.id))) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const [club] = await db.select().from(clubs).where(eq(clubs.id, clubId));
  if (!club || !club.currentRoundId)
    return c.json({ error: "No current round" }, 404);

  // Set completedAt on current round
  const [completed] = await db
    .update(rounds)
    .set({ completedAt: new Date() })
    .where(eq(rounds.id, club.currentRoundId))
    .returning();

  // Null out club's currentRoundId
  await db
    .update(clubs)
    .set({ currentRoundId: null })
    .where(eq(clubs.id, clubId));

  return c.json({ ...completed, phase: "completed" as const });
});

export { roundsRouter };

import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, and } from "drizzle-orm";
import { createDb } from "../db";
import { clubs, rounds, clubMemberProgress, clubMembers, users, mediaItems, events } from "../db/schema";
import { authMiddleware } from "../lib/auth-middleware";
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

async function isClubMember(db: ReturnType<typeof createDb>, clubId: string, userId: string) {
  const [m] = await db.select().from(clubMembers).where(
    and(eq(clubMembers.clubId, clubId), eq(clubMembers.userId, userId))
  );
  return !!m;
}

const progressRouter = new Hono<Env>();
progressRouter.use("/*", authMiddleware);

// GET /clubs/:clubId/rounds/current/progress
progressRouter.get("/clubs/:clubId/rounds/current/progress", async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const clubId = c.req.param("clubId");
  const user = c.get("user");

  if (!(await isClubMember(db, clubId, user.id))) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const [club] = await db.select().from(clubs).where(eq(clubs.id, clubId));
  if (!club?.currentRoundId) return c.json([]);

  const [round] = await db.select().from(rounds).where(eq(rounds.id, club.currentRoundId));
  if (!round?.mediaItemId) return c.json([]);

  const progress = await db
    .select({
      status: clubMemberProgress.status,
      currentPage: clubMemberProgress.currentPage,
      updatedAt: clubMemberProgress.updatedAt,
      user: { id: users.id, name: users.name, image: users.image },
    })
    .from(clubMemberProgress)
    .innerJoin(users, eq(clubMemberProgress.userId, users.id))
    .where(
      and(
        eq(clubMemberProgress.clubId, clubId),
        eq(clubMemberProgress.mediaItemId, round.mediaItemId),
      )
    );

  return c.json(progress);
});

// POST /clubs/:clubId/rounds/current/progress
const updateProgressSchema = z.object({
  status: z.enum(["not_started", "in_progress", "finished"]).optional(),
  currentPage: z.number().int().min(0).optional(),
});

progressRouter.post(
  "/clubs/:clubId/rounds/current/progress",
  zValidator("json", updateProgressSchema),
  async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const clubId = c.req.param("clubId");
    const user = c.get("user");
    const body = c.req.valid("json");

    if (!(await isClubMember(db, clubId, user.id))) {
      return c.json({ error: "Forbidden" }, 403);
    }

    const [club] = await db.select().from(clubs).where(eq(clubs.id, clubId));
    if (!club?.currentRoundId) return c.json({ error: "No active round" }, 400);

    const [round] = await db.select().from(rounds).where(eq(rounds.id, club.currentRoundId));
    if (!round?.mediaItemId) return c.json({ error: "No media selected" }, 400);

    const [existing] = await db.select().from(clubMemberProgress).where(
      and(
        eq(clubMemberProgress.clubId, clubId),
        eq(clubMemberProgress.userId, user.id),
        eq(clubMemberProgress.mediaItemId, round.mediaItemId),
      )
    );

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (body.status) updates.status = body.status;
    if (body.currentPage !== undefined) updates.currentPage = body.currentPage;

    if (existing) {
      await db.update(clubMemberProgress)
        .set(updates)
        .where(
          and(
            eq(clubMemberProgress.clubId, clubId),
            eq(clubMemberProgress.userId, user.id),
            eq(clubMemberProgress.mediaItemId, round.mediaItemId),
          )
        );
    } else {
      await db.insert(clubMemberProgress).values({
        clubId,
        userId: user.id,
        mediaItemId: round.mediaItemId,
        roundId: club.currentRoundId,
        status: body.status ?? "not_started",
        currentPage: body.currentPage ?? null,
      });
    }

    // Return pacing if applicable
    let pacing = null;
    const [media] = await db.select().from(mediaItems).where(eq(mediaItems.id, round.mediaItemId));
    if (media?.pageCount && round.eventId) {
      const [event] = await db.select().from(events).where(eq(events.id, round.eventId));
      if (event) {
        pacing = calculatePacing(
          body.currentPage ?? existing?.currentPage ?? 0,
          media.pageCount,
          event.startsAt,
          round.startedAt,
        );
      }
    }

    return c.json({ status: body.status ?? existing?.status ?? "not_started", currentPage: body.currentPage ?? existing?.currentPage, pacing });
  }
);

export { progressRouter };

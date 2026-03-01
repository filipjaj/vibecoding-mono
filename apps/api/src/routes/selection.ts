import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, and, sql, inArray } from "drizzle-orm";
import { createDb } from "../db";
import {
  clubs, rounds, nominations, nominationVotes, mediaItems,
  clubMembers, users, rotationOrder,
} from "../db/schema";
import { authMiddleware } from "../lib/auth-middleware";

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

const selectionRouter = new Hono<Env>();
selectionRouter.use("/*", authMiddleware);

// GET /clubs/:clubId/rounds/current/nominations
selectionRouter.get("/clubs/:clubId/rounds/current/nominations", async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const clubId = c.req.param("clubId");
  const user = c.get("user");

  if (!(await isClubMember(db, clubId, user.id))) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const [club] = await db.select().from(clubs).where(eq(clubs.id, clubId));
  if (!club?.currentRoundId) return c.json([]);

  const noms = await db
    .select({
      id: nominations.id,
      pitch: nominations.pitch,
      createdAt: nominations.createdAt,
      nominatedBy: { id: users.id, name: users.name, image: users.image },
      media: mediaItems,
      voteCount: sql<number>`(SELECT COUNT(*) FROM nomination_votes WHERE nomination_votes.nomination_id = ${nominations.id})::int`,
    })
    .from(nominations)
    .innerJoin(users, eq(nominations.nominatedBy, users.id))
    .innerJoin(mediaItems, eq(nominations.mediaItemId, mediaItems.id))
    .where(eq(nominations.roundId, club.currentRoundId));

  return c.json(noms);
});

// POST /clubs/:clubId/rounds/current/nominate
const nominateSchema = z.object({
  mediaItemId: z.string().uuid(),
  pitch: z.string().max(500).optional(),
});

selectionRouter.post(
  "/clubs/:clubId/rounds/current/nominate",
  zValidator("json", nominateSchema),
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

    const [nom] = await db.insert(nominations).values({
      roundId: club.currentRoundId,
      nominatedBy: user.id,
      mediaItemId: body.mediaItemId,
      pitch: body.pitch ?? null,
    }).returning();

    return c.json(nom, 201);
  }
);

// POST /clubs/:clubId/rounds/current/vote
const voteSchema = z.object({ nominationId: z.string().uuid() });

selectionRouter.post(
  "/clubs/:clubId/rounds/current/vote",
  zValidator("json", voteSchema),
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

    // Verify nomination exists and belongs to the current round of this club
    const [nom] = await db.select().from(nominations).where(
      and(eq(nominations.id, body.nominationId), eq(nominations.roundId, club.currentRoundId))
    );
    if (!nom) return c.json({ error: "Nomination not found in current round" }, 404);

    // Remove previous votes in this round (single query instead of N+1)
    const roundNomIds = await db.select({ id: nominations.id })
      .from(nominations).where(eq(nominations.roundId, nom.roundId));
    const ids = roundNomIds.map(n => n.id);
    if (ids.length > 0) {
      await db.delete(nominationVotes).where(
        and(
          inArray(nominationVotes.nominationId, ids),
          eq(nominationVotes.userId, user.id)
        )
      );
    }

    await db.insert(nominationVotes).values({
      nominationId: body.nominationId,
      userId: user.id,
    });

    return c.json({ voted: body.nominationId });
  }
);

// POST /clubs/:clubId/rounds/current/finalize — Admin finalizes winner
const finalizeSchema = z.object({ nominationId: z.string().uuid() });

selectionRouter.post(
  "/clubs/:clubId/rounds/current/finalize",
  zValidator("json", finalizeSchema),
  async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const clubId = c.req.param("clubId");
    const user = c.get("user");
    const body = c.req.valid("json");

    const [membership] = await db.select().from(clubMembers).where(
      and(eq(clubMembers.clubId, clubId), eq(clubMembers.userId, user.id), eq(clubMembers.role, "admin"))
    );
    if (!membership) return c.json({ error: "Forbidden" }, 403);

    const [club] = await db.select().from(clubs).where(eq(clubs.id, clubId));
    if (!club?.currentRoundId) return c.json({ error: "No active round" }, 400);

    const [nom] = await db.select().from(nominations).where(eq(nominations.id, body.nominationId));
    if (!nom) return c.json({ error: "Nomination not found" }, 404);

    const [round] = await db.update(rounds)
      .set({ mediaItemId: nom.mediaItemId, selectedBy: nom.nominatedBy })
      .where(eq(rounds.id, club.currentRoundId))
      .returning();

    return c.json(round);
  }
);

// GET /clubs/:clubId/rotation — Get rotation order
selectionRouter.get("/clubs/:clubId/rotation", async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const clubId = c.req.param("clubId");
  const user = c.get("user");

  if (!(await isClubMember(db, clubId, user.id))) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const order = await db
    .select({
      position: rotationOrder.position,
      lastPickedRoundId: rotationOrder.lastPickedRoundId,
      user: { id: users.id, name: users.name, image: users.image },
    })
    .from(rotationOrder)
    .innerJoin(users, eq(rotationOrder.userId, users.id))
    .where(eq(rotationOrder.clubId, clubId))
    .orderBy(rotationOrder.position);

  return c.json(order);
});

export { selectionRouter };

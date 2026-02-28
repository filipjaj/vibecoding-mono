import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, and, desc } from "drizzle-orm";
import { createDb } from "../db";
import { users, userShelves, mediaItems, reviews, clubMembers, clubs, clubMemberProgress, activityEvents } from "../db/schema";
import { authMiddleware } from "../lib/auth-middleware";

type Env = {
  Bindings: { DATABASE_URL: string; BETTER_AUTH_SECRET: string; BETTER_AUTH_URL: string; GOOGLE_CLIENT_ID: string; GOOGLE_CLIENT_SECRET: string };
  Variables: { user: { id: string; name: string; email: string; image: string | null } };
};

const usersRouter = new Hono<Env>();

// GET /users/:userId — Profile (public)
usersRouter.get("/users/:userId", async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const userId = c.req.param("userId");

  const [user] = await db.select({ id: users.id, name: users.name, image: users.image, createdAt: users.createdAt })
    .from(users).where(eq(users.id, userId));
  if (!user) return c.json({ error: "Not found" }, 404);

  const userClubs = await db.select({ club: clubs, role: clubMembers.role })
    .from(clubMembers).innerJoin(clubs, eq(clubMembers.clubId, clubs.id)).where(eq(clubMembers.userId, userId));

  const userReviews = await db.select().from(reviews).where(eq(reviews.userId, userId));

  return c.json({ ...user, clubs: userClubs, reviewCount: userReviews.length });
});

// GET /users/:userId/shelf
usersRouter.get("/users/:userId/shelf", async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const userId = c.req.param("userId");

  const shelf = await db.select({ status: userShelves.status, addedAt: userShelves.addedAt, media: mediaItems })
    .from(userShelves).innerJoin(mediaItems, eq(userShelves.mediaItemId, mediaItems.id))
    .where(eq(userShelves.userId, userId)).orderBy(desc(userShelves.addedAt));

  return c.json(shelf);
});

// POST /shelf — Add/update shelf item
const shelfSchema = z.object({ mediaItemId: z.string().uuid(), status: z.enum(["want", "reading", "watched", "finished"]) });

usersRouter.post("/shelf", authMiddleware, zValidator("json", shelfSchema), async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const user = c.get("user");
  const body = c.req.valid("json");

  const [existing] = await db.select().from(userShelves).where(
    and(eq(userShelves.userId, user.id), eq(userShelves.mediaItemId, body.mediaItemId))
  );

  if (existing) {
    await db.update(userShelves).set({ status: body.status }).where(
      and(eq(userShelves.userId, user.id), eq(userShelves.mediaItemId, body.mediaItemId))
    );
  } else {
    await db.insert(userShelves).values({ userId: user.id, mediaItemId: body.mediaItemId, status: body.status });
  }

  await db.insert(activityEvents).values({ userId: user.id, type: "shelf_update", payload: { mediaItemId: body.mediaItemId, status: body.status } });

  return c.json({ status: body.status });
});

// POST /clubs/:clubId/progress — Update club member progress
const progressSchema = z.object({ mediaItemId: z.string().uuid(), status: z.enum(["not_started", "in_progress", "finished"]) });

usersRouter.post("/clubs/:clubId/progress", authMiddleware, zValidator("json", progressSchema), async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const clubId = c.req.param("clubId");
  const user = c.get("user");
  const body = c.req.valid("json");

  const [existing] = await db.select().from(clubMemberProgress).where(
    and(eq(clubMemberProgress.clubId, clubId), eq(clubMemberProgress.userId, user.id), eq(clubMemberProgress.mediaItemId, body.mediaItemId))
  );

  if (existing) {
    await db.update(clubMemberProgress).set({ status: body.status, updatedAt: new Date() }).where(
      and(eq(clubMemberProgress.clubId, clubId), eq(clubMemberProgress.userId, user.id), eq(clubMemberProgress.mediaItemId, body.mediaItemId))
    );
  } else {
    await db.insert(clubMemberProgress).values({ clubId, userId: user.id, mediaItemId: body.mediaItemId, status: body.status });
  }

  await db.insert(activityEvents).values({ userId: user.id, clubId, type: "progress_update", payload: { mediaItemId: body.mediaItemId, status: body.status } });

  return c.json({ status: body.status });
});

export { usersRouter };

import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, and, asc } from "drizzle-orm";
import { createDb } from "../db";
import { clubSchedule, mediaItems, clubMembers } from "../db/schema";
import { authMiddleware } from "../lib/auth-middleware";

type Env = {
  Bindings: { DATABASE_URL: string; BETTER_AUTH_SECRET: string; BETTER_AUTH_URL: string; GOOGLE_CLIENT_ID: string; GOOGLE_CLIENT_SECRET: string };
  Variables: { user: { id: string; name: string; email: string; image: string | null } };
};

const scheduleRouter = new Hono<Env>();
scheduleRouter.use("/*", authMiddleware);

// GET /:clubId/schedule
scheduleRouter.get("/:clubId/schedule", async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const clubId = c.req.param("clubId");

  const items = await db
    .select({ id: clubSchedule.id, order: clubSchedule.order, scheduledDate: clubSchedule.scheduledDate, status: clubSchedule.status, media: mediaItems })
    .from(clubSchedule)
    .innerJoin(mediaItems, eq(clubSchedule.mediaItemId, mediaItems.id))
    .where(eq(clubSchedule.clubId, clubId))
    .orderBy(asc(clubSchedule.order));

  return c.json(items);
});

// POST /:clubId/schedule — Add media to schedule (admin only)
const addToScheduleSchema = z.object({
  mediaItemId: z.string().uuid(),
  scheduledDate: z.string().optional(),
});

scheduleRouter.post("/:clubId/schedule", zValidator("json", addToScheduleSchema), async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const clubId = c.req.param("clubId");
  const user = c.get("user");
  const body = c.req.valid("json");

  const [membership] = await db.select().from(clubMembers).where(
    and(eq(clubMembers.clubId, clubId), eq(clubMembers.userId, user.id), eq(clubMembers.role, "admin"))
  );
  if (!membership) return c.json({ error: "Forbidden" }, 403);

  const existing = await db.select({ order: clubSchedule.order }).from(clubSchedule).where(eq(clubSchedule.clubId, clubId));
  const nextOrder = existing.length > 0 ? Math.max(...existing.map((e) => e.order)) + 1 : 0;

  const [item] = await db.insert(clubSchedule).values({
    clubId, mediaItemId: body.mediaItemId, order: nextOrder,
    scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : null,
  }).returning();

  return c.json(item, 201);
});

// PATCH /:clubId/schedule/:itemId — Update status
const updateScheduleSchema = z.object({ status: z.enum(["upcoming", "current", "completed"]) });

scheduleRouter.patch("/:clubId/schedule/:itemId", zValidator("json", updateScheduleSchema), async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const clubId = c.req.param("clubId");
  const itemId = c.req.param("itemId");
  const user = c.get("user");
  const body = c.req.valid("json");

  const [membership] = await db.select().from(clubMembers).where(
    and(eq(clubMembers.clubId, clubId), eq(clubMembers.userId, user.id), eq(clubMembers.role, "admin"))
  );
  if (!membership) return c.json({ error: "Forbidden" }, 403);

  const [updated] = await db.update(clubSchedule).set({ status: body.status }).where(eq(clubSchedule.id, itemId)).returning();
  if (!updated) return c.json({ error: "Not found" }, 404);
  return c.json(updated);
});

export { scheduleRouter };

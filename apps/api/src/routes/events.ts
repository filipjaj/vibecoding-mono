import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, and, asc } from "drizzle-orm";
import { createDb } from "../db";
import {
  events,
  rsvps,
  users,
  clubs,
  clubMembers,
  clubSchedule,
  mediaItems,
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
    user: {
      id: string;
      name: string;
      email: string;
      image: string | null;
    };
  };
};

const eventsRouter = new Hono<Env>();
eventsRouter.use("/*", authMiddleware);

// GET /clubs/:clubId/events
eventsRouter.get("/clubs/:clubId/events", async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const clubId = c.req.param("clubId");
  const clubEvents = await db
    .select()
    .from(events)
    .where(eq(events.clubId, clubId))
    .orderBy(asc(events.startsAt));
  return c.json(clubEvents);
});

// POST /clubs/:clubId/events (admin only)
const createEventSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  location: z.string().optional(),
  startsAt: z.string(),
  endsAt: z.string().optional(),
  scheduleItemId: z.string().uuid().optional(),
});

eventsRouter.post(
  "/clubs/:clubId/events",
  zValidator("json", createEventSchema),
  async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const clubId = c.req.param("clubId");
    const user = c.get("user");
    const body = c.req.valid("json");

    const [membership] = await db
      .select()
      .from(clubMembers)
      .where(
        and(
          eq(clubMembers.clubId, clubId),
          eq(clubMembers.userId, user.id),
          eq(clubMembers.role, "admin")
        )
      );
    if (!membership) return c.json({ error: "Forbidden" }, 403);

    const [event] = await db
      .insert(events)
      .values({
        clubId,
        scheduleItemId: body.scheduleItemId ?? null,
        title: body.title,
        description: body.description ?? null,
        location: body.location ?? null,
        startsAt: new Date(body.startsAt),
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
      })
      .returning();

    return c.json(event, 201);
  }
);

// GET /events/:eventId — Event detail with RSVPs and linked media
eventsRouter.get("/events/:eventId", async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const eventId = c.req.param("eventId");

  const [row] = await db
    .select({
      id: events.id, clubId: events.clubId, scheduleItemId: events.scheduleItemId,
      title: events.title, description: events.description, location: events.location,
      startsAt: events.startsAt, endsAt: events.endsAt,
      clubName: clubs.name,
    })
    .from(events)
    .innerJoin(clubs, eq(events.clubId, clubs.id))
    .where(eq(events.id, eventId));
  if (!row) return c.json({ error: "Not found" }, 404);
  const event = row;

  let media = null;
  if (event.scheduleItemId) {
    const [scheduleItem] = await db
      .select({ media: mediaItems })
      .from(clubSchedule)
      .innerJoin(mediaItems, eq(clubSchedule.mediaItemId, mediaItems.id))
      .where(eq(clubSchedule.id, event.scheduleItemId));
    media = scheduleItem?.media ?? null;
  }

  const eventRsvps = await db
    .select({
      status: rsvps.status,
      user: { id: users.id, name: users.name, image: users.image },
    })
    .from(rsvps)
    .innerJoin(users, eq(rsvps.userId, users.id))
    .where(eq(rsvps.eventId, eventId));

  return c.json({ ...event, media, rsvps: eventRsvps });
});

// POST /events/:eventId/rsvp — Upsert RSVP
const rsvpSchema = z.object({
  status: z.enum(["going", "maybe", "not_going"]),
});

eventsRouter.post(
  "/events/:eventId/rsvp",
  zValidator("json", rsvpSchema),
  async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const eventId = c.req.param("eventId");
    const user = c.get("user");
    const body = c.req.valid("json");

    const [existing] = await db
      .select()
      .from(rsvps)
      .where(and(eq(rsvps.eventId, eventId), eq(rsvps.userId, user.id)));

    if (existing) {
      await db
        .update(rsvps)
        .set({ status: body.status })
        .where(and(eq(rsvps.eventId, eventId), eq(rsvps.userId, user.id)));
    } else {
      await db
        .insert(rsvps)
        .values({ eventId, userId: user.id, status: body.status });
    }

    return c.json({ status: body.status });
  }
);

export { eventsRouter };

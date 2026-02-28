import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, and } from "drizzle-orm";
import { createDb } from "../db";
import { clubs, clubMembers, users } from "../db/schema";
import { authMiddleware } from "../lib/auth-middleware";
import { nanoid } from "nanoid";

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

const clubsRouter = new Hono<Env>();
clubsRouter.use("/*", authMiddleware);

// GET / — List user's clubs
clubsRouter.get("/", async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const user = c.get("user");
  const memberships = await db
    .select({ club: clubs, role: clubMembers.role })
    .from(clubMembers)
    .innerJoin(clubs, eq(clubMembers.clubId, clubs.id))
    .where(eq(clubMembers.userId, user.id));
  return c.json(memberships);
});

// POST / — Create club
const createClubSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  mediaType: z.enum(["book", "film"]),
  recurrenceRule: z.string().optional(),
});

clubsRouter.post("/", zValidator("json", createClubSchema), async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const user = c.get("user");
  const body = c.req.valid("json");
  const inviteCode = nanoid(10);

  const [club] = await db.insert(clubs).values({
    name: body.name,
    description: body.description,
    mediaType: body.mediaType,
    inviteCode,
    createdBy: user.id,
    recurrenceRule: body.recurrenceRule,
  }).returning();

  await db.insert(clubMembers).values({
    clubId: club.id, userId: user.id, role: "admin",
  });

  return c.json(club, 201);
});

// GET /:id — Club detail with members
clubsRouter.get("/:id", async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const clubId = c.req.param("id");

  const [club] = await db.select().from(clubs).where(eq(clubs.id, clubId));
  if (!club) return c.json({ error: "Club not found" }, 404);

  const members = await db
    .select({
      user: { id: users.id, name: users.name, image: users.image },
      role: clubMembers.role,
      joinedAt: clubMembers.joinedAt,
    })
    .from(clubMembers)
    .innerJoin(users, eq(clubMembers.userId, users.id))
    .where(eq(clubMembers.clubId, clubId));

  return c.json({ ...club, members });
});

// POST /:id/invite — Regenerate invite code (admin only)
clubsRouter.post("/:id/invite", async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const clubId = c.req.param("id");
  const user = c.get("user");

  const [membership] = await db.select().from(clubMembers).where(
    and(eq(clubMembers.clubId, clubId), eq(clubMembers.userId, user.id), eq(clubMembers.role, "admin"))
  );
  if (!membership) return c.json({ error: "Forbidden" }, 403);

  const newCode = nanoid(10);
  const [updated] = await db.update(clubs).set({ inviteCode: newCode }).where(eq(clubs.id, clubId)).returning();
  return c.json({ inviteCode: updated.inviteCode });
});

// POST /join/:code — Join via invite code
clubsRouter.post("/join/:code", async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const code = c.req.param("code");
  const user = c.get("user");

  const [club] = await db.select().from(clubs).where(eq(clubs.inviteCode, code));
  if (!club) return c.json({ error: "Invalid invite code" }, 404);

  const [existing] = await db.select().from(clubMembers).where(
    and(eq(clubMembers.clubId, club.id), eq(clubMembers.userId, user.id))
  );
  if (existing) return c.json({ club, alreadyMember: true });

  await db.insert(clubMembers).values({ clubId: club.id, userId: user.id, role: "member" });
  return c.json({ club, alreadyMember: false }, 201);
});

// Public preview endpoint (no auth)
export const clubPreviewRouter = new Hono<Env>();

clubPreviewRouter.get("/join/:code", async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const code = c.req.param("code");

  const [club] = await db.select({
    id: clubs.id, name: clubs.name, description: clubs.description,
    coverImageUrl: clubs.coverImageUrl, mediaType: clubs.mediaType,
  }).from(clubs).where(eq(clubs.inviteCode, code));

  if (!club) return c.json({ error: "Invalid invite code" }, 404);

  const members = await db.select().from(clubMembers).where(eq(clubMembers.clubId, club.id));
  return c.json({ ...club, memberCount: members.length });
});

export { clubsRouter };

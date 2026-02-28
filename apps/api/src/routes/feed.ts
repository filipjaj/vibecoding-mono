import { Hono } from "hono";
import { eq, desc, inArray } from "drizzle-orm";
import { createDb } from "../db";
import { activityEvents, clubMembers, users, clubs } from "../db/schema";
import { authMiddleware } from "../lib/auth-middleware";

type Env = {
  Bindings: { DATABASE_URL: string; BETTER_AUTH_SECRET: string; BETTER_AUTH_URL: string; GOOGLE_CLIENT_ID: string; GOOGLE_CLIENT_SECRET: string };
  Variables: { user: { id: string; name: string; email: string; image: string | null } };
};

const feedRouter = new Hono<Env>();
feedRouter.use("/*", authMiddleware);

feedRouter.get("/feed", async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const user = c.get("user");

  const memberships = await db.select({ clubId: clubMembers.clubId }).from(clubMembers).where(eq(clubMembers.userId, user.id));
  const clubIds = memberships.map((m) => m.clubId);

  if (clubIds.length === 0) return c.json([]);

  const feed = await db
    .select({
      id: activityEvents.id, type: activityEvents.type, payload: activityEvents.payload, createdAt: activityEvents.createdAt,
      user: { id: users.id, name: users.name, image: users.image },
      club: { id: clubs.id, name: clubs.name },
    })
    .from(activityEvents)
    .innerJoin(users, eq(activityEvents.userId, users.id))
    .leftJoin(clubs, eq(activityEvents.clubId, clubs.id))
    .where(inArray(activityEvents.clubId, clubIds))
    .orderBy(desc(activityEvents.createdAt))
    .limit(50);

  return c.json(feed);
});

export { feedRouter };

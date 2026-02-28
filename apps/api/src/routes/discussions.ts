import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, desc } from "drizzle-orm";
import { createDb } from "../db";
import { discussionThreads, discussionComments, users } from "../db/schema";
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

const discussionsRouter = new Hono<Env>();
discussionsRouter.use("/*", authMiddleware);

// GET /clubs/:clubId/discussions
discussionsRouter.get("/clubs/:clubId/discussions", async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const clubId = c.req.param("clubId");

  const threads = await db
    .select({
      id: discussionThreads.id,
      title: discussionThreads.title,
      mediaItemId: discussionThreads.mediaItemId,
      eventId: discussionThreads.eventId,
      createdAt: discussionThreads.createdAt,
      createdBy: { id: users.id, name: users.name, image: users.image },
    })
    .from(discussionThreads)
    .innerJoin(users, eq(discussionThreads.createdBy, users.id))
    .where(eq(discussionThreads.clubId, clubId))
    .orderBy(desc(discussionThreads.createdAt));

  return c.json(threads);
});

// POST /clubs/:clubId/discussions
const createThreadSchema = z.object({
  title: z.string().min(1).max(255),
  mediaItemId: z.string().uuid().optional(),
  eventId: z.string().uuid().optional(),
});

discussionsRouter.post(
  "/clubs/:clubId/discussions",
  zValidator("json", createThreadSchema),
  async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const clubId = c.req.param("clubId");
    const user = c.get("user");
    const body = c.req.valid("json");

    const [thread] = await db
      .insert(discussionThreads)
      .values({
        clubId,
        title: body.title,
        mediaItemId: body.mediaItemId ?? null,
        eventId: body.eventId ?? null,
        createdBy: user.id,
      })
      .returning();

    return c.json(thread, 201);
  }
);

// GET /discussions/:threadId — Thread with comments
discussionsRouter.get("/discussions/:threadId", async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const threadId = c.req.param("threadId");

  const [thread] = await db
    .select()
    .from(discussionThreads)
    .where(eq(discussionThreads.id, threadId));
  if (!thread) return c.json({ error: "Not found" }, 404);

  const comments = await db
    .select({
      id: discussionComments.id,
      text: discussionComments.text,
      createdAt: discussionComments.createdAt,
      user: { id: users.id, name: users.name, image: users.image },
    })
    .from(discussionComments)
    .innerJoin(users, eq(discussionComments.userId, users.id))
    .where(eq(discussionComments.threadId, threadId))
    .orderBy(discussionComments.createdAt);

  return c.json({ ...thread, comments });
});

// POST /discussions/:threadId/comments
const addCommentSchema = z.object({ text: z.string().min(1) });

discussionsRouter.post(
  "/discussions/:threadId/comments",
  zValidator("json", addCommentSchema),
  async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const threadId = c.req.param("threadId");
    const user = c.get("user");
    const body = c.req.valid("json");

    const [comment] = await db
      .insert(discussionComments)
      .values({
        threadId,
        userId: user.id,
        text: body.text,
      })
      .returning();

    return c.json(comment, 201);
  }
);

export { discussionsRouter };

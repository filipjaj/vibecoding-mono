import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { createDb } from "../db";
import { reviews, users } from "../db/schema";
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

const reviewsRouter = new Hono<Env>();

const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  text: z.string().optional(),
  clubId: z.string().uuid().optional(),
});

reviewsRouter.post(
  "/media/:mediaId/reviews",
  authMiddleware,
  zValidator("json", createReviewSchema),
  async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const mediaItemId = c.req.param("mediaId");
    const user = c.get("user");
    const body = c.req.valid("json");

    const [review] = await db
      .insert(reviews)
      .values({
        userId: user.id,
        mediaItemId,
        clubId: body.clubId ?? null,
        rating: body.rating,
        text: body.text ?? null,
      })
      .returning();

    return c.json(review, 201);
  }
);

reviewsRouter.get("/media/:mediaId/reviews", async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const mediaItemId = c.req.param("mediaId");

  const mediaReviews = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      text: reviews.text,
      createdAt: reviews.createdAt,
      clubId: reviews.clubId,
      user: { id: users.id, name: users.name, image: users.image },
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .where(eq(reviews.mediaItemId, mediaItemId));

  return c.json(mediaReviews);
});

export { reviewsRouter };

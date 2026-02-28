import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, and } from "drizzle-orm";
import { createDb } from "../db";
import { mediaItems, reviews, users } from "../db/schema";
import { authMiddleware } from "../lib/auth-middleware";
import { searchBooks } from "../lib/external/open-library";
import { searchFilms } from "../lib/external/tmdb";

type Env = {
  Bindings: {
    DATABASE_URL: string; BETTER_AUTH_SECRET: string; BETTER_AUTH_URL: string;
    GOOGLE_CLIENT_ID: string; GOOGLE_CLIENT_SECRET: string; TMDB_API_KEY?: string;
  };
  Variables: { user: { id: string; name: string; email: string; image: string | null } };
};

const mediaRouter = new Hono<Env>();

// GET /search — Search media (public)
mediaRouter.get("/search", async (c) => {
  const query = c.req.query("q");
  const type = c.req.query("type") as "book" | "film" | undefined;
  if (!query) return c.json({ error: "Query required" }, 400);

  let results: Array<any> = [];

  if (!type || type === "book") {
    const books = await searchBooks(query);
    results = results.concat(books.map((b) => ({ ...b, mediaType: "book" as const })));
  }
  if (!type || type === "film") {
    const apiKey = c.env.TMDB_API_KEY;
    if (apiKey) {
      const films = await searchFilms(query, apiKey);
      results = results.concat(films.map((f) => ({ ...f, mediaType: "film" as const })));
    }
  }

  return c.json(results);
});

// POST / — Upsert media item from external data
const upsertMediaSchema = z.object({
  externalId: z.string(),
  mediaType: z.enum(["book", "film"]),
  title: z.string(),
  authorOrDirector: z.string().nullable().optional(),
  coverUrl: z.string().nullable().optional(),
  year: z.number().nullable().optional(),
  description: z.string().nullable().optional(),
});

mediaRouter.post("/", authMiddleware, zValidator("json", upsertMediaSchema), async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const body = c.req.valid("json");

  const [existing] = await db.select().from(mediaItems).where(
    and(eq(mediaItems.externalId, body.externalId), eq(mediaItems.mediaType, body.mediaType))
  );
  if (existing) return c.json(existing);

  const [item] = await db.insert(mediaItems).values({
    externalId: body.externalId, mediaType: body.mediaType, title: body.title,
    authorOrDirector: body.authorOrDirector ?? null, coverUrl: body.coverUrl ?? null,
    year: body.year ?? null, description: body.description ?? null,
  }).returning();

  return c.json(item, 201);
});

// GET /:id — Media detail with reviews
mediaRouter.get("/:id", async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const mediaId = c.req.param("id");

  const [item] = await db.select().from(mediaItems).where(eq(mediaItems.id, mediaId));
  if (!item) return c.json({ error: "Not found" }, 404);

  const mediaReviews = await db
    .select({
      id: reviews.id, rating: reviews.rating, text: reviews.text, createdAt: reviews.createdAt,
      user: { id: users.id, name: users.name, image: users.image },
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .where(eq(reviews.mediaItemId, mediaId));

  return c.json({ ...item, reviews: mediaReviews });
});

export { mediaRouter };

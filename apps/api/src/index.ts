import { Hono } from "hono";
import { cors } from "hono/cors";
import { createAuth } from "./lib/auth";
import { clubsRouter, clubPreviewRouter } from "./routes/clubs";
import { mediaRouter } from "./routes/media";
import { scheduleRouter } from "./routes/schedule";
import { eventsRouter } from "./routes/events";
import { reviewsRouter } from "./routes/reviews";
import { discussionsRouter } from "./routes/discussions";
import { usersRouter } from "./routes/users";
import { feedRouter } from "./routes/feed";
import { roundsRouter } from "./routes/rounds";
import { selectionRouter } from "./routes/selection";

type Bindings = {
  DATABASE_URL: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  TMDB_API_KEY?: string;
  WEB_URL?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use(
  "/api/*",
  cors({
    origin: (origin, c) => {
      const allowed = [
        "http://localhost:3000",
        c.env.WEB_URL,
      ].filter(Boolean) as string[];
      return allowed.includes(origin) ? origin : "";
    },
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  })
);

// Auth
app.on(["GET", "POST"], "/api/auth/*", (c) => {
  const auth = createAuth(c.env);
  return auth.handler(c.req.raw);
});

// Health check
app.get("/api/health", (c) => {
  return c.json({ status: "ok" });
});

// Public routes (no auth required)
app.route("/api", clubPreviewRouter);

// Protected API routes
app.route("/api/clubs", clubsRouter);
app.route("/api/clubs", scheduleRouter);
app.route("/api/media", mediaRouter);
app.route("/api", eventsRouter);
app.route("/api", reviewsRouter);
app.route("/api", discussionsRouter);
app.route("/api", usersRouter);
app.route("/api", feedRouter);
app.route("/api", roundsRouter);
app.route("/api", selectionRouter);

export default app;

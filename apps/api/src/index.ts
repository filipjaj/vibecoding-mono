import { Hono } from "hono";
import { cors } from "hono/cors";

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
    credentials: true,
  })
);

app.get("/api/health", (c) => {
  return c.json({ status: "ok" });
});

export default app;

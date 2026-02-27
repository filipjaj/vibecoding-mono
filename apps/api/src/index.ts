import { Hono } from "hono";
import { cors } from "hono/cors";

type Bindings = {
  // Add your Cloudflare bindings here (KV, D1, R2, etc.)
};

const app = new Hono<{ Bindings: Bindings }>();

app.use(
  "/api/*",
  cors({
    origin: ["http://localhost:3000"],
  })
);

app.get("/api/health", (c) => {
  return c.json({ status: "ok" });
});

export default app;

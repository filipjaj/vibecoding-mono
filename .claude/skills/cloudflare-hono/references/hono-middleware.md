# Hono Middleware

## Built-in Middleware

```typescript
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { timing } from "hono/timing";
import { secureHeaders } from "hono/secure-headers";
import { prettyJSON } from "hono/pretty-json";

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", logger());
app.use("*", secureHeaders());
app.use("*", timing());
app.use("*", prettyJSON());

app.use("/api/*", cors({
  origin: ["http://localhost:3000", "https://example.com"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));
```

## Recommended Middleware Ordering

1. `logger()` – Log all requests first
2. `timing()` – Start timing
3. `secureHeaders()` – Set security headers
4. `cors()` – Handle CORS preflight
5. Custom auth middleware – Authenticate requests
6. Route handlers – Business logic
7. Error handler (`app.onError`) – Catch all errors

## Custom Middleware

Use `createMiddleware` from `hono/factory` for type-safe middleware:

```typescript
import { createMiddleware } from "hono/factory";

type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
};

type Variables = {
  user: { id: string; email: string };
  requestId: string;
};

// Type-safe middleware with access to Bindings and Variables
const authMiddleware = createMiddleware<{
  Bindings: Bindings;
  Variables: Variables;
}>(async (c, next) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const user = await validateToken(token, c.env.JWT_SECRET);
  c.set("user", user);
  await next();
});

// Request ID middleware
const requestIdMiddleware = createMiddleware<{
  Variables: Variables;
}>(async (c, next) => {
  const id = crypto.randomUUID();
  c.set("requestId", id);
  c.header("X-Request-ID", id);
  await next();
});
```

## Route-Level Middleware

```typescript
// Apply to specific path prefix
app.use("/api/admin/*", authMiddleware);

// Apply to specific route
app.get("/api/protected", authMiddleware, (c) => {
  const user = c.get("user");
  return c.json({ user });
});

// Apply to route group
const adminRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();
adminRoutes.use("*", authMiddleware);
adminRoutes.get("/dashboard", (c) => c.json({ admin: true }));
app.route("/api/admin", adminRoutes);
```

## Setting and Getting Variables

```typescript
const app = new Hono<{
  Bindings: Bindings;
  Variables: { user: { id: string; email: string }; requestId: string };
}>();

// Set in middleware
app.use("*", async (c, next) => {
  c.set("requestId", crypto.randomUUID());
  await next();
});

// Get in route handler
app.get("/api/me", authMiddleware, (c) => {
  const user = c.get("user");       // typed as { id: string; email: string }
  const reqId = c.get("requestId"); // typed as string
  return c.json({ user, requestId: reqId });
});
```

## Conditional Middleware

```typescript
// Skip middleware for specific paths
const conditionalAuth = createMiddleware<{
  Bindings: Bindings;
  Variables: Variables;
}>(async (c, next) => {
  // Skip auth for health check and public routes
  if (c.req.path === "/api/health" || c.req.path.startsWith("/api/public/")) {
    await next();
    return;
  }

  // Apply auth for everything else
  const token = c.req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const user = await validateToken(token, c.env.JWT_SECRET);
  c.set("user", user);
  await next();
});

app.use("/api/*", conditionalAuth);
```

## Documentation

```bash
curl -H "Accept: text/markdown" https://hono.dev/docs/guides/middleware
```

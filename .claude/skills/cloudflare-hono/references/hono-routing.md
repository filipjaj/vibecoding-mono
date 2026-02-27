# Hono Routing

## Basic Routes

```typescript
import { Hono } from "hono";

type Bindings = {
  DB: D1Database;
  MY_KV: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

// HTTP methods
app.get("/api/users", (c) => c.json({ users: [] }));
app.post("/api/users", async (c) => {
  const body = await c.req.json();
  return c.json({ created: true }, 201);
});
app.put("/api/users/:id", async (c) => c.json({ updated: true }));
app.delete("/api/users/:id", (c) => c.json({ deleted: true }));
app.patch("/api/users/:id", async (c) => c.json({ patched: true }));
```

## Route Parameters

```typescript
// Named params
app.get("/api/users/:id", (c) => {
  const id = c.req.param("id");
  return c.json({ id });
});

// Multiple params
app.get("/api/users/:userId/posts/:postId", (c) => {
  const { userId, postId } = c.req.param();
  return c.json({ userId, postId });
});

// Wildcard
app.get("/api/files/*", (c) => {
  const path = c.req.path; // full path including /api/files/
  return c.text(`File path: ${path}`);
});
```

## Query Parameters

```typescript
app.get("/api/search", (c) => {
  const q = c.req.query("q");           // string | undefined
  const page = c.req.query("page");     // string | undefined
  const all = c.req.queries("tags");    // string[] | undefined
  return c.json({ q, page, tags: all });
});
```

## Route Groups

Organize large APIs by mounting sub-routers with `app.route()`:

```typescript
// src/index.ts
import { Hono } from "hono";
import { usersRoute } from "./routes/users";
import { postsRoute } from "./routes/posts";

type Bindings = {
  DB: D1Database;
  MY_KV: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

app.route("/api/users", usersRoute);
app.route("/api/posts", postsRoute);

export type AppType = typeof app;
export default app;
```

```typescript
// src/routes/users.ts
import { Hono } from "hono";

type Bindings = {
  DB: D1Database;
  MY_KV: KVNamespace;
};

export const usersRoute = new Hono<{ Bindings: Bindings }>()
  .get("/", async (c) => {
    const { results } = await c.env.DB.prepare("SELECT * FROM users").all();
    return c.json(results);
  })
  .get("/:id", async (c) => {
    const user = await c.env.DB
      .prepare("SELECT * FROM users WHERE id = ?")
      .bind(c.req.param("id"))
      .first();
    return user ? c.json(user) : c.notFound();
  })
  .post("/", async (c) => {
    const { name, email } = await c.req.json();
    const result = await c.env.DB
      .prepare("INSERT INTO users (name, email) VALUES (?, ?)")
      .bind(name, email)
      .run();
    return c.json({ id: result.meta.last_row_id }, 201);
  });
```

## File Organization

```
apps/api/src/
├── index.ts              # Main app, mounts route groups, exports AppType
├── routes/
│   ├── users.ts          # /api/users routes
│   ├── posts.ts          # /api/posts routes
│   └── admin.ts          # /api/admin routes
├── middleware/
│   ├── auth.ts           # Auth middleware
│   └── logging.ts        # Logging middleware
└── lib/
    └── errors.ts         # Shared error types
```

## Base Path

```typescript
const app = new Hono().basePath("/api/v1");

app.get("/users", (c) => c.json([]));   // Matches /api/v1/users
app.get("/posts", (c) => c.json([]));   // Matches /api/v1/posts
```

## Method Chaining (Critical for RPC)

For `hono/client` type inference to work, routes MUST be defined as a single chain:

```typescript
// CORRECT - routes chained, AppType works
export const usersRoute = new Hono<{ Bindings: Bindings }>()
  .get("/", (c) => c.json([]))
  .get("/:id", (c) => c.json({ id: c.req.param("id") }))
  .post("/", async (c) => c.json({ created: true }, 201));

// WRONG - routes NOT chained, AppType loses type info
const usersRoute = new Hono<{ Bindings: Bindings }>();
usersRoute.get("/", (c) => c.json([]));
usersRoute.post("/", async (c) => c.json({ created: true }));
```

The chaining requirement exists because TypeScript infers the return type from the chain. When you use separate statements, the type is just `Hono` without route information.

## RegExp Routes

```typescript
app.get("/api/posts/:id{[0-9]+}", (c) => {
  const id = c.req.param("id"); // Only matches numeric IDs
  return c.json({ id });
});
```

## Documentation

```bash
curl -H "Accept: text/markdown" https://hono.dev/docs/api/routing
```

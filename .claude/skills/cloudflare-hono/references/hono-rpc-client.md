# Hono RPC Client (hono/client)

## Why hono/client

End-to-end type safety between your Hono API and TanStack Start frontend — no codegen, no OpenAPI spec, no runtime overhead. The client infers request/response types directly from your route definitions.

## Server-Side Setup

**Critical:** Routes MUST be defined as a single method chain for type inference to work.

```typescript
// apps/api/src/routes/users.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

type Bindings = {
  DB: D1Database;
};

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

// CORRECT — chained routes, types flow through
export const usersRoute = new Hono<{ Bindings: Bindings }>()
  .get("/", async (c) => {
    const { results } = await c.env.DB.prepare("SELECT * FROM users").all();
    return c.json({ users: results });
  })
  .get("/:id", async (c) => {
    const user = await c.env.DB
      .prepare("SELECT * FROM users WHERE id = ?")
      .bind(c.req.param("id"))
      .first();
    return user ? c.json(user) : c.notFound();
  })
  .post("/", zValidator("json", createUserSchema), async (c) => {
    const { name, email } = c.req.valid("json");
    const result = await c.env.DB
      .prepare("INSERT INTO users (name, email) VALUES (?, ?)")
      .bind(name, email)
      .run();
    return c.json({ id: result.meta.last_row_id }, 201);
  });
```

```typescript
// apps/api/src/index.ts
import { Hono } from "hono";
import { usersRoute } from "./routes/users";
import { postsRoute } from "./routes/posts";

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>()
  .route("/api/users", usersRoute)
  .route("/api/posts", postsRoute);

// Export the type for the client
export type AppType = typeof app;
export default app;
```

## Client-Side Setup

```typescript
// apps/web/src/lib/api-client.ts
import { hc } from "hono/client";
import type { AppType } from "api/src/index";

export const client = hc<AppType>(import.meta.env.VITE_API_URL);
```

**Monorepo type imports:** Use a TypeScript path alias or workspace import so `api/src/index` resolves. In `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "api/*": ["../api/*"]
    }
  }
}
```

## Making Requests

```typescript
// GET requests
const res = await client.api.users.$get();
const data = await res.json(); // typed as { users: ... }

// GET with route params
const res = await client.api.users[":id"].$get({
  param: { id: "123" },
});
const user = await res.json();

// POST with JSON body
const res = await client.api.users.$post({
  json: { name: "Alice", email: "alice@example.com" },
});
const created = await res.json(); // typed as { id: number }

// GET with query params
const res = await client.api.users.$get({
  query: { page: "1", limit: "20" },
});
```

## Response Handling

```typescript
const res = await client.api.users.$get();

// Status check
if (!res.ok) {
  const error = await res.json();
  throw new Error(error.message);
}

const data = await res.json(); // typed response
const text = await res.text(); // raw text
```

## Headers and Auth

```typescript
// Pass headers with individual requests
const res = await client.api.users.$get(
  {},
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  },
);

// Set default headers on client creation
export const client = hc<AppType>(import.meta.env.VITE_API_URL, {
  headers: {
    Authorization: `Bearer ${getToken()}`,
  },
});

// With cookies (credentials)
export const client = hc<AppType>(import.meta.env.VITE_API_URL, {
  init: {
    credentials: "include", // send cookies cross-origin
  },
});
```

## Integration with TanStack Query

```typescript
// features/users/users.queries.ts
import { queryOptions } from "@tanstack/react-query";
import { client } from "@/lib/api-client";

export const usersQueryOptions = () =>
  queryOptions({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await client.api.users.$get();
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

export const userQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["users", id],
    queryFn: async () => {
      const res = await client.api.users[":id"].$get({
        param: { id },
      });
      if (!res.ok) throw new Error("User not found");
      return res.json();
    },
  });
```

```typescript
// features/users/hooks/use-create-user.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/api-client";

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; email: string }) => {
      const res = await client.api.users.$post({ json: data });
      if (!res.ok) throw new Error("Failed to create user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
```

## Gotchas

### Route Chaining is Required

```typescript
// WRONG — separate statements lose type info
const app = new Hono();
app.get("/api/users", handler);
app.post("/api/users", handler);
export type AppType = typeof app; // AppType has no route info!

// CORRECT — single chain preserves types
const app = new Hono()
  .get("/api/users", handler)
  .post("/api/users", handler);
export type AppType = typeof app; // AppType knows all routes
```

### Route mounting must also be chained

```typescript
// WRONG
const app = new Hono();
app.route("/api/users", usersRoute);
app.route("/api/posts", postsRoute);

// CORRECT
const app = new Hono()
  .route("/api/users", usersRoute)
  .route("/api/posts", postsRoute);
```

### URL path must match deployment

The `hc<AppType>(baseUrl)` base URL must point to where the Worker is actually deployed. In development with Vite proxy, this is the Vite dev server URL (the proxy forwards `/api/*` to the Worker).

## Documentation

```bash
curl -H "Accept: text/markdown" https://hono.dev/docs/guides/rpc
```

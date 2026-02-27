---
name: cloudflare-hono
description: Build APIs with Hono on Cloudflare Workers. Use when creating routes, middleware, bindings (KV, D1, R2, Durable Objects, Queues, Workflows, Hyperdrive, AI), auth patterns (Better Auth, JWT), or deploying Workers. Triggers on requests like "create an API endpoint", "add a worker", "set up KV", "configure D1", "add auth to the API", "deploy the worker", or any Cloudflare Workers/Hono development task. Stack includes Hono v4, Wrangler v4, Zod, @hono/zod-validator, hono/client (RPC), Better Auth, @neondatabase/serverless, and @cloudflare/vitest-pool-workers.
---

# Cloudflare Workers + Hono Development

## Core Principles

1. **Type-safe bindings** – Define all Cloudflare bindings in a shared `Bindings` type
2. **Route groups** – Organize routes with `app.route()` and separate files per domain
3. **Middleware-first** – Use middleware for cross-cutting concerns (auth, validation, logging)
4. **Edge-aware** – Respect Workers runtime constraints (CPU time, memory, subrequests)
5. **RPC client** – Export `AppType` for end-to-end type safety with `hono/client`

## Stack Overview

| Concern        | Tool                                    |
| -------------- | --------------------------------------- |
| Framework      | Hono v4                                 |
| Runtime        | Cloudflare Workers                      |
| Validation     | Zod + @hono/zod-validator               |
| RPC Client     | hono/client                             |
| Auth           | Better Auth / JWT validation            |
| Database       | D1, Neon (via Hyperdrive or serverless) |
| Storage        | KV (key-value), R2 (objects)            |
| State          | Durable Objects                         |
| Background     | Queues, Workflows                       |
| AI             | Workers AI (@cf/ models)                |
| Testing        | vitest + @cloudflare/vitest-pool-workers|
| Deploy         | Wrangler v4                             |

## Quick Patterns

### Typed Hono App with Bindings

```typescript
import { Hono } from "hono";
import { cors } from "hono/cors";

type Bindings = {
  DB: D1Database;
  MY_KV: KVNamespace;
  BUCKET: R2Bucket;
  MY_QUEUE: Queue;
  HYPERDRIVE: Hyperdrive;
  AI: Ai;
  JWT_SECRET: string;
};

type Variables = {
  user: { id: string; email: string };
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();
```

### Route Group Pattern

```typescript
// src/index.ts
import { Hono } from "hono";
import { usersRoute } from "./routes/users";
import { postsRoute } from "./routes/posts";

const app = new Hono<{ Bindings: Bindings }>();
app.route("/api/users", usersRoute);
app.route("/api/posts", postsRoute);

export type AppType = typeof app;
export default app;

// src/routes/users.ts
import { Hono } from "hono";

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
  });
```

### Validated Endpoint

```typescript
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

app.post("/api/users", zValidator("json", createUserSchema), async (c) => {
  const { name, email } = c.req.valid("json");
  const result = await c.env.DB
    .prepare("INSERT INTO users (name, email) VALUES (?, ?)")
    .bind(name, email)
    .run();
  return c.json({ id: result.meta.last_row_id }, 201);
});
```

### Type-Safe Frontend Client (hono/client)

```typescript
// apps/web/src/lib/api-client.ts
import { hc } from "hono/client";
import type { AppType } from "api/src/index";

const client = hc<AppType>(import.meta.env.VITE_API_URL);

// Fully typed - autocomplete for routes + response types
const res = await client.api.users.$get();
const users = await res.json();

const res2 = await client.api.users.$post({
  json: { name: "Alice", email: "alice@example.com" },
});
```

## Documentation

Reference Cloudflare and Hono docs when needed:

```bash
# Hono docs
curl -H "Accept: text/markdown" https://hono.dev/docs/getting-started/cloudflare-workers

# Cloudflare Workers docs index
curl https://developers.cloudflare.com/llms.txt

# Fetch specific Cloudflare doc
curl -H "Accept: text/markdown" https://developers.cloudflare.com/workers/
```

## Overview of Resources

Reference the appropriate resource file based on the task:

### Hono Framework

| Area             | Resource                            | When to Use                                       |
| ---------------- | ----------------------------------- | ------------------------------------------------- |
| Routing          | `references/hono-routing.md`        | Route groups, params, nesting, base paths          |
| Middleware       | `references/hono-middleware.md`     | CORS, logging, timing, custom middleware           |
| Validation       | `references/hono-validation.md`     | Zod schemas, request validation, error responses   |
| RPC Client       | `references/hono-rpc-client.md`     | Type-safe API calls from frontend (hono/client)    |
| Error Handling   | `references/hono-error-handling.md` | HTTPException, global error handler, not found     |

### Cloudflare Bindings

| Area             | Resource                            | When to Use                                       |
| ---------------- | ----------------------------------- | ------------------------------------------------- |
| KV               | `references/cf-kv.md`              | Key-value storage, caching, TTL, metadata          |
| D1               | `references/cf-d1.md`              | SQL database, migrations, prepared statements      |
| R2               | `references/cf-r2.md`              | Object storage, uploads, presigned URLs            |
| Durable Objects  | `references/cf-durable-objects.md`  | Stateful edge compute, WebSockets, counters        |
| Queues           | `references/cf-queues.md`          | Producer/consumer, batch processing, retries       |
| Workflows        | `references/cf-workflows.md`       | Multi-step durable execution, sleep, events        |
| Workers AI       | `references/cf-ai.md`              | Text gen, embeddings, image models (basic ref)     |
| Hyperdrive+Neon  | `references/cf-hyperdrive-neon.md` | Neon DB connection pooling from Workers             |

### Infrastructure & Testing

| Area             | Resource                              | When to Use                                     |
| ---------------- | ------------------------------------- | ----------------------------------------------- |
| Wrangler Config  | `references/wrangler-config.md`       | wrangler.jsonc, envs, secrets, deploy            |
| Auth Patterns    | `references/auth-patterns.md`         | Better Auth on Worker, JWT validation, Neon Auth |
| Testing          | `references/testing.md`               | vitest, pool-workers, binding mocks              |
| Runtime Limits   | `references/runtime-constraints.md`   | CPU, memory, subrequests, cold starts            |

### Cross-Skill References

- **Database (Neon):** See @neon-postgres skill for Neon-specific patterns (branching, CLI, serverless driver details)
- **Frontend (TanStack Start):** See @tanstack-start skill for route/component patterns that consume the API
- **Design:** See @design-profiles skill for UI components that display API data

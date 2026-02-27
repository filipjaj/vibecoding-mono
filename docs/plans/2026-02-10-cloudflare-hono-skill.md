# Cloudflare Workers + Hono Skill Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a comprehensive Claude Code skill for building Cloudflare Workers APIs with Hono, covering bindings (KV, D1, R2, Durable Objects, Queues, Workflows, Hyperdrive, AI), authentication (Better Auth + JWT), Neon DB integration, testing, and Wrangler configuration.

**Architecture:** A single skill at `.claude/skills/cloudflare-hono/` following the existing skill pattern (SKILL.md + references/ directory). The SKILL.md contains a concise overview with quick patterns and a resource table pointing to 17 reference files. Each reference file is a self-contained guide for one topic with embedded code examples and curl fallbacks to official docs.

**Tech Stack:** Hono v4, Cloudflare Workers, Wrangler v4, Zod, @hono/zod-validator, hono/client (RPC), Better Auth, @neondatabase/serverless, Hyperdrive, @cloudflare/vitest-pool-workers

---

## File Structure Overview

```
.claude/skills/cloudflare-hono/
├── SKILL.md                              # Main entry point
└── references/
    ├── hono-routing.md                   # Route groups, params, nesting
    ├── hono-middleware.md                # Built-in + custom middleware
    ├── hono-validation.md               # Zod validation patterns
    ├── hono-rpc-client.md               # hono/client type-safe API calls
    ├── hono-error-handling.md           # HTTPException, error middleware
    ├── cf-kv.md                          # KV namespace patterns
    ├── cf-d1.md                          # D1 database patterns
    ├── cf-r2.md                          # R2 object storage patterns
    ├── cf-durable-objects.md            # Durable Objects patterns
    ├── cf-queues.md                      # Queue producer/consumer
    ├── cf-workflows.md                  # Workflow patterns
    ├── cf-ai.md                          # Workers AI basic reference
    ├── cf-hyperdrive-neon.md            # Hyperdrive + Neon connection
    ├── wrangler-config.md               # Wrangler v4 comprehensive config
    ├── auth-patterns.md                 # Better Auth + JWT validation
    ├── testing.md                        # vitest + pool-workers
    └── runtime-constraints.md           # CPU, memory, subrequest limits
```

---

### Task 1: Create Skill Directory and SKILL.md

**Files:**
- Create: `.claude/skills/cloudflare-hono/SKILL.md`

**Step 1: Create the directory structure**

Run: `mkdir -p .claude/skills/cloudflare-hono/references`

**Step 2: Write SKILL.md**

Create `.claude/skills/cloudflare-hono/SKILL.md` with this content:

```markdown
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
```

**Step 3: Commit**

```bash
git add .claude/skills/cloudflare-hono/SKILL.md
git commit -m "feat: add cloudflare-hono skill with SKILL.md entry point"
```

---

### Task 2: Create Hono Routing Reference

**Files:**
- Create: `.claude/skills/cloudflare-hono/references/hono-routing.md`

**Step 1: Write the reference file**

Create `.claude/skills/cloudflare-hono/references/hono-routing.md` covering:

- **Basic routes** – GET, POST, PUT, DELETE, PATCH with `c.req.param()`, `c.req.query()`
- **Route parameters** – Named params (`:id`), optional params, wildcards
- **Route groups** – `app.route("/prefix", subRouter)` pattern for modular APIs
- **File organization** – One file per domain (`routes/users.ts`, `routes/posts.ts`)
- **Base path** – `new Hono().basePath("/api/v1")`
- **Method chaining** – Chaining `.get().post().put()` for typed route exports
- **Type inference** – Why chaining matters for `hono/client` type inference (the router must be a single chain for AppType to work)
- **RegExp routes** – Pattern matching routes

Include complete code examples for each pattern. Show the `Bindings` generic threaded through sub-routers.

**Docs reference:**
```bash
curl -H "Accept: text/markdown" https://hono.dev/docs/api/routing
```

**Step 2: Commit**

```bash
git add .claude/skills/cloudflare-hono/references/hono-routing.md
git commit -m "docs: add hono routing reference"
```

---

### Task 3: Create Hono Middleware Reference

**Files:**
- Create: `.claude/skills/cloudflare-hono/references/hono-middleware.md`

**Step 1: Write the reference file**

Create `.claude/skills/cloudflare-hono/references/hono-middleware.md` covering:

- **Built-in middleware** – `cors()`, `logger()`, `timing()`, `secureHeaders()`, `prettyJSON()`, `compress()`
- **Middleware ordering** – CORS before auth before route handlers
- **Custom middleware** – `createMiddleware<{ Bindings: Bindings }>()` pattern
- **Route-level middleware** – Applying middleware to specific routes/groups
- **Setting variables** – `c.set("key", value)` and `c.get("key")` with `Variables` type
- **Conditional middleware** – Skip middleware for certain paths
- **Composed middleware** – Combining multiple middleware into one

Each section must include a complete TypeScript code example showing usage with the Bindings type from this project.

**Docs reference:**
```bash
curl -H "Accept: text/markdown" https://hono.dev/docs/guides/middleware
```

**Step 2: Commit**

```bash
git add .claude/skills/cloudflare-hono/references/hono-middleware.md
git commit -m "docs: add hono middleware reference"
```

---

### Task 4: Create Hono Validation Reference

**Files:**
- Create: `.claude/skills/cloudflare-hono/references/hono-validation.md`

**Step 1: Write the reference file**

Create `.claude/skills/cloudflare-hono/references/hono-validation.md` covering:

- **@hono/zod-validator setup** – Installation, import
- **JSON body validation** – `zValidator("json", schema)`
- **Query parameter validation** – `zValidator("query", schema)`
- **URL parameter validation** – `zValidator("param", schema)`
- **Header validation** – `zValidator("header", schema)`
- **Form data validation** – `zValidator("form", schema)`
- **Custom error responses** – Third argument hook for custom error formatting
- **Reusable schemas** – Shared Zod schemas across routes
- **Schema composition** – `z.object({}).pick()`, `.extend()`, `.omit()` for CRUD operations
- **Type inference** – Using `z.infer<typeof schema>` for shared types

Include complete examples showing validation with error handling in context of Hono routes.

**Step 2: Commit**

```bash
git add .claude/skills/cloudflare-hono/references/hono-validation.md
git commit -m "docs: add hono validation reference"
```

---

### Task 5: Create Hono RPC Client Reference

**Files:**
- Create: `.claude/skills/cloudflare-hono/references/hono-rpc-client.md`

**Step 1: Write the reference file**

Create `.claude/skills/cloudflare-hono/references/hono-rpc-client.md` covering:

- **Why hono/client** – End-to-end type safety without codegen
- **Server-side setup** – Exporting `AppType` (critical: must chain routes for type inference)
- **Client-side setup** – `hc<AppType>(baseUrl)` in the TanStack Start frontend
- **Making requests** – `client.api.users.$get()`, `client.api.users.$post({ json: {...} })`
- **Response handling** – `.json()` returns typed data, `.text()`, status checks
- **Headers and auth** – Passing authorization headers, cookies
- **Integration with TanStack Query** – Using hc client inside query functions
- **URL construction** – `client.api.users[":id"].$get({ param: { id: "123" } })`
- **Gotchas** – Route chaining requirement, path separator rules, monorepo type imports

Show the full integration: API definition → AppType export → client usage in TanStack Start.

**Step 2: Commit**

```bash
git add .claude/skills/cloudflare-hono/references/hono-rpc-client.md
git commit -m "docs: add hono RPC client reference"
```

---

### Task 6: Create Hono Error Handling Reference

**Files:**
- Create: `.claude/skills/cloudflare-hono/references/hono-error-handling.md`

**Step 1: Write the reference file**

Create `.claude/skills/cloudflare-hono/references/hono-error-handling.md` covering:

- **HTTPException** – Throwing typed HTTP errors with message and status
- **Global error handler** – `app.onError((err, c) => {...})` pattern
- **Not found handler** – `app.notFound((c) => {...})` pattern
- **Error middleware** – Catching errors in middleware chain
- **Structured error responses** – Consistent `{ error: string, details?: object }` format
- **Zod validation errors** – Formatting ZodError into user-friendly responses
- **Production vs development** – Stack traces in dev, clean messages in prod
- **Error logging** – Using `c.executionCtx.waitUntil()` for async error reporting

**Step 2: Commit**

```bash
git add .claude/skills/cloudflare-hono/references/hono-error-handling.md
git commit -m "docs: add hono error handling reference"
```

---

### Task 7: Create KV Reference

**Files:**
- Create: `.claude/skills/cloudflare-hono/references/cf-kv.md`

**Step 1: Write the reference file**

Create `.claude/skills/cloudflare-hono/references/cf-kv.md` covering:

- **Binding type** – `KVNamespace` in Bindings type
- **Wrangler config** – `kv_namespaces` in wrangler.jsonc
- **CRUD operations** – `put()`, `get()`, `delete()`, `list()`
- **Value types** – `get("key")` (string), `get("key", "json")`, `get("key", "stream")`, `get("key", "arrayBuffer")`
- **TTL** – `put("key", "value", { expirationTtl: 3600 })`
- **Metadata** – `put()` with metadata, `getWithMetadata()`
- **List with prefix** – `list({ prefix: "user:" })` for namespaced keys
- **Caching patterns** – Using KV as an edge cache with TTL
- **Gotchas** – Eventual consistency (writes propagate globally in ~60s), 25MB value limit, 512B key limit

**Step 2: Commit**

```bash
git add .claude/skills/cloudflare-hono/references/cf-kv.md
git commit -m "docs: add KV namespace reference"
```

---

### Task 8: Create D1 Reference

**Files:**
- Create: `.claude/skills/cloudflare-hono/references/cf-d1.md`

**Step 1: Write the reference file**

Create `.claude/skills/cloudflare-hono/references/cf-d1.md` covering:

- **Binding type** – `D1Database` in Bindings type
- **Wrangler config** – `d1_databases` in wrangler.jsonc
- **Creating a D1 database** – `wrangler d1 create my-database`
- **Prepared statements** – `.prepare().bind().first()`, `.all()`, `.run()`, `.raw()`
- **Batch operations** – `db.batch([...])` for multiple queries in one roundtrip
- **Migrations** – `wrangler d1 migrations create`, `wrangler d1 migrations apply`
- **Migration file structure** – SQL files in `migrations/` directory
- **Query patterns** – SELECT with pagination, INSERT returning ID, UPDATE with changes count
- **Transactions** – Using `db.batch()` as implicit transaction
- **Gotchas** – 1MB row limit, 10MB response size, no ALTER TABLE in some cases, SQLite syntax (not Postgres)

**Step 2: Commit**

```bash
git add .claude/skills/cloudflare-hono/references/cf-d1.md
git commit -m "docs: add D1 database reference"
```

---

### Task 9: Create R2 Reference

**Files:**
- Create: `.claude/skills/cloudflare-hono/references/cf-r2.md`

**Step 1: Write the reference file**

Create `.claude/skills/cloudflare-hono/references/cf-r2.md` covering:

- **Binding type** – `R2Bucket` in Bindings type
- **Wrangler config** – `r2_buckets` in wrangler.jsonc
- **CRUD operations** – `put()`, `get()`, `head()`, `delete()`, `list()`
- **Upload patterns** – Uploading from request body, multipart, with metadata
- **Download patterns** – Streaming response with `object.body` (ReadableStream)
- **HTTP metadata** – `contentType`, `cacheControl`, `contentDisposition`
- **Custom metadata** – Key-value pairs attached to objects
- **Presigned URLs** – Generating time-limited download/upload URLs
- **List with prefix** – `list({ prefix: "images/" })` for directory-like listing
- **Content types** – Setting and reading MIME types
- **Gotchas** – 5GB max object size (single put), unlimited with multipart, no rename (copy+delete)

**Step 2: Commit**

```bash
git add .claude/skills/cloudflare-hono/references/cf-r2.md
git commit -m "docs: add R2 object storage reference"
```

---

### Task 10: Create Durable Objects Reference

**Files:**
- Create: `.claude/skills/cloudflare-hono/references/cf-durable-objects.md`

**Step 1: Write the reference file**

Create `.claude/skills/cloudflare-hono/references/cf-durable-objects.md` covering:

- **Binding type** – `DurableObjectNamespace` in Bindings type
- **Wrangler config** – `durable_objects.bindings` in wrangler.jsonc
- **DO class** – Extending `DurableObject` base class (or implementing `fetch()`)
- **ID creation** – `idFromName()` for deterministic IDs, `newUniqueId()` for random
- **Stub usage** – `get(id)` then `stub.fetch()` to communicate with DO
- **Storage API** – `this.state.storage.get()`, `.put()`, `.delete()`, `.list()`
- **Alarm API** – `this.state.storage.setAlarm()` for scheduled work
- **WebSocket support** – Using DO as WebSocket server for real-time features
- **Hibernatable WebSockets** – Reducing costs with `acceptWebSocket()` API
- **Use cases** – Rate limiters, counters, collaborative editing, game rooms
- **Gotchas** – Single-threaded per ID, global uniqueness, billing per request + duration

**Step 2: Commit**

```bash
git add .claude/skills/cloudflare-hono/references/cf-durable-objects.md
git commit -m "docs: add Durable Objects reference"
```

---

### Task 11: Create Queues Reference

**Files:**
- Create: `.claude/skills/cloudflare-hono/references/cf-queues.md`

**Step 1: Write the reference file**

Create `.claude/skills/cloudflare-hono/references/cf-queues.md` covering:

- **Binding type** – `Queue` in Bindings type
- **Wrangler config** – `queues.producers` and `queues.consumers` in wrangler.jsonc
- **Creating a queue** – `wrangler queues create my-queue`
- **Producer** – `c.env.MY_QUEUE.send({ type: "email", to: "user@example.com" })`
- **Batch send** – `c.env.MY_QUEUE.sendBatch([...])`
- **Consumer** – Exporting `queue()` handler alongside the Hono app
- **Batch processing** – `batch.messages` iteration, `message.ack()`, `message.retry()`
- **Combined export** – How to export both Hono `fetch` handler and `queue` consumer from same Worker
- **Dead letter queues** – Configuring DLQ for failed messages
- **Retry behavior** – Automatic retries, backoff, max retries
- **Content types** – JSON, text, bytes message bodies
- **Gotchas** – Max 100KB per message, max 100 messages per batch send, at-least-once delivery

**Step 2: Commit**

```bash
git add .claude/skills/cloudflare-hono/references/cf-queues.md
git commit -m "docs: add Queues reference"
```

---

### Task 12: Create Workflows Reference

**Files:**
- Create: `.claude/skills/cloudflare-hono/references/cf-workflows.md`

**Step 1: Write the reference file**

Create `.claude/skills/cloudflare-hono/references/cf-workflows.md` covering:

- **Import** – `import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from "cloudflare:workers"`
- **Wrangler config** – `workflows` binding in wrangler.jsonc
- **Workflow class** – Extending `WorkflowEntrypoint` with `run(event, step)` method
- **Steps** – `step.do("name", async () => {...})` for durable execution steps
- **Sleep** – `step.sleep("name", "1 hour")` for delays between steps
- **Wait for event** – `step.waitForEvent("name", { timeout: "24 hours" })` for external signals
- **Triggering** – `c.env.MY_WORKFLOW.create({ params: {...} })` from Hono route
- **Getting status** – `c.env.MY_WORKFLOW.get(instanceId).status()`
- **Sending events** – `instance.sendEvent({ type: "approved" })`
- **Combined export** – Exporting workflow class alongside Hono app
- **Use cases** – Order processing, approval flows, scheduled tasks, data pipelines
- **Gotchas** – Steps must be idempotent (may re-execute), 1MB step output limit, beta limitations

**Step 2: Commit**

```bash
git add .claude/skills/cloudflare-hono/references/cf-workflows.md
git commit -m "docs: add Workflows reference"
```

---

### Task 13: Create Workers AI Reference

**Files:**
- Create: `.claude/skills/cloudflare-hono/references/cf-ai.md`

**Step 1: Write the reference file**

Create `.claude/skills/cloudflare-hono/references/cf-ai.md` as a **basic reference** covering:

- **Binding type** – `Ai` in Bindings type
- **Wrangler config** – `ai.binding` in wrangler.jsonc
- **Text generation** – `c.env.AI.run("@cf/meta/llama-2-7b-chat-int8", { prompt })`
- **Text embeddings** – `c.env.AI.run("@cf/baai/bge-base-en-v1.5", { text })`
- **Image classification** – `c.env.AI.run("@cf/microsoft/resnet-50", { image })`
- **Streaming** – Using `stream: true` option for SSE responses
- **Popular models** – Quick reference table of commonly used @cf/ models
- **Gotchas** – Model loading cold starts, token limits per model, pricing

Keep this concise (basic reference, not comprehensive). Point to Cloudflare AI docs for full model catalog.

**Docs reference:**
```bash
curl -H "Accept: text/markdown" https://developers.cloudflare.com/workers-ai/
```

**Step 2: Commit**

```bash
git add .claude/skills/cloudflare-hono/references/cf-ai.md
git commit -m "docs: add Workers AI basic reference"
```

---

### Task 14: Create Hyperdrive + Neon Reference

**Files:**
- Create: `.claude/skills/cloudflare-hono/references/cf-hyperdrive-neon.md`

**Step 1: Write the reference file**

Create `.claude/skills/cloudflare-hono/references/cf-hyperdrive-neon.md` covering:

- **Two connection approaches** – Decision tree: Hyperdrive (high traffic, connection pooling) vs @neondatabase/serverless (simpler, direct)
- **Hyperdrive setup** – `wrangler hyperdrive create`, binding config, `c.env.HYPERDRIVE.connectionString`
- **Hyperdrive + postgres.js** – Using `postgres(c.env.HYPERDRIVE.connectionString)` with proper connection cleanup
- **Hyperdrive + Drizzle** – Using `drizzle(client, { schema })` with Hyperdrive
- **@neondatabase/serverless setup** – `neon(c.env.DATABASE_URL)` for direct HTTP queries
- **@neondatabase/serverless + Drizzle** – Using `drizzle-orm/neon-http` adapter
- **Connection lifecycle** – Always close connections in Workers (no persistent connections)
- **Transaction patterns** – Using batch/transaction with both approaches
- **Environment setup** – Secrets for DATABASE_URL, Hyperdrive ID
- **Cross-reference** – Point to @neon-postgres skill for: branching, CLI, migrations, Neon Auth details
- **Gotchas** – Workers CPU time applies to queries, use indexes, close connections, Hyperdrive caching behavior

**Step 2: Commit**

```bash
git add .claude/skills/cloudflare-hono/references/cf-hyperdrive-neon.md
git commit -m "docs: add Hyperdrive + Neon integration reference"
```

---

### Task 15: Create Wrangler Configuration Reference

**Files:**
- Create: `.claude/skills/cloudflare-hono/references/wrangler-config.md`

**Step 1: Write the reference file**

Create `.claude/skills/cloudflare-hono/references/wrangler-config.md` covering:

- **File format** – `wrangler.jsonc` with `$schema` for autocomplete
- **Basic config** – `name`, `main`, `compatibility_date`, `compatibility_flags`
- **All binding configs** – Complete wrangler.jsonc examples for each binding type (KV, D1, R2, DO, Queues, Workflows, Hyperdrive, AI, Vectorize, Service Bindings, Analytics Engine)
- **Environment variables** – `vars` for non-sensitive, `wrangler secret put` for secrets
- **Local dev secrets** – `.dev.vars` file (must be gitignored)
- **Environments** – `env.staging` and `env.production` overrides
- **Deploy commands** – `wrangler deploy`, `wrangler deploy --env staging`, `--dry-run`
- **Routes** – `routes` array for custom domain routing
- **Cron triggers** – `triggers.crons` for scheduled workers
- **Observability** – `observability.enabled` for logging/tracing
- **Assets** – `assets.directory` for static file serving
- **Limits** – `limits.cpu_ms` for CPU time configuration
- **Complete example** – Full wrangler.jsonc with all bindings configured

**Step 2: Commit**

```bash
git add .claude/skills/cloudflare-hono/references/wrangler-config.md
git commit -m "docs: add comprehensive Wrangler configuration reference"
```

---

### Task 16: Create Auth Patterns Reference

**Files:**
- Create: `.claude/skills/cloudflare-hono/references/auth-patterns.md`

**Step 1: Write the reference file**

Create `.claude/skills/cloudflare-hono/references/auth-patterns.md` covering:

**Pattern 1: Better Auth Running ON the Worker**
- Setup with D1Adapter – `betterAuth({ database: D1Adapter(env.DB) })`
- Mounting auth routes – `app.on(["GET", "POST"], "/api/auth/*", handler)`
- Email/password + social providers (Google, GitHub)
- Session configuration
- Auth middleware – `createMiddleware()` that calls `auth.api.getSession()`
- Protected routes using middleware
- Client setup in TanStack Start frontend – `createAuthClient({ baseURL })`

**Pattern 2: JWT Validation Only (Auth runs elsewhere)**
- Using `hono/jwt` middleware – `jwt({ secret: (c) => c.env.JWT_SECRET })`
- Extracting user from JWT payload – `c.get("jwtPayload")`
- Cookie-based JWT (Better Auth session cookie)
- Bearer token JWT (API tokens)
- Manual JWT verification with `verify()` from `hono/jwt`
- JWKS validation – Fetching and caching public keys from Neon Auth or external provider

**Decision guide:**
- Better Auth on Worker → Full auth server on the edge, use when Worker IS your auth backend
- JWT validation → Auth lives on TanStack Start server or Neon Auth, Worker just validates tokens

**Step 2: Commit**

```bash
git add .claude/skills/cloudflare-hono/references/auth-patterns.md
git commit -m "docs: add auth patterns reference (Better Auth + JWT)"
```

---

### Task 17: Create Testing Reference

**Files:**
- Create: `.claude/skills/cloudflare-hono/references/testing.md`

**Step 1: Write the reference file**

Create `.claude/skills/cloudflare-hono/references/testing.md` covering:

- **Setup** – Installing `vitest` + `@cloudflare/vitest-pool-workers`
- **vitest.config.ts** – `defineWorkersConfig()` with wrangler path and miniflare options
- **Basic Hono test** – `app.request("/api/health")` pattern (no bindings needed)
- **Testing with bindings** – `app.request("/path", {}, env)` where env comes from `cloudflare:test`
- **Setting up test data** – Pre-populating KV, D1, R2 in `beforeEach`
- **Testing D1** – Creating tables and seeding data in tests
- **Testing KV** – Setting/getting values in tests
- **Testing R2** – Uploading test files
- **Testing Durable Objects** – Getting stubs and calling fetch
- **Execution context** – `createExecutionContext()`, `waitOnExecutionContext()` for `waitUntil()` testing
- **Package.json scripts** – `"test": "vitest"`, `"test:run": "vitest run"`
- **Gotchas** – Pool workers runs tests inside the Workers runtime, some Node APIs unavailable, use `nodejs_compat` flag

**Step 2: Commit**

```bash
git add .claude/skills/cloudflare-hono/references/testing.md
git commit -m "docs: add testing reference (vitest + pool-workers)"
```

---

### Task 18: Create Runtime Constraints Reference

**Files:**
- Create: `.claude/skills/cloudflare-hono/references/runtime-constraints.md`

**Step 1: Write the reference file**

Create `.claude/skills/cloudflare-hono/references/runtime-constraints.md` covering:

- **CPU time** – 50ms (Free), configurable up to 5s (Paid) via `limits.cpu_ms`. CPU time ≠ wall clock time. External API calls and async I/O do NOT count toward CPU time.
- **Memory** – 128MB per request. Workers are stateless; memory clears after each request. Use DO for persistent state.
- **Subrequests** – 50 (Free), 1000 (Paid). Each `fetch()` counts. Service bindings do NOT count. Redirects count as additional subrequests.
- **Script size** – 10MB after gzip compression
- **Request/response body** – 100MB request body, unlimited response (use streaming for large)
- **WebSocket messages** – 1MB per message
- **Background tasks** – `c.executionCtx.waitUntil(promise)` extends CPU time to 30s for async work after response
- **Cold starts** – Minimal on Workers (unlike Lambda), but AI model loading can be slow
- **No filesystem** – Use KV or R2 for storage, no `fs` module
- **Web Crypto API** – Use `crypto.subtle` instead of Node.js crypto
- **Concurrency** – Multiple requests handled concurrently, no shared mutable state between requests
- **Practical tips** – Use streaming for large payloads, batch DB queries, use service bindings between workers, use `waitUntil()` for logging/analytics

**Step 2: Commit**

```bash
git add .claude/skills/cloudflare-hono/references/runtime-constraints.md
git commit -m "docs: add runtime constraints reference"
```

---

### Task 19: Final Review and Verify

**Step 1: Verify all files exist**

Run: `find .claude/skills/cloudflare-hono -type f | sort`

Expected output:
```
.claude/skills/cloudflare-hono/SKILL.md
.claude/skills/cloudflare-hono/references/auth-patterns.md
.claude/skills/cloudflare-hono/references/cf-ai.md
.claude/skills/cloudflare-hono/references/cf-d1.md
.claude/skills/cloudflare-hono/references/cf-durable-objects.md
.claude/skills/cloudflare-hono/references/cf-hyperdrive-neon.md
.claude/skills/cloudflare-hono/references/cf-kv.md
.claude/skills/cloudflare-hono/references/cf-queues.md
.claude/skills/cloudflare-hono/references/cf-r2.md
.claude/skills/cloudflare-hono/references/cf-workflows.md
.claude/skills/cloudflare-hono/references/hono-error-handling.md
.claude/skills/cloudflare-hono/references/hono-middleware.md
.claude/skills/cloudflare-hono/references/hono-routing.md
.claude/skills/cloudflare-hono/references/hono-rpc-client.md
.claude/skills/cloudflare-hono/references/hono-validation.md
.claude/skills/cloudflare-hono/references/runtime-constraints.md
.claude/skills/cloudflare-hono/references/testing.md
.claude/skills/cloudflare-hono/references/wrangler-config.md
```

**Step 2: Verify SKILL.md resource table links match actual files**

Read SKILL.md and confirm every `references/` path in the resource tables corresponds to an existing file.

**Step 3: Final commit (if any fixes needed)**

```bash
git add .claude/skills/cloudflare-hono/
git commit -m "docs: complete cloudflare-hono skill with all references"
```

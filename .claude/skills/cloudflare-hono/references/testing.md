# Testing (Vitest + Pool Workers)

## Setup

```bash
npm install -D vitest @cloudflare/vitest-pool-workers
```

## Vitest Configuration

```typescript
// vitest.config.ts
import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: {
          configPath: "./wrangler.jsonc",
        },
        miniflare: {
          kvNamespaces: ["MY_KV"],
          d1Databases: ["DB"],
          r2Buckets: ["BUCKET"],
        },
      },
    },
  },
});
```

## Package Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

## Basic Hono Test

Test routes without bindings using `app.request()`:

```typescript
// src/index.test.ts
import { describe, it, expect } from "vitest";
import app from "./index";

describe("Health check", () => {
  it("returns ok", async () => {
    const res = await app.request("/api/health");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });
});
```

## Testing with Bindings

Use `env` from `cloudflare:test` for binding access:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { env } from "cloudflare:test";
import app from "./index";

describe("Users API", () => {
  beforeEach(async () => {
    await env.DB.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL
      )
    `);
    await env.DB.exec("DELETE FROM users");
    await env.DB
      .prepare("INSERT INTO users (name, email) VALUES (?, ?)")
      .bind("Test User", "test@example.com")
      .run();
  });

  it("lists users", async () => {
    const res = await app.request("/api/users", {}, env);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.users).toHaveLength(1);
    expect(data.users[0].name).toBe("Test User");
  });

  it("creates a user", async () => {
    const res = await app.request(
      "/api/users",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New User", email: "new@example.com" }),
      },
      env,
    );

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.id).toBeDefined();
  });

  it("returns 404 for missing user", async () => {
    const res = await app.request("/api/users/999", {}, env);
    expect(res.status).toBe(404);
  });
});
```

## Testing KV

```typescript
import { env } from "cloudflare:test";

describe("KV operations", () => {
  beforeEach(async () => {
    await env.MY_KV.put("user:1", JSON.stringify({ name: "Alice" }));
    await env.MY_KV.put("user:2", JSON.stringify({ name: "Bob" }));
  });

  it("reads from KV cache", async () => {
    const res = await app.request("/api/cache/user:1", {}, env);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.name).toBe("Alice");
  });
});
```

## Testing R2

```typescript
import { env } from "cloudflare:test";

describe("File uploads", () => {
  beforeEach(async () => {
    await env.BUCKET.put("test/file.txt", "hello world", {
      httpMetadata: { contentType: "text/plain" },
    });
  });

  it("downloads a file", async () => {
    const res = await app.request("/api/files/test/file.txt", {}, env);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("hello world");
  });
});
```

## Testing with Auth Headers

```typescript
describe("Protected routes", () => {
  it("rejects without auth", async () => {
    const res = await app.request("/api/protected/data", {}, env);
    expect(res.status).toBe(401);
  });

  it("accepts with valid token", async () => {
    const token = await createTestJwt({ sub: "user-1", email: "test@example.com" });

    const res = await app.request(
      "/api/protected/data",
      {
        headers: { Authorization: `Bearer ${token}` },
      },
      env,
    );

    expect(res.status).toBe(200);
  });
});
```

## Testing Durable Objects

```typescript
import { env } from "cloudflare:test";

describe("Counter DO", () => {
  it("increments counter", async () => {
    const id = env.COUNTER.idFromName("test-counter");
    const stub = env.COUNTER.get(id);

    const res = await stub.fetch(new Request("http://do/increment"));
    const data = await res.json();

    expect(data.count).toBe(1);
  });
});
```

## Testing Execution Context (waitUntil)

```typescript
import { createExecutionContext, waitOnExecutionContext } from "cloudflare:test";

describe("Background tasks", () => {
  it("processes waitUntil tasks", async () => {
    const ctx = createExecutionContext();
    const res = await app.request("/api/with-background-work", {}, env);

    // Wait for all waitUntil promises to resolve
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(200);
  });
});
```

## Gotchas

- **Workers runtime** — Tests run inside the Workers runtime, not Node.js. Some Node APIs are unavailable.
- **nodejs_compat** — Add `"nodejs_compat"` to `compatibility_flags` in wrangler.jsonc for Node.js polyfills
- **Isolated bindings** — Each test file gets isolated binding instances; data doesn't leak between files
- **app.request()** — Third argument is `env` (bindings object); must pass for routes that use `c.env`
- **D1 schema** — You must create tables in `beforeEach`/`beforeAll`; test D1 starts empty
- **No network** — External `fetch()` calls work but may need mocking for deterministic tests

## Documentation

```bash
curl -H "Accept: text/markdown" https://developers.cloudflare.com/workers/testing/vitest-integration/
```

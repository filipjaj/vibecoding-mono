# Workers Runtime Constraints

## CPU Time

| Plan | CPU Time per Request |
| --- | --- |
| Free | 10ms |
| Paid (Bundled) | 50ms |
| Paid (Unbound) | 30s (configurable) |

**CPU time != wall clock time.** Only actual JavaScript execution counts. External `fetch()` calls and async I/O (KV, D1, R2 reads) do NOT count toward CPU time — they're "waiting" time.

Configure CPU limit in wrangler.jsonc:

```jsonc
{
  "limits": {
    "cpu_ms": 100
  }
}
```

## Memory

- **128MB** per request (isolate limit)
- Workers are stateless — memory clears after each request
- Use Durable Objects for persistent in-memory state
- Large object processing may hit memory limits; use streaming

## Subrequests

| Plan | Subrequests per Request |
| --- | --- |
| Free | 50 |
| Paid | 1000 |

Each `fetch()` counts as one subrequest. Exceptions:
- **Service bindings** do NOT count (Worker-to-Worker calls)
- **HTTP redirects** count as additional subrequests
- **KV, D1, R2** operations do NOT count (they're binding calls, not fetch)
- **Durable Object** stub.fetch() counts as a subrequest

## Script Size

- **10MB** after gzip compression (total Worker bundle)
- Includes all code, dependencies, and embedded assets
- Use tree-shaking and avoid large dependencies

## Request/Response Limits

- **100MB** max request body
- **Unlimited** response body (use streaming for large responses)
- **1MB** WebSocket message size

## Background Tasks (waitUntil)

Extend execution after the response is sent:

```typescript
app.post("/api/events", async (c) => {
  const event = await c.req.json();

  // Fire-and-forget background work
  c.executionCtx.waitUntil(
    logToAnalytics(event, c.env),
  );

  // Response returns immediately
  return c.json({ received: true });
});
```

- `waitUntil()` extends CPU time limit to **30 seconds**
- Use for: logging, analytics, cache warming, cleanup
- If the promise rejects, it's silently ignored (won't crash the Worker)

## No Filesystem

Workers have no filesystem access:
- Use **KV** or **R2** for file storage
- No `fs`, `path`, or `os` modules
- Static files served via `assets` binding or R2

## Crypto

Use the Web Crypto API, not Node.js `crypto`:

```typescript
// CORRECT — Web Crypto
const hash = await crypto.subtle.digest("SHA-256", data);
const uuid = crypto.randomUUID();

// WRONG — Node.js crypto (unavailable without nodejs_compat)
import crypto from "crypto"; // Don't do this
```

With `nodejs_compat` flag, some Node.js crypto APIs are available as polyfills.

## Concurrency

- Multiple requests handled concurrently within the same isolate
- **No shared mutable state** between requests (each request gets its own `c` context)
- Module-level variables ARE shared between requests (use carefully for caching)
- Use Durable Objects for shared state that needs consistency

```typescript
// Module-level cache (shared between requests, but not persistent)
const cache = new Map<string, { value: string; expires: number }>();

app.get("/api/data/:key", async (c) => {
  const key = c.req.param("key");
  const cached = cache.get(key);

  if (cached && cached.expires > Date.now()) {
    return c.json({ value: cached.value, source: "memory" });
  }

  const value = await c.env.MY_KV.get(key);
  if (value) {
    cache.set(key, { value, expires: Date.now() + 60_000 });
  }

  return c.json({ value, source: "kv" });
});
```

## Cold Starts

- Workers cold starts are **minimal** (typically <5ms) — much faster than Lambda
- AI model loading can add latency on first request
- Module-level code runs once on cold start; keep it fast

## Practical Tips

1. **Stream large responses** — Don't buffer entire response in memory
2. **Batch DB queries** — Use `db.batch()` for D1, reduce roundtrips
3. **Use service bindings** — Worker-to-Worker calls don't count as subrequests
4. **Background work via waitUntil** — Logging, analytics, cache updates after response
5. **Cache aggressively** — Use KV with TTL as an edge cache layer
6. **Index your database** — CPU time applies while waiting for slow D1/Neon queries
7. **Avoid large dependencies** — Keep bundle size small; tree-shake unused code
8. **Use streaming for uploads** — Don't buffer entire file in memory before writing to R2

## Limits Reference Table

| Resource | Free | Paid |
| --- | --- | --- |
| CPU time/request | 10ms | 50ms (Bundled) / 30s (Unbound) |
| Memory | 128MB | 128MB |
| Subrequests | 50 | 1000 |
| Script size | 10MB gzip | 10MB gzip |
| Request body | 100MB | 100MB |
| KV value size | 25MB | 25MB |
| KV key size | 512B | 512B |
| D1 row size | 1MB | 1MB |
| D1 response size | 10MB | 10MB |
| R2 object size | 5GB (single) | 5GB (single) |
| WebSocket message | 1MB | 1MB |
| DO storage value | 128KB | 128KB |
| Queue message | 100KB | 100KB |
| Workflow step output | 1MB | 1MB |

## Documentation

```bash
curl -H "Accept: text/markdown" https://developers.cloudflare.com/workers/platform/limits/
```

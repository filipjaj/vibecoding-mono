# Cloudflare KV (Key-Value Storage)

## Binding Type

```typescript
type Bindings = {
  MY_KV: KVNamespace;
};
```

## Wrangler Config

```jsonc
// wrangler.jsonc
{
  "kv_namespaces": [
    {
      "binding": "MY_KV",
      "id": "abc123def456" // from `wrangler kv namespace create MY_KV`
    }
  ]
}
```

Create a KV namespace:

```bash
wrangler kv namespace create MY_KV
wrangler kv namespace create MY_KV --preview  # for local dev
```

## CRUD Operations

### Put (Write)

```typescript
app.post("/api/cache", async (c) => {
  const { key, value } = await c.req.json();

  // Simple string
  await c.env.MY_KV.put(key, value);

  // JSON (stored as string)
  await c.env.MY_KV.put(key, JSON.stringify({ data: value }));

  // With TTL (seconds)
  await c.env.MY_KV.put(key, value, { expirationTtl: 3600 }); // 1 hour

  // With expiration (unix timestamp)
  await c.env.MY_KV.put(key, value, { expiration: Math.floor(Date.now() / 1000) + 86400 });

  return c.json({ stored: true });
});
```

### Get (Read)

```typescript
app.get("/api/cache/:key", async (c) => {
  const key = c.req.param("key");

  // String (default)
  const value = await c.env.MY_KV.get(key);

  // JSON (parsed automatically)
  const json = await c.env.MY_KV.get(key, "json");

  // Stream (for large values)
  const stream = await c.env.MY_KV.get(key, "stream");

  // ArrayBuffer (for binary data)
  const buffer = await c.env.MY_KV.get(key, "arrayBuffer");

  if (value === null) {
    return c.notFound();
  }

  return c.json({ value });
});
```

### Get with Metadata

```typescript
const { value, metadata } = await c.env.MY_KV.getWithMetadata("user:123", "json");
// metadata is whatever you stored with put()
```

### Delete

```typescript
await c.env.MY_KV.delete("user:123");
```

### List

```typescript
app.get("/api/cache/list", async (c) => {
  // List all keys with a prefix
  const result = await c.env.MY_KV.list({ prefix: "user:" });

  // result.keys = [{ name, expiration?, metadata? }, ...]
  // result.list_complete = boolean
  // result.cursor = string (for pagination)

  return c.json({ keys: result.keys });
});
```

Paginated listing:

```typescript
async function listAllKeys(kv: KVNamespace, prefix: string) {
  const keys: KVNamespaceListKey<unknown>[] = [];
  let cursor: string | undefined;

  do {
    const result = await kv.list({ prefix, cursor });
    keys.push(...result.keys);
    cursor = result.list_complete ? undefined : result.cursor;
  } while (cursor);

  return keys;
}
```

## Metadata

Store metadata alongside values:

```typescript
// Store with metadata
await c.env.MY_KV.put("user:123", JSON.stringify(userData), {
  metadata: {
    createdAt: new Date().toISOString(),
    version: 2,
  },
});

// Read with metadata
const { value, metadata } = await c.env.MY_KV.getWithMetadata<{
  createdAt: string;
  version: number;
}>("user:123", "json");
```

## Caching Pattern

```typescript
app.get("/api/users/:id", async (c) => {
  const id = c.req.param("id");
  const cacheKey = `user:${id}`;

  // Check cache first
  const cached = await c.env.MY_KV.get(cacheKey, "json");
  if (cached) {
    return c.json(cached);
  }

  // Fetch from database
  const user = await c.env.DB
    .prepare("SELECT * FROM users WHERE id = ?")
    .bind(id)
    .first();

  if (!user) return c.notFound();

  // Cache for 5 minutes
  c.executionCtx.waitUntil(
    c.env.MY_KV.put(cacheKey, JSON.stringify(user), { expirationTtl: 300 }),
  );

  return c.json(user);
});
```

## Gotchas

- **Eventual consistency** — Writes propagate globally in ~60 seconds. A read immediately after a write in a different region may return stale data.
- **Value size limit** — Max 25MB per value
- **Key size limit** — Max 512 bytes per key
- **List limit** — Returns up to 1000 keys per `list()` call; use cursor for pagination
- **Rate limits** — Free: 100K reads/day, 1K writes/day. Paid: unlimited
- **No atomic operations** — No compare-and-swap. Use Durable Objects for strong consistency.

## Documentation

```bash
curl -H "Accept: text/markdown" https://developers.cloudflare.com/kv/
```

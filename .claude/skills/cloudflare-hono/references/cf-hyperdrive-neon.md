# Hyperdrive + Neon Integration

## Decision: Hyperdrive vs Direct

| Approach | When to Use |
| --- | --- |
| **Hyperdrive** | High traffic, connection pooling needed, lowest latency |
| **@neondatabase/serverless** | Simple setup, HTTP-based, serverless-native |

## Approach 1: Hyperdrive (Connection Pooling)

Hyperdrive caches and pools connections to your Neon database at the edge.

### Setup

```bash
# Create a Hyperdrive config pointing to your Neon database
wrangler hyperdrive create my-neon-db --connection-string="postgres://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

### Wrangler Config

```jsonc
// wrangler.jsonc
{
  "hyperdrive": [
    {
      "binding": "HYPERDRIVE",
      "id": "abc123..."  // from `wrangler hyperdrive create`
    }
  ]
}
```

### Binding Type

```typescript
type Bindings = {
  HYPERDRIVE: Hyperdrive;
};
```

### Usage with postgres.js

```bash
npm install postgres
```

```typescript
import postgres from "postgres";

app.get("/api/users", async (c) => {
  // Create a connection using Hyperdrive's pooled connection string
  const sql = postgres(c.env.HYPERDRIVE.connectionString);

  try {
    const users = await sql`SELECT * FROM users ORDER BY created_at DESC LIMIT 20`;
    return c.json({ users });
  } finally {
    // Always close in Workers — no persistent connections
    await sql.end();
  }
});
```

### Usage with Drizzle ORM

```bash
npm install drizzle-orm postgres
```

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./db/schema";

app.get("/api/users", async (c) => {
  const client = postgres(c.env.HYPERDRIVE.connectionString);
  const db = drizzle(client, { schema });

  try {
    const users = await db.select().from(schema.users).limit(20);
    return c.json({ users });
  } finally {
    await client.end();
  }
});
```

## Approach 2: @neondatabase/serverless (Direct HTTP)

Uses HTTP to query Neon directly — no TCP connections, no connection pooling needed.

### Setup

```bash
npm install @neondatabase/serverless
```

Store your Neon connection string as a secret:

```bash
wrangler secret put DATABASE_URL
# Paste: postgres://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### Binding Type

```typescript
type Bindings = {
  DATABASE_URL: string;
};
```

### Usage with neon() HTTP

```typescript
import { neon } from "@neondatabase/serverless";

app.get("/api/users", async (c) => {
  const sql = neon(c.env.DATABASE_URL);

  const users = await sql`SELECT * FROM users ORDER BY created_at DESC LIMIT 20`;
  return c.json({ users });
});
```

### Usage with Drizzle ORM (neon-http)

```typescript
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./db/schema";

app.get("/api/users", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const db = drizzle(sql, { schema });

  const users = await db.select().from(schema.users).limit(20);
  return c.json({ users });
});
```

### Transactions (neon-serverless)

For transaction support, use the WebSocket-based `Pool`:

```typescript
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

app.post("/api/transfer", async (c) => {
  const pool = new Pool({ connectionString: c.env.DATABASE_URL });
  const db = drizzle(pool);

  try {
    await db.transaction(async (tx) => {
      await tx.update(accounts).set({ balance: sql`balance - 100` }).where(eq(accounts.id, fromId));
      await tx.update(accounts).set({ balance: sql`balance + 100` }).where(eq(accounts.id, toId));
    });
    return c.json({ transferred: true });
  } finally {
    await pool.end();
  }
});
```

## Environment Setup

### Local Development (.dev.vars)

```bash
# .dev.vars (gitignored)
DATABASE_URL=postgres://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### Production (Secrets)

```bash
wrangler secret put DATABASE_URL
```

## Connection Lifecycle

Workers are stateless — connections don't persist between requests:

```typescript
// CORRECT — create and close per request
app.get("/api/data", async (c) => {
  const sql = postgres(c.env.HYPERDRIVE.connectionString);
  try {
    return c.json(await sql`SELECT 1`);
  } finally {
    await sql.end();
  }
});

// WRONG — module-level connection won't work
const sql = postgres(process.env.DATABASE_URL); // Don't do this
```

## Cross-Reference

For Neon-specific features (branching, CLI, migrations, Neon Auth), see the **@neon-postgres** skill.

## Gotchas

- **Always close connections** — Workers don't have persistent connections; leaking connections will exhaust your pool
- **CPU time applies to queries** — Long queries eat into your Worker's CPU budget; use database indexes
- **Hyperdrive caching** — Hyperdrive may cache query results for identical queries; use `prepare: false` in postgres.js config if this causes issues
- **SSL required** — Neon requires `sslmode=require` in connection strings
- **Connection string format** — Hyperdrive provides its own connection string at `c.env.HYPERDRIVE.connectionString`; don't use your raw Neon string directly

## Documentation

```bash
curl -H "Accept: text/markdown" https://developers.cloudflare.com/hyperdrive/
curl -H "Accept: text/markdown" https://neon.com/docs/guides/cloudflare-workers
```

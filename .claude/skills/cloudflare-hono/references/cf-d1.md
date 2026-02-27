# Cloudflare D1 (SQL Database)

## Binding Type

```typescript
type Bindings = {
  DB: D1Database;
};
```

## Wrangler Config

```jsonc
// wrangler.jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "my-database",
      "database_id": "abc123-def456-..."  // from `wrangler d1 create`
    }
  ]
}
```

## Creating a D1 Database

```bash
wrangler d1 create my-database
```

## Prepared Statements

Always use prepared statements with `.bind()` to prevent SQL injection:

```typescript
// .first() — single row or null
app.get("/api/users/:id", async (c) => {
  const user = await c.env.DB
    .prepare("SELECT * FROM users WHERE id = ?")
    .bind(c.req.param("id"))
    .first();
  return user ? c.json(user) : c.notFound();
});

// .all() — multiple rows
app.get("/api/users", async (c) => {
  const { results } = await c.env.DB
    .prepare("SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?")
    .bind(20, 0)
    .all();
  return c.json({ users: results });
});

// .run() — INSERT, UPDATE, DELETE (returns metadata)
app.post("/api/users", async (c) => {
  const { name, email } = await c.req.json();
  const result = await c.env.DB
    .prepare("INSERT INTO users (name, email) VALUES (?, ?)")
    .bind(name, email)
    .run();
  return c.json({ id: result.meta.last_row_id }, 201);
});

// .raw() — raw array format [[col1, col2], [val1, val2], ...]
const rows = await c.env.DB
  .prepare("SELECT id, name FROM users")
  .raw();
```

## Query Patterns

### Pagination

```typescript
app.get("/api/users", async (c) => {
  const page = Number(c.req.query("page") || "1");
  const limit = Number(c.req.query("limit") || "20");
  const offset = (page - 1) * limit;

  const [countResult, dataResult] = await c.env.DB.batch([
    c.env.DB.prepare("SELECT COUNT(*) as total FROM users"),
    c.env.DB
      .prepare("SELECT * FROM users ORDER BY id DESC LIMIT ? OFFSET ?")
      .bind(limit, offset),
  ]);

  const total = countResult.results[0].total as number;
  return c.json({
    users: dataResult.results,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});
```

### INSERT Returning ID

```typescript
const result = await c.env.DB
  .prepare("INSERT INTO users (name, email) VALUES (?, ?) RETURNING *")
  .bind(name, email)
  .first();
return c.json(result, 201);
```

### UPDATE with Changes Count

```typescript
const result = await c.env.DB
  .prepare("UPDATE users SET name = ? WHERE id = ?")
  .bind(name, id)
  .run();

if (result.meta.changes === 0) {
  throw new HTTPException(404, { message: "User not found" });
}
```

## Batch Operations

Execute multiple queries in a single roundtrip. All statements in a batch run as an implicit transaction:

```typescript
app.post("/api/setup", async (c) => {
  const results = await c.env.DB.batch([
    c.env.DB.prepare("INSERT INTO users (name) VALUES (?)").bind("Alice"),
    c.env.DB.prepare("INSERT INTO users (name) VALUES (?)").bind("Bob"),
    c.env.DB.prepare("INSERT INTO profiles (user_id, bio) VALUES (?, ?)").bind(1, "Hello"),
  ]);

  return c.json({ inserted: results.length });
});
```

## Migrations

```bash
# Create a migration
wrangler d1 migrations create my-database create-users-table

# This creates: migrations/0001_create-users-table.sql
```

Write the migration SQL:

```sql
-- migrations/0001_create-users-table.sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'user',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

Apply migrations:

```bash
# Local
wrangler d1 migrations apply my-database --local

# Remote (production)
wrangler d1 migrations apply my-database --remote
```

## Gotchas

- **SQLite, not Postgres** — D1 uses SQLite syntax. Use `TEXT` not `VARCHAR`, `INTEGER` not `SERIAL`, `datetime('now')` not `NOW()`.
- **1MB row limit** — Individual rows cannot exceed 1MB
- **10MB response** — Query results cannot exceed 10MB total
- **No ALTER COLUMN** — SQLite doesn't support `ALTER TABLE ... ALTER COLUMN`. Create a new table and copy data.
- **Batch = transaction** — `db.batch()` is an implicit transaction. If one statement fails, all roll back.
- **Binding placeholders** — Use `?` for positional bindings, not `$1` (that's Postgres syntax)
- **Read replicas** — D1 automatically reads from the closest replica for low latency

## Documentation

```bash
curl -H "Accept: text/markdown" https://developers.cloudflare.com/d1/
```

# Hono Validation

## Setup

```bash
npm install @hono/zod-validator zod
```

```typescript
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
```

## JSON Body Validation

```typescript
const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["admin", "user"]).default("user"),
});

app.post("/api/users", zValidator("json", createUserSchema), async (c) => {
  const { name, email, role } = c.req.valid("json"); // fully typed
  const result = await c.env.DB
    .prepare("INSERT INTO users (name, email, role) VALUES (?, ?, ?)")
    .bind(name, email, role)
    .run();
  return c.json({ id: result.meta.last_row_id }, 201);
});
```

## Query Parameter Validation

```typescript
const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sort: z.enum(["asc", "desc"]).default("desc"),
});

app.get("/api/users", zValidator("query", listQuerySchema), async (c) => {
  const { page, limit, search, sort } = c.req.valid("query");
  const offset = (page - 1) * limit;
  // Use validated + coerced values
  return c.json({ page, limit, offset });
});
```

## URL Parameter Validation

```typescript
const paramSchema = z.object({
  id: z.coerce.number().int().positive(),
});

app.get("/api/users/:id", zValidator("param", paramSchema), async (c) => {
  const { id } = c.req.valid("param"); // id is number, not string
  const user = await c.env.DB
    .prepare("SELECT * FROM users WHERE id = ?")
    .bind(id)
    .first();
  return user ? c.json(user) : c.notFound();
});
```

## Header Validation

```typescript
const headerSchema = z.object({
  "x-api-key": z.string().min(1),
  "x-request-id": z.string().uuid().optional(),
});

app.get("/api/data", zValidator("header", headerSchema), (c) => {
  const headers = c.req.valid("header");
  return c.json({ apiKey: headers["x-api-key"] });
});
```

## Form Data Validation

```typescript
const formSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(8),
});

app.post("/api/login", zValidator("form", formSchema), async (c) => {
  const { username, password } = c.req.valid("form");
  // Authenticate user...
  return c.json({ token: "..." });
});
```

## Custom Error Responses

The third argument to `zValidator` is a hook for custom error formatting:

```typescript
app.post(
  "/api/users",
  zValidator("json", createUserSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          error: "Validation failed",
          details: result.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        400,
      );
    }
  }),
  async (c) => {
    const data = c.req.valid("json");
    // Handler logic...
    return c.json({ created: true }, 201);
  },
);
```

## Multiple Validators on One Route

```typescript
app.put(
  "/api/users/:id",
  zValidator("param", z.object({ id: z.coerce.number().int() })),
  zValidator("json", updateUserSchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    // Update user...
    return c.json({ updated: true });
  },
);
```

## Reusable Schemas and Composition

```typescript
// schemas/user.ts
import { z } from "zod";

// Base schema
export const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["admin", "user"]),
  bio: z.string().max(500).optional(),
});

// Derived schemas for different operations
export const createUserSchema = userSchema.omit({ role: true }).extend({
  password: z.string().min(8),
});

export const updateUserSchema = userSchema.partial(); // all fields optional

export const userResponseSchema = userSchema.extend({
  id: z.number(),
  createdAt: z.string(),
});

// Type inference
export type User = z.infer<typeof userSchema>;
export type CreateUser = z.infer<typeof createUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
```

## Shared Error Hook

```typescript
import { Hook } from "@hono/zod-validator";

const validationHook: Hook<any, any, any, any> = (result, c) => {
  if (!result.success) {
    return c.json(
      {
        error: "Validation failed",
        details: result.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      400,
    );
  }
};

// Use the shared hook
app.post("/api/users", zValidator("json", createUserSchema, validationHook), handler);
app.put("/api/users/:id", zValidator("json", updateUserSchema, validationHook), handler);
```

## Documentation

```bash
curl -H "Accept: text/markdown" https://hono.dev/docs/guides/validation
```

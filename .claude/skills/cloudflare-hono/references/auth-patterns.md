# Auth Patterns

## Decision Guide

| Pattern | When to Use |
| --- | --- |
| **Better Auth on Worker** | Worker IS your auth backend (email/password, OAuth, sessions) |
| **JWT Validation** | Auth lives elsewhere (TanStack Start, Neon Auth); Worker just validates tokens |

---

## Pattern 1: Better Auth Running ON the Worker

### Setup

```bash
npm install better-auth
```

### Better Auth Configuration

```typescript
// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { D1Dialect } from "better-auth/adapters";

export function createAuth(env: Bindings) {
  return betterAuth({
    database: {
      dialect: new D1Dialect({ database: env.DB }),
      type: "sqlite",
    },
    emailAndPassword: {
      enabled: true,
    },
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
      github: {
        clientId: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24,      // refresh daily
    },
    trustedOrigins: [
      "http://localhost:3000",
      "https://example.com",
    ],
  });
}
```

### Mount Auth Routes

```typescript
// src/index.ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createAuth } from "./lib/auth";

type Bindings = {
  DB: D1Database;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use("/api/*", cors({
  origin: ["http://localhost:3000"],
  credentials: true,
}));

// Mount Better Auth on all /api/auth/* routes
app.on(["GET", "POST"], "/api/auth/**", async (c) => {
  const auth = createAuth(c.env);
  return auth.handler(c.req.raw);
});
```

### Auth Middleware (Session Validation)

```typescript
import { createMiddleware } from "hono/factory";
import { createAuth } from "./lib/auth";

type Variables = {
  user: { id: string; email: string; name: string };
  session: { id: string; expiresAt: Date };
};

const authMiddleware = createMiddleware<{
  Bindings: Bindings;
  Variables: Variables;
}>(async (c, next) => {
  const auth = createAuth(c.env);
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("user", session.user);
  c.set("session", session.session);
  await next();
});

// Use on protected routes
app.use("/api/protected/*", authMiddleware);

app.get("/api/protected/me", (c) => {
  const user = c.get("user");
  return c.json({ user });
});
```

### Client Setup (TanStack Start)

```typescript
// apps/web/src/lib/auth-client.ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL, // points to Worker
});

// Sign up
await authClient.signUp.email({
  email: "user@example.com",
  password: "password123",
  name: "User Name",
});

// Sign in
await authClient.signIn.email({
  email: "user@example.com",
  password: "password123",
});

// Sign in with Google
await authClient.signIn.social({ provider: "google" });

// Get session
const session = await authClient.getSession();

// Sign out
await authClient.signOut();
```

### D1 Migration for Better Auth

```sql
-- migrations/0001_better-auth-tables.sql
CREATE TABLE IF NOT EXISTS user (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  emailVerified INTEGER DEFAULT 0,
  image TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY,
  expiresAt TEXT NOT NULL,
  ipAddress TEXT,
  userAgent TEXT,
  userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS account (
  id TEXT PRIMARY KEY,
  accountId TEXT NOT NULL,
  providerId TEXT NOT NULL,
  userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  accessToken TEXT,
  refreshToken TEXT,
  idToken TEXT,
  expiresAt TEXT,
  password TEXT
);

CREATE TABLE IF NOT EXISTS verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expiresAt TEXT NOT NULL
);
```

---

## Pattern 2: JWT Validation Only

### Using hono/jwt Middleware

```typescript
import { jwt } from "hono/jwt";

type Bindings = {
  JWT_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Protect routes with JWT validation
app.use(
  "/api/protected/*",
  jwt({ secret: (c) => c.env.JWT_SECRET }),
);

app.get("/api/protected/data", (c) => {
  const payload = c.get("jwtPayload");
  // payload = { sub: "user-id", email: "user@example.com", ... }
  return c.json({ userId: payload.sub });
});
```

### Bearer Token Pattern

```typescript
// For API tokens (Authorization: Bearer <token>)
app.use("/api/*", async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Missing bearer token" }, 401);
  }

  const token = authHeader.slice(7);

  try {
    const payload = await verify(token, c.env.JWT_SECRET);
    c.set("user", { id: payload.sub as string, email: payload.email as string });
    await next();
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }
});
```

### Cookie-Based JWT (Better Auth Session Cookie)

```typescript
import { verify } from "hono/jwt";

const cookieAuthMiddleware = createMiddleware<{
  Bindings: Bindings;
  Variables: Variables;
}>(async (c, next) => {
  const cookie = c.req.header("Cookie");
  const sessionToken = cookie
    ?.split(";")
    .find((c) => c.trim().startsWith("better-auth.session_token="))
    ?.split("=")[1];

  if (!sessionToken) {
    return c.json({ error: "No session cookie" }, 401);
  }

  try {
    const payload = await verify(sessionToken, c.env.JWT_SECRET);
    c.set("user", { id: payload.sub as string, email: payload.email as string });
    await next();
  } catch {
    return c.json({ error: "Invalid session" }, 401);
  }
});
```

### JWKS Validation (External Auth Provider)

For Neon Auth, Auth0, Clerk, or other providers that publish JWKS:

```typescript
import { createMiddleware } from "hono/factory";

type Bindings = {
  JWKS_URL: string; // e.g., "https://auth.example.com/.well-known/jwks.json"
  MY_KV: KVNamespace;
};

const jwksAuthMiddleware = createMiddleware<{
  Bindings: Bindings;
}>(async (c, next) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return c.json({ error: "Unauthorized" }, 401);

  // Cache JWKS in KV to avoid fetching every request
  let jwks = await c.env.MY_KV.get("jwks", "json");
  if (!jwks) {
    const res = await fetch(c.env.JWKS_URL);
    jwks = await res.json();
    c.executionCtx.waitUntil(
      c.env.MY_KV.put("jwks", JSON.stringify(jwks), { expirationTtl: 3600 }),
    );
  }

  // Verify token with JWKS (using Web Crypto API)
  // Implementation depends on your JWT library
  try {
    const payload = await verifyWithJwks(token, jwks);
    c.set("user", payload);
    await next();
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }
});
```

## Documentation

```bash
curl -H "Accept: text/markdown" https://www.better-auth.com/docs
curl -H "Accept: text/markdown" https://hono.dev/docs/helpers/jwt
```

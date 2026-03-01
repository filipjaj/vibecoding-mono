# Shelf — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a web platform for creating book clubs and film clubs with recurring events, media tracking, reviews, discussions, and social features.

**Architecture:** Bun workspaces monorepo with TanStack Start (React 19, TanStack Router, Vite, Tailwind v4, shadcn/base-ui) in `apps/web` and a Hono API on Cloudflare Workers in `apps/api`. The frontend calls the API via a typed fetch wrapper. Neon Postgres with Drizzle ORM for data. Better Auth for authentication. Open Library + TMDB for media data.

**Tech Stack:** TanStack Start, Hono, Cloudflare Workers, Neon Postgres, Drizzle ORM, Better Auth, Tailwind v4, shadcn/base-ui, Bun

**Design doc:** `docs/plans/2026-02-28-shelf-design.md`

---

## Task 1: Project Setup & Dependencies

**Files:**
- Modify: `apps/api/package.json`
- Modify: `apps/api/wrangler.jsonc`
- Create: `apps/api/.dev.vars`
- Create: `apps/api/drizzle.config.ts`
- Create: `apps/api/tsconfig.json` (update)
- Modify: `apps/web/package.json`
- Modify: `apps/web/src/lib/api.ts`
- Modify: `package.json` (root)

**Step 1: Install API dependencies**

```bash
cd apps/api
bun add drizzle-orm @neondatabase/serverless better-auth hono zod
bun add -D drizzle-kit dotenv @types/node
```

**Step 2: Install web dependencies**

```bash
cd apps/web
bun add @tanstack/react-query zod
```

**Step 3: Create `.dev.vars` for local secrets**

Create `apps/api/.dev.vars` (gitignored):

```
DATABASE_URL=postgresql://...your-neon-connection-string...
BETTER_AUTH_SECRET=your-random-secret-at-least-32-chars
BETTER_AUTH_URL=http://localhost:8787
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**Step 4: Create Drizzle config**

Create `apps/api/drizzle.config.ts`:

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

**Step 5: Update wrangler.jsonc bindings**

Update `apps/api/wrangler.jsonc`:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "shelf-api",
  "main": "src/index.ts",
  "compatibility_date": "2026-02-10",
  "compatibility_flags": ["nodejs_compat"],
  "dev": {
    "port": 8787
  }
}
```

**Step 6: Add db scripts to root `package.json`**

Add to root `package.json` scripts:

```json
{
  "scripts": {
    "dev": "bun run --parallel --filter '*' dev",
    "dev:web": "bun run --filter web dev",
    "dev:api": "bun run --filter api dev",
    "build": "bun run --parallel --filter '*' build",
    "deploy:api": "bun run --filter api deploy",
    "db:generate": "cd apps/api && bunx drizzle-kit generate",
    "db:migrate": "cd apps/api && bunx drizzle-kit migrate",
    "db:push": "cd apps/api && bunx drizzle-kit push",
    "db:studio": "cd apps/api && bunx drizzle-kit studio"
  }
}
```

**Step 7: Update API CORS for production**

Update `apps/api/src/index.ts` CORS to also accept env-based origins:

```ts
import { Hono } from "hono";
import { cors } from "hono/cors";

type Bindings = {
  DATABASE_URL: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  WEB_URL?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use(
  "/api/*",
  cors({
    origin: (origin, c) => {
      const allowed = [
        "http://localhost:3000",
        c.env.WEB_URL,
      ].filter(Boolean) as string[];
      return allowed.includes(origin) ? origin : "";
    },
    credentials: true,
  })
);

app.get("/api/health", (c) => {
  return c.json({ status: "ok" });
});

export default app;
```

**Step 8: Commit**

```bash
git add -A
git commit -m "chore: install dependencies and configure project"
```

---

## Task 2: Database Schema

**Files:**
- Create: `apps/api/src/db/schema.ts`
- Create: `apps/api/src/db/index.ts`

**Step 1: Create DB client factory**

Create `apps/api/src/db/index.ts`:

```ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export function createDb(databaseUrl: string) {
  const sql = neon(databaseUrl);
  return drizzle({ client: sql, schema });
}

export type Database = ReturnType<typeof createDb>;
```

**Step 2: Create full schema**

Create `apps/api/src/db/schema.ts`:

```ts
import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  pgEnum,
  uuid,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ──────────────────────────────────────────────

export const mediaTypeEnum = pgEnum("media_type", ["book", "film"]);
export const clubRoleEnum = pgEnum("club_role", ["admin", "member"]);
export const scheduleStatusEnum = pgEnum("schedule_status", [
  "upcoming",
  "current",
  "completed",
]);
export const rsvpStatusEnum = pgEnum("rsvp_status", [
  "going",
  "maybe",
  "not_going",
]);
export const shelfStatusEnum = pgEnum("shelf_status", [
  "want",
  "reading",
  "watched",
  "finished",
]);
export const progressStatusEnum = pgEnum("progress_status", [
  "not_started",
  "in_progress",
  "finished",
]);

// ─── Better Auth tables ─────────────────────────────────
// Better Auth manages these. We define them here so Drizzle
// is aware of them and we can reference them in relations.

export const users = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const sessions = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
});

export const accounts = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: "date" }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
    mode: "date",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const verifications = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }),
  updatedAt: timestamp("updated_at", { mode: "date" }),
});

// ─── App tables ─────────────────────────────────────────

export const clubs = pgTable("clubs", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  coverImageUrl: text("cover_image_url"),
  mediaType: mediaTypeEnum("media_type").notNull(),
  inviteCode: varchar("invite_code", { length: 20 }).notNull().unique(),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  recurrenceRule: text("recurrence_rule"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const clubMembers = pgTable(
  "club_members",
  {
    clubId: uuid("club_id")
      .notNull()
      .references(() => clubs.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    role: clubRoleEnum("role").notNull().default("member"),
    joinedAt: timestamp("joined_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("club_members_unique").on(t.clubId, t.userId)]
);

export const mediaItems = pgTable(
  "media_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    externalId: text("external_id").notNull(),
    mediaType: mediaTypeEnum("media_type").notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    authorOrDirector: varchar("author_or_director", { length: 255 }),
    coverUrl: text("cover_url"),
    year: integer("year"),
    description: text("description"),
  },
  (t) => [
    uniqueIndex("media_items_external").on(t.externalId, t.mediaType),
  ]
);

export const clubSchedule = pgTable("club_schedule", {
  id: uuid("id").defaultRandom().primaryKey(),
  clubId: uuid("club_id")
    .notNull()
    .references(() => clubs.id, { onDelete: "cascade" }),
  mediaItemId: uuid("media_item_id")
    .notNull()
    .references(() => mediaItems.id),
  order: integer("order").notNull().default(0),
  scheduledDate: timestamp("scheduled_date", { mode: "date" }),
  status: scheduleStatusEnum("status").notNull().default("upcoming"),
});

export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  clubId: uuid("club_id")
    .notNull()
    .references(() => clubs.id, { onDelete: "cascade" }),
  scheduleItemId: uuid("schedule_item_id").references(() => clubSchedule.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  location: text("location"),
  startsAt: timestamp("starts_at", { mode: "date" }).notNull(),
  endsAt: timestamp("ends_at", { mode: "date" }),
});

export const rsvps = pgTable(
  "rsvps",
  {
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    status: rsvpStatusEnum("status").notNull(),
  },
  (t) => [uniqueIndex("rsvps_unique").on(t.eventId, t.userId)]
);

export const reviews = pgTable("reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  mediaItemId: uuid("media_item_id")
    .notNull()
    .references(() => mediaItems.id),
  clubId: uuid("club_id").references(() => clubs.id),
  rating: integer("rating").notNull(),
  text: text("text"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const discussionThreads = pgTable("discussion_threads", {
  id: uuid("id").defaultRandom().primaryKey(),
  clubId: uuid("club_id")
    .notNull()
    .references(() => clubs.id, { onDelete: "cascade" }),
  mediaItemId: uuid("media_item_id").references(() => mediaItems.id),
  eventId: uuid("event_id").references(() => events.id),
  title: varchar("title", { length: 255 }).notNull(),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const discussionComments = pgTable("discussion_comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  threadId: uuid("thread_id")
    .notNull()
    .references(() => discussionThreads.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  text: text("text").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const userShelves = pgTable(
  "user_shelves",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    mediaItemId: uuid("media_item_id")
      .notNull()
      .references(() => mediaItems.id),
    status: shelfStatusEnum("status").notNull(),
    addedAt: timestamp("added_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("user_shelves_unique").on(t.userId, t.mediaItemId)]
);

export const activityEvents = pgTable("activity_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  clubId: uuid("club_id").references(() => clubs.id),
  type: varchar("type", { length: 50 }).notNull(),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const clubMemberProgress = pgTable(
  "club_member_progress",
  {
    clubId: uuid("club_id")
      .notNull()
      .references(() => clubs.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    mediaItemId: uuid("media_item_id")
      .notNull()
      .references(() => mediaItems.id),
    status: progressStatusEnum("status").notNull().default("not_started"),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("club_member_progress_unique").on(
      t.clubId,
      t.userId,
      t.mediaItemId
    ),
  ]
);
```

**Step 3: Generate and run migration**

```bash
cd apps/api
# Load .dev.vars into env for drizzle-kit
export $(cat .dev.vars | xargs)
bunx drizzle-kit generate --name=init
bunx drizzle-kit migrate
```

**Step 4: Verify by running `drizzle-kit studio`**

```bash
bunx drizzle-kit studio
```

Open the studio URL and confirm all tables are created.

**Step 5: Commit**

```bash
git add apps/api/src/db/ apps/api/drizzle.config.ts
git commit -m "feat: add Drizzle schema with all tables and initial migration"
```

---

## Task 3: Better Auth Setup

**Files:**
- Create: `apps/api/src/lib/auth.ts`
- Modify: `apps/api/src/index.ts`

**Step 1: Create auth config factory**

Create `apps/api/src/lib/auth.ts`:

```ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createDb } from "../db";

type AuthEnv = {
  DATABASE_URL: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
};

export function createAuth(env: AuthEnv) {
  const db = createDb(env.DATABASE_URL);

  return betterAuth({
    database: drizzleAdapter(db, { provider: "pg" }),
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    emailAndPassword: {
      enabled: true,
    },
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
    trustedOrigins: ["http://localhost:3000"],
  });
}
```

**Step 2: Create auth middleware for protected routes**

Create `apps/api/src/lib/auth-middleware.ts`:

```ts
import { createMiddleware } from "hono/factory";
import { createAuth } from "./auth";

type Env = {
  Bindings: {
    DATABASE_URL: string;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
  };
  Variables: {
    user: { id: string; name: string; email: string; image: string | null };
  };
};

export const authMiddleware = createMiddleware<Env>(async (c, next) => {
  const auth = createAuth(c.env);
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("user", session.user);
  await next();
});
```

**Step 3: Mount auth routes on Hono**

Update `apps/api/src/index.ts` to add auth handler:

```ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createAuth } from "./lib/auth";

type Bindings = {
  DATABASE_URL: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  WEB_URL?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use(
  "/api/*",
  cors({
    origin: (origin, c) => {
      const allowed = [
        "http://localhost:3000",
        c.env.WEB_URL,
      ].filter(Boolean) as string[];
      return allowed.includes(origin) ? origin : "";
    },
    credentials: true,
  })
);

// Better Auth handler — handles all /api/auth/* routes
app.on(["GET", "POST"], "/api/auth/**", (c) => {
  const auth = createAuth(c.env);
  return auth.handler(c.req.raw);
});

app.get("/api/health", (c) => {
  return c.json({ status: "ok" });
});

export default app;
```

**Step 4: Start dev server and test auth endpoint**

```bash
bun run dev:api
# In another terminal:
curl http://localhost:8787/api/auth/ok
```

Expected: `{ "ok": true }` (Better Auth health check)

**Step 5: Commit**

```bash
git add apps/api/src/lib/ apps/api/src/index.ts
git commit -m "feat: add Better Auth with Google OAuth and email/password"
```

---

## Task 4: Clubs API

**Files:**
- Create: `apps/api/src/routes/clubs.ts`
- Modify: `apps/api/src/index.ts`

**Step 1: Create clubs routes**

Create `apps/api/src/routes/clubs.ts`:

```ts
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, and } from "drizzle-orm";
import { createDb } from "../db";
import { clubs, clubMembers, users } from "../db/schema";
import { authMiddleware } from "../lib/auth-middleware";
import { nanoid } from "nanoid";

type Env = {
  Bindings: {
    DATABASE_URL: string;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
  };
  Variables: {
    user: { id: string; name: string; email: string; image: string | null };
  };
};

const clubsRouter = new Hono<Env>();

// All club routes require auth
clubsRouter.use("/*", authMiddleware);

// List user's clubs
clubsRouter.get("/", async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const user = c.get("user");

  const memberships = await db
    .select({
      club: clubs,
      role: clubMembers.role,
    })
    .from(clubMembers)
    .innerJoin(clubs, eq(clubMembers.clubId, clubs.id))
    .where(eq(clubMembers.userId, user.id));

  return c.json(memberships);
});

// Create club
const createClubSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  mediaType: z.enum(["book", "film"]),
  recurrenceRule: z.string().optional(),
});

clubsRouter.post("/", zValidator("json", createClubSchema), async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const user = c.get("user");
  const body = c.req.valid("json");

  const inviteCode = nanoid(10);

  const [club] = await db
    .insert(clubs)
    .values({
      name: body.name,
      description: body.description,
      mediaType: body.mediaType,
      inviteCode,
      createdBy: user.id,
      recurrenceRule: body.recurrenceRule,
    })
    .returning();

  // Add creator as admin member
  await db.insert(clubMembers).values({
    clubId: club.id,
    userId: user.id,
    role: "admin",
  });

  return c.json(club, 201);
});

// Get club detail
clubsRouter.get("/:id", async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const clubId = c.req.param("id");

  const [club] = await db
    .select()
    .from(clubs)
    .where(eq(clubs.id, clubId));

  if (!club) return c.json({ error: "Club not found" }, 404);

  const members = await db
    .select({
      user: {
        id: users.id,
        name: users.name,
        image: users.image,
      },
      role: clubMembers.role,
      joinedAt: clubMembers.joinedAt,
    })
    .from(clubMembers)
    .innerJoin(users, eq(clubMembers.userId, users.id))
    .where(eq(clubMembers.clubId, clubId));

  return c.json({ ...club, members });
});

// Generate invite link (regenerate invite code)
clubsRouter.post("/:id/invite", async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const clubId = c.req.param("id");
  const user = c.get("user");

  // Verify user is admin
  const [membership] = await db
    .select()
    .from(clubMembers)
    .where(
      and(
        eq(clubMembers.clubId, clubId),
        eq(clubMembers.userId, user.id),
        eq(clubMembers.role, "admin")
      )
    );

  if (!membership) return c.json({ error: "Forbidden" }, 403);

  const newCode = nanoid(10);
  const [updated] = await db
    .update(clubs)
    .set({ inviteCode: newCode })
    .where(eq(clubs.id, clubId))
    .returning();

  return c.json({ inviteCode: updated.inviteCode });
});

// Join via invite code
clubsRouter.post("/join/:code", async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const code = c.req.param("code");
  const user = c.get("user");

  const [club] = await db
    .select()
    .from(clubs)
    .where(eq(clubs.inviteCode, code));

  if (!club) return c.json({ error: "Invalid invite code" }, 404);

  // Check if already a member
  const [existing] = await db
    .select()
    .from(clubMembers)
    .where(
      and(eq(clubMembers.clubId, club.id), eq(clubMembers.userId, user.id))
    );

  if (existing) return c.json({ club, alreadyMember: true });

  await db.insert(clubMembers).values({
    clubId: club.id,
    userId: user.id,
    role: "member",
  });

  return c.json({ club, alreadyMember: false }, 201);
});

// Get club by invite code (for preview — no auth required)
// This one is separate because it doesn't need auth
export const clubPreviewRouter = new Hono<Env>();

clubPreviewRouter.get("/join/:code", async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const code = c.req.param("code");

  const [club] = await db
    .select({
      id: clubs.id,
      name: clubs.name,
      description: clubs.description,
      coverImageUrl: clubs.coverImageUrl,
      mediaType: clubs.mediaType,
    })
    .from(clubs)
    .where(eq(clubs.inviteCode, code));

  if (!club) return c.json({ error: "Invalid invite code" }, 404);

  // Count members
  const members = await db
    .select()
    .from(clubMembers)
    .where(eq(clubMembers.clubId, club.id));

  return c.json({ ...club, memberCount: members.length });
});

export { clubsRouter };
```

**Step 2: Install missing deps**

```bash
cd apps/api
bun add nanoid @hono/zod-validator
```

**Step 3: Mount clubs routes in main app**

Add to `apps/api/src/index.ts` after auth routes:

```ts
import { clubsRouter, clubPreviewRouter } from "./routes/clubs";

// ... after auth handler ...

// Public routes (no auth)
app.route("/api", clubPreviewRouter);

// Protected routes
app.route("/api/clubs", clubsRouter);
```

**Step 4: Test with curl**

```bash
# Health check
curl http://localhost:8787/api/health
```

**Step 5: Commit**

```bash
git add apps/api/src/routes/clubs.ts apps/api/src/index.ts apps/api/package.json
git commit -m "feat: add clubs API with CRUD, invite links, and join flow"
```

---

## Task 5: Media Search API (Open Library + TMDB)

**Files:**
- Create: `apps/api/src/lib/external/open-library.ts`
- Create: `apps/api/src/lib/external/tmdb.ts`
- Create: `apps/api/src/routes/media.ts`
- Modify: `apps/api/src/index.ts`

**Step 1: Create Open Library client**

Create `apps/api/src/lib/external/open-library.ts`:

```ts
type OpenLibraryResult = {
  externalId: string;
  title: string;
  authorOrDirector: string | null;
  coverUrl: string | null;
  year: number | null;
  description: string | null;
};

export async function searchBooks(
  query: string
): Promise<OpenLibraryResult[]> {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20&fields=key,title,author_name,first_publish_year,cover_i`;
  const res = await fetch(url);
  if (!res.ok) return [];

  const data = (await res.json()) as {
    docs: Array<{
      key: string;
      title: string;
      author_name?: string[];
      first_publish_year?: number;
      cover_i?: number;
    }>;
  };

  return data.docs.map((doc) => ({
    externalId: doc.key,
    title: doc.title,
    authorOrDirector: doc.author_name?.[0] ?? null,
    coverUrl: doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
      : null,
    year: doc.first_publish_year ?? null,
    description: null,
  }));
}
```

**Step 2: Create TMDB client**

Create `apps/api/src/lib/external/tmdb.ts`:

```ts
type TmdbResult = {
  externalId: string;
  title: string;
  authorOrDirector: string | null;
  coverUrl: string | null;
  year: number | null;
  description: string | null;
};

export async function searchFilms(
  query: string,
  apiKey: string
): Promise<TmdbResult[]> {
  const url = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&language=en-US&page=1`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) return [];

  const data = (await res.json()) as {
    results: Array<{
      id: number;
      title: string;
      release_date?: string;
      poster_path?: string;
      overview?: string;
    }>;
  };

  return data.results.map((movie) => ({
    externalId: `tmdb:${movie.id}`,
    title: movie.title,
    authorOrDirector: null,
    coverUrl: movie.poster_path
      ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
      : null,
    year: movie.release_date
      ? parseInt(movie.release_date.slice(0, 4), 10)
      : null,
    description: movie.overview ?? null,
  }));
}
```

**Step 3: Create media routes**

Create `apps/api/src/routes/media.ts`:

```ts
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, and } from "drizzle-orm";
import { createDb } from "../db";
import { mediaItems, reviews, users } from "../db/schema";
import { authMiddleware } from "../lib/auth-middleware";
import { searchBooks } from "../lib/external/open-library";
import { searchFilms } from "../lib/external/tmdb";

type Env = {
  Bindings: {
    DATABASE_URL: string;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    TMDB_API_KEY?: string;
  };
  Variables: {
    user: { id: string; name: string; email: string; image: string | null };
  };
};

const mediaRouter = new Hono<Env>();

// Search media (public)
mediaRouter.get("/search", async (c) => {
  const query = c.req.query("q");
  const type = c.req.query("type") as "book" | "film" | undefined;

  if (!query) return c.json({ error: "Query required" }, 400);

  let results: Array<{
    externalId: string;
    title: string;
    authorOrDirector: string | null;
    coverUrl: string | null;
    year: number | null;
    description: string | null;
  }> = [];

  if (!type || type === "book") {
    const books = await searchBooks(query);
    results = results.concat(books.map((b) => ({ ...b, mediaType: "book" as const })));
  }

  if (!type || type === "film") {
    const apiKey = c.env.TMDB_API_KEY;
    if (apiKey) {
      const films = await searchFilms(query, apiKey);
      results = results.concat(films.map((f) => ({ ...f, mediaType: "film" as const })));
    }
  }

  return c.json(results);
});

// Get or create a media item (upsert from external data)
const upsertMediaSchema = z.object({
  externalId: z.string(),
  mediaType: z.enum(["book", "film"]),
  title: z.string(),
  authorOrDirector: z.string().nullable().optional(),
  coverUrl: z.string().nullable().optional(),
  year: z.number().nullable().optional(),
  description: z.string().nullable().optional(),
});

mediaRouter.post(
  "/",
  authMiddleware,
  zValidator("json", upsertMediaSchema),
  async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const body = c.req.valid("json");

    // Check if already exists
    const [existing] = await db
      .select()
      .from(mediaItems)
      .where(
        and(
          eq(mediaItems.externalId, body.externalId),
          eq(mediaItems.mediaType, body.mediaType)
        )
      );

    if (existing) return c.json(existing);

    const [item] = await db
      .insert(mediaItems)
      .values({
        externalId: body.externalId,
        mediaType: body.mediaType,
        title: body.title,
        authorOrDirector: body.authorOrDirector ?? null,
        coverUrl: body.coverUrl ?? null,
        year: body.year ?? null,
        description: body.description ?? null,
      })
      .returning();

    return c.json(item, 201);
  }
);

// Get media detail with reviews
mediaRouter.get("/:id", async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const mediaId = c.req.param("id");

  const [item] = await db
    .select()
    .from(mediaItems)
    .where(eq(mediaItems.id, mediaId));

  if (!item) return c.json({ error: "Not found" }, 404);

  const mediaReviews = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      text: reviews.text,
      createdAt: reviews.createdAt,
      user: {
        id: users.id,
        name: users.name,
        image: users.image,
      },
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .where(eq(reviews.mediaItemId, mediaId));

  return c.json({ ...item, reviews: mediaReviews });
});

export { mediaRouter };
```

**Step 4: Add TMDB_API_KEY to wrangler.jsonc and `.dev.vars`**

Add to `apps/api/.dev.vars`:
```
TMDB_API_KEY=your-tmdb-api-key
```

**Step 5: Mount media routes**

Add to `apps/api/src/index.ts`:

```ts
import { mediaRouter } from "./routes/media";

app.route("/api/media", mediaRouter);
```

**Step 6: Commit**

```bash
git add apps/api/src/lib/external/ apps/api/src/routes/media.ts apps/api/src/index.ts
git commit -m "feat: add media search API with Open Library and TMDB integration"
```

---

## Task 6: Club Schedule API

**Files:**
- Create: `apps/api/src/routes/schedule.ts`
- Modify: `apps/api/src/index.ts`

**Step 1: Create schedule routes**

Create `apps/api/src/routes/schedule.ts`:

```ts
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, and, asc } from "drizzle-orm";
import { createDb } from "../db";
import { clubSchedule, mediaItems, clubMembers } from "../db/schema";
import { authMiddleware } from "../lib/auth-middleware";

type Env = {
  Bindings: { DATABASE_URL: string; BETTER_AUTH_SECRET: string; BETTER_AUTH_URL: string; GOOGLE_CLIENT_ID: string; GOOGLE_CLIENT_SECRET: string };
  Variables: { user: { id: string; name: string; email: string; image: string | null } };
};

const scheduleRouter = new Hono<Env>();
scheduleRouter.use("/*", authMiddleware);

// Get club schedule
scheduleRouter.get("/:clubId/schedule", async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const clubId = c.req.param("clubId");

  const items = await db
    .select({
      id: clubSchedule.id,
      order: clubSchedule.order,
      scheduledDate: clubSchedule.scheduledDate,
      status: clubSchedule.status,
      media: mediaItems,
    })
    .from(clubSchedule)
    .innerJoin(mediaItems, eq(clubSchedule.mediaItemId, mediaItems.id))
    .where(eq(clubSchedule.clubId, clubId))
    .orderBy(asc(clubSchedule.order));

  return c.json(items);
});

// Add media to schedule
const addToScheduleSchema = z.object({
  mediaItemId: z.string().uuid(),
  scheduledDate: z.string().optional(),
});

scheduleRouter.post(
  "/:clubId/schedule",
  zValidator("json", addToScheduleSchema),
  async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const clubId = c.req.param("clubId");
    const user = c.get("user");
    const body = c.req.valid("json");

    // Verify admin
    const [membership] = await db
      .select()
      .from(clubMembers)
      .where(
        and(
          eq(clubMembers.clubId, clubId),
          eq(clubMembers.userId, user.id),
          eq(clubMembers.role, "admin")
        )
      );

    if (!membership) return c.json({ error: "Forbidden" }, 403);

    // Get next order number
    const existing = await db
      .select({ order: clubSchedule.order })
      .from(clubSchedule)
      .where(eq(clubSchedule.clubId, clubId));

    const nextOrder = existing.length > 0
      ? Math.max(...existing.map((e) => e.order)) + 1
      : 0;

    const [item] = await db
      .insert(clubSchedule)
      .values({
        clubId,
        mediaItemId: body.mediaItemId,
        order: nextOrder,
        scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : null,
      })
      .returning();

    return c.json(item, 201);
  }
);

// Update schedule item status
const updateScheduleSchema = z.object({
  status: z.enum(["upcoming", "current", "completed"]),
});

scheduleRouter.patch(
  "/:clubId/schedule/:itemId",
  zValidator("json", updateScheduleSchema),
  async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const itemId = c.req.param("itemId");
    const body = c.req.valid("json");

    const [updated] = await db
      .update(clubSchedule)
      .set({ status: body.status })
      .where(eq(clubSchedule.id, itemId))
      .returning();

    if (!updated) return c.json({ error: "Not found" }, 404);

    return c.json(updated);
  }
);

export { scheduleRouter };
```

**Step 2: Mount schedule routes**

Add to `apps/api/src/index.ts`:

```ts
import { scheduleRouter } from "./routes/schedule";

app.route("/api/clubs", scheduleRouter);
```

**Step 3: Commit**

```bash
git add apps/api/src/routes/schedule.ts apps/api/src/index.ts
git commit -m "feat: add club schedule API for managing reading/watch lists"
```

---

## Task 7: Events & RSVP API

**Files:**
- Create: `apps/api/src/routes/events.ts`
- Modify: `apps/api/src/index.ts`

**Step 1: Create events routes**

Create `apps/api/src/routes/events.ts`:

```ts
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, and, asc } from "drizzle-orm";
import { createDb } from "../db";
import {
  events,
  rsvps,
  users,
  clubMembers,
  clubSchedule,
  mediaItems,
} from "../db/schema";
import { authMiddleware } from "../lib/auth-middleware";

type Env = {
  Bindings: { DATABASE_URL: string; BETTER_AUTH_SECRET: string; BETTER_AUTH_URL: string; GOOGLE_CLIENT_ID: string; GOOGLE_CLIENT_SECRET: string };
  Variables: { user: { id: string; name: string; email: string; image: string | null } };
};

const eventsRouter = new Hono<Env>();
eventsRouter.use("/*", authMiddleware);

// List club events
eventsRouter.get("/clubs/:clubId/events", async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const clubId = c.req.param("clubId");

  const clubEvents = await db
    .select()
    .from(events)
    .where(eq(events.clubId, clubId))
    .orderBy(asc(events.startsAt));

  return c.json(clubEvents);
});

// Create event
const createEventSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  location: z.string().optional(),
  startsAt: z.string(),
  endsAt: z.string().optional(),
  scheduleItemId: z.string().uuid().optional(),
});

eventsRouter.post(
  "/clubs/:clubId/events",
  zValidator("json", createEventSchema),
  async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const clubId = c.req.param("clubId");
    const user = c.get("user");
    const body = c.req.valid("json");

    // Verify admin
    const [membership] = await db
      .select()
      .from(clubMembers)
      .where(
        and(
          eq(clubMembers.clubId, clubId),
          eq(clubMembers.userId, user.id),
          eq(clubMembers.role, "admin")
        )
      );

    if (!membership) return c.json({ error: "Forbidden" }, 403);

    const [event] = await db
      .insert(events)
      .values({
        clubId,
        scheduleItemId: body.scheduleItemId ?? null,
        title: body.title,
        description: body.description ?? null,
        location: body.location ?? null,
        startsAt: new Date(body.startsAt),
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
      })
      .returning();

    return c.json(event, 201);
  }
);

// Get event detail with RSVPs
eventsRouter.get("/events/:eventId", async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const eventId = c.req.param("eventId");

  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.id, eventId));

  if (!event) return c.json({ error: "Not found" }, 404);

  // Get linked media item if any
  let media = null;
  if (event.scheduleItemId) {
    const [scheduleItem] = await db
      .select({ media: mediaItems })
      .from(clubSchedule)
      .innerJoin(mediaItems, eq(clubSchedule.mediaItemId, mediaItems.id))
      .where(eq(clubSchedule.id, event.scheduleItemId));
    media = scheduleItem?.media ?? null;
  }

  const eventRsvps = await db
    .select({
      status: rsvps.status,
      user: { id: users.id, name: users.name, image: users.image },
    })
    .from(rsvps)
    .innerJoin(users, eq(rsvps.userId, users.id))
    .where(eq(rsvps.eventId, eventId));

  return c.json({ ...event, media, rsvps: eventRsvps });
});

// RSVP to event
const rsvpSchema = z.object({
  status: z.enum(["going", "maybe", "not_going"]),
});

eventsRouter.post(
  "/events/:eventId/rsvp",
  zValidator("json", rsvpSchema),
  async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const eventId = c.req.param("eventId");
    const user = c.get("user");
    const body = c.req.valid("json");

    // Upsert RSVP
    const [existing] = await db
      .select()
      .from(rsvps)
      .where(and(eq(rsvps.eventId, eventId), eq(rsvps.userId, user.id)));

    if (existing) {
      await db
        .update(rsvps)
        .set({ status: body.status })
        .where(and(eq(rsvps.eventId, eventId), eq(rsvps.userId, user.id)));
    } else {
      await db.insert(rsvps).values({
        eventId,
        userId: user.id,
        status: body.status,
      });
    }

    return c.json({ status: body.status });
  }
);

export { eventsRouter };
```

**Step 2: Mount events routes**

Add to `apps/api/src/index.ts`:

```ts
import { eventsRouter } from "./routes/events";

app.route("/api", eventsRouter);
```

**Step 3: Commit**

```bash
git add apps/api/src/routes/events.ts apps/api/src/index.ts
git commit -m "feat: add events and RSVP API"
```

---

## Task 8: Reviews API

**Files:**
- Create: `apps/api/src/routes/reviews.ts`
- Modify: `apps/api/src/index.ts`

**Step 1: Create reviews routes**

Create `apps/api/src/routes/reviews.ts`:

```ts
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { createDb } from "../db";
import { reviews, users } from "../db/schema";
import { authMiddleware } from "../lib/auth-middleware";

type Env = {
  Bindings: { DATABASE_URL: string; BETTER_AUTH_SECRET: string; BETTER_AUTH_URL: string; GOOGLE_CLIENT_ID: string; GOOGLE_CLIENT_SECRET: string };
  Variables: { user: { id: string; name: string; email: string; image: string | null } };
};

const reviewsRouter = new Hono<Env>();

// Post review
const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  text: z.string().optional(),
  clubId: z.string().uuid().optional(),
});

reviewsRouter.post(
  "/media/:mediaId/reviews",
  authMiddleware,
  zValidator("json", createReviewSchema),
  async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const mediaItemId = c.req.param("mediaId");
    const user = c.get("user");
    const body = c.req.valid("json");

    const [review] = await db
      .insert(reviews)
      .values({
        userId: user.id,
        mediaItemId,
        clubId: body.clubId ?? null,
        rating: body.rating,
        text: body.text ?? null,
      })
      .returning();

    return c.json(review, 201);
  }
);

// Get reviews for a media item
reviewsRouter.get("/media/:mediaId/reviews", async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const mediaItemId = c.req.param("mediaId");

  const mediaReviews = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      text: reviews.text,
      createdAt: reviews.createdAt,
      clubId: reviews.clubId,
      user: { id: users.id, name: users.name, image: users.image },
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .where(eq(reviews.mediaItemId, mediaItemId));

  return c.json(mediaReviews);
});

export { reviewsRouter };
```

**Step 2: Mount and commit**

```ts
import { reviewsRouter } from "./routes/reviews";
app.route("/api", reviewsRouter);
```

```bash
git add apps/api/src/routes/reviews.ts apps/api/src/index.ts
git commit -m "feat: add reviews API with ratings"
```

---

## Task 9: Discussions API

**Files:**
- Create: `apps/api/src/routes/discussions.ts`
- Modify: `apps/api/src/index.ts`

**Step 1: Create discussions routes**

Create `apps/api/src/routes/discussions.ts`:

```ts
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, desc } from "drizzle-orm";
import { createDb } from "../db";
import { discussionThreads, discussionComments, users } from "../db/schema";
import { authMiddleware } from "../lib/auth-middleware";

type Env = {
  Bindings: { DATABASE_URL: string; BETTER_AUTH_SECRET: string; BETTER_AUTH_URL: string; GOOGLE_CLIENT_ID: string; GOOGLE_CLIENT_SECRET: string };
  Variables: { user: { id: string; name: string; email: string; image: string | null } };
};

const discussionsRouter = new Hono<Env>();
discussionsRouter.use("/*", authMiddleware);

// List threads for a club
discussionsRouter.get("/clubs/:clubId/discussions", async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const clubId = c.req.param("clubId");

  const threads = await db
    .select({
      id: discussionThreads.id,
      title: discussionThreads.title,
      mediaItemId: discussionThreads.mediaItemId,
      eventId: discussionThreads.eventId,
      createdAt: discussionThreads.createdAt,
      createdBy: { id: users.id, name: users.name, image: users.image },
    })
    .from(discussionThreads)
    .innerJoin(users, eq(discussionThreads.createdBy, users.id))
    .where(eq(discussionThreads.clubId, clubId))
    .orderBy(desc(discussionThreads.createdAt));

  return c.json(threads);
});

// Create thread
const createThreadSchema = z.object({
  title: z.string().min(1).max(255),
  mediaItemId: z.string().uuid().optional(),
  eventId: z.string().uuid().optional(),
});

discussionsRouter.post(
  "/clubs/:clubId/discussions",
  zValidator("json", createThreadSchema),
  async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const clubId = c.req.param("clubId");
    const user = c.get("user");
    const body = c.req.valid("json");

    const [thread] = await db
      .insert(discussionThreads)
      .values({
        clubId,
        title: body.title,
        mediaItemId: body.mediaItemId ?? null,
        eventId: body.eventId ?? null,
        createdBy: user.id,
      })
      .returning();

    return c.json(thread, 201);
  }
);

// Get thread with comments
discussionsRouter.get("/discussions/:threadId", async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const threadId = c.req.param("threadId");

  const [thread] = await db
    .select()
    .from(discussionThreads)
    .where(eq(discussionThreads.id, threadId));

  if (!thread) return c.json({ error: "Not found" }, 404);

  const comments = await db
    .select({
      id: discussionComments.id,
      text: discussionComments.text,
      createdAt: discussionComments.createdAt,
      user: { id: users.id, name: users.name, image: users.image },
    })
    .from(discussionComments)
    .innerJoin(users, eq(discussionComments.userId, users.id))
    .where(eq(discussionComments.threadId, threadId))
    .orderBy(discussionComments.createdAt);

  return c.json({ ...thread, comments });
});

// Add comment
const addCommentSchema = z.object({
  text: z.string().min(1),
});

discussionsRouter.post(
  "/discussions/:threadId/comments",
  zValidator("json", addCommentSchema),
  async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const threadId = c.req.param("threadId");
    const user = c.get("user");
    const body = c.req.valid("json");

    const [comment] = await db
      .insert(discussionComments)
      .values({
        threadId,
        userId: user.id,
        text: body.text,
      })
      .returning();

    return c.json(comment, 201);
  }
);

export { discussionsRouter };
```

**Step 2: Mount and commit**

```ts
import { discussionsRouter } from "./routes/discussions";
app.route("/api", discussionsRouter);
```

```bash
git add apps/api/src/routes/discussions.ts apps/api/src/index.ts
git commit -m "feat: add discussions API with threads and comments"
```

---

## Task 10: Users, Shelves & Progress API

**Files:**
- Create: `apps/api/src/routes/users.ts`
- Create: `apps/api/src/routes/feed.ts`
- Modify: `apps/api/src/index.ts`

**Step 1: Create users routes (profile, shelf, progress)**

Create `apps/api/src/routes/users.ts`:

```ts
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, and, desc } from "drizzle-orm";
import { createDb } from "../db";
import {
  users,
  userShelves,
  mediaItems,
  reviews,
  clubMembers,
  clubs,
  clubMemberProgress,
  activityEvents,
} from "../db/schema";
import { authMiddleware } from "../lib/auth-middleware";

type Env = {
  Bindings: { DATABASE_URL: string; BETTER_AUTH_SECRET: string; BETTER_AUTH_URL: string; GOOGLE_CLIENT_ID: string; GOOGLE_CLIENT_SECRET: string };
  Variables: { user: { id: string; name: string; email: string; image: string | null } };
};

const usersRouter = new Hono<Env>();

// Get user profile (public)
usersRouter.get("/users/:userId", async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const userId = c.req.param("userId");

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      image: users.image,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) return c.json({ error: "Not found" }, 404);

  // Get user's clubs
  const userClubs = await db
    .select({ club: clubs, role: clubMembers.role })
    .from(clubMembers)
    .innerJoin(clubs, eq(clubMembers.clubId, clubs.id))
    .where(eq(clubMembers.userId, userId));

  // Get review count
  const userReviews = await db
    .select()
    .from(reviews)
    .where(eq(reviews.userId, userId));

  return c.json({
    ...user,
    clubs: userClubs,
    reviewCount: userReviews.length,
  });
});

// Get user's shelf
usersRouter.get("/users/:userId/shelf", async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const userId = c.req.param("userId");

  const shelf = await db
    .select({
      status: userShelves.status,
      addedAt: userShelves.addedAt,
      media: mediaItems,
    })
    .from(userShelves)
    .innerJoin(mediaItems, eq(userShelves.mediaItemId, mediaItems.id))
    .where(eq(userShelves.userId, userId))
    .orderBy(desc(userShelves.addedAt));

  return c.json(shelf);
});

// Add/update shelf item
const shelfSchema = z.object({
  mediaItemId: z.string().uuid(),
  status: z.enum(["want", "reading", "watched", "finished"]),
});

usersRouter.post(
  "/shelf",
  authMiddleware,
  zValidator("json", shelfSchema),
  async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const user = c.get("user");
    const body = c.req.valid("json");

    // Upsert
    const [existing] = await db
      .select()
      .from(userShelves)
      .where(
        and(
          eq(userShelves.userId, user.id),
          eq(userShelves.mediaItemId, body.mediaItemId)
        )
      );

    if (existing) {
      await db
        .update(userShelves)
        .set({ status: body.status })
        .where(
          and(
            eq(userShelves.userId, user.id),
            eq(userShelves.mediaItemId, body.mediaItemId)
          )
        );
    } else {
      await db.insert(userShelves).values({
        userId: user.id,
        mediaItemId: body.mediaItemId,
        status: body.status,
      });
    }

    // Log activity
    await db.insert(activityEvents).values({
      userId: user.id,
      type: "shelf_update",
      payload: { mediaItemId: body.mediaItemId, status: body.status },
    });

    return c.json({ status: body.status });
  }
);

// Update club member progress
const progressSchema = z.object({
  mediaItemId: z.string().uuid(),
  status: z.enum(["not_started", "in_progress", "finished"]),
});

usersRouter.post(
  "/clubs/:clubId/progress",
  authMiddleware,
  zValidator("json", progressSchema),
  async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const clubId = c.req.param("clubId");
    const user = c.get("user");
    const body = c.req.valid("json");

    // Upsert
    const [existing] = await db
      .select()
      .from(clubMemberProgress)
      .where(
        and(
          eq(clubMemberProgress.clubId, clubId),
          eq(clubMemberProgress.userId, user.id),
          eq(clubMemberProgress.mediaItemId, body.mediaItemId)
        )
      );

    if (existing) {
      await db
        .update(clubMemberProgress)
        .set({ status: body.status, updatedAt: new Date() })
        .where(
          and(
            eq(clubMemberProgress.clubId, clubId),
            eq(clubMemberProgress.userId, user.id),
            eq(clubMemberProgress.mediaItemId, body.mediaItemId)
          )
        );
    } else {
      await db.insert(clubMemberProgress).values({
        clubId,
        userId: user.id,
        mediaItemId: body.mediaItemId,
        status: body.status,
      });
    }

    // Log activity
    await db.insert(activityEvents).values({
      userId: user.id,
      clubId,
      type: "progress_update",
      payload: { mediaItemId: body.mediaItemId, status: body.status },
    });

    return c.json({ status: body.status });
  }
);

export { usersRouter };
```

**Step 2: Create activity feed route**

Create `apps/api/src/routes/feed.ts`:

```ts
import { Hono } from "hono";
import { eq, desc, inArray } from "drizzle-orm";
import { createDb } from "../db";
import { activityEvents, clubMembers, users, clubs } from "../db/schema";
import { authMiddleware } from "../lib/auth-middleware";

type Env = {
  Bindings: { DATABASE_URL: string; BETTER_AUTH_SECRET: string; BETTER_AUTH_URL: string; GOOGLE_CLIENT_ID: string; GOOGLE_CLIENT_SECRET: string };
  Variables: { user: { id: string; name: string; email: string; image: string | null } };
};

const feedRouter = new Hono<Env>();
feedRouter.use("/*", authMiddleware);

feedRouter.get("/feed", async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const user = c.get("user");

  // Get user's club IDs
  const memberships = await db
    .select({ clubId: clubMembers.clubId })
    .from(clubMembers)
    .where(eq(clubMembers.userId, user.id));

  const clubIds = memberships.map((m) => m.clubId);

  if (clubIds.length === 0) return c.json([]);

  // Get recent activity from those clubs
  const feed = await db
    .select({
      id: activityEvents.id,
      type: activityEvents.type,
      payload: activityEvents.payload,
      createdAt: activityEvents.createdAt,
      user: { id: users.id, name: users.name, image: users.image },
      club: { id: clubs.id, name: clubs.name },
    })
    .from(activityEvents)
    .innerJoin(users, eq(activityEvents.userId, users.id))
    .leftJoin(clubs, eq(activityEvents.clubId, clubs.id))
    .where(inArray(activityEvents.clubId, clubIds))
    .orderBy(desc(activityEvents.createdAt))
    .limit(50);

  return c.json(feed);
});

export { feedRouter };
```

**Step 3: Mount all routes and commit**

Add to `apps/api/src/index.ts`:

```ts
import { usersRouter } from "./routes/users";
import { feedRouter } from "./routes/feed";

app.route("/api", usersRouter);
app.route("/api", feedRouter);
```

**Step 4: Commit**

```bash
git add apps/api/src/routes/users.ts apps/api/src/routes/feed.ts apps/api/src/index.ts
git commit -m "feat: add users, shelves, progress tracking, and activity feed API"
```

---

## Task 11: Frontend — Auth Setup

**Files:**
- Modify: `apps/web/src/lib/api.ts`
- Create: `apps/web/src/lib/auth-client.ts`
- Create: `apps/web/src/routes/auth/login.tsx`
- Create: `apps/web/src/routes/auth/callback.tsx`
- Modify: `apps/web/src/routes/__root.tsx`

**Step 1: Install Better Auth client**

```bash
cd apps/web
bun add better-auth
```

**Step 2: Create auth client**

Create `apps/web/src/lib/auth-client.ts`:

```ts
import { createAuthClient } from "better-auth/react";
import { API_URL } from "./api";

export const authClient = createAuthClient({
  baseURL: API_URL,
});

export const { signIn, signUp, signOut, useSession } = authClient;
```

**Step 3: Update API client to include credentials**

Update `apps/web/src/lib/api.ts`:

```ts
export const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:8787";

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}
```

**Step 4: Create login page**

Create `apps/web/src/routes/auth/login.tsx`:

```tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { signIn, signUp } from "@/lib/auth-client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/auth/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      if (isSignUp) {
        await signUp.email({ email, password, name });
      } else {
        await signIn.email({ email, password });
      }
      navigate({ to: "/" });
    } catch (err) {
      setError("Authentication failed. Please try again.");
    }
  }

  async function handleGoogleSignIn() {
    await signIn.social({ provider: "google", callbackURL: "/" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Shelf</h1>
          <p className="text-muted-foreground mt-1">
            {isSignUp ? "Create your account" : "Welcome back"}
          </p>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
        >
          Continue with Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={isSignUp}
              />
            </div>
          )}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full">
            {isSignUp ? "Sign Up" : "Sign In"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            className="underline text-foreground"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? "Sign in" : "Sign up"}
          </button>
        </p>
      </Card>
    </div>
  );
}
```

**Step 5: Update root layout with auth context**

Update `apps/web/src/routes/__root.tsx`:

```tsx
import {
  HeadContent,
  Scripts,
  Outlet,
  createRootRoute,
} from "@tanstack/react-router";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Shelf — Book & Film Clubs" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}
```

**Step 6: Commit**

```bash
git add apps/web/src/
git commit -m "feat: add auth pages and Better Auth client setup"
```

---

## Task 12: Frontend — Layout & Navigation

**Files:**
- Create: `apps/web/src/components/layout/app-shell.tsx`
- Create: `apps/web/src/components/layout/nav.tsx`
- Modify: `apps/web/src/routes/index.tsx`

**Step 1: Create nav component**

Create `apps/web/src/components/layout/nav.tsx`:

```tsx
import { Link } from "@tanstack/react-router";
import { useSession, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function Nav() {
  const { data: session } = useSession();

  return (
    <header className="border-b">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-xl font-bold">
          Shelf
        </Link>

        <div className="flex items-center gap-4">
          {session?.user ? (
            <>
              <Link
                to="/clubs/new"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                New Club
              </Link>
              <Link
                to="/users/$userId"
                params={{ userId: session.user.id }}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Profile
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
              >
                Sign Out
              </Button>
            </>
          ) : (
            <Link to="/auth/login">
              <Button size="sm">Sign In</Button>
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
```

**Step 2: Create app shell**

Create `apps/web/src/components/layout/app-shell.tsx`:

```tsx
import { Nav } from "./nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
```

**Step 3: Update home page**

Update `apps/web/src/routes/index.tsx`:

```tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSession } from "@/lib/auth-client";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({ component: HomePage });

function HomePage() {
  const { data: session } = useSession();

  if (!session?.user) {
    return <LandingPage />;
  }

  return <Dashboard />;
}

function LandingPage() {
  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Your clubs, your schedule
        </h1>
        <p className="mt-4 max-w-lg text-lg text-muted-foreground">
          Create book clubs and film clubs with recurring events, reviews, and
          discussions. Share with friends via invite links.
        </p>
        <Link to="/auth/login" className="mt-8">
          <Button size="lg">Get Started</Button>
        </Link>
      </div>
    </AppShell>
  );
}

function Dashboard() {
  const [clubs, setClubs] = useState<
    Array<{ club: { id: string; name: string; mediaType: string }; role: string }>
  >([]);

  useEffect(() => {
    api<typeof clubs>("/api/clubs").then(setClubs).catch(console.error);
  }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Your Clubs</h2>
          <Link to="/clubs/new">
            <Button>Create Club</Button>
          </Link>
        </div>

        {clubs.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            <p>No clubs yet. Create one or join with an invite link!</p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {clubs.map(({ club, role }) => (
              <Link key={club.id} to="/clubs/$clubId" params={{ clubId: club.id }}>
                <Card className="p-4 hover:bg-accent transition-colors">
                  <h3 className="font-semibold">{club.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {club.mediaType === "book" ? "Book Club" : "Film Club"} · {role}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
```

**Step 4: Commit**

```bash
git add apps/web/src/
git commit -m "feat: add app shell, navigation, and home page with dashboard"
```

---

## Task 13: Frontend — Club Pages

**Files:**
- Create: `apps/web/src/routes/clubs/new.tsx`
- Create: `apps/web/src/routes/clubs/$clubId.tsx`
- Create: `apps/web/src/routes/join/$inviteCode.tsx`

**Step 1: Create new club page**

Create `apps/web/src/routes/clubs/new.tsx`:

```tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";

export const Route = createFileRoute("/clubs/new")({
  component: NewClubPage,
});

function NewClubPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [mediaType, setMediaType] = useState<"book" | "film">("book");
  const [recurrenceRule, setRecurrenceRule] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const club = await api<{ id: string }>("/api/clubs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, mediaType, recurrenceRule }),
    });

    navigate({ to: "/clubs/$clubId", params: { clubId: club.id } });
  }

  return (
    <AppShell>
      <Card className="mx-auto max-w-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Create a Club</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Club Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Friday Film Club"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this club about?"
            />
          </div>

          <div>
            <Label>Media Type</Label>
            <div className="flex gap-2 mt-1">
              <Button
                type="button"
                variant={mediaType === "book" ? "default" : "outline"}
                onClick={() => setMediaType("book")}
              >
                Books
              </Button>
              <Button
                type="button"
                variant={mediaType === "film" ? "default" : "outline"}
                onClick={() => setMediaType("film")}
              >
                Films
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="recurrence">Recurrence (optional)</Label>
            <Input
              id="recurrence"
              value={recurrenceRule}
              onChange={(e) => setRecurrenceRule(e.target.value)}
              placeholder="e.g. Every 2 weeks on Thursday at 19:00"
            />
          </div>

          <Button type="submit" className="w-full">
            Create Club
          </Button>
        </form>
      </Card>
    </AppShell>
  );
}
```

**Step 2: Create club detail page**

Create `apps/web/src/routes/clubs/$clubId.tsx`:

```tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

type Club = {
  id: string;
  name: string;
  description: string | null;
  mediaType: "book" | "film";
  inviteCode: string;
  recurrenceRule: string | null;
  members: Array<{
    user: { id: string; name: string; image: string | null };
    role: string;
    joinedAt: string;
  }>;
};

type ScheduleItem = {
  id: string;
  order: number;
  scheduledDate: string | null;
  status: string;
  media: {
    id: string;
    title: string;
    authorOrDirector: string | null;
    coverUrl: string | null;
    year: number | null;
  };
};

export const Route = createFileRoute("/clubs/$clubId")({
  component: ClubDetailPage,
});

function ClubDetailPage() {
  const { clubId } = Route.useParams();
  const [club, setClub] = useState<Club | null>(null);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api<Club>(`/api/clubs/${clubId}`).then(setClub).catch(console.error);
    api<ScheduleItem[]>(`/api/clubs/${clubId}/schedule`)
      .then(setSchedule)
      .catch(console.error);
  }, [clubId]);

  if (!club) return <AppShell><p>Loading...</p></AppShell>;

  function copyInviteLink() {
    const link = `${window.location.origin}/join/${club!.inviteCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{club.name}</h1>
            {club.description && (
              <p className="text-muted-foreground mt-1">{club.description}</p>
            )}
            <div className="flex gap-2 mt-2">
              <Badge variant="secondary">
                {club.mediaType === "book" ? "Book Club" : "Film Club"}
              </Badge>
              <Badge variant="outline">{club.members.length} members</Badge>
            </div>
          </div>
          <Button variant="outline" onClick={copyInviteLink}>
            {copied ? "Copied!" : "Copy Invite Link"}
          </Button>
        </div>

        {/* Schedule */}
        <section>
          <h2 className="text-xl font-semibold mb-3">Schedule</h2>
          {schedule.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground">
              No items scheduled yet.
            </Card>
          ) : (
            <div className="space-y-3">
              {schedule.map((item) => (
                <Link
                  key={item.id}
                  to="/media/$mediaId"
                  params={{ mediaId: item.media.id }}
                >
                  <Card className="flex gap-4 p-4 hover:bg-accent transition-colors">
                    {item.media.coverUrl && (
                      <img
                        src={item.media.coverUrl}
                        alt={item.media.title}
                        className="w-12 h-16 object-cover rounded"
                      />
                    )}
                    <div>
                      <h3 className="font-medium">{item.media.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {item.media.authorOrDirector}
                        {item.media.year && ` (${item.media.year})`}
                      </p>
                      <Badge
                        variant={
                          item.status === "current"
                            ? "default"
                            : "outline"
                        }
                        className="mt-1"
                      >
                        {item.status}
                      </Badge>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Members */}
        <section>
          <h2 className="text-xl font-semibold mb-3">Members</h2>
          <div className="flex flex-wrap gap-3">
            {club.members.map((m) => (
              <Link
                key={m.user.id}
                to="/users/$userId"
                params={{ userId: m.user.id }}
              >
                <div className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm hover:bg-accent transition-colors">
                  {m.user.image ? (
                    <img
                      src={m.user.image}
                      alt={m.user.name}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-muted" />
                  )}
                  <span>{m.user.name}</span>
                  {m.role === "admin" && (
                    <Badge variant="secondary" className="text-xs">
                      admin
                    </Badge>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
```

**Step 3: Create join page**

Create `apps/web/src/routes/join/$inviteCode.tsx`:

```tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api, API_URL } from "@/lib/api";
import { useSession } from "@/lib/auth-client";

type ClubPreview = {
  id: string;
  name: string;
  description: string | null;
  mediaType: string;
  memberCount: number;
};

export const Route = createFileRoute("/join/$inviteCode")({
  component: JoinPage,
});

function JoinPage() {
  const { inviteCode } = Route.useParams();
  const navigate = useNavigate();
  const { data: session } = useSession();
  const [club, setClub] = useState<ClubPreview | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/api/join/${inviteCode}`)
      .then((r) => r.json())
      .then(setClub)
      .catch(() => setError("Invalid invite link"));
  }, [inviteCode]);

  async function handleJoin() {
    if (!session?.user) {
      navigate({ to: "/auth/login" });
      return;
    }

    const result = await api<{ club: { id: string } }>(
      `/api/clubs/join/${inviteCode}`,
      { method: "POST" }
    );

    navigate({ to: "/clubs/$clubId", params: { clubId: result.club.id } });
  }

  if (error) {
    return (
      <AppShell>
        <p className="text-center text-muted-foreground py-20">{error}</p>
      </AppShell>
    );
  }

  if (!club) {
    return <AppShell><p>Loading...</p></AppShell>;
  }

  return (
    <AppShell>
      <Card className="mx-auto max-w-md p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold">{club.name}</h1>
        {club.description && (
          <p className="text-muted-foreground">{club.description}</p>
        )}
        <div className="flex justify-center gap-2">
          <Badge variant="secondary">
            {club.mediaType === "book" ? "Book Club" : "Film Club"}
          </Badge>
          <Badge variant="outline">{club.memberCount} members</Badge>
        </div>
        <Button onClick={handleJoin} className="w-full" size="lg">
          {session?.user ? "Join Club" : "Sign in to Join"}
        </Button>
      </Card>
    </AppShell>
  );
}
```

**Step 4: Commit**

```bash
git add apps/web/src/routes/
git commit -m "feat: add club creation, detail, and invite join pages"
```

---

## Task 14: Frontend — Media Search & Detail

**Files:**
- Create: `apps/web/src/components/media/media-search.tsx`
- Create: `apps/web/src/routes/media/$mediaId.tsx`

**Step 1: Create media search component**

Create `apps/web/src/components/media/media-search.tsx`:

```tsx
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

type SearchResult = {
  externalId: string;
  title: string;
  authorOrDirector: string | null;
  coverUrl: string | null;
  year: number | null;
  description: string | null;
};

type Props = {
  mediaType: "book" | "film";
  onSelect: (item: SearchResult) => void;
};

export function MediaSearch({ mediaType, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const data = await api<SearchResult[]>(
        `/api/media/search?q=${encodeURIComponent(query)}&type=${mediaType}`
      );
      setResults(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${mediaType}s...`}
        />
        <Button type="submit" disabled={loading}>
          {loading ? "..." : "Search"}
        </Button>
      </form>

      {results.map((item) => (
        <Card
          key={item.externalId}
          className="flex gap-3 p-3 cursor-pointer hover:bg-accent transition-colors"
          onClick={() => onSelect(item)}
        >
          {item.coverUrl && (
            <img
              src={item.coverUrl}
              alt={item.title}
              className="w-10 h-14 object-cover rounded"
            />
          )}
          <div>
            <p className="font-medium">{item.title}</p>
            <p className="text-sm text-muted-foreground">
              {item.authorOrDirector}
              {item.year && ` (${item.year})`}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}
```

**Step 2: Create media detail page**

Create `apps/web/src/routes/media/$mediaId.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { useSession } from "@/lib/auth-client";

type MediaDetail = {
  id: string;
  title: string;
  authorOrDirector: string | null;
  coverUrl: string | null;
  year: number | null;
  description: string | null;
  mediaType: string;
  reviews: Array<{
    id: string;
    rating: number;
    text: string | null;
    createdAt: string;
    user: { id: string; name: string; image: string | null };
  }>;
};

export const Route = createFileRoute("/media/$mediaId")({
  component: MediaDetailPage,
});

function MediaDetailPage() {
  const { mediaId } = Route.useParams();
  const { data: session } = useSession();
  const [media, setMedia] = useState<MediaDetail | null>(null);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  useEffect(() => {
    api<MediaDetail>(`/api/media/${mediaId}`)
      .then(setMedia)
      .catch(console.error);
  }, [mediaId]);

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) return;

    await api(`/api/media/${mediaId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, text: reviewText || undefined }),
    });

    // Refresh
    const updated = await api<MediaDetail>(`/api/media/${mediaId}`);
    setMedia(updated);
    setRating(0);
    setReviewText("");
  }

  if (!media) return <AppShell><p>Loading...</p></AppShell>;

  const avgRating =
    media.reviews.length > 0
      ? (
          media.reviews.reduce((sum, r) => sum + r.rating, 0) /
          media.reviews.length
        ).toFixed(1)
      : "—";

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Media header */}
        <div className="flex gap-6">
          {media.coverUrl && (
            <img
              src={media.coverUrl}
              alt={media.title}
              className="w-32 h-48 object-cover rounded-lg shadow"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold">{media.title}</h1>
            <p className="text-muted-foreground mt-1">
              {media.authorOrDirector}
              {media.year && ` (${media.year})`}
            </p>
            <p className="text-lg mt-2">
              {avgRating} avg · {media.reviews.length} reviews
            </p>
            {media.description && (
              <p className="text-sm text-muted-foreground mt-3 max-w-lg">
                {media.description}
              </p>
            )}
          </div>
        </div>

        {/* Write review */}
        {session?.user && (
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Write a Review</h3>
            <form onSubmit={submitReview} className="space-y-3">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`text-2xl ${
                      star <= rating
                        ? "text-primary"
                        : "text-muted-foreground/30"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <Textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="What did you think?"
              />
              <Button type="submit" disabled={rating === 0}>
                Post Review
              </Button>
            </form>
          </Card>
        )}

        {/* Reviews list */}
        <section>
          <h2 className="text-xl font-semibold mb-3">Reviews</h2>
          {media.reviews.length === 0 ? (
            <p className="text-muted-foreground">No reviews yet.</p>
          ) : (
            <div className="space-y-3">
              {media.reviews.map((review) => (
                <Card key={review.id} className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">{review.user.name}</span>
                    <span className="text-primary">
                      {"★".repeat(review.rating)}
                    </span>
                  </div>
                  {review.text && <p className="text-sm">{review.text}</p>}
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
```

**Step 3: Commit**

```bash
git add apps/web/src/
git commit -m "feat: add media search component and media detail page with reviews"
```

---

## Task 15: Frontend — Events & RSVP

**Files:**
- Create: `apps/web/src/routes/events/$eventId.tsx`

**Step 1: Create event detail page**

Create `apps/web/src/routes/events/$eventId.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useSession } from "@/lib/auth-client";

type EventDetail = {
  id: string;
  clubId: string;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: string;
  endsAt: string | null;
  media: {
    id: string;
    title: string;
    coverUrl: string | null;
    authorOrDirector: string | null;
  } | null;
  rsvps: Array<{
    status: string;
    user: { id: string; name: string; image: string | null };
  }>;
};

export const Route = createFileRoute("/events/$eventId")({
  component: EventDetailPage,
});

function EventDetailPage() {
  const { eventId } = Route.useParams();
  const { data: session } = useSession();
  const [event, setEvent] = useState<EventDetail | null>(null);

  useEffect(() => {
    api<EventDetail>(`/api/events/${eventId}`)
      .then(setEvent)
      .catch(console.error);
  }, [eventId]);

  async function handleRsvp(status: "going" | "maybe" | "not_going") {
    await api(`/api/events/${eventId}/rsvp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    const updated = await api<EventDetail>(`/api/events/${eventId}`);
    setEvent(updated);
  }

  if (!event) return <AppShell><p>Loading...</p></AppShell>;

  const myRsvp = event.rsvps.find((r) => r.user.id === session?.user?.id);
  const going = event.rsvps.filter((r) => r.status === "going");

  return (
    <AppShell>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-3xl font-bold">{event.title}</h1>
          <p className="text-muted-foreground mt-1">
            {new Date(event.startsAt).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
          {event.location && (
            <p className="text-sm mt-2">{event.location}</p>
          )}
        </div>

        {event.description && <p>{event.description}</p>}

        {/* Linked media */}
        {event.media && (
          <Card className="flex gap-4 p-4">
            {event.media.coverUrl && (
              <img
                src={event.media.coverUrl}
                alt={event.media.title}
                className="w-12 h-16 object-cover rounded"
              />
            )}
            <div>
              <p className="font-medium">{event.media.title}</p>
              <p className="text-sm text-muted-foreground">
                {event.media.authorOrDirector}
              </p>
            </div>
          </Card>
        )}

        {/* RSVP buttons */}
        {session?.user && (
          <div className="flex gap-2">
            {(["going", "maybe", "not_going"] as const).map((status) => (
              <Button
                key={status}
                variant={myRsvp?.status === status ? "default" : "outline"}
                onClick={() => handleRsvp(status)}
              >
                {status === "not_going"
                  ? "Can't Go"
                  : status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        )}

        {/* Attendees */}
        <section>
          <h3 className="font-semibold mb-2">
            Going ({going.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {going.map((r) => (
              <Badge key={r.user.id} variant="secondary">
                {r.user.name}
              </Badge>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/routes/events/
git commit -m "feat: add event detail page with RSVP"
```

---

## Task 16: Frontend — User Profile & Shelf

**Files:**
- Create: `apps/web/src/routes/users/$userId.tsx`

**Step 1: Create user profile page**

Create `apps/web/src/routes/users/$userId.tsx`:

```tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

type UserProfile = {
  id: string;
  name: string;
  image: string | null;
  createdAt: string;
  clubs: Array<{ club: { id: string; name: string; mediaType: string }; role: string }>;
  reviewCount: number;
};

type ShelfItem = {
  status: string;
  addedAt: string;
  media: {
    id: string;
    title: string;
    authorOrDirector: string | null;
    coverUrl: string | null;
    year: number | null;
    mediaType: string;
  };
};

export const Route = createFileRoute("/users/$userId")({
  component: UserProfilePage,
});

function UserProfilePage() {
  const { userId } = Route.useParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [shelf, setShelf] = useState<ShelfItem[]>([]);

  useEffect(() => {
    api<UserProfile>(`/api/users/${userId}`).then(setProfile).catch(console.error);
    api<ShelfItem[]>(`/api/users/${userId}/shelf`).then(setShelf).catch(console.error);
  }, [userId]);

  if (!profile) return <AppShell><p>Loading...</p></AppShell>;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Profile header */}
        <div className="flex items-center gap-4">
          {profile.image ? (
            <img
              src={profile.image}
              alt={profile.name}
              className="w-16 h-16 rounded-full"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-muted" />
          )}
          <div>
            <h1 className="text-2xl font-bold">{profile.name}</h1>
            <p className="text-sm text-muted-foreground">
              {profile.clubs.length} clubs · {profile.reviewCount} reviews
            </p>
          </div>
        </div>

        {/* Clubs */}
        <section>
          <h2 className="text-xl font-semibold mb-3">Clubs</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {profile.clubs.map(({ club }) => (
              <Link key={club.id} to="/clubs/$clubId" params={{ clubId: club.id }}>
                <Card className="p-3 hover:bg-accent transition-colors">
                  <p className="font-medium">{club.name}</p>
                  <Badge variant="outline" className="mt-1">
                    {club.mediaType === "book" ? "Book" : "Film"}
                  </Badge>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Shelf */}
        <section>
          <h2 className="text-xl font-semibold mb-3">Shelf</h2>
          {shelf.length === 0 ? (
            <p className="text-muted-foreground">Nothing on the shelf yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {shelf.map((item) => (
                <Link
                  key={item.media.id}
                  to="/media/$mediaId"
                  params={{ mediaId: item.media.id }}
                >
                  <Card className="p-3 hover:bg-accent transition-colors">
                    <div className="flex gap-3">
                      {item.media.coverUrl && (
                        <img
                          src={item.media.coverUrl}
                          alt={item.media.title}
                          className="w-10 h-14 object-cover rounded"
                        />
                      )}
                      <div>
                        <p className="font-medium text-sm">{item.media.title}</p>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/routes/users/
git commit -m "feat: add user profile page with shelf display"
```

---

## Task 17: Final Wiring & Cleanup

**Files:**
- Modify: `apps/api/src/index.ts` (final version with all routes)
- Modify: `apps/web/src/routes/__root.tsx` (cleanup)

**Step 1: Ensure all API routes are mounted**

Final `apps/api/src/index.ts` should have all imports and route mounts. Verify:

```ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createAuth } from "./lib/auth";
import { clubsRouter, clubPreviewRouter } from "./routes/clubs";
import { mediaRouter } from "./routes/media";
import { scheduleRouter } from "./routes/schedule";
import { eventsRouter } from "./routes/events";
import { reviewsRouter } from "./routes/reviews";
import { discussionsRouter } from "./routes/discussions";
import { usersRouter } from "./routes/users";
import { feedRouter } from "./routes/feed";

// ... app setup, CORS ...

// Auth
app.on(["GET", "POST"], "/api/auth/**", (c) => {
  const auth = createAuth(c.env);
  return auth.handler(c.req.raw);
});

// Health check
app.get("/api/health", (c) => c.json({ status: "ok" }));

// Public routes
app.route("/api", clubPreviewRouter);

// Protected routes
app.route("/api/clubs", clubsRouter);
app.route("/api/clubs", scheduleRouter);
app.route("/api/media", mediaRouter);
app.route("/api", eventsRouter);
app.route("/api", reviewsRouter);
app.route("/api", discussionsRouter);
app.route("/api", usersRouter);
app.route("/api", feedRouter);

export default app;
```

**Step 2: Run both dev servers and smoke test**

```bash
bun run dev
```

Visit `http://localhost:3000` — should see the landing page. Test:
1. Navigate to `/auth/login`
2. Check `/api/health` returns OK
3. Verify TanStack Router generates routes correctly

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: wire up all API routes and verify dev servers"
```

---

## Summary of Tasks

| # | Task | Focus |
|---|------|-------|
| 1 | Project Setup & Dependencies | Monorepo config, install deps |
| 2 | Database Schema | Drizzle schema, all tables, migrations |
| 3 | Better Auth Setup | Auth config, middleware, Hono mount |
| 4 | Clubs API | CRUD, invite links, join flow |
| 5 | Media Search API | Open Library + TMDB proxy, upsert |
| 6 | Club Schedule API | Reading/watch list management |
| 7 | Events & RSVP API | Event CRUD, RSVP upsert |
| 8 | Reviews API | Review CRUD with ratings |
| 9 | Discussions API | Threads + comments |
| 10 | Users, Shelves & Progress API | Profile, shelf, progress, activity feed |
| 11 | Frontend — Auth Setup | Better Auth client, login page |
| 12 | Frontend — Layout & Navigation | App shell, nav, home/dashboard |
| 13 | Frontend — Club Pages | Create, detail, join pages |
| 14 | Frontend — Media Pages | Search component, detail page |
| 15 | Frontend — Events & RSVP | Event detail, RSVP buttons |
| 16 | Frontend — User Profile | Profile page with shelf |
| 17 | Final Wiring & Cleanup | Mount all routes, smoke test |

# Phase System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the Round/Phase state machine that drives club lifecycle through SELECTION → ACTIVE → EVENT → REVIEW phases.

**Architecture:** Phases are derived on-the-fly from round state + event timestamps (no cron). The `rounds` table tracks the lifecycle. The club page switches UI based on derived phase. Three selection modes (admin_picks, rotation, vote) determine how media is chosen.

**Tech Stack:** Drizzle ORM (Postgres), Hono (API), TanStack Router + React Query (frontend), Tailwind v4

**Design doc:** `docs/plans/2026-03-01-phase-system-design.md`

---

## Task 1: Add new enums and tables to schema

**Files:**
- Modify: `apps/api/src/db/schema.ts`

**Step 1: Add new enums**

Add after the existing enums (after line ~38):

```typescript
export const selectionModeEnum = pgEnum("selection_mode", [
  "admin_picks",
  "rotation",
  "vote",
]);

export const reviewVisibilityEnum = pgEnum("review_visibility", [
  "club_only",
  "public",
]);
```

**Step 2: Add new columns to `clubs` table**

Add to the `clubs` table definition:

```typescript
selectionMode: selectionModeEnum("selection_mode").notNull().default("admin_picks"),
currentRoundId: uuid("current_round_id"),
pacingEnabled: boolean("pacing_enabled").notNull().default(true),
```

Note: `currentRoundId` cannot have a FK reference to `rounds` yet since `rounds` table doesn't exist. Add it as a plain uuid column. We'll reference it in queries.

**Step 3: Add `rounds` table**

Add after `clubSchedule`:

```typescript
export const rounds = pgTable("rounds", {
  id: uuid("id").defaultRandom().primaryKey(),
  clubId: uuid("club_id")
    .notNull()
    .references(() => clubs.id, { onDelete: "cascade" }),
  mediaItemId: uuid("media_item_id").references(() => mediaItems.id),
  order: integer("order").notNull().default(0),
  selectedBy: text("selected_by").references(() => users.id),
  eventId: uuid("event_id").references(() => events.id),
  startedAt: timestamp("started_at", { mode: "date" }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { mode: "date" }),
});
```

**Step 4: Add `nominations` and `nomination_votes` tables**

```typescript
export const nominations = pgTable("nominations", {
  id: uuid("id").defaultRandom().primaryKey(),
  roundId: uuid("round_id")
    .notNull()
    .references(() => rounds.id, { onDelete: "cascade" }),
  nominatedBy: text("nominated_by")
    .notNull()
    .references(() => users.id),
  mediaItemId: uuid("media_item_id")
    .notNull()
    .references(() => mediaItems.id),
  pitch: text("pitch"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const nominationVotes = pgTable(
  "nomination_votes",
  {
    nominationId: uuid("nomination_id")
      .notNull()
      .references(() => nominations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("nomination_votes_unique").on(t.nominationId, t.userId)]
);
```

**Step 5: Add `rotation_order` table**

```typescript
export const rotationOrder = pgTable(
  "rotation_order",
  {
    clubId: uuid("club_id")
      .notNull()
      .references(() => clubs.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    position: integer("position").notNull(),
    lastPickedRoundId: uuid("last_picked_round_id").references(() => rounds.id),
  },
  (t) => [uniqueIndex("rotation_order_unique").on(t.clubId, t.userId)]
);
```

**Step 6: Add new columns to existing tables**

Add to `mediaItems`:
```typescript
pageCount: integer("page_count"),
runtimeMinutes: integer("runtime_minutes"),
```

Add to `reviews`:
```typescript
roundId: uuid("round_id").references(() => rounds.id),
visibility: reviewVisibilityEnum("visibility").notNull().default("club_only"),
```

Add to `clubMemberProgress`:
```typescript
roundId: uuid("round_id").references(() => rounds.id),
currentPage: integer("current_page"),
```

**Step 7: Verify types compile**

Run: `npx tsc --noEmit -p apps/api/tsconfig.json`
Expected: No errors

**Step 8: Generate migration**

Run: `cd apps/api && npx drizzle-kit generate`

**Step 9: Push migration to Neon**

Run: `cd apps/api && npx drizzle-kit push` (or apply migration via Neon dashboard)

**Step 10: Commit**

```
feat: add rounds, nominations, rotation_order tables and phase-related columns
```

---

## Task 2: Create phase derivation library

**Files:**
- Create: `apps/api/src/lib/phases.ts`

**Step 1: Create the phase derivation function**

```typescript
export type Phase = "selection" | "active" | "event" | "review" | "completed";

type RoundForPhase = {
  mediaItemId: string | null;
  completedAt: Date | null;
};

type EventForPhase = {
  startsAt: Date;
  endsAt: Date | null;
} | null;

export function derivePhase(round: RoundForPhase, event: EventForPhase): Phase {
  if (round.completedAt) return "completed";
  if (!round.mediaItemId) return "selection";
  if (!event) return "active";
  const now = new Date();
  if (now < event.startsAt) return "active";
  if (!event.endsAt || now < event.endsAt) return "event";
  return "review";
}

export const phaseColors: Record<Phase, { bg: string; text: string }> = {
  selection: { bg: "bg-blue-100", text: "text-blue-700" },
  active: { bg: "bg-green-100", text: "text-green-700" },
  event: { bg: "bg-amber-100", text: "text-amber-700" },
  review: { bg: "bg-purple-100", text: "text-purple-700" },
  completed: { bg: "bg-gray-100", text: "text-gray-500" },
};

export const phaseLabels: Record<Phase, string> = {
  selection: "Velg neste",
  active: "Pågår",
  event: "Arrangement",
  review: "Vurdering",
  completed: "Fullført",
};
```

**Step 2: Create pacing calculator**

Create: `apps/api/src/lib/pacing.ts`

```typescript
export type PacingData = {
  currentPage: number;
  totalPages: number;
  pagesRemaining: number;
  daysRemaining: number;
  pagesPerDay: number;
  aheadBehindDays: number; // positive = ahead, negative = behind
};

export function calculatePacing(
  currentPage: number,
  totalPages: number,
  eventDate: Date,
  roundStartDate: Date,
): PacingData | null {
  const now = new Date();
  const totalDays = Math.max(1, Math.ceil((eventDate.getTime() - roundStartDate.getTime()) / (1000 * 60 * 60 * 24)));
  const daysElapsed = Math.max(0, Math.ceil((now.getTime() - roundStartDate.getTime()) / (1000 * 60 * 60 * 24)));
  const daysRemaining = Math.max(0, Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const pagesRemaining = Math.max(0, totalPages - currentPage);

  if (daysRemaining === 0) {
    return { currentPage, totalPages, pagesRemaining, daysRemaining: 0, pagesPerDay: pagesRemaining, aheadBehindDays: 0 };
  }

  const pagesPerDay = Math.ceil(pagesRemaining / daysRemaining);
  const expectedPage = Math.round((daysElapsed / totalDays) * totalPages);
  const pageDiff = currentPage - expectedPage;
  const dailyRate = totalPages / totalDays;
  const aheadBehindDays = dailyRate > 0 ? Math.round(pageDiff / dailyRate) : 0;

  return { currentPage, totalPages, pagesRemaining, daysRemaining, pagesPerDay, aheadBehindDays };
}
```

**Step 3: Verify**

Run: `npx tsc --noEmit -p apps/api/tsconfig.json`

**Step 4: Commit**

```
feat: add phase derivation and pacing calculation libraries
```

---

## Task 3: Create rounds API routes

**Files:**
- Create: `apps/api/src/routes/rounds.ts`
- Modify: `apps/api/src/index.ts` (register route)

**Step 1: Create rounds router**

Create `apps/api/src/routes/rounds.ts`:

```typescript
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, and, desc, asc } from "drizzle-orm";
import { createDb } from "../db";
import {
  clubs, rounds, events, mediaItems, clubMembers,
  clubMemberProgress, users,
} from "../db/schema";
import { authMiddleware } from "../lib/auth-middleware";
import { derivePhase } from "../lib/phases";
import { calculatePacing } from "../lib/pacing";

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

const roundsRouter = new Hono<Env>();
roundsRouter.use("/*", authMiddleware);

// Helper: check admin
async function isClubAdmin(db: ReturnType<typeof createDb>, clubId: string, userId: string) {
  const [m] = await db.select().from(clubMembers).where(
    and(eq(clubMembers.clubId, clubId), eq(clubMembers.userId, userId), eq(clubMembers.role, "admin"))
  );
  return !!m;
}

// GET /clubs/:clubId/rounds — All rounds with derived phase
roundsRouter.get("/clubs/:clubId/rounds", async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const clubId = c.req.param("clubId");

  const allRounds = await db
    .select()
    .from(rounds)
    .where(eq(rounds.clubId, clubId))
    .orderBy(asc(rounds.order));

  const result = await Promise.all(
    allRounds.map(async (round) => {
      let event = null;
      if (round.eventId) {
        const [e] = await db.select().from(events).where(eq(events.id, round.eventId));
        event = e ?? null;
      }
      let media = null;
      if (round.mediaItemId) {
        const [m] = await db.select().from(mediaItems).where(eq(mediaItems.id, round.mediaItemId));
        media = m ?? null;
      }
      return { ...round, phase: derivePhase(round, event), event, media };
    })
  );

  return c.json(result);
});

// GET /clubs/:clubId/rounds/current — Current round with full context
roundsRouter.get("/clubs/:clubId/rounds/current", async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const clubId = c.req.param("clubId");
  const user = c.get("user");

  const [club] = await db.select().from(clubs).where(eq(clubs.id, clubId));
  if (!club || !club.currentRoundId) return c.json({ round: null, phase: null });

  const [round] = await db.select().from(rounds).where(eq(rounds.id, club.currentRoundId));
  if (!round) return c.json({ round: null, phase: null });

  let event = null;
  if (round.eventId) {
    const [e] = await db.select().from(events).where(eq(events.id, round.eventId));
    event = e ?? null;
  }

  let media = null;
  if (round.mediaItemId) {
    const [m] = await db.select().from(mediaItems).where(eq(mediaItems.id, round.mediaItemId));
    media = m ?? null;
  }

  const phase = derivePhase(round, event);

  // Progress summary
  const progress = await db
    .select({
      status: clubMemberProgress.status,
      currentPage: clubMemberProgress.currentPage,
      user: { id: users.id, name: users.name, image: users.image },
    })
    .from(clubMemberProgress)
    .innerJoin(users, eq(clubMemberProgress.userId, users.id))
    .where(
      and(
        eq(clubMemberProgress.clubId, clubId),
        round.mediaItemId ? eq(clubMemberProgress.mediaItemId, round.mediaItemId) : undefined,
      )
    );

  // Pacing for current user (books only)
  let pacing = null;
  if (media?.pageCount && event) {
    const myProgress = progress.find((p) => p.user.id === user.id);
    pacing = calculatePacing(
      myProgress?.currentPage ?? 0,
      media.pageCount,
      event.startsAt,
      round.startedAt,
    );
  }

  return c.json({
    ...round,
    phase,
    event,
    media,
    selectionMode: club.selectionMode,
    progress,
    pacing,
  });
});

// POST /clubs/:clubId/rounds — Start new round (admin only)
roundsRouter.post("/clubs/:clubId/rounds", async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const clubId = c.req.param("clubId");
  const user = c.get("user");

  if (!(await isClubAdmin(db, clubId, user.id))) {
    return c.json({ error: "Forbidden" }, 403);
  }

  // Complete current round if exists
  const [club] = await db.select().from(clubs).where(eq(clubs.id, clubId));
  if (club?.currentRoundId) {
    await db.update(rounds)
      .set({ completedAt: new Date() })
      .where(eq(rounds.id, club.currentRoundId));
  }

  // Count existing rounds for order
  const existing = await db.select({ order: rounds.order })
    .from(rounds).where(eq(rounds.clubId, clubId));
  const nextOrder = existing.length > 0 ? Math.max(...existing.map((r) => r.order)) + 1 : 1;

  const [round] = await db.insert(rounds).values({
    clubId,
    order: nextOrder,
  }).returning();

  await db.update(clubs)
    .set({ currentRoundId: round.id })
    .where(eq(clubs.id, clubId));

  return c.json({ ...round, phase: "selection" }, 201);
});

// POST /clubs/:clubId/rounds/current/select — Admin picks media
const selectMediaSchema = z.object({
  mediaItemId: z.string().uuid(),
});

roundsRouter.post(
  "/clubs/:clubId/rounds/current/select",
  zValidator("json", selectMediaSchema),
  async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const clubId = c.req.param("clubId");
    const user = c.get("user");
    const body = c.req.valid("json");

    if (!(await isClubAdmin(db, clubId, user.id))) {
      return c.json({ error: "Forbidden" }, 403);
    }

    const [club] = await db.select().from(clubs).where(eq(clubs.id, clubId));
    if (!club?.currentRoundId) return c.json({ error: "No active round" }, 400);

    const [round] = await db.update(rounds)
      .set({ mediaItemId: body.mediaItemId, selectedBy: user.id })
      .where(eq(rounds.id, club.currentRoundId))
      .returning();

    return c.json(round);
  }
);

// POST /clubs/:clubId/rounds/current/event — Create event for current round
const createRoundEventSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  location: z.string().optional(),
  startsAt: z.string(),
  endsAt: z.string().optional(),
});

roundsRouter.post(
  "/clubs/:clubId/rounds/current/event",
  zValidator("json", createRoundEventSchema),
  async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const clubId = c.req.param("clubId");
    const user = c.get("user");
    const body = c.req.valid("json");

    if (!(await isClubAdmin(db, clubId, user.id))) {
      return c.json({ error: "Forbidden" }, 403);
    }

    const [club] = await db.select().from(clubs).where(eq(clubs.id, clubId));
    if (!club?.currentRoundId) return c.json({ error: "No active round" }, 400);

    const [event] = await db.insert(events).values({
      clubId,
      title: body.title,
      description: body.description ?? null,
      location: body.location ?? null,
      startsAt: new Date(body.startsAt),
      endsAt: body.endsAt ? new Date(body.endsAt) : null,
    }).returning();

    await db.update(rounds)
      .set({ eventId: event.id })
      .where(eq(rounds.id, club.currentRoundId));

    return c.json(event, 201);
  }
);

// POST /clubs/:clubId/rounds/current/advance — Complete current round
roundsRouter.post("/clubs/:clubId/rounds/current/advance", async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const clubId = c.req.param("clubId");
  const user = c.get("user");

  if (!(await isClubAdmin(db, clubId, user.id))) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const [club] = await db.select().from(clubs).where(eq(clubs.id, clubId));
  if (!club?.currentRoundId) return c.json({ error: "No active round" }, 400);

  const [round] = await db.update(rounds)
    .set({ completedAt: new Date() })
    .where(eq(rounds.id, club.currentRoundId))
    .returning();

  await db.update(clubs)
    .set({ currentRoundId: null })
    .where(eq(clubs.id, clubId));

  return c.json({ ...round, phase: "completed" });
});

export { roundsRouter };
```

**Step 2: Register in index.ts**

Add import and route registration in `apps/api/src/index.ts`:

```typescript
import { roundsRouter } from "./routes/rounds";
```

Add after existing routes:
```typescript
app.route("/api", roundsRouter);
```

**Step 3: Verify**

Run: `npx tsc --noEmit -p apps/api/tsconfig.json`

**Step 4: Commit**

```
feat: add rounds API with phase derivation, progress, and pacing
```

---

## Task 4: Create selection API routes (vote + rotation)

**Files:**
- Create: `apps/api/src/routes/selection.ts`
- Modify: `apps/api/src/index.ts`

**Step 1: Create selection router**

Create `apps/api/src/routes/selection.ts`:

```typescript
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, and, sql } from "drizzle-orm";
import { createDb } from "../db";
import {
  clubs, rounds, nominations, nominationVotes, mediaItems,
  clubMembers, users, rotationOrder,
} from "../db/schema";
import { authMiddleware } from "../lib/auth-middleware";

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

const selectionRouter = new Hono<Env>();
selectionRouter.use("/*", authMiddleware);

// GET /clubs/:clubId/rounds/current/nominations
selectionRouter.get("/clubs/:clubId/rounds/current/nominations", async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const clubId = c.req.param("clubId");

  const [club] = await db.select().from(clubs).where(eq(clubs.id, clubId));
  if (!club?.currentRoundId) return c.json([]);

  const noms = await db
    .select({
      id: nominations.id,
      pitch: nominations.pitch,
      createdAt: nominations.createdAt,
      nominatedBy: { id: users.id, name: users.name, image: users.image },
      media: mediaItems,
      voteCount: sql<number>`(SELECT COUNT(*) FROM nomination_votes WHERE nomination_votes.nomination_id = ${nominations.id})::int`,
    })
    .from(nominations)
    .innerJoin(users, eq(nominations.nominatedBy, users.id))
    .innerJoin(mediaItems, eq(nominations.mediaItemId, mediaItems.id))
    .where(eq(nominations.roundId, club.currentRoundId));

  return c.json(noms);
});

// POST /clubs/:clubId/rounds/current/nominate
const nominateSchema = z.object({
  mediaItemId: z.string().uuid(),
  pitch: z.string().max(500).optional(),
});

selectionRouter.post(
  "/clubs/:clubId/rounds/current/nominate",
  zValidator("json", nominateSchema),
  async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const clubId = c.req.param("clubId");
    const user = c.get("user");
    const body = c.req.valid("json");

    const [club] = await db.select().from(clubs).where(eq(clubs.id, clubId));
    if (!club?.currentRoundId) return c.json({ error: "No active round" }, 400);

    const [nom] = await db.insert(nominations).values({
      roundId: club.currentRoundId,
      nominatedBy: user.id,
      mediaItemId: body.mediaItemId,
      pitch: body.pitch ?? null,
    }).returning();

    return c.json(nom, 201);
  }
);

// POST /clubs/:clubId/rounds/current/vote
const voteSchema = z.object({ nominationId: z.string().uuid() });

selectionRouter.post(
  "/clubs/:clubId/rounds/current/vote",
  zValidator("json", voteSchema),
  async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const user = c.get("user");
    const body = c.req.valid("json");

    // Upsert: delete existing vote for this user on this nomination's round, then insert
    const [nom] = await db.select().from(nominations).where(eq(nominations.id, body.nominationId));
    if (!nom) return c.json({ error: "Nomination not found" }, 404);

    // Remove previous vote in this round
    const roundNoms = await db.select({ id: nominations.id })
      .from(nominations).where(eq(nominations.roundId, nom.roundId));
    for (const rn of roundNoms) {
      await db.delete(nominationVotes).where(
        and(eq(nominationVotes.nominationId, rn.id), eq(nominationVotes.userId, user.id))
      );
    }

    await db.insert(nominationVotes).values({
      nominationId: body.nominationId,
      userId: user.id,
    });

    return c.json({ voted: body.nominationId });
  }
);

// POST /clubs/:clubId/rounds/current/finalize — Admin finalizes winner
const finalizeSchema = z.object({ nominationId: z.string().uuid() });

selectionRouter.post(
  "/clubs/:clubId/rounds/current/finalize",
  zValidator("json", finalizeSchema),
  async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const clubId = c.req.param("clubId");
    const user = c.get("user");
    const body = c.req.valid("json");

    const [membership] = await db.select().from(clubMembers).where(
      and(eq(clubMembers.clubId, clubId), eq(clubMembers.userId, user.id), eq(clubMembers.role, "admin"))
    );
    if (!membership) return c.json({ error: "Forbidden" }, 403);

    const [club] = await db.select().from(clubs).where(eq(clubs.id, clubId));
    if (!club?.currentRoundId) return c.json({ error: "No active round" }, 400);

    const [nom] = await db.select().from(nominations).where(eq(nominations.id, body.nominationId));
    if (!nom) return c.json({ error: "Nomination not found" }, 404);

    const [round] = await db.update(rounds)
      .set({ mediaItemId: nom.mediaItemId, selectedBy: nom.nominatedBy })
      .where(eq(rounds.id, club.currentRoundId))
      .returning();

    return c.json(round);
  }
);

// GET /clubs/:clubId/rotation — Get rotation order
selectionRouter.get("/clubs/:clubId/rotation", async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const clubId = c.req.param("clubId");

  const order = await db
    .select({
      position: rotationOrder.position,
      lastPickedRoundId: rotationOrder.lastPickedRoundId,
      user: { id: users.id, name: users.name, image: users.image },
    })
    .from(rotationOrder)
    .innerJoin(users, eq(rotationOrder.userId, users.id))
    .where(eq(rotationOrder.clubId, clubId))
    .orderBy(rotationOrder.position);

  return c.json(order);
});

export { selectionRouter };
```

**Step 2: Register in index.ts**

```typescript
import { selectionRouter } from "./routes/selection";
// ...
app.route("/api", selectionRouter);
```

**Step 3: Verify and commit**

Run: `npx tsc --noEmit -p apps/api/tsconfig.json`

```
feat: add selection API with nominations, voting, and rotation
```

---

## Task 5: Add progress API routes + club PATCH + bug fixes

**Files:**
- Create: `apps/api/src/routes/progress.ts`
- Modify: `apps/api/src/routes/clubs.ts` (add PATCH)
- Modify: `apps/api/src/routes/schedule.ts` (fix admin check)
- Modify: `apps/api/src/index.ts`

**Step 1: Create progress router**

Create `apps/api/src/routes/progress.ts`:

```typescript
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, and } from "drizzle-orm";
import { createDb } from "../db";
import { clubs, rounds, clubMemberProgress, users, mediaItems, events } from "../db/schema";
import { authMiddleware } from "../lib/auth-middleware";
import { calculatePacing } from "../lib/pacing";

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

const progressRouter = new Hono<Env>();
progressRouter.use("/*", authMiddleware);

// GET /clubs/:clubId/rounds/current/progress
progressRouter.get("/clubs/:clubId/rounds/current/progress", async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const clubId = c.req.param("clubId");

  const [club] = await db.select().from(clubs).where(eq(clubs.id, clubId));
  if (!club?.currentRoundId) return c.json([]);

  const [round] = await db.select().from(rounds).where(eq(rounds.id, club.currentRoundId));
  if (!round?.mediaItemId) return c.json([]);

  const progress = await db
    .select({
      status: clubMemberProgress.status,
      currentPage: clubMemberProgress.currentPage,
      updatedAt: clubMemberProgress.updatedAt,
      user: { id: users.id, name: users.name, image: users.image },
    })
    .from(clubMemberProgress)
    .innerJoin(users, eq(clubMemberProgress.userId, users.id))
    .where(
      and(
        eq(clubMemberProgress.clubId, clubId),
        eq(clubMemberProgress.mediaItemId, round.mediaItemId),
      )
    );

  return c.json(progress);
});

// POST /clubs/:clubId/rounds/current/progress
const updateProgressSchema = z.object({
  status: z.enum(["not_started", "in_progress", "finished"]).optional(),
  currentPage: z.number().int().min(0).optional(),
});

progressRouter.post(
  "/clubs/:clubId/rounds/current/progress",
  zValidator("json", updateProgressSchema),
  async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const clubId = c.req.param("clubId");
    const user = c.get("user");
    const body = c.req.valid("json");

    const [club] = await db.select().from(clubs).where(eq(clubs.id, clubId));
    if (!club?.currentRoundId) return c.json({ error: "No active round" }, 400);

    const [round] = await db.select().from(rounds).where(eq(rounds.id, club.currentRoundId));
    if (!round?.mediaItemId) return c.json({ error: "No media selected" }, 400);

    const [existing] = await db.select().from(clubMemberProgress).where(
      and(
        eq(clubMemberProgress.clubId, clubId),
        eq(clubMemberProgress.userId, user.id),
        eq(clubMemberProgress.mediaItemId, round.mediaItemId),
      )
    );

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (body.status) updates.status = body.status;
    if (body.currentPage !== undefined) updates.currentPage = body.currentPage;

    if (existing) {
      await db.update(clubMemberProgress)
        .set(updates)
        .where(
          and(
            eq(clubMemberProgress.clubId, clubId),
            eq(clubMemberProgress.userId, user.id),
            eq(clubMemberProgress.mediaItemId, round.mediaItemId),
          )
        );
    } else {
      await db.insert(clubMemberProgress).values({
        clubId,
        userId: user.id,
        mediaItemId: round.mediaItemId,
        roundId: club.currentRoundId,
        status: body.status ?? "not_started",
        currentPage: body.currentPage ?? null,
      });
    }

    // Return pacing if applicable
    let pacing = null;
    const [media] = await db.select().from(mediaItems).where(eq(mediaItems.id, round.mediaItemId));
    if (media?.pageCount && round.eventId) {
      const [event] = await db.select().from(events).where(eq(events.id, round.eventId));
      if (event) {
        pacing = calculatePacing(
          body.currentPage ?? existing?.currentPage ?? 0,
          media.pageCount,
          event.startsAt,
          round.startedAt,
        );
      }
    }

    return c.json({ status: body.status ?? existing?.status ?? "not_started", currentPage: body.currentPage ?? existing?.currentPage, pacing });
  }
);

export { progressRouter };
```

**Step 2: Add PATCH /clubs/:id to clubs.ts**

Add to `apps/api/src/routes/clubs.ts` before the export:

```typescript
// PATCH /:id — Update club settings (admin only)
const updateClubSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  selectionMode: z.enum(["admin_picks", "rotation", "vote"]).optional(),
  pacingEnabled: z.boolean().optional(),
  recurrenceRule: z.string().optional(),
});

clubsRouter.patch("/:id", zValidator("json", updateClubSchema), async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const clubId = c.req.param("id");
  const user = c.get("user");
  const body = c.req.valid("json");

  const [membership] = await db.select().from(clubMembers).where(
    and(eq(clubMembers.clubId, clubId), eq(clubMembers.userId, user.id), eq(clubMembers.role, "admin"))
  );
  if (!membership) return c.json({ error: "Forbidden" }, 403);

  const [updated] = await db.update(clubs).set(body).where(eq(clubs.id, clubId)).returning();
  return c.json(updated);
});
```

Also update the create club schema to include `selectionMode`:

```typescript
const createClubSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  mediaType: z.enum(["book", "film"]),
  recurrenceRule: z.string().optional(),
  selectionMode: z.enum(["admin_picks", "rotation", "vote"]).optional(),
});
```

And pass it in the insert:
```typescript
selectionMode: body.selectionMode,
```

**Step 3: Fix admin check on schedule PATCH**

In `apps/api/src/routes/schedule.ts`, add admin check to the PATCH handler:

```typescript
scheduleRouter.patch("/:clubId/schedule/:itemId", zValidator("json", updateScheduleSchema), async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const clubId = c.req.param("clubId");
  const itemId = c.req.param("itemId");
  const user = c.get("user");
  const body = c.req.valid("json");

  const [membership] = await db.select().from(clubMembers).where(
    and(eq(clubMembers.clubId, clubId), eq(clubMembers.userId, user.id), eq(clubMembers.role, "admin"))
  );
  if (!membership) return c.json({ error: "Forbidden" }, 403);

  const [updated] = await db.update(clubSchedule).set({ status: body.status }).where(eq(clubSchedule.id, itemId)).returning();
  if (!updated) return c.json({ error: "Not found" }, 404);
  return c.json(updated);
});
```

**Step 4: Register progress router in index.ts**

```typescript
import { progressRouter } from "./routes/progress";
// ...
app.route("/api", progressRouter);
```

**Step 5: Verify and commit**

Run: `npx tsc --noEmit -p apps/api/tsconfig.json`

```
feat: add progress tracking API, club settings PATCH, fix schedule admin check
```

---

## Task 6: Frontend — Phase components and types

**Files:**
- Create: `apps/web/src/lib/phases.ts`
- Create: `apps/web/src/components/club/phase-badge.tsx`
- Create: `apps/web/src/components/club/rating-input.tsx`

**Step 1: Create shared phase types and helpers**

Create `apps/web/src/lib/phases.ts` — copy the same phase types and colors from the API lib:

```typescript
export type Phase = "selection" | "active" | "event" | "review" | "completed";

export const phaseConfig: Record<Phase, { label: string; bg: string; text: string }> = {
  selection: { label: "Velg neste", bg: "bg-blue-100", text: "text-blue-700" },
  active: { label: "Pågår", bg: "bg-green-100", text: "text-green-700" },
  event: { label: "Arrangement", bg: "bg-amber-100", text: "text-amber-700" },
  review: { label: "Vurdering", bg: "bg-purple-100", text: "text-purple-700" },
  completed: { label: "Fullført", bg: "bg-gray-100", text: "text-gray-500" },
};
```

**Step 2: Create PhaseBadge component**

Create `apps/web/src/components/club/phase-badge.tsx`:

```tsx
import { type Phase, phaseConfig } from "@/lib/phases";

export function PhaseBadge({ phase }: { phase: Phase }) {
  const config = phaseConfig[phase];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}
```

**Step 3: Create RatingInput component**

Create `apps/web/src/components/club/rating-input.tsx`:

```tsx
const ratingConfig = [
  { value: 1, emoji: "😴", label: "Kjedelig" },
  { value: 2, emoji: "😐", label: "Ok" },
  { value: 3, emoji: "🙂", label: "Bra" },
  { value: 4, emoji: "🤩", label: "Elsket" },
  { value: 5, emoji: "🏆", label: "Mesterverk" },
];

export function RatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  return (
    <div className="flex gap-2">
      {ratingConfig.map((r) => (
        <button
          key={r.value}
          type="button"
          onClick={() => onChange(r.value)}
          className={`flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-sm transition-all ${
            value === r.value
              ? "bg-primary/10 ring-2 ring-primary/30 scale-110"
              : "hover:bg-muted"
          }`}
        >
          <span className="text-2xl">{r.emoji}</span>
          <span className="text-xs text-muted-foreground">{r.label}</span>
        </button>
      ))}
    </div>
  );
}
```

**Step 4: Verify and commit**

Run: `npx tsc --noEmit -p apps/web/tsconfig.json`

```
feat: add phase types, PhaseBadge, and emoji RatingInput components
```

---

## Task 7: Frontend — Phase-driven club page

**Files:**
- Modify: `apps/web/src/routes/clubs/$clubId.tsx` — major refactor to add phase-driven UI

**This is the largest frontend task.** The club page needs to:

1. Fetch current round via `GET /api/clubs/${clubId}/rounds/current`
2. Show a PhaseBanner with the current phase
3. Render the correct PhaseView based on derived phase
4. Keep existing sections (events, members, discussions) below

**Step 1: Add round types and query**

Add types at the top of the file:

```typescript
import { PhaseBadge } from "@/components/club/phase-badge";
import { RatingInput } from "@/components/club/rating-input";
import type { Phase } from "@/lib/phases";

type CurrentRound = {
  id: string;
  clubId: string;
  mediaItemId: string | null;
  order: number;
  eventId: string | null;
  phase: Phase;
  selectionMode: "admin_picks" | "rotation" | "vote";
  event: {
    id: string; title: string; description: string | null;
    location: string | null; startsAt: string; endsAt: string | null;
  } | null;
  media: {
    id: string; title: string; authorOrDirector: string | null;
    coverUrl: string | null; year: number | null; pageCount: number | null;
  } | null;
  progress: Array<{
    status: string; currentPage: number | null;
    user: { id: string; name: string; image: string | null };
  }>;
  pacing: {
    currentPage: number; totalPages: number; pagesRemaining: number;
    daysRemaining: number; pagesPerDay: number; aheadBehindDays: number;
  } | null;
};
```

Add query inside ClubDetailPage:

```typescript
const { data: currentRound } = useQuery({
  queryKey: ["club-round", clubId],
  queryFn: () => api<CurrentRound>(`/api/clubs/${clubId}/rounds/current`),
});
```

**Step 2: Add PhaseBanner above existing sections**

Insert after the header section, before the schedule section:

```tsx
{/* Current Round / Phase */}
{currentRound?.phase && currentRound.phase !== "completed" && (
  <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
    <div className="flex items-center gap-3 mb-4">
      <PhaseBadge phase={currentRound.phase} />
      <span className="text-sm text-muted-foreground">Runde {currentRound.order}</span>
    </div>

    {/* SELECTION phase */}
    {currentRound.phase === "selection" && (
      <div>
        <h3 className="font-semibold mb-2">Velg neste {club.mediaType === "book" ? "bok" : "film"}</h3>
        {isAdmin && currentRound.selectionMode === "admin_picks" && (
          <div>
            <p className="text-sm text-muted-foreground mb-3">
              Søk og velg hva klubben skal {club.mediaType === "book" ? "lese" : "se"} neste gang.
            </p>
            <MediaSearch mediaType={club.mediaType} onSelect={async (result) => {
              const media = await api<{ id: string }>("/api/media", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...result, mediaType: club.mediaType }),
              });
              await api(`/api/clubs/${clubId}/rounds/current/select`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mediaItemId: media.id }),
              });
              queryClient.invalidateQueries({ queryKey: ["club-round", clubId] });
            }} />
          </div>
        )}
        {!isAdmin && (
          <p className="text-sm text-muted-foreground">Venter på at admin velger...</p>
        )}
      </div>
    )}

    {/* ACTIVE phase */}
    {currentRound.phase === "active" && currentRound.media && (
      <div className="flex flex-col gap-4">
        <div className="flex gap-4">
          {currentRound.media.coverUrl && (
            <div className="w-20 aspect-[2/3] overflow-hidden rounded-lg bg-muted shrink-0">
              <img src={currentRound.media.coverUrl} alt={currentRound.media.title} className="h-full w-full object-cover" />
            </div>
          )}
          <div>
            <Link to="/media/$mediaId" params={{ mediaId: currentRound.media.id }}>
              <h3 className="font-semibold hover:underline">{currentRound.media.title}</h3>
            </Link>
            {currentRound.media.authorOrDirector && (
              <p className="text-sm text-muted-foreground">{currentRound.media.authorOrDirector}</p>
            )}
            {currentRound.event && (
              <p className="text-sm text-muted-foreground mt-2">
                Arrangement: {new Date(currentRound.event.startsAt).toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long" })}
                {currentRound.event.location && ` · ${currentRound.event.location}`}
              </p>
            )}
          </div>
        </div>
        {currentRound.pacing && (
          <div className="rounded-xl bg-muted/50 p-4">
            <p className="text-sm font-medium">
              {currentRound.pacing.pagesPerDay} sider/dag for å rekke det
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Side {currentRound.pacing.currentPage} av {currentRound.pacing.totalPages}
              {currentRound.pacing.aheadBehindDays > 0 && ` · ${currentRound.pacing.aheadBehindDays} dager foran`}
              {currentRound.pacing.aheadBehindDays < 0 && ` · ${Math.abs(currentRound.pacing.aheadBehindDays)} dager bak`}
            </p>
          </div>
        )}
        {!currentRound.event && isAdmin && (
          <Button variant="outline" size="sm" onClick={() => setShowCreateEvent(true)}>
            Planlegg arrangement
          </Button>
        )}
      </div>
    )}

    {/* EVENT phase */}
    {currentRound.phase === "event" && currentRound.event && (
      <div>
        <h3 className="font-semibold mb-2">Arrangement i dag!</h3>
        <p className="text-sm">
          {new Date(currentRound.event.startsAt).toLocaleTimeString("nb-NO", { hour: "numeric", minute: "2-digit" })}
          {currentRound.event.location && ` · ${currentRound.event.location}`}
        </p>
        <Link to="/events/$eventId" params={{ eventId: currentRound.event.id }}>
          <Button variant="outline" size="sm" className="mt-3">Se arrangement</Button>
        </Link>
      </div>
    )}

    {/* REVIEW phase */}
    {currentRound.phase === "review" && currentRound.media && (
      <div className="flex flex-col gap-4">
        <h3 className="font-semibold">Hva syntes du om {currentRound.media.title}?</h3>
        <p className="text-sm text-muted-foreground">
          Del din vurdering med klubben.
        </p>
        <Link to="/media/$mediaId" params={{ mediaId: currentRound.media.id }}>
          <Button variant="outline" size="sm">Skriv anmeldelse</Button>
        </Link>
        {isAdmin && (
          <Button variant="outline" size="sm" onClick={async () => {
            await api(`/api/clubs/${clubId}/rounds/current/advance`, { method: "POST" });
            queryClient.invalidateQueries({ queryKey: ["club-round", clubId] });
          }}>
            Avslutt runde og start neste
          </Button>
        )}
      </div>
    )}
  </section>
)}

{/* Start new round button (when no active round) */}
{isAdmin && (!currentRound?.phase || currentRound.phase === "completed") && (
  <Button onClick={async () => {
    await api(`/api/clubs/${clubId}/rounds`, { method: "POST" });
    queryClient.invalidateQueries({ queryKey: ["club-round", clubId] });
  }}>
    Start ny runde
  </Button>
)}
```

**Step 3: Update the event creation handler**

When creating an event during an active round, also link it to the round. Modify `handleCreateEvent` to also call the round event endpoint when a round is active:

After the existing event creation:
```typescript
// If there's an active round without an event, link it
if (currentRound?.phase === "active" && !currentRound.eventId) {
  queryClient.invalidateQueries({ queryKey: ["club-round", clubId] });
}
```

**Step 4: Verify and commit**

Run: `npx tsc --noEmit -p apps/web/tsconfig.json`

```
feat: add phase-driven UI to club detail page with all four phase views
```

---

## Task 8: Frontend — Dashboard with phase-specific club cards

**Files:**
- Modify: `apps/web/src/routes/index.tsx`

**Step 1: Add round data to club list**

For logged-in users, the dashboard should show club cards with phase badges and CTAs. The club list query from `/api/clubs` returns basic club info. We need to also fetch current round for each club.

Add a combined query that fetches clubs and their rounds:

```typescript
type ClubWithRound = {
  club: { id: string; name: string; description: string | null; mediaType: string; coverImageUrl: string | null };
  role: string;
  currentRound?: CurrentRound;
};
```

For each club, fetch `/api/clubs/${clubId}/rounds/current` in parallel.

**Step 2: Render club cards with phase badges**

Replace the current logged-in dashboard content with club cards:

```tsx
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
  {clubs.map(({ club, currentRound }) => (
    <Link key={club.id} to="/clubs/$clubId" params={{ clubId: club.id }}>
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
            {club.mediaType === "book" ? "B" : "F"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold truncate">{club.name}</p>
            {currentRound?.phase && <PhaseBadge phase={currentRound.phase} />}
          </div>
        </div>
        {/* Phase-specific CTA */}
        <p className="text-sm text-muted-foreground">
          {phaseCTA(currentRound)}
        </p>
      </div>
    </Link>
  ))}
</div>
```

Helper function for CTAs:
```typescript
function phaseCTA(round?: CurrentRound): string {
  if (!round?.phase) return "Ingen aktiv runde";
  switch (round.phase) {
    case "selection": return "Velg neste";
    case "active":
      if (round.pacing) return `Side ${round.pacing.currentPage}/${round.pacing.totalPages} — ${round.pacing.pagesPerDay}s/dag`;
      if (round.event) {
        const d = Math.ceil((new Date(round.event.startsAt).getTime() - Date.now()) / (1000*60*60*24));
        return d > 0 ? `Arrangement om ${d} dager` : "Arrangement snart";
      }
      return round.media?.title ?? "Pågår";
    case "event":
      if (round.event) return `I dag kl ${new Date(round.event.startsAt).toLocaleTimeString("nb-NO", { hour: "numeric", minute: "2-digit" })}`;
      return "Arrangement i dag";
    case "review": return "Skriv din vurdering";
    default: return "";
  }
}
```

**Step 3: Verify and commit**

```
feat: add phase-aware club cards to dashboard with CTAs
```

---

## Task 9: Frontend — Club settings page

**Files:**
- Create: `apps/web/src/routes/clubs/$clubId.settings.tsx`

**Step 1: Create settings page**

```tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { api } from "@/lib/api";
import { useSession } from "@/lib/auth-client";

type Club = {
  id: string; name: string; description: string | null;
  mediaType: string; selectionMode: string; pacingEnabled: boolean;
  recurrenceRule: string | null;
};

export const Route = createFileRoute("/clubs/$clubId/settings")({ component: ClubSettingsPage });

function ClubSettingsPage() {
  const { clubId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: club, isLoading } = useQuery({
    queryKey: ["club", clubId],
    queryFn: () => api<Club>(`/api/clubs/${clubId}`),
  });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectionMode, setSelectionMode] = useState("");
  const [saving, setSaving] = useState(false);

  // Initialize form when club loads
  if (club && !name) {
    setName(club.name);
    setDescription(club.description ?? "");
    setSelectionMode(club.selectionMode);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await api(`/api/clubs/${clubId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: description || undefined, selectionMode }),
    });
    queryClient.invalidateQueries({ queryKey: ["club", clubId] });
    setSaving(false);
    navigate({ to: "/clubs/$clubId", params: { clubId } });
  }

  if (isLoading || !club) return <p className="text-muted-foreground py-12 text-center">Laster...</p>;

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold tracking-tight mb-6">Innstillinger</h1>
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="club-name">Klubbnavn</Label>
          <Input id="club-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="club-desc">Beskrivelse</Label>
          <Textarea id="club-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Utvelgelsesmodus</Label>
          <Select value={selectionMode} onValueChange={setSelectionMode}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="admin_picks">Admin velger</SelectItem>
              <SelectItem value="rotation">Rotasjon</SelectItem>
              <SelectItem value="vote">Avstemning</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 mt-2">
          <Button type="submit" disabled={saving}>{saving ? "Lagrer..." : "Lagre"}</Button>
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/clubs/$clubId", params: { clubId } })}>
            Avbryt
          </Button>
        </div>
      </form>
    </div>
  );
}
```

**Step 2: Add settings link to club header**

In `clubs/$clubId.tsx`, add a settings gear link for admins in the header area.

**Step 3: Regenerate route tree, verify, commit**

```
feat: add club settings page with selection mode and description editing
```

---

## Task 10: Final polish — alert() fix, auth domain env var, club creation flow

**Files:**
- Modify: `apps/web/src/routes/clubs/$clubId.tsx` (replace alert with inline error)
- Modify: `apps/api/src/lib/auth.ts` (make domain configurable)
- Modify: `apps/web/src/routes/clubs/new.tsx` (add selection_mode to create flow)

**Step 1: Replace alert() in club detail**

Replace `alert("Kunne ikke legge til...")` with `setEventError(...)` or a similar state-based error display.

**Step 2: Make auth domain configurable**

In `apps/api/src/lib/auth.ts`, change:
```typescript
domain: ".filipjohn.com",
```
to:
```typescript
domain: env.COOKIE_DOMAIN ?? ".filipjohn.com",
```

Add `COOKIE_DOMAIN?: string` to the `AuthEnv` type.

**Step 3: Add selection_mode to club creation**

In `clubs/new.tsx`, add a Select for selection mode after the media type picker.

**Step 4: Verify both projects compile and commit**

```
fix: replace alert with inline error, make cookie domain configurable, add selection mode to club creation
```

---

## Task 11: Generate and apply database migration

**Step 1: Generate migration**

```bash
cd apps/api && DATABASE_URL="$DATABASE_URL" npx drizzle-kit generate
```

**Step 2: Review generated SQL**

Check `apps/api/src/db/migrations/` for the new migration file. Verify it creates the correct tables and columns.

**Step 3: Push to Neon**

```bash
cd apps/api && DATABASE_URL="$DATABASE_URL" npx drizzle-kit push
```

**Step 4: Commit migration files**

```
chore: add database migration for rounds and phase system tables
```

---

## Task 12: Full verification and deploy

**Step 1: Type check both projects**

```bash
npx tsc --noEmit -p apps/api/tsconfig.json
npx tsc --noEmit -p apps/web/tsconfig.json
```

**Step 2: Manual smoke test**

Test these flows:
1. Create club → start round → search and select media → verify phase shows ACTIVE
2. Create event for round → wait for event time → verify phase shows EVENT
3. After event → verify phase shows REVIEW → complete round
4. Club card on dashboard shows correct phase badge + CTA
5. Club settings page saves changes

**Step 3: Deploy**

```bash
bun run deploy:api
bun run --filter web deploy
```

**Step 4: Commit any final fixes**

```
chore: final verification and deploy
```

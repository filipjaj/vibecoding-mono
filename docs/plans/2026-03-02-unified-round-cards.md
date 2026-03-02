# Unified Round-Centric Club Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the disconnected Program/Events/Round sections on the club page with a single round-centric flow that shows completed rounds as collapsed rows, the current round as an expanded hero card, and upcoming program items as a small grid.

**Architecture:** The existing `GET /clubs/:clubId/rounds` endpoint is enriched to include media data per round. The frontend `$clubId.tsx` is rewritten to consume the rounds list as the primary data source, removing the separate Events and full Program sections.

**Tech Stack:** Hono API (Drizzle ORM), React (TanStack Router + Query), Tailwind CSS, shadcn/ui components

---

### Task 1: Enrich the rounds list API to include media

The `GET /clubs/:clubId/rounds` endpoint returns `{ ...round, phase, event }` but not media. We need media info for completed round rows (cover thumbnail + title).

**Files:**
- Modify: `apps/api/src/routes/rounds.ts:72-103`

**Step 1: Add media join to the rounds list endpoint**

In the `.map()` callback inside `GET /clubs/:clubId/rounds`, after fetching the event, also fetch the media item if `round.mediaItemId` is set:

```typescript
const result = await Promise.all(
  clubRounds.map(async (round) => {
    let event = null;
    if (round.eventId) {
      const [e] = await db
        .select()
        .from(events)
        .where(eq(events.id, round.eventId));
      event = e ?? null;
    }
    let media = null;
    if (round.mediaItemId) {
      const [m] = await db
        .select()
        .from(mediaItems)
        .where(eq(mediaItems.id, round.mediaItemId));
      media = m ?? null;
    }
    const phase = derivePhase(round, event);
    return { ...round, phase, event, media };
  }),
);
```

**Step 2: Commit**

```bash
git add apps/api/src/routes/rounds.ts
git commit -m "feat: include media in rounds list endpoint"
```

---

### Task 2: Rewrite the club page — data layer

Replace the separate queries for events/schedule with a single rounds query. Keep the `currentRound` query for the rich current round data (progress, pacing).

**Files:**
- Modify: `apps/web/src/routes/clubs/$clubId.tsx`

**Step 1: Add RoundSummary type and allRounds query**

Add this type near the top of the file (after the existing types):

```typescript
type RoundSummary = {
  id: string;
  clubId: string;
  mediaItemId: string | null;
  order: number;
  eventId: string | null;
  phaseOverride: Phase | null;
  startedAt: string;
  completedAt: string | null;
  phase: Phase;
  event: {
    id: string; title: string; description: string | null;
    location: string | null; startsAt: string; endsAt: string | null;
  } | null;
  media: {
    id: string; title: string; authorOrDirector: string | null;
    coverUrl: string | null; year: number | null;
  } | null;
};
```

Add this query after the existing `currentRound` query:

```typescript
const { data: allRounds = [] } = useQuery({
  queryKey: ["club-rounds", clubId],
  queryFn: () => api<RoundSummary[]>(`/api/clubs/${clubId}/rounds`),
});
```

Derive completed rounds from it:

```typescript
const completedRounds = allRounds
  .filter((r) => r.phase === "completed")
  .reverse(); // most recent first
```

**Step 2: Remove the clubEvents query and related state/mutations**

Remove these:
- `clubEvents` query
- `upcomingEvents` / `pastEvents` derived variables
- `showCreateEvent` state and event form state (`eventTitle`, `eventDescription`, `eventLocation`, `eventStartsAt`, `eventEndsAt`, `eventScheduleItemId`)
- `createEventMutation`
- `handleCreateEvent` function
- `resetEventForm` function

Keep the `schedule` query — it's still needed for the "upcoming program" grid and the selection phase.

**Step 3: Commit**

```bash
git add apps/web/src/routes/clubs/\$clubId.tsx
git commit -m "refactor: add allRounds query, remove separate events query"
```

---

### Task 3: Rewrite the club page — completed rounds section

Replace the old "Events" section and the full "Program" grid with completed round rows.

**Files:**
- Modify: `apps/web/src/routes/clubs/$clubId.tsx`

**Step 1: Replace the Events section with completed round rows**

Remove the entire `{/* Events */}` section. Remove the entire `{/* Schedule - cover grid */}` section (we'll rebuild the upcoming part in Task 4).

In their place, after the header and before the current round card, add:

```tsx
{/* Completed rounds */}
{completedRounds.length > 0 && (
  <section className="flex flex-col gap-2">
    <h2 className="text-lg font-semibold">Tidligere runder</h2>
    {completedRounds.map((round) => (
      <div key={round.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-sm">
        {round.media?.coverUrl ? (
          <div className="w-12 aspect-[2/3] overflow-hidden rounded-md bg-muted shrink-0">
            <img src={round.media.coverUrl} alt={round.media.title} className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="flex w-12 aspect-[2/3] items-center justify-center rounded-md bg-muted text-xs text-muted-foreground shrink-0">
            ?
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">{round.media?.title ?? "Ingen bok valgt"}</p>
            <span className="text-xs text-muted-foreground shrink-0">Runde {round.order}</span>
          </div>
          {(round.event || round.media?.authorOrDirector) && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {round.media?.authorOrDirector}
              {round.media?.authorOrDirector && round.event && " · "}
              {round.event && new Date(round.event.startsAt).toLocaleDateString("nb-NO", { day: "numeric", month: "short" })}
              {round.event?.location && ` · ${round.event.location}`}
            </p>
          )}
        </div>
      </div>
    ))}
  </section>
)}
```

**Step 2: Commit**

```bash
git add apps/web/src/routes/clubs/\$clubId.tsx
git commit -m "feat: add completed round rows, remove old events/program sections"
```

---

### Task 4: Rewrite the club page — current round card with inline event

The current round card already shows phase-specific content. The main change: make the event info always visible inline (not as a separate section), and ensure the "Opprett arrangement" button is inside the card.

**Files:**
- Modify: `apps/web/src/routes/clubs/$clubId.tsx`

**Step 1: Update the current round card**

The current round card section (`{/* Current Round / Phase */}`) stays mostly the same. The key changes:

1. Move the "Opprett arrangement" button from the page header into the current round card (when no event exists and user is admin). It's already partially there for the "active" phase — make sure it appears in all phases where it makes sense.

2. Remove the standalone "Opprett arrangement" button from the page header actions.

3. Add inline event creation state and dialog back (we removed the state in Task 2, but we actually need event creation to stay — just move it to be inside the round card context). **Correction to Task 2:** Keep `showCreateEvent` and the event form state/mutation. Only remove the `clubEvents` query and the Events section JSX.

**Step 2: Commit**

```bash
git add apps/web/src/routes/clubs/\$clubId.tsx
git commit -m "feat: inline event info in current round card"
```

---

### Task 5: Rewrite the club page — upcoming program grid

**Files:**
- Modify: `apps/web/src/routes/clubs/$clubId.tsx`

**Step 1: Add upcoming program section after the current round card**

```tsx
{/* Upcoming program */}
<section>
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-lg font-semibold">Neste i programmet</h2>
  </div>
  {selectableScheduleItems.length === 0 ? (
    <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
      Ingen kommende elementer i programmet.
      {isAdmin && (
        <Button variant="outline" size="sm" className="mt-3 mx-auto block" onClick={() => setShowAddSchedule(true)}>
          Legg til i programmet
        </Button>
      )}
    </div>
  ) : (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {selectableScheduleItems.map((item) => (
        <Link key={item.id} to="/media/$mediaId" params={{ mediaId: item.media.id }}>
          <div className="group flex flex-col gap-2">
            <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-muted shadow-sm ring-1 ring-black/5 transition-shadow group-hover:shadow-md">
              {item.media.coverUrl ? (
                <img src={item.media.coverUrl} alt={item.media.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center p-3 text-xs text-muted-foreground text-center">{item.media.title}</div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium leading-tight truncate">{item.media.title}</p>
              {item.media.authorOrDirector && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">{item.media.authorOrDirector}</p>
              )}
            </div>
          </div>
        </Link>
      ))}
      {isAdmin && (
        <button
          onClick={() => setShowAddSchedule(true)}
          className="flex aspect-[2/3] items-center justify-center rounded-lg border-2 border-dashed border-border text-sm text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
        >
          + Legg til
        </button>
      )}
    </div>
  )}
</section>
```

**Step 2: Commit**

```bash
git add apps/web/src/routes/clubs/\$clubId.tsx
git commit -m "feat: add upcoming program grid with admin add button"
```

---

### Task 6: Clean up — remove dead code and unused imports

**Files:**
- Modify: `apps/web/src/routes/clubs/$clubId.tsx`

**Step 1: Remove unused imports, dead event section code, old schedule grid code**

Check for any remaining references to `clubEvents`, `upcomingEvents`, `pastEvents`. Remove the "Opprett arrangement" button from the header (keep it only in the round card). Clean up unused state variables.

**Step 2: Verify build**

```bash
cd apps/web && npm run build
```

**Step 3: Commit**

```bash
git add apps/web/src/routes/clubs/\$clubId.tsx
git commit -m "refactor: clean up dead code from old layout"
```

---

### Task 7: Deploy and verify

**Step 1: Deploy API**

```bash
cd apps/api && npx wrangler deploy
```

**Step 2: Build and deploy web**

```bash
cd apps/web && npm run build && npx wrangler deploy
```

**Step 3: Verify on live site**

- Completed rounds show as compact rows with cover + title + event date
- Current round card shows book + event + phase actions all in one place
- Upcoming program shows as a small cover grid
- Admin phase override dropdown still works
- Admin can create events from within the round card
- Non-admin users see a clean, simple view

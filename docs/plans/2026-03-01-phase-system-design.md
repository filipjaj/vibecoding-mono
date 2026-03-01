# Phase System Design — Shelf

**Date:** 2026-03-01
**Status:** Approved

## Overview

Implement the core Round/Phase state machine that drives club lifecycle. This is the PRD's central feature: clubs cycle through SELECTION → ACTIVE → EVENT → REVIEW phases per media item. Phases determine what UI is shown and what actions are available.

## Design Decisions

1. **Phase is derived, not stored.** Calculated on-the-fly from round state + event timestamps. No cron jobs or stored transitions needed.
2. **Keep existing thread-based discussions.** More flexible than the PRD's flat comments. Tie threads to rounds when available.
3. **All three selection modes** (admin_picks, rotation, vote) are implemented.
4. **Pacing calculated in API response**, not a separate endpoint.

## Data Model

### New table: `rounds`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| club_id | FK → clubs | |
| media_item_id | FK → media_items, nullable | null during SELECTION phase |
| order | integer | sequential round number |
| selected_by | FK → users, nullable | who picked the media |
| event_id | FK → events, nullable | linked event for this round |
| started_at | timestamp | |
| completed_at | timestamp, nullable | set when round finishes |

### New columns on `clubs`

| Column | Type | Default |
|--------|------|---------|
| selection_mode | enum(admin_picks, rotation, vote) | admin_picks |
| current_round_id | FK → rounds, nullable | |
| pacing_enabled | boolean | true |

### New columns on `media_items`

| Column | Type |
|--------|------|
| page_count | integer, nullable |
| runtime_minutes | integer, nullable |

### New columns on `club_member_progress`

| Column | Type |
|--------|------|
| round_id | FK → rounds |
| current_page | integer, nullable |

### New columns on `reviews`

| Column | Type | Default |
|--------|------|---------|
| round_id | FK → rounds, nullable | |
| visibility | enum(club_only, public) | club_only |

### New table: `nominations`

| Column | Type |
|--------|------|
| id | uuid PK |
| round_id | FK → rounds |
| nominated_by | FK → users |
| media_item_id | FK → media_items |
| pitch | text, nullable |

### New table: `nomination_votes`

| Column | Type |
|--------|------|
| nomination_id | FK → nominations |
| user_id | FK → users |
| created_at | timestamp |

### New table: `rotation_order`

| Column | Type |
|--------|------|
| club_id | FK → clubs |
| user_id | FK → users |
| position | integer |
| last_picked_round_id | FK → rounds, nullable |

## Phase Derivation

```typescript
type Phase = "selection" | "active" | "event" | "review" | "completed"

function derivePhase(round: Round, event: Event | null): Phase {
  if (!round.mediaItemId) return "selection"
  if (!event) return "active"
  const now = new Date()
  if (now < event.startsAt) return "active"
  if (!event.endsAt || now < event.endsAt) return "event"
  if (!round.completedAt) return "review"
  return "completed"
}
```

## API Endpoints

### Rounds & Phases

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/clubs/:id/rounds | All rounds with derived phase |
| GET | /api/clubs/:id/rounds/current | Current round + phase + event + media + progress |
| POST | /api/clubs/:id/rounds | Start new round (admin, enters SELECTION) |
| POST | /api/clubs/:id/rounds/current/select | Admin picks media |
| POST | /api/clubs/:id/rounds/current/advance | Complete round (REVIEW → done) |
| POST | /api/clubs/:id/rounds/current/event | Create event for round |

### Selection (vote mode)

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/clubs/:id/rounds/current/nominations | Nominations with vote counts |
| POST | /api/clubs/:id/rounds/current/nominate | Nominate media item |
| POST | /api/clubs/:id/rounds/current/vote | Vote for nomination |
| POST | /api/clubs/:id/rounds/current/finalize | Admin finalizes winner |

### Progress

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/clubs/:id/rounds/current/progress | All members' progress |
| POST | /api/clubs/:id/rounds/current/progress | Update own progress |

### Other additions

- `PATCH /api/clubs/:id` — update settings
- `GET /api/users/:id/stats` — aggregated stats
- Add `visibility` to review endpoints
- Fix: admin check on schedule PATCH

## Pacing (derived in progress response)

```
pages_remaining = media.page_count - progress.current_page
days_remaining = event.starts_at - now()
pages_per_day = ceil(pages_remaining / days_remaining)
ahead_behind_days = (expected_page - current_page) / pages_per_day
```

## Frontend Architecture

### Phase-driven club page

```
clubs/$clubId.tsx
├── Header (name, badge, settings link)
├── PhaseBanner (phase pill + CTA)
├── PhaseView (switches on derived phase)
│   ├── SelectionView
│   │   ├── AdminPicksView (search → select)
│   │   ├── VoteView (nominations, voting, pitch)
│   │   └── RotationView ("Det er Emmas tur")
│   ├── ActiveView
│   │   ├── MediaCard (cover, title, metadata)
│   │   ├── ProgressTracker (page input, bar)
│   │   ├── PacingWidget ("28 sider/dag")
│   │   └── EventCountdown + RSVP
│   ├── EventView (time, location, attendees, media)
│   └── ReviewView
│       ├── RatingInput (emoji 1-5)
│       ├── ReviewForm (text + visibility)
│       └── ReviewList
├── DiscussionSection
├── EventsSection
├── MembersSection
└── RoundsHistory (past rounds)
```

### Phase badge colors

- SELECTION: blue (bg-blue-100 text-blue-700)
- ACTIVE: green (bg-green-100 text-green-700)
- EVENT: amber (bg-amber-100 text-amber-700)
- REVIEW: purple (bg-purple-100 text-purple-700)

### Dashboard (index.tsx)

Club cards with phase badges + phase-specific CTAs:
- SELECTION: "Velg neste" / "Stem nå"
- ACTIVE: "Side 140/380 — 28s/dag" / countdown
- EVENT: "I kveld kl 19 hos Emma"
- REVIEW: "Du har ikke ratet ennå"

### New components

- `RatingInput` — emoji-based 1-5 (😴 Kjedelig, 😐 Ok, 🙂 Bra, 🤩 Elsket, 🏆 Mesterverk)
- `SpoilerTag` — [spoiler]...[/spoiler] → click-to-reveal
- `PhaseBadge` — colored pill per phase
- `ProgressTracker` — page input + progress bar
- `PacingWidget` — daily target + ahead/behind indicator

### New pages

- `clubs/$clubId/settings.tsx` — admin settings

### Updated flows

- Club creation: add selection_mode, optionally first media + first event
- Profile: add stats section (StatsOverview)

## Bug Fixes (included)

- Add admin check to `PATCH /clubs/:id/schedule/:itemId`
- Replace `alert()` with proper error display in club detail
- Make `.filipjohn.com` domain configurable via env var

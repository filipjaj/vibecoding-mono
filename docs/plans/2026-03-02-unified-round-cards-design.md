# Unified Round-Centric Club Page

## Problem
Program, rounds, and events are presented as three disconnected sections. Users must mentally connect which book belongs to which round and which event.

## Solution
Replace the three separate sections (Current Round, Program grid, Events list) with a single round-centric flow where each round card contains its book, event, and progress.

## Page Layout (top to bottom)

### 1. Club header (unchanged)

### 2. Completed rounds — collapsed rows
- 48px cover thumbnail, title, round number, event date+location, average rating
- Click navigates to media detail page
- Most recent first

### 3. Current round card — hero, expanded
- Phase badge + round number + admin phase override dropdown
- Book cover + title + author + progress/pacing
- Event info inline (date, time, location)
- Phase-specific actions (select media, write review, etc.)
- Selection phase picks from "Neste i programmet" below

### 4. Upcoming program — small cover grid
- Only schedule items with status "upcoming"
- Admin "Legg til" card at the end

### 5. Members (unchanged)

### 6. Discussions (unchanged)

## Removed sections
- **Events section** — event info moves inside round cards
- **Full program grid** — replaced by completed round rows + upcoming grid
- **Separate "Start new round" button** — repositioned below completed rounds

## Key principle
Intuitive for both members (clear "what's happening now") and admins (controls appear in context, not scattered).

## Data
Uses existing `GET /clubs/:clubId/rounds` (returns all rounds with phase + event).

# Landing Page Redesign — "The Quiet Evening"

**Date:** 2026-02-28
**Status:** Approved

## Goal

Transform the landing page from a functional manifesto into an emotionally resonant experience that makes lonely readers/watchers feel warmth and belonging. Target user: someone who consumes culture alone and craves community around it.

## Design Decisions

- **Core emotion:** Warmth & belonging — like being invited into a cozy living room
- **Visual storytelling:** Floating cover art collage behind hero (books + films)
- **Micro-interactions:** Subtle scroll-triggered fade-ins, no external dependencies
- **Pain section:** Expanded with two relatable narrative scenarios before the punchy lines
- **Zero new dependencies** — pure CSS animations + IntersectionObserver

## Section-by-Section Design

### 1. Hero

Full viewport height. Cover art collage (8-10 hardcoded book/film cover rectangles) positioned absolutely behind the headline at ~15% opacity, rotated at slight angles (-6° to +8°), using the existing `gradient-drift` animation at varied speeds/delays. On mobile, reduce to 5-6 covers.

Cover titles (colored rectangles with text, no images):
- Norwegian: Naiv. Super., Min kamp, Doppler
- International: Normal People, The Secret History, Parasite, Spirited Away, In the Mood for Love, Kafka on the Shore, My Brilliant Friend

**Headline:** "Kulturen er bedre sammen."
**Sub-headline:** "Start en bok- eller filmklubb med folkene som betyr noe. Shelf holder den i live."
**CTA:** "Kom i gang — det er gratis" → /login

Hero content fades in on load (0.6s ease-out, slight translateY).

### 2. Pain Section (expanded)

Dark inverted section (`bg-foreground text-background`). Four beats:

**Beat 1 — Film watcher** (italic, text-lg/sm:text-xl, text-background/70):
> "Du har akkurat sett en film som forandret alt.
> Du lukker laptopen.
> Ingen å snakke med."

**Beat 2 — Reader** (italic, same style):
> "Bokhyllen din er full av historier du aldri har delt.
> Du har meninger. Du har terningkast i hodet.
> Men ingen spør."

**Beat 3 — Punchy lines** (bold, text-xl/sm:text-2xl, full opacity, after visual gap):
> Du leser alene.
> Du glemmer å møtes.
> Gruppechatten drukner i memes.

**Beat 4 — The turn** (italic, text-lg, text-background/80):
> "Det trenger ikke være sånn."

Each beat fades in on scroll with staggered lines (100ms delay between lines within a beat).

### 3. Vision — 4 Pillars

Same content and layout as current. Scroll-triggered fade-up animation with stagger (0, 100ms, 200ms, 300ms). Colored dot scales from 0 to full size on enter.

### 4. How It Works

Same content and layout. Scroll-triggered fade-in with stagger. Step numbers transition from 0% to 10% opacity on enter.

### 5. Final CTA

**Headline:** "Du trenger ikke lese alene."
**Sub-headline:** "Bøker og filmer er bedre sammen. 2026 er ditt år."
**CTA:** "Opprett din første klubb" → /login

Same gradient blobs as current.

## Technical Approach

### Scroll Animation System

A `useScrollReveal` hook (~30 lines):
- Uses `IntersectionObserver` with threshold 0.15
- Elements with `data-reveal` start at `opacity: 0; transform: translateY(20px)`
- On intersection, class added → transitions to visible
- `data-delay` attribute for staggered reveals (e.g., `data-delay="100"`)
- CSS transition: `0.6s cubic-bezier(0.22, 1, 0.36, 1)`
- Respects `prefers-reduced-motion`: skip translateY, just do opacity fade

### Cover Art Collage

Hardcoded array of cover objects: `{ title, color, rotation, position, size, animationDuration }`. Rendered as absolutely-positioned divs with:
- Rounded corners, slight shadow
- Background color from a warm palette
- Title text centered
- `gradient-drift` animation at different durations (10-20s)
- `opacity: 0.12-0.18` range
- Hidden on very small screens where they'd overlap text too much

### CSS Additions

- `@keyframes fade-up` for the hero load animation
- `.reveal` / `.reveal-visible` classes for scroll animations
- `transition-delay` utility via inline style from `data-delay`
- `prefers-reduced-motion` overrides for all new animations

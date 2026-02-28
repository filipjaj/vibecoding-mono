# Landing Page Design — Norwegian Manifesto Style

**Date:** 2026-02-28
**Status:** Approved
**File to modify:** `apps/web/src/routes/index.tsx` (the `SignedOutHome` component)

## Overview

A single-scroll, emotionally-driven landing page in Norwegian. Bold typography, pure copy + abstract visuals (CSS gradients), no screenshots. The tone is playful and gen-z but professionally designed — serious and sophisticated.

The core message: **culture is better together**. Shelf encourages people to start book clubs and film clubs, to be more social, to discuss and enjoy culture as humans.

## Visual Direction

- **Typography-first:** Big display headings, generous whitespace, DM Sans Variable
- **Color:** Uses existing warm palette (purple primary, warm accent tones)
- **Abstract visuals:** CSS radial gradient blobs with slow drift animation — no images
- **Layout:** Full-width sections with alternating light/dark backgrounds
- **Mobile:** Fully responsive, stacked layouts on small screens

## Page Structure

### Section 1: Hero (full viewport height)

**Layout:** Centered content, subtle animated gradient background.

**Copy:**
- Headline: "Kulturen er bedre sammen."
- Subtitle: "Shelf gjør det enkelt å starte en bokklubb eller filmklubb med vennene dine — og faktisk holde den i live."
- CTA button: "Kom i gang — det er gratis" → `/login`

**Visual treatment:**
- Headline: `text-5xl sm:text-7xl font-bold tracking-tight`
- Subtitle: lighter weight, `text-lg sm:text-xl text-muted-foreground`, `max-w-2xl`
- Radial gradient blob behind text (CSS only), gentle animation (slow drift/pulse)
- Full min-h-screen with flexbox centering

### Section 2: The Pain (problem statement)

**Layout:** Dark/inverted background strip. Three punchy lines stacked vertically.

**Copy (each line displayed separately):**
1. "Du leser alene."
2. "Du glemmer å møtes."
3. "Gruppechatten drukner i memes."

**Visual treatment:**
- Background: inverted colors (`bg-foreground text-background`)
- Text: `text-xl sm:text-2xl`, centered, generous vertical spacing
- Compact section — just enough breathing room
- No icons, no cards — raw typography only

### Section 3: The Vision (4 pillars)

**Layout:** Light background. 2x2 grid on desktop, stacked on mobile.

| Pillar | Headline | One-liner |
|--------|----------|-----------|
| Klubber | **Start en klubb** | Inviter vennene dine med en lenke. Ferdig. |
| Leseplan | **Lag en leseplan** | Velg bøker eller filmer, sett datoer, hold oversikten. |
| Anmeldelser | **Del meningene dine** | Gi terningkast, skriv anmeldelser, se hva vennene synes. |
| Møter | **Møt opp** | Planlegg neste treff, send påmeldinger, hold klubben i live. |

**Visual treatment:**
- Small colored dot above each headline (using chart colors for variety)
- Headlines: `text-lg font-semibold`
- One-liners: `text-muted-foreground`
- No cards or borders — clean typography grid

### Section 4: How It Works (3 steps)

**Layout:** 3 horizontal steps on desktop, stacked on mobile. Large numbered steps.

| Step | Title | Description |
|------|-------|-------------|
| 01 | Opprett en klubb | Velg om det er bok eller film. Gi den et navn. |
| 02 | Inviter vennene | Del invitasjonslenken. De er med på sekunder. |
| 03 | Begynn reisen | Legg til bøker, sett opp møter, og nyt kulturen sammen. |

**Visual treatment:**
- Large step numbers: `text-6xl font-bold text-primary/10`
- Step text alongside/below in normal weight
- Horizontal layout with subtle separators on desktop

### Section 5: Final CTA

**Layout:** Full-width centered section with gradient treatment (bookend with hero).

**Copy:**
- Headline: "Din neste bokklubb starter her."
- Subtitle: "Shelf er gratis. Ingen kredittkort. Bare kultur og gode samtaler."
- CTA button: "Opprett din første klubb" → `/login`

**Visual treatment:**
- Same gradient blob approach as hero section
- Large primary button with subtle hover animation

## Technical Notes

- All in `SignedOutHome` component within `apps/web/src/routes/index.tsx`
- No new dependencies needed — pure Tailwind CSS for all visuals
- Gradient animations via CSS `@keyframes` (no JS animation library)
- Landing page only shows for unauthenticated users (existing `session` check stays)
- AppShell header/nav still wraps the page (existing behavior)

## YAGNI — Excluded

- No scroll animations / intersection observer (keep it simple)
- No testimonials or social proof (no users yet)
- No footer (minimal MVP)
- No dark mode variant (not in scope)
- No analytics tracking on CTA clicks

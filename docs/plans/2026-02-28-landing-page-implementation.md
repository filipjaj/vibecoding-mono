# Landing Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the minimal `SignedOutHome` component with a beautiful, emotionally-driven Norwegian landing page that communicates Shelf's value proposition.

**Architecture:** Single component replacement in `apps/web/src/routes/index.tsx`. The `SignedOutHome` component gets replaced with a multi-section landing page. CSS gradient animations are added to `apps/web/src/styles.css`. No new files, no new dependencies.

**Tech Stack:** React 19, Tailwind CSS v4, DM Sans Variable font, CSS @keyframes for gradient animation

---

### Task 1: Add CSS gradient animation keyframes

**Files:**
- Modify: `apps/web/src/styles.css`

**Step 1: Add keyframes to styles.css**

Add the following at the end of the file, before the closing of `@layer base` or after it:

```css
@keyframes gradient-drift {
  0%, 100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.4;
  }
  33% {
    transform: translate(30px, -20px) scale(1.05);
    opacity: 0.5;
  }
  66% {
    transform: translate(-20px, 15px) scale(0.95);
    opacity: 0.35;
  }
}
```

**Step 2: Verify the dev server still works**

Run: `cd apps/web && bun run dev`
Expected: Dev server starts without CSS errors. Verify at http://localhost:3000.

**Step 3: Commit**

```bash
git add apps/web/src/styles.css
git commit -m "feat: add CSS gradient drift animation for landing page"
```

---

### Task 2: Build the Hero section

**Files:**
- Modify: `apps/web/src/routes/index.tsx` — replace the `SignedOutHome` component

**Step 1: Replace SignedOutHome with Hero section**

Replace the entire `SignedOutHome` function with:

```tsx
function SignedOutHome() {
  return (
    <div className="-mx-4 -mt-8 sm:-mx-6">
      {/* Hero */}
      <section className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden px-4 text-center">
        {/* Gradient blobs */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[100px]"
          style={{ animation: "gradient-drift 12s ease-in-out infinite" }}
        />
        <div
          className="pointer-events-none absolute left-1/3 top-1/3 h-[300px] w-[300px] rounded-full bg-chart-3/20 blur-[80px]"
          style={{ animation: "gradient-drift 15s ease-in-out infinite reverse" }}
        />

        <div className="relative z-10 flex flex-col items-center gap-6">
          <h1 className="max-w-4xl text-5xl font-bold tracking-tight sm:text-7xl">
            Kulturen er bedre sammen.
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Shelf gjør det enkelt å starte en bokklubb eller filmklubb med
            vennene dine — og faktisk holde den i live.
          </p>
          <Button
            size="lg"
            className="mt-4 px-8 text-base"
            render={<Link to="/login" />}
          >
            Kom i gang — det er gratis
          </Button>
        </div>
      </section>
    </div>
  );
}
```

**Step 2: Verify in browser**

Run dev server if not already running. Navigate to http://localhost:3000 (signed out).
Expected: Full-height hero with animated gradient blobs, bold headline, subtitle, and CTA button.

**Step 3: Commit**

```bash
git add apps/web/src/routes/index.tsx
git commit -m "feat: add hero section for Norwegian landing page"
```

---

### Task 3: Add the Pain section (problem statement)

**Files:**
- Modify: `apps/web/src/routes/index.tsx`

**Step 1: Add Pain section after the Hero section closing tag**

Inside `SignedOutHome`, after the `</section>` for the hero and before the closing `</div>`, add:

```tsx
      {/* Pain */}
      <section className="bg-foreground px-4 py-20 text-center text-background sm:py-28">
        <div className="mx-auto flex max-w-2xl flex-col gap-4 sm:gap-6">
          <p className="text-xl font-medium sm:text-2xl">Du leser alene.</p>
          <p className="text-xl font-medium sm:text-2xl">Du glemmer å møtes.</p>
          <p className="text-xl font-medium sm:text-2xl">
            Gruppechatten drukner i memes.
          </p>
        </div>
      </section>
```

**Step 2: Verify in browser**

Scroll past the hero section.
Expected: Dark inverted section with three punchy lines stacked, generous spacing.

**Step 3: Commit**

```bash
git add apps/web/src/routes/index.tsx
git commit -m "feat: add pain section with problem statement copy"
```

---

### Task 4: Add the Vision section (4 pillars)

**Files:**
- Modify: `apps/web/src/routes/index.tsx`

**Step 1: Add Vision section after Pain section**

After the Pain `</section>`, add:

```tsx
      {/* Vision — 4 pillars */}
      <section className="px-4 py-20 sm:py-28">
        <div className="mx-auto grid max-w-4xl gap-12 sm:grid-cols-2 sm:gap-16">
          {[
            {
              color: "bg-chart-1",
              title: "Start en klubb",
              desc: "Inviter vennene dine med en lenke. Ferdig.",
            },
            {
              color: "bg-chart-2",
              title: "Lag en leseplan",
              desc: "Velg bøker eller filmer, sett datoer, hold oversikten.",
            },
            {
              color: "bg-chart-4",
              title: "Del meningene dine",
              desc: "Gi terningkast, skriv anmeldelser, se hva vennene synes.",
            },
            {
              color: "bg-chart-3",
              title: "Møt opp",
              desc: "Planlegg neste treff, send påmeldinger, hold klubben i live.",
            },
          ].map((pillar) => (
            <div key={pillar.title} className="flex flex-col gap-2">
              <div className={`h-2 w-2 rounded-full ${pillar.color}`} />
              <h3 className="text-lg font-semibold">{pillar.title}</h3>
              <p className="text-muted-foreground">{pillar.desc}</p>
            </div>
          ))}
        </div>
      </section>
```

**Step 2: Verify in browser**

Scroll to the pillars section.
Expected: 2x2 grid on desktop with colored dots, stacked on mobile. Clean typography, no cards.

**Step 3: Commit**

```bash
git add apps/web/src/routes/index.tsx
git commit -m "feat: add vision section with four feature pillars"
```

---

### Task 5: Add the How It Works section (3 steps)

**Files:**
- Modify: `apps/web/src/routes/index.tsx`

**Step 1: Add How It Works section after Vision section**

After the Vision `</section>`, add:

```tsx
      {/* How it works */}
      <section className="border-t border-border/60 px-4 py-20 sm:py-28">
        <div className="mx-auto grid max-w-5xl gap-12 sm:grid-cols-3 sm:gap-8">
          {[
            {
              step: "01",
              title: "Opprett en klubb",
              desc: "Velg om det er bok eller film. Gi den et navn.",
            },
            {
              step: "02",
              title: "Inviter vennene",
              desc: "Del invitasjonslenken. De er med på sekunder.",
            },
            {
              step: "03",
              title: "Begynn reisen",
              desc: "Legg til bøker, sett opp møter, og nyt kulturen sammen.",
            },
          ].map((item) => (
            <div key={item.step} className="flex flex-col gap-2">
              <span className="text-6xl font-bold text-primary/10">
                {item.step}
              </span>
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
```

**Step 2: Verify in browser**

Scroll to the steps section.
Expected: Three columns on desktop with large faded step numbers, stacked on mobile.

**Step 3: Commit**

```bash
git add apps/web/src/routes/index.tsx
git commit -m "feat: add how-it-works section with numbered steps"
```

---

### Task 6: Add the Final CTA section

**Files:**
- Modify: `apps/web/src/routes/index.tsx`

**Step 1: Add Final CTA section after How It Works section**

After the How It Works `</section>`, add:

```tsx
      {/* Final CTA */}
      <section className="relative overflow-hidden px-4 py-24 text-center sm:py-32">
        {/* Gradient blobs — bookend with hero */}
        <div
          className="pointer-events-none absolute right-1/3 top-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-primary/15 blur-[100px]"
          style={{ animation: "gradient-drift 14s ease-in-out infinite" }}
        />
        <div
          className="pointer-events-none absolute left-1/4 bottom-1/4 h-[250px] w-[250px] rounded-full bg-chart-3/15 blur-[80px]"
          style={{ animation: "gradient-drift 18s ease-in-out infinite reverse" }}
        />

        <div className="relative z-10 flex flex-col items-center gap-4">
          <h2 className="max-w-xl text-3xl font-bold tracking-tight sm:text-5xl">
            Din neste bokklubb starter her.
          </h2>
          <p className="mx-auto max-w-md text-muted-foreground sm:text-lg">
            Shelf er gratis. Ingen kredittkort. Bare kultur og gode samtaler.
          </p>
          <Button
            size="lg"
            className="mt-4 px-8 text-base"
            render={<Link to="/login" />}
          >
            Opprett din første klubb
          </Button>
        </div>
      </section>
```

**Step 2: Verify in browser**

Scroll to the bottom of the page.
Expected: CTA section with gradient blobs (matching hero), headline, subtitle, and CTA button.

**Step 3: Commit**

```bash
git add apps/web/src/routes/index.tsx
git commit -m "feat: add final CTA section to landing page"
```

---

### Task 7: Adjust AppShell for landing page layout

**Files:**
- Modify: `apps/web/src/routes/index.tsx`

**Step 1: Verify layout integrity**

The `SignedOutHome` component uses `-mx-4 -mt-8 sm:-mx-6` to break out of the AppShell's `px-4 py-8 sm:px-6` padding. Verify in the browser that:
- The hero section extends full-width (no visible gaps at edges)
- The dark Pain section goes edge-to-edge
- The mobile bottom nav doesn't overlap the final CTA (the AppShell already applies `pb-24 sm:pb-8`)

If there are gaps at the edges, also add `-mb-8 sm:-mb-8` to the root div to handle bottom padding.

**Step 2: Fix any spacing issues found**

If the bottom padding from AppShell creates visible white space below the final CTA, add `-mb-8 sm:-mb-8` to the root wrapper div's className.

**Step 3: Commit (if changes were made)**

```bash
git add apps/web/src/routes/index.tsx
git commit -m "fix: adjust landing page spacing for full-bleed layout"
```

---

### Task 8: Final visual polish pass

**Files:**
- Modify: `apps/web/src/routes/index.tsx` (if needed)
- Modify: `apps/web/src/styles.css` (if needed)

**Step 1: Check mobile responsiveness**

Open browser dev tools, test at:
- 375px wide (iPhone SE)
- 390px wide (iPhone 14)
- 768px wide (iPad)
- 1280px wide (desktop)

Expected: All sections look good at all breakpoints. Text is readable, nothing overflows.

**Step 2: Check visual coherence**

- Gradient blobs are subtle, not distracting
- Dark section (Pain) has good contrast
- CTA buttons are prominent and clickable
- Typography hierarchy is clear: hero > section headings > body

**Step 3: Fix any issues found and commit**

```bash
git add -A
git commit -m "fix: polish landing page responsiveness and visual details"
```

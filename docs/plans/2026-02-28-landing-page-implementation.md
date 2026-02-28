# Landing Page Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the Shelf landing page to feel warm and emotionally resonant — floating cover art collage, narrative pain section, scroll-triggered animations.

**Architecture:** All changes in `SignedOutHome` component in `src/routes/index.tsx`, CSS additions in `src/styles.css`, and a new `useScrollReveal` hook. Zero new dependencies — pure CSS animations + IntersectionObserver.

**Tech Stack:** React 19, Tailwind v4, CSS keyframes, IntersectionObserver API

**Design doc:** `docs/plans/2026-02-28-landing-page-redesign.md`

---

### Task 1: Add scroll reveal CSS and keyframes

**Files:**
- Modify: `apps/web/src/styles.css` (append after existing `gradient-drift` keyframes, ~line 128)

**Step 1: Add CSS animations**

Append after the existing `@media (prefers-reduced-motion)` block:

```css
@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-fade-in {
  animation: fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1),
              transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}

.reveal-visible {
  opacity: 1;
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  @keyframes fade-up {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .hero-fade-in {
    animation: fade-up 0.6s ease both;
  }
  .reveal {
    transform: none;
    transition: opacity 0.6s ease;
  }
}
```

**Step 2: Verify dev server runs**

Run: `bun run --filter web dev`
Expected: Vite starts on port 3000 without CSS errors.

**Step 3: Commit**

```bash
git add apps/web/src/styles.css
git commit -m "feat: add scroll reveal and fade-up CSS animations"
```

---

### Task 2: Create the `useScrollReveal` hook

**Files:**
- Create: `apps/web/src/hooks/use-scroll-reveal.ts`

**Step 1: Create hooks directory and file**

```typescript
import { useEffect, useRef } from "react";

/**
 * Attaches an IntersectionObserver to a container element.
 * All descendants with the `reveal` class get `reveal-visible` added
 * when they scroll into view. Supports `data-delay` for staggered reveals.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const elements = container.querySelectorAll<HTMLElement>(".reveal");
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const delay = el.dataset.delay;
            if (delay) {
              el.style.transitionDelay = `${delay}ms`;
            }
            el.classList.add("reveal-visible");
            observer.unobserve(el);
          }
        }
      },
      { threshold: 0.15 }
    );

    for (const el of elements) {
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  return ref;
}
```

**Step 2: Commit**

```bash
git add apps/web/src/hooks/use-scroll-reveal.ts
git commit -m "feat: add useScrollReveal hook with IntersectionObserver"
```

---

### Task 3: Rewrite `SignedOutHome` with all sections

This is the main task. Replace the entire `SignedOutHome` function in `apps/web/src/routes/index.tsx`.

**Files:**
- Modify: `apps/web/src/routes/index.tsx`

**Step 1: Add import for useScrollReveal**

At the top of the file, add:

```typescript
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
```

**Step 2: Add cover art data before the `Dashboard` function**

```typescript
const COVERS: {
  title: string;
  color: string;
  rotation: number;
  top: string;
  left?: string;
  right?: string;
  size: string;
  duration: number;
  mobileHidden: boolean;
}[] = [
  { title: "Naiv. Super.", color: "bg-chart-1/15", rotation: -5, top: "8%", left: "5%", size: "w-20 h-28 sm:w-24 sm:h-34", duration: 14, mobileHidden: false },
  { title: "Normal People", color: "bg-chart-2/15", rotation: 4, top: "15%", right: "8%", size: "w-18 h-26 sm:w-22 sm:h-32", duration: 17, mobileHidden: false },
  { title: "Parasite", color: "bg-chart-4/15", rotation: -3, top: "55%", left: "8%", size: "w-16 h-24 sm:w-20 sm:h-28", duration: 12, mobileHidden: false },
  { title: "Spirited Away", color: "bg-chart-3/15", rotation: 7, top: "60%", right: "6%", size: "w-18 h-26 sm:w-24 sm:h-34", duration: 19, mobileHidden: false },
  { title: "Doppler", color: "bg-chart-5/15", rotation: -8, top: "35%", left: "3%", size: "w-14 h-20 sm:w-18 sm:h-26", duration: 16, mobileHidden: false },
  { title: "The Secret History", color: "bg-chart-1/12", rotation: 3, top: "40%", right: "4%", size: "w-16 h-24 sm:w-20 sm:h-28", duration: 13, mobileHidden: true },
  { title: "Min kamp", color: "bg-chart-4/12", rotation: -4, top: "75%", left: "15%", size: "w-14 h-20 sm:w-18 sm:h-26", duration: 20, mobileHidden: true },
  { title: "Kafka on the Shore", color: "bg-chart-2/12", rotation: 6, top: "78%", right: "12%", size: "w-14 h-20 sm:w-16 sm:h-24", duration: 15, mobileHidden: true },
];
```

**Step 3: Replace the entire `SignedOutHome` function**

```tsx
function SignedOutHome() {
  const painRef = useScrollReveal();
  const pillarsRef = useScrollReveal();
  const stepsRef = useScrollReveal();

  return (
    <div className="-mx-4 -mt-8 -mb-8 sm:-mx-6 sm:-mb-8">
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

        {/* Floating cover art collage */}
        {COVERS.map((cover) => (
          <div
            key={cover.title}
            className={`pointer-events-none absolute ${cover.size} ${cover.color} ${cover.mobileHidden ? "hidden sm:flex" : "flex"} items-center justify-center rounded-lg shadow-sm`}
            style={{
              top: cover.top,
              left: cover.left,
              right: cover.right,
              transform: `rotate(${cover.rotation}deg)`,
              animation: `gradient-drift ${cover.duration}s ease-in-out infinite`,
            }}
          >
            <span className="text-[9px] sm:text-[10px] font-medium text-foreground/30 text-center leading-tight px-1.5">
              {cover.title}
            </span>
          </div>
        ))}

        <div className="hero-fade-in relative z-10 flex flex-col items-center gap-6">
          <h1 className="max-w-4xl text-5xl font-bold tracking-tight sm:text-7xl">
            Kulturen er bedre sammen.
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Start en bok- eller filmklubb med folkene som betyr noe.
            Shelf holder den i live.
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

      {/* Pain */}
      <section
        ref={painRef}
        className="bg-foreground px-4 py-20 text-center text-background sm:py-28"
      >
        <div className="mx-auto flex max-w-2xl flex-col gap-10 sm:gap-14">
          {/* Beat 1 — Film watcher */}
          <div className="reveal flex flex-col gap-1">
            <p className="text-lg italic text-background/70 sm:text-xl">
              Du har akkurat sett en film som forandret alt.
            </p>
            <p
              className="reveal text-lg italic text-background/70 sm:text-xl"
              data-delay="100"
            >
              Du lukker laptopen.
            </p>
            <p
              className="reveal text-lg italic text-background/70 sm:text-xl"
              data-delay="200"
            >
              Ingen å snakke med.
            </p>
          </div>

          {/* Beat 2 — Reader */}
          <div className="reveal flex flex-col gap-1">
            <p className="text-lg italic text-background/70 sm:text-xl">
              Bokhyllen din er full av historier du aldri har delt.
            </p>
            <p
              className="reveal text-lg italic text-background/70 sm:text-xl"
              data-delay="100"
            >
              Du har meninger. Du har terningkast i hodet.
            </p>
            <p
              className="reveal text-lg italic text-background/70 sm:text-xl"
              data-delay="200"
            >
              Men ingen spør.
            </p>
          </div>

          {/* Beat 3 — Punchy lines */}
          <div className="flex flex-col gap-4 sm:gap-6">
            <p className="reveal text-xl font-medium sm:text-2xl">
              Du leser alene.
            </p>
            <p
              className="reveal text-xl font-medium sm:text-2xl"
              data-delay="100"
            >
              Du glemmer å møtes.
            </p>
            <p
              className="reveal text-xl font-medium sm:text-2xl"
              data-delay="200"
            >
              Gruppechatten drukner i memes.
            </p>
          </div>

          {/* Beat 4 — The turn */}
          <p className="reveal text-lg italic text-background/80 sm:text-xl">
            Det trenger ikke være sånn.
          </p>
        </div>
      </section>

      {/* Vision — 4 pillars */}
      <section ref={pillarsRef} className="px-4 py-20 sm:py-28">
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
          ].map((pillar, i) => (
            <div
              key={pillar.title}
              className="reveal flex flex-col gap-2"
              data-delay={String(i * 100)}
            >
              <div className={`h-2 w-2 rounded-full ${pillar.color}`} />
              <h3 className="text-lg font-semibold">{pillar.title}</h3>
              <p className="text-muted-foreground">{pillar.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section
        ref={stepsRef}
        className="border-t border-border/60 px-4 py-20 sm:py-28"
      >
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
          ].map((item, i) => (
            <div
              key={item.step}
              className="reveal flex flex-col gap-2"
              data-delay={String(i * 100)}
            >
              <span className="text-6xl font-bold text-primary/10">
                {item.step}
              </span>
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden px-4 py-24 text-center sm:py-32">
        {/* Gradient blobs */}
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
            Du trenger ikke lese alene.
          </h2>
          <p className="mx-auto max-w-md text-muted-foreground sm:text-lg">
            Bøker og filmer er bedre sammen. 2026 er ditt år.
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
    </div>
  );
}
```

**Step 4: Verify in browser**

Open `http://localhost:3000` (signed out). Full scroll-through:
- Hero: covers float behind headline, content fades in
- Pain: narrative beats reveal on scroll with stagger
- Pillars: cards fade up with stagger
- Steps: same stagger pattern
- Final CTA: emotional close with gradient blobs

**Step 5: Commit**

```bash
git add apps/web/src/routes/index.tsx
git commit -m "feat: redesign landing page with emotional narrative and cover collage"
```

---

### Task 4: Visual QA and polish

**Files:**
- Modify: `apps/web/src/routes/index.tsx` (if needed)
- Modify: `apps/web/src/styles.css` (if needed)

**Step 1: Test mobile viewports**

Check at 375px, 390px, 768px, 1280px:
- No horizontal overflow
- Cover art doesn't overlap headline text
- Pain section text is readable on dark background
- CTA buttons are tappable (min 44px touch target)

**Step 2: Test `prefers-reduced-motion`**

In Chrome DevTools → Rendering → Emulate CSS media feature `prefers-reduced-motion: reduce`:
- Gradient blobs should be static
- Hero should still fade in (opacity only, no translateY)
- Scroll reveals should fade (opacity only)

**Step 3: Fix any issues and commit**

```bash
git add apps/web/src/routes/index.tsx apps/web/src/styles.css
git commit -m "fix: polish landing page responsiveness and accessibility"
```

# Responsive Design Patterns

Hvordan tilpasse designprofiler til ulike skjermstørrelser.
Profil-tokens er typisk definert for desktop — denne guiden viser hvordan
de skaleres ned.

---

## Breakpoints (standard)

```
sm:  640px   — Stor mobil / liten tablet
md:  768px   — Tablet
lg:  1024px  — Liten desktop
xl:  1280px  — Desktop
2xl: 1536px  — Stor desktop
```

---

## Typografi-skalering

### Generell regel

Desktop-verdier fra profilen er for `lg`+. Skaler ned med disse faktorene:

| Profil-verdi | Mobil (base) | Tablet (md) | Desktop (lg+) |
|---|---|---|---|
| `6rem` (96px) | `2.5rem` | `4rem` | `6rem` |
| `4rem` (64px) | `2rem` | `3rem` | `4rem` |
| `3rem` (48px) | `1.75rem` | `2.25rem` | `3rem` |
| `2rem` (32px) | `1.5rem` | `1.75rem` | `2rem` |
| `1.5rem` (24px) | `1.25rem` | `1.375rem` | `1.5rem` |
| `1.125rem` (18px) | `1rem` | `1rem` | `1.125rem` |

### Eksempler per profil

#### Scandinavian Editorial
```html
<h1 class="
  font-heading font-normal
  text-[2rem] leading-[1.2]
  md:text-[3rem]
  lg:text-[4rem] lg:leading-[1.1]
  tracking-[-0.02em]
">
  Overskrift
</h1>
```

#### Bold Brutalist
```html
<h1 class="
  font-heading font-bold uppercase
  text-[2.5rem] leading-[0.95]
  md:text-[4rem]
  lg:text-[6rem]
  tracking-[-0.03em]
">
  OVERSKRIFT
</h1>
```

#### Soft SaaS
```html
<h1 class="
  font-heading font-bold
  text-[2rem] leading-[1.2]
  md:text-[2.75rem]
  lg:text-[3.5rem] lg:leading-[1.1]
  tracking-[-0.02em]
">
  Overskrift
</h1>
```

---

## Section Spacing

### Generell regel

Section-padding skaleres med ca. 50% på mobil:

| Profil-verdi | Mobil (base) | Tablet (md) | Desktop (lg+) |
|---|---|---|---|
| `160px` (luftig) | `64px` | `100px` | `160px` |
| `100px` (standard) | `48px` | `72px` | `100px` |
| `80px` (kompakt) | `40px` | `60px` | `80px` |
| `64px` (tight) | `32px` | `48px` | `64px` |

### Eksempler

```html
<!-- Scandinavian Editorial: Luftig -->
<section class="py-16 md:py-24 lg:py-40">

<!-- Bold Brutalist: Kompakt -->
<section class="py-10 md:py-14 lg:py-20">

<!-- Soft SaaS: Standard -->
<section class="py-12 md:py-18 lg:py-24">
```

---

## Grid og Layout

### Content-bredde

```html
<!-- Alltid med side-padding på mobil -->
<div class="
  max-w-[--spacing-content-max-width]
  mx-auto
  px-4 sm:px-6 lg:px-8
">
```

### Kort-grid

```html
<!-- 1 kolonne → 2 → 3 (eller 4) -->
<div class="
  grid
  grid-cols-1
  sm:grid-cols-2
  lg:grid-cols-3
  gap-4 sm:gap-6 lg:gap-8
">
```

### Sidebar-layout

```html
<!-- Stack på mobil, side-by-side på desktop -->
<div class="
  flex flex-col
  lg:flex-row
  gap-6 lg:gap-12
">
  <aside class="w-full lg:w-64 lg:shrink-0">Sidebar</aside>
  <main class="flex-1 min-w-0">Innhold</main>
</div>
```

---

## Navigation

### Mobil-mønster

Alle profiler bruker hamburger/sheet-meny på mobil, men stilen varierer:

#### Scandinavian Editorial

```html
<nav>
  <!-- Desktop -->
  <div class="hidden md:flex gap-8">
    <a class="text-[0.8125rem] uppercase tracking-[0.08em]">Lenke</a>
  </div>

  <!-- Mobil: Fullskjerm overlay -->
  <div class="
    fixed inset-0
    bg-[--color-background-primary]
    flex flex-col items-center justify-center
    gap-8
    md:hidden
  ">
    <a class="
      font-heading text-[2rem] font-normal
      text-[--color-text-primary]
    ">Lenke</a>
  </div>
</nav>
```

#### Bold Brutalist

```html
<nav>
  <!-- Mobil: Slide-in med hard border -->
  <div class="
    fixed inset-y-0 right-0 w-full max-w-sm
    bg-[--color-background-primary]
    border-l-[3px] border-[--color-border-default]
    p-6
    md:hidden
  ">
    <a class="
      block py-3
      border-b-[3px] border-[--color-border-default]
      font-mono text-lg font-bold uppercase
    ">LENKE</a>
  </div>
</nav>
```

#### Soft SaaS

```html
<nav>
  <!-- Mobil: Bottom sheet -->
  <div class="
    fixed inset-x-0 bottom-0
    bg-[--color-background-secondary]
    border-t border-[--color-border-default]
    rounded-t-[--radius-large]
    p-6
    md:hidden
  ">
    <a class="
      block py-2.5
      text-[--color-text-primary] text-base font-medium
      rounded-[--radius-medium]
      px-3
      hover:bg-[--color-background-tertiary]
    ">Lenke</a>
  </div>
</nav>
```

---

## Hero-tilpasninger

### Layout-endringer på mobil

```html
<!-- Desktop: Side-by-side. Mobil: Stacked -->
<section class="
  flex flex-col-reverse
  lg:flex-row lg:items-center
  gap-8 lg:gap-16
">
  <div class="flex-1">
    <h1>Overskrift</h1>
    <p>Tekst</p>
    <button>CTA</button>
  </div>
  <div class="flex-1">
    <img src="hero.jpg" class="
      w-full
      rounded-[--radius-medium]
      lg:rounded-[--radius-large]
    " />
  </div>
</section>
```

### CTA-knapper på mobil

```html
<!-- Desktop: Inline. Mobil: Full-width stacked -->
<div class="
  flex flex-col sm:flex-row
  gap-3
">
  <button class="w-full sm:w-auto bg-accent ...">Primær</button>
  <button class="w-full sm:w-auto ...">Sekundær</button>
</div>
```

---

## Bilder

### Aspect ratio per kontekst

```html
<!-- Hero-bilde -->
<img class="
  w-full
  aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/9]
  object-cover
  rounded-[--radius-medium]
" />

<!-- Card-bilde -->
<img class="
  w-full
  aspect-[4/3] sm:aspect-[3/2]
  object-cover
" />

<!-- Avatar -->
<img class="
  w-10 h-10 sm:w-12 sm:h-12
  rounded-full object-cover
" />
```

---

## Modal på mobil

```html
<!-- Desktop: Sentrert modal. Mobil: Full-width bottom sheet -->
<div class="
  fixed inset-0 z-50
  flex items-end sm:items-center justify-center
">
  <div class="
    bg-[--color-background-primary]
    w-full sm:max-w-lg
    rounded-t-[--radius-large] sm:rounded-[--radius-large]
    p-6 sm:p-8
    max-h-[90vh] overflow-auto
  ">
    <!-- Innhold -->
  </div>
</div>
```

---

## Toast/Notification på mobil

```html
<!-- Desktop: Høyre hjørne. Mobil: Full-width top -->
<div class="
  fixed
  top-4 left-4 right-4
  sm:top-auto sm:left-auto sm:bottom-6 sm:right-6
  sm:max-w-sm
  z-50
">
  <!-- Toast-komponent -->
</div>
```

---

## Tabeller på mobil

### Horisontal scroll

```html
<div class="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
  <table class="min-w-full">
    <!-- Tabell-innhold -->
  </table>
</div>
```

### Stacked cards (alternativ)

```html
<!-- Desktop: Tabell. Mobil: Kort -->
<div class="hidden sm:block">
  <table><!-- Normal tabell --></table>
</div>
<div class="sm:hidden space-y-3">
  <!-- Hver rad blir et kort -->
  <div class="
    bg-[--color-background-secondary]
    rounded-[--radius-medium]
    border border-[--color-border-default]
    p-4
  ">
    <div class="flex justify-between">
      <span class="text-sm text-[--color-text-secondary]">Navn</span>
      <span class="text-sm font-medium text-[--color-text-primary]">Verdi</span>
    </div>
  </div>
</div>
```

---

## Oppsummering

| Aspekt | Mobil | Tablet | Desktop |
|---|---|---|---|
| Typografi | ~60% av desktop | ~80% av desktop | 100% (profil-verdi) |
| Section-padding | ~40-50% | ~65-75% | 100% |
| Grid-kolonner | 1 | 2 | 3-4 |
| Side-padding | 16px | 24px | 32px |
| Nav | Hamburger/Sheet | Kan variere | Full inline |
| Modal | Bottom sheet | Sentrert | Sentrert |
| Toast | Full-width top | Full-width top | Hjørne |
| Tabell | Kort/scroll | Tabell | Tabell |

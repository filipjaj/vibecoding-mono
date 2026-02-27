# Tilgjengelighet (Accessibility)

Designprofiler MÅ oppfylle WCAG 2.1 AA. Denne guiden viser hvordan man
sikrer tilgjengelighet uten å kompromittere profilens visuelle identitet.

---

## Farge og kontrast

### Minimumskrav

| Innholdstype | Minimum kontrast (AA) | Enhanced (AAA) |
|---|---|---|
| Normal tekst (<18px / <14px bold) | 4.5:1 | 7:1 |
| Stor tekst (≥18px / ≥14px bold) | 3:1 | 4.5:1 |
| UI-komponenter og ikoner | 3:1 | — |
| Dekorativ / inaktiv | Ingen krav | — |

### Sjekk per profil

#### Scandinavian Editorial
```
text.primary (#1A1714) på bg.primary (#FAF8F5)  = 14.8:1 ✅
text.secondary (#6B6560) på bg.primary (#FAF8F5) = 5.2:1 ✅
accent (#C4703F) på bg.primary (#FAF8F5)         = 4.7:1 ✅ (men bare som stor tekst)
text.inverse (#FAF8F5) på accent (#C4703F)       = 3.5:1 ⚠️ (OK for knapper med stor tekst)
```

⚠️ **Advarsel**: Terrakotta aksent er borderline. Bruk minimum `font-size: 14px; font-weight: 700`
eller `font-size: 18px` for tekst på aksent-bakgrunn.

#### Bold Brutalist
```
text.primary (#000000) på bg.primary (#FFFFFF) = 21:1 ✅
accent (#FF0000) på bg.primary (#FFFFFF)       = 4.0:1 ✅ (stor tekst)
text.inverse (#FFFFFF) på text.primary (#000)  = 21:1 ✅
```

✅ Brutalist er naturlig tilgjengelig pga. høy kontrast.

#### Soft SaaS
```
text.primary (#111827) på bg.primary (#FAFBFC)  = 15.4:1 ✅
text.secondary (#6B7280) på bg.primary (#FAFBFC) = 5.3:1 ✅
accent (#6366F1) på bg.primary (#FAFBFC)         = 4.6:1 ✅
text.inverse (#FFF) på accent (#6366F1)          = 4.6:1 ✅
```

✅ Indigo aksent er trygt for alle kontekster.

---

## Fokusindikator

ALLE interaktive elementer MÅ ha synlig fokusindikator. Stilen varierer per profil.

### Scandinavian Editorial

```html
<button class="
  ...
  focus-visible:outline-none
  focus-visible:ring-2
  focus-visible:ring-[--color-accent-primary]
  focus-visible:ring-offset-2
  focus-visible:ring-offset-[--color-background-primary]
">
```

Subtil men synlig — 2px ring med offset.

### Bold Brutalist

```html
<button class="
  ...
  focus-visible:outline-none
  focus-visible:ring-[3px]
  focus-visible:ring-[--color-accent-primary]
">
```

Tykk, tydelig ring uten offset — rå og direkte.

### Soft SaaS

```html
<button class="
  ...
  focus-visible:outline-none
  focus-visible:ring-2
  focus-visible:ring-[--color-accent-primary]
  focus-visible:ring-offset-2
">
```

Standard 2px ring med offset.

### Global CSS fallback

```css
/* Alltid ha en fallback for focus */
:focus-visible {
  outline: 2px solid var(--color-accent-primary);
  outline-offset: 2px;
}

/* Fjern bare default outline NÅR vi har custom focus */
:focus:not(:focus-visible) {
  outline: none;
}
```

---

## Tastaturnavigasjon

### Tab-rekkefølge

```html
<!-- Logisk tab-rekkefølge, aldri bruk tabindex > 0 -->
<nav>
  <a href="/" tabindex="0">Hjem</a>
  <a href="/om" tabindex="0">Om</a>
</nav>
<main>
  <button tabindex="0">CTA</button>
</main>
```

### Skip-link

Alltid inkluder skip-link, stylet per profil:

```html
<a href="#main-content" class="
  sr-only focus:not-sr-only
  fixed top-4 left-4 z-50
  bg-[--color-accent-primary] text-[--color-text-inverse]
  rounded-[--radius-small]
  px-4 py-2
  font-body text-sm font-medium
">
  Hopp til hovedinnhold
</a>

<main id="main-content">
  <!-- Innhold -->
</main>
```

### Escape-håndtering

```tsx
// Modaler, dropdowns, drawers MÅ lukkes med Escape
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };
  window.addEventListener("keydown", handler);
  return () => window.removeEventListener("keydown", handler);
}, [onClose]);
```

---

## Semantisk HTML

### Bruk riktige elementer

```html
<!-- ❌ FEIL: Div som knapp -->
<div onclick="doStuff()" class="cursor-pointer bg-accent ...">
  Klikk her
</div>

<!-- ✅ RIKTIG: Semantisk button -->
<button onclick="doStuff()" class="bg-accent ...">
  Klikk her
</button>

<!-- ❌ FEIL: Div som navigasjon -->
<div class="flex gap-4">
  <a href="/">Hjem</a>
</div>

<!-- ✅ RIKTIG: Nav element -->
<nav aria-label="Hovednavigasjon" class="flex gap-4">
  <a href="/">Hjem</a>
</nav>
```

### Heading-hierarki

```html
<!-- ✅ Alltid sekvensielt -->
<h1>Sidetittel</h1>
  <h2>Seksjon</h2>
    <h3>Underseksjon</h3>
  <h2>Neste seksjon</h2>

<!-- ❌ Aldri hopp over nivåer -->
<h1>Sidetittel</h1>
  <h3>Direkte til h3</h3>  <!-- ❌ Mangler h2 -->
```

---

## ARIA-attributter

### Når de trengs

| Mønster | Krevd ARIA |
|---|---|
| Modal/Dialog | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` |
| Tab-panel | `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected` |
| Accordion | `aria-expanded`, `aria-controls` |
| Toast/Alert | `role="alert"`, `aria-live="polite"` |
| Loading | `aria-busy="true"`, `role="status"` |
| Ikon-knapp | `aria-label="Beskrivelse"` |
| Toggle | `aria-pressed` eller `aria-checked` |

### Modal-eksempel

```html
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  class="..."
>
  <h2 id="modal-title">Bekreft sletting</h2>
  <p>Er du sikker?</p>
  <div class="flex gap-3">
    <button>Avbryt</button>
    <button autofocus>Bekreft</button>  <!-- autofocus på primær-handling -->
  </div>
</div>
```

### Toast-eksempel

```html
<!-- Bruker aria-live for skjermlesere -->
<div
  role="alert"
  aria-live="polite"
  class="..."
>
  Endringene er lagret.
</div>
```

---

## Bilder

```html
<!-- Informative bilder: Beskriv innholdet -->
<img
  src="chart.png"
  alt="Omsetning økte 23% fra Q1 til Q2 2025"
  class="..."
/>

<!-- Dekorative bilder: Tom alt-tekst -->
<img
  src="pattern.svg"
  alt=""
  role="presentation"
  class="..."
/>

<!-- Komplekse bilder: Bruk figcaption -->
<figure>
  <img src="diagram.png" alt="Arkitekturdiagram" />
  <figcaption>
    Detaljert beskrivelse av arkitekturen...
  </figcaption>
</figure>
```

---

## Bevegelse og animasjon

### Respekter prefers-reduced-motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Med Tailwind:

```html
<button class="
  transition-all duration-200
  motion-reduce:transition-none
  hover:-translate-y-px
  motion-reduce:hover:translate-y-0
">
  Klikk
</button>
```

---

## Skjemaer

### Label-tilknytning

```html
<!-- Alltid koble label til input -->
<div>
  <label for="email" class="...">E-post</label>
  <input id="email" type="email" aria-describedby="email-hint" />
  <p id="email-hint" class="text-sm text-[--color-text-muted]">
    Vi deler aldri e-posten din.
  </p>
</div>
```

### Feilmeldinger

```html
<div>
  <label for="password">Passord</label>
  <input
    id="password"
    type="password"
    aria-invalid="true"
    aria-describedby="password-error"
    class="border-[--color-status-error] ..."
  />
  <p id="password-error" role="alert" class="text-[--color-status-error] text-sm mt-1">
    Passordet må være minst 8 tegn.
  </p>
</div>
```

### Påkrevde felt

```html
<label for="name">
  Navn <span aria-hidden="true" class="text-[--color-status-error]">*</span>
</label>
<input id="name" required aria-required="true" />
```

---

## Sjekkliste

Gå gjennom før levering:

### Farge og kontrast
- [ ] All tekst har minimum 4.5:1 kontrast
- [ ] UI-elementer har minimum 3:1 kontrast
- [ ] Farge er ikke eneste indikator (legg til ikon/tekst)

### Tastatur
- [ ] Alle interaktive elementer kan nås med Tab
- [ ] Focus-indikator er synlig
- [ ] Modaler trapper fokus
- [ ] Escape lukker overlays
- [ ] Skip-link er tilgjengelig

### Semantikk
- [ ] Riktige HTML-elementer (button, nav, main, etc.)
- [ ] Heading-hierarki er sekvensielt
- [ ] ARIA-attributter der semantisk HTML ikke strekker til

### Bilder
- [ ] Informative bilder har beskrivende alt-tekst
- [ ] Dekorative bilder har tom alt og role="presentation"

### Bevegelse
- [ ] prefers-reduced-motion respekteres
- [ ] Ingen auto-playing animasjoner uten kontroll

### Skjemaer
- [ ] Alle inputs har tilknyttet label
- [ ] Feilmeldinger er programmatisk koblet (aria-describedby)
- [ ] Påkrevde felt er markert med aria-required

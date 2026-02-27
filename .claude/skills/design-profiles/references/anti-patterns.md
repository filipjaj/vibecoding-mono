# Anti-patterns og vanlige feil

Denne referansen beskriver feil Claude ofte gjør når den tolker designprofiler.
Les denne for å unngå de vanligste fallgruvene.

---

## 1. Blanding av profiler

### ❌ FEIL: Mikse stiler fra ulike profiler

```html
<!-- Brutalist profil, men med soft shadows og pill radius -->
<button class="
  font-mono uppercase font-bold
  rounded-full          <!-- ❌ Soft SaaS-stil -->
  shadow-lg             <!-- ❌ Soft SaaS-stil -->
  border-[3px]
">KLIKK</button>
```

### ✅ RIKTIG: Hold deg til én profil konsekvent

```html
<!-- Brutalist profil, konsekvent -->
<button class="
  font-mono uppercase font-bold
  rounded-none           <!-- ✅ Alltid 0 radius i brutalist -->
  shadow-[4px_4px_0_#000] <!-- ✅ Hard offset shadow -->
  border-[3px]
">KLIKK</button>
```

**Regel**: Aldri blend visuell stil fra forskjellige profiler. Hver profil er en
helhetlig designfilosofi.

---

## 2. Ignorere style-notes

### ❌ FEIL: Behandle style-notes som forslag

```yaml
# Profilen sier:
component-guidelines:
  buttons:
    style-notes:
      - "Aldri bruk uppercase på knapper"
```

```html
<!-- Claude ignorerer og bruker uppercase likevel -->
<button class="uppercase font-semibold">KLIKK HER</button>
```

### ✅ RIKTIG: Style-notes er absolutte regler

```html
<button class="font-semibold">Klikk her</button>
```

**Regel**: Style-notes er LOV, ikke forslag. Følg dem bokstavelig.

---

## 3. Default Tailwind-verdier i stedet for profil-tokens

### ❌ FEIL: Bruke Tailwind defaults

```html
<div class="rounded-lg shadow-md bg-white text-gray-900">
```

### ✅ RIKTIG: Bruke profil-tokens

```html
<div class="rounded-[--radius-large] shadow-[--shadow-medium] bg-[--color-background-secondary] text-[--color-text-primary]">
```

Eller med korrekt Tailwind-config:

```html
<div class="rounded-lg shadow-md bg-background-secondary text-foreground-primary">
```

**Regel**: Aldri bruk hardkodede Tailwind-verdier som `bg-white`, `text-gray-900`,
`rounded-lg` etc. med mindre de mapper direkte til profil-tokens via config.

---

## 4. Overdreven dekorasjon

### ❌ FEIL: Legge til effekter profilen ikke spesifiserer

```html
<!-- Scandinavian Editorial profil -->
<button class="
  bg-accent
  rounded-sm
  uppercase tracking-wide
  hover:scale-105        <!-- ❌ Profilen nevner aldri scale -->
  hover:shadow-2xl       <!-- ❌ Profilen sier aldri shadow på hover -->
  hover:rotate-1         <!-- ❌ Helt feil for stilen -->
  ring-2 ring-accent     <!-- ❌ Ikke spesifisert -->
">Les mer</button>
```

### ✅ RIKTIG: Kun det profilen spesifiserer

```html
<button class="
  bg-accent
  rounded-sm
  uppercase tracking-wide
  hover:bg-accent-hover  <!-- ✅ Kun fargeendring, som spesifisert -->
  transition-colors
">Les mer</button>
```

**Regel**: Hvis profilen ikke eksplisitt nevner en effekt (scale, rotate, ring,
gradient, etc.), bruk den IKKE. Mindre er mer.

---

## 5. Feil typografi-hierarki

### ❌ FEIL: Bruke heading-font på body-tekst

```html
<!-- Profilen har heading: Playfair Display, body: Inter -->
<p class="font-heading text-base">  <!-- ❌ Body-tekst med heading-font -->
  Dette er vanlig brødtekst.
</p>
```

### ✅ RIKTIG: Respekter font-roller

```html
<p class="font-body text-base">  <!-- ✅ Body-font for brødtekst -->
  Dette er vanlig brødtekst.
</p>
```

**Regel**: `font-heading` brukes KUN på overskrifter (h1-h6) og evt. logo/merke.
Alt annet bruker `font-body` (eller `font-mono` hvis profilen har en).

---

## 6. Feil spacing-tolkning

### ❌ FEIL: Tight spacing i en "luftig" profil

```html
<!-- Scandinavian Editorial: mood = "rolig, luftig" -->
<section class="py-8 px-4">           <!-- ❌ For lite padding -->
  <h1 class="text-3xl mb-2">Tittel</h1> <!-- ❌ For liten margin -->
  <p class="mb-4">Tekst</p>            <!-- ❌ For lite mellomrom -->
</section>
```

### ✅ RIKTIG: Spacingen reflekterer mood

```html
<!-- Scandinavian Editorial: mood = "rolig, luftig" -->
<section class="py-24 md:py-40 px-6">      <!-- ✅ Generøs section-padding -->
  <h1 class="text-5xl mb-6">Tittel</h1>     <!-- ✅ God avstand -->
  <p class="mb-12">Tekst</p>                <!-- ✅ Puster -->
</section>
```

### ❌ FEIL: For mye luft i en "tett" profil

```html
<!-- Bold Brutalist: mood = "rå, direkte" -->
<section class="py-40 px-12">             <!-- ❌ For mye spacing -->
  <h1 class="text-3xl mb-8">TITTEL</h1>   <!-- ❌ For "pent" -->
</section>
```

### ✅ RIKTIG: Tight og direkte

```html
<!-- Bold Brutalist: mood = "rå, direkte" -->
<section class="py-16 px-6">              <!-- ✅ Tettere -->
  <h1 class="text-6xl mb-4">TITTEL</h1>   <!-- ✅ Stor og tett -->
</section>
```

**Regel**: Spacing kommuniserer mood. "Luftig" = mye. "Rå/tett" = lite.
Sjekk `spacing.section-padding` i profilen.

---

## 7. Generisk hover-oppførsel

### ❌ FEIL: Samme hover på alle profiler

```html
<!-- Alle kort får opacity hover uansett profil -->
<div class="hover:opacity-80 transition-opacity">
```

### ✅ RIKTIG: Profil-spesifikk hover

```html
<!-- Scandinavian Editorial: Bakgrunnsfarge-endring -->
<div class="hover:bg-background-tertiary transition-colors">

<!-- Bold Brutalist: Shadow-forstørring -->
<div class="hover:shadow-[8px_8px_0_#000] transition-all">

<!-- Soft SaaS: Lift + shadow -->
<div class="hover:-translate-y-px hover:shadow-md transition-all">
```

**Regel**: Les `component-guidelines` for hover-oppførsel. Hver profil har sin
egen hover-filosofi.

---

## 8. Fargebruk uten kontrast-sjekk

### ❌ FEIL: Lys tekst på lys bakgrunn

```html
<div class="bg-accent-subtle">
  <p class="text-text-muted">  <!-- ❌ For lav kontrast -->
    Viktig informasjon
  </p>
</div>
```

### ✅ RIKTIG: Sjekk at kontrasten er tilstrekkelig

```html
<div class="bg-accent-subtle">
  <p class="text-text-primary">  <!-- ✅ God kontrast -->
    Viktig informasjon
  </p>
</div>
```

**Regel**: Tekst-farger på bakgrunner må ha minimum 4.5:1 kontrast (WCAG AA).
Bruk `text-primary` eller `text-secondary` på lyse bakgrunner.

---

## 9. Manglende responsive tilpasninger

### ❌ FEIL: Desktop-verdier på mobil

```html
<h1 class="text-6xl">Stor overskrift</h1>          <!-- ❌ 6rem på mobil = overflow -->
<section class="py-40">Innhold</section>             <!-- ❌ 160px padding på mobil -->
<div class="grid grid-cols-3 gap-8">Kort</div>       <!-- ❌ 3 kolonner på mobil -->
```

### ✅ RIKTIG: Mobile-first med profil-verdier

```html
<h1 class="text-3xl md:text-5xl lg:text-6xl">Stor overskrift</h1>
<section class="py-16 md:py-24 lg:py-40">Innhold</section>
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">Kort</div>
```

**Regel**: Typografi og spacing skaleres ned på mobil. Profil-verdiene er
typisk desktop-verdier. Bruk mobile-first og skaler OPP.

---

## 10. Glemt animasjons-tokens

### ❌ FEIL: Hardkodede animasjonsverdier

```html
<button class="transition-all duration-300 ease-in-out">
```

### ✅ RIKTIG: Bruk profil-tokens

```html
<!-- Soft SaaS -->
<button class="transition-all duration-[--duration-default] ease-[--easing-default]">

<!-- Bold Brutalist -->
<button class="transition-all duration-[--duration-fast] ease-linear">
```

**Regel**: Animasjonshastighet og easing er en del av profilens personlighet.
`ease-linear` føles rå. `cubic-bezier(0.4, 0, 0.2, 1)` føles myk.

---

## 11. Feil bruk av border i profiler

### ❌ FEIL: Standard 1px border på brutalist

```html
<!-- Brutalist profil -->
<div class="border border-gray-200 rounded-lg">  <!-- ❌ Alt feil -->
```

### ✅ RIKTIG: Profilkonsistent border

```html
<!-- Brutalist: Tykk, svart, ingen radius -->
<div class="border-[3px] border-black rounded-none">

<!-- Scandinavian: Tynn, subtil, minimal radius -->
<div class="border border-[--color-border-default] rounded-[--radius-small]">

<!-- Soft SaaS: Tynn, subtil, avrundet -->
<div class="border border-[--color-border-default] rounded-[--radius-large]">
```

**Regel**: Border-tykkelse, farge og radius henger sammen. Sjekk
`borders.width` og `borders.radius` i profilen.

---

## Sjekkliste før levering

Gå gjennom denne listen før du presenterer kode til brukeren:

- [ ] Bruker alle farger profil-tokens (ingen hardkodede hex/Tailwind-defaults)?
- [ ] Er font-heading kun brukt på overskrifter?
- [ ] Reflekterer spacing profilens mood?
- [ ] Er hover-oppførsel konsistent med component-guidelines?
- [ ] Er alle border-radius fra profilen?
- [ ] Er animasjonsverdier (duration, easing) fra profilen?
- [ ] Er style-notes fulgt bokstavelig?
- [ ] Fungerer det responsivt (mobile-first)?
- [ ] Har tekst/bakgrunn tilstrekkelig kontrast?
- [ ] Er det ingen "ekstra" effekter profilen ikke spesifiserer?

---
name: design-profiles
description: >
  Generate UI code that strictly follows a YAML design profile. Use this skill whenever the user
  mentions design profiles, design configs, design tokens, YAML themes, visual profiles, or asks
  you to build UI that should follow a specific visual style defined in a config file. Also trigger
  when you see a design-profiles/ directory in the project, or when CLAUDE.md references design
  profiles. This skill overrides creative freedom — you follow the profile exactly, not your own
  aesthetic preferences. Works with any framework (TanStack Start, Next.js, SvelteKit, vanilla HTML)
  by detecting the project's stack. Default stack is TanStack Start + Tailwind + Shadcn.
---

# Design Profile System

Bygg visuelt konsistente, vakre grensesnitt som følger en YAML-designprofil slavisk.

**Kjerneprinsipp**: Designprofilen er sannheten. Aldri avvik fra den. Aldri bruk hardkodede
verdier. Aldri ta kreative friheter som bryter med profilens tokens eller style-notes.

## Når denne skillen trigges

1. Bruker nevner "designprofil", "design config", "YAML-tema", eller lignende
2. Det finnes en `design-profiles/` mappe i prosjektet
3. CLAUDE.md eller prosjektfiler refererer til designprofiler
4. Bruker ber deg bygge UI som skal matche en bestemt visuell stil fra en konfig

## Workflow

### Steg 1: Forstå prosjektet

Før du genererer noe, undersøk prosjektet:

1. **Les CLAUDE.md** — Finn referanser til aktiv profil og tech stack
2. **Sjekk prosjektstruktur** — Finn `design-profiles/`, `package.json`, eksisterende kode
3. **Detekter tech stack** — Se etter TanStack Start, Next.js, SvelteKit, eller vanilla
4. **Les andre relevante skills** — Bruk tanstack-start, seo-site-builder, eller andre skills som matcher stacken
5. **Finn aktiv profil** — Les den YAML-profilen brukeren spesifiserer

Hvis stacken er uklar, spør brukeren. Default er TanStack Start + Tailwind + Shadcn.

### Steg 2: Intervju brukeren

Still spørsmål FØR du begynner å generere. Forstå hva de vil ha:

- Hvilken designprofil skal brukes?
- Hva skal bygges? (landing page, dashboard, komponent, etc.)
- Er det spesifikke seksjoner eller komponenter de vil ha?
- Skal det være responsive? (default: ja)
- Finnes det innhold/tekst som skal brukes, eller skal du bruke placeholder?

Ikke spør om ting profilen allerede definerer (farger, fonter, spacing, etc.) — de er fastsatt.

### Steg 3: Les og parse designprofilen

Les YAML-profilen og internalisér ALLE tokens:

```
Les: design-profiles/{profil-navn}.yaml
```

Hent ut og forstå:
- `meta` — Tema, mood, beskrivelse
- `colors` — Alle fargeverdier og deres semantiske roller
- `typography` — Fonter, skalaer, vekter, linjehøyder
- `spacing` — Base unit, section padding, max-width
- `borders` — Radius-verdier og border-stiler
- `shadows` — Shadow-verdier og filosofi
- `animation` — Timing, easing, filosofi
- `style-notes` — **KRITISK** — Les og følg disse nøye
- `component-guidelines` — Spesifikke regler per komponenttype

Se `references/profile-schema.md` for komplett skjema-dokumentasjon.

### Steg 4: Generer design tokens

Konverter YAML-tokens til riktig format for prosjektets stack:

**Tailwind (default)**:
```typescript
// Utvid tailwind.config.ts med profil-tokens
// Bruk extend for å legge til, ikke erstatte defaults
// Generer custom fargenavn som matcher profilen
```

**CSS Custom Properties (vanilla / fallback)**:
```css
:root {
  --color-primary: /* fra profilen */;
  --color-background: /* fra profilen */;
  --font-heading: /* fra profilen */;
  /* ... alle tokens */
}
```

**Viktig**: Inkluder alltid Google Fonts import fra profilens `fonts.imports`-felt.

### Steg 5: Bygg komponenter

Når du genererer UI-kode:

1. **Referer ALLTID til tokens** — Aldri skriv `#FF0000`, skriv `var(--color-accent)` eller `text-accent`
2. **Følg style-notes** — Hvis profilen sier "Ingen avrundinger. Aldri.", bruk aldri border-radius
3. **Følg component-guidelines** — Hvis profilen definerer hvordan buttons skal se ut, følg det
4. **Respekter mood** — En "brutalist" profil skal FØLES brutal, en "scandinavian" profil skal føles luftig
5. **Les frontend-design skillen** — Bruk den for generelle designprinsipper, men la profilen overstyre estetiske valg

### Steg 6: Valider output

Før du presenterer koden, sjekk:

- [ ] Ingen hardkodede farger, fonter, eller spacing-verdier
- [ ] Google Fonts er importert
- [ ] Alle component-guidelines er fulgt
- [ ] Style-notes er respektert
- [ ] Responsivt design er implementert
- [ ] Koden kompilerer og fungerer

## Tolkning av mood og style-notes

Mood og style-notes er de VIKTIGSTE feltene i profilen. Tokens (farger, fonter, spacing) er
mekaniske — de kan konverteres automatisk. Men mood og style-notes krever **tolkning**.

### Mood påvirker alt du ikke kan måle

Mood-stikkordene setter tonen for designvalg som IKKE er eksplisitt definert i profilen:

| Mood | Påvirker |
|------|----------|
| "rolig, luftig" | Mye whitespace. Ting puster. Aldri cramped. |
| "rå, direkte" | Tight spacing. Store kontraster. Ingenting er subtilt. |
| "vennlig, moderne" | Myke overganger. Inviterende. Ingenting føles skremmende. |
| "lekent, fargerikt" | Uventede detaljer. Mikro-animasjoner. Overraskelser. |
| "premium, eksklusivt" | Minimalt. Hvert element er nøye plassert. Kvalitet over kvantitet. |

Når du tar et designvalg som profilen IKKE eksplisitt dekker, spør deg selv:
**"Matcher dette mooden?"** Hvis nei, juster.

### Style-notes er lov, ikke forslag

Style-notes er spredt gjennom profilen (i borders, shadows, animation, og component-guidelines).
De er **absolutte regler**, ikke veiledning.

Eksempler på hva style-notes betyr i praksis:

- `"Ingen avrundinger. Aldri."` → Du bruker ALDRI border-radius, selv om det "ser bedre ut"
- `"Foretrekk bakgrunnsfarge-skift fremfor skygger"` → Bruk bg-farge for hover, ikke box-shadow
- `"Snappy eller ingenting"` → Ikke legg til smooth easing fordi du "synes det er bedre"
- `"Minimalt og elegant. Ingen bounce."` → Aldri spring/bounce-animasjoner

### Hierarki for designvalg

Når du genererer UI, bruk dette hierarkiet:

1. **Eksplisitte tokens** (farger, fonter, radius) → Bruk direkte
2. **Component-guidelines** → Følg for spesifikke komponenter
3. **Style-notes** → Følg for alt som ikke er dekket av 1 og 2
4. **Mood** → Bruk for å ta valg som ingenting annet dekker
5. **Frontend-design skill** → Generelle prinsipper, men ALDRI i konflikt med 1-4

### Script: Automatisk token-generering

Skillen inkluderer et script som konverterer YAML-profiler til Tailwind og CSS:

```bash
# Generer både Tailwind config og CSS custom properties
node scripts/generate-tokens.mjs design-profiles/soft-saas.yaml --output src/styles

# Kun Tailwind
node scripts/generate-tokens.mjs design-profiles/soft-saas.yaml --tailwind

# Kun CSS custom properties
node scripts/generate-tokens.mjs design-profiles/soft-saas.yaml --css
```

Scriptet genererer:
- `design-tokens.ts` — Tailwind extend-objekt klar for import
- `design-tokens.css` — CSS custom properties
- `fonts.css` — Google Fonts `@import`-statements

Kjør dette scriptet som første steg etter at brukeren har valgt profil.

## Profilhåndtering

### Lage ny profil

Når brukeren vil lage en ny designprofil:

1. Kopier `assets/_template.yaml` som utgangspunkt
2. Still spørsmål om ønsket stil, mood, farger
3. Foreslå fargepaletter og font-kombinasjoner
4. Fyll ut profilen gradvis med brukerens input
5. Valider at profilen er komplett (alle påkrevde felt er utfylt)

Tips å dele med brukeren:
- coolors.co for fargepaletter
- fontpair.co for font-kombinasjoner
- realtimecolors.com for å forhåndsvise farger i kontekst

### Redigere eksisterende profil

Når brukeren vil endre en profil:

1. Les eksisterende profil
2. Vis hva som er definert
3. Gjør endringer basert på brukerens ønsker
4. Oppdater alle avhengige tokens (f.eks. hvis primary-farge endres, sjekk at kontrast fortsatt er ok)

## Integrasjon med andre skills

Denne skillen jobber SAMMEN med andre skills, ikke i stedet for dem:

| Skill | Hvordan de samarbeider |
|-------|----------------------|
| `tanstack-start` | Bruk for routing, server functions, etc. Designprofilen styrer kun det visuelle |
| `frontend-design` | Les for generelle designprinsipper. Profilen OVERRIDER estetiske valg fra denne |
| `seo-site-builder` | Bruk for SEO-strategi. Designprofilen påvirker ikke SEO-valg |

## Referanser

Les disse referansefilene for å produsere best mulig output. Du trenger ikke lese alle
for hver oppgave — velg de som er relevante.

### Alltid les

- **`references/profile-schema.md`** — Komplett YAML-skjema, påkrevde felt, validering
- **`references/anti-patterns.md`** — Vanlige feil og hvordan unngå dem. **Les denne FØR du genererer kode.**

### Les når du bygger komponenter

- **`references/component-examples.md`** — Samme komponent (button, card, hero, nav, input, badge, modal, toast) rendret med tre ulike profiler. Viser nøyaktig hvordan profil-tokens oversettes til kode.
- **`references/page-layouts.md`** — Ferdige sidestrukturer (landing page, dashboard, blogg, auth, pricing) med profil-tokens. Bruk som utgangspunkt.
- **`references/responsive-patterns.md`** — Hvordan skalere typografi, spacing og layout per breakpoint. Inkluderer skaleringstabeller og mobilmønstre.

### Les når du setter opp prosjektet

- **`references/framework-mapping.md`** — Hvordan tokens mappes til Tailwind config, CSS custom properties, Shadcn/ui og React inline. Inkluderer komplett tailwind.config.ts eksempel.
- **`references/dark-mode.md`** — Fargekonvertering light→dark per profiltype, implementasjon med CSS/Tailwind, og regler for skygger/aksent/tekst i dark mode.

### Les når du lager ny profil

- **`references/typography-color-guide.md`** — Font-par som fungerer, fargemetoder, populære paletter, spacing-systemer, border radius guide, shadow-stiler og animasjonsreferanse.
- **`references/example-profiles.md`** — Tre komplett utfylte profiler (Scandinavian Editorial, Bold Brutalist, Soft SaaS) med component-guidelines.

### Les for tilgjengelighet

- **`references/accessibility.md`** — WCAG 2.1 AA krav, fokusindikator per profil, tastaturnavigasjon, ARIA-attributter, bevegelse og skjema-tilgjengelighet.

### Scripts

- **`scripts/generate-tokens.mjs`** — Konverterer YAML → Tailwind config + CSS custom properties + font imports. Krever `yaml` npm-pakke.
- **`scripts/validate-profile.mjs`** — Validerer profil mot schema. Sjekker påkrevde felt, hex-format, fargekontrast og konsistens. Bruk `--strict` for null-toleranse.

### Templates

- **`assets/_template.yaml`** — Komplett tom mal med alle felt og norske kommentarer
- **`assets/_quick-start.yaml`** — Minimal mal med kun påkrevde felt for hurtigstart

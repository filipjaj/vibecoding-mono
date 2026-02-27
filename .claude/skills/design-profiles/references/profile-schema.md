# Design Profile YAML Schema

Komplett dokumentasjon av alle felt i en designprofil.

## Oversikt

En designprofil er en YAML-fil som definerer hele det visuelle uttrykket for et prosjekt.
Alle felt er organisert i logiske seksjoner.

## Schema

### meta (påkrevd)

Beskriver profilen på et overordnet nivå.

```yaml
meta:
  name: "Profilnavn"                    # Unikt navn
  description: "Kort beskrivelse"       # Hva profilen er
  mood: "stikkord, stikkord, stikkord"  # Emosjonelle stikkord
  version: "1.0"                        # Versjonsnummer
  author: "Navn"                        # Hvem laget den
```

**mood** er spesielt viktig — den setter tonen for ALLE designvalg. Eksempler:
- `"rolig, sofistikert, luftig"` → Mye whitespace, dempede farger
- `"rå, direkte, ekspressiv"` → Tykke linjer, høy kontrast, store typer
- `"vennlig, moderne, tillitsvekkende"` → Avrundede hjørner, myke skygger

### colors (påkrevd)

Definerer hele fargepaletten. Bruk semantiske navn.

```yaml
colors:
  background:
    primary: "#FAFBFC"       # Hovedbakgrunn
    secondary: "#FFFFFF"     # Sekundær bakgrunn (kort, modaler)
    tertiary: "#F3F4F6"      # Tertiær (hover-states, subtle fills)
  text:
    primary: "#111827"       # Hovedtekst
    secondary: "#6B7280"     # Sekundærtekst (hjelpetekst, metadata)
    muted: "#9CA3AF"         # Dempet tekst (placeholders)
    inverse: "#FFFFFF"       # Tekst på mørk bakgrunn
  accent:
    primary: "#6366F1"       # Hovedaksent (CTA, lenker)
    hover: "#4F46E5"         # Hover-state for aksent
    subtle: "#EEF2FF"        # Subtil aksent (badges, highlights)
  border:
    default: "#E5E7EB"       # Standard border
    strong: "#D1D5DB"        # Sterkere border
  status:
    success: "#10B981"       # Suksess
    warning: "#F59E0B"       # Advarsel
    error: "#EF4444"         # Feil
    info: "#3B82F6"          # Informasjon
```

**Viktig**: Alle farger MÅ refereres via tokens, aldri hardkodet i komponent-kode.

### typography (påkrevd)

Definerer fonter og typografisk skala.

```yaml
typography:
  fonts:
    heading:
      family: "Plus Jakarta Sans"
      import: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700&display=swap"
    body:
      family: "Inter"
      import: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
    mono:                                # Valgfri — for kodeblokker
      family: "JetBrains Mono"
      import: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap"
  
  scale:
    display:
      size: "3.5rem"
      weight: 700
      line-height: 1.1
      letter-spacing: "-0.02em"
      text-transform: "none"            # Valgfri: "uppercase", "none"
    h1:
      size: "2.5rem"
      weight: 700
      line-height: 1.2
    h2:
      size: "1.75rem"
      weight: 600
      line-height: 1.3
    h3:
      size: "1.25rem"
      weight: 600
      line-height: 1.4
    body:
      size: "1rem"
      weight: 400
      line-height: 1.6
    caption:
      size: "0.875rem"
      weight: 500
      line-height: 1.5
      text-transform: "none"
      letter-spacing: "0"
```

**import** feltet MÅ inkluderes i `<head>` eller CSS `@import`.

### spacing (påkrevd)

```yaml
spacing:
  unit: "8px"                 # Base spacing unit
  section-padding: "80px"     # Vertikal padding mellom seksjoner
  content-max-width: "1200px" # Maks bredde for innhold
  content-narrow: "720px"     # Smal innholdsbredde (artikler, etc.)
```

### borders (påkrevd)

```yaml
borders:
  radius:
    small: "6px"
    medium: "8px"
    large: "12px"
    pill: "9999px"           # For tags, badges
    none: "0"
  width:
    default: "1px"
    strong: "2px"
  style-notes: "Avrundede hjørner gir et vennlig uttrykk."
```

**style-notes** er KRITISK — de forteller deg designfilosofien bak verdiene.

### shadows (påkrevd)

```yaml
shadows:
  small: "0 1px 2px rgba(0,0,0,0.05)"
  medium: "0 4px 6px -1px rgba(0,0,0,0.1)"
  large: "0 10px 15px -3px rgba(0,0,0,0.1)"
  style-notes: "Subtile, lagdelte skygger. Aldri dramatisk."
```

### animation (påkrevd)

```yaml
animation:
  duration:
    fast: "150ms"
    default: "200ms"
    slow: "300ms"
  easing:
    default: "cubic-bezier(0.4, 0, 0.2, 1)"
    in: "cubic-bezier(0.4, 0, 1, 1)"
    out: "cubic-bezier(0, 0, 0.2, 1)"
  style-notes: "Smooth og subtilt. Hover translateY(-1px) for kort."
```

### component-guidelines (anbefalt)

Spesifikke regler per komponenttype. Disse OVERRIDER generelle regler.

```yaml
component-guidelines:
  buttons:
    primary:
      background: "accent.primary"       # Refererer til colors.accent.primary
      text: "text.inverse"
      border-radius: "radius.medium"
      font-weight: 600
      padding: "12px 24px"
      hover: "accent.hover bakgrunn, subtle translateY(-1px)"
    secondary:
      background: "transparent"
      text: "accent.primary"
      border: "1px solid accent.primary"
    ghost:
      background: "transparent"
      text: "text.secondary"
      hover: "background.tertiary bakgrunn"
    style-notes: "Semi-bold tekst, aldri uppercase med mindre profilen sier det."
  
  cards:
    background: "background.secondary"
    border: "1px solid border.default"
    border-radius: "radius.large"
    padding: "24px"
    hover: "shadow.medium, subtle lift"
    style-notes: "Hvite kort på lys grå bakgrunn. Subtil hover-effekt."
  
  navigation:
    background: "background.primary"
    height: "64px"
    style-notes: "Clean, pill-shaped aktiv-indikator."
  
  hero:
    padding: "120px 0"
    text-align: "center"
    max-width: "content-narrow"
    style-notes: "Subtil gradient-bakgrunn, pill-shaped CTA."
  
  inputs:
    background: "background.secondary"
    border: "1px solid border.default"
    border-radius: "radius.medium"
    focus: "accent.primary border, subtle ring"
    padding: "10px 14px"
```

## Konvertering til CSS Custom Properties

Når du leser en profil, konverter ALLE tokens til CSS custom properties:

```css
:root {
  /* Farger */
  --color-bg-primary: #FAFBFC;
  --color-bg-secondary: #FFFFFF;
  --color-text-primary: #111827;
  --color-text-secondary: #6B7280;
  --color-accent: #6366F1;
  --color-accent-hover: #4F46E5;
  
  /* Typografi */
  --font-heading: 'Plus Jakarta Sans', sans-serif;
  --font-body: 'Inter', sans-serif;
  
  /* Spacing */
  --spacing-unit: 8px;
  --section-padding: 80px;
  --content-max-width: 1200px;
  
  /* Borders */
  --radius-small: 6px;
  --radius-medium: 8px;
  --radius-large: 12px;
  
  /* Shadows */
  --shadow-small: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-medium: 0 4px 6px -1px rgba(0,0,0,0.1);
  
  /* Animasjon */
  --duration-default: 200ms;
  --easing-default: cubic-bezier(0.4, 0, 0.2, 1);
}
```

## Konvertering til Tailwind Config

For Tailwind-prosjekter, utvid `tailwind.config.ts`:

```typescript
export default {
  theme: {
    extend: {
      colors: {
        background: { primary: '#FAFBFC', secondary: '#FFFFFF' },
        foreground: { primary: '#111827', secondary: '#6B7280' },
        accent: { DEFAULT: '#6366F1', hover: '#4F46E5' },
        // ... alle farger fra profilen
      },
      fontFamily: {
        heading: ['Plus Jakarta Sans', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '12px',
      },
      // ... resten av tokens
    },
  },
}
```

## Validering

En gyldig profil MÅ ha:
- `meta.name` og `meta.mood`
- Minst `colors.background.primary`, `colors.text.primary`, `colors.accent.primary`
- Minst `typography.fonts.heading` og `typography.fonts.body` med `import`-URLer
- `spacing.unit`
- `borders.radius` med minst én verdi
- `shadows` med minst én verdi
- `animation.duration.default` og `animation.easing.default`

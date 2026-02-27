# Design Profiles Lab — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Sett opp et komplett design-profil-system der en designer kan laste inn YAML-profiler og generere visuelt distinkte nettsider med Claude Code.

**Architecture:** Standalone prosjekt (`design-profiles-lab/`) med YAML-baserte designprofiler som definerer farger, typografi, spacing, shadows, animasjoner og komponent-retningslinjer. Claude Code leser den aktive profilen og genererer CSS custom properties + HTML/CSS-kode som følger profilreglene. Ingen rammeverk — ren HTML, CSS og vanilla JS.

**Tech Stack:** HTML + CSS (custom properties), vanilla JS, YAML (designprofiler), Google Fonts

**Target directory:** Prosjektet opprettes som `design-profiles-lab/` i samme mappe som `humble/` (altså `../design-profiles-lab/` relativt til nåværende working directory).

---

### Task 1: Initialiser prosjektmappen og git

**Files:**
- Create: `design-profiles-lab/`
- Create: `design-profiles-lab/src/` (tom mappe med .gitkeep)

**Step 1: Opprett mappestruktur**

```bash
mkdir -p ../design-profiles-lab/{design-profiles,src,.claude/rules}
touch ../design-profiles-lab/src/.gitkeep
```

**Step 2: Initialiser git**

```bash
cd ../design-profiles-lab && git init
```

Expected: `Initialized empty Git repository`

---

### Task 2: Opprett .gitignore

**Files:**
- Create: `design-profiles-lab/.gitignore`

**Step 1: Skriv .gitignore**

```gitignore
# Dependencies
node_modules/
package-lock.json
yarn.lock
bun.lock

# OS-filer
.DS_Store
Thumbs.db

# Editor
.vscode/
.idea/
*.swp
*.swo

# Build output
dist/
.output/
.cache/

# Miljøvariabler
.env
.env.local
.env.*.local

# Logs
*.log
npm-debug.log*
```

**Step 2: Verifiser**

```bash
cat ../design-profiles-lab/.gitignore
```

Expected: Filen vises med alt innholdet.

**Step 3: Commit**

```bash
cd ../design-profiles-lab && git add -A && git commit -m "chore: initial project structure with .gitignore"
```

---

### Task 3: Opprett CLAUDE.md

**Files:**
- Create: `design-profiles-lab/CLAUDE.md`

**Step 1: Skriv CLAUDE.md**

```markdown
# Design Profile System

## Prosjekt
Dette er et design-profil-system. Vi bygger nettsider der hele det visuelle uttrykket styres av en YAML-profil i `design-profiles/`-mappen.

## Aktiv profil
Les alltid den aktive designprofilen brukeren spesifiserer (f.eks. `design-profiles/scandinavian-editorial.yaml`) før du genererer UI-kode.

## Regler
- Aldri bruk hardkodede farger — bruk alltid CSS custom properties fra profilen
- Aldri bruk Tailwind-defaults — overstyr med profilverdier
- Inkluder Google Fonts-import som spesifisert i profilen
- Konverter YAML-tokens til CSS custom properties (--color-primary, --font-heading, etc.)
- Bruk semantiske variabelnavn, ikke hex-verdier direkte i HTML/JSX
- Generer alltid en styles.css med alle tokens som custom properties
- Skriv kommentarer på norsk

## Tech stack
- HTML + CSS (med custom properties)
- Vanilla JS der det trengs
- Ingen rammeverk med mindre brukeren ber om det

## Workflow
1. Les designprofilen
2. Generer CSS custom properties fra tokens
3. Bygg komponentene med disse variablene
4. Vis resultatet i nettleseren
```

**Step 2: Verifiser**

```bash
cat ../design-profiles-lab/CLAUDE.md
```

Expected: Hele filen vises.

**Step 3: Commit**

```bash
cd ../design-profiles-lab && git add CLAUDE.md && git commit -m "docs: add CLAUDE.md with project rules"
```

---

### Task 4: Opprett .claude/rules/design-system.md

**Files:**
- Create: `design-profiles-lab/.claude/rules/design-system.md`

**Step 1: Skriv design-system.md**

```markdown
---
globs: ["src/**/*.html", "src/**/*.css", "src/**/*.jsx"]
---

Når du genererer UI-kode:
1. Les den aktive designprofilen fra design-profiles/
2. Konverter alle tokens til CSS custom properties
3. Bruk aldri hardkodede verdier — referer alltid til variablene
4. Respekter style-notes i profilen for designfilosofi
5. Inkluder Google Fonts-import i <head>
```

**Step 2: Verifiser**

```bash
cat ../design-profiles-lab/.claude/rules/design-system.md
```

Expected: YAML frontmatter + 5 regler vises.

**Step 3: Commit**

```bash
cd ../design-profiles-lab && git add .claude/ && git commit -m "chore: add Claude rules for design system code generation"
```

---

### Task 5: Opprett scandinavian-editorial.yaml

**Files:**
- Create: `design-profiles-lab/design-profiles/scandinavian-editorial.yaml`

**Step 1: Skriv profilen**

```yaml
# ─────────────────────────────────────────────────
# Scandinavian Editorial
# Rolig, sofistikert, luftig — tenk Kinfolk møter Muuto
# ─────────────────────────────────────────────────

name: Scandinavian Editorial
slug: scandinavian-editorial
description: >
  Minimalistisk skandinavisk design med fokus på typografi, whitespace og
  naturlige materialer. Inspirert av nordisk redaksjonell design og interiør.

mood:
  keywords:
    - rolig
    - sofistikert
    - luftig
    - tidløs
    - redaksjonell
  inspiration:
    - Kinfolk Magazine
    - Muuto
    - Cereal Magazine
    - Aesop
  tone: "Stille selvtillit. La innholdet puste."

# ─── Farger ───────────────────────────────────────

colors:
  primary: "#1A1714"        # Mørk varm svart — hovedtekst
  secondary: "#4A453E"      # Varm grå — sekundær tekst
  accent: "#C2705A"         # Terrakotta — handlinger og lenker
  accent-hover: "#A85D49"   # Mørkere terrakotta — hover-tilstand
  background: "#FAF8F5"     # Varm hvit — hovedbakgrunn
  surface: "#F0EDE8"        # Krem — kort og seksjoner
  border: "#D4CBC0"         # Sand — subtile skillelinjer
  muted: "#8A8279"          # Dempet tekst — metadata, captions
  white: "#FFFFFF"          # Ren hvit — der det trengs
  error: "#B44D3D"          # Dempet rød — feilmeldinger
  success: "#5C7A5E"        # Dempet grønn — suksess

# ─── Typografi ────────────────────────────────────

fonts:
  heading:
    family: "'Playfair Display', Georgia, serif"
    google-import: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap"
  body:
    family: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    google-import: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap"

typography:
  display:
    size: "4rem"
    weight: 400
    line-height: 1.1
    letter-spacing: "-0.02em"
    font: heading
    style-note: "Alltid serif. Aldri bold — la størrelsen gjøre jobben."
  h1:
    size: "2.5rem"
    weight: 400
    line-height: 1.2
    letter-spacing: "-0.01em"
    font: heading
  h2:
    size: "1.75rem"
    weight: 400
    line-height: 1.3
    letter-spacing: "0"
    font: heading
  h3:
    size: "1.25rem"
    weight: 500
    line-height: 1.4
    font: heading
  body:
    size: "1.0625rem"
    weight: 400
    line-height: 1.7
    font: body
    style-note: "Romslig linjehøyde. Teksten skal puste."
  caption:
    size: "0.75rem"
    weight: 500
    line-height: 1.5
    letter-spacing: "0.08em"
    text-transform: "uppercase"
    font: body
    style-note: "Brukes til metadata, kategorier, tidsstempler."
  small:
    size: "0.875rem"
    weight: 400
    line-height: 1.6
    font: body

# ─── Spacing ──────────────────────────────────────

spacing:
  unit: "8px"
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  3xl: "64px"
  section-padding: "96px"
  content-max-width: "720px"
  page-max-width: "1200px"
  style-note: "Generøst med plass. Whitespace er like viktig som innhold."

# ─── Border Radius ────────────────────────────────

border-radius:
  none: "0"
  sm: "2px"
  md: "4px"
  lg: "8px"
  full: "9999px"
  default: "2px"
  style-note: "Skarpe hjørner. Editorial, ikke lekent."

# ─── Shadows ──────────────────────────────────────

shadows:
  sm: "0 1px 2px rgba(26, 23, 20, 0.04)"
  md: "0 2px 8px rgba(26, 23, 20, 0.06)"
  lg: "0 4px 16px rgba(26, 23, 20, 0.06)"
  style-note: "Foretrekk bakgrunnsfarge-skift fremfor skygger. Skygger skal knapt synes."

# ─── Animasjon ────────────────────────────────────

animation:
  duration-fast: "150ms"
  duration-default: "300ms"
  duration-slow: "500ms"
  easing: "cubic-bezier(0.4, 0, 0.2, 1)"
  style-note: "Minimalt og elegant. Ingen bounce. Ting glir sakte inn — som å bla i et magasin."

# ─── Komponent-retningslinjer ─────────────────────

components:
  button:
    description: "Rene, understated knapper"
    styles:
      padding: "12px 24px"
      font-size: "0.75rem"
      font-weight: 500
      letter-spacing: "0.08em"
      text-transform: "uppercase"
      border-radius: "2px"
    variants:
      primary:
        background: "var(--color-accent)"
        color: "var(--color-white)"
        hover-background: "var(--color-accent-hover)"
      secondary:
        background: "transparent"
        color: "var(--color-primary)"
        border: "1px solid var(--color-border)"
        hover-background: "var(--color-surface)"
      ghost:
        background: "transparent"
        color: "var(--color-accent)"
        hover-background: "var(--color-surface)"
    style-note: "Uppercase caption-stil. Terrakotta for primær. Alltid subtil."

  card:
    description: "Flat, krem, nesten uten skygge"
    styles:
      background: "var(--color-surface)"
      border: "none"
      border-radius: "2px"
      padding: "32px"
      box-shadow: "var(--shadow-sm)"
    hover:
      box-shadow: "var(--shadow-md)"
      transform: "none"
    style-note: "Flat design. Bruk bakgrunnsfarge for å skille, ikke skygger. Minimalt visuelt skille."

  hero:
    description: "Full viewport, sentrert display-typografi med maks whitespace"
    styles:
      min-height: "100vh"
      display: "flex"
      align-items: "center"
      justify-content: "center"
      text-align: "center"
      padding: "var(--spacing-section-padding) var(--spacing-md)"
    style-note: "La overskriften eie rommet. Masse luft rundt. Bare tekst og whitespace."

  navigation:
    description: "Luftig, uppercase, tilbaketrukket"
    styles:
      padding: "24px 0"
      font-size: "0.75rem"
      font-weight: 500
      letter-spacing: "0.08em"
      text-transform: "uppercase"
    style-note: "Nav skal forsvinne inn i bakgrunnen. Luftig spacing mellom elementene."
```

**Step 2: Verifiser YAML-syntaks**

```bash
python3 -c "import yaml; yaml.safe_load(open('../design-profiles-lab/design-profiles/scandinavian-editorial.yaml')); print('YAML OK')"
```

Expected: `YAML OK`

**Step 3: Commit**

```bash
cd ../design-profiles-lab && git add design-profiles/scandinavian-editorial.yaml && git commit -m "feat: add scandinavian editorial design profile"
```

---

### Task 6: Opprett bold-brutalist.yaml

**Files:**
- Create: `design-profiles-lab/design-profiles/bold-brutalist.yaml`

**Step 1: Skriv profilen**

```yaml
# ─────────────────────────────────────────────────
# Bold Brutalist
# Rå, direkte, ekspressiv — tenk Bloomberg, Balenciaga, anti-design
# ─────────────────────────────────────────────────

name: Bold Brutalist
slug: bold-brutalist
description: >
  Kompromissløs brutalisme. Svart, hvitt, rødt. Tykke borders,
  hard shadows, massive overskrifter. Designet skriker — med vilje.

mood:
  keywords:
    - rå
    - direkte
    - ekspressiv
    - konfronterende
    - anti-design
  inspiration:
    - Bloomberg Businessweek
    - Balenciaga
    - Brutalist Websites
    - David Carson
  tone: "Si det høyt. Ikke be om tillatelse."

# ─── Farger ───────────────────────────────────────

colors:
  primary: "#000000"        # Svart — dominerende
  secondary: "#333333"      # Mørk grå — sekundær tekst
  accent: "#FF0000"         # Ren rød — rå og direkte
  accent-hover: "#CC0000"   # Mørkere rød — hover
  background: "#FFFFFF"     # Hvit — hard kontrast
  surface: "#F0F0F0"        # Lys grå — flater
  border: "#000000"         # Svart — tykke linjer
  muted: "#666666"          # Grå — dempet tekst
  white: "#FFFFFF"          # Hvit
  error: "#FF0000"          # Rød — feil = accent her
  success: "#00FF00"        # Neongrønn — rått

# ─── Typografi ────────────────────────────────────

fonts:
  heading:
    family: "'Space Grotesk', 'Arial Black', sans-serif"
    google-import: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap"
  body:
    family: "'JetBrains Mono', 'Courier New', monospace"
    google-import: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap"

typography:
  display:
    size: "6rem"
    weight: 700
    line-height: 0.95
    letter-spacing: "-0.03em"
    text-transform: "uppercase"
    font: heading
    style-note: "MASSIVT. Alltid uppercase. La det ta over hele skjermen."
  h1:
    size: "3.5rem"
    weight: 700
    line-height: 1.0
    letter-spacing: "-0.02em"
    text-transform: "uppercase"
    font: heading
  h2:
    size: "2.5rem"
    weight: 700
    line-height: 1.1
    text-transform: "uppercase"
    font: heading
  h3:
    size: "1.5rem"
    weight: 600
    line-height: 1.2
    text-transform: "uppercase"
    font: heading
  body:
    size: "0.9375rem"
    weight: 400
    line-height: 1.6
    font: body
    style-note: "Monospace overalt. Teknisk og rått."
  caption:
    size: "0.6875rem"
    weight: 700
    line-height: 1.4
    letter-spacing: "0.12em"
    text-transform: "uppercase"
    font: body
    style-note: "Liten, monospace, LOUD."
  small:
    size: "0.8125rem"
    weight: 400
    line-height: 1.5
    font: body

# ─── Spacing ──────────────────────────────────────

spacing:
  unit: "8px"
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  3xl: "64px"
  section-padding: "64px"
  content-max-width: "960px"
  page-max-width: "1400px"
  style-note: "Tett og intenst. Ikke vær redd for å pakke ting tett."

# ─── Border Radius ────────────────────────────────

border-radius:
  none: "0"
  sm: "0"
  md: "0"
  lg: "0"
  full: "0"
  default: "0"
  style-note: "Ingen avrundinger. Aldri. Alt er skarpt og kantet."

# ─── Shadows ──────────────────────────────────────

shadows:
  sm: "4px 4px 0 #000000"
  md: "8px 8px 0 #000000"
  lg: "12px 12px 0 #000000"
  style-note: "Hard offset. Aldri blur. Aldri subtilt. Skyggen er en del av designet."

# ─── Animasjon ────────────────────────────────────

animation:
  duration-fast: "50ms"
  duration-default: "150ms"
  duration-slow: "300ms"
  easing: "linear"
  style-note: "Snappy eller ingen. Ting bare skjer. Ingen smooth easing — det er feigt."

# ─── Komponent-retningslinjer ─────────────────────

components:
  button:
    description: "Harde, konfronterende knapper"
    styles:
      padding: "14px 28px"
      font-size: "0.8125rem"
      font-weight: 700
      letter-spacing: "0.06em"
      text-transform: "uppercase"
      border: "3px solid var(--color-primary)"
      border-radius: "0"
    variants:
      primary:
        background: "var(--color-primary)"
        color: "var(--color-white)"
        hover-background: "var(--color-white)"
        hover-color: "var(--color-primary)"
        hover-note: "Inverteres ved hover. Svart blir hvitt, hvitt blir svart."
      secondary:
        background: "var(--color-white)"
        color: "var(--color-primary)"
        border: "3px solid var(--color-primary)"
        hover-background: "var(--color-primary)"
        hover-color: "var(--color-white)"
      danger:
        background: "var(--color-accent)"
        color: "var(--color-white)"
        border: "3px solid var(--color-accent)"
        hover-background: "var(--color-white)"
        hover-color: "var(--color-accent)"
    style-note: "3px border alltid. Hover = invertering. Ingen subtilitet."

  card:
    description: "Harde bokser med tykke borders og hard shadow"
    styles:
      background: "var(--color-white)"
      border: "3px solid var(--color-primary)"
      border-radius: "0"
      padding: "24px"
      box-shadow: "var(--shadow-md)"
    hover:
      box-shadow: "var(--shadow-lg)"
      transform: "translate(-2px, -2px)"
    style-note: "Tykk svart border. Hard shadow. Monospace tekst inni. Ser ut som et terminal-vindu."

  hero:
    description: "MASSIVE overskrifter i svart/hvitt"
    styles:
      min-height: "100vh"
      display: "flex"
      align-items: "center"
      justify-content: "flex-start"
      text-align: "left"
      padding: "var(--spacing-section-padding) var(--spacing-lg)"
      background: "var(--color-primary)"
      color: "var(--color-white)"
    style-note: "Venstrejustert. Svart bakgrunn, hvit tekst. Overskriften skal dominere. 6rem+."

  navigation:
    description: "Tykk border-bottom, monospace, uppercase"
    styles:
      padding: "16px 0"
      font-size: "0.8125rem"
      font-weight: 700
      letter-spacing: "0.06em"
      text-transform: "uppercase"
      border-bottom: "3px solid var(--color-primary)"
    style-note: "Tykk svart linje under. Monospace. Uppercase. Ingen pynt."
```

**Step 2: Verifiser YAML-syntaks**

```bash
python3 -c "import yaml; yaml.safe_load(open('../design-profiles-lab/design-profiles/bold-brutalist.yaml')); print('YAML OK')"
```

Expected: `YAML OK`

**Step 3: Commit**

```bash
cd ../design-profiles-lab && git add design-profiles/bold-brutalist.yaml && git commit -m "feat: add bold brutalist design profile"
```

---

### Task 7: Opprett soft-saas.yaml

**Files:**
- Create: `design-profiles-lab/design-profiles/soft-saas.yaml`

**Step 1: Skriv profilen**

```yaml
# ─────────────────────────────────────────────────
# Soft SaaS
# Vennlig, moderne, tillitsvekkende — tenk Linear, Notion, Vercel
# ─────────────────────────────────────────────────

name: Soft SaaS
slug: soft-saas
description: >
  Moderne SaaS-estetikk med myke former, subtile gradienter og
  en vennlig, profesjonell tone. Designet bygger tillit gjennom
  konsistens og polish.

mood:
  keywords:
    - vennlig
    - moderne
    - tillitsvekkende
    - polert
    - profesjonell
  inspiration:
    - Linear
    - Notion
    - Vercel
    - Raycast
  tone: "Profesjonell men vennlig. Polert uten å være kald."

# ─── Farger ───────────────────────────────────────

colors:
  primary: "#111827"        # Nesten svart — hovedtekst
  secondary: "#4B5563"      # Kul grå — sekundær tekst
  accent: "#6366F1"         # Indigo — handlinger og CTA
  accent-hover: "#4F46E5"   # Mørkere indigo — hover
  background: "#FAFBFC"     # Kald lys grå — hovedbakgrunn
  surface: "#FFFFFF"        # Hvit — kort og flater
  border: "#E5E7EB"         # Lys grå — subtile borders
  muted: "#9CA3AF"          # Dempet grå — metadata
  white: "#FFFFFF"          # Hvit
  error: "#EF4444"          # Rød — feilmeldinger
  success: "#10B981"        # Smaragdgrønn — suksess
  warning: "#F59E0B"        # Amber — advarsler
  info: "#3B82F6"           # Blå — informasjon

# ─── Typografi ────────────────────────────────────

fonts:
  heading:
    family: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
    google-import: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
  body:
    family: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    google-import: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap"

typography:
  display:
    size: "3.5rem"
    weight: 700
    line-height: 1.15
    letter-spacing: "-0.025em"
    font: heading
    style-note: "Bold og tydelig, men ikke overveldende. Balansert med whitespace."
  h1:
    size: "2.25rem"
    weight: 700
    line-height: 1.2
    letter-spacing: "-0.02em"
    font: heading
  h2:
    size: "1.75rem"
    weight: 600
    line-height: 1.3
    letter-spacing: "-0.01em"
    font: heading
  h3:
    size: "1.25rem"
    weight: 600
    line-height: 1.4
    font: heading
  body:
    size: "1rem"
    weight: 400
    line-height: 1.6
    font: body
    style-note: "Ren og lesbar. Ikke for stor, ikke for liten."
  caption:
    size: "0.8125rem"
    weight: 500
    line-height: 1.5
    font: body
    style-note: "Brukes til labels, metadata. Ingen uppercase her — det er for brutalist."
  small:
    size: "0.875rem"
    weight: 400
    line-height: 1.5
    font: body

# ─── Spacing ──────────────────────────────────────

spacing:
  unit: "8px"
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  3xl: "64px"
  section-padding: "80px"
  content-max-width: "768px"
  page-max-width: "1280px"
  style-note: "Balansert og konsistent. Bruk 8px-grid strengt."

# ─── Border Radius ────────────────────────────────

border-radius:
  none: "0"
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
  default: "8px"
  style-note: "Mykt avrundet. Ikke for mye, ikke for lite. Pill-shape (9999px) for tags og badges."

# ─── Shadows ──────────────────────────────────────

shadows:
  sm: "0 1px 2px rgba(0, 0, 0, 0.05)"
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)"
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)"
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)"
  style-note: "Subtile, lagdelte skygger. Flere verdier for dybde. Aldri harde kanter."

# ─── Animasjon ────────────────────────────────────

animation:
  duration-fast: "100ms"
  duration-default: "200ms"
  duration-slow: "400ms"
  easing: "cubic-bezier(0.16, 1, 0.3, 1)"
  style-note: "Smooth og polert. Subtil hover med translateY(-1px). Ting føles responsive."

# ─── Komponent-retningslinjer ─────────────────────

components:
  button:
    description: "Myke, vennlige knapper med tydelig hierarki"
    styles:
      padding: "10px 20px"
      font-size: "0.875rem"
      font-weight: 600
      border-radius: "8px"
    variants:
      primary:
        background: "var(--color-accent)"
        color: "var(--color-white)"
        hover-background: "var(--color-accent-hover)"
        hover-transform: "translateY(-1px)"
        hover-shadow: "var(--shadow-md)"
      secondary:
        background: "var(--color-surface)"
        color: "var(--color-primary)"
        border: "1px solid var(--color-border)"
        hover-background: "var(--color-background)"
        hover-shadow: "var(--shadow-sm)"
      ghost:
        background: "transparent"
        color: "var(--color-accent)"
        hover-background: "rgba(99, 102, 241, 0.08)"
      pill:
        border-radius: "9999px"
        padding: "8px 18px"
        font-size: "0.8125rem"
    style-note: "Indigo for primær. Avrundet. Semi-bold. Ghost-variant for tertiære handlinger."

  card:
    description: "Hvit, ren, subtil border med hover-effekt"
    styles:
      background: "var(--color-surface)"
      border: "1px solid var(--color-border)"
      border-radius: "12px"
      padding: "24px"
      box-shadow: "var(--shadow-sm)"
    hover:
      box-shadow: "var(--shadow-md)"
      transform: "translateY(-1px)"
      border-color: "var(--color-accent)"
    style-note: "Hvit bakgrunn. Subtil border. Ved hover: litt skygge, litt løft. Elegant."

  hero:
    description: "Subtil gradient-bakgrunn med pill-formet CTA"
    styles:
      min-height: "80vh"
      display: "flex"
      align-items: "center"
      justify-content: "center"
      text-align: "center"
      padding: "var(--spacing-section-padding) var(--spacing-md)"
      background: "linear-gradient(135deg, var(--color-background) 0%, #EEF2FF 50%, var(--color-background) 100%)"
    style-note: "Subtil gradient i bakgrunnen (aldri hard). Pill-formet CTA-knapp. Romslig og innbydende."

  navigation:
    description: "Clean med pill-shaped aktiv-indikator"
    styles:
      padding: "16px 0"
      font-size: "0.875rem"
      font-weight: 500
    active-indicator:
      background: "rgba(99, 102, 241, 0.08)"
      border-radius: "9999px"
      padding: "6px 14px"
      color: "var(--color-accent)"
    style-note: "Ren og minimal. Pill-formet bakgrunn for aktiv side. Ingen understrek."
```

**Step 2: Verifiser YAML-syntaks**

```bash
python3 -c "import yaml; yaml.safe_load(open('../design-profiles-lab/design-profiles/soft-saas.yaml')); print('YAML OK')"
```

Expected: `YAML OK`

**Step 3: Commit**

```bash
cd ../design-profiles-lab && git add design-profiles/soft-saas.yaml && git commit -m "feat: add soft SaaS design profile"
```

---

### Task 8: Opprett _template.yaml

**Files:**
- Create: `design-profiles-lab/design-profiles/_template.yaml`

**Step 1: Skriv malen**

```yaml
# ─────────────────────────────────────────────────
# Din Designprofil — Mal
# Fyll inn verdiene under for å lage din egen profil!
# ─────────────────────────────────────────────────
#
# TIPS:
# - Gå til https://coolors.co for å generere fargepaletter
# - Bruk Chrome-extension ColorZilla for å plukke farger fra nettsider du liker
# - Se https://fonts.google.com for fonter (kopier import-URL derfra)
# - Se https://typescale.com for å eksperimentere med typografi-skala
# - Kopier en av de andre profilene og endre verdiene om du vil ha et utgangspunkt!

name: ""                    # Navnet på profilen din (f.eks. "Nordic Winter")
slug: ""                    # URL-vennlig versjon (f.eks. "nordic-winter")
description: >              # Beskriv designet ditt med noen setninger


mood:
  keywords: []              # 3-5 ord som beskriver stemningen (f.eks. [varm, leken, moderne])
  inspiration: []           # Nettsider eller merkevarer du henter inspirasjon fra
  tone: ""                  # Én setning som oppsummerer tonen i designet

# ─── Farger ───────────────────────────────────────
# Tips: Start med 2-3 farger og bygg ut. Bruk coolors.co for å finne komplementærfarger.

colors:
  primary: ""               # Hovedfarge for tekst (vanligvis mørk)
  secondary: ""             # Sekundær tekstfarge (vanligvis litt lysere enn primary)
  accent: ""                # Aksentfarge — brukes på knapper, lenker, CTA-er
  accent-hover: ""          # Litt mørkere versjon av accent (for hover-effekt)
  background: ""            # Bakgrunnsfarge for hele siden
  surface: ""               # Bakgrunnsfarge for kort, bokser, seksjoner
  border: ""                # Farge på skillelinjer og borders
  muted: ""                 # Dempet tekstfarge for metadata, hjelpetekst
  white: "#FFFFFF"          # Hvit — endre sjelden
  error: ""                 # Farge for feilmeldinger (vanligvis rød-aktig)
  success: ""               # Farge for suksessmeldinger (vanligvis grønn-aktig)

# ─── Typografi ────────────────────────────────────
# Tips: Velg én font for overskrifter og én for brødtekst.
# Gå til https://fonts.google.com, velg fonten, og kopier import-URLen.

fonts:
  heading:
    family: ""              # Font-family med fallbacks (f.eks. "'Poppins', sans-serif")
    google-import: ""       # Full Google Fonts import-URL
  body:
    family: ""              # Font-family med fallbacks
    google-import: ""       # Full Google Fonts import-URL

# Tips: Bruk https://typescale.com for å eksperimentere med størrelser.
# Vanlige skalaer: 1.200 (minor third), 1.250 (major third), 1.333 (perfect fourth)

typography:
  display:
    size: ""                # Største størrelse — for hero-tekst (f.eks. "3.5rem")
    weight:                 # Font-vekt (400=normal, 600=semi-bold, 700=bold)
    line-height:            # Linjehøyde (f.eks. 1.1 for store, 1.6 for body)
    letter-spacing: ""      # Bokstavmellomrom (f.eks. "-0.02em" for store overskrifter)
    font: heading           # Hvilken font-gruppe (heading eller body)
    style-note: ""          # Beskriv hvordan display-tekst skal se ut
  h1:
    size: ""
    weight:
    line-height:
    letter-spacing: ""
    font: heading
  h2:
    size: ""
    weight:
    line-height:
    font: heading
  h3:
    size: ""
    weight:
    line-height:
    font: heading
  body:
    size: ""                # Vanlig tekststørrelse (anbefalt: 1rem–1.125rem)
    weight:
    line-height:            # Anbefalt: 1.5–1.7 for god lesbarhet
    font: body
    style-note: ""
  caption:
    size: ""                # Liten tekst for metadata (f.eks. "0.75rem")
    weight:
    line-height:
    letter-spacing: ""
    text-transform: ""      # Vil du ha uppercase? Skriv "uppercase", ellers la stå tom
    font: body
    style-note: ""
  small:
    size: ""
    weight:
    line-height:
    font: body

# ─── Spacing ──────────────────────────────────────
# Tips: Bruk et konsistent system basert på en enhet (vanligvis 4px eller 8px).

spacing:
  unit: ""                  # Grunnenhet (anbefalt: "8px")
  xs: ""                    # Ekstra liten (f.eks. "4px")
  sm: ""                    # Liten (f.eks. "8px")
  md: ""                    # Medium (f.eks. "16px")
  lg: ""                    # Stor (f.eks. "24px")
  xl: ""                    # Ekstra stor (f.eks. "32px")
  2xl: ""                   # Dobbel XL (f.eks. "48px")
  3xl: ""                   # Trippel XL (f.eks. "64px")
  section-padding: ""       # Vertikal padding mellom seksjoner (f.eks. "80px")
  content-max-width: ""     # Maks bredde på innhold (f.eks. "720px")
  page-max-width: ""        # Maks bredde på hele siden (f.eks. "1200px")
  style-note: ""            # Beskriv spacing-filosofien din

# ─── Border Radius ────────────────────────────────
# Tips: 0 = skarpt og kantet, 8-12px = mykt og moderne, 9999px = pill/sirkel

border-radius:
  none: "0"
  sm: ""                    # Liten avrunding (f.eks. "4px")
  md: ""                    # Medium avrunding (f.eks. "8px")
  lg: ""                    # Stor avrunding (f.eks. "12px")
  full: "9999px"            # Pill-form / sirkel
  default: ""               # Standard avrunding brukt overalt
  style-note: ""            # F.eks. "Alltid skarpt" eller "Mykt og vennlig"

# ─── Shadows ──────────────────────────────────────
# Tips: Subtle shadows = profesjonelt. Hard offset = brutalt. Ingen = minimalistisk.

shadows:
  sm: ""                    # Liten skygge (f.eks. "0 1px 2px rgba(0,0,0,0.05)")
  md: ""                    # Medium skygge
  lg: ""                    # Stor skygge
  style-note: ""            # Beskriv skygge-filosofien din

# ─── Animasjon ────────────────────────────────────
# Tips: 150-200ms er snappy. 300-400ms er smooth. Over 500ms føles tregt.

animation:
  duration-fast: ""         # Rask animasjon (f.eks. "100ms")
  duration-default: ""      # Standard animasjon (f.eks. "200ms")
  duration-slow: ""         # Sakte animasjon (f.eks. "400ms")
  easing: ""                # Easing-funksjon (f.eks. "ease-in-out" eller "cubic-bezier(0.4, 0, 0.2, 1)")
  style-note: ""            # Beskriv animasjons-filosofien din

# ─── Komponent-retningslinjer ─────────────────────
# Tips: Beskriv hvordan hver komponent skal se ut og oppføre seg.

components:
  button:
    description: ""         # Kort beskrivelse av knappestilen
    styles:
      padding: ""
      font-size: ""
      font-weight:
      border-radius: ""
    variants:
      primary:
        background: ""
        color: ""
        hover-background: ""
      secondary:
        background: ""
        color: ""
        border: ""
      ghost:
        background: "transparent"
        color: ""
    style-note: ""          # Beskriv knappestilen med egne ord

  card:
    description: ""
    styles:
      background: ""
      border: ""
      border-radius: ""
      padding: ""
      box-shadow: ""
    hover:
      box-shadow: ""
      transform: ""         # F.eks. "translateY(-2px)" for løft-effekt
    style-note: ""

  hero:
    description: ""
    styles:
      min-height: ""        # F.eks. "100vh" for fullskjerm
      display: "flex"
      align-items: ""       # "center" eller "flex-start"
      justify-content: ""   # "center" eller "flex-start"
      text-align: ""        # "center" eller "left"
      padding: ""
    style-note: ""

  navigation:
    description: ""
    styles:
      padding: ""
      font-size: ""
      font-weight:
    style-note: ""
```

**Step 2: Verifiser YAML-syntaks**

```bash
python3 -c "import yaml; yaml.safe_load(open('../design-profiles-lab/design-profiles/_template.yaml')); print('YAML OK')"
```

Expected: `YAML OK`

**Step 3: Commit**

```bash
cd ../design-profiles-lab && git add design-profiles/_template.yaml && git commit -m "feat: add blank template for custom design profiles"
```

---

### Task 9: Opprett README.md

**Files:**
- Create: `design-profiles-lab/README.md`

**Step 1: Skriv README**

```markdown
# Design Profiles Lab

Et design-profil-system der hele det visuelle uttrykket styres av YAML-filer. Perfekt for å lære vibbekoding med Claude Code.

## Kom i gang

```bash
git clone <repo-url>
cd design-profiles-lab
claude
```

Deretter si til Claude: *"Bruk profilen scandinavian-editorial og bygg en landingsside."*

## Bytte profil

Si til Claude hvilken profil du vil bruke:

- `design-profiles/scandinavian-editorial.yaml` — Rolig og redaksjonell
- `design-profiles/bold-brutalist.yaml` — Rå og ekspressiv
- `design-profiles/soft-saas.yaml` — Vennlig og moderne

Eksempel: *"Bytt til bold-brutalist og bygg den samme siden på nytt."*

## Lag din egen profil

1. Kopier `design-profiles/_template.yaml` til en ny fil
2. Gi den et navn (f.eks. `design-profiles/min-profil.yaml`)
3. Fyll inn verdiene — malen har kommentarer som forklarer hvert felt
4. Si til Claude: *"Bruk profilen min-profil og bygg en landingsside."*

## Tips

- Bruk [Coolors](https://coolors.co) for å finne fargepaletter
- Bruk [Google Fonts](https://fonts.google.com) for å velge fonter
- Bruk [Type Scale](https://typescale.com) for typografi-skala
- Installer ColorZilla i Chrome for å plukke farger fra nettsider du liker
```

**Step 2: Verifiser**

```bash
cat ../design-profiles-lab/README.md
```

Expected: README med norsk innhold vises.

**Step 3: Commit**

```bash
cd ../design-profiles-lab && git add README.md && git commit -m "docs: add README with usage instructions"
```

---

### Task 10: Sluttsjekk — verifiser hele prosjektstrukturen

**Step 1: Vis mappestruktur**

```bash
cd ../design-profiles-lab && find . -not -path './.git/*' -not -path './.git' | sort
```

Expected output (omtrent):
```
.
./.claude
./.claude/rules
./.claude/rules/design-system.md
./.gitignore
./CLAUDE.md
./README.md
./design-profiles
./design-profiles/_template.yaml
./design-profiles/bold-brutalist.yaml
./design-profiles/scandinavian-editorial.yaml
./design-profiles/soft-saas.yaml
./src
./src/.gitkeep
```

**Step 2: Verifiser alle YAML-filer parser korrekt**

```bash
cd ../design-profiles-lab && for f in design-profiles/*.yaml; do python3 -c "import yaml; yaml.safe_load(open('$f')); print('OK: $f')"; done
```

Expected:
```
OK: design-profiles/_template.yaml
OK: design-profiles/bold-brutalist.yaml
OK: design-profiles/scandinavian-editorial.yaml
OK: design-profiles/soft-saas.yaml
```

**Step 3: Sjekk git-historikk**

```bash
cd ../design-profiles-lab && git log --oneline
```

Expected: Alle commits vises i rekkefølge.

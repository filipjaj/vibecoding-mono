# Eksempelprofiler

Tre ferdiglagde designprofiler som demonstrerer bredden i systemet.
Disse kan brukes som utgangspunkt eller inspirasjon.

## 1. Scandinavian Editorial

Rolig, sofistikert, luftig — tenk Kinfolk møter Muuto.

```yaml
meta:
  name: "Scandinavian Editorial"
  description: "Minimalistisk skandinavisk design med editorial kvalitet"
  mood: "rolig, sofistikert, luftig, varm, tidløs"
  version: "1.0"
  author: "Design Profiles"

colors:
  background:
    primary: "#FAF8F5"
    secondary: "#F0EDE8"
    tertiary: "#E8E3DC"
  text:
    primary: "#1A1714"
    secondary: "#6B6560"
    muted: "#9C958E"
    inverse: "#FAF8F5"
  accent:
    primary: "#C2705A"
    hover: "#A85D48"
    subtle: "#F5E6E1"
  border:
    default: "#D4CBC0"
    strong: "#B8ADA0"
  status:
    success: "#7C9A6E"
    warning: "#D4A853"
    error: "#C25B4A"
    info: "#6B8FA3"

typography:
  fonts:
    heading:
      family: "Playfair Display"
      import: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap"
    body:
      family: "Inter"
      import: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&display=swap"
  scale:
    display:
      size: "4rem"
      weight: 400
      line-height: 1.1
      letter-spacing: "-0.02em"
      text-transform: "none"
    h1:
      size: "2.5rem"
      weight: 400
      line-height: 1.2
    h2:
      size: "1.75rem"
      weight: 400
      line-height: 1.3
    h3:
      size: "1.25rem"
      weight: 500
      line-height: 1.4
    body:
      size: "1.0625rem"
      weight: 400
      line-height: 1.7
    caption:
      size: "0.8125rem"
      weight: 500
      line-height: 1.5
      text-transform: "uppercase"
      letter-spacing: "0.08em"

spacing:
  unit: "8px"
  section-padding: "96px"
  content-max-width: "1200px"
  content-narrow: "720px"

borders:
  radius:
    small: "2px"
    medium: "4px"
    large: "8px"
    pill: "9999px"
    none: "0"
  width:
    default: "1px"
    strong: "2px"
  style-notes: "Skarpe hjørner. Editorial, ikke lekent. Bruk minimal radius."

shadows:
  small: "0 1px 3px rgba(26, 23, 20, 0.04)"
  medium: "0 4px 12px rgba(26, 23, 20, 0.06)"
  large: "0 12px 40px rgba(26, 23, 20, 0.08)"
  style-notes: "Foretrekk bakgrunnsfarge-skift fremfor skygger. Subtilt."

animation:
  duration:
    fast: "200ms"
    default: "300ms"
    slow: "500ms"
  easing:
    default: "cubic-bezier(0.25, 0.1, 0.25, 1)"
    in: "cubic-bezier(0.42, 0, 1, 1)"
    out: "cubic-bezier(0, 0, 0.58, 1)"
  style-notes: "Minimalt og elegant. Ingen bounce. Ting glir sakte inn."

component-guidelines:
  buttons:
    primary:
      background: "accent.primary"
      text: "text.inverse"
      border-radius: "radius.small"
      font: "caption style — uppercase, liten, spredt"
      padding: "14px 32px"
      hover: "accent.hover, ingen transform"
    secondary:
      background: "transparent"
      text: "accent.primary"
      border: "1px solid accent.primary"
    style-notes: "Uppercase caption-stil. Terrakotta. Aldri for store."
  cards:
    background: "background.secondary"
    border: "none"
    border-radius: "radius.small"
    padding: "32px"
    hover: "bakgrunnsfarge til tertiary, ingen skygge"
    style-notes: "Flat, krem bakgrunn, minimal skygge. Innholdet snakker."
  hero:
    padding: "160px 0"
    text-align: "center"
    max-width: "content-narrow"
    typography: "display størrelse"
    style-notes: "Full viewport-følelse. Sentrert display-type. MAKS whitespace."
  navigation:
    background: "background.primary"
    height: "72px"
    border-bottom: "1px solid border.default"
    style-notes: "Luftig. Uppercase caption-stil for lenker. Mye plass mellom items."
  images:
    border-radius: "radius.small"
    aspect-ratio: "3/2 eller 16/9"
    style-notes: "Duse, varme bilder. Aldri skarpe farger i fotografier."
  inputs:
    background: "background.primary"
    border: "1px solid border.default"
    border-radius: "radius.small"
    focus: "accent.primary border, ingen ring — bare border-farge endring"
    padding: "12px 16px"
    style-notes: "Enkelt og usynlig. Feltet skal ikke tiltrekke oppmerksomhet."
  modals:
    background: "background.primary"
    border-radius: "radius.medium"
    padding: "48px"
    overlay: "rgba(26, 23, 20, 0.4)"
    max-width: "560px"
    style-notes: "Mye indre padding. Luftig. Overlay er varm, ikke kald."
  tables:
    header-background: "background.secondary"
    border: "1px solid border.default"
    cell-padding: "16px 24px"
    style-notes: "Enkel, horisontal linjer. Aldri zebra-striping. Caption-stil header."
  footer:
    background: "background.secondary"
    padding: "64px 0"
    border-top: "1px solid border.default"
    style-notes: "Diskret. Samme typografi som resten. Ikke prøv å gjøre den fancy."
  badges:
    background: "accent.subtle"
    text: "accent.primary"
    border-radius: "radius.small"
    padding: "4px 10px"
    font: "caption størrelse, uppercase"
    style-notes: "Små, diskrete. Uppercase caption-stil som matcher buttons."
  toast:
    background: "background.primary"
    border: "1px solid border.default"
    border-radius: "radius.small"
    shadow: "shadow.medium"
    style-notes: "Minimal. Ingen ikoner med mindre det er en feil. Tekst er nok."
```

## 2. Bold Brutalist

Rå, direkte, ekspressiv — tenk Bloomberg, Balenciaga, anti-design.

```yaml
meta:
  name: "Bold Brutalist"
  description: "Brutalistisk design med rå kraft og direkte uttrykk"
  mood: "rå, direkte, ekspressiv, kompromissløs, høylytt"
  version: "1.0"
  author: "Design Profiles"

colors:
  background:
    primary: "#FFFFFF"
    secondary: "#000000"
    tertiary: "#F5F5F5"
  text:
    primary: "#000000"
    secondary: "#333333"
    muted: "#666666"
    inverse: "#FFFFFF"
  accent:
    primary: "#FF0000"
    hover: "#CC0000"
    subtle: "#FFE5E5"
  border:
    default: "#000000"
    strong: "#000000"
  status:
    success: "#00FF00"
    warning: "#FFFF00"
    error: "#FF0000"
    info: "#0000FF"

typography:
  fonts:
    heading:
      family: "Space Grotesk"
      import: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap"
    body:
      family: "JetBrains Mono"
      import: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap"
  scale:
    display:
      size: "6rem"
      weight: 700
      line-height: 0.95
      letter-spacing: "-0.03em"
      text-transform: "uppercase"
    h1:
      size: "3.5rem"
      weight: 700
      line-height: 1.0
      text-transform: "uppercase"
    h2:
      size: "2rem"
      weight: 700
      line-height: 1.1
      text-transform: "uppercase"
    h3:
      size: "1.25rem"
      weight: 700
      line-height: 1.2
      text-transform: "uppercase"
    body:
      size: "1rem"
      weight: 400
      line-height: 1.5
    caption:
      size: "0.75rem"
      weight: 500
      line-height: 1.4
      text-transform: "uppercase"
      letter-spacing: "0.1em"

spacing:
  unit: "8px"
  section-padding: "64px"
  content-max-width: "1400px"
  content-narrow: "800px"

borders:
  radius:
    small: "0"
    medium: "0"
    large: "0"
    pill: "0"
    none: "0"
  width:
    default: "3px"
    strong: "5px"
  style-notes: "Ingen avrundinger. Aldri. Alt er skarpt og rett. Tykke borders."

shadows:
  small: "4px 4px 0 #000000"
  medium: "8px 8px 0 #000000"
  large: "12px 12px 0 #000000"
  style-notes: "Hard offset, ALDRI blur. Skygger er grafiske elementer, ikke dybde."

animation:
  duration:
    fast: "100ms"
    default: "150ms"
    slow: "200ms"
  easing:
    default: "linear"
    in: "linear"
    out: "linear"
  style-notes: "Snappy eller ingenting. Ting bare SKJER. Ingen smooth easing."

component-guidelines:
  buttons:
    primary:
      background: "text.primary"
      text: "text.inverse"
      border: "3px solid text.primary"
      border-radius: "radius.none"
      font: "body font, bold, uppercase"
      padding: "16px 32px"
      hover: "invertert — hvit bg, svart tekst"
    secondary:
      background: "transparent"
      text: "text.primary"
      border: "3px solid text.primary"
      hover: "accent.primary border og tekst"
    style-notes: "Store, konfronterende. Hover inverterer alt."
  cards:
    background: "background.primary"
    border: "3px solid border.default"
    border-radius: "radius.none"
    padding: "24px"
    hover: "shadow.medium, ingen subtilitet"
    style-notes: "Tykk svart border. Hard shadow. Monospace body-tekst."
  hero:
    padding: "80px 0"
    text-align: "left"
    max-width: "100%"
    typography: "display størrelse, MASSIV"
    style-notes: "ENORME overskrifter. Svart/hvitt. Rød aksent sparsomt."
  navigation:
    background: "background.primary"
    height: "56px"
    border-bottom: "3px solid border.default"
    style-notes: "Tykk border-bottom. Monospace uppercase lenker. Tight spacing."
  images:
    border-radius: "radius.none"
    border: "3px solid border.default"
    style-notes: "Svart-hvitt eller høykontrast. Aldri mykt."
  inputs:
    background: "background.primary"
    border: "3px solid border.default"
    border-radius: "radius.none"
    focus: "accent.primary border, 3px"
    padding: "12px 16px"
    font: "body font (monospace)"
    style-notes: "Tykk border. Monospace tekst. Rød focus-border."
  modals:
    background: "background.primary"
    border: "3px solid border.default"
    border-radius: "radius.none"
    shadow: "shadow.large"
    padding: "32px"
    overlay: "rgba(0, 0, 0, 0.8)"
    style-notes: "Svart overlay. Hard shadow. Tykk border. Brutalt."
  tables:
    header-background: "background.secondary"
    header-text: "text.inverse"
    border: "3px solid border.default"
    cell-padding: "12px 16px"
    style-notes: "Svart header med hvit tekst. Tykke borders overalt. Grid-look."
  footer:
    background: "background.secondary"
    text: "text.inverse"
    padding: "48px 0"
    border-top: "5px solid accent.primary"
    style-notes: "Svart bakgrunn, hvit tekst. Rød linje over. Monospace."
  badges:
    background: "text.primary"
    text: "text.inverse"
    border-radius: "radius.none"
    border: "2px solid text.primary"
    padding: "4px 12px"
    font: "caption, uppercase, monospace"
    style-notes: "Svarte bokser. Ingen avrunding. Rå etiketter."
  toast:
    background: "text.primary"
    text: "text.inverse"
    border: "3px solid accent.primary"
    border-radius: "radius.none"
    style-notes: "Svart boks med rød kant. Monospace tekst. Direkte."
  dividers:
    style: "3px solid border.default"
    spacing: "32px"
    style-notes: "Tykke svarte linjer. Bruk som grafiske elementer, ikke bare separatorer."
```

## 3. Soft SaaS

Vennlig, moderne, tillitsvekkende — tenk Linear, Notion, Vercel.

```yaml
meta:
  name: "Soft SaaS"
  description: "Moderne SaaS-design som balanserer profesjonalitet med vennlighet"
  mood: "vennlig, moderne, tillitsvekkende, polert, proff"
  version: "1.0"
  author: "Design Profiles"

colors:
  background:
    primary: "#FAFBFC"
    secondary: "#FFFFFF"
    tertiary: "#F3F4F6"
  text:
    primary: "#111827"
    secondary: "#6B7280"
    muted: "#9CA3AF"
    inverse: "#FFFFFF"
  accent:
    primary: "#6366F1"
    hover: "#4F46E5"
    subtle: "#EEF2FF"
  border:
    default: "#E5E7EB"
    strong: "#D1D5DB"
  status:
    success: "#10B981"
    warning: "#F59E0B"
    error: "#EF4444"
    info: "#3B82F6"

typography:
  fonts:
    heading:
      family: "Plus Jakarta Sans"
      import: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700&display=swap"
    body:
      family: "Inter"
      import: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
    mono:
      family: "JetBrains Mono"
      import: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap"
  scale:
    display:
      size: "3.5rem"
      weight: 700
      line-height: 1.1
      letter-spacing: "-0.02em"
      text-transform: "none"
    h1:
      size: "2.25rem"
      weight: 700
      line-height: 1.2
    h2:
      size: "1.5rem"
      weight: 600
      line-height: 1.3
    h3:
      size: "1.125rem"
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

spacing:
  unit: "8px"
  section-padding: "80px"
  content-max-width: "1200px"
  content-narrow: "720px"

borders:
  radius:
    small: "6px"
    medium: "8px"
    large: "12px"
    pill: "9999px"
    none: "0"
  width:
    default: "1px"
    strong: "2px"
  style-notes: "Avrundede hjørner gir et vennlig uttrykk. Bruk pill for tags/badges."

shadows:
  small: "0 1px 2px rgba(0, 0, 0, 0.05)"
  medium: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)"
  large: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)"
  style-notes: "Subtile, lagdelte med flere verdier. Gir dybde uten dramatikk."

animation:
  duration:
    fast: "150ms"
    default: "200ms"
    slow: "300ms"
  easing:
    default: "cubic-bezier(0.4, 0, 0.2, 1)"
    in: "cubic-bezier(0.4, 0, 1, 1)"
    out: "cubic-bezier(0, 0, 0.2, 1)"
  style-notes: "Smooth og subtilt. Hover translateY(-1px) for kort. Spring for modaler."

component-guidelines:
  buttons:
    primary:
      background: "accent.primary"
      text: "text.inverse"
      border-radius: "radius.medium"
      font-weight: 600
      padding: "10px 20px"
      hover: "accent.hover bakgrunn, translateY(-1px), shadow.small"
    secondary:
      background: "transparent"
      text: "accent.primary"
      border: "1px solid accent.primary"
      border-radius: "radius.medium"
    ghost:
      background: "transparent"
      text: "text.secondary"
      hover: "background.tertiary bakgrunn"
    style-notes: "Semi-bold, aldri uppercase. Indigo primary, ghost for sekundære handlinger."
  cards:
    background: "background.secondary"
    border: "1px solid border.default"
    border-radius: "radius.large"
    padding: "24px"
    hover: "shadow.medium, translateY(-1px)"
    style-notes: "Hvite kort på lys grå. Subtil hover. Clean og ryddig."
  hero:
    padding: "100px 0"
    text-align: "center"
    max-width: "content-narrow"
    typography: "display størrelse"
    style-notes: "Subtil gradient-bakgrunn (accent.subtle → transparent). Pill-shaped CTA."
  navigation:
    background: "background.secondary"
    height: "64px"
    border-bottom: "1px solid border.default"
    style-notes: "Clean. Pill-shaped aktiv-indikator med accent.subtle bakgrunn."
  inputs:
    background: "background.secondary"
    border: "1px solid border.default"
    border-radius: "radius.medium"
    focus: "accent.primary ring (2px offset)"
    padding: "10px 14px"
    style-notes: "Hvit bakgrunn, subtle border. Focus-ring i aksent-farge."
  badges:
    background: "accent.subtle"
    text: "accent.primary"
    border-radius: "radius.pill"
    padding: "4px 12px"
    font: "caption størrelse, medium weight"
    style-notes: "Pill-form. Subtile farger. Brukes for status og kategorier."
  modals:
    background: "background.secondary"
    border-radius: "radius.large"
    padding: "32px"
    overlay: "rgba(17, 24, 39, 0.5)"
    shadow: "shadow.large"
    max-width: "480px"
    style-notes: "Hvit modal, avrundet. Smooth fade-in. Backdrop blur hvis mulig."
  tables:
    header-background: "background.tertiary"
    border: "1px solid border.default"
    cell-padding: "12px 16px"
    border-radius: "radius.large (på wrapper)"
    style-notes: "Wrappet i avrundet container. Subtil header-bakgrunn. Hover row highlight."
  footer:
    background: "background.primary"
    padding: "64px 0"
    border-top: "1px solid border.default"
    style-notes: "Clean og enkel. Muted tekst. Ikke for mye innhold."
  sidebar:
    background: "background.secondary"
    width: "260px"
    border-right: "1px solid border.default"
    padding: "16px"
    active-item: "accent.subtle bakgrunn, pill-form, accent.primary tekst"
    style-notes: "Hvit sidebar. Pill-shaped aktive items. Nested groups med indent."
  toast:
    background: "background.secondary"
    border: "1px solid border.default"
    border-radius: "radius.large"
    shadow: "shadow.large"
    padding: "16px"
    style-notes: "Avrundet. Ikon + tekst. Subtil slide-in fra høyre."
  tabs:
    active-background: "accent.subtle"
    active-text: "accent.primary"
    active-radius: "radius.pill"
    inactive-text: "text.secondary"
    style-notes: "Pill-tabs. Smooth slide-indikator mellom aktive tabs."
  tooltips:
    background: "text.primary"
    text: "text.inverse"
    border-radius: "radius.medium"
    padding: "6px 12px"
    font: "caption størrelse"
    style-notes: "Mørk bakgrunn, liten tekst. Fade-in med 200ms delay."
```

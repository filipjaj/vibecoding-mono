# Typografi og Fargepar

Denne referansen hjelper med å lage nye designprofiler. Den inneholder
anbefalte font-kombinasjoner, fargemetoder og spacing-systemer.

---

## Font-par som fungerer

### Serif heading + Sans body (Elegant / Editorial)

| Heading | Body | Vibe |
|---|---|---|
| Playfair Display | Inter | Klassisk eleganse |
| Lora | Source Sans 3 | Varm og lesbar |
| Cormorant Garamond | Nunito Sans | Luftig luksus |
| DM Serif Display | DM Sans | Moderne serif |
| Fraunces | Work Sans | Leken og sofistikert |
| Libre Baskerville | Libre Franklin | Tidløs |

### Sans heading + Sans body (Moderne / Clean)

| Heading | Body | Vibe |
|---|---|---|
| Plus Jakarta Sans | Inter | Vennlig SaaS |
| Satoshi | Inter | Trendy startup |
| General Sans | Inter | Nøytral og ren |
| Sora | DM Sans | Geometrisk og presis |
| Outfit | Source Sans 3 | Åpen og imøtekommende |
| Manrope | Nunito Sans | Myk og rund |

### Display heading + Clean body (Ekspressiv / Kreativ)

| Heading | Body | Vibe |
|---|---|---|
| Space Grotesk | JetBrains Mono | Teknisk / brutalist |
| Clash Display | Satoshi | Sterk / moderne |
| Cabinet Grotesk | Inter | Karakterfull |
| Instrument Serif | Instrument Sans | Raffinert |
| Bricolage Grotesque | Inter | Leken / distinkt |

### Mono-par (Teknisk / Developer)

| Heading | Body | Vibe |
|---|---|---|
| Space Grotesk | JetBrains Mono | Kode-fokusert |
| IBM Plex Mono | IBM Plex Sans | IBM-estetikk |
| Fira Code | Fira Sans | Firefox-familie |

### Tips

- **Google Fonts**: Alle fontene over er gratis via fonts.google.com
- **Fontshare**: Satoshi, Clash Display, Cabinet Grotesk, General Sans er fra fontshare.com
- **Tester**: Bruk fontpair.co eller typ.io for å teste kombinasjoner
- **Lad kun nødvendige vekter**: Heading trenger typisk 500-700, body 400-600

---

## Fargemetoder

### Monokromatisk (én farge, mange toner)

Best for: Minimalistisk, elegant, editorial

```yaml
colors:
  accent:
    primary: "#6366F1"    # Hoved-tone
    hover: "#4F46E5"      # Mørkere
    subtle: "#EEF2FF"     # Veldig lys
```

Verktøy: coolors.co → "Monochromatic" generator

### Komplementær (motsatte farger)

Best for: Energisk, kontrastfull, CTA-fokusert

```yaml
colors:
  accent:
    primary: "#6366F1"    # Indigo (primær)
  status:
    warning: "#F59E0B"    # Gul-oransje (komplementær)
```

### Analog (nærliggende farger)

Best for: Harmonisk, behagelig, naturlig

```yaml
colors:
  accent:
    primary: "#10B981"    # Grønn
    hover: "#059669"      # Mørkere grønn
  status:
    info: "#06B6D4"       # Cyan (nærliggende)
```

### Nøytral + én aksent

Best for: De fleste SaaS/business-sider

```yaml
colors:
  background:
    primary: "#FAFBFC"    # Nesten hvit
    secondary: "#FFFFFF"   # Ren hvit
    tertiary: "#F3F4F6"   # Lys grå
  text:
    primary: "#111827"     # Nesten svart
    secondary: "#6B7280"   # Grå
  accent:
    primary: "#6366F1"     # DEN ENE fargen
```

---

## Populære fargepaletter

### Varm nøytral (Scandinavian)

```
Bakgrunn:  #FAF8F5 (varm off-white)
Tekst:     #1A1714 (varm nesten-svart)
Sekundær:  #6B6560 (varm grå)
Aksent:    #C4703F (terrakotta)
Border:    #E8E0D8 (varm lys grå)
```

### Kald nøytral (Tech/SaaS)

```
Bakgrunn:  #FAFBFC (kald off-white)
Tekst:     #111827 (kald nesten-svart)
Sekundær:  #6B7280 (kald grå)
Aksent:    #6366F1 (indigo)
Border:    #E5E7EB (kald lys grå)
```

### Ren kontrast (Brutalist)

```
Bakgrunn:  #FFFFFF (ren hvit)
Tekst:     #000000 (ren svart)
Aksent:    #FF0000 (ren rød)
Border:    #000000 (svart)
```

### Mørk base (Dark SaaS)

```
Bakgrunn:  #0B0F1A (dyp marineblå)
Tekst:     #F9FAFB (off-white)
Sekundær:  #9CA3AF (lys grå)
Aksent:    #818CF8 (lys indigo)
Border:    #374151 (mørk grå)
```

### Natur (Grønn)

```
Bakgrunn:  #FAFDF7 (varm off-white med grønt hint)
Tekst:     #1A2E1A (mørk grønn)
Sekundær:  #5A6B5A (dempet grønn)
Aksent:    #16A34A (grønn)
Border:    #D4E4D4 (lys grønn)
```

---

## Spacing-system

### 8px base (anbefalt)

```yaml
spacing:
  unit: "8px"
  # Resulterer i:
  # 1 unit  = 8px   (liten gap)
  # 2 units = 16px  (standard gap)
  # 3 units = 24px  (medium gap)
  # 4 units = 32px  (padding)
  # 6 units = 48px  (seksjon-gap)
  # 8 units = 64px  (kompakt seksjon-padding)
  # 10 units = 80px (standard seksjon-padding)
  # 12 units = 96px (stor seksjon-padding)
  # 20 units = 160px (hero-padding, luftig)
```

### Spacing etter mood

| Mood | Section-padding | Element-gap | Component-padding |
|---|---|---|---|
| Luftig / rolig | 120-160px | 32-48px | 32-48px |
| Standard / vennlig | 80-100px | 24-32px | 24-32px |
| Kompakt / direkte | 48-80px | 16-24px | 16-24px |
| Tight / intens | 32-64px | 8-16px | 16-24px |

### Content-bredde

| Type | Bredde | Bruk |
|---|---|---|
| Smal | 640-720px | Lesestoff, artikler |
| Standard | 1024-1200px | De fleste sider |
| Vid | 1280-1440px | Dashboards, datarike sider |
| Full | 100% med padding | Landing pages, hero |

---

## Border Radius guide

| Stil | none | small | medium | large | pill |
|---|---|---|---|---|---|
| Brutalist | 0 | 0 | 0 | 0 | 0 |
| Skarp | 0 | 2px | 4px | 6px | 9999px |
| Standard | 0 | 4px | 8px | 12px | 9999px |
| Avrundet | 0 | 6px | 8px | 16px | 9999px |
| Myk | 0 | 8px | 12px | 20px | 9999px |

---

## Shadow-stiler

### Soft (SaaS, moderne)
```yaml
shadows:
  none: "none"
  small: "0 1px 2px rgba(0,0,0,0.05)"
  medium: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)"
  large: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)"
```

### Minimal (Editorial, skandinavisk)
```yaml
shadows:
  none: "none"
  small: "0 1px 2px rgba(0,0,0,0.04)"
  medium: "0 2px 8px rgba(0,0,0,0.06)"
  large: "0 4px 16px rgba(0,0,0,0.08)"
```

### Hard offset (Brutalist)
```yaml
shadows:
  none: "none"
  small: "2px 2px 0 #000"
  medium: "4px 4px 0 #000"
  large: "8px 8px 0 #000"
```

### Colored (Leken / kreativ)
```yaml
shadows:
  none: "none"
  small: "0 2px 4px rgba(99,102,241,0.15)"
  medium: "0 4px 12px rgba(99,102,241,0.2)"
  large: "0 8px 24px rgba(99,102,241,0.25)"
```

---

## Animation-referanse

### Easing-kurver

| Navn | Verdi | Bruk |
|---|---|---|
| Linear | `linear` | Brutalist, rå |
| Ease-out | `cubic-bezier(0, 0, 0.2, 1)` | Inngang-animasjoner |
| Ease-in-out | `cubic-bezier(0.4, 0, 0.2, 1)` | Mest universal, myk |
| Spring | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Leken, bounce |
| Smooth | `cubic-bezier(0.25, 0.1, 0.25, 1)` | Elegant, rolig |

### Duration-guide

| Handling | Fast | Default | Slow |
|---|---|---|---|
| Hover-effekt | 100ms | 150ms | 200ms |
| Farge-transition | 150ms | 200ms | 300ms |
| Transform (move) | 150ms | 200ms | 300ms |
| Modal inngang | 200ms | 250ms | 350ms |
| Page transition | 200ms | 300ms | 500ms |

**Regel**: Jo mindre elementet er, jo raskere bør animasjonen være.
Knapper → fast. Modaler → slow. Sider → slowest.

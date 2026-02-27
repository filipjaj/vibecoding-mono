# Framework Mapping Guide

Denne referansen viser hvordan designprofil-tokens mappes til kode i ulike tech stacks.
Les denne når du skal integrere en profil i et prosjekt.

## Table of Contents

1. [Tailwind CSS (anbefalt)](#tailwind-css)
2. [CSS Custom Properties (vanilla)](#css-custom-properties)
3. [Shadcn/ui + Tailwind](#shadcnui)
4. [React med inline styles](#react-inline)

---

## Tailwind CSS

### tailwind.config.ts

Utvid Tailwind-konfigurasjonen med profil-tokens. ALDRI erstatt defaults — bruk `extend`.

```typescript
import type { Config } from "tailwindcss";

// Importert fra generate-tokens.mjs, eller skrevet manuelt
const profile = {
  colors: {
    background: {
      primary: "#FAFBFC",
      secondary: "#FFFFFF",
      tertiary: "#F3F4F6",
    },
    foreground: {  // Merk: "text" i profilen → "foreground" i Tailwind for å unngå konflikt
      primary: "#111827",
      secondary: "#6B7280",
      muted: "#9CA3AF",
      inverse: "#FFFFFF",
    },
    accent: {
      DEFAULT: "#6366F1",   // Merk: "primary" i profilen → DEFAULT i Tailwind
      hover: "#4F46E5",
      subtle: "#EEF2FF",
    },
    border: {
      DEFAULT: "#E5E7EB",
      strong: "#D1D5DB",
    },
    status: {
      success: "#10B981",
      warning: "#F59E0B",
      error: "#EF4444",
      info: "#3B82F6",
    },
  },
};

export default {
  content: ["./src/**/*.{ts,tsx,html}"],
  theme: {
    extend: {
      colors: profile.colors,
      fontFamily: {
        heading: ["'Plus Jakarta Sans'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
      },
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "12px",
        pill: "9999px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(0,0,0,0.05)",
        md: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
        lg: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)",
      },
      maxWidth: {
        content: "1200px",
        narrow: "720px",
      },
      transitionDuration: {
        fast: "150ms",
        default: "200ms",
        slow: "300ms",
      },
      transitionTimingFunction: {
        default: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
} satisfies Config;
```

### Bruk i komponenter

```tsx
// Bruker Tailwind-klasser som mapper til profil-tokens
<div className="bg-background-primary text-foreground-primary">
  <h1 className="font-heading text-4xl font-bold">Tittel</h1>
  <p className="font-body text-foreground-secondary">Tekst</p>
  <button className="bg-accent text-foreground-inverse rounded-md px-5 py-2.5 
    hover:bg-accent-hover transition-all duration-default">
    Klikk
  </button>
</div>
```

### Google Fonts i Tailwind-prosjekt

Legg til i `app.css` / `globals.css` / `root.tsx`:

```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;
```

Eller i HTML `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700&display=swap" rel="stylesheet" />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
```

---

## CSS Custom Properties

For vanilla HTML/CSS eller som supplement til Tailwind.

### design-tokens.css

```css
:root {
  /* Farger */
  --color-bg-primary: #FAFBFC;
  --color-bg-secondary: #FFFFFF;
  --color-bg-tertiary: #F3F4F6;
  --color-text-primary: #111827;
  --color-text-secondary: #6B7280;
  --color-text-muted: #9CA3AF;
  --color-text-inverse: #FFFFFF;
  --color-accent: #6366F1;
  --color-accent-hover: #4F46E5;
  --color-accent-subtle: #EEF2FF;
  --color-border: #E5E7EB;
  --color-border-strong: #D1D5DB;

  /* Typografi */
  --font-heading: 'Plus Jakarta Sans', sans-serif;
  --font-body: 'Inter', sans-serif;

  /* Spacing */
  --space-unit: 8px;
  --space-section: 80px;
  --max-w-content: 1200px;
  --max-w-narrow: 720px;

  /* Border radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-pill: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1);

  /* Animasjon */
  --duration-fast: 150ms;
  --duration: 200ms;
  --duration-slow: 300ms;
  --ease: cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Bruk i CSS

```css
.card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: calc(var(--space-unit) * 3);
  transition: box-shadow var(--duration) var(--ease),
              transform var(--duration) var(--ease);
}

.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}
```

### Bruk med Tailwind arbitrary values

Når Tailwind er satt opp men noen verdier ikke er i config:

```html
<div class="bg-[var(--color-bg-secondary)] rounded-[var(--radius-lg)]">
  <!-- Arbitrary values som fallback -->
</div>
```

---

## Shadcn/ui

Shadcn bruker CSS custom properties for theming. Mapper profil-tokens til Shadcn-konvensjonen.

### globals.css

Shadcn forventer spesifikke variabelnavn. Mapp profil-tokens til disse:

```css
@layer base {
  :root {
    /* Shadcn-konvensjonen bruker HSL uten hsl()-wrapping */
    /* Konverter hex → HSL for Shadcn-kompatibilitet */

    --background: 210 20% 98%;          /* colors.background.primary */
    --foreground: 222 47% 11%;          /* colors.text.primary */
    --card: 0 0% 100%;                  /* colors.background.secondary */
    --card-foreground: 222 47% 11%;     /* colors.text.primary */
    --primary: 239 84% 67%;             /* colors.accent.primary */
    --primary-foreground: 0 0% 100%;    /* colors.text.inverse */
    --secondary: 220 14% 96%;           /* colors.background.tertiary */
    --secondary-foreground: 222 47% 11%;
    --muted: 220 14% 96%;              /* colors.background.tertiary */
    --muted-foreground: 220 9% 46%;    /* colors.text.secondary */
    --accent: 220 14% 96%;
    --accent-foreground: 222 47% 11%;
    --destructive: 0 84% 60%;          /* colors.status.error */
    --destructive-foreground: 0 0% 100%;
    --border: 220 13% 91%;             /* colors.border.default */
    --input: 220 13% 91%;
    --ring: 239 84% 67%;               /* colors.accent.primary (focus ring) */
    --radius: 8px;                      /* borders.radius.medium */
  }
}
```

### Tips for Shadcn-integrasjon

1. **Hex til HSL**: Shadcn bruker HSL-verdier uten `hsl()` wrapper. Konverter profilens hex-verdier.
2. **--radius**: Sett til profilens `borders.radius.medium` — Shadcn bruker denne som base.
3. **Komponent-overrides**: Bruk `cn()` utility for å legge til profil-spesifikke klasser:

```tsx
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Soft SaaS: Standard shadcn button er OK
<Button>Klikk</Button>

// Brutalist: Override med profil-verdier
<Button className={cn(
  "rounded-none border-[3px] border-black",
  "font-mono font-bold uppercase",
  "hover:bg-white hover:text-black"
)}>
  KLIKK
</Button>

// Scandinavian: Override til caption-stil
<Button className={cn(
  "rounded-[2px]",
  "text-[0.8125rem] uppercase tracking-[0.08em] font-medium"
)}>
  Les mer
</Button>
```

---

## React Inline

For tilfeller der CSS custom properties ikke er tilgjengelig (f.eks. React Native Web).

```tsx
// design-tokens.ts
export const tokens = {
  colors: {
    bg: { primary: "#FAFBFC", secondary: "#FFFFFF" },
    text: { primary: "#111827", secondary: "#6B7280" },
    accent: { primary: "#6366F1", hover: "#4F46E5" },
  },
  radius: { sm: 6, md: 8, lg: 12 },
  shadows: {
    md: "0 4px 6px -1px rgba(0,0,0,0.1)",
  },
} as const;

// Bruk
<div style={{
  backgroundColor: tokens.colors.bg.secondary,
  borderRadius: tokens.radius.lg,
  boxShadow: tokens.shadows.md,
}}>
  <h2 style={{ color: tokens.colors.text.primary }}>Tittel</h2>
</div>
```

Denne tilnærmingen er SISTE UTVEI. Foretrekk alltid Tailwind eller CSS custom properties.

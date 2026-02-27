# Dark Mode Mapping

Hvordan konvertere en lys designprofil til dark mode. Denne guiden dekker
fargeinvertering, kontrastjustering og implementasjon.

---

## Prinsipp: Inverter, ikke bare snu

Dark mode er IKKE bare å bytte hvit og svart. Det handler om å bevare
profilens karakter og hierarki i en mørk kontekst.

### Hierarki-regelen

I light mode: Høyere = lysere bakgrunn
I dark mode: Høyere = mørkere bakgrunn (men lysere ENN base)

```
Light mode hierarki:
background.primary   = #FAFBFC  (lysest, bakgrunn)
background.secondary = #FFFFFF  (kort, modaler)
background.tertiary  = #F3F4F6  (hover, inset)

Dark mode hierarki:
background.primary   = #0F1117  (mørkest, bakgrunn)
background.secondary = #1A1D27  (kort, modaler — litt lysere)
background.tertiary  = #252833  (hover, inset — enda litt lysere)
```

---

## Konverteringsguide per profiltype

### Scandinavian Editorial

| Token | Light | Dark | Notat |
|---|---|---|---|
| bg.primary | `#FAF8F5` | `#1A1816` | Beholder varm undertone |
| bg.secondary | `#FFFFFF` | `#242220` | Fortsatt varm |
| bg.tertiary | `#F5F0EB` | `#2E2B28` | |
| text.primary | `#1A1714` | `#F5F0EB` | Invertert, men ikke ren hvit |
| text.secondary | `#6B6560` | `#A09890` | Litt lysere enn light-versjonen |
| text.muted | `#9A938E` | `#6B6560` | |
| accent.primary | `#C4703F` | `#D4844F` | Litt lysere for kontrast |
| accent.subtle | `#FEF4EC` | `#2A1F17` | Mørk versjon av aksent-tonen |
| border.default | `#E8E0D8` | `#3A3530` | |

**Mood bevart**: Fortsatt varm, rolig og sofistikert — bare i mørkt.

### Bold Brutalist

| Token | Light | Dark |  Notat |
|---|---|---|---|
| bg.primary | `#FFFFFF` | `#000000` | Ren svart |
| bg.secondary | `#FFFFFF` | `#0A0A0A` | Nesten svart |
| bg.tertiary | `#F0F0F0` | `#1A1A1A` | |
| text.primary | `#000000` | `#FFFFFF` | Ren hvit |
| text.secondary | `#666666` | `#999999` | |
| accent.primary | `#FF0000` | `#FF3333` | Litt lysere rød |
| border.default | `#000000` | `#FFFFFF` | Invertert 100% |

**Mood bevart**: Fortsatt hard, rå kontrast — bare invertert.

### Soft SaaS

| Token | Light | Dark | Notat |
|---|---|---|---|
| bg.primary | `#FAFBFC` | `#0B0F1A` | Mørk blåtone |
| bg.secondary | `#FFFFFF` | `#111827` | Standard mørk |
| bg.tertiary | `#F3F4F6` | `#1F2937` | |
| text.primary | `#111827` | `#F9FAFB` | |
| text.secondary | `#6B7280` | `#9CA3AF` | |
| accent.primary | `#6366F1` | `#818CF8` | Lysere indigo |
| accent.subtle | `#EEF2FF` | `#1E1B4B` | Mørk indigo |
| border.default | `#E5E7EB` | `#374151` | |
| shadow.small | `rgba(0,0,0,0.05)` | `rgba(0,0,0,0.3)` | Sterkere skygger |
| shadow.medium | `rgba(0,0,0,0.1)` | `rgba(0,0,0,0.4)` | |

**Mood bevart**: Fortsatt vennlig og polert — med mørk base.

---

## Implementasjon

### Med CSS Custom Properties

```css
:root {
  /* Light mode (default) */
  --color-bg-primary: #FAFBFC;
  --color-bg-secondary: #FFFFFF;
  --color-text-primary: #111827;
  --color-text-secondary: #6B7280;
  --color-accent: #6366F1;
  --color-accent-subtle: #EEF2FF;
  --color-border: #E5E7EB;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg-primary: #0B0F1A;
    --color-bg-secondary: #111827;
    --color-text-primary: #F9FAFB;
    --color-text-secondary: #9CA3AF;
    --color-accent: #818CF8;
    --color-accent-subtle: #1E1B4B;
    --color-border: #374151;
  }
}

/* Manuell toggle med class */
.dark {
  --color-bg-primary: #0B0F1A;
  --color-bg-secondary: #111827;
  /* ... */
}
```

### Med Tailwind dark mode

```typescript
// tailwind.config.ts
export default {
  darkMode: "class", // eller "media"
  theme: {
    extend: {
      colors: {
        background: {
          primary: "var(--color-bg-primary)",
          secondary: "var(--color-bg-secondary)",
        },
      },
    },
  },
};
```

### Med YAML-profil

Utvid profilen med en `dark`-seksjon:

```yaml
colors:
  # Light mode (standard)
  background:
    primary: "#FAFBFC"
    secondary: "#FFFFFF"
    tertiary: "#F3F4F6"

  # Dark mode override
  dark:
    background:
      primary: "#0B0F1A"
      secondary: "#111827"
      tertiary: "#1F2937"
    text:
      primary: "#F9FAFB"
      secondary: "#9CA3AF"
    accent:
      primary: "#818CF8"
      subtle: "#1E1B4B"
    border:
      default: "#374151"
```

---

## Dark mode-regler

### Skygger

Skygger er NESTEN usynlige i dark mode. Kompenser:

```css
/* Light */
--shadow-md: 0 4px 6px rgba(0,0,0,0.1);

/* Dark: Sterkere opacity ELLER bruk border i stedet */
--shadow-md: 0 4px 6px rgba(0,0,0,0.4);
```

Alternativt: Erstatt shadow med subtil border i dark mode:

```html
<div class="
  shadow-md dark:shadow-none
  dark:border dark:border-[--color-border]
">
```

### Bilder

Bilder kan føles "blendende" i dark mode:

```html
<img class="dark:brightness-90 dark:contrast-[1.05]" />
```

### Aksent-farger

Aksent-farger må ofte LYSNES i dark mode for å opprettholde kontrast:

```
Light:  #6366F1 (indigo-500) på hvit bakgrunn ✅ 4.5:1
Dark:   #6366F1 (indigo-500) på mørk bakgrunn ❌ 3.2:1
Fix:    #818CF8 (indigo-400) på mørk bakgrunn ✅ 5.8:1
```

### Status-farger

Samme prinsipp — lys opp status-farger:

```
Light success: #10B981 → Dark success: #34D399
Light error:   #EF4444 → Dark error:   #F87171
Light warning: #F59E0B → Dark warning: #FBBF24
```

### Tekst

ALDRI bruk ren `#FFFFFF` for tekst i dark mode — det er for skarpt.
Bruk en litt dempet hvit:

```
❌ #FFFFFF — for skarpt, anstrengende for øynene
✅ #F9FAFB — myk off-white (Soft SaaS)
✅ #F5F0EB — varm off-white (Scandinavian)
✅ #E5E5E5 — nøytral off-white (Brutalist kan bruke ren hvit)
```

---

## Toggle-implementasjon

### React hook

```tsx
function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("theme") === "dark" ||
      (!localStorage.getItem("theme") &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  return { isDark, toggle: () => setIsDark(!isDark) };
}
```

### Toggle-knapp per profil

```html
<!-- Scandinavian: Subtil, diskret -->
<button class="
  w-9 h-5 rounded-full
  bg-[--color-background-tertiary]
  relative
">
  <span class="
    w-4 h-4 rounded-full
    bg-[--color-accent-primary]
    absolute top-0.5
    transition-transform
    dark:translate-x-4
  "/>
</button>

<!-- Brutalist: Tydelig, bold -->
<button class="
  border-[3px] border-[--color-border-default]
  rounded-none
  px-4 py-2
  font-mono text-sm font-bold uppercase
">
  <span class="dark:hidden">☀ LYS</span>
  <span class="hidden dark:inline">● MØRK</span>
</button>

<!-- Soft SaaS: Icon toggle -->
<button class="
  w-10 h-10 rounded-[--radius-medium]
  bg-[--color-background-tertiary]
  flex items-center justify-center
  hover:bg-[--color-background-tertiary]
  transition-colors
">
  <!-- Sun / Moon icon swap -->
</button>
```

# Komponent-eksempler

Denne referansen viser hvordan identiske komponenter ser helt forskjellige ut
avhengig av hvilken designprofil som brukes. Les denne for å forstå hvordan
profil-tokens oversettes til faktisk kode.

## Table of Contents

1. [Button](#button)
2. [Card](#card)
3. [Hero Section](#hero-section)
4. [Navigation](#navigation)
5. [Input / Form Field](#input)
6. [Badge](#badge)
7. [Modal](#modal)
8. [Toast / Notification](#toast)

---

## Button

### Scandinavian Editorial

```html
<button class="
  bg-[--color-accent-primary]
  text-[--color-text-inverse]
  rounded-[--radius-small]
  px-8 py-3.5
  text-[0.8125rem] font-medium uppercase tracking-[0.08em]
  transition-colors duration-[--duration-default] ease-[--easing-default]
  hover:bg-[--color-accent-hover]
">
  Les mer
</button>
```

Nøkkelpunkter:
- Uppercase caption-stil (liten, spredt bokstavmellomrom)
- Minimal radius (`radius.small` = 2px)
- Ingen hover-transform — kun farge-endring
- Terrakotta bakgrunn

### Bold Brutalist

```html
<button class="
  bg-[--color-text-primary]
  text-[--color-text-inverse]
  rounded-none
  border-[3px] border-[--color-text-primary]
  px-8 py-4
  font-bold uppercase font-mono
  transition-all duration-[--duration-default] ease-linear
  hover:bg-[--color-background-primary]
  hover:text-[--color-text-primary]
">
  KLIKK HER
</button>
```

Nøkkelpunkter:
- Aldri border-radius — `rounded-none` alltid
- Tykk border (3px)
- Monospace font, bold, uppercase
- Hover INVERTERER fargene fullstendig
- Linear easing, snappy

### Soft SaaS

```html
<button class="
  bg-[--color-accent-primary]
  text-[--color-text-inverse]
  rounded-[--radius-medium]
  px-5 py-2.5
  font-semibold text-sm
  transition-all duration-[--duration-default] ease-[--easing-default]
  hover:bg-[--color-accent-hover]
  hover:-translate-y-px
  hover:shadow-[--shadow-small]
">
  Kom i gang
</button>
```

Nøkkelpunkter:
- Medium radius (8px) — vennlig, ikke lekent
- Semi-bold, ALDRI uppercase
- Subtle hover: translateY(-1px) + shadow
- Indigo aksent-farge

---

## Card

### Scandinavian Editorial

```html
<article class="
  bg-[--color-background-secondary]
  rounded-[--radius-small]
  p-8
  transition-colors duration-[--duration-default] ease-[--easing-default]
  hover:bg-[--color-background-tertiary]
">
  <span class="
    text-[0.8125rem] font-medium uppercase tracking-[0.08em]
    text-[--color-text-secondary]
  ">
    Kategori
  </span>
  <h3 class="
    font-heading text-[1.25rem] font-medium
    text-[--color-text-primary]
    mt-3 leading-[1.4]
  ">
    Kortets tittel
  </h3>
  <p class="
    font-body text-[--color-text-secondary]
    mt-2 leading-[1.7]
  ">
    Kort beskrivelse av innholdet.
  </p>
</article>
```

Nøkkelpunkter:
- Ingen border, ingen shadow — flat med bakgrunnsfarge
- Hover endrer bakgrunnsfarge (IKKE shadow)
- Generøs padding (32px)
- Caption-stil kategori med uppercase

### Bold Brutalist

```html
<article class="
  bg-[--color-background-primary]
  border-[3px] border-[--color-border-default]
  rounded-none
  p-6
  shadow-[--shadow-medium]
  transition-all duration-[--duration-default] ease-linear
  hover:shadow-[--shadow-large]
">
  <span class="
    text-[0.75rem] font-medium uppercase tracking-[0.1em]
    font-mono text-[--color-text-secondary]
  ">
    KATEGORI
  </span>
  <h3 class="
    font-heading text-[1.25rem] font-bold uppercase
    text-[--color-text-primary]
    mt-2 leading-[1.2]
  ">
    KORTETS TITTEL
  </h3>
  <p class="
    font-mono text-[--color-text-secondary]
    mt-2 leading-[1.5] text-sm
  ">
    Kort beskrivelse av innholdet.
  </p>
</article>
```

Nøkkelpunkter:
- Tykk svart border (3px), ALDRI avrundet
- Hard shadow (offset, ingen blur)
- Monospace body-tekst
- Alt uppercase

### Soft SaaS

```html
<article class="
  bg-[--color-background-secondary]
  border border-[--color-border-default]
  rounded-[--radius-large]
  p-6
  transition-all duration-[--duration-default] ease-[--easing-default]
  hover:shadow-[--shadow-medium]
  hover:-translate-y-px
">
  <span class="
    inline-block
    bg-[--color-accent-subtle] text-[--color-accent-primary]
    rounded-[--radius-pill]
    px-3 py-1 text-[0.875rem] font-medium
  ">
    Kategori
  </span>
  <h3 class="
    font-heading text-[1.125rem] font-semibold
    text-[--color-text-primary]
    mt-3 leading-[1.4]
  ">
    Kortets tittel
  </h3>
  <p class="
    font-body text-[--color-text-secondary]
    mt-2 leading-[1.6] text-sm
  ">
    Kort beskrivelse av innholdet.
  </p>
</article>
```

Nøkkelpunkter:
- Subtle border + avrundede hjørner (12px)
- Hover: shadow + lift (-1px)
- Pill-shaped kategori-badge
- Clean og ryddig

---

## Hero Section

### Scandinavian Editorial

```html
<section class="
  flex items-center justify-center
  min-h-screen
  bg-[--color-background-primary]
  px-6
" style="padding: 160px 0;">
  <div class="max-w-[--spacing-content-narrow] text-center">
    <p class="
      text-[0.8125rem] font-medium uppercase tracking-[0.08em]
      text-[--color-text-secondary]
      mb-6
    ">
      Undertittel
    </p>
    <h1 class="
      font-heading text-[4rem] font-normal
      text-[--color-text-primary]
      leading-[1.1] tracking-[-0.02em]
    ">
      En rolig, vakker overskrift
    </h1>
    <p class="
      font-body text-[1.0625rem] leading-[1.7]
      text-[--color-text-secondary]
      mt-8 max-w-lg mx-auto
    ">
      En kort, elegant beskrivelse som puster.
    </p>
    <button class="
      mt-12
      bg-[--color-accent-primary] text-[--color-text-inverse]
      rounded-[--radius-small]
      px-8 py-3.5
      text-[0.8125rem] font-medium uppercase tracking-[0.08em]
      hover:bg-[--color-accent-hover]
    ">
      Utforsk
    </button>
  </div>
</section>
```

Nøkkelpunkter:
- MAKS whitespace — 160px padding, full viewport-følelse
- Display-type overskrift, font-weight 400 (lett)
- Sentrert, smal innholdsbredde (720px)
- Mye luft mellom elementene

### Bold Brutalist

```html
<section class="
  bg-[--color-background-primary]
  border-b-[5px] border-[--color-border-default]
  px-6
" style="padding: 80px 0;">
  <div class="max-w-[--spacing-content-max-width]">
    <h1 class="
      font-heading text-[6rem] font-bold uppercase
      text-[--color-text-primary]
      leading-[0.95] tracking-[-0.03em]
    ">
      MASSIV<br/>
      OVERSKRIFT
    </h1>
    <p class="
      font-mono text-[1rem] leading-[1.5]
      text-[--color-text-secondary]
      mt-8 max-w-2xl
    ">
      En direkte beskrivelse. Ingen pynt.
    </p>
    <button class="
      mt-8
      bg-[--color-text-primary] text-[--color-text-inverse]
      border-[3px] border-[--color-text-primary]
      rounded-none
      px-8 py-4
      font-bold uppercase font-mono
      hover:bg-[--color-background-primary]
      hover:text-[--color-text-primary]
    ">
      GJØR NOE
    </button>
  </div>
</section>
```

Nøkkelpunkter:
- Venstrejustert, full bredde
- ENORM overskrift (6rem), bold, uppercase
- Tykk border-bottom som grafisk element
- Monospace body

### Soft SaaS

```html
<section class="
  relative overflow-hidden
  bg-gradient-to-b from-[--color-accent-subtle] to-transparent
  px-6
" style="padding: 100px 0;">
  <div class="max-w-[--spacing-content-narrow] mx-auto text-center">
    <span class="
      inline-block
      bg-[--color-background-secondary] text-[--color-accent-primary]
      rounded-[--radius-pill]
      border border-[--color-border-default]
      px-4 py-1.5 text-sm font-medium
      mb-6
    ">
      ✨ Nyhet
    </span>
    <h1 class="
      font-heading text-[3.5rem] font-bold
      text-[--color-text-primary]
      leading-[1.1] tracking-[-0.02em]
    ">
      Moderne og vennlig overskrift
    </h1>
    <p class="
      font-body text-[1rem] leading-[1.6]
      text-[--color-text-secondary]
      mt-6 max-w-lg mx-auto
    ">
      En klar beskrivelse som bygger tillit.
    </p>
    <div class="flex gap-3 justify-center mt-8">
      <button class="
        bg-[--color-accent-primary] text-[--color-text-inverse]
        rounded-[--radius-medium]
        px-5 py-2.5 font-semibold text-sm
        hover:bg-[--color-accent-hover] hover:-translate-y-px
      ">
        Kom i gang
      </button>
      <button class="
        bg-transparent text-[--color-text-secondary]
        rounded-[--radius-medium]
        px-5 py-2.5 font-medium text-sm
        hover:bg-[--color-background-tertiary]
      ">
        Lær mer →
      </button>
    </div>
  </div>
</section>
```

Nøkkelpunkter:
- Subtil gradient bakgrunn (accent.subtle → transparent)
- Pill-shaped badge øverst
- To knapper: primary + ghost
- Sentrert, avrundet, polert

---

## Navigation

### Scandinavian Editorial

```html
<nav class="
  bg-[--color-background-primary]
  border-b border-[--color-border-default]
  h-[72px]
  flex items-center justify-between
  px-8
">
  <a href="/" class="font-heading text-lg text-[--color-text-primary]">
    Merke
  </a>
  <div class="flex gap-8">
    <a href="#" class="
      text-[0.8125rem] font-medium uppercase tracking-[0.08em]
      text-[--color-text-secondary]
      hover:text-[--color-text-primary]
      transition-colors duration-[--duration-default]
    ">Prosjekter</a>
    <a href="#" class="
      text-[0.8125rem] font-medium uppercase tracking-[0.08em]
      text-[--color-text-secondary]
      hover:text-[--color-text-primary]
      transition-colors duration-[--duration-default]
    ">Om oss</a>
    <a href="#" class="
      text-[0.8125rem] font-medium uppercase tracking-[0.08em]
      text-[--color-text-secondary]
      hover:text-[--color-text-primary]
      transition-colors duration-[--duration-default]
    ">Kontakt</a>
  </div>
</nav>
```

### Bold Brutalist

```html
<nav class="
  bg-[--color-background-primary]
  border-b-[3px] border-[--color-border-default]
  h-[56px]
  flex items-center justify-between
  px-6
">
  <a href="/" class="font-heading text-xl font-bold uppercase text-[--color-text-primary]">
    MERKE
  </a>
  <div class="flex gap-4">
    <a href="#" class="
      font-mono text-[0.75rem] font-medium uppercase tracking-[0.1em]
      text-[--color-text-primary]
      border-b-[3px] border-transparent
      hover:border-[--color-accent-primary]
      transition-all duration-[--duration-fast] ease-linear
      pb-1
    ">PROSJEKTER</a>
    <a href="#" class="
      font-mono text-[0.75rem] font-medium uppercase tracking-[0.1em]
      text-[--color-text-primary]
      border-b-[3px] border-transparent
      hover:border-[--color-accent-primary]
      transition-all duration-[--duration-fast] ease-linear
      pb-1
    ">OM OSS</a>
    <a href="#" class="
      font-mono text-[0.75rem] font-medium uppercase tracking-[0.1em]
      text-[--color-text-primary]
      border-b-[3px] border-transparent
      hover:border-[--color-accent-primary]
      transition-all duration-[--duration-fast] ease-linear
      pb-1
    ">KONTAKT</a>
  </div>
</nav>
```

### Soft SaaS

```html
<nav class="
  bg-[--color-background-secondary]
  border-b border-[--color-border-default]
  h-[64px]
  flex items-center justify-between
  px-6
">
  <a href="/" class="font-heading text-lg font-semibold text-[--color-text-primary]">
    Merke
  </a>
  <div class="flex gap-1">
    <a href="#" class="
      text-sm font-medium
      text-[--color-accent-primary]
      bg-[--color-accent-subtle]
      rounded-[--radius-pill]
      px-3 py-1.5
    ">Prosjekter</a>
    <a href="#" class="
      text-sm font-medium
      text-[--color-text-secondary]
      rounded-[--radius-pill]
      px-3 py-1.5
      hover:bg-[--color-background-tertiary]
      transition-colors duration-[--duration-fast]
    ">Om oss</a>
    <a href="#" class="
      text-sm font-medium
      text-[--color-text-secondary]
      rounded-[--radius-pill]
      px-3 py-1.5
      hover:bg-[--color-background-tertiary]
      transition-colors duration-[--duration-fast]
    ">Kontakt</a>
  </div>
</nav>
```

---

## Input

### Scandinavian Editorial

```html
<div>
  <label class="
    block text-[0.8125rem] font-medium uppercase tracking-[0.08em]
    text-[--color-text-secondary]
    mb-2
  ">E-post</label>
  <input type="email" placeholder="din@epost.no" class="
    w-full
    bg-[--color-background-primary]
    border border-[--color-border-default]
    rounded-[--radius-small]
    px-4 py-3
    font-body text-[--color-text-primary]
    placeholder:text-[--color-text-muted]
    focus:border-[--color-accent-primary] focus:outline-none
    transition-colors duration-[--duration-default]
  "/>
</div>
```

### Bold Brutalist

```html
<div>
  <label class="
    block text-[0.75rem] font-bold uppercase tracking-[0.1em]
    font-mono text-[--color-text-primary]
    mb-2
  ">E-POST</label>
  <input type="email" placeholder="din@epost.no" class="
    w-full
    bg-[--color-background-primary]
    border-[3px] border-[--color-border-default]
    rounded-none
    px-4 py-3
    font-mono text-[--color-text-primary]
    placeholder:text-[--color-text-muted]
    focus:border-[--color-accent-primary] focus:outline-none
    transition-colors duration-[--duration-fast] ease-linear
  "/>
</div>
```

### Soft SaaS

```html
<div>
  <label class="
    block text-sm font-medium
    text-[--color-text-primary]
    mb-1.5
  ">E-post</label>
  <input type="email" placeholder="din@epost.no" class="
    w-full
    bg-[--color-background-secondary]
    border border-[--color-border-default]
    rounded-[--radius-medium]
    px-3.5 py-2.5
    text-sm text-[--color-text-primary]
    placeholder:text-[--color-text-muted]
    focus:border-[--color-accent-primary]
    focus:ring-2 focus:ring-[--color-accent-subtle]
    focus:outline-none
    transition-all duration-[--duration-fast]
  "/>
</div>
```

---

## Badge

### Scandinavian Editorial
```html
<span class="
  inline-block
  bg-[--color-accent-subtle] text-[--color-accent-primary]
  rounded-[--radius-small]
  px-2.5 py-1
  text-[0.8125rem] font-medium uppercase tracking-[0.08em]
">Ny</span>
```

### Bold Brutalist
```html
<span class="
  inline-block
  bg-[--color-text-primary] text-[--color-text-inverse]
  rounded-none
  border-[2px] border-[--color-text-primary]
  px-3 py-1
  text-[0.75rem] font-bold uppercase tracking-[0.1em] font-mono
">NY</span>
```

### Soft SaaS
```html
<span class="
  inline-block
  bg-[--color-accent-subtle] text-[--color-accent-primary]
  rounded-[--radius-pill]
  px-3 py-1
  text-[0.875rem] font-medium
">Ny</span>
```

---

## Modal

### Scandinavian Editorial
```html
<!-- Overlay -->
<div class="fixed inset-0 bg-[rgba(26,23,20,0.4)] z-50 flex items-center justify-center">
  <!-- Modal -->
  <div class="
    bg-[--color-background-primary]
    rounded-[--radius-medium]
    p-12
    max-w-[560px] w-full mx-4
    shadow-[--shadow-large]
  ">
    <h2 class="font-heading text-[1.75rem] font-normal text-[--color-text-primary]">
      Tittel
    </h2>
    <p class="font-body text-[--color-text-secondary] mt-4 leading-[1.7]">
      Modal-innhold her.
    </p>
    <div class="flex justify-end mt-8 gap-4">
      <button class="text-[0.8125rem] font-medium uppercase tracking-[0.08em] text-[--color-text-secondary]">
        Avbryt
      </button>
      <button class="bg-[--color-accent-primary] text-[--color-text-inverse] rounded-[--radius-small] px-6 py-3 text-[0.8125rem] font-medium uppercase tracking-[0.08em]">
        Bekreft
      </button>
    </div>
  </div>
</div>
```

### Bold Brutalist
```html
<div class="fixed inset-0 bg-[rgba(0,0,0,0.8)] z-50 flex items-center justify-center">
  <div class="
    bg-[--color-background-primary]
    border-[3px] border-[--color-border-default]
    rounded-none
    p-8
    max-w-lg w-full mx-4
    shadow-[--shadow-large]
  ">
    <h2 class="font-heading text-2xl font-bold uppercase text-[--color-text-primary]">
      TITTEL
    </h2>
    <p class="font-mono text-[--color-text-secondary] mt-4 leading-[1.5]">
      Modal-innhold her.
    </p>
    <div class="flex justify-end mt-6 gap-3">
      <button class="font-mono text-sm font-bold uppercase text-[--color-text-primary] border-[3px] border-[--color-border-default] px-6 py-3">
        AVBRYT
      </button>
      <button class="bg-[--color-text-primary] text-[--color-text-inverse] border-[3px] border-[--color-text-primary] px-6 py-3 font-mono font-bold uppercase">
        BEKREFT
      </button>
    </div>
  </div>
</div>
```

---

## Toast

### Scandinavian Editorial
```html
<div class="
  bg-[--color-background-primary]
  border border-[--color-border-default]
  rounded-[--radius-small]
  shadow-[--shadow-medium]
  px-5 py-4
  max-w-sm
">
  <p class="font-body text-sm text-[--color-text-primary]">
    Endringene er lagret.
  </p>
</div>
```

### Bold Brutalist
```html
<div class="
  bg-[--color-text-primary]
  border-[3px] border-[--color-accent-primary]
  rounded-none
  px-5 py-4
  max-w-sm
">
  <p class="font-mono text-sm text-[--color-text-inverse] font-bold uppercase">
    LAGRET.
  </p>
</div>
```

### Soft SaaS
```html
<div class="
  bg-[--color-background-secondary]
  border border-[--color-border-default]
  rounded-[--radius-large]
  shadow-[--shadow-large]
  px-4 py-3
  max-w-sm
  flex items-center gap-3
">
  <div class="w-5 h-5 rounded-full bg-[--color-status-success] flex items-center justify-center">
    <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
    </svg>
  </div>
  <p class="font-body text-sm text-[--color-text-primary]">
    Endringene er lagret.
  </p>
</div>
```

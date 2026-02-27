# Sidestruktur-mønstre

Denne referansen viser vanlige sidestrukturer og hvordan de tilpasses
designprofilen. Bruk disse som utgangspunkt for nye sider.

---

## Landing Page

### Standard seksjon-rekkefølge

```
1. Navigation
2. Hero (overskrift + CTA)
3. Social proof / Logo-bar
4. Features (3-4 kort eller venstre/høyre)
5. How it works (steg-for-steg)
6. Testimonials
7. Pricing
8. FAQ
9. Final CTA
10. Footer
```

### HTML-skjelett

```html
<div class="min-h-screen bg-[--color-background-primary]">

  <!-- Nav -->
  <nav class="h-16 border-b border-[--color-border-default] px-6 flex items-center justify-between">
    <!-- Se component-examples.md for nav per profil -->
  </nav>

  <!-- Hero -->
  <section class="py-[--spacing-section-padding] px-6">
    <div class="max-w-[--spacing-content-narrow] mx-auto text-center">
      <!-- Overskrift, beskrivelse, CTA -->
    </div>
  </section>

  <!-- Logo bar -->
  <section class="py-12 px-6 border-y border-[--color-border-default]">
    <div class="max-w-[--spacing-content-max-width] mx-auto">
      <p class="text-center text-sm text-[--color-text-muted] mb-8">
        Brukt av ledende selskaper
      </p>
      <div class="flex flex-wrap justify-center gap-8 items-center opacity-50">
        <!-- Logoer -->
      </div>
    </div>
  </section>

  <!-- Features -->
  <section class="py-[--spacing-section-padding] px-6">
    <div class="max-w-[--spacing-content-max-width] mx-auto">
      <h2 class="font-heading text-center ...">Features</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
        <!-- Feature-kort -->
      </div>
    </div>
  </section>

  <!-- Alternerende venstre/høyre seksjon -->
  <section class="py-[--spacing-section-padding] px-6">
    <div class="max-w-[--spacing-content-max-width] mx-auto">
      <div class="flex flex-col lg:flex-row items-center gap-16">
        <div class="flex-1"><!-- Tekst --></div>
        <div class="flex-1"><!-- Bilde --></div>
      </div>
    </div>
  </section>

  <!-- Testimonials -->
  <section class="py-[--spacing-section-padding] px-6 bg-[--color-background-secondary]">
    <div class="max-w-[--spacing-content-max-width] mx-auto">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Testimonial-kort -->
      </div>
    </div>
  </section>

  <!-- CTA -->
  <section class="py-[--spacing-section-padding] px-6">
    <div class="max-w-[--spacing-content-narrow] mx-auto text-center">
      <h2 class="font-heading ...">Klar til å starte?</h2>
      <button class="mt-8 ...">Kom i gang</button>
    </div>
  </section>

  <!-- Footer -->
  <footer class="border-t border-[--color-border-default] py-12 px-6">
    <!-- Se component-examples for footer per profil -->
  </footer>
</div>
```

---

## Dashboard

### Layout

```html
<div class="flex h-screen bg-[--color-background-primary]">
  <!-- Sidebar (fast bredde) -->
  <aside class="
    w-64 shrink-0 hidden lg:block
    bg-[--color-background-secondary]
    border-r border-[--color-border-default]
    p-4
  ">
    <nav class="space-y-1">
      <a class="
        flex items-center gap-3 px-3 py-2
        rounded-[--radius-medium]
        text-sm font-medium
        bg-[--color-accent-subtle] text-[--color-accent-primary]
      ">
        <!-- Aktiv nav-item -->
      </a>
      <a class="
        flex items-center gap-3 px-3 py-2
        rounded-[--radius-medium]
        text-sm font-medium
        text-[--color-text-secondary]
        hover:bg-[--color-background-tertiary]
      ">
        <!-- Inaktiv nav-item -->
      </a>
    </nav>
  </aside>

  <!-- Hovedinnhold -->
  <main class="flex-1 overflow-auto">
    <!-- Top bar -->
    <header class="
      h-16 border-b border-[--color-border-default]
      px-6 flex items-center justify-between
      bg-[--color-background-secondary]
    ">
      <h1 class="font-heading text-lg font-semibold">Dashboard</h1>
      <div class="flex items-center gap-4">
        <!-- Handlinger -->
      </div>
    </header>

    <!-- Innhold -->
    <div class="p-6">
      <!-- Stat-kort -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div class="
          bg-[--color-background-secondary]
          border border-[--color-border-default]
          rounded-[--radius-large]
          p-5
        ">
          <p class="text-sm text-[--color-text-secondary]">Total revenue</p>
          <p class="text-2xl font-heading font-bold mt-1">kr 45,231</p>
          <p class="text-sm text-[--color-status-success] mt-1">+20.1%</p>
        </div>
      </div>

      <!-- Tabell/liste -->
      <div class="
        bg-[--color-background-secondary]
        border border-[--color-border-default]
        rounded-[--radius-large]
        overflow-hidden
      ">
        <div class="px-5 py-4 border-b border-[--color-border-default]">
          <h2 class="font-heading font-semibold">Siste transaksjoner</h2>
        </div>
        <table class="w-full">
          <!-- Tabell-innhold -->
        </table>
      </div>
    </div>
  </main>
</div>
```

---

## Blog / Artikkel

### Layout

```html
<div class="min-h-screen bg-[--color-background-primary]">
  <nav><!-- Standard nav --></nav>

  <article class="py-[--spacing-section-padding] px-6">
    <div class="max-w-[--spacing-content-narrow] mx-auto">

      <!-- Meta -->
      <div class="mb-8">
        <span class="
          text-sm text-[--color-text-secondary]
          <!-- Scandinavian: uppercase tracking-wide -->
          <!-- Soft SaaS: pill badge -->
        ">Kategori</span>
        <time class="text-sm text-[--color-text-muted] ml-4">10. feb 2026</time>
      </div>

      <!-- Tittel -->
      <h1 class="
        font-heading
        text-3xl md:text-4xl lg:text-5xl
        font-bold
        text-[--color-text-primary]
        leading-tight
      ">
        Artikkeltittel
      </h1>

      <!-- Ingress -->
      <p class="
        font-body text-lg
        text-[--color-text-secondary]
        leading-relaxed
        mt-6
      ">
        Artikkelen handler om...
      </p>

      <!-- Hovedbilde -->
      <img class="
        w-full aspect-[16/9] object-cover
        rounded-[--radius-medium]
        mt-10
      " />

      <!-- Brødtekst -->
      <div class="
        mt-10
        font-body
        text-[--color-text-primary]
        leading-[1.8]
        space-y-6
        [&>h2]:font-heading [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:mt-12 [&>h2]:mb-4
        [&>h3]:font-heading [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:mt-8 [&>h3]:mb-3
        [&>blockquote]:border-l-4 [&>blockquote]:border-[--color-accent-primary]
        [&>blockquote]:pl-6 [&>blockquote]:italic [&>blockquote]:text-[--color-text-secondary]
        [&>pre]:bg-[--color-background-tertiary] [&>pre]:rounded-[--radius-medium]
        [&>pre]:p-4 [&>pre]:overflow-x-auto
        [&>a]:text-[--color-accent-primary] [&>a]:underline
      ">
        <!-- Markdown-rendret innhold -->
      </div>

    </div>
  </article>

  <footer><!-- Standard footer --></footer>
</div>
```

---

## Autentisering (Login/Register)

### Sentrert kort

```html
<div class="
  min-h-screen
  bg-[--color-background-primary]
  flex items-center justify-center
  px-4
">
  <div class="
    w-full max-w-sm
    bg-[--color-background-secondary]
    border border-[--color-border-default]
    rounded-[--radius-large]
    p-8
    <!-- Brutalist: rounded-none border-[3px] -->
  ">
    <!-- Logo -->
    <div class="text-center mb-8">
      <h1 class="font-heading text-xl font-bold">Logg inn</h1>
      <p class="text-sm text-[--color-text-secondary] mt-2">
        Velkommen tilbake
      </p>
    </div>

    <!-- Form -->
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium mb-1.5">E-post</label>
        <input type="email" class="w-full ..." />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1.5">Passord</label>
        <input type="password" class="w-full ..." />
      </div>
      <button class="w-full ...">Logg inn</button>
    </div>

    <!-- Divider -->
    <div class="flex items-center gap-4 my-6">
      <div class="flex-1 h-px bg-[--color-border-default]"></div>
      <span class="text-sm text-[--color-text-muted]">eller</span>
      <div class="flex-1 h-px bg-[--color-border-default]"></div>
    </div>

    <!-- OAuth -->
    <button class="
      w-full flex items-center justify-center gap-3
      bg-[--color-background-primary]
      border border-[--color-border-default]
      rounded-[--radius-medium]
      px-4 py-2.5
      text-sm font-medium
    ">
      <svg><!-- Google icon --></svg>
      Fortsett med Google
    </button>

    <!-- Footer-lenke -->
    <p class="text-center text-sm text-[--color-text-secondary] mt-6">
      Har du ikke konto?
      <a class="text-[--color-accent-primary] font-medium">Registrer deg</a>
    </p>
  </div>
</div>
```

---

## Pricing-seksjon

```html
<section class="py-[--spacing-section-padding] px-6">
  <div class="max-w-[--spacing-content-max-width] mx-auto text-center">
    <h2 class="font-heading text-3xl font-bold">Priser</h2>
    <p class="text-[--color-text-secondary] mt-4 max-w-lg mx-auto">
      Velg planen som passer for deg.
    </p>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
      <!-- Standard plan -->
      <div class="
        bg-[--color-background-secondary]
        border border-[--color-border-default]
        rounded-[--radius-large]
        p-8
        text-left
      ">
        <h3 class="font-heading font-semibold">Basis</h3>
        <p class="text-3xl font-bold mt-4">kr 99<span class="text-sm font-normal text-[--color-text-secondary]">/mnd</span></p>
        <ul class="mt-6 space-y-3 text-sm text-[--color-text-secondary]">
          <li class="flex items-center gap-2">
            <svg class="w-4 h-4 text-[--color-status-success]"><!-- Check --></svg>
            Feature 1
          </li>
        </ul>
        <button class="
          w-full mt-8
          bg-[--color-background-tertiary] text-[--color-text-primary]
          rounded-[--radius-medium]
          py-2.5 font-medium text-sm
        ">Velg plan</button>
      </div>

      <!-- Anbefalt plan (highlighted) -->
      <div class="
        bg-[--color-background-secondary]
        border-2 border-[--color-accent-primary]
        rounded-[--radius-large]
        p-8
        text-left
        relative
        <!-- Brutalist: border-[3px] rounded-none shadow-[4px_4px_0_#000] -->
      ">
        <span class="
          absolute -top-3 left-1/2 -translate-x-1/2
          bg-[--color-accent-primary] text-[--color-text-inverse]
          rounded-[--radius-pill]
          px-3 py-1 text-xs font-medium
        ">Anbefalt</span>
        <h3 class="font-heading font-semibold">Pro</h3>
        <p class="text-3xl font-bold mt-4">kr 249<span class="text-sm font-normal text-[--color-text-secondary]">/mnd</span></p>
        <!-- ... -->
        <button class="
          w-full mt-8
          bg-[--color-accent-primary] text-[--color-text-inverse]
          rounded-[--radius-medium]
          py-2.5 font-semibold text-sm
        ">Velg plan</button>
      </div>

      <!-- Enterprise -->
      <div class="
        bg-[--color-background-secondary]
        border border-[--color-border-default]
        rounded-[--radius-large]
        p-8
        text-left
      ">
        <h3 class="font-heading font-semibold">Enterprise</h3>
        <p class="text-3xl font-bold mt-4">Tilpasset</p>
        <!-- ... -->
        <button class="w-full mt-8 ...">Kontakt oss</button>
      </div>
    </div>
  </div>
</section>
```

---

## Felles mønstre

### Container

```html
<!-- Bruk denne wrapperen konsekvent -->
<div class="max-w-[--spacing-content-max-width] mx-auto px-4 sm:px-6 lg:px-8">
  <!-- Innhold -->
</div>

<!-- Smal variant for tekst-tunge sider -->
<div class="max-w-[--spacing-content-narrow] mx-auto px-4 sm:px-6">
  <!-- Innhold -->
</div>
```

### Seksjon-wrapper

```html
<!-- Konsistent seksjon-spacing -->
<section class="py-16 md:py-24 lg:py-[--spacing-section-padding] px-6">
  <div class="max-w-[--spacing-content-max-width] mx-auto">
    <!-- Seksjon-innhold -->
  </div>
</section>
```

### Seksjon med bakgrunnsfarge

```html
<!-- Alternér mellom primary og secondary bakgrunn -->
<section class="bg-[--color-background-primary] ...">
<section class="bg-[--color-background-secondary] ...">
<section class="bg-[--color-background-primary] ...">

<!-- Eller bruk accent-subtle for CTA-seksjoner -->
<section class="bg-[--color-accent-subtle] ...">
```

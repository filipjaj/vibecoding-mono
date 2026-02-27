#!/usr/bin/env node

/**
 * validate-profile.mjs
 *
 * Validerer en designprofil YAML-fil mot forventet schema.
 * Sjekker påkrevde felt, fargeformat, kontrast og konsistens.
 *
 * Bruk:
 *   node scripts/validate-profile.mjs path/to/profile.yaml
 *
 * Avhengigheter:
 *   npm install yaml
 */

import { readFileSync } from "fs";
import { parse } from "yaml";

// ──────────────────────────────────────────────
// Schema-definisjon
// ──────────────────────────────────────────────

const REQUIRED_SECTIONS = [
  "meta",
  "colors",
  "typography",
  "spacing",
  "borders",
  "shadows",
  "animation",
];

const REQUIRED_COLORS = {
  background: ["primary", "secondary", "tertiary"],
  text: ["primary", "secondary", "muted", "inverse"],
  accent: ["primary", "hover", "subtle"],
  border: ["default", "strong"],
  status: ["success", "warning", "error", "info"],
};

const REQUIRED_TYPOGRAPHY = {
  fonts: ["heading", "body"],
  scale: ["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl"],
  weights: [], // Minst noen bør finnes
  "line-heights": ["tight", "normal", "relaxed"],
};

const REQUIRED_SPACING = [
  "unit",
  "section-padding",
  "content-max-width",
  "content-narrow",
];

const REQUIRED_BORDERS = {
  radius: ["none", "small", "medium", "large"],
  width: ["thin", "medium"],
};

const REQUIRED_SHADOWS = ["none", "small", "medium", "large"];

const REQUIRED_ANIMATION = {
  duration: ["fast", "default", "slow"],
  easing: ["default"],
};

// ──────────────────────────────────────────────
// Utility
// ──────────────────────────────────────────────

const HEX_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;

function hexToRgb(hex) {
  const result = /^#([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})$/i.exec(hex);
  if (!result) return null;
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

function relativeLuminance({ r, g, b }) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(hex1, hex2) {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return null;
  const l1 = relativeLuminance(rgb1);
  const l2 = relativeLuminance(rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ──────────────────────────────────────────────
// Validator
// ──────────────────────────────────────────────

class ProfileValidator {
  constructor(profile) {
    this.profile = profile;
    this.errors = [];
    this.warnings = [];
  }

  error(msg) {
    this.errors.push(`❌ ${msg}`);
  }

  warn(msg) {
    this.warnings.push(`⚠️  ${msg}`);
  }

  info(msg) {
    this.warnings.push(`ℹ️  ${msg}`);
  }

  // --- Sjekk påkrevde seksjoner ---

  checkRequiredSections() {
    for (const section of REQUIRED_SECTIONS) {
      if (!this.profile[section]) {
        this.error(`Mangler påkrevd seksjon: '${section}'`);
      }
    }
  }

  // --- Sjekk meta ---

  checkMeta() {
    const meta = this.profile.meta;
    if (!meta) return;

    if (!meta.name) this.error("meta.name mangler");
    if (!meta.version) this.warn("meta.version mangler (anbefalt)");
    if (!meta.mood) this.warn("meta.mood mangler — dette hjelper Claude tolke stilen");
    if (!meta.description) this.warn("meta.description mangler");

    if (meta.mood && typeof meta.mood === "string" && meta.mood.length < 5) {
      this.warn("meta.mood er veldig kort — vær mer beskrivende");
    }
  }

  // --- Sjekk farger ---

  checkColors() {
    const colors = this.profile.colors;
    if (!colors) return;

    for (const [group, keys] of Object.entries(REQUIRED_COLORS)) {
      if (!colors[group]) {
        this.error(`Mangler fargegruppe: colors.${group}`);
        continue;
      }
      for (const key of keys) {
        if (!colors[group][key]) {
          this.error(`Mangler farge: colors.${group}.${key}`);
        } else if (!HEX_REGEX.test(colors[group][key])) {
          this.error(
            `Ugyldig hex-farge: colors.${group}.${key} = "${colors[group][key]}" (forventet #RRGGBB)`
          );
        }
      }
    }
  }

  // --- Sjekk kontrast ---

  checkContrast() {
    const colors = this.profile.colors;
    if (!colors?.text?.primary || !colors?.background?.primary) return;

    const pairs = [
      {
        fg: colors.text.primary,
        bg: colors.background.primary,
        label: "text.primary / bg.primary",
        minRatio: 4.5,
      },
      {
        fg: colors.text.secondary,
        bg: colors.background.primary,
        label: "text.secondary / bg.primary",
        minRatio: 4.5,
      },
      {
        fg: colors.text.inverse,
        bg: colors.accent?.primary,
        label: "text.inverse / accent.primary (knapper)",
        minRatio: 3.0, // Knapper er typisk "stor tekst" (bold)
      },
      {
        fg: colors.accent?.primary,
        bg: colors.background.primary,
        label: "accent.primary / bg.primary",
        minRatio: 3.0,
      },
    ];

    for (const { fg, bg, label, minRatio } of pairs) {
      if (!fg || !bg) continue;
      const ratio = contrastRatio(fg, bg);
      if (ratio === null) continue;

      if (ratio < minRatio) {
        this.error(
          `Dårlig kontrast: ${label} = ${ratio.toFixed(2)}:1 (minimum ${minRatio}:1)`
        );
      } else if (ratio < minRatio * 1.2) {
        this.warn(
          `Marginal kontrast: ${label} = ${ratio.toFixed(2)}:1 (minimum ${minRatio}:1)`
        );
      }
    }
  }

  // --- Sjekk typografi ---

  checkTypography() {
    const typo = this.profile.typography;
    if (!typo) return;

    if (!typo.fonts?.heading) this.error("Mangler typography.fonts.heading");
    if (!typo.fonts?.body) this.error("Mangler typography.fonts.body");

    if (!typo.scale) {
      this.error("Mangler typography.scale");
    } else {
      for (const key of REQUIRED_TYPOGRAPHY.scale) {
        if (!typo.scale[key]) {
          this.warn(`Mangler typography.scale.${key}`);
        }
      }
    }

    if (!typo.weights || Object.keys(typo.weights).length === 0) {
      this.warn("typography.weights er tom — definer minst 'regular' og 'bold'");
    }

    if (typo["line-heights"]) {
      for (const key of REQUIRED_TYPOGRAPHY["line-heights"]) {
        if (!typo["line-heights"][key]) {
          this.warn(`Mangler typography.line-heights.${key}`);
        }
      }
    } else {
      this.warn("Mangler typography.line-heights");
    }
  }

  // --- Sjekk spacing ---

  checkSpacing() {
    const spacing = this.profile.spacing;
    if (!spacing) return;

    for (const key of REQUIRED_SPACING) {
      if (!spacing[key]) {
        this.error(`Mangler spacing.${key}`);
      }
    }
  }

  // --- Sjekk borders ---

  checkBorders() {
    const borders = this.profile.borders;
    if (!borders) return;

    if (borders.radius) {
      for (const key of REQUIRED_BORDERS.radius) {
        if (borders.radius[key] === undefined) {
          this.error(`Mangler borders.radius.${key}`);
        }
      }
    } else {
      this.error("Mangler borders.radius");
    }

    if (borders.width) {
      for (const key of REQUIRED_BORDERS.width) {
        if (!borders.width[key]) {
          this.warn(`Mangler borders.width.${key}`);
        }
      }
    }
  }

  // --- Sjekk shadows ---

  checkShadows() {
    const shadows = this.profile.shadows;
    if (!shadows) return;

    for (const key of REQUIRED_SHADOWS) {
      if (shadows[key] === undefined) {
        this.warn(`Mangler shadows.${key}`);
      }
    }
  }

  // --- Sjekk animation ---

  checkAnimation() {
    const anim = this.profile.animation;
    if (!anim) return;

    if (anim.duration) {
      for (const key of REQUIRED_ANIMATION.duration) {
        if (!anim.duration[key]) {
          this.warn(`Mangler animation.duration.${key}`);
        }
      }
    } else {
      this.warn("Mangler animation.duration");
    }

    if (anim.easing) {
      if (!anim.easing.default) {
        this.warn("Mangler animation.easing.default");
      }
    } else {
      this.warn("Mangler animation.easing");
    }
  }

  // --- Sjekk component-guidelines ---

  checkComponentGuidelines() {
    const cg = this.profile["component-guidelines"];
    if (!cg) {
      this.warn(
        "Ingen component-guidelines funnet — dette er valgfritt men sterkt anbefalt"
      );
      return;
    }

    const recommended = [
      "buttons",
      "cards",
      "hero",
      "navigation",
      "inputs",
    ];

    for (const comp of recommended) {
      if (!cg[comp]) {
        this.info(`Mangler component-guidelines.${comp} (anbefalt)`);
      } else if (!cg[comp]["style-notes"]) {
        this.info(
          `component-guidelines.${comp} mangler style-notes — legg til for bedre resultater`
        );
      }
    }
  }

  // --- Konsistens-sjekker ---

  checkConsistency() {
    const borders = this.profile.borders;
    const anim = this.profile.animation;

    // Brutalist-sjekk: Hvis radius.none = 0 og radius.small = 0, er dette sannsynligvis brutalist
    if (
      borders?.radius?.none === "0" &&
      borders?.radius?.small === "0" &&
      borders?.radius?.medium === "0"
    ) {
      this.info("Alle radius er 0 — brutalist stil detektert");

      // Sjekk at shadow ikke har blur (brutalist bør ha hard shadow)
      const shadows = this.profile.shadows;
      if (shadows?.medium && !shadows.medium.includes("blur")) {
        // OK
      }
    }

    // Sjekk at easing matcher mood
    const mood = this.profile.meta?.mood?.toLowerCase() || "";
    if (
      mood.includes("rå") ||
      mood.includes("brutal") ||
      mood.includes("direkte")
    ) {
      if (anim?.easing?.default?.includes("cubic-bezier")) {
        this.info(
          "Mood er rå/brutal, men easing er cubic-bezier — vurder 'linear' for en mer rå følelse"
        );
      }
    }
  }

  // --- Kjør alle sjekker ---

  validate() {
    this.checkRequiredSections();
    this.checkMeta();
    this.checkColors();
    this.checkContrast();
    this.checkTypography();
    this.checkSpacing();
    this.checkBorders();
    this.checkShadows();
    this.checkAnimation();
    this.checkComponentGuidelines();
    this.checkConsistency();

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
    };
  }
}

// ──────────────────────────────────────────────
// CLI
// ──────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Bruk: node validate-profile.mjs <path-to-profile.yaml>");
    console.log("      node validate-profile.mjs --strict <path-to-profile.yaml>");
    process.exit(1);
  }

  const strict = args.includes("--strict");
  const filePath = args.filter((a) => !a.startsWith("--"))[0];

  let raw;
  try {
    raw = readFileSync(filePath, "utf-8");
  } catch (err) {
    console.error(`Kunne ikke lese fil: ${filePath}`);
    console.error(err.message);
    process.exit(1);
  }

  let profile;
  try {
    profile = parse(raw);
  } catch (err) {
    console.error(`Ugyldig YAML: ${err.message}`);
    process.exit(1);
  }

  const validator = new ProfileValidator(profile);
  const result = validator.validate();

  // Output
  const name = profile.meta?.name || filePath;
  console.log(`\n🎨 Validerer profil: ${name}\n`);
  console.log("─".repeat(50));

  if (result.errors.length > 0) {
    console.log(`\nFeil (${result.errors.length}):\n`);
    result.errors.forEach((e) => console.log(`  ${e}`));
  }

  if (result.warnings.length > 0) {
    console.log(`\nAdvarsler/Info (${result.warnings.length}):\n`);
    result.warnings.forEach((w) => console.log(`  ${w}`));
  }

  console.log("\n" + "─".repeat(50));

  if (result.valid) {
    console.log("\n✅ Profilen er gyldig!\n");
    if (result.warnings.length > 0) {
      console.log(`   ${result.warnings.length} advarsel(er) — vurder å fikse disse.\n`);
    }
    process.exit(strict && result.warnings.length > 0 ? 1 : 0);
  } else {
    console.log(`\n🚫 Profilen har ${result.errors.length} feil som må fikses.\n`);
    process.exit(1);
  }
}

main();

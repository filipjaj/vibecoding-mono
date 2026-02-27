#!/usr/bin/env node

/**
 * Konverterer en YAML-designprofil til:
 * 1. tailwind.config.ts (extend-blokk)
 * 2. styles/design-tokens.css (CSS custom properties)
 * 3. styles/fonts.css (Google Fonts imports)
 *
 * Bruk:
 *   node scripts/generate-tokens.mjs design-profiles/soft-saas.yaml --output src/styles
 *   node scripts/generate-tokens.mjs design-profiles/soft-saas.yaml --tailwind  # kun tailwind
 *   node scripts/generate-tokens.mjs design-profiles/soft-saas.yaml --css       # kun CSS
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { parse } from "yaml";
import { resolve, basename } from "path";

const args = process.argv.slice(2);
const profilePath = args[0];
const outputDir = args.find((a) => a.startsWith("--output="))?.split("=")[1] ?? args[args.indexOf("--output") + 1] ?? "src/styles";
const onlyTailwind = args.includes("--tailwind");
const onlyCss = args.includes("--css");

if (!profilePath) {
  console.error("Bruk: node generate-tokens.mjs <profil.yaml> [--output <mappe>] [--tailwind] [--css]");
  process.exit(1);
}

// --- Les og parse YAML ---
const raw = readFileSync(resolve(profilePath), "utf-8");
const profile = parse(raw);

if (!profile?.meta?.name) {
  console.error("Feil: Profilen mangler meta.name");
  process.exit(1);
}

console.log(`\n🎨 Genererer tokens fra "${profile.meta.name}"...\n`);

// --- Hjelpefunksjoner ---

function flattenColors(obj, prefix = "") {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}-${key}` : key;
    if (typeof value === "object" && value !== null) {
      Object.assign(result, flattenColors(value, path));
    } else {
      result[path] = value;
    }
  }
  return result;
}

function buildNestedTailwindColors(colors) {
  const result = {};
  for (const [group, values] of Object.entries(colors)) {
    if (typeof values === "object" && values !== null) {
      result[group] = {};
      for (const [key, value] of Object.entries(values)) {
        result[group][key] = value;
      }
    }
  }
  return result;
}

function toKebab(str) {
  return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

// --- Generer CSS Custom Properties ---

function generateCss(profile) {
  const lines = [];
  lines.push(`/* Autogenerert fra: ${basename(profilePath)} */`);
  lines.push(`/* Profil: ${profile.meta.name} */`);
  lines.push(`/* Mood: ${profile.meta.mood} */`);
  lines.push(``);
  lines.push(`:root {`);

  // Farger
  if (profile.colors) {
    lines.push(`  /* --- Farger --- */`);
    const flat = flattenColors(profile.colors);
    for (const [key, value] of Object.entries(flat)) {
      lines.push(`  --color-${key}: ${value};`);
    }
    lines.push(``);
  }

  // Typografi
  if (profile.typography?.fonts) {
    lines.push(`  /* --- Fonter --- */`);
    for (const [role, font] of Object.entries(profile.typography.fonts)) {
      if (font?.family) {
        lines.push(`  --font-${role}: '${font.family}', sans-serif;`);
      }
    }
    lines.push(``);
  }

  if (profile.typography?.scale) {
    lines.push(`  /* --- Typografisk skala --- */`);
    for (const [level, values] of Object.entries(profile.typography.scale)) {
      if (typeof values === "object") {
        for (const [prop, val] of Object.entries(values)) {
          if (val !== null && val !== undefined && val !== "") {
            lines.push(`  --text-${level}-${toKebab(prop)}: ${val};`);
          }
        }
      }
    }
    lines.push(``);
  }

  // Spacing
  if (profile.spacing) {
    lines.push(`  /* --- Spacing --- */`);
    for (const [key, value] of Object.entries(profile.spacing)) {
      lines.push(`  --spacing-${toKebab(key)}: ${value};`);
    }
    lines.push(``);
  }

  // Borders
  if (profile.borders?.radius) {
    lines.push(`  /* --- Border radius --- */`);
    for (const [key, value] of Object.entries(profile.borders.radius)) {
      lines.push(`  --radius-${key}: ${value};`);
    }
    lines.push(``);
  }

  // Shadows
  if (profile.shadows) {
    lines.push(`  /* --- Shadows --- */`);
    for (const [key, value] of Object.entries(profile.shadows)) {
      if (key !== "style-notes") {
        lines.push(`  --shadow-${key}: ${value};`);
      }
    }
    lines.push(``);
  }

  // Animasjon
  if (profile.animation) {
    lines.push(`  /* --- Animasjon --- */`);
    if (profile.animation.duration) {
      for (const [key, value] of Object.entries(profile.animation.duration)) {
        lines.push(`  --duration-${key}: ${value};`);
      }
    }
    if (profile.animation.easing) {
      for (const [key, value] of Object.entries(profile.animation.easing)) {
        lines.push(`  --easing-${key}: ${value};`);
      }
    }
    lines.push(``);
  }

  lines.push(`}`);
  return lines.join("\n");
}

// --- Generer Tailwind Config extend-blokk ---

function generateTailwindExtend(profile) {
  const extend = {};

  // Farger
  if (profile.colors) {
    extend.colors = buildNestedTailwindColors(profile.colors);
  }

  // Fonter
  if (profile.typography?.fonts) {
    extend.fontFamily = {};
    for (const [role, font] of Object.entries(profile.typography.fonts)) {
      if (font?.family) {
        extend.fontFamily[role] = [`'${font.family}'`, "sans-serif"];
      }
    }
  }

  // Border radius
  if (profile.borders?.radius) {
    extend.borderRadius = {};
    for (const [key, value] of Object.entries(profile.borders.radius)) {
      extend.borderRadius[key] = value;
    }
  }

  // Shadows
  if (profile.shadows) {
    extend.boxShadow = {};
    for (const [key, value] of Object.entries(profile.shadows)) {
      if (key !== "style-notes") {
        extend.boxShadow[key] = value;
      }
    }
  }

  // Spacing (max-width)
  if (profile.spacing) {
    extend.maxWidth = {};
    if (profile.spacing["content-max-width"]) {
      extend.maxWidth.content = profile.spacing["content-max-width"];
    }
    if (profile.spacing["content-narrow"]) {
      extend.maxWidth["content-narrow"] = profile.spacing["content-narrow"];
    }
  }

  // Animasjon
  if (profile.animation) {
    if (profile.animation.duration) {
      extend.transitionDuration = {};
      for (const [key, value] of Object.entries(profile.animation.duration)) {
        extend.transitionDuration[key] = value;
      }
    }
    if (profile.animation.easing) {
      extend.transitionTimingFunction = {};
      for (const [key, value] of Object.entries(profile.animation.easing)) {
        extend.transitionTimingFunction[key] = value;
      }
    }
  }

  const lines = [];
  lines.push(`// Autogenerert fra: ${basename(profilePath)}`);
  lines.push(`// Profil: ${profile.meta.name}`);
  lines.push(`// Mood: ${profile.meta.mood}`);
  lines.push(`//`);
  lines.push(`// Lim dette inn i tailwind.config.ts under theme.extend`);
  lines.push(`// eller importer som en egen fil.`);
  lines.push(``);
  lines.push(`export const designTokens = ${JSON.stringify(extend, null, 2)} as const;`);
  lines.push(``);
  lines.push(`// Bruk i tailwind.config.ts:`);
  lines.push(`// import { designTokens } from './src/styles/design-tokens'`);
  lines.push(`// export default { theme: { extend: designTokens } }`);

  return lines.join("\n");
}

// --- Generer font-imports ---

function generateFontImports(profile) {
  const lines = [];
  lines.push(`/* Autogenerert font-imports fra: ${basename(profilePath)} */`);
  lines.push(``);

  if (profile.typography?.fonts) {
    for (const [role, font] of Object.entries(profile.typography.fonts)) {
      if (font?.import) {
        lines.push(`/* ${role} */`);
        lines.push(`@import url('${font.import}');`);
        lines.push(``);
      }
    }
  }

  return lines.join("\n");
}

// --- Skriv filer ---

mkdirSync(resolve(outputDir), { recursive: true });

if (!onlyTailwind) {
  const cssPath = resolve(outputDir, "design-tokens.css");
  writeFileSync(cssPath, generateCss(profile));
  console.log(`  ✅ CSS custom properties → ${cssPath}`);

  const fontsPath = resolve(outputDir, "fonts.css");
  writeFileSync(fontsPath, generateFontImports(profile));
  console.log(`  ✅ Font imports → ${fontsPath}`);
}

if (!onlyCss) {
  const twPath = resolve(outputDir, "design-tokens.ts");
  writeFileSync(twPath, generateTailwindExtend(profile));
  console.log(`  ✅ Tailwind extend → ${twPath}`);
}

// --- Vis style-notes oppsummering ---

console.log(`\n📋 Style-notes fra profilen:\n`);

const notesSources = [
  ["Borders", profile.borders?.["style-notes"]],
  ["Shadows", profile.shadows?.["style-notes"]],
  ["Animation", profile.animation?.["style-notes"]],
];

if (profile["component-guidelines"]) {
  for (const [comp, val] of Object.entries(profile["component-guidelines"])) {
    if (val?.["style-notes"]) {
      notesSources.push([`Component: ${comp}`, val["style-notes"]]);
    }
  }
}

for (const [source, note] of notesSources) {
  if (note) {
    console.log(`  ${source}: "${note}"`);
  }
}

console.log(`\n✨ Ferdig!\n`);

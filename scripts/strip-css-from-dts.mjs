#!/usr/bin/env node
/**
 * Removes side-effect CSS imports (e.g. `import "./styles.css";`) from
 * emitted .d.ts files under dist/.
 *
 * Why: tsc faithfully copies these imports into declaration output. The CSS
 * file itself is bundled and renamed (styles.css → index.css) at vite build
 * time, so the source path no longer exists at the emitted location. Strict
 * consumers (skipLibCheck: false) then fail to resolve the import.
 *
 * Runtime CSS loading is handled by the JS bundle's side-effect imports —
 * the .d.ts copy is purely cosmetic and safe to strip.
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { glob } from "node:fs/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, "..", "dist");

// Match bare side-effect imports of CSS/SCSS/Sass/Less, with single or
// double quotes, optional trailing semicolon, on their own line.
const CSS_IMPORT_RE = /^\s*import\s+["'][^"']+\.(?:css|scss|sass|less)["'];?\s*\r?\n/gm;

let touched = 0;

for await (const entry of glob("**/*.d.ts", { cwd: distDir })) {
  const file = resolve(distDir, entry);
  const before = await readFile(file, "utf8");
  const after = before.replace(CSS_IMPORT_RE, "");
  if (after !== before) {
    await writeFile(file, after, "utf8");
    touched++;
  }
}

console.log(`strip-css-from-dts: cleaned ${touched} file(s).`);

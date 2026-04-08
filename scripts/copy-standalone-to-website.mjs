/**
 * Copy standalone build artifacts to the website's static directory
 * so Docusaurus can serve them.
 */
import { cpSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const src = resolve(root, "dist-standalone");
const dest = resolve(root, "website", "static", "standalone");

if (!existsSync(src)) {
  console.error("dist-standalone/ does not exist. Run `npm run build:standalone` first.");
  process.exit(1);
}

mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });
console.log(`Copied standalone assets to ${dest}`);

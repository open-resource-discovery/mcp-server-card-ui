import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";
import {
  copyFileSync,
  mkdirSync,
  existsSync,
  readFileSync,
  writeFileSync,
} from "fs";

/**
 * Strip all @layer wrappers from CSS output and scope loose selectors to .mcp-root.
 *
 * This is needed because the standalone bundle is embedded in host pages
 * (e.g. Docusaurus) where Infima's un-layered global styles would always
 * beat our layered Tailwind utilities. By removing @layer wrappers,
 * all rules compete on specificity alone, and .mcp-root scoping wins.
 *
 * Additional transforms:
 * - Scope zero-specificity :where() utility selectors (e.g. space-y-*) to .mcp-root
 * - Scope the @supports properties block's * selector to .mcp-root
 */
function stripCssLayers(css: string): string {
  // Match @layer <name> { ... } — need to handle nested braces
  let result = css;
  const layerRegex = /@layer\s+[\w-]+\s*\{/g;
  let match: RegExpExecArray | null;
  // Process from last match to first to preserve indices
  const matches: { start: number; end: number }[] = [];

  while ((match = layerRegex.exec(result)) !== null) {
    const start = match.index;
    let depth = 0;
    let i = start + match[0].length - 1; // position of opening brace
    for (; i < result.length; i++) {
      if (result[i] === "{") depth++;
      else if (result[i] === "}") {
        depth--;
        if (depth === 0) break;
      }
    }
    matches.push({ start, end: i });
  }

  // Process in reverse order to preserve indices
  for (let j = matches.length - 1; j >= 0; j--) {
    const { start, end } = matches[j];
    const layerHeader = result.slice(start, result.indexOf("{", start) + 1);
    // Remove the @layer header and closing brace, keep inner content
    result =
      result.slice(0, start) +
      result.slice(start + layerHeader.length, end) +
      result.slice(end + 1);
  }

  // Remove bare @layer order declarations like "@layer components;"
  result = result.replace(/@layer\s+[\w,\s-]+;/g, "");

  // Scope zero-specificity :where() selectors to .mcp-root
  // e.g. :where(.space-y-2>:not(:last-child)){...} → .mcp-root :where(.space-y-2>:not(:last-child)){...}
  // Match :where(...){  at start of a rule (not already preceded by .mcp-root)
  result = result.replace(/(?<![.\w])(:where\(\.[a-zA-Z])/g, ".mcp-root $1");

  // Scope the @supports properties block: *, ::before, ::after, ::backdrop → .mcp-root scoped
  // The minified format is: @supports (...){*,:before,:after,::backdrop{--tw-...}}
  // Match the selector list "*,:before,:after,::backdrop{" right after @supports(...)
  result = result.replace(
    /(\{)\*\s*,\s*:before\s*,\s*:after\s*,\s*::backdrop\s*\{/g,
    "$1.mcp-root *,.mcp-root :before,.mcp-root :after,.mcp-root ::backdrop{",
  );

  return result;
}

/**
 * Vite config for standalone bundle (IIFE format with React bundled).
 * Used for CDN distribution and script tag usage.
 */
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      // Tell rolldown that @base-ui/utils/store/createSelectorMemoized.js
      // has side effects. Without this, rolldown's tree-shaker sees the
      // top-level `createSelectorCreator({...})` call as pure (because
      // reselect's package.json has `sideEffects: false`), drops the
      // reselect imports, but keeps the IIFE wrapper that references
      // them — producing `ReferenceError: createSelectorCreator is not
      // defined` at runtime. Marking the module as having side effects
      // forces rolldown to either include reselect's bindings or drop the
      // wrapper entirely.
      //
      // We use a resolveId hook with `moduleSideEffects: true` rather
      // than the rollupOptions.treeshake option because the latter only
      // accepts a boolean in rolldown 8.x.
      name: "mark-base-ui-store-side-effects",
      enforce: "pre",
      async resolveId(source, importer, options) {
        if (!source.includes("createSelectorMemoized")) return null;
        const resolved = await this.resolve(source, importer, options);
        if (!resolved || resolved.external) return resolved;
        if (!resolved.id.includes("@base-ui/utils")) return resolved;
        return { ...resolved, moduleSideEffects: true };
      },
    },
    {
      name: "copy-standalone-files",
      closeBundle() {
        // Ensure dist-standalone exists
        const outDir = resolve(__dirname, "dist-standalone");
        if (!existsSync(outDir)) {
          mkdirSync(outDir, { recursive: true });
        }

        // Strip @layer wrappers from CSS so the standalone bundle's rules
        // are un-layered and compete on specificity with host page styles
        const cssPath = resolve(outDir, "mcp-server-card-ui.css");
        if (existsSync(cssPath)) {
          const css = readFileSync(cssPath, "utf-8");
          writeFileSync(cssPath, stripCssLayers(css));
          console.log("Stripped @layer wrappers from mcp-server-card-ui.css");
        }

        // Copy static files from standalone/ to dist-standalone/
        const standaloneDir = resolve(__dirname, "standalone");
        const filesToCopy = ["index.html", "mcp-initializer.js", "index.cjs"];

        for (const file of filesToCopy) {
          const src = resolve(standaloneDir, file);
          const dest = resolve(outDir, file);
          if (existsSync(src)) {
            copyFileSync(src, dest);
            console.log(`Copied ${file} to dist-standalone/`);
          }
        }

        // Copy OAuth callback page directory
        const oauthSrcDir = resolve(standaloneDir, "oauth/callback");
        const oauthDestDir = resolve(outDir, "oauth/callback");
        const oauthFile = resolve(oauthSrcDir, "index.html");
        if (existsSync(oauthFile)) {
          if (!existsSync(oauthDestDir)) {
            mkdirSync(oauthDestDir, { recursive: true });
          }
          copyFileSync(oauthFile, resolve(oauthDestDir, "index.html"));
          console.log("Copied oauth/callback/index.html to dist-standalone/");
        }

        // Copy public files to dist-standalone/
        const publicFiles = ["predefined-servers.json", "favicon.svg"];
        for (const file of publicFiles) {
          const src = resolve(__dirname, "public", file);
          if (existsSync(src)) {
            copyFileSync(src, resolve(outDir, file));
            console.log(`Copied ${file} to dist-standalone/`);
          }
        }
      },
    },
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@lib": resolve(__dirname, "./src/lib"),
    },
    dedupe: ["react", "react-dom", "react-resizable-panels"],
  },
  define: {
    // Replace version placeholder with actual version
    __VERSION__: JSON.stringify(
      process.env.npm_package_version || "0.0.0-standalone",
    ),
    // Define process.env for browser compatibility
    "process.env.NODE_ENV": JSON.stringify("production"),
    "process.env": JSON.stringify({}),
  },
  publicDir: false,
  build: {
    lib: {
      entry: resolve(__dirname, "src/lib/standalone.ts"),
      name: "MCPPlayground",
      formats: ["iife"],
      fileName: () => "mcp-server-card-ui.js",
    },
    rollupOptions: {
      // Bundle everything including React (no external deps)
      external: [],
      output: {
        // Put CSS in same directory
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith(".css")) {
            return "mcp-server-card-ui.css";
          }
          return "[name][extname]";
        },
      },
    },
    outDir: "dist-standalone",
    cssCodeSplit: false,
    // Optimize for size
    minify: true,
    sourcemap: true,
  },
});

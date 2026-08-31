# CHANGELOG

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) rules.

## [unreleased]

### Changed

- Upgraded `@open-resource-discovery/ui-components` to `0.1.6`.
- Removed local highlight.js CSS token overrides (`--hljs-*` variables and
  `.mcp-root .hljs-*` rules) — syntax highlighting is now bundled and managed
  inside `ui-components`.

### Fixed

- Prevent malformed ORD configuration, document, MCP resource, and persisted
  server data from crashing the playground. Invalid entries are skipped with
  detailed inline errors, and malformed optional fields on an otherwise valid
  server are sanitized (dropped) rather than discarding the whole server — so
  valid resources from partial discoveries, including persisted custom servers,
  remain usable.
- Resolve ORD document and MCP entry-point references using redirect-aware ORD
  base and document-relative URL rules, and avoid treating a failed ORD endpoint
  as a direct MCP server.
- Reject discovered MCP entry points whose resolved URL uses an unsupported
  scheme — only `http:`, `https:`, and the playground's internal `mock:` scheme
  are accepted — so a malformed ORD document cannot inject a non-connectable
  server URL.
- Continue adding the remaining servers when an ORD discovery batch contains
  duplicate or already-known IDs instead of aborting on the first collision. The
  batch completes cleanly as a no-op when every discovered server already exists,
  and otherwise auto-connects to the first newly added server.
- Keep connection URL input separate from the active session so discovery and
  server switching cannot send session credentials or teardown requests to the
  newly entered URL.

## [[0.2.1](https://github.com/open-resource-discovery/mcp-server-card-ui/releases/tag/v0.2.1)] - 2026-06-25

### Changed

- Replace `vite-plugin-dts` with `tsc` + `tsc-alias` for declaration emission. The plugin emitted only top-level entry `.d.ts` files, which broke consumer type resolution for re-exported subpaths. The new pipeline emits the full declaration tree (97 `.d.ts` files) and rewrites `@lib/*` / `@/*` path aliases to relative imports so types resolve in installed consumers.
- Strip side-effect CSS imports (`import "./styles.css"`) from emitted `.d.ts` via `scripts/strip-css-from-dts.mjs` — the CSS file is renamed to `index.css` at vite build time, so the original path no longer exists and tripped strict (`skipLibCheck: false`) consumers.
- Extend `package.json#files` whitelist with `dist/{components,hooks,mock,stores,types,utils}/**/*.d.ts` so the supporting declaration files actually ship in the npm tarball.
- Migrate all UI components (`Button`, `Badge`, `Card`, `Collapsible`, `Input`, `Select`, `Tabs`, `Switch`, `Separator`, `CodeBlock`, `MarkdownText`, `PasswordInput`) to re-export from `@open-resource-discovery/ui-components`, removing local shadcn-based implementations.
- Replace `InfoCard`-based server overview layout with components from `@open-resource-discovery/ui-components`: `InfoCard`, `SectionCard`, `CollapsibleSection`.
- Refactor `ToolCard`, `PromptCard`, `ResourceCard`, and all overview sections (`CapabilitiesSection`, `RemotesSection`, `ToolsSection`, `PromptsSection`, `ResourcesSection`, `AuthenticationSection`, `ExtensionsSection`, `ClientRequirementsSection`) to use library components.
- Align CSS layer setup (`@layer theme, base, components`) and Tailwind import style with `@open-resource-discovery/ui-components` conventions.
- Strip `@layer` wrappers from the standalone IIFE bundle so Tailwind utilities take precedence over unlayered host-page styles (e.g. Docusaurus Infima).
- Switch `MCPConnectionSettings` transport/auth selects from shadcn `Select` to `Select.Root` compound API from the library.
- Fix `Select.Value` in `FunctionInput` to display tool/prompt `title` instead of raw `name` when the two differ.

### Fixed

- Standalone bundle: mark `@base-ui/utils/store/createSelectorMemoized.js` as a module with side effects during the standalone IIFE build. Reselect's `package.json` declares `sideEffects: false`, which led rolldown (vite 8) to consider the top-level `createSelectorCreator({ memoize: lruMemoize, ... })` call inside that module as pure. It dropped the `reselect` import bindings but kept the call expression — producing `ReferenceError: createSelectorCreator is not defined` at runtime when the bundle loaded inside Docusaurus. A `resolveId` hook now returns `moduleSideEffects: true` for that module, so rolldown keeps the reselect bindings alongside the call site.
- Publish full declaration tree so consumers can resolve types from the npm tarball — previously only the 5 entry-point `.d.ts` files shipped and any subpath import (or even the main entry's re-exports from `./components/...`, `./stores/...`, etc.) failed with `TS2307: Cannot find module`.

- E2E tests: update `data-state="active"` assertions to `data-active=""` to match Base UI's tab attribute convention.
- E2E fixture: correct `isDocusaurus` port detection from `"3000"` to `"3003"`.

## [[0.1.0](https://github.com/open-resource-discovery/mcp-server-card-ui/releases/tag/v0.1.0)] - 2026-05-28

### Added

- Standalone IIFE bundle for CDN / script-tag embedding with CSS layer stripping
- OAuth2 client-credentials and authorization-code (PKCE) authentication flows
- Auto-authentication retry on 401/403 using environment-configured strategies
- Predefined server selector with ORD-based discovery support
- Markdown rendering for prompt results and tool descriptions
- Extensions section in server overview (links rendered as clickable URLs)
- Raw HTTP log viewer for inspecting MCP JSON-RPC traffic
- Playground environment configuration via `VITE_*` env variables
- Prompt execution support alongside tool calls in functions panel

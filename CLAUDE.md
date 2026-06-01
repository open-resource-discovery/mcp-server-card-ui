# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React component library for editing, viewing, testing, and validating [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server cards. Provides a multi-mode playground (full, lite, viewer, editor, card-view) distributed as both an npm library and a standalone CDN bundle.

The sister project is `@open-resource-discovery/a2a-editor` (at `../a2a-editor`), which has an identical build structure but handles A2A agent cards instead of MCP server cards.

## Commands

```bash
# Development
npm run dev              # Vite dev server at localhost:5173
npm run website:start    # Docusaurus docs site at localhost:3000

# Building
npm run build            # Full build: lib + standalone
npm run build:lib        # ES module library only (dist/)
npm run build:standalone # IIFE CDN bundle only (dist-standalone/)

# Testing
npm test                 # Vitest unit tests (run once)
npm run test:watch       # Vitest in watch mode
npm run test:e2e         # Playwright e2e (requires servers on :5173 and :3000)

# Code quality
npm run lint             # ESLint check
npm run format           # Prettier + ESLint auto-fix
npm run format:check     # Check formatting without writing
```

### Running a single unit test

```bash
npx vitest run src/lib/stores/__tests__/mcpConnectionStore.test.ts
```

### Running a single e2e test

```bash
npx playwright test e2e/tests/connection.spec.ts --project=vite
```

## Architecture

### Build modes

| Command | Output | Format | Use case |
|---|---|---|---|
| `build:lib` | `dist/` | ES modules, multiple entry points | npm consumers |
| `build:standalone` | `dist-standalone/` | IIFE, React bundled | CDN / script tag |
| `website:build` | `website/build/` | Static | Docusaurus docs |

The lib build exports five separate entry points for tree-shaking: `index`, `playground-lite`, `viewer`, `editor`, `card-view`. The standalone build bundles everything into a single `mcp-server-card-ui.js` that exposes `window.MCPPlayground`.

**Standalone CSS special handling:** `vite.standalone.config.ts` has a `stripCssLayers()` plugin that removes `@layer` wrappers and scopes all selectors to `.mcp-root`. This is needed because the bundle is embedded inside Docusaurus pages.

### State management

Seven Zustand stores in `src/lib/stores/`:

- **`serverCardStore`** — raw JSON input, parsed `MCPServerCardDefinition`, dirty state
- **`mcpConnectionStore`** — URL, transport type, protocol version, auth credentials, connection status, session ID; handles connect/disconnect and auto-retry on 401/403
- **`validationStore`** — async validation results, Monaco editor markers
- **`uiStore`** — active tab, panel open/close state, mobile view
- **`functionsStore`** — tool/prompt call history and execution results
- **`mcpLogStore`** — raw HTTP request/response log
- **`editorSettingsStore`** — Monaco/textarea preference
- **`predefinedServersStore`** — server presets

### Component layouts

`src/lib/components/layouts/` assembles panels per mode:

- `MCPPlaygroundLayout` — main coordinator with desktop (SplitPane) vs mobile (bottom sheet) branching
- `EditorLayout`, `ViewerLayout`, `CardViewLayout` — mode-specific panel arrangements
- `MCPRightPanel` — unified right panel that switches between overview / functions / validation / raw HTTP tabs

The outer `ThemeRoot` component provides the `.mcp-root` CSS scope needed for standalone isolation.

### MCP transport

`src/lib/utils/mcp-transport.ts` handles MCP JSON-RPC communication:
- `sendRequest()` — POST JSON-RPC, handles both JSON and SSE response detection
- Supports streamable-http and SSE transports
- Mock transport available for in-browser demos without a real server

`src/lib/utils/mcp-jsonrpc.ts` builds/parses JSON-RPC envelopes. Connection flow lives in `mcpConnectionStore.connect()`, which calls `buildServerCardFromConnection()` to fetch tools/resources/prompts from a live server.

### MCP protocol versions

`src/lib/types/mcp-protocol.ts` defines `MCPServerCardDefinition` and related types. Supported protocol versions: `2024-11-05`, `2025-03-26`, `2025-06-18`, `2025-11-25`.

### Authentication

`src/lib/utils/connection-auth.ts` computes request headers from stored credentials. Supports basic, bearer, and OAuth2. OAuth2 PKCE flow is in `src/lib/utils/pkce.ts` — it uses `sessionStorage` for the code verifier across the redirect cycle.

### Standalone entry

`src/lib/standalone.ts` mounts React into a host element and exposes an imperative API on `window.MCPPlayground`:

```ts
MCPPlayground.init(options): MCPPlaygroundInstance
MCPPlayground.cardView(options): MCPComponentInstance
MCPPlayground.viewer(options): MCPComponentInstance
MCPPlayground.editor(options): MCPComponentInstance
```

## Testing

### Unit tests

Located in `src/lib/stores/__tests__/`. Run with Vitest (jsdom environment).

### E2E tests

`e2e/tests/` — Playwright targeting two servers:
- `vite` project → `localhost:5173`
- `docusaurus` project → `localhost:3000`

Start both servers before running e2e tests. Global setup is in `e2e/global-setup.ts`.

## Dependency on ui-components

This project depends on `@open-resource-discovery/ui-components` via `file:../ui-components`. When that library changes:
1. Run `npm run build` in `../ui-components`
2. Re-run `npm install` here if the package interface changed

## Path aliases

`@/` → `src/`, `@lib/` → `src/lib/`, `@demo/` → `src/demo/` (configured in `vite.config.ts` and `tsconfig.app.json`).

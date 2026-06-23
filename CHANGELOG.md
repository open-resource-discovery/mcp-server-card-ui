# CHANGELOG

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) rules.

## [unreleased]

## [0.2.0] - 2026-06-23

### Changed

- Migrate all UI components (`Button`, `Badge`, `Card`, `Collapsible`, `Input`, `Select`, `Tabs`, `Switch`, `Separator`, `CodeBlock`, `MarkdownText`, `PasswordInput`) to re-export from `@open-resource-discovery/ui-components`, removing local shadcn-based implementations.
- Replace `InfoCard`-based server overview layout with components from `@open-resource-discovery/ui-components`: `InfoCard`, `SectionCard`, `CollapsibleSection`.
- Refactor `ToolCard`, `PromptCard`, `ResourceCard`, and all overview sections (`CapabilitiesSection`, `RemotesSection`, `ToolsSection`, `PromptsSection`, `ResourcesSection`, `AuthenticationSection`, `ExtensionsSection`, `ClientRequirementsSection`) to use library components.
- Align CSS layer setup (`@layer theme, base, components`) and Tailwind import style with `@open-resource-discovery/ui-components` conventions.
- Strip `@layer` wrappers from the standalone IIFE bundle so Tailwind utilities take precedence over unlayered host-page styles (e.g. Docusaurus Infima).
- Switch `MCPConnectionSettings` transport/auth selects from shadcn `Select` to `Select.Root` compound API from the library.
- Fix `Select.Value` in `FunctionInput` to display tool/prompt `title` instead of raw `name` when the two differ.
- Update `vite.config.ts` to use `vite-plugin-dts` v5 API (`outDirs`, `copyDtsFiles`, `tsconfigPath`).

### Fixed

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

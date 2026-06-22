# CHANGELOG

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) rules.

## [unreleased]

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

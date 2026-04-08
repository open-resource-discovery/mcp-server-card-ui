---
id: getting-started
title: Getting Started
sidebar_position: 1
---

# Getting Started

`@sap/mcp-editor-react` is a React component library for viewing, editing, validating, and testing MCP Server Cards.

## Installation

```bash
npm install @sap/mcp-editor-react
```

## Quick Start

```tsx
import { MCPServerEditor } from "@sap/mcp-editor-react";
import "@sap/mcp-editor-react/styles";

function App() {
  return (
    <MCPServerEditor
      initialServerCard='{"name": "example/server", ...}'
      showValidation={true}
    />
  );
}
```

## Components

| Component             | Description                                                        |
| --------------------- | ------------------------------------------------------------------ |
| `MCPServerPlayground` | Full playground with editor, connection, functions, and validation |
| `MCPServerEditor`     | Monaco editor + overview panel                                     |
| `MCPServerViewer`     | Textarea editor + overview panel                                   |
| `MCPServerCardView`   | Read-only card overview                                            |

## Standalone (CDN)

```html
<link rel="stylesheet" href="mcp-playground.css" />
<script src="mcp-playground.js"></script>
<script>
  MCPPlayground.init({
    el: "#app",
    serverCard: "{ ... }",
  });
</script>
```

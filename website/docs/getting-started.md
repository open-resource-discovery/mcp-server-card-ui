---
id: getting-started
title: Getting Started
sidebar_position: 1
---

# Getting Started

`@open-resource-discovery/mcp-server-card-ui` is a React component library for viewing, editing, validating, and testing MCP Server Cards.

## Installation

```bash
npm install @open-resource-discovery/mcp-server-card-ui
```

## Quick Start

```tsx
import { MCPServerEditor } from "@open-resource-discovery/mcp-server-card-ui";
import "@open-resource-discovery/mcp-server-card-ui/styles";

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
<link rel="stylesheet" href="mcp-server-card-ui.css" />
<script src="mcp-server-card-ui.js"></script>
<script>
  MCPPlayground.init({
    el: "#app",
    serverCard: "{ ... }",
  });
</script>
```

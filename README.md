[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/open-resource-discovery-mcp-server-card-ui-badge.png)](https://mseep.ai/app/open-resource-discovery-mcp-server-card-ui)

# MCP Server Card UI

UI components for editing, viewing, and testing servers that implement the MCP Protocol.

👉 **LIVE DEMO:** https://open-resource-discovery.github.io/mcp-server-card-ui/playground

## Getting Started

### npm

```bash
npm install @open-resource-discovery/mcp-server-card-ui
```

## Quick Start

```tsx
import { MCPServerPlayground } from "@open-resource-discovery/mcp-server-card-ui";
import "@open-resource-discovery/mcp-server-card-ui/styles";

function App() {
  return (
    <div style={{ height: "100vh" }}>
      <MCPServerPlayground
        onServerCardChange={(json, parsed) => console.log(parsed?.name)}
      />
    </div>
  );
}
```

## Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute to this project.

## License

Please see our [LICENSE](LICENSE) for copyright and license information. Detailed information including third-party components and their licensing/copyright information is available [via the REUSE tool](https://api.reuse.software/info/github.com/open-resource-discovery/mcp-server-card-ui).

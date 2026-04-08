/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docs: [
    "getting-started",
    {
      type: "category",
      label: "Components",
      items: [
        "components/mcp-server-playground",
        "components/mcp-server-playground-lite",
        "components/mcp-server-editor",
        "components/mcp-server-viewer",
        "components/mcp-server-card-view",
      ],
    },
  ],
};

module.exports = sidebars;

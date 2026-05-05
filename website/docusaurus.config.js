// @ts-check

require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});

const baseUrl = process.env.BASE_URL || "/";

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "MCP Server Card UI",
  tagline:
    "Edit, validate, and test MCP Server Cards. Connect to servers, inspect capabilities, and execute tools and prompts in real-time.",
  favicon: "img/favicon.ico",

  url: process.env.SITE_URL || "https://open-resource-discovery.github.io",
  baseUrl,

  customFields: {
    playgroundConfig: process.env.VITE_PLAYGROUND_CONFIG || "{}",
  },

  organizationName: "ORD",
  projectName: "mcp-server-card-ui",

  onBrokenLinks: "throw",

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: "warn",
    },
  },

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  themes: ["@easyops-cn/docusaurus-search-local"],

  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: "./sidebars.js",
        },
        blog: false,
        theme: {
          customCss: ["./src/css/custom.css"],
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: "img/social-card.png",
      colorMode: {
        defaultMode: "dark",
        disableSwitch: false,
        respectPrefersColorScheme: false,
      },
      navbar: {
        title: "MCP Server Card UI",
        items: [
          {
            type: "doc",
            docId: "getting-started",
            position: "left",
            label: "Documentation",
          },
          {
            to: "/playground",
            position: "left",
            label: "Playground",
          },
          {
            href: "https://github.com/open-resource-discovery/mcp-server-card-ui",
            label: "GitHub",
            position: "right",
            className: "header-github-pill",
          },
        ],
      },
      footer: {},
      prism: {
        theme: require("prism-react-renderer").themes.github,
        darkTheme: require("prism-react-renderer").themes.dracula,
      },
    }),
};

module.exports = config;

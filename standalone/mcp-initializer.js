/**
 * MCP Server Card UI Initializer
 *
 * This file is meant to be customized for your deployment.
 * Modify the options below to configure the playground.
 *
 * Available options:
 * - el: Target element selector (required)
 * - serverUrl: MCP Server URL to auto-connect
 * - serverCard: Initial server card JSON
 * - showFunctions: Show functions panel (default: true)
 * - showRawHttp: Show raw HTTP panel (default: true)
 * - showValidation: Show validation panel (default: true)
 * - showSettings: Show settings panel (default: true)
 * - showEditor: Show editor panel (default: true)
 * - readOnly: Make editor read-only (default: false)
 * - defaultTab: Default active tab ("overview" | "functions" | "rawhttp" | "validation")
 * - theme: Color theme ("light" | "dark" | "system")
 * - auth: Authentication config { type, credentials }
 * - onReady: Callback when ready
 * - onConnect: Callback on connection
 * - onError: Callback on error
 */

window.addEventListener("DOMContentLoaded", function () {
  window.playground = MCPPlayground.init({
    el: "#mcp-server-card-ui",

    // Uncomment to auto-connect to a server:
    // serverUrl: 'https://my-server.example.com',

    // Feature toggles
    showFunctions: true,
    showRawHttp: true,
    showValidation: true,
    showSettings: true,
    showEditor: true,
    readOnly: false,
    defaultTab: "overview",

    // Theme: 'light', 'dark', or 'system'
    theme: "system",

    // Authentication (uncomment and configure as needed):
    // auth: {
    //   type: 'bearer',
    //   credentials: {
    //     token: 'your-token'
    //   }
    // },

    // Callbacks
    onReady: function (instance) {
      console.log("MCP Server Card UI ready!", instance);
    },

    onConnect: function (url) {
      console.log("Connected to:", url);
    },

    onError: function (error) {
      console.error("MCP Server Card UI error:", error);
    },
  });
});

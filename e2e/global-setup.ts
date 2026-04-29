import { execSync } from "child_process";

const mockConfig = {
  servers: [
    {
      id: "mock-echo",
      name: "mock-echo",
      title: "Echo Server",
      description: "Mock echo server for testing",
      url: "mock://echo",
      transportType: "streamable-http",
      mocked: true,
    },
    {
      id: "mock-weather",
      name: "mock-weather",
      title: "Weather Server",
      description: "Mock weather server for testing",
      url: "mock://weather",
      transportType: "streamable-http",
      mocked: true,
    },
  ],
};

export default function globalSetup() {
  process.env.VITE_PLAYGROUND_CONFIG = JSON.stringify(mockConfig);
  execSync("npm run prepare:website-assets", { stdio: "inherit" });
}

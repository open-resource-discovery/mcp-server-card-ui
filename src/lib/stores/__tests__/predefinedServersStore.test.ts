import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@lib/utils/playground-config", () => ({
  getConfigServers: () => [
    {
      id: "mock-default",
      name: "default",
      description: "Default server",
      url: "mock://default",
      transportType: "streamable-http",
      mocked: true,
    },
  ],
  getConfigOrdUrl: () => "",
}));

import { usePredefinedServersStore } from "../predefinedServersStore";

beforeEach(() => {
  localStorage.clear();
  usePredefinedServersStore.setState({
    servers: [],
    selectedId: null,
    loading: false,
    notice: null,
    isAddingServer: false,
  });
});

describe("predefinedServersStore", () => {
  it("removes malformed persisted servers and reports the recovery", async () => {
    localStorage.setItem(
      "mcp-custom-servers",
      JSON.stringify([
        {
          id: "custom-valid",
          name: "valid",
          description: "Valid custom server",
          url: "mock://valid",
          transportType: "streamable-http",
        },
        {
          id: "custom-broken",
          name: "broken",
          description: "Broken custom server",
          url: { value: "mock://broken" },
          transportType: "streamable-http",
        },
      ]),
    );

    await usePredefinedServersStore.getState().loadDefaults();

    const state = usePredefinedServersStore.getState();
    expect(state.servers.map((server) => server.id)).toEqual([
      "custom-valid",
      "mock-default",
    ]);
    expect(state.notice).toEqual(
      expect.objectContaining({
        severity: "warning",
        summary: "Some server definitions could not be loaded.",
        details: [
          expect.stringContaining(
            'Saved custom servers, server "custom-broken", [1].url',
          ),
        ],
      }),
    );
    expect(
      JSON.parse(localStorage.getItem("mcp-custom-servers") ?? "[]"),
    ).toEqual([
      expect.objectContaining({
        id: "custom-valid",
        url: "mock://valid",
      }),
    ]);
  });

  it("reports and removes syntactically invalid persisted JSON", async () => {
    localStorage.setItem("mcp-custom-servers", "{");

    await usePredefinedServersStore.getState().loadDefaults();

    const state = usePredefinedServersStore.getState();
    expect(state.servers.map((server) => server.id)).toEqual(["mock-default"]);
    expect(state.notice?.details).toEqual([
      expect.stringContaining(
        "Saved custom servers: stored JSON could not be parsed:",
      ),
    ]);
    expect(state.notice?.details[0]).toContain(
      "The invalid value was removed.",
    );
    expect(localStorage.getItem("mcp-custom-servers")).toBe("[]");
  });

  it("treats an empty persisted value as invalid JSON", async () => {
    localStorage.setItem("mcp-custom-servers", "");

    await usePredefinedServersStore.getState().loadDefaults();

    const state = usePredefinedServersStore.getState();
    expect(state.notice?.details[0]).toContain(
      "Saved custom servers: stored JSON could not be parsed:",
    );
    expect(localStorage.getItem("mcp-custom-servers")).toBe("[]");
  });

  it("returns false and preserves state when a custom server is rejected", () => {
    const added = usePredefinedServersStore.getState().addCustomServer({
      id: "custom-invalid",
      name: "",
      description: "Invalid server",
      url: "localhost:3000",
      transportType: "streamable-http",
    });

    expect(added).toBe(false);
    expect(usePredefinedServersStore.getState().servers).toEqual([]);
    expect(usePredefinedServersStore.getState().notice?.summary).toBe(
      "The custom server was not added.",
    );
  });

  it("returns false when a custom server ID already exists", () => {
    usePredefinedServersStore.setState({
      servers: [
        {
          id: "custom-duplicate",
          name: "existing",
          description: "Existing server",
          url: "mock://existing",
          transportType: "streamable-http",
        },
      ],
    });

    const added = usePredefinedServersStore.getState().addCustomServer({
      id: "custom-duplicate",
      name: "replacement",
      description: "Replacement server",
      url: "mock://replacement",
      transportType: "streamable-http",
    });

    expect(added).toBe(false);
    expect(usePredefinedServersStore.getState().servers[0].url).toBe(
      "mock://existing",
    );
    expect(usePredefinedServersStore.getState().notice?.details[0]).toContain(
      "A server with this ID already exists.",
    );
  });
});

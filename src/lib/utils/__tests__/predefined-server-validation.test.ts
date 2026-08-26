import { describe, expect, it } from "vitest";
import {
  formatPredefinedServerIssue,
  validatePredefinedServers,
} from "../predefined-server-validation";

describe("validatePredefinedServers", () => {
  it("keeps valid servers and rejects malformed URLs", () => {
    const result = validatePredefinedServers(
      [
        {
          id: "custom-valid",
          name: "valid",
          description: "",
          url: "mock://valid",
          transportType: "streamable-http",
          tags: ["test"],
        },
        {
          id: "custom-invalid",
          name: "invalid",
          description: "",
          url: { value: "mock://invalid" },
          transportType: "streamable-http",
        },
      ],
      "Saved custom servers",
    );

    expect(result.servers).toHaveLength(1);
    expect(result.servers[0].id).toBe("custom-valid");
    expect(result.issues).toEqual([
      expect.objectContaining({
        source: "Saved custom servers",
        serverId: "custom-invalid",
        path: "[1].url",
        message: "Expected a non-empty string; received object.",
      }),
    ]);
    expect(formatPredefinedServerIssue(result.issues[0])).toBe(
      'Saved custom servers, server "custom-invalid", [1].url: Expected a non-empty string; received object.',
    );
  });

  it("rejects optional fields that could break rendering", () => {
    const result = validatePredefinedServers(
      [
        {
          id: "custom-invalid",
          name: "invalid",
          title: { text: "Invalid title" },
          description: "",
          url: "mock://invalid",
          transportType: "streamable-http",
          tags: ["valid", 42],
        },
      ],
      "Configured predefined servers",
    );

    expect(result.servers).toEqual([]);
    expect(result.issues.map((issue) => issue.path)).toEqual([
      "[0].title",
      "[0].tags[1]",
    ]);
  });
});

import type { ServerCapabilities } from "../../../types/mcp-protocol";
import { Card, CardContent, CardHeader, CardTitle } from "@lib/components/ui/card";
import { Badge } from "@lib/components/ui/badge";
import { Puzzle } from "lucide-react";

interface CapabilitiesSectionProps {
  capabilities: ServerCapabilities;
}

const CAPABILITY_LABELS: Record<string, string> = {
  tools: "Tools",
  resources: "Resources",
  prompts: "Prompts",
  logging: "Logging",
  completions: "Completions",
  tasks: "Tasks",
  experimental: "Experimental",
};

function renderSubProps(value: unknown): string | null {
  if (value === null || value === undefined || typeof value !== "object") return null;
  const entries = Object.entries(value as Record<string, unknown>).filter(
    ([, v]) => v !== undefined,
  );
  if (entries.length === 0) return null;
  return entries
    .map(([k, v]) => {
      if (typeof v === "boolean") return v ? k : null;
      return `${k}: ${JSON.stringify(v)}`;
    })
    .filter(Boolean)
    .join(", ");
}

export function CapabilitiesSection({ capabilities }: CapabilitiesSectionProps) {
  const entries = Object.entries(capabilities).filter(
    ([, v]) => v !== undefined && v !== null,
  );

  if (entries.length === 0) return null;

  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Puzzle className="h-4 w-4" />
          Capabilities
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <div className="flex flex-wrap gap-2">
          {entries.map(([key, value]) => {
            const subProps = renderSubProps(value);
            return (
              <div key={key} className="flex flex-col items-start">
                <Badge variant="secondary">
                  {CAPABILITY_LABELS[key] ?? key}
                </Badge>
                {subProps && (
                  <span className="mt-0.5 text-[10px] text-muted-foreground pl-1">
                    {subProps}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

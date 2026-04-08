import type { ClientCapabilities } from "@sap/mcp-protocol";
import { Card, CardContent, CardHeader, CardTitle } from "@lib/components/ui/card";
import { Badge } from "@lib/components/ui/badge";
import { Monitor } from "lucide-react";

interface ClientRequirementsSectionProps {
  requires: ClientCapabilities;
}

const CAPABILITY_LABELS: Record<string, string> = {
  elicitation: "Elicitation",
  experimental: "Experimental",
  roots: "Roots",
  sampling: "Sampling",
  tasks: "Tasks",
};

export function ClientRequirementsSection({ requires }: ClientRequirementsSectionProps) {
  const entries = Object.entries(requires).filter(
    ([, v]) => v !== undefined && v !== null,
  );

  if (entries.length === 0) return null;

  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Monitor className="h-4 w-4" />
          Client Requirements
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <p className="text-sm text-muted-foreground mb-3">
          The client must support the following capabilities to fully interact with this server.
        </p>
        <div className="flex flex-wrap gap-2">
          {entries.map(([key]) => (
            <Badge key={key} variant="secondary">
              {CAPABILITY_LABELS[key] ?? key}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

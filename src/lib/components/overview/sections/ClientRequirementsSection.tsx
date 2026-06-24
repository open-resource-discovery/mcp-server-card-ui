import type { ClientCapabilities } from "../../../types/mcp-protocol";
import { SectionCard } from "@open-resource-discovery/ui-components";
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

export function ClientRequirementsSection({
  requires,
}: ClientRequirementsSectionProps) {
  const entries = Object.entries(requires).filter(
    ([, v]) => v !== undefined && v !== null,
  );

  if (entries.length === 0) return null;

  return (
    <SectionCard.Root>
      <SectionCard.Header icon={<Monitor />} title="Client Requirements" />
      <SectionCard.Content>
        <p className="text-sm text-muted-foreground mb-3">
          The client must support the following capabilities to fully interact
          with this server.
        </p>
        <div className="flex flex-wrap gap-2">
          {entries.map(([key]) => (
            <Badge key={key} variant="secondary">
              {CAPABILITY_LABELS[key] ?? key}
            </Badge>
          ))}
        </div>
      </SectionCard.Content>
    </SectionCard.Root>
  );
}

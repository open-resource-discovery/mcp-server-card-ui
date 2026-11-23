import { ToolCard } from "@lib/components/overview/ToolCard";
import { SectionCard } from "@open-resource-discovery/ui-components";
import { Wrench } from "lucide-react";
import type { Tool } from "../../../types/mcp-protocol";

interface ToolsSectionProps {
  tools: Tool[];
  readOnly?: boolean;
}

export function ToolsSection({ tools, readOnly }: ToolsSectionProps) {
  return (
    <SectionCard.Root data-testid="tools-section">
      <SectionCard.Header icon={<Wrench />} title={`Tools (${tools.length})`} />
      <SectionCard.Content>
        {tools.map((tool) => (
          <ToolCard key={tool.name} tool={tool} readOnly={readOnly} />
        ))}
      </SectionCard.Content>
    </SectionCard.Root>
  );
}

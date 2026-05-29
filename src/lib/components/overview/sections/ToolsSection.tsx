import type { Tool } from "../../../types/mcp-protocol";
import { Card } from "@open-resource-discovery/ui-components";
import { ToolCard } from "@lib/components/overview/ToolCard";
import { Wrench } from "lucide-react";

interface ToolsSectionProps {
  tools: Tool[];
  readOnly?: boolean;
}

export function ToolsSection({ tools, readOnly }: ToolsSectionProps) {
  return (
    <Card data-testid="tools-section">
      <Card.Header className="p-4 pb-2">
        <Card.Title className="flex items-center gap-2 text-sm">
          <Wrench className="h-4 w-4" />
          Tools ({tools.length})
        </Card.Title>
      </Card.Header>
      <Card.Content className="px-4 pb-4 pt-0">
        {tools.map((tool) => (
          <ToolCard key={tool.name} tool={tool} readOnly={readOnly} />
        ))}
      </Card.Content>
    </Card>
  );
}

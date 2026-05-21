import type { Tool } from "../../../types/mcp-protocol";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@lib/components/ui/card";
import { ToolCard } from "@lib/components/overview/ToolCard";
import { Wrench } from "lucide-react";

interface ToolsSectionProps {
  tools: Tool[];
  readOnly?: boolean;
}

export function ToolsSection({ tools, readOnly }: ToolsSectionProps) {
  return (
    <Card data-testid="tools-section">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Wrench className="h-4 w-4" />
          Tools ({tools.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        {tools.map((tool) => (
          <ToolCard key={tool.name} tool={tool} readOnly={readOnly} />
        ))}
      </CardContent>
    </Card>
  );
}

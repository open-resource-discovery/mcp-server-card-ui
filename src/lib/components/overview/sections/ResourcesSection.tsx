import type { Resource } from "../../../types/mcp-protocol";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@lib/components/ui/card";
import { ResourceCard } from "@lib/components/overview/ResourceCard";
import { FileText } from "lucide-react";

interface ResourcesSectionProps {
  resources: Resource[];
}

export function ResourcesSection({ resources }: ResourcesSectionProps) {
  return (
    <Card data-testid="resources-section">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <FileText className="h-4 w-4" />
          Resources ({resources.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        {resources.map((resource) => (
          <ResourceCard key={resource.uri} resource={resource} />
        ))}
      </CardContent>
    </Card>
  );
}

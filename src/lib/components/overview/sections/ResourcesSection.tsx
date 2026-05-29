import type { Resource } from "../../../types/mcp-protocol";
import { Card } from "@open-resource-discovery/ui-components";
import { ResourceCard } from "@lib/components/overview/ResourceCard";
import { FileText } from "lucide-react";

interface ResourcesSectionProps {
  resources: Resource[];
}

export function ResourcesSection({ resources }: ResourcesSectionProps) {
  return (
    <Card data-testid="resources-section">
      <Card.Header className="p-4 pb-2">
        <Card.Title className="flex items-center gap-2 text-sm">
          <FileText className="h-4 w-4" />
          Resources ({resources.length})
        </Card.Title>
      </Card.Header>
      <Card.Content className="px-4 pb-4 pt-0">
        {resources.map((resource) => (
          <ResourceCard key={resource.uri} resource={resource} />
        ))}
      </Card.Content>
    </Card>
  );
}

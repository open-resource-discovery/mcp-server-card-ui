import type { Resource } from "../../../types/mcp-protocol";
import { SectionCard } from "@open-resource-discovery/ui-components";
import { ResourceCard } from "@lib/components/overview/ResourceCard";
import { FileText } from "lucide-react";

interface ResourcesSectionProps {
  resources: Resource[];
}

export function ResourcesSection({ resources }: ResourcesSectionProps) {
  return (
    <SectionCard.Root data-testid="resources-section">
      <SectionCard.Header icon={<FileText />} title={`Resources (${resources.length})`} />
      <SectionCard.Content>
        {resources.map((resource) => (
          <ResourceCard key={resource.uri} resource={resource} />
        ))}
      </SectionCard.Content>
    </SectionCard.Root>
  );
}

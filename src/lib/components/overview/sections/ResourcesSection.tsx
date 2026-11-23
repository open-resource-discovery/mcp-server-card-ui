import { ResourceCard } from "@lib/components/overview/ResourceCard";
import { SectionCard } from "@open-resource-discovery/ui-components";
import { FileText } from "lucide-react";
import type { Resource } from "../../../types/mcp-protocol";

interface ResourcesSectionProps {
  resources: Resource[];
}

export function ResourcesSection({ resources }: ResourcesSectionProps) {
  return (
    <SectionCard.Root data-testid="resources-section">
      <SectionCard.Header
        icon={<FileText />}
        title={`Resources (${resources.length})`}
      />
      <SectionCard.Content>
        {resources.map((resource) => (
          <ResourceCard key={resource.uri} resource={resource} />
        ))}
      </SectionCard.Content>
    </SectionCard.Root>
  );
}

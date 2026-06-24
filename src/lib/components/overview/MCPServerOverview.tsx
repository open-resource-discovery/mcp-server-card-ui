import { useServerCardStore } from "@lib/stores/serverCardStore";
import { ServerHeader } from "@lib/components/overview/sections/ServerHeader";
import { RemotesSection } from "@lib/components/overview/sections/RemotesSection";
import { AuthenticationSection } from "@lib/components/overview/sections/AuthenticationSection";
import { CapabilitiesSection } from "@lib/components/overview/sections/CapabilitiesSection";
import { ToolsSection } from "@lib/components/overview/sections/ToolsSection";
import { ResourcesSection } from "@lib/components/overview/sections/ResourcesSection";
import { PromptsSection } from "@lib/components/overview/sections/PromptsSection";
import { ClientRequirementsSection } from "@lib/components/overview/sections/ClientRequirementsSection";
import { ExtensionsSection } from "@lib/components/overview/sections/ExtensionsSection";
import type { MCPServerCardDefinition } from "../../types/mcp-protocol";
import {
  InfoCard,
  CollapsibleSection,
} from "@open-resource-discovery/ui-components";
import { Badge } from "@lib/components/ui/badge";
import { MarkdownText } from "@lib/components/ui/MarkdownText";
import { AlertTriangle, ExternalLink, FileJson } from "lucide-react";

interface MCPServerOverviewProps {
  readOnly?: boolean;
}

export function MCPServerOverview({ readOnly }: MCPServerOverviewProps) {
  const parsedCard = useServerCardStore((s) => s.parsedCard);
  const lastValidCard = useServerCardStore((s) => s.lastValidCard);
  const parseError = useServerCardStore((s) => s.parseError);

  // No card at all - empty state
  if (!parsedCard && !lastValidCard) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
        <FileJson className="h-10 w-10 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          No Server Card — Enter valid JSON in the editor to see the overview.
        </p>
      </div>
    );
  }

  // Error with last valid card fallback
  const card = parsedCard ?? lastValidCard;
  if (!card) return null;

  return (
    <div className="space-y-3 p-4 h-full bg-background">
      {parseError && lastValidCard && !parsedCard && (
        <div className="flex items-start gap-2 rounded-lg border border-warning/50 bg-warning/10 p-3">
          <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium text-warning">Invalid JSON</p>
            <p className="text-xs text-muted-foreground">
              Showing the last valid card. Fix the JSON to update the overview.
            </p>
          </div>
        </div>
      )}

      <InfoCard>
        <ServerHeader card={card} />
        <InfoCard.Content>
          {card.description && (
            <InfoCard.Section>
              <MarkdownText
                text={card.description}
                className="text-sm text-muted-foreground"
              />
            </InfoCard.Section>
          )}

          {(card.supportedProtocolVersions?.length || card.websiteUrl) && (
            <InfoCard.Section className="flex-row flex-wrap items-center gap-1.5">
              {card.supportedProtocolVersions?.map((v) => (
                <Badge key={v} variant="secondary" size="sm">
                  Protocol {v}
                </Badge>
              ))}
              {card.websiteUrl && (
                <a
                  href={card.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  {card.websiteUrl}
                </a>
              )}
            </InfoCard.Section>
          )}

          {card.instructions && (
            <InfoCard.Section>
              <CollapsibleSection.Root>
                <CollapsibleSection.Trigger>
                  Instructions
                </CollapsibleSection.Trigger>
                <CollapsibleSection.Content>
                  <MarkdownText text={card.instructions} />
                </CollapsibleSection.Content>
              </CollapsibleSection.Root>
            </InfoCard.Section>
          )}

          <CardSections card={card} readOnly={readOnly} />
        </InfoCard.Content>
      </InfoCard>
    </div>
  );
}

function CardSections({
  card,
  readOnly,
}: {
  card: MCPServerCardDefinition;
  readOnly?: boolean;
}) {
  return (
    <>
      {card._meta && <ExtensionsSection meta={card._meta} />}

      {card.remotes && card.remotes.length > 0 && (
        <RemotesSection remotes={card.remotes} />
      )}

      {card.authentication && (
        <AuthenticationSection authentication={card.authentication} />
      )}

      {card.capabilities && (
        <CapabilitiesSection capabilities={card.capabilities} />
      )}

      {card.tools && card.tools.length > 0 && (
        <ToolsSection tools={card.tools} readOnly={readOnly} />
      )}

      {card.resources && card.resources.length > 0 && (
        <ResourcesSection resources={card.resources} />
      )}

      {card.prompts && card.prompts.length > 0 && (
        <PromptsSection prompts={card.prompts} />
      )}

      {card.requires && <ClientRequirementsSection requires={card.requires} />}
    </>
  );
}

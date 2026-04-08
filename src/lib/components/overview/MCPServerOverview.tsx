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
import type { MCPServerCardDefinition } from "@sap/mcp-protocol";
import { AlertTriangle, FileJson } from "lucide-react";

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
    <div className="space-y-3 p-4">
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

      <ServerHeader card={card} />
      <CardSections card={card} readOnly={readOnly} />
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
      {card._meta && (
        <ExtensionsSection meta={card._meta} />
      )}

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

      {card.requires && (
        <ClientRequirementsSection requires={card.requires} />
      )}
    </>
  );
}

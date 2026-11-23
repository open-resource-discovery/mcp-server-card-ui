import { Badge } from "@lib/components/ui/badge";
import { InfoCard } from "@open-resource-discovery/ui-components";
import { Server } from "lucide-react";
import type { MCPServerCardDefinition } from "../../../types/mcp-protocol";

interface ServerHeaderProps {
  card: MCPServerCardDefinition;
}

export function ServerHeader({ card }: ServerHeaderProps) {
  const iconSrc = card.icons?.[0]?.src;

  return (
    <InfoCard.Header>
      <InfoCard.Icon>
        {iconSrc ? (
          <img
            src={iconSrc}
            alt={card.title ?? card.name}
            className="h-full w-full rounded-lg object-contain"
          />
        ) : (
          <Server className="h-5 w-5 text-muted-foreground" />
        )}
      </InfoCard.Icon>
      <div className="flex flex-1 flex-col gap-0.5 min-w-0">
        <div className="flex items-center gap-2">
          <InfoCard.Title className="truncate m-0">
            {card.title ?? card.name}
          </InfoCard.Title>
          <Badge
            variant="outline"
            size="sm"
            className="shrink-0"
            data-testid="server-version"
          >
            {card.version}
          </Badge>
        </div>
        <InfoCard.Subtitle className="font-mono m-0" data-testid="server-name">
          {card.name}
        </InfoCard.Subtitle>
      </div>
    </InfoCard.Header>
  );
}

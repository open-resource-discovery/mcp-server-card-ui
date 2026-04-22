import type { MCPServerCardDefinition } from "../../../types/mcp-protocol";
import { Badge } from "@lib/components/ui/badge";
import { MarkdownText } from "@lib/components/ui/MarkdownText";
import { ExternalLink, Server } from "lucide-react";

interface ServerHeaderProps {
  card: MCPServerCardDefinition;
}

export function ServerHeader({ card }: ServerHeaderProps) {
  const iconSrc = card.icons?.[0]?.src;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-3">
        {iconSrc ? (
          <img
            src={iconSrc}
            alt={card.title ?? card.name}
            className="h-10 w-10 rounded-lg border object-contain bg-muted shrink-0"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-muted shrink-0">
            <Server className="h-5 w-5 text-muted-foreground" />
          </div>
        )}

        <div className="flex flex-1 flex-col gap-0.5 min-w-0">
          <p
            className="font-mono text-[11px] text-muted-foreground leading-none"
            data-testid="server-name"
          >
            {card.name}
          </p>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold leading-tight truncate">
              {card.title ?? card.name}
            </h2>
            <Badge
              variant="outline"
              size="sm"
              className="shrink-0"
              data-testid="server-version"
            >
              {card.version}
            </Badge>
          </div>
        </div>
      </div>

      {card.description && (
        <MarkdownText
          text={card.description}
          className="text-sm text-muted-foreground"
        />
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        {card.supportedProtocolVersions.map((v) => (
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
      </div>

      {card.instructions && (
        <div className="rounded-md border bg-muted/50 px-3 py-2">
          <p className="text-[11px] font-medium text-muted-foreground mb-0.5">
            Instructions
          </p>
          <MarkdownText text={card.instructions} className="text-sm" />
        </div>
      )}
    </div>
  );
}

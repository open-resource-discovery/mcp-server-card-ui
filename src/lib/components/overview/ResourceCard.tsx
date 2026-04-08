import type { Resource } from "../../types/mcp-protocol";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@lib/components/ui/accordion";
import { Badge } from "@lib/components/ui/badge";
import { MarkdownText } from "@lib/components/ui/MarkdownText";

interface ResourceCardProps {
  resource: Resource;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function ResourceCard({ resource }: ResourceCardProps) {
  const displayName = resource.title ?? resource.name;

  return (
    <AccordionItem value={resource.uri} className="border-b last:border-b-0">
      <AccordionTrigger className="hover:no-underline hover:bg-muted/50 rounded-md px-2 -mx-2 transition-colors py-3">
        <div className="flex flex-1 flex-col gap-0.5 text-left min-w-0">
          {resource.mimeType && (
            <div className="flex gap-1.5">
              <Badge variant="secondary">
                {resource.mimeType}
              </Badge>
            </div>
          )}
          <span className="text-xs font-medium truncate">{displayName}</span>
          {displayName !== resource.name && (
            <span className="font-mono text-[11px] text-muted-foreground truncate">
              {resource.name}
            </span>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="flex flex-col gap-2 pl-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">URI:</span>
            <code className="font-mono text-xs break-all">{resource.uri}</code>
          </div>

          {resource.description && (
            <MarkdownText text={resource.description} className="text-xs text-muted-foreground" />
          )}

          <div className="flex flex-wrap items-center gap-2">
            {resource.size !== undefined && (
              <Badge variant="outline">{formatBytes(resource.size)}</Badge>
            )}
          </div>

          {resource.annotations && (
            <div className="flex flex-col gap-1.5 mt-1">
              {resource.annotations.audience && resource.annotations.audience.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Audience:</span>
                  <div className="flex gap-1.5">
                    {resource.annotations.audience.map((role) => (
                      <Badge key={role} variant="secondary">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {resource.annotations.priority !== undefined && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Priority:</span>
                  <span className="text-xs font-mono">
                    {resource.annotations.priority}
                  </span>
                </div>
              )}

              {resource.annotations.lastModified && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Last Modified:</span>
                  <span className="text-xs font-mono">
                    {resource.annotations.lastModified}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

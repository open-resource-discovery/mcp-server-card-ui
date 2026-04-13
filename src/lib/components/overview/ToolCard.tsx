import { useState } from "react";
import type { Tool } from "../../types/mcp-protocol";
import {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@lib/components/ui/accordion";
import { Badge } from "@lib/components/ui/badge";
import { Button } from "@lib/components/ui/button";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@lib/components/ui/collapsible";
import { JsonHighlight } from "@lib/components/ui/JsonHighlight";
import { MarkdownText } from "@lib/components/ui/MarkdownText";
import { useUIStore } from "@lib/stores/uiStore";
import { ChevronRight, Play } from "lucide-react";
import { cn } from "@lib/utils/cn";

interface ToolCardProps {
  tool: Tool;
  readOnly?: boolean;
}

export function ToolCard({ tool, readOnly }: ToolCardProps) {
  const displayName = tool.annotations?.title ?? tool.title ?? tool.name;

  return (
    <AccordionItem value={tool.name} className="border-b last:border-b-0">
      <AccordionTrigger className="hover:no-underline hover:bg-muted/50 rounded-md px-2 -mx-2 transition-colors py-3">
        <div className="flex flex-1 flex-col gap-0.5 text-left min-w-0">
          <AnnotationBadges annotations={tool.annotations} />
          <span className="text-xs font-medium truncate">{displayName}</span>
          {displayName !== tool.name && (
            <span className="font-mono text-[11px] text-muted-foreground truncate">
              {tool.name}
            </span>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="flex flex-col gap-2 pl-2">
          {tool.description && (
            <MarkdownText
              text={tool.description}
              className="text-xs text-muted-foreground"
            />
          )}

          {tool.execution?.taskSupport && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Task Support:
              </span>
              <Badge
                variant={
                  tool.execution.taskSupport === "required"
                    ? "warning"
                    : tool.execution.taskSupport === "optional"
                      ? "secondary"
                      : "outline"
                }
              >
                {tool.execution.taskSupport}
              </Badge>
            </div>
          )}

          <SchemaCollapsible label="Input Schema" schema={tool.inputSchema} />

          {tool.outputSchema && (
            <SchemaCollapsible
              label="Output Schema"
              schema={tool.outputSchema}
            />
          )}

          {tool._meta && Object.keys(tool._meta).length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">
                Metadata
              </span>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(tool._meta).map(([key, value]) => (
                  <Badge key={key} variant="outline">
                    {key}:{" "}
                    {typeof value === "string" ? value : JSON.stringify(value)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {!readOnly && (
            <div className="pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  useUIStore.getState().switchToFunctions(tool.name)
                }
              >
                <Play className="h-3 w-3" />
                Try it
              </Button>
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

function AnnotationBadges({
  annotations,
}: {
  annotations?: Tool["annotations"];
}) {
  if (!annotations) return null;

  const badges: {
    label: string;
    variant: "success" | "warning" | "secondary" | "outline";
  }[] = [];

  if (annotations.readOnlyHint === true) {
    badges.push({ label: "read-only", variant: "outline" });
  }
  if (annotations.destructiveHint === true) {
    badges.push({ label: "destructive", variant: "warning" });
  }
  if (annotations.idempotentHint === true) {
    badges.push({ label: "idempotent", variant: "secondary" });
  }
  if (annotations.openWorldHint === true) {
    badges.push({ label: "open-world", variant: "outline" });
  }

  if (badges.length === 0) return null;

  return (
    <div className="flex gap-1.5">
      {badges.map((b) => (
        <Badge key={b.label} variant={b.variant}>
          {b.label}
        </Badge>
      ))}
    </div>
  );
}

function SchemaCollapsible({
  label,
  schema,
}: {
  label: string;
  schema: Record<string, unknown>;
}) {
  const [open, setOpen] = useState(false);
  const json = JSON.stringify(schema, null, 2);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
        <ChevronRight
          className={cn("h-3 w-3 transition-transform", open && "rotate-90")}
        />
        {label}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-1.5">
          <JsonHighlight code={json} showCopy />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

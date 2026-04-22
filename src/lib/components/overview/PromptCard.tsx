import type { Prompt } from "../../types/mcp-protocol";
import {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@lib/components/ui/accordion";
import { Badge } from "@lib/components/ui/badge";
import { Button } from "@lib/components/ui/button";
import { MarkdownText } from "@lib/components/ui/MarkdownText";
import { useUIStore } from "@lib/stores/uiStore";
import { Play } from "lucide-react";

interface PromptCardProps {
  prompt: Prompt;
}

export function PromptCard({ prompt }: PromptCardProps) {
  const displayName = prompt.title ?? prompt.name;

  return (
    <AccordionItem
      value={prompt.name}
      data-testid={`prompt-item-${prompt.name}`}
      className="border-b last:border-b-0"
    >
      <AccordionTrigger
        data-testid={`prompt-trigger-${prompt.name}`}
        className="hover:no-underline hover:bg-muted/50 rounded-md px-2 -mx-2 transition-colors py-3"
      >
        <div className="flex flex-1 flex-col gap-0.5 text-left min-w-0">
          {prompt.arguments && prompt.arguments.length > 0 && (
            <div className="flex gap-1.5">
              <Badge variant="secondary">
                {prompt.arguments.length} arg
                {prompt.arguments.length !== 1 ? "s" : ""}
              </Badge>
            </div>
          )}
          <span className="text-xs font-medium truncate">{displayName}</span>
          {displayName !== prompt.name && (
            <span className="font-mono text-[11px] text-muted-foreground truncate">
              {prompt.name}
            </span>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="flex flex-col gap-2 pl-2">
          {prompt.description && (
            <MarkdownText
              text={prompt.description}
              className="text-xs text-muted-foreground"
            />
          )}

          {prompt.arguments && prompt.arguments.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Arguments
              </span>
              <div className="flex flex-col gap-2">
                {prompt.arguments.map((arg) => (
                  <div
                    key={arg.name}
                    className="flex flex-col gap-0.5 rounded border p-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold">
                        {arg.name}
                      </span>
                      {arg.title && arg.title !== arg.name && (
                        <span className="text-xs text-muted-foreground">
                          {arg.title}
                        </span>
                      )}
                      {arg.required ? (
                        <Badge variant="warning">required</Badge>
                      ) : (
                        <Badge variant="secondary">optional</Badge>
                      )}
                    </div>
                    {arg.description && (
                      <MarkdownText
                        text={arg.description}
                        className="text-xs text-muted-foreground"
                        clampLines={2}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-1">
            <Button
              variant="outline"
              size="sm"
              data-testid={`prompt-try-it-${prompt.name}`}
              onClick={() => useUIStore.getState().switchToPrompt(prompt.name)}
            >
              <Play className="h-3 w-3" />
              Try it
            </Button>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

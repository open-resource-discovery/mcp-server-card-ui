import type { Prompt } from "../../types/mcp-protocol";
import {
  CollapsibleSection,
  Badge,
  Button,
} from "@open-resource-discovery/ui-components";
import { MarkdownText } from "@lib/components/ui/MarkdownText";
import { useUIStore } from "@lib/stores/uiStore";
import { Play } from "lucide-react";

interface PromptCardProps {
  prompt: Prompt;
}

export function PromptCard({ prompt }: PromptCardProps) {
  const displayName = prompt.title ?? prompt.name;

  const argsBadge =
    prompt.arguments && prompt.arguments.length > 0 ? (
      <div className="flex gap-1.5">
        <Badge variant="secondary">
          {prompt.arguments.length} arg
          {prompt.arguments.length !== 1 ? "s" : ""}
        </Badge>
      </div>
    ) : null;

  return (
    <CollapsibleSection.Root
      data-testid={`prompt-item-${prompt.name}`}
      className="border-b last:border-b-0"
    >
      <CollapsibleSection.Trigger
        data-testid={`prompt-trigger-${prompt.name}`}
        badges={argsBadge}
        description={displayName !== prompt.name ? prompt.name : undefined}
      >
        {displayName}
      </CollapsibleSection.Trigger>
      <CollapsibleSection.Content>
        <div className="pb-4 pt-0">
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
                onClick={() =>
                  useUIStore.getState().switchToPrompt(prompt.name)
                }
              >
                <Play className="h-3 w-3" />
                Try it
              </Button>
            </div>
          </div>
        </div>
      </CollapsibleSection.Content>
    </CollapsibleSection.Root>
  );
}

import type { Prompt } from "../../../types/mcp-protocol";
import { Card } from "@open-resource-discovery/ui-components";
import { PromptCard } from "@lib/components/overview/PromptCard";
import { MessageSquare } from "lucide-react";

interface PromptsSectionProps {
  prompts: Prompt[];
}

export function PromptsSection({ prompts }: PromptsSectionProps) {
  return (
    <Card data-testid="prompts-section">
      <Card.Header className="p-4 pb-2">
        <Card.Title className="flex items-center gap-2 text-sm">
          <MessageSquare className="h-4 w-4" />
          Prompts ({prompts.length})
        </Card.Title>
      </Card.Header>
      <Card.Content className="px-4 pb-4 pt-0">
        {prompts.map((prompt) => (
          <PromptCard key={prompt.name} prompt={prompt} />
        ))}
      </Card.Content>
    </Card>
  );
}

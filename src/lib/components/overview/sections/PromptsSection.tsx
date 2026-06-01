import type { Prompt } from "../../../types/mcp-protocol";
import { SectionCard } from "@open-resource-discovery/ui-components";
import { PromptCard } from "@lib/components/overview/PromptCard";
import { MessageSquare } from "lucide-react";

interface PromptsSectionProps {
  prompts: Prompt[];
}

export function PromptsSection({ prompts }: PromptsSectionProps) {
  return (
    <SectionCard.Root data-testid="prompts-section">
      <SectionCard.Header icon={<MessageSquare />} title={`Prompts (${prompts.length})`} />
      <SectionCard.Content>
        {prompts.map((prompt) => (
          <PromptCard key={prompt.name} prompt={prompt} />
        ))}
      </SectionCard.Content>
    </SectionCard.Root>
  );
}

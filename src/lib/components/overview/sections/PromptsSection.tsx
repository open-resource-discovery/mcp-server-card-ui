import type { Prompt } from "@sap/mcp-protocol";
import { Card, CardContent, CardHeader, CardTitle } from "@lib/components/ui/card";
import { Accordion } from "@lib/components/ui/accordion";
import { PromptCard } from "@lib/components/overview/PromptCard";
import { MessageSquare } from "lucide-react";

interface PromptsSectionProps {
  prompts: Prompt[];
}

export function PromptsSection({ prompts }: PromptsSectionProps) {
  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <MessageSquare className="h-4 w-4" />
          Prompts ({prompts.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <Accordion type="multiple" className="w-full">
          {prompts.map((prompt) => (
            <PromptCard key={prompt.name} prompt={prompt} />
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}

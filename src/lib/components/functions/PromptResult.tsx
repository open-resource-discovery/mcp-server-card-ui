import type { PromptResult } from "@lib/types/functions";
import { Badge } from "@lib/components/ui/badge";
import { JsonHighlight } from "@lib/components/ui/JsonHighlight";

interface PromptResultViewProps {
  result: PromptResult;
}

export function PromptResultView({ result }: PromptResultViewProps) {
  return (
    <div className="space-y-2">
      {result.messages.map((msg, i) => (
        <div key={i} className="border rounded p-2 space-y-1">
          <Badge
            variant={msg.role === "assistant" ? "default" : "outline"}
            className="text-[10px]"
          >
            {msg.role}
          </Badge>
          <div className="space-y-1">
            {(Array.isArray(msg.content) ? msg.content : [msg.content]).map(
              (item, j) => {
                switch (item.type) {
                  case "text": {
                    const trimmed = item.text.trim();
                    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
                      try {
                        return (
                          <JsonHighlight
                            key={j}
                            code={JSON.stringify(JSON.parse(trimmed), null, 2)}
                          />
                        );
                      } catch {
                        // Not JSON
                      }
                    }
                    return (
                      <div key={j} className="text-xs whitespace-pre-wrap">
                        {item.text}
                      </div>
                    );
                  }
                  case "image":
                    return (
                      <img
                        key={j}
                        src={`data:${item.mimeType};base64,${item.data}`}
                        alt="Prompt content"
                        className="max-w-full rounded border"
                      />
                    );
                  case "resource":
                    return (
                      <div
                        key={j}
                        className="text-xs font-mono bg-muted p-1 rounded"
                      >
                        {item.resource.uri}
                        {item.resource.text && (
                          <div className="mt-1 whitespace-pre-wrap">
                            {item.resource.text}
                          </div>
                        )}
                      </div>
                    );
                  default:
                    return null;
                }
              },
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

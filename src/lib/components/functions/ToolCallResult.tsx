import type { ToolCallResult } from "@lib/types/functions";
import { JsonHighlight } from "@lib/components/ui/JsonHighlight";
import { Badge } from "@lib/components/ui/badge";

interface ToolCallResultViewProps {
  result: ToolCallResult;
}

export function ToolCallResultView({ result }: ToolCallResultViewProps) {
  if (result.isError) {
    return (
      <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
        {result.content.map((item, i) => (
          <div key={i}>
            {item.type === "text" && <span>{item.text}</span>}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {result.content.map((item, i) => {
        switch (item.type) {
          case "text": {
            // Try to render as JSON if it looks like JSON
            const trimmed = item.text.trim();
            if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
              try {
                const formatted = JSON.stringify(JSON.parse(trimmed), null, 2);
                return <JsonHighlight key={i} code={formatted} />;
              } catch {
                // Not JSON, render as text
              }
            }
            return (
              <div key={i} className="text-xs bg-muted p-2 rounded whitespace-pre-wrap font-mono">
                {item.text}
              </div>
            );
          }
          case "image":
            return (
              <div key={i} className="space-y-1">
                <Badge variant="outline" className="text-[10px]">{item.mimeType}</Badge>
                <img
                  src={`data:${item.mimeType};base64,${item.data}`}
                  alt="Tool result"
                  className="max-w-full rounded border"
                />
              </div>
            );
          case "audio":
            return (
              <div key={i} className="space-y-1">
                <Badge variant="outline" className="text-[10px]">{item.mimeType}</Badge>
                <audio controls className="w-full">
                  <source src={`data:${item.mimeType};base64,${item.data}`} type={item.mimeType} />
                </audio>
              </div>
            );
          case "resource":
            return (
              <div key={i} className="border rounded p-2 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">Resource</Badge>
                  <span className="text-xs font-mono truncate">{item.resource.uri}</span>
                </div>
                {item.resource.text && (
                  <div className="text-xs bg-muted p-2 rounded whitespace-pre-wrap font-mono">
                    {item.resource.text}
                  </div>
                )}
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}

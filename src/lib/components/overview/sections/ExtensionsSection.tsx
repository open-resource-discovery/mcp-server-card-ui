import { useState } from "react";
import type { MetaObject } from "../../../types/mcp-protocol";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@lib/components/ui/card";
import { JsonHighlight } from "@lib/components/ui/JsonHighlight";
import { Braces, Copy, Check, ExternalLink } from "lucide-react";

interface ExtensionsSectionProps {
  meta: MetaObject;
}

const URL_REGEX = /https?:\/\/[^\s<>"']+/g;

function isUrl(value: string): boolean {
  try {
    new URL(value);
    return /^https?:\/\//.test(value);
  } catch {
    return false;
  }
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center text-muted-foreground hover:text-foreground cursor-pointer rounded p-0.5 hover:bg-accent/50 opacity-0 group-hover/ext:opacity-100 transition-opacity"
      title="Copy"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

function renderStringWithLinks(value: string) {
  if (isUrl(value)) {
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-sm text-primary hover:underline break-all"
      >
        <ExternalLink className="h-3 w-3 shrink-0" />
        {value}
      </a>
    );
  }

  const parts: (string | React.JSX.Element)[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  URL_REGEX.lastIndex = 0;
  while ((match = URL_REGEX.exec(value)) !== null) {
    if (match.index > lastIndex) {
      parts.push(value.slice(lastIndex, match.index));
    }
    const url = match[0];
    parts.push(
      <a
        key={match.index}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline"
      >
        {url}
      </a>,
    );
    lastIndex = match.index + url.length;
  }
  if (lastIndex < value.length) {
    parts.push(value.slice(lastIndex));
  }

  return parts.length > 1 ? <>{parts}</> : value;
}

export function ExtensionsSection({ meta }: ExtensionsSectionProps) {
  const entries = Object.entries(meta).filter(([, v]) => v !== undefined);

  if (entries.length === 0) return null;

  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Braces className="h-4 w-4" />
          Extensions (_meta)
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <div className="flex flex-col gap-3">
          {entries.map(([key, value]) => (
            <div key={key} className="flex flex-col gap-1 group/ext">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-xs font-medium">{key}</span>
                <CopyButton
                  text={
                    typeof value === "object" && value !== null
                      ? JSON.stringify(value, null, 2)
                      : String(value)
                  }
                />
              </div>
              {typeof value === "object" && value !== null ? (
                <JsonHighlight code={JSON.stringify(value, null, 2)} showCopy />
              ) : (
                <span className="text-sm text-muted-foreground break-all">
                  {renderStringWithLinks(String(value))}
                </span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

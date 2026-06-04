import { useState } from "react";
import type { RemoteTransport } from "../../../types/mcp-protocol";
import { SectionCard, CollapsibleSection } from "@open-resource-discovery/ui-components";
import { Globe, Copy, Check } from "lucide-react";

interface RemotesSectionProps {
  remotes: RemoteTransport[];
}

function CopyableUrl({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group/url inline-flex items-center gap-1.5 py-1">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono text-xs text-muted-foreground hover:text-primary hover:underline break-all"
      >
        {url}
      </a>
      <button
        type="button"
        onClick={handleCopy}
        className="shrink-0 inline-flex items-center text-muted-foreground hover:text-foreground cursor-pointer rounded p-0.5 hover:bg-accent/50 opacity-0 group-hover/url:opacity-100 transition-opacity"
        title="Copy"
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      </button>
    </div>
  );
}

export function RemotesSection({ remotes }: RemotesSectionProps) {
  return (
    <SectionCard.Root data-testid="remotes-section">
      <SectionCard.Header icon={<Globe />} title="Remote Transports" />
      <SectionCard.Content>
        {remotes.map((remote, idx) => (
          <CollapsibleSection.Root key={idx} data-testid={`remote-item-${idx}`}>
            <CollapsibleSection.Trigger>
              {remote.type}
            </CollapsibleSection.Trigger>
            <CollapsibleSection.Content>
              <div className="pb-4 pt-0 flex flex-col gap-2 pl-2">
                <CopyableUrl url={remote.url} />
                {remote.headers && remote.headers.length > 0 && (
                  <div className="flex flex-col gap-1 pl-2 border-l-2 border-muted">
                    <p className="text-xs font-medium text-muted-foreground">Headers</p>
                    {remote.headers.map((header, hIdx) => (
                      <div key={hIdx} className="font-mono text-xs">
                        {Object.entries(header).map(([key, value]) => (
                          <span key={key}>
                            <span className="text-muted-foreground">{key}:</span>{" "}
                            <span>{String(value)}</span>
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CollapsibleSection.Content>
          </CollapsibleSection.Root>
        ))}
      </SectionCard.Content>
    </SectionCard.Root>
  );
}

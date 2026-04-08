import { useState, useEffect, useRef } from "react";
import { ChevronDown, Copy, Check, Clock, AlertCircle, CheckCircle, Play, X, GitBranch, Loader2 } from "lucide-react";
import { Badge } from "@lib/components/ui/badge";
import { Button } from "@lib/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@lib/components/ui/collapsible";
import { JsonHighlight } from "@lib/components/ui/JsonHighlight";
import { cn } from "@lib/utils/cn";
import type { MCPLogEntry } from "@lib/types/mcpLog";
import { sendRawRequest } from "@lib/utils/mcp-transport";
import { useMCPConnectionStore } from "@lib/stores/mcpConnectionStore";

interface MCPLogEntryCardProps {
  entry: MCPLogEntry;
  isHighlighted: boolean;
}

function CopyIconButton({ text }: { text: string }) {
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
      className="absolute top-1.5 right-1.5 inline-flex items-center text-muted-foreground hover:text-foreground cursor-pointer z-10 rounded p-0.5 hover:bg-accent/50"
      title="Copy"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

export function MCPLogEntryCard({ entry, isHighlighted }: MCPLogEntryCardProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedBody, setEditedBody] = useState("");
  const [editedHeaders, setEditedHeaders] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const url = useMCPConnectionStore((s) => s.url);

  useEffect(() => {
    if (isHighlighted) {
      setOpen(true);
      ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isHighlighted]);

  const isSuccess = entry.responseStatus !== undefined && entry.responseStatus >= 200 && entry.responseStatus < 300;
  const isError = !!entry.error || (entry.responseStatus !== undefined && entry.responseStatus >= 400);
  const isPending = entry.responseStatus === undefined && !entry.error;

  const formatJson = (str: string) => {
    try {
      return JSON.stringify(JSON.parse(str), null, 2);
    } catch {
      return str;
    }
  };

  const generateCurlFormat = () => {
    const esc = (s: string) => s.replace(/'/g, "'\\''");
    const headers = entry.requestHeaders
      ? Object.entries(entry.requestHeaders)
          .map(([key, value]) => `-H '${esc(key)}: ${esc(value)}'`)
          .join(" \\\n  ")
      : "";

    let curl = `curl -X POST '${esc(entry.url)}'`;
    if (headers) curl += ` \\\n  ${headers}`;
    if (entry.requestBody) curl += ` \\\n  -d '${esc(entry.requestBody)}'`;
    return curl;
  };

  const handleCopyCurl = async () => {
    await navigator.clipboard.writeText(generateCurlFormat());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartEdit = () => {
    setEditedBody(formatJson(entry.requestBody));
    setEditedHeaders(JSON.stringify(entry.requestHeaders ?? {}, null, 2));
    setEditError(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedBody("");
    setEditedHeaders("");
    setEditError(null);
  };

  const handleSendEdited = async () => {
    try {
      JSON.parse(editedBody);
    } catch {
      setEditError("Invalid JSON format in body");
      return;
    }

    let parsedHeaders: Record<string, string>;
    try {
      parsedHeaders = JSON.parse(editedHeaders);
      if (typeof parsedHeaders !== "object" || parsedHeaders === null) {
        throw new Error("Headers must be an object");
      }
    } catch {
      setEditError("Invalid JSON format in headers");
      return;
    }

    setIsSending(true);
    setEditError(null);

    try {
      const targetUrl = useMCPConnectionStore.getState().url || entry.url;
      await sendRawRequest(editedBody, targetUrl, parsedHeaders, entry.id);
      setIsEditing(false);
      setEditedBody("");
      setEditedHeaders("");
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setIsSending(false);
    }
  };

  const time = new Date(entry.timestamp).toLocaleTimeString();
  const headerCount = entry.requestHeaders ? Object.keys(entry.requestHeaders).length : 0;

  return (
    <div
      ref={ref}
      data-testid="mcp-log-entry"
      className={cn(
        "rounded-lg border bg-card overflow-hidden transition-colors cursor-pointer",
        isHighlighted && "ring-2 ring-primary",
      )}
    >
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="flex w-full items-center justify-between p-3 text-left hover:bg-accent/50 cursor-pointer">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {isSuccess && <CheckCircle className="h-4 w-4 text-success shrink-0" />}
              {isError && <AlertCircle className="h-4 w-4 text-destructive shrink-0" />}
              {isPending && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />}

              {entry.responseStatus && (
                <Badge variant={isSuccess ? "success" : "destructive"} className="text-xs shrink-0">
                  {entry.responseStatus}
                </Badge>
              )}

              <Badge variant="outline" className="text-xs font-mono shrink-0">
                {entry.method}
              </Badge>

              {entry.derivedFromLogId && (
                <span title="Modified from previous request">
                  <GitBranch className="h-3 w-3 text-muted-foreground shrink-0" />
                </span>
              )}

              <span className="text-xs text-muted-foreground truncate">{entry.url}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex flex-col items-end text-xs text-muted-foreground">
              {entry.durationMs !== undefined && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {entry.durationMs}ms
                </span>
              )}
              <span className="text-[10px]">{time}</span>
            </div>
            <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t p-3 space-y-4">
            <div className="flex justify-end gap-2">
              {!isEditing && (
                <>
                  <Button variant="outline" size="sm" onClick={handleStartEdit} disabled={!url}>
                    <Play className="h-3 w-3 mr-1" />
                    Edit & Resend
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCopyCurl}>
                    {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                    {copied ? "Copied" : "Copy as cURL"}
                  </Button>
                </>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <h4 className="text-xs font-semibold mb-2">Edit Headers</h4>
                  <textarea
                    value={editedHeaders}
                    onChange={(e) => setEditedHeaders(e.target.value)}
                    className="w-full h-32 font-mono text-[11px] bg-muted p-2 rounded border resize-y focus:outline-none focus:ring-2 focus:ring-primary"
                    spellCheck={false}
                    placeholder='{"Content-Type": "application/json", ...}'
                  />
                </div>
                <div>
                  <h4 className="text-xs font-semibold mb-2">Edit Request Body</h4>
                  <textarea
                    value={editedBody}
                    onChange={(e) => setEditedBody(e.target.value)}
                    className="w-full h-64 font-mono text-[11px] bg-muted p-2 rounded border resize-y focus:outline-none focus:ring-2 focus:ring-primary"
                    spellCheck={false}
                  />
                </div>
                {editError && <p className="text-xs text-destructive">{editError}</p>}
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={handleCancelEdit} disabled={isSending}>
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                  <Button variant="default" size="sm" onClick={handleSendEdited} disabled={isSending}>
                    <Play className="h-3 w-3 mr-1" />
                    {isSending ? "Sending..." : "Send"}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <h4 className="text-xs font-semibold mb-2">Request</h4>
                  <div className="space-y-2">
                    <div className="text-xs font-mono bg-muted p-2 rounded break-all">
                      POST {entry.url}
                    </div>
                    {headerCount > 0 && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          Headers ({headerCount})
                        </summary>
                        <div className="relative mt-1">
                          <CopyIconButton text={JSON.stringify(entry.requestHeaders, null, 2)} />
                          <JsonHighlight code={JSON.stringify(entry.requestHeaders, null, 2)} />
                        </div>
                      </details>
                    )}
                    <details open className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Body</summary>
                      <div className="relative mt-1">
                        <CopyIconButton text={formatJson(entry.requestBody)} />
                        <JsonHighlight code={formatJson(entry.requestBody)} />
                      </div>
                    </details>
                  </div>
                </div>

                {entry.responseBody && (
                  <div>
                    <h4 className="text-xs font-semibold mb-2">Response</h4>
                    <div className="space-y-2">
                      {entry.responseStatus && (
                        <div className={cn("text-xs font-mono p-2 rounded", isSuccess ? "bg-success/10" : "bg-destructive/10")}>
                          HTTP {entry.responseStatus}
                        </div>
                      )}
                      <details open className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Body</summary>
                        <div className="relative mt-1">
                          <CopyIconButton text={formatJson(entry.responseBody)} />
                          <JsonHighlight code={formatJson(entry.responseBody)} />
                        </div>
                      </details>
                    </div>
                  </div>
                )}

                {entry.error && (
                  <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                    Error: {entry.error}
                  </div>
                )}
              </>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

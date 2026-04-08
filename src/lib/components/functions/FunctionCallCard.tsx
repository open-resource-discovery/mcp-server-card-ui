import { useState, useEffect } from "react";
import { ChevronDown, Clock, AlertCircle, CheckCircle, Loader2, RotateCcw, Wrench, MessageSquare } from "lucide-react";
import { Badge } from "@lib/components/ui/badge";
import { Button } from "@lib/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@lib/components/ui/collapsible";
import { JsonHighlight } from "@lib/components/ui/JsonHighlight";
import { cn } from "@lib/utils/cn";
import type { FunctionCall, ToolCallResult, PromptResult } from "@lib/types/functions";
import { ToolCallResultView } from "./ToolCallResult";
import { PromptResultView } from "./PromptResult";
import { useFunctionsStore } from "@lib/stores/functionsStore";
import { useUIStore } from "@lib/stores/uiStore";

interface FunctionCallCardProps {
  call: FunctionCall;
}

export function FunctionCallCard({ call }: FunctionCallCardProps) {
  const [open, setOpen] = useState(call.status === "completed" || call.status === "error");
  const { retryCall } = useFunctionsStore();

  useEffect(() => {
    if (call.status === "completed" || call.status === "error") {
      setOpen(true);
    }
  }, [call.status]);
  const { switchToRawHttp } = useUIStore();

  const isPending = call.status === "pending";
  const isCompleted = call.status === "completed";
  const isError = call.status === "error";

  const time = new Date(call.timestamp).toLocaleTimeString();

  return (
    <div
      className="rounded-lg border bg-card overflow-hidden"
      data-testid="function-call-card"
    >
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="flex w-full items-center justify-between p-3 text-left hover:bg-accent/50 cursor-pointer">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {isPending && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />}
            {isCompleted && <CheckCircle className="h-4 w-4 text-success shrink-0" />}
            {isError && <AlertCircle className="h-4 w-4 text-destructive shrink-0" />}

            {call.type === "tool" ? (
              <Wrench className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            ) : (
              <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            )}

            <Badge variant="outline" className="text-xs font-mono shrink-0">
              {call.name}
            </Badge>

            <span className="text-xs text-muted-foreground capitalize shrink-0">{call.type}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex flex-col items-end text-xs text-muted-foreground">
              {call.durationMs !== undefined && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {call.durationMs}ms
                </span>
              )}
              <span className="text-[10px]">{time}</span>
            </div>
            <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t p-3 space-y-3">
            <div>
              <h4 className="text-xs font-semibold mb-1">Input</h4>
              <JsonHighlight code={JSON.stringify(call.input, null, 2)} />
            </div>

            {isCompleted && call.result && (
              <div>
                <h4 className="text-xs font-semibold mb-1">Result</h4>
                {call.type === "tool" ? (
                  <ToolCallResultView result={call.result as ToolCallResult} />
                ) : (
                  <PromptResultView result={call.result as PromptResult} />
                )}
              </div>
            )}

            {isError && call.error && (
              <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                Error: {call.error}
              </div>
            )}

            <div className="flex gap-2">
              {(isCompleted || isError) && (
                <Button variant="ghost" size="sm" onClick={() => retryCall(call.id)}>
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              )}
              {call.logId && (
                <Button variant="ghost" size="sm" onClick={() => switchToRawHttp(call.logId)}>
                  View HTTP
                </Button>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

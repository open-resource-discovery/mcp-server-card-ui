import { useFunctionsStore } from "@lib/stores/functionsStore";
import { FunctionCallCard } from "./FunctionCallCard";
import { FunctionInput } from "./FunctionInput";
import { Button } from "@lib/components/ui/button";
import { Trash2, Wrench } from "lucide-react";
import { ScrollArea } from "@lib/components/ui/scroll-area";

export function FunctionsPanel() {
  const { calls, clearCalls } = useFunctionsStore();

  return (
    <div className="flex h-full flex-col" data-testid="functions-panel">
      {/* Call history */}
      <div className="flex-1 overflow-hidden">
        <div className="flex items-center justify-between p-4 pb-2">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              Function Calls ({calls.length})
            </span>
          </div>
          {calls.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearCalls}>
              <Trash2 className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>

        <ScrollArea className="h-[calc(100%-2.5rem)] px-4">
          {calls.length > 0 ? (
            <div className="space-y-2 pb-4">
              {calls.map((call) => (
                <FunctionCallCard key={call.id} call={call} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <Wrench className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm font-medium">No function calls yet</p>
              <p className="text-xs">
                Select a tool or prompt below and execute it
              </p>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Input section */}
      <FunctionInput />
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import type { ServerCapabilities } from "../../../types/mcp-protocol";
import { SectionCard, Badge } from "@open-resource-discovery/ui-components";
import { ChevronDown, ChevronUp, Puzzle } from "lucide-react";

interface CapabilitiesSectionProps {
  capabilities: ServerCapabilities;
}

const CAPABILITY_LABELS: Record<string, string> = {
  tools: "Tools",
  resources: "Resources",
  prompts: "Prompts",
  logging: "Logging",
  completions: "Completions",
  tasks: "Tasks",
  experimental: "Experimental",
};

function renderSubProps(value: unknown): string[] {
  if (value === null || value === undefined || typeof value !== "object")
    return [];
  return Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => (typeof v === "boolean" ? (v ? k : null) : `${k}: ${JSON.stringify(v)}`))
    .filter((s): s is string => s !== null);
}

interface ExpandableBadgeProps {
  label: string;
  subProps: string[];
  testId: string;
}

function ExpandableBadge({ label, subProps, testId }: ExpandableBadgeProps) {
  const [open, setOpen] = useState(false);
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });
  const badgeRef = useRef<HTMLSpanElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleOutsideClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  function handleClick() {
    if (!open && badgeRef.current) {
      const rect = badgeRef.current.getBoundingClientRect();
      setPopupPos({ top: rect.bottom + 4, left: rect.left });
    }
    setOpen((o) => !o);
  }

  return (
    <div ref={wrapperRef} className="inline-flex">
      <Badge
        ref={badgeRef}
        variant="secondary"
        data-testid={testId}
        className="cursor-pointer gap-1"
        onClick={handleClick}
      >
        {label}
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </Badge>
      {open && (
        <div
          style={{ position: "fixed", top: popupPos.top, left: popupPos.left, fontFamily: "inherit" }}
          className="z-50 rounded-md border bg-popover p-2 shadow-md"
        >
          <div className="flex flex-col gap-0.5">
            {subProps.map((s) => (
              <span key={s} className="text-[11px] text-popover-foreground">{s}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function CapabilitiesSection({ capabilities }: CapabilitiesSectionProps) {
  const entries = Object.entries(capabilities).filter(
    ([, v]) => v !== undefined && v !== null,
  );

  if (entries.length === 0) return null;

  return (
    <SectionCard.Root data-testid="capabilities-section">
      <SectionCard.Header icon={<Puzzle />} title="Capabilities" />
      <SectionCard.Content>
        <div className="flex flex-wrap gap-2">
          {entries.map(([key, value]) => {
            const subProps = renderSubProps(value);
            const label = CAPABILITY_LABELS[key] ?? key;

            return subProps.length > 0 ? (
              <ExpandableBadge
                key={key}
                label={label}
                subProps={subProps}
                testId={`capability-${key}`}
              />
            ) : (
              <Badge key={key} variant="secondary" data-testid={`capability-${key}`}>
                {label}
              </Badge>
            );
          })}
        </div>
      </SectionCard.Content>
    </SectionCard.Root>
  );
}

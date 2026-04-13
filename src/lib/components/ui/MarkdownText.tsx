import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@lib/utils/cn";
import { Button } from "@lib/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

interface MarkdownTextProps {
  text: string;
  clampLines?: number;
  className?: string;
}

export function MarkdownText({
  text,
  clampLines = 3,
  className,
}: MarkdownTextProps) {
  const [expanded, setExpanded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [isClamped, setIsClamped] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const check = () => {
      el.style.webkitLineClamp = "unset";
      el.style.display = "-webkit-box";
      el.style.webkitBoxOrient = "vertical";
      el.style.overflow = "visible";
      const fullHeight = el.scrollHeight;

      el.style.webkitLineClamp = String(clampLines);
      el.style.overflow = "hidden";
      const clampedHeight = el.clientHeight;

      el.style.webkitLineClamp = "";
      el.style.display = "";
      el.style.webkitBoxOrient = "";
      el.style.overflow = "";

      setIsClamped(fullHeight > clampedHeight);
    };

    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text, clampLines]);

  return (
    <div className={className}>
      <div
        ref={ref}
        className={cn(
          "prose prose-sm dark:prose-invert max-w-none prose-p:my-1! prose-headings:my-2! prose-ul:my-1! prose-ol:my-1! prose-li:my-0! prose-a:text-primary",
          !expanded && `line-clamp-${clampLines}`,
        )}
      >
        <ReactMarkdown>{text}</ReactMarkdown>
      </div>
      {isClamped && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs mt-1"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3 mr-1" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 mr-1" />
              Show more
            </>
          )}
        </Button>
      )}
    </div>
  );
}

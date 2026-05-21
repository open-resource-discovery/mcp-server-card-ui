import { CodeBlock } from "@open-resource-discovery/ui-components";

interface JsonHighlightProps {
  code: string;
  className?: string;
  showCopy?: boolean;
}

export function JsonHighlight({
  code,
  className,
  showCopy = false,
}: JsonHighlightProps) {
  return (
    <CodeBlock
      code={code}
      language="json"
      showCopyButton={showCopy}
      className={className}
    />
  );
}

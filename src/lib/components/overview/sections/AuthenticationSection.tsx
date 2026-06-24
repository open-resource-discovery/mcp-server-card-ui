import type { Authentication } from "../../../types/mcp-protocol";
import { SectionCard } from "@open-resource-discovery/ui-components";
import { Badge } from "@lib/components/ui/badge";
import { ShieldCheck } from "lucide-react";

interface AuthenticationSectionProps {
  authentication: Authentication;
}

export function AuthenticationSection({
  authentication,
}: AuthenticationSectionProps) {
  return (
    <SectionCard.Root>
      <SectionCard.Header icon={<ShieldCheck />} title="Authentication" />
      <SectionCard.Content>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            {authentication.required ? (
              <Badge variant="secondary">Required</Badge>
            ) : (
              <Badge variant="secondary">Optional</Badge>
            )}
          </div>

          {authentication.schemas && authentication.schemas.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm text-muted-foreground">
                Supported Schemas
              </span>
              <div className="flex flex-wrap gap-2">
                {authentication.schemas.map((schema) => (
                  <Badge key={schema} variant="outline">
                    {schema}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </SectionCard.Content>
    </SectionCard.Root>
  );
}

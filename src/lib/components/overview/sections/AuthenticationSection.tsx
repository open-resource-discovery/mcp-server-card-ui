import type { Authentication } from "@sap/mcp-protocol";
import { Card, CardContent, CardHeader, CardTitle } from "@lib/components/ui/card";
import { Badge } from "@lib/components/ui/badge";
import { ShieldCheck } from "lucide-react";

interface AuthenticationSectionProps {
  authentication: Authentication;
}

export function AuthenticationSection({ authentication }: AuthenticationSectionProps) {
  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <ShieldCheck className="h-4 w-4" />
          Authentication
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
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
              <span className="text-sm text-muted-foreground">Supported Schemas</span>
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
      </CardContent>
    </Card>
  );
}

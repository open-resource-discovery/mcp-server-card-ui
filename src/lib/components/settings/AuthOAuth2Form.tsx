import { useMCPConnectionStore } from "@lib/stores/mcpConnectionStore";
import { Input } from "@lib/components/ui/input";
import { PasswordInput } from "@lib/components/ui/PasswordInput";
import { Button } from "@lib/components/ui/button";
import { Loader2 } from "lucide-react";

export function AuthOAuth2Form() {
  const {
    oauth2Credentials,
    setOAuth2Credentials,
    fetchOAuth2Token,
    startAuthCodeFlow,
    isTokenLoading,
    tokenError,
    isAuthFlowInProgress,
    cancelAuthFlow,
  } = useMCPConnectionStore();

  const hasAuthorizationUrl = !!oauth2Credentials.authorizationUrl;

  return (
    <div className="space-y-2">
      <Input
        placeholder="Client ID"
        value={oauth2Credentials.clientId}
        onChange={(e) => setOAuth2Credentials({ clientId: e.target.value })}
      />
      <PasswordInput
        placeholder="Client Secret"
        value={oauth2Credentials.clientSecret}
        onChange={(e) => setOAuth2Credentials({ clientSecret: e.target.value })}
      />
      <Input
        placeholder="Token URL"
        value={oauth2Credentials.tokenUrl}
        onChange={(e) => setOAuth2Credentials({ tokenUrl: e.target.value })}
      />
      <Input
        placeholder="Authorization URL (for auth code flow)"
        value={oauth2Credentials.authorizationUrl ?? ""}
        onChange={(e) => setOAuth2Credentials({ authorizationUrl: e.target.value })}
      />
      <Input
        placeholder="Scopes (space-separated)"
        value={oauth2Credentials.scopes}
        onChange={(e) => setOAuth2Credentials({ scopes: e.target.value })}
      />
      <Input
        placeholder="Redirect URI (optional)"
        value={oauth2Credentials.redirectUri ?? ""}
        onChange={(e) => setOAuth2Credentials({ redirectUri: e.target.value })}
      />

      {oauth2Credentials.accessToken && (
        <p className="text-xs text-success">Token acquired</p>
      )}

      <div className="flex gap-2">
        {isAuthFlowInProgress ? (
          <Button variant="outline" size="sm" onClick={cancelAuthFlow}>
            Cancel
          </Button>
        ) : (
          <>
            <Button
              size="sm"
              onClick={fetchOAuth2Token}
              disabled={isTokenLoading || !oauth2Credentials.tokenUrl}
            >
              {isTokenLoading ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : null}
              Client Credentials
            </Button>
            {hasAuthorizationUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={startAuthCodeFlow}
                disabled={isTokenLoading}
              >
                Auth Code (PKCE)
              </Button>
            )}
          </>
        )}
      </div>

      {tokenError && <p className="text-xs text-destructive">{tokenError}</p>}
    </div>
  );
}

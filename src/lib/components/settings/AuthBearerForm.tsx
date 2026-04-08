import { useMCPConnectionStore } from "@lib/stores/mcpConnectionStore";
import { PasswordInput } from "@lib/components/ui/PasswordInput";

export function AuthBearerForm() {
  const { bearerCredentials, setBearerCredentials } = useMCPConnectionStore();

  return (
    <div className="space-y-2">
      <PasswordInput
        placeholder="Bearer Token"
        value={bearerCredentials.token}
        onChange={(e) => setBearerCredentials({ token: e.target.value })}
      />
    </div>
  );
}

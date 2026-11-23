import { Input } from "@lib/components/ui/input";
import { PasswordInput } from "@lib/components/ui/PasswordInput";
import { useMCPConnectionStore } from "@lib/stores/mcpConnectionStore";

export function AuthBasicForm() {
  const { basicCredentials, setBasicCredentials } = useMCPConnectionStore();

  return (
    <div className="space-y-2">
      <Input
        placeholder="Username"
        value={basicCredentials.username}
        onChange={(e) => setBasicCredentials({ username: e.target.value })}
      />
      <PasswordInput
        placeholder="Password"
        value={basicCredentials.password}
        onChange={(e) => setBasicCredentials({ password: e.target.value })}
      />
    </div>
  );
}

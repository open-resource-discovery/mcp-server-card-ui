import { Switch as LibSwitch } from "@open-resource-discovery/ui-components";
import type { ComponentPropsWithoutRef } from "react";

export function Switch(props: ComponentPropsWithoutRef<typeof LibSwitch.Root>) {
  return (
    <LibSwitch.Root {...props}>
      <LibSwitch.Thumb />
    </LibSwitch.Root>
  );
}

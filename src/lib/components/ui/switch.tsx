import { forwardRef } from "react";
import { Switch as LibSwitch } from "@open-resource-discovery/ui-components";
import type { ComponentPropsWithoutRef } from "react";

export const Switch = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<typeof LibSwitch.Root>
>(function Switch(props, ref) {
  return (
    <LibSwitch.Root ref={ref} {...props}>
      <LibSwitch.Thumb />
    </LibSwitch.Root>
  );
});
Switch.displayName = "Switch";

import {
  Select as LibSelect,
  SimpleSelect,
} from "@open-resource-discovery/ui-components";
import { usePortalContainer } from "@lib/components/ThemeRoot";
import type { ComponentPropsWithoutRef } from "react";

function SelectPortalInRoot(
  props: ComponentPropsWithoutRef<typeof LibSelect.Portal>,
) {
  const container = usePortalContainer() ?? null;
  return <LibSelect.Portal {...props} container={container} />;
}

export const Select = {
  ...LibSelect,
  Portal: SelectPortalInRoot,
} as typeof LibSelect;
export { SimpleSelect };

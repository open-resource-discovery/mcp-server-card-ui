// @base-ui/react used directly: ui-components exports CollapsibleSection (opinionated composite),
// not the raw open/close primitive needed here.
import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";

export const Collapsible = BaseCollapsible.Root;
export const CollapsibleTrigger = BaseCollapsible.Trigger;
export const CollapsibleContent = BaseCollapsible.Panel;

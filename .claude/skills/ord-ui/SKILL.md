---
name: ord-ui
description: Use when working with `@open-resource-discovery/ui-components` — building UI with its Button, Input, Card, Tabs, Combobox, etc., or theming it via `.ord-ui` CSS tokens. Covers imports, the ThemeRoot wrapper, design tokens, and dark-mode setup.
---

# @open-resource-discovery/ui-components

A React component library built on Base UI (`@base-ui/react`) with Tailwind v4 theming. Components are unstyled-by-default primitives wrapped with token-driven Tailwind utilities.

## Install

```bash
npm install @open-resource-discovery/ui-components
```

Peer deps: `react@^18 || ^19`, `react-dom@^18 || ^19`. Optional peers: `shiki` (for `CodeBlock`), `@monaco-editor/react` (for `CodeEditor`).

## Set up

Two things are required at the app root:

```tsx
import "@open-resource-discovery/ui-components/styles";
import { ThemeRoot } from "@open-resource-discovery/ui-components";

export default function App() {
  return (
    <ThemeRoot defaultTheme="system">
      <YourApp />
    </ThemeRoot>
  );
}
```

`ThemeRoot` renders a `<div class="ord-ui">` that scopes the component styles. Without it, components render without theme tokens. `defaultTheme` accepts `'light' | 'dark' | 'system'`.

## Imports

Every component is a named export from the package root — never deep-import:

```tsx
import { Button, Card, Tabs, Tooltip } from "@open-resource-discovery/ui-components";
```

## Composition

Most components follow Base UI's compound-part API: `Component.Root`, `Component.Trigger`, `Component.Popup`, etc. Convenience wrappers exist for the common-shape cases:

- `SimpleSelect` instead of `Select.Root + Select.Trigger + Select.Popup + …`
- `SimpleCombobox` instead of the full Combobox tree
- `SimpleCard` instead of `Card.Root + Card.Header + Card.Title + …`

Reach for the `Simple*` form first; drop to compound parts only when you need extra slots or custom layout.

## Theming

Override CSS variables on `.ord-ui` (or any ancestor):

```css
.ord-ui {
  --ord-primary: oklch(0.55 0.2 260);
  --ord-primary-foreground: oklch(0.98 0 0);
  --ord-radius: 0.75rem;
}
```

Available tokens (light + dark variants resolved automatically when `.ord-ui.dark` is applied):
`--ord-background`, `--ord-foreground`, `--ord-primary`, `--ord-secondary`, `--ord-muted`, `--ord-accent`, `--ord-destructive`, `--ord-success`, `--ord-warning`, `--ord-border`, `--ord-ring`, `--ord-card`, `--ord-popover`, plus the `-foreground` pair for each.

Tailwind aliases — `bg-primary`, `text-foreground`, `border-border`, etc. — resolve to those tokens via the `@theme inline` block in the library's CSS, so consumer Tailwind classes Just Work as long as the consumer has Tailwind v4 set up.

## Component reference

Live, interactive docs: <https://open-resource-discovery.github.io/ui-components/>

When asked to use a component, link the user to its Storybook page rather than guessing the API.

## When to use this skill

Use whenever the user mentions:

- `@open-resource-discovery/ui-components` or "ord-ui" or "ord components"
- Any of the components by name (Button, Input, Combobox, Tabs, Tooltip, Avatar, Card, etc.) **in the context of this library**
- `.ord-ui` CSS class or `--ord-*` design tokens
- `ThemeRoot` / `useTheme` from this library

Don't fire on generic "build a button" — only when the request is rooted in this library.

# Tree expand

> File or category tree with spring expand/collapse, indentation guides, a selection highlight that glides between rows, and full arrow-key, Enter and type-ahead navigation.

Animated tree view for React and shadcn with keyboard navigation

Page: https://goodui.dev/components/lists/tree-expand

## Install

```bash
npx shadcn@latest add @goodui/tree-expand
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/tree-expand.json`. The file lands in `components/goodui/tree-expand.tsx`.

## When to use

- File and document browsers: invoices by year, client folders, exports.
- Picking from nested categories, e.g. services grouped by category on a booking form.
- Navigation for deep settings or docs where the hierarchy itself helps people find things.

## When not to use

- One level of sections with rich content inside: use accordion-height.
- Searching a large flat list of commands or pages: use command-palette-morph.
- Records with a summary row and actions: use expandable-row-list.

## Pick by what matters

| Need | Use |
| --- | --- |
| File browser where clicking a folder opens it | toggleOnSelect (default true) |
| Folders are selectable on their own (e.g. pick a target folder) | toggleOnSelect={false}: the chevron toggles, the row selects |
| Deep trees where levels are easy to lose | guides (default true), indent={18} |
| Shallow category picker | guides={false} indent={24} |

## Usage

```tsx
import * as React from "react"
import { FileText, Folder, FolderOpen } from "lucide-react"
import { TreeExpand, type TreeExpandNode } from "@/components/goodui/tree-expand"

const folder = { icon: <Folder />, openIcon: <FolderOpen /> }

const DOCUMENTS: TreeExpandNode[] = [
  {
    id: "invoices",
    label: "Invoices",
    ...folder,
    children: [
      { id: "inv-1042", label: "INV-1042 Ava Thompson.pdf", icon: <FileText />, meta: "84 KB" },
      { id: "inv-1043", label: "INV-1043 Noah Kim.pdf", icon: <FileText />, meta: "79 KB" },
    ],
  },
  {
    id: "contracts",
    label: "Contracts",
    ...folder,
    children: [{ id: "lease", label: "Studio lease 2026.pdf", icon: <FileText />, meta: "1.1 MB" }],
  },
  { id: "pricelist", label: "Price list.pdf", icon: <FileText />, meta: "156 KB" },
]

export function DocumentTree() {
  const [file, setFile] = React.useState<TreeExpandNode | null>(null)
  return (
    <div className="space-y-2">
      <TreeExpand
        label="Documents"
        nodes={DOCUMENTS}
        defaultExpanded={["invoices"]}
        onSelectedChange={(_, node) => setFile(node && !node.children ? node : null)}
      />
      <p className="text-xs text-muted-foreground">{file ? `Selected: ${file.label}` : "Nothing selected"}</p>
    </div>
  )
}
```

### Controlled expand / collapse all

```tsx
const [expanded, setExpanded] = React.useState<string[]>([])
const allFolders = ["invoices", "contracts"]

<button onClick={() => setExpanded(expanded.length ? [] : allFolders)}>
  {expanded.length ? "Collapse all" : "Expand all"}
</button>
<TreeExpand label="Documents" nodes={DOCUMENTS} expanded={expanded} onExpandedChange={setExpanded} />
```

### Category picker where only leaves are selectable

```tsx
const [service, setService] = React.useState<string | null>(null)

<TreeExpand
  label="Services"
  nodes={SERVICES}
  guides={false}
  indent={24}
  selected={service}
  onSelectedChange={(id, node) => {
    if (id && node && !node.children) setService(id)
  }}
/>
```

## API

### TreeExpand

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| nodes (required) | `TreeExpandNode[]` | — | Top-level nodes. |
| expanded | `string[]` | — | Expanded node ids (controlled). |
| defaultExpanded | `string[]` | `[]` | Node ids expanded on first render (uncontrolled). |
| onExpandedChange | `(expanded: string[]) => void` | — | Called with the new list of expanded ids when a folder opens or closes. |
| selected | `string \| null` | — | Selected node id (controlled). |
| defaultSelected | `string \| null` | `null` | Node id selected on first render (uncontrolled). |
| onSelectedChange | `(id: string \| null, node: TreeExpandNode \| null) => void` | — | Called with the id and node when a row is clicked or chosen with Enter or Space. |
| guides | `boolean` | `true` | Draw vertical indentation guides. |
| indent | `number` | `18` | Pixels per nesting level. |
| toggleOnSelect | `boolean` | `true` | Clicking a parent row (or pressing Enter on it) also expands or collapses it. |
| label | `string` | `"Tree"` | Accessible name of the tree. |

Also accepts every <ul> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| ArrowDown / ArrowUp | Moves focus to the next or previous visible row (no wrap). |
| ArrowRight | On a closed folder, expands it; on an open folder, moves to its first child. Mirrored (ArrowLeft) under dir="rtl". |
| ArrowLeft | On an open folder, collapses it; otherwise moves to the parent folder. Mirrored (ArrowRight) under dir="rtl". |
| Home / End | Moves focus to the first or last visible row. |
| Enter / Space | Selects the focused row; on a folder with toggleOnSelect, also opens or closes it. |
| a–z, 0–9 | Type-ahead: jumps to the next visible row whose label starts with the typed letters (letters typed within 600 ms combine). |
| Tab | The tree is one tab stop; focus enters on the focused, selected or first row. |

## Accessibility

- Uses the ARIA tree pattern: role="tree" named by label, role="treeitem" rows with aria-level, aria-expanded on folders, aria-selected, and role="group" for children.
- Roving tabindex: only one row is in the tab order, the rest are reached with the arrow keys.
- Disabled nodes get aria-disabled and cannot be selected; clicks, the chevron, Enter and the arrow keys never expand or collapse them, but they stay reachable with the arrow keys.
- The focus ring is drawn on the row only, not around the whole open subtree.
- Icons, chevrons and the selection highlight are aria-hidden.

## Motion

- Children open by animating height to auto on a spring (bounce 0, 0.34 s) with a 0.2 s fade in and a 0.14 s fade out.
- The chevron turns 90° and the selection highlight glides from row to row (shared layoutId), both on a spring (stiffness 500, damping 40).
- Reduced motion: all of these use duration 0, so folders open and the selection moves instantly.

## Notes for AI

- Node ids must be unique across the whole tree, not just among siblings.
- A node is a folder only if it has a non-empty children array; folder icons are just icon/openIcon.
- onSelectedChange fires for folders too; check node.children to accept only leaves.
- When passing selected (controlled), update it from onSelectedChange or the selection never moves.
- label on a node must be plain text: it is used for type-ahead.

## FAQ

**How do I expand or collapse everything?**

Pass expanded and onExpandedChange, then set expanded to every folder id, or to [].

**Can a folder be selected without opening it?**

Yes, set toggleOnSelect={false}. Clicking the row selects it; clicking the chevron or pressing ArrowRight/ArrowLeft opens and closes it.

## Related

- accordion-height: https://goodui.dev/components/lists/accordion-height
- expandable-row-list: https://goodui.dev/components/lists/expandable-row-list
- command-palette-morph: https://goodui.dev/components/navigation/command-palette-morph

Last updated: 2026-11-02

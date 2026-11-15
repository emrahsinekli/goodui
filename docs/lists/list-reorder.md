# List reorder

> Drag-to-reorder list with a grip handle, a lifted shadow on the dragged row, neighbours that spring into place, and Alt+Arrow keyboard moves announced to screen readers.

Drag and drop reorderable list for React and shadcn with keyboard moves

Page: https://goodui.dev/components/lists/list-reorder

## Install

```bash
npx shadcn@latest add @goodui/list-reorder
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/list-reorder.json`. The file lands in `components/goodui/list-reorder.tsx`.

## When to use

- Letting people set an order that matters: services on a booking page, staff priority, pipeline stages.
- Short lists (up to a few dozen rows) where dragging is faster than typing a position number.
- When the order must also be changeable from the keyboard, with screen reader announcements.

## When not to use

- Sorting data by a column (date, amount): sort the array and show it in table-row-presence.
- Dragging between columns or into nested groups (kanban, trees): this list reorders only within itself, vertically.
- Lists that only change by new items arriving: use animated-list.

## Pick by what matters

| Need | Use |
| --- | --- |
| Rows with their own buttons or inputs | handle="start" (default) or handle="end", so only the grip starts a drag |
| Simple rows where the whole row should be grabbable | handle="none": each row becomes focusable and moves with the arrow keys |

## Usage

```tsx
import * as React from "react"
import { ListReorder } from "@/components/goodui/list-reorder"

type Service = { id: string; name: string; minutes: number }

export function ServiceOrder() {
  const [services, setServices] = React.useState<Service[]>([
    { id: "cut", name: "Haircut", minutes: 45 },
    { id: "color", name: "Full color", minutes: 120 },
    { id: "blow", name: "Blow-dry", minutes: 30 },
    { id: "beard", name: "Beard trim", minutes: 20 },
  ])

  return (
    <ListReorder
      label="Services order on the booking page"
      items={services}
      onReorder={setServices}
      getKey={(s) => s.id}
      getLabel={(s) => s.name}
      renderItem={(s, { index }) => (
        <div className="flex items-center justify-between gap-3">
          <span className="truncate text-sm font-medium">
            {index + 1}. {s.name}
          </span>
          <span className="text-xs text-muted-foreground">{s.minutes} min</span>
        </div>
      )}
    />
  )
}
```

### Grip on the end, translated announcements

```tsx
<ListReorder
  items={stages}
  onReorder={setStages}
  getKey={(s) => s.id}
  getLabel={(s) => s.title}
  handle="end"
  labels={{
    handle: (label, pos, count) => `${label} neu anordnen, Position ${pos} von ${count}`,
    moved: (label, pos, count) => `${label} auf Position ${pos} von ${count} verschoben`,
  }}
  renderItem={(s) => <span className="text-sm">{s.title}</span>}
/>
```

### Whole row draggable

```tsx
<ListReorder
  handle="none"
  items={staff}
  onReorder={setStaff}
  getKey={(m) => m.id}
  getLabel={(m) => m.name}
  renderItem={(m) => <span className="text-sm font-medium">{m.name}</span>}
/>
```

## API

### ListReorder

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| items (required) | `T[]` | — | Items in their current order (controlled). |
| onReorder (required) | `(items: T[]) => void` | — | Called with the whole list in its new order after a drag step or keyboard move; store it back into `items`. |
| getKey (required) | `(item: T) => string` | — | Stable unique key of an item. Also the default for `getLabel`. |
| renderItem (required) | `(item: T, state: ListReorderRenderState) => React.ReactNode` | — | Content of a row. `state.index` is the current position, `state.dragging` is true while that row is held. |
| getLabel | `(item: T) => string` | `getKey` | Plain-text name of an item, used for the handle label and screen reader announcements. |
| handle | `"start" \| "end" \| "none"` | `"start"` | Where the grip sits. "none" makes the whole row draggable. |
| label | `string` | `"Reorderable list"` | Accessible name of the list. |
| itemClassName | `string` | — | Classes added to every row (<li>). |
| labels | `Partial<ListReorderLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <div> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| ArrowUp / ArrowDown | On a focused grip handle, moves that row up or down one position (stops at the ends). |
| ArrowUp / ArrowDown (handle="none") | On a focused row, moves that row one position. |
| Alt + ArrowUp / Alt + ArrowDown | With focus on anything inside a row, moves that row one position. |
| Tab | Moves between grip handles and the rows' own controls. |

## Accessibility

- With handle="none" each row is focusable (tabIndex 0, visible focus ring) and described by the same text as the grip label (labels.handle).
- The grip is a real <button> whose aria-label names the item and its position ("Reorder Haircut, position 2 of 4. Use the arrow keys to move.").
- Keyboard moves and drops are announced through an assertive live region, using getLabel for the item name.
- The list is a <ul> named by the label prop; every announcement and the handle label can be translated through labels.

## Motion

- Rows spring into their new place (stiffness 520, damping 42) as the dragged row passes them.
- The held row scales to 1.025 and gets a primary-tinted border and a large shadow (CSS, 200 ms).
- Reduced motion: no lift scale, and rows move to their new place instantly; dragging still works.

## Notes for AI

- The list is controlled: items plus onReorder are required, and onReorder must store the new array (setItems), or nothing moves.
- getKey must return a stable unique id, never the array index.
- Pass getLabel returning plain text; without it the key is read out to screen readers.
- With handle="none" the row itself takes focus and moves with plain arrows; keep renderItem free of extra buttons unless they are needed (Alt+Arrow still works from inside them).
- onReorder fires while dragging, not only on drop; debounce saving to the server.

## FAQ

**How do I save the new order?**

onReorder gives you the full array in its new order. Store it in state and persist it, preferably debounced, because it fires on every step of a drag.

**Does it work on touch screens?**

Yes. The grip (or the whole row with handle="none") sets touch-action: none so a drag does not scroll the page.

## Related

- table-row-presence: https://goodui.dev/components/lists/table-row-presence
- animated-list: https://goodui.dev/components/lists/animated-list
- expandable-row-list: https://goodui.dev/components/lists/expandable-row-list

Last updated: 2026-11-02

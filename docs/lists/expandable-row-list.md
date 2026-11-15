# Expandable row list

> Appointment rows that open inline into a raised card with notes and working actions, while neighbouring rows smoothly make room.

Expandable list rows for React and shadcn that open inline into a detail card

Page: https://goodui.dev/components/lists/expandable-row-list

## Install

```bash
npx shadcn@latest add @goodui/expandable-row-list
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/expandable-row-list.json`. The file lands in `components/goodui/expandable-row-list.tsx`.

## When to use

- Lists of records where details and actions only matter for one at a time: appointments, invoices, orders.
- Mobile-friendly alternative to a details page or side panel: the row opens in place and keeps context.
- Schedules where the row summary (time, client, status) is enough to scan, and notes or actions sit one tap away.

## When not to use

- Plain question-and-answer or settings sections with a title: use accordion-height.
- Data that needs columns, sorting and comparison across rows: use table-row-presence.
- A single card that expands into a large view: use expandable-card or morphing-dialog.

## Pick by what matters

| Need | Use |
| --- | --- |
| Focus on one record at a time | type="single" (default) |
| Compare details of several rows | type="multiple" |
| Tighter or looser lift around the open row | gap (default 10, px) |

## Usage

```tsx
import { ExpandableRowList } from "@/components/goodui/expandable-row-list"

type Appointment = { id: string; time: string; client: string; service: string; notes: string }

export function TodaySchedule({ appointments, onCancel }: { appointments: Appointment[]; onCancel: (id: string) => void }) {
  return (
    <ExpandableRowList
      items={appointments}
      getKey={(a) => a.id}
      renderRow={(a, { expanded }) => (
        <div className="flex items-center gap-3">
          <span className="w-12 shrink-0 text-xs font-medium tabular-nums">{a.time}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{a.client}</p>
            <p className="truncate text-xs text-muted-foreground">{expanded ? "Details below" : a.service}</p>
          </div>
        </div>
      )}
      renderDetails={(a, { collapse }) => (
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">{a.notes}</p>
          <div className="flex gap-2">
            <button type="button" onClick={collapse}>Close</button>
            <button type="button" onClick={() => onCancel(a.id)}>Cancel appointment</button>
          </div>
        </div>
      )}
    />
  )
}
```

### Controlled, several rows open

```tsx
const [open, setOpen] = React.useState<string[]>([])

<ExpandableRowList
  type="multiple"
  value={open}
  onValueChange={setOpen}
  items={invoices}
  getKey={(i) => i.id}
  renderRow={(i) => <InvoiceSummary invoice={i} />}
  renderDetails={(i) => <InvoiceLines invoice={i} />}
/>
```

## API

### ExpandableRowList

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| items (required) | `T[]` | — | Rows in display order. Adding or removing items animates the row height in or out. |
| getKey (required) | `(item: T) => string` | — | Stable unique key of a row. Any characters are fine: it is escaped before it goes into element ids. |
| renderRow (required) | `(item: T, state: { expanded: boolean }) => React.ReactNode` | — | The always-visible summary of a row. Keep it free of buttons: the whole row is the toggle. |
| renderDetails (required) | `(item: T, state: { collapse: () => void }) => React.ReactNode` | — | Details shown when the row opens. `collapse` closes it and returns focus to the row. |
| type | `"single" \| "multiple"` | `"single"` | "single" opens one row at a time. |
| value | `string[]` | — | Expanded row keys (controlled). |
| defaultValue | `string[]` | `[]` | Row keys open on first render (uncontrolled). |
| onValueChange | `(value: string[]) => void` | — | Called with the new list of open row keys when a row opens or closes. |
| gap | `number` | `10` | Space the open row lifts away from its neighbours, in px. |

Also accepts every <ul> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Enter / Space | Opens or closes the focused row (native <button>). |
| ArrowDown / ArrowUp | Moves focus to the next or previous row, stopping at the ends. |
| Home / End | Moves focus to the first or last row. |
| Escape | With focus anywhere in an open row, including its details, closes it and returns focus to the row. |

## Accessibility

- Each row summary is a native <button> with aria-expanded and aria-controls pointing at its details while they are open (closed details are not in the DOM).
- Open details have role="region" and aria-labelledby set to the row, and unmount when closed.
- collapse() from renderDetails closes the row and moves focus back to its button, so keyboard users are not left on a removed element.
- renderRow renders inside the button: keep it free of buttons and links (nested interactive elements are invalid).

## Motion

- The open row lifts away from its neighbours by gap/2 above and below and becomes a bordered card with a shadow; margins and height move on a spring (bounce 0.12, 0.42 s), the card colors on a 300 ms CSS transition.
- Details grow to their height on the same spring; their opacity fades in over 0.18 s after 0.06 s, and the content slides down 6px.
- The chevron turns 180° on a spring (stiffness 420, damping 30).
- Rows added to or removed from items grow in or collapse out the same way.
- Reduced motion: every transition has duration 0; rows open, close, lift and appear instantly.

## Notes for AI

- Put actions (buttons, links) in renderDetails, never in renderRow, which renders inside the toggle button.
- getKey must be stable and unique, and free of spaces: it is used in element ids for aria-controls.
- Use the collapse function passed to renderDetails for Close or after an action, so focus returns to the row.
- In single mode, clicking the open row closes it; there is no prop to keep one row always open.
- Details unmount when the row closes: keep edited values in a parent if they must survive.

## FAQ

**How is this different from accordion-height?**

accordion-height renders a fixed header (icon, title, description). Here you render the whole row and the details yourself, and the open row lifts into a card, which suits records with actions.

**Can I remove a row from inside its details?**

Yes. Remove the item from the items array (for example in a Cancel handler); the row collapses out and its neighbours close the gap.

## Related

- accordion-height: https://goodui.dev/components/lists/accordion-height
- table-row-presence: https://goodui.dev/components/lists/table-row-presence
- expandable-card: https://goodui.dev/components/cards/expandable-card
- morphing-dialog: https://goodui.dev/components/overlays/morphing-dialog

Last updated: 2026-11-02

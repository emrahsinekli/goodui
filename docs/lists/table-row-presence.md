# Table row presence

> Data table where new rows grow in with a brief highlight, removed rows slide out and collapse, and re-sorting glides every row to its new position.

Animated data table for React and shadcn: rows enter, leave and re-sort smoothly

Page: https://goodui.dev/components/lists/table-row-presence

## Install

```bash
npx shadcn@latest add @goodui/table-row-presence
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/table-row-presence.json`. The file lands in `components/goodui/table-row-presence.tsx`.

## When to use

- Tables that change while people look at them: today's bookings, live orders, a queue being worked through.
- Re-sorting by a column, so people can follow where a row went instead of the table jumping.
- Removing or adding rows from row actions (cancel, archive, add), where a sudden jump hides what changed.

## When not to use

- Large tables (hundreds of rows) or virtualised grids: every row is a motion element; use a plain table there.
- Letting people set the order by hand: use list-reorder.
- Values updating inside a fixed set of rows (prices, stock counts): use cell-flash on the cells instead.

## Usage

```tsx
import * as React from "react"
import { TableRowPresence, type TableRowPresenceColumn } from "@/components/goodui/table-row-presence"

type Booking = { id: string; client: string; service: string; time: string; price: number }

const columns: TableRowPresenceColumn<Booking>[] = [
  { key: "client", header: "Client", cell: (b) => <span className="font-medium">{b.client}</span> },
  { key: "service", header: "Service", cell: (b) => b.service, className: "hidden sm:table-cell" },
  { key: "time", header: "Time", cell: (b) => b.time, className: "w-20" },
  { key: "price", header: "Price", cell: (b) => `$${b.price}`, align: "right" },
]

export function TodayBookings({ bookings }: { bookings: Booking[] }) {
  const [sortBy, setSortBy] = React.useState<"time" | "price">("time")
  const rows = [...bookings].sort((a, b) => (sortBy === "time" ? a.time.localeCompare(b.time) : b.price - a.price))

  return (
    <div className="space-y-3">
      <button type="button" onClick={() => setSortBy(sortBy === "time" ? "price" : "time")}>
        Sort by {sortBy === "time" ? "price" : "time"}
      </button>
      <TableRowPresence
        rows={rows}
        columns={columns}
        getRowId={(b) => b.id}
        caption="Bookings for today"
        empty="No bookings today."
      />
    </div>
  )
}
```

### Remove a row from an action in the row

```tsx
const columns: TableRowPresenceColumn<Invoice>[] = [
  { key: "number", header: "Invoice", cell: (i) => i.number },
  { key: "amount", header: "Amount", cell: (i) => formatMoney(i.amount), align: "right" },
  {
    key: "actions",
    header: <span className="sr-only">Actions</span>,
    align: "right",
    cell: (i) => (
      <button type="button" onClick={() => setInvoices((list) => list.filter((x) => x.id !== i.id))}>
        Archive
      </button>
    ),
  },
]
```

## API

### TableRowPresence

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| rows (required) | `T[]` | — | Rows in display order. Add, remove or re-sort this array and the table animates the difference. |
| columns (required) | `TableRowPresenceColumn<T>[]` | — | Column definitions, in order. |
| getRowId (required) | `(row: T) => string` | — | Stable unique id of a row; rows are matched across renders by it. |
| highlightNew | `boolean` | `true` | Briefly tint rows that arrive after the first render. |
| empty | `React.ReactNode` | `"No rows"` | Shown in a full-width row when there are no rows. |
| caption | `React.ReactNode` | — | Table caption, shown below the table. |
| onRowClick | `(row: T) => void` | — | Makes rows clickable: pointer cursor, and each row becomes focusable and activates with Enter or Space. |

Also accepts every <table> attribute.

## Accessibility

- Renders a real <table> with <th scope="col"> headers and an optional <caption>, so screen readers read it as a table.
- With onRowClick, rows are focusable (tabIndex 0, visible focus outline) and activate with Enter or Space when the row itself has focus; keys inside cell buttons and links are left alone.
- For an actions column with no visible header, pass header as <span className="sr-only">Actions</span>.

## Motion

- New rows fade in and slide 12px in from the left while each cell grows from 0 to its height on a spring (bounce 0, 0.42 s), so rows below slide down instead of jumping.
- Rows added after the first render get a primary tint that fades out over 2.2 s (highlightNew, on by default). Rows present on the first render appear without it.
- Removed rows slide 24px to the right and fade out (0.2 s, ease-in) while their cells collapse and the gap closes.
- Re-sorting moves every row to its new position with a layout animation on the same spring.
- The empty-state row fades in after 0.2 s, once the last row has left.
- Reduced motion: no slides, no layout glide and no height animation; the new-row tint is effectively off (0.01 s).

## Performance

- Every row and cell is a motion element, and layout animation measures rows on change. It suits dashboard-sized tables, not hundreds of rows.

## Notes for AI

- The table is driven by the rows array: add, remove or sort it in state; there are no add/remove/sort methods or props.
- getRowId must return a stable unique id (a database id), never the index, or every row animates on each sort.
- Columns are { key, header, cell(row) } objects; use className such as "hidden sm:table-cell" to hide columns on phones.
- Sorting UI is not built in: render your own sort buttons and pass the sorted array.
- onRowClick rows are keyboard reachable, but a row is not announced as a button; for a primary action also keep a labelled button or link in a cell. align left/right map to start/end, so they mirror under RTL.

## FAQ

**How do I animate a sort?**

Sort a copy of the array and pass it as rows. Rows keep their ids, so each one glides to its new position.

**Can I turn off the highlight on new rows?**

Yes, pass highlightNew={false}. Rows still slide and grow in.

## Related

- list-reorder: https://goodui.dev/components/lists/list-reorder
- cell-flash: https://goodui.dev/components/numbers/cell-flash
- animated-list: https://goodui.dev/components/lists/animated-list
- expandable-row-list: https://goodui.dev/components/lists/expandable-row-list

Last updated: 2026-11-02

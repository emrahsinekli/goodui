# Table

> Lined, striped, bordered, card-row and minimal tables with tones, three densities, shadows and corner shapes, tint, accent-bar or lift hover, row state tones and selection, sortable headers with aria-sort, sticky header, caption, footer totals, skeleton and empty states, fade or stagger entrances, and rows that stack into labelled cards on small containers.

Beautiful React table for shadcn: striped, bordered or card rows, sticky header, row states and mobile stacking

Page: https://goodui.dev/components/core/table

## Install

```bash
npx shadcn@latest add @goodui/table
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/table.json`. The file lands in `components/goodui/table.tsx`.

## When to use

- Showing a small or medium static list: invoices, a team, today's schedule, plan comparisons.
- Rows that carry a state: overdue invoices tinted red, drafts grey (rowTone or TableRow tone).
- Simple client-side sorting by clicking headers, with an accessible sort button and aria-sort.
- Tables that must stay readable on phones: stack turns rows into label/value cards below a container width.

## When not to use

- Thousands of rows, inline editing, filters, column resizing or export: use data-grid.
- A list of items with avatars and actions and no columns to compare: use a list or card layout.
- Key figures at a glance: use stat-card.

## Pick by what matters

| Need | Use |
| --- | --- |
| Default app table | variant="lined" (default) |
| Long rows that are hard to follow | variant="striped" |
| Dense comparisons, spreadsheets-like | variant="bordered" density="compact" |
| Rows that feel like separate items (team, bookings) | variant="cards" hover="lift" |
| Inside a card that already has a border | variant="minimal" |
| Status per row | rowTone with columns + data, or tone on TableRow |
| Long tables | stickyHeader with maxHeight |
| Phones | stack="md" plus primary on the title column |

## Usage

```tsx
import { Table, type TableColumn } from "@/components/goodui/table"

type Invoice = { id: string; client: string; due: string; amount: number; status: "paid" | "overdue" }

const columns: TableColumn<Invoice>[] = [
  { key: "id", header: "Invoice", primary: true },
  { key: "client", header: "Client", sortable: true },
  { key: "due", header: "Due" },
  {
    key: "amount",
    header: "Amount",
    numeric: true,
    sortable: true,
    render: (r) => r.amount.toLocaleString("en-US", { style: "currency", currency: "USD" }),
  },
]

export function Invoices({ invoices }: { invoices: Invoice[] }) {
  return (
    <Table
      aria-label="Invoices"
      columns={columns}
      data={invoices}
      rowTone={(r) => (r.status === "overdue" ? "danger" : "none")}
      stack="md"
      caption="October invoices"
    />
  )
}
```

### Parts, like a plain <table>

```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/goodui/table"

<Table variant="striped" density="compact" aria-label="Schedule">
  <TableHeader>
    <TableRow>
      <TableHead>Time</TableHead>
      <TableHead>Client</TableHead>
      <TableHead numeric>Price</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow tone="info">
      <TableCell label="Time">09:30</TableCell>
      <TableCell label="Client">Omar D.</TableCell>
      <TableCell label="Price" numeric>$40</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Controlled sort (you sort the data)

```tsx
const [sort, setSort] = React.useState<TableSort | null>({ key: "rating", direction: "desc" })
const rows = React.useMemo(() => sortTeam(team, sort), [team, sort])

<Table columns={columns} data={rows} sort={sort} onSortChange={setSort} variant="cards" hover="lift" />
```

### Clickable, selectable rows

```tsx
<Table
  columns={columns}
  data={team}
  selectedKeys={picked}
  onRowClick={(r) => togglePicked(r.id)}
  aria-label="Team"
/>
```

## API

### Table

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| variant | `"lined" \| "striped" \| "bordered" \| "cards" \| "minimal"` | `"lined"` | lined (default), striped, bordered (every cell), cards (each row a separate card) or minimal (no frame). |
| tone | `"primary" \| "neutral" \| "success" \| "warning" \| "danger" \| "info"` | `"primary"` | Accent for the sort arrow, selected rows, the accent hover bar and focus rings. |
| density | `"compact" \| "normal" \| "relaxed"` | `"normal"` | Cell padding and text size. |
| shadow | `"none" \| "sm" \| "md" \| "lg"` | `"none"` | Frame shadow. Ignored by minimal. |
| shape | `"square" \| "rounded" \| "soft"` | `"rounded"` | Corner radius of the frame (and of each row in cards). |
| animation | `"none" \| "fade" \| "stagger"` | `"none"` | fade or stagger rows in on mount; remount (change key) to replay. |
| hover | `"none" \| "tint" \| "accent" \| "lift"` | `"tint"` | Row hover style. |
| stack | `"never" \| "sm" \| "md" \| "lg"` | `"never"` | Below this container width (sm 480px, md 640px, lg 768px) rows turn into cards with a label per value. |
| stickyHeader | `boolean` | `false` | Keeps the header visible while scrolling. With maxHeight it sticks inside the table's own scroll box. |
| maxHeight | `number \| string` | — | Makes the table scroll inside a box of this height (px number or CSS length). |
| caption | `React.ReactNode` | — |  |
| captionSide | `"top" \| "bottom"` | `"bottom"` |  |
| columns | `TableColumn<T>[]` | — | Columns for the data shorthand. With children, columns and data are ignored. |
| data | `T[]` | — |  |
| rowKey | `(row: T, index: number) => string` | — | Stable key per row; defaults to row.id, then the index. |
| rowTone | `(row: T, index: number) => TableRowTone \| undefined` | — | State color per row: a tinted background and a start-edge marker. |
| selectedKeys | `string[]` | — | Keys of rows drawn as selected. |
| onRowClick | `(row: T, index: number) => void` | — | Makes rows clickable and focusable (Enter or Space activates). |
| sort | `TableSort \| null` | — | Sort (controlled). null means unsorted. |
| defaultSort | `TableSort \| null` | `null` |  |
| onSortChange | `(sort: TableSort \| null) => void` | — | Called when a sortable header is clicked: asc, desc, then unsorted. With sort controlled, sort the data yourself. |
| loading | `boolean` | `false` | Shows skeleton rows instead of data. |
| loadingRows | `number` | `4` | Number of skeleton rows. |
| empty | `React.ReactNode` | — | Replaces the default empty text. |
| tableClassName | `string` | — | Classes for the inner <table>. className goes on the outer frame. |
| children | `React.ReactNode` | — | Parts, for full control of the markup. |
| labels | `Partial<TableLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <table> attribute.

### TableHeader

Also accepts every <thead> attribute.

### TableBody

Also accepts every <tbody> attribute.

### TableFooter

Also accepts every <tfoot> attribute.

### TableRow

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| tone | `"none" \| TableTone` | — | State color: tinted background and a start-edge marker (paid, overdue, pending…). |
| selected | `boolean` | — | Draws the row as selected (tone tint + marker) and sets aria-selected. |

Also accepts every <tr> attribute.

### TableHead

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| align | `"start" \| "center" \| "end"` | — |  |
| numeric | `boolean` | — | End-aligned tabular figures. |
| sortable | `boolean` | — | Wraps the header text in a sort button with an arrow. |
| sort | `TableSortDirection \| false` | — | Current direction for this column, or false when unsorted. |
| onSort | `() => void` | — |  |

Also accepts every <th> attribute.

### TableCell

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| align | `"start" \| "center" \| "end"` | — |  |
| numeric | `boolean` | — |  |
| label | `string` | — | Label shown before the value when rows are stacked as cards. |
| primary | `boolean` | — | In stacked mode this cell is the card title. |
| hideWhenStacked | `boolean` | — | Hidden when rows are stacked as cards. |

Also accepts every <td> attribute.

### TableCaption

Also accepts every <caption> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Tab | Moves through sort buttons in the header and, when onRowClick is set, through the rows. |
| Enter / Space | On a sort button: asc, desc, then unsorted. On a clickable row: calls onRowClick. |
| Arrow keys | When the table scrolls (maxHeight, or wider than its container), Tab focuses the scroll box and arrows scroll it. |

## Accessibility

- It renders a real <table> with <th scope="col">, so screen readers announce headers with each cell. Pass aria-label or a caption to name it.
- Sortable headers are <button>s inside the <th>; the <th> gets aria-sort (ascending or descending) and the button reads ", sorted ascending" (labels.sortedAscending / sortedDescending).
- Selected rows get aria-selected. Row tones are color plus a start-edge bar; also show the state as text (a badge) so it does not rely on color alone.
- When stack is set, explicit table, rowgroup, row, columnheader and cell roles are added, because display:block can drop table semantics in some browsers. Stacked cells show their column label from data-label (columns: label or header text; parts: the label prop).
- Loading shows skeleton rows with a visually hidden "Loading" (labels.loading) and aria-busy on the body; the empty state text comes from empty or labels.empty.
- When the table can scroll (maxHeight, or wider than its container), the scroll box becomes a focusable role="region" named by the caption, the table's aria-label or labels.scrollRegion, so keyboard users can scroll it.

## Motion

- fade: body rows fade in over 350 ms on mount. stagger: rows rise 6px and fade in over 400 ms, 35 ms apart, capped at the 13th row (455 ms). Remount (change key) to replay.
- hover lift moves the row up 1px over 180 ms; tint and accent change the background; the sort arrow turns 180° in 200 ms between ascending and descending.
- Reduced motion: entrances, transitions and the lift are off, and the skeleton shimmer stops.

## Performance

- Pure CSS for every layer (one shared <style> tag). The only measurement is one ResizeObserver that checks horizontal overflow to make the scroll box focusable. Sorting with columns + data is a stable in-memory sort with Intl.Collator (numeric, case-insensitive).
- It renders every row. For hundreds of rows or more, use data-grid, which virtualizes.

## Notes for AI

- Two APIs: columns + data (sorting, empty, loading, footer, stacking labels handled for you) or the parts (Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption). With children, columns and data are ignored.
- Column objects: { key, header, label?, accessor?, render?, sortValue?, sortable?, align?, numeric?, width?, footer?, primary?, hideWhenStacked?, className? }. key is also the property read from each row.
- With sort controlled (sort + onSortChange) the table does not sort data; sort it yourself. Uncontrolled (defaultSort) sorts for you; empty values stay last.
- className goes on the outer frame; tableClassName and other props go on the <table>. stickyHeader sticks to the page unless maxHeight makes the table its own scroll box.
- Row keys default to row.id, then the index; pass rowKey when ids are missing. Do not invent props like pagination or filters: use data-grid.

## FAQ

**How do I make it work on mobile?**

Set stack="sm", "md" or "lg". Below 480, 640 or 768px of container width (a container query, so it reacts to the table's own width, not the viewport) each row becomes a card with a label before every value. Mark the title column primary and hide minor ones with hideWhenStacked.

**Can I use it with server-side sorting?**

Yes: pass sort and onSortChange, fetch sorted data in the handler, and pass the result as data.

## Related

- data-grid: https://goodui.dev/components/core/data-grid
- pagination: https://goodui.dev/components/core/pagination
- badge: https://goodui.dev/components/core/badge
- avatar: https://goodui.dev/components/core/avatar
- stat-card: https://goodui.dev/components/core/stat-card

Last updated: 2026-11-03

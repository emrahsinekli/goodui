# Data Grid

> Virtualized data grid for 100k+ rows with typed columns (number, currency, percent, date, boolean, badge, avatar, actions) formatted by Intl, multi-sort, per-column filters and global search, resize, drag reorder, pin, hide, Shift-range selection with a bulk action bar, inline editing with sync or async validation, spreadsheet keyboard navigation, expandable rows, footer aggregates, CSV and real .xlsx export, loading, empty and error states, server mode with pagination, RTL and tones, densities and variants.

React data grid for shadcn with 100k-row virtualization, inline editing, filters and real Excel export

Page: https://goodui.dev/components/core/data-grid

## Install

```bash
npx shadcn@latest add @goodui/data-grid
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/data-grid.json`. The file lands in `components/goodui/data-grid.tsx`.

## When to use

- Large lists people work in: bookings, orders, invoices, clients, with thousands to 100,000+ rows in one scroll.
- Spreadsheet-like work: inline editing with validation, keyboard navigation, bulk actions on selected rows.
- Back-office views that need per-column filters, global search, multi-sort, column resize/reorder/pin/hide and CSV or .xlsx export.
- Server-backed lists: mode="server" reports sort, filters, search and page in one onQueryChange.

## When not to use

- A short static table (an invoice, a pricing comparison, a team of five): use table, which is lighter and fully semantic.
- Rows that are really cards with free layout: use a list or cards.
- Pivoting, grouping rows by column or charts inside the grid: not built in.

## Pick by what matters

| Need | Use |
| --- | --- |
| Default app grid | variant="lined" density="normal" |
| Very long rows | variant="striped" |
| Spreadsheet feel | variant="bordered" density="compact" |
| Inside a card | variant="minimal" shadow="none" |
| Many rows in one scroll | client mode (default): virtualized, no pagination needed |
| Page-by-page in the browser | pagination |
| Rows live on the server | mode="server" with rowCount and onQueryChange |
| Calm UI | animation="fade" (default) or "none"; "spring" adds row glides and an edit flash |

## Usage

```tsx
import * as React from "react"
import { Bell } from "lucide-react"
import { DataGrid, type DataGridColumn } from "@/components/goodui/data-grid"

type Booking = { id: string; client: string; status: string; date: string; price: number; deposit: boolean }

export function Bookings({ initial }: { initial: Booking[] }) {
  const [rows, setRows] = React.useState(initial)

  // Keep columns stable (useMemo or module scope): the grid caches sort keys and the search index per columns + data.
  const columns = React.useMemo<DataGridColumn<Booking>[]>(
    () => [
      { id: "client", header: "Client", type: "avatar", pin: "start", aggregate: "count" },
      {
        id: "status",
        header: "Status",
        type: "badge",
        editable: true,
        options: [
          { value: "confirmed", label: "Confirmed", tone: "success" },
          { value: "pending", label: "Pending", tone: "warning" },
        ],
      },
      { id: "date", header: "Date", type: "date", editable: true },
      {
        id: "price",
        header: "Price",
        type: "currency",
        editable: true,
        aggregate: "sum",
        validate: (v) => (typeof v === "number" && v > 0 ? null : "Price must be above $0"),
      },
      { id: "deposit", header: "Deposit", type: "boolean", editable: true },
      { id: "actions", header: "", type: "actions", pin: "end", actions: [{ label: "Remind", icon: <Bell />, onClick: (b) => remind(b) }] },
    ],
    [],
  )

  return (
    <DataGrid
      aria-label="Bookings"
      columns={columns}
      data={rows}
      selectable
      exportFileName="bookings"
      onCellEdit={({ rowKey, columnId, value }) =>
        setRows((r) => r.map((b) => (b.id === rowKey ? { ...b, [columnId]: value } : b)))
      }
    />
  )
}
```

### Server mode with pagination

```tsx
const [query, setQuery] = React.useState<DataGridQuery>({ sort: [], filters: {}, search: "", page: 1, pageSize: 25 })
const { rows, total, loading, error, refetch } = useInvoices(query)

<DataGrid
  aria-label="Invoices"
  mode="server"
  columns={columns}
  data={rows}
  rowCount={total}
  loading={loading}
  error={error}
  onRetry={refetch}
  sort={query.sort}
  filters={query.filters}
  page={query.page}
  pageSize={query.pageSize}
  onQueryChange={setQuery}
/>
```

### Async save with a server error

```tsx
<DataGrid
  columns={columns}
  data={rows}
  onCellEdit={async ({ rowKey, columnId, value }) => {
    const res = await fetch(`/api/bookings/${rowKey}`, { method: "PATCH", body: JSON.stringify({ [columnId]: value }) })
    if (!res.ok) return "Couldn't save, try again" // shown under the cell, editor stays open
    setRows((r) => r.map((b) => (b.id === rowKey ? { ...b, [columnId]: value } : b)))
  }}
/>
```

### Bulk actions and expandable rows

```tsx
<DataGrid
  columns={columns}
  data={rows}
  selectable
  bulkActions={[
    { label: "Confirm", onClick: (_rows, keys) => confirmMany(keys) },
    { label: "Cancel", tone: "danger", onClick: (_rows, keys) => cancelMany(keys) },
  ]}
  renderExpanded={(b) => <BookingNotes booking={b} />}
/>
```

### Export helpers on their own

```tsx
import { buildCsv, buildXlsx, downloadFile } from "@/components/goodui/data-grid"

const bytes = buildXlsx(
  [{ header: "Client", width: 24 }, { header: "Amount", format: '"$"#,##0.00' }, { header: "Due", format: "yyyy-mm-dd" }],
  invoices.map((i) => [i.client, i.amount, new Date(i.due)]),
  "Invoices",
)
downloadFile(bytes, "invoices.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
```

## API

### DataGrid

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| columns (required) | `DataGridColumn<T>[]` | — |  |
| data (required) | `T[]` | — | Rows. In server mode: the current page. |
| aria-label | `string` | — | Defines a string value that labels the current element. Names the grid. |
| getRowId | `(row: T, index: number) => string` | — | Stable key per row; defaults to row.id, then the index. |
| variant | `"lined" \| "striped" \| "bordered" \| "minimal"` | `"lined"` | lined (default), striped, bordered or minimal (no frame). |
| tone | `"primary" \| "neutral" \| "success" \| "warning" \| "danger" \| "info"` | `"primary"` | Accent for sort arrows, selection, focus ring, chips and edits. |
| density | `"compact" \| "normal" \| "relaxed"` | `"normal"` | Row height and cell padding: compact 34px, normal 42px, relaxed 54px. |
| shadow | `"none" \| "sm" \| "md" \| "lg"` | `"sm"` | Frame shadow. Ignored by minimal. |
| shape | `"square" \| "rounded" \| "soft"` | `"rounded"` | Frame corner radius. |
| animation | `"none" \| "fade" \| "spring"` | `"fade"` | fade: menus and bulk bar fade. spring: they spring in, rows glide to new positions and edited cells flash. none: static. |
| height | `number \| string` | `480` | Maximum height of the scroll area (px number or CSS length). Shorter data shrinks the grid. |
| rowHeight | `number` | — | Overrides the density's row height (px). |
| locale | `string` | — | BCP 47 locale for Intl number and date formatting. Defaults to the GooduiLocaleProvider language, else en-US. |
| currency | `string` | `"USD"` | Default ISO currency for currency columns. |
| timeZone | `string` | — | Time zone for datetime columns (date-only values are always local calendar days). |
| rowTone | `(row: T) => DataGridRowTone \| undefined` | — | State color per row: tinted background and a start-edge marker. |
| toolbar | `boolean` | `true` | Shows the toolbar (search, filter chips, Columns, Export). |
| toolbarExtra | `React.ReactNode` | — | Extra toolbar content, placed before Columns and Export. |
| searchable | `boolean` | `true` |  |
| exportable | `boolean` | `true` |  |
| exportFileName | `string` | `"export"` | File name without extension. |
| columnMenu | `boolean` | `true` | Per-column menu with filter, sort, pin, move and hide. |
| showStatus | `boolean` | `true` | Row count line under the grid. |
| selectable | `boolean` | `false` | Adds a checkbox column. |
| selectedKeys | `string[]` | — |  |
| defaultSelectedKeys | `string[]` | `NO_KEYS` |  |
| onSelectionChange | `(keys: string[]) => void` | — |  |
| bulkActions | `DataGridBulkAction<T>[]` | — | Buttons in the floating bar shown while rows are selected. |
| sort | `DataGridSort[]` | — |  |
| defaultSort | `DataGridSort[]` | `NO_SORT` |  |
| onSortChange | `(sort: DataGridSort[]) => void` | — |  |
| filters | `DataGridFilters` | — |  |
| defaultFilters | `DataGridFilters` | `NO_FILTERS` |  |
| onFiltersChange | `(filters: DataGridFilters) => void` | — |  |
| search | `string` | — |  |
| defaultSearch | `string` | `""` |  |
| onSearchChange | `(search: string) => void` | — |  |
| columnState | `Partial<DataGridColumnState>` | — | Column order, widths, pins and hidden ids (controlled). Missing parts fall back to the column definitions. |
| defaultColumnState | `Partial<DataGridColumnState>` | `NO_STATE` |  |
| onColumnStateChange | `(state: DataGridColumnState) => void` | — |  |
| renderExpanded | `(row: T) => React.ReactNode` | — | Content of a row's expanded detail panel; adds an expand column. |
| expandedKeys | `string[]` | — |  |
| defaultExpandedKeys | `string[]` | `NO_KEYS` |  |
| onExpandedChange | `(keys: string[]) => void` | — |  |
| onCellEdit | `(edit: DataGridCellEdit<T>) => void \| string \| null \| Promise<void \| string \| null>` | — | Called with a validated edit. Update your data here. Return (or resolve) a string to show it as an error and keep the editor open. |
| aggregates | `Record<string, React.ReactNode>` | — | Footer values from the server, by column id (server mode, or to override). |
| loading | `boolean` | `false` | Skeleton rows when there is no data yet; a progress bar over existing rows. |
| error | `boolean \| React.ReactNode` | — | true or a message shows the error state. |
| onRetry | `() => void` | — | Adds a retry button to the error state. |
| emptyState | `React.ReactNode` | — | Replaces the empty-state content (no data, no filters). |
| mode | `"client" \| "server"` | `"client"` | client: the grid searches, filters, sorts and (optionally) pages. server: it only reports the query; data is the current page. |
| pagination | `boolean` | `false` | Client mode: pages instead of one virtualized scroll. Server mode pages whenever rowCount is set. |
| page | `number` | — |  |
| defaultPage | `number` | `1` |  |
| onPageChange | `(page: number) => void` | — |  |
| pageSize | `number` | — |  |
| defaultPageSize | `number` | `25` |  |
| onPageSizeChange | `(size: number) => void` | — |  |
| pageSizeOptions | `number[]` | `[10, 25, 50, 100]` |  |
| rowCount | `number` | — | Server mode: total rows on the server. |
| onQueryChange | `(query: DataGridQuery) => void` | — | Server mode: the full query after any sort, filter, search (debounced 250 ms) or page change. |
| overscan | `number` | `6` | Rows rendered beyond the viewport on each side. |
| labels | `Partial<DataGridLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <div> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Tab | The grid is one tab stop; focus lands on the last active cell (roving tabindex). |
| Arrow keys | Move between cells, header row included. Left and Right are mirrored under dir="rtl". |
| Home / End | First or last cell of the row. |
| Ctrl+Home / Ctrl+End | First header cell (and scroll to the top) / last cell of the last row. |
| Page Up / Page Down | Move up or down by one viewport of rows. |
| Enter (header) | Sort: ascending, descending, off. Shift+Enter adds the column to a multi-sort (shift-click works too). |
| Alt+Arrow Down, Shift+F10 or the Menu key (header) | Open the column menu: filter, sort, pin, move, hide. Escape closes it and returns focus. |
| Alt+Arrow Left / Right (header) | Resize the column by 16px. |
| Alt+Shift+Arrow Left / Right (header) | Move the column one place within its pin group. |
| Enter or F2 (cell) | Edit an editable cell (text selected). Booleans toggle. On the select or expand column, toggles. On an actions cell, focuses its first button. |
| Any character (cell) | Starts editing a text or number cell with that character. |
| Enter / Tab / Shift+Tab / Escape (editor) | Save and stay / save and move right / save and move left / cancel. Leaving the editor saves. |
| Space | Toggles the row checkbox on the select column (Shift+Space on any cell), a boolean cell, or the detail panel on the expand column. On the header checkbox, selects all filtered rows. |
| Ctrl/Cmd+A | Selects all filtered rows (selectable grids). |
| Escape / Arrow Left/Right / Tab (inside an actions cell) | Back to the cell / cycle between the cell's buttons. |

## Accessibility

- role="grid" with aria-rowcount (all rows, not just rendered ones), aria-colcount, aria-multiselectable when selectable, and aria-busy while loading. Rows carry aria-rowindex and aria-selected; cells carry aria-colindex. The expand toggle is a button with aria-expanded (aria-expanded on a row is only valid in a treegrid).
- Column headers have aria-sort and read "sorted ascending, sort priority 2" for multi-sort; aria-describedby points to a hint for the header keys (labels.headerHint). Editable cells are described by labels.editHint; read-only cells get aria-readonly when editing is enabled.
- The editor is a real <input> (text, date or datetime-local) or <select> named after the column. Validation errors are role="alert" and linked with aria-describedby and aria-invalid.
- Checkboxes are real inputs named "Select Maya Chen" (labels.selectRow, from the first text or avatar column). Expand buttons say "Show details for …". Icon-only actions are named "Send reminder, Maya Chen".
- Column menu, Columns and Export panels are portaled role="dialog" popovers: focus moves in, Tab is kept inside, Escape returns focus to the header or button that opened them.
- The row count is announced in a polite live region. Pass aria-label (or labels.grid) to name the grid.

## Motion

- fade (default): menus fade in 140 ms, the bulk action bar fades in 150 ms, detail panels fade in 180 ms, edited cells flash the tone color for 900 ms.
- spring: menus scale from 0.96 and move 4px (spring stiffness 520, damping 34, mass 0.7); the bulk bar rises 16px (stiffness 480, damping 32); rows glide to new positions over 280 ms after sorting or expanding; detail panels drop in 6px.
- none: no motion, no transitions, static skeleton and loading bar.
- Reduced motion behaves like none (after mount, so server and client render the same); CSS transitions and keyframes are also off through prefers-reduced-motion.

## Performance

- Rows are virtualized: only the visible window plus 6 rows each side (overscan) is in the DOM, positioned with transforms; expanded detail panels are measured with ResizeObserver. In our 100,000-row demo the body holds about 15 row elements at a 460px height.
- Sorting ranks text values once with Intl.Collator and caches numeric sort keys per column; the search index is built once (on search focus) with each distinct value formatted once. Caches are keyed by data and columns identity, so keep both stable.
- Search, filters and sort run through useDeferredValue so typing stays responsive. Edits replace one row in your array.
- Export builds CSV or a store-only .xlsx (ZIP written in the component, no dependencies) from the filtered, sorted, visible columns, or only the selected rows.

## Notes for AI

- Always pass a stable columns array (useMemo or module scope) and an id per row (or getRowId). Cell values are read from row[column.id] unless accessor is set.
- column.type drives format, alignment, sort, filter kind, editor and export cell type: text, number, currency, percent (0.25 = 25%), date ("YYYY-MM-DD" is a local day), datetime, boolean, badge (with options and tones), avatar (image, subtitle), actions.
- Edits do not mutate data: handle onCellEdit and update your state. Return or resolve a string to reject with a message. validate runs first.
- In mode="server" the grid does not sort, filter, search or page; it reports a DataGridQuery via onQueryChange (search debounced 250 ms). data is the current page and rowCount the total; aggregates come from the aggregates prop.
- Pins are "start"/"end" (logical, RTL-safe). On narrow grids, pins yield when they would cover more than about 55% of the width. Column order, widths, pins and hidden ids are one columnState object (controlled or uncontrolled).
- Every built-in string is in labels; number and date formatting follows locale (default en-US), currency and timeZone.
- Drag-to-reorder uses mouse or pen; on touch use the column menu's Move left/right.

## FAQ

**Is the Excel export a real .xlsx?**

Yes. It writes the Open XML parts (workbook, sheet, styles) into a ZIP in the browser, with typed numbers, dates and booleans, number formats per column (currency symbol, percent, yyyy-mm-dd), a bold frozen header row, an auto filter and column widths. CSV is UTF-8 with a BOM so Excel reads accents, and text starting with = + - @ is escaped against formula injection.

**How many rows can it handle?**

The demo runs 100,000 rows in client mode with sorting, filtering, search, selection and export. Beyond what fits in browser memory, use mode="server".

**Can I keep column layout between visits?**

Yes. Store the object from onColumnStateChange (order, widths, pinned, hidden) and pass it back as defaultColumnState or columnState.

**Does it work right to left?**

Yes. Layout uses logical properties, pins use start/end, arrow keys and resize drags mirror under dir="rtl", and popovers follow the direction.

## Related

- table: https://goodui.dev/components/core/table
- pagination: https://goodui.dev/components/core/pagination
- select: https://goodui.dev/components/core/select
- checkbox: https://goodui.dev/components/core/checkbox
- badge: https://goodui.dev/components/core/badge
- avatar: https://goodui.dev/components/core/avatar

Last updated: 2026-11-03

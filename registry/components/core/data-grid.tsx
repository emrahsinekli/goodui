"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion, useReducedMotion, type Transition } from "motion/react"
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, ChevronRight, Columns3, Download, EllipsisVertical, EyeOff, FileSpreadsheet, FileText, Minus, Pin, PinOff, RotateCcw, Search, TriangleAlert, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useGooduiLocale, useLabels } from "@/lib/goodui-locale"
import { Avatar } from "@/registry/components/core/avatar"
import { Badge, type BadgeTone } from "@/registry/components/core/badge"
import { Pagination } from "@/registry/components/core/pagination"
import { GooduiTokens, spring } from "@/lib/goodui-motion"

/*
 * A data grid with independent layers: every axis combines with every other.
 *   variant   lined, striped, bordered, minimal        tone       sort, selection, focus and edit accent
 *   density   compact, normal, relaxed                 shadow     frame elevation
 *   shape     square, rounded, soft                    animation  none, fade, spring (menus, bulk bar, row moves, edit flash)
 * Columns are typed (text, number, currency, percent, date, datetime, boolean, badge, avatar, actions) and formatted with Intl.
 * Built in: multi-sort (Shift), per-column filters (contains, number range, date range, select), global search, resize,
 * drag reorder, pin to start/end, hide/show, row selection with Shift ranges and select-all-filtered, bulk action bar,
 * inline editing with validation (sync or async), APG grid keyboard navigation, row virtualization (100k+ rows),
 * expandable rows, footer aggregates, CSV and real .xlsx export (store-only ZIP written below, no dependencies),
 * empty/loading/error states, client or server mode with pagination, RTL and a labels prop for every string.
 * Pass columns and data from useMemo or module scope: derived caches are keyed by their identity.
 */

export type DataGridVariant = "lined" | "striped" | "bordered" | "minimal"
export type DataGridTone = "primary" | "neutral" | "success" | "warning" | "danger" | "info"
export type DataGridDensity = "compact" | "normal" | "relaxed"
export type DataGridShadow = "none" | "sm" | "md" | "lg"
export type DataGridShape = "square" | "rounded" | "soft"
export type DataGridAnimation = "none" | "fade" | "spring"
export type DataGridColumnType = "text" | "number" | "currency" | "percent" | "date" | "datetime" | "boolean" | "badge" | "avatar" | "actions"
export type DataGridFilterKind = "text" | "number" | "date" | "select"
/** Number ranges are in the column's raw units (percent columns: 0.25 = 25%). Dates are "YYYY-MM-DD", inclusive. */
export type DataGridFilter =
  | { kind: "text"; value: string }
  | { kind: "number"; min?: number; max?: number }
  | { kind: "date"; from?: string; to?: string }
  | { kind: "select"; values: string[] }
export type DataGridFilters = Record<string, DataGridFilter>
export type DataGridSort = { id: string; desc: boolean }
export type DataGridPin = "start" | "end"
export type DataGridColumnState = { order: string[]; widths: Record<string, number>; pinned: Record<string, DataGridPin>; hidden: string[] }
export type DataGridOption = { value: string; label: string; tone?: BadgeTone }
export type DataGridRowTone = "none" | DataGridTone
export type DataGridAggregate = "sum" | "avg" | "count" | "min" | "max"
export type DataGridAction<T> = { label: string; icon?: React.ReactNode; tone?: "neutral" | "danger"; onClick: (row: T) => void; disabled?: (row: T) => boolean }
export type DataGridBulkAction<T> = { label: string; icon?: React.ReactNode; tone?: "neutral" | "danger"; onClick: (rows: T[], keys: string[]) => void }
export type DataGridCellEdit<T> = { row: T; rowKey: string; columnId: string; value: unknown; previous: unknown }
export type DataGridQuery = { sort: DataGridSort[]; filters: DataGridFilters; search: string; page: number; pageSize: number }

export type DataGridColumn<T> = {
  /** Unique id; also the row property read when there is no accessor. */
  id: string
  /** Header text; also used for the export header, menus and screen readers. */
  header: string
  /** Drives formatting, alignment, sorting, the filter kind, the editor and the export cell type. */
  type?: DataGridColumnType
  /** Row property or function returning the cell value. */
  accessor?: keyof T | ((row: T) => unknown)
  /** Width in px (resizable). */
  width?: number
  minWidth?: number
  maxWidth?: number
  /** Takes the free space. Without any grow column, the last unpinned column grows. */
  grow?: boolean
  align?: "start" | "center" | "end"
  /** Defaults to true (false for actions). */
  sortable?: boolean
  /** Filter kind; defaults by type (text, number range, date range, select for badge/boolean). false hides it. */
  filter?: DataGridFilterKind | false
  /** Included in the global search. Defaults to true except actions and boolean. */
  searchable?: boolean
  /** Values with labels and badge tones (badge type, select filter and select editor). */
  options?: DataGridOption[]
  /** Inline editing. Booleans toggle with Space or Enter; badge with options edits with a select. */
  editable?: boolean | ((row: T) => boolean)
  /** Return an error message to reject an edit. */
  validate?: (value: unknown, row: T) => string | null | undefined
  /** Display text override (also searched and used by text filters). */
  format?: (value: unknown, row: T) => string
  /** Custom cell content. */
  render?: (ctx: { value: unknown; row: T; rowKey: string; formatted: string }) => React.ReactNode
  /** Intl.NumberFormat options for number, currency and percent. */
  numberFormat?: Intl.NumberFormatOptions
  /** ISO currency code for this column; defaults to the grid's currency. */
  currency?: string
  /** Intl.DateTimeFormat options for date and datetime. */
  dateFormat?: Intl.DateTimeFormatOptions
  /** Avatar image URL (avatar type). */
  image?: (row: T) => string | undefined
  /** Muted second line (avatar type). */
  subtitle?: (row: T) => string | undefined
  /** Buttons for the actions type. */
  actions?: DataGridAction<T>[] | ((row: T) => DataGridAction<T>[])
  /** Footer value over all filtered rows, or a function returning the footer content. */
  aggregate?: DataGridAggregate | ((rows: T[]) => React.ReactNode)
  /** Initial pin. */
  pin?: DataGridPin
  /** Initially hidden. */
  hidden?: boolean
  /** Can be hidden from the Columns menu. Defaults to true. */
  hideable?: boolean
  resizable?: boolean
  reorderable?: boolean
  /** Included in CSV/XLSX export. Defaults to true except actions. */
  exportable?: boolean
  /** Value written to CSV/XLSX instead of the typed default. */
  exportValue?: (row: T) => string | number | boolean | Date | null | undefined
  className?: string
}

export type DataGridLabels = {
  grid: string
  search: string
  searchLabel: string
  clearSearch: string
  columns: string
  showAll: string
  resetColumns: string
  export: string
  exportCsv: string
  exportXlsx: string
  exportScope: (selected: number, total: number) => string
  selectAll: string
  selectRow: (name: string) => string
  selectedCount: (count: number) => string
  clearSelection: string
  bulkActions: string
  expandRow: (name: string) => string
  collapseRow: (name: string) => string
  details: string
  sortAscending: string
  sortDescending: string
  clearSort: string
  sortedAscending: string
  sortedDescending: string
  sortPriority: (priority: number) => string
  pinStart: string
  pinEnd: string
  unpin: string
  moveLeft: string
  moveRight: string
  hideColumn: string
  columnMenu: (header: string) => string
  resizeColumn: (header: string) => string
  headerHint: string
  editHint: string
  filter: string
  clearFilter: string
  clearFilters: string
  contains: string
  min: string
  max: string
  from: string
  to: string
  removeFilter: (header: string) => string
  empty: string
  noResults: string
  loading: string
  error: string
  retry: string
  yes: string
  no: string
  actions: string
  invalidNumber: string
  invalidDate: string
  saveFailed: string
  aggSum: string
  aggAvg: string
  aggCount: string
  aggMin: string
  aggMax: string
  rowCount: (shown: number, total: number) => string
}

const int = (n: number) => n.toLocaleString("en-US")
const DEFAULT_LABELS: DataGridLabels = {
  grid: "Data",
  search: "Search…",
  searchLabel: "Search all columns",
  clearSearch: "Clear search",
  columns: "Columns",
  showAll: "Show all",
  resetColumns: "Reset columns",
  export: "Export",
  exportCsv: "CSV (.csv)",
  exportXlsx: "Excel (.xlsx)",
  exportScope: (selected, total) => (selected ? `Exports the ${int(selected)} selected rows` : `Exports ${int(total)} rows`),
  selectAll: "Select all rows",
  selectRow: (name) => `Select ${name}`,
  selectedCount: (count) => `${int(count)} selected`,
  clearSelection: "Clear selection",
  bulkActions: "Bulk actions",
  expandRow: (name) => `Show details for ${name}`,
  collapseRow: (name) => `Hide details for ${name}`,
  details: "Details",
  sortAscending: "Sort ascending",
  sortDescending: "Sort descending",
  clearSort: "Clear sort",
  sortedAscending: "sorted ascending",
  sortedDescending: "sorted descending",
  sortPriority: (p) => `sort priority ${p}`,
  pinStart: "Pin to start",
  pinEnd: "Pin to end",
  unpin: "Unpin",
  moveLeft: "Move left",
  moveRight: "Move right",
  hideColumn: "Hide column",
  columnMenu: (h) => `${h} column options`,
  resizeColumn: (h) => `Resize ${h}`,
  headerHint: "Enter sorts, Shift+Enter adds to the sort, Alt+Down opens column options",
  editHint: "Press Enter to edit",
  filter: "Filter",
  clearFilter: "Clear filter",
  clearFilters: "Clear filters",
  contains: "Contains…",
  min: "Min",
  max: "Max",
  from: "From",
  to: "To",
  removeFilter: (h) => `Remove ${h} filter`,
  empty: "No rows yet",
  noResults: "No rows match your search or filters",
  loading: "Loading rows",
  error: "Couldn't load the data",
  retry: "Try again",
  yes: "Yes",
  no: "No",
  actions: "Actions",
  invalidNumber: "Enter a number",
  invalidDate: "Enter a valid date",
  saveFailed: "Couldn't save the change",
  aggSum: "Sum",
  aggAvg: "Avg",
  aggCount: "Count",
  aggMin: "Min",
  aggMax: "Max",
  rowCount: (shown, total) => (shown === total ? `${int(total)} rows` : `${int(shown)} of ${int(total)} rows`),
}

export type DataGridProps<T> = Omit<React.ComponentProps<"div">, "children" | "defaultValue" | "onChange"> & {
  columns: DataGridColumn<T>[]
  /** Rows. In server mode: the current page. */
  data: T[]
  /** Stable key per row; defaults to row.id, then the index. */
  getRowId?: (row: T, index: number) => string
  /** lined (default), striped, bordered or minimal (no frame). */
  variant?: DataGridVariant
  /** Accent for sort arrows, selection, focus ring, chips and edits. */
  tone?: DataGridTone
  /** Row height and cell padding: compact 34px, normal 42px, relaxed 54px. */
  density?: DataGridDensity
  /** Frame shadow. Ignored by minimal. */
  shadow?: DataGridShadow
  /** Frame corner radius. */
  shape?: DataGridShape
  /** fade: menus and bulk bar fade. spring: they spring in, rows glide to new positions and edited cells flash. none: static. */
  animation?: DataGridAnimation
  /** Maximum height of the scroll area (px number or CSS length). Shorter data shrinks the grid. */
  height?: number | string
  /** Overrides the density's row height (px). */
  rowHeight?: number
  /** BCP 47 locale for Intl number and date formatting. Defaults to the GooduiLocaleProvider language, else en-US. */
  locale?: string
  /** Default ISO currency for currency columns. */
  currency?: string
  /** Time zone for datetime columns (date-only values are always local calendar days). */
  timeZone?: string
  /** State color per row: tinted background and a start-edge marker. */
  rowTone?: (row: T) => DataGridRowTone | undefined
  /** Shows the toolbar (search, filter chips, Columns, Export). */
  toolbar?: boolean
  /** Extra toolbar content, placed before Columns and Export. */
  toolbarExtra?: React.ReactNode
  searchable?: boolean
  exportable?: boolean
  /** File name without extension. */
  exportFileName?: string
  /** Per-column menu with filter, sort, pin, move and hide. */
  columnMenu?: boolean
  /** Row count line under the grid. */
  showStatus?: boolean
  /** Adds a checkbox column. */
  selectable?: boolean
  selectedKeys?: string[]
  defaultSelectedKeys?: string[]
  onSelectionChange?: (keys: string[]) => void
  /** Buttons in the floating bar shown while rows are selected. */
  bulkActions?: DataGridBulkAction<T>[]
  sort?: DataGridSort[]
  defaultSort?: DataGridSort[]
  onSortChange?: (sort: DataGridSort[]) => void
  filters?: DataGridFilters
  defaultFilters?: DataGridFilters
  onFiltersChange?: (filters: DataGridFilters) => void
  search?: string
  defaultSearch?: string
  onSearchChange?: (search: string) => void
  /** Column order, widths, pins and hidden ids (controlled). Missing parts fall back to the column definitions. */
  columnState?: Partial<DataGridColumnState>
  defaultColumnState?: Partial<DataGridColumnState>
  onColumnStateChange?: (state: DataGridColumnState) => void
  /** Content of a row's expanded detail panel; adds an expand column. */
  renderExpanded?: (row: T) => React.ReactNode
  expandedKeys?: string[]
  defaultExpandedKeys?: string[]
  onExpandedChange?: (keys: string[]) => void
  /** Called with a validated edit. Update your data here. Return (or resolve) a string to show it as an error and keep the editor open. */
  onCellEdit?: (edit: DataGridCellEdit<T>) => void | string | null | Promise<void | string | null>
  /** Footer values from the server, by column id (server mode, or to override). */
  aggregates?: Record<string, React.ReactNode>
  /** Skeleton rows when there is no data yet; a progress bar over existing rows. */
  loading?: boolean
  /** true or a message shows the error state. */
  error?: boolean | React.ReactNode
  /** Adds a retry button to the error state. */
  onRetry?: () => void
  /** Replaces the empty-state content (no data, no filters). */
  emptyState?: React.ReactNode
  /** client: the grid searches, filters, sorts and (optionally) pages. server: it only reports the query; data is the current page. */
  mode?: "client" | "server"
  /** Client mode: pages instead of one virtualized scroll. Server mode pages whenever rowCount is set. */
  pagination?: boolean
  page?: number
  defaultPage?: number
  onPageChange?: (page: number) => void
  pageSize?: number
  defaultPageSize?: number
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: number[]
  /** Server mode: total rows on the server. */
  rowCount?: number
  /** Server mode: the full query after any sort, filter, search (debounced 250 ms) or page change. */
  onQueryChange?: (query: DataGridQuery) => void
  /** Rows rendered beyond the viewport on each side. */
  overscan?: number
  /** Names the grid. */
  "aria-label"?: string
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<DataGridLabels>
}

const CSS = `
:is(.pc-data-grid,.pc-data-grid-pop){--pc-c:var(--primary);--pc-fg:var(--primary-foreground)}
:is(.pc-data-grid,.pc-data-grid-pop)[data-tone=neutral]{--pc-c:var(--foreground);--pc-fg:var(--background)}
:is(.pc-data-grid,.pc-data-grid-pop)[data-tone=success]{--pc-c:oklch(0.53 0.13 155);--pc-fg:#fff}
:is(.pc-data-grid,.pc-data-grid-pop)[data-tone=warning]{--pc-c:oklch(0.75 0.16 70);--pc-fg:oklch(0.25 0.05 70)}
:is(.pc-data-grid,.pc-data-grid-pop)[data-tone=danger]{--pc-c:oklch(0.56 0.21 27);--pc-fg:#fff}
:is(.pc-data-grid,.pc-data-grid-pop)[data-tone=info]{--pc-c:oklch(0.55 0.17 250);--pc-fg:#fff}
.dark :is(.pc-data-grid,.pc-data-grid-pop)[data-tone=success]{--pc-c:oklch(0.7 0.16 155);--pc-fg:oklch(0.2 0.05 155)}
.dark :is(.pc-data-grid,.pc-data-grid-pop)[data-tone=danger]{--pc-c:oklch(0.68 0.2 25);--pc-fg:oklch(0.2 0.05 25)}
.dark :is(.pc-data-grid,.pc-data-grid-pop)[data-tone=info]{--pc-c:oklch(0.7 0.15 245);--pc-fg:oklch(0.2 0.05 245)}
:is(.pc-data-grid,.pc-data-grid-pop){--pc-tint:color-mix(in oklab,var(--pc-c) 14%,transparent);--pc-ink:color-mix(in oklab,var(--pc-c) 82%,var(--foreground))}
:is(.pc-data-grid,.pc-data-grid-pop)[data-tone=warning]{--pc-ink:color-mix(in oklab,var(--pc-c) 62%,var(--foreground))}

.pc-data-grid{--pc-r:.75rem;--pc-px:.875rem;--pc-line:color-mix(in oklab,var(--border) 85%,transparent);--pc-surface:var(--card);--pc-head:color-mix(in oklab,var(--muted) 50%,var(--pc-surface));--pc-muted:color-mix(in oklab,var(--muted-foreground) 85%,var(--foreground));--pc-danger:oklch(0.56 0.21 27);color:var(--foreground);min-width:0}
.dark .pc-data-grid{--pc-danger:oklch(0.68 0.2 25)}
.pc-data-grid[data-shape=square]{--pc-r:0px}
.pc-data-grid[data-shape=soft]{--pc-r:1.25rem}
.pc-data-grid[data-density=compact]{--pc-px:.625rem}
.pc-data-grid[data-density=relaxed]{--pc-px:1.125rem}
.pc-data-grid[data-variant=minimal]{--pc-surface:var(--background);--pc-head:var(--background)}

.pc-data-grid-frame{position:relative;border-radius:var(--pc-r);background:var(--pc-surface);overflow:hidden;isolation:isolate}
.pc-data-grid:not([data-variant=minimal]) .pc-data-grid-frame{border:1px solid var(--pc-line)}
.pc-data-grid[data-shadow=sm]:not([data-variant=minimal]) .pc-data-grid-frame{box-shadow:0 1px 2px rgb(0 0 0/.06),0 1px 3px rgb(0 0 0/.05)}
.pc-data-grid[data-shadow=md]:not([data-variant=minimal]) .pc-data-grid-frame{box-shadow:0 6px 18px -6px rgb(0 0 0/.14)}
.pc-data-grid[data-shadow=lg]:not([data-variant=minimal]) .pc-data-grid-frame{box-shadow:0 18px 40px -14px rgb(0 0 0/.25)}
.dark .pc-data-grid:not([data-shadow=none]):not([data-variant=minimal]) .pc-data-grid-frame{box-shadow:0 12px 32px -12px rgb(0 0 0/.65)}
.pc-data-grid-scroll{overflow:auto;overscroll-behavior:contain;position:relative}
.pc-data-grid-grid{position:relative;min-width:100%;outline:none}
.pc-data-grid-row{display:grid;grid-template-columns:var(--pc-cols);height:var(--pc-rh);border-bottom:1px solid transparent}
.pc-data-grid-head,.pc-data-grid-foot{position:sticky;z-index:3}
.pc-data-grid-head{top:0}
.pc-data-grid-foot{bottom:0}
.pc-data-grid-head .pc-data-grid-row{border-bottom-color:var(--pc-line)}
.pc-data-grid-foot .pc-data-grid-row{border-bottom:0;border-top:1px solid var(--pc-line)}
.pc-data-grid-body{position:relative}
.pc-data-grid-item{position:absolute;top:0;inset-inline:0}
.pc-data-grid-item[data-raise]{z-index:2}
.pc-data-grid[data-anim=spring] .pc-data-grid-item{transition:transform .28s var(--pc-ease-out)}

.pc-data-grid-cell{position:relative;display:flex;align-items:center;gap:.5rem;min-width:0;padding-inline:var(--pc-px);overflow:hidden;white-space:nowrap;background-color:var(--pc-cellbg,var(--pc-surface));background-image:linear-gradient(var(--pc-ov,transparent),var(--pc-ov,transparent));outline:none}
.pc-data-grid-cell[data-pin]{position:sticky;z-index:1}
.pc-data-grid-cell[data-align=end]{justify-content:flex-end;text-align:end}
.pc-data-grid-cell[data-align=center]{justify-content:center;text-align:center}
.pc-data-grid-cell[data-num]{font-variant-numeric:tabular-nums}
.pc-data-grid-cell:focus-visible{outline:2px solid var(--pc-c);outline-offset:-2px;z-index:2}
.pc-data-grid-cell[data-editable]{cursor:text}
.pc-data-grid-head .pc-data-grid-cell{background-color:var(--pc-head);color:var(--pc-muted);font-weight:500;font-size:.8125rem}
.pc-data-grid[data-variant=minimal] .pc-data-grid-head .pc-data-grid-cell{font-size:.6875rem;letter-spacing:.06em;text-transform:uppercase}
.pc-data-grid-foot .pc-data-grid-cell{background-color:var(--pc-head);font-weight:600}
.pc-data-grid-aggv{display:flex;flex-direction:column;min-width:0;max-width:100%;line-height:1.15}
.pc-data-grid-cell[data-align=end] .pc-data-grid-aggv{align-items:flex-end}
.pc-data-grid-agg{font-size:.625rem;font-weight:500;color:var(--pc-muted);text-transform:uppercase;letter-spacing:.05em}
.pc-data-grid-muted{color:var(--pc-muted)}

.pc-data-grid:is([data-variant=lined],[data-variant=bordered]) .pc-data-grid-body .pc-data-grid-row{border-bottom-color:var(--pc-line)}
.pc-data-grid[data-variant=minimal] .pc-data-grid-body .pc-data-grid-row{border-bottom-color:color-mix(in oklab,var(--pc-line) 55%,transparent)}
.pc-data-grid[data-variant=striped] .pc-data-grid-body .pc-data-grid-row[data-odd]{--pc-cellbg:color-mix(in oklab,var(--muted) 55%,var(--pc-surface))}
.pc-data-grid[data-variant=bordered] .pc-data-grid-cell:not(:last-child){border-inline-end:1px solid var(--pc-line)}

.pc-data-grid-body .pc-data-grid-row:hover{--pc-ov:color-mix(in oklab,var(--foreground) 4%,transparent)}
.pc-data-grid-row[aria-selected=true]{--pc-ov:color-mix(in oklab,var(--pc-c) 10%,transparent)}
.pc-data-grid-body .pc-data-grid-row[aria-selected=true]:hover{--pc-ov:color-mix(in oklab,var(--pc-c) 14%,transparent)}
.pc-data-grid-row[data-tone]{--pc-row:var(--pc-c)}
.pc-data-grid-row[data-tone=neutral]{--pc-row:var(--muted-foreground)}
.pc-data-grid-row[data-tone=success]{--pc-row:oklch(0.53 0.13 155)}
.pc-data-grid-row[data-tone=warning]{--pc-row:oklch(0.75 0.16 70)}
.pc-data-grid-row[data-tone=danger]{--pc-row:oklch(0.56 0.21 27)}
.pc-data-grid-row[data-tone=info]{--pc-row:oklch(0.55 0.17 250)}
.dark .pc-data-grid-row[data-tone=success]{--pc-row:oklch(0.7 0.16 155)}
.dark .pc-data-grid-row[data-tone=danger]{--pc-row:oklch(0.68 0.2 25)}
.dark .pc-data-grid-row[data-tone=info]{--pc-row:oklch(0.7 0.15 245)}
.pc-data-grid-row[data-tone]{--pc-cellbg:color-mix(in oklab,var(--pc-row) 8%,var(--pc-surface))}
.pc-data-grid-row:is([data-tone],[aria-selected=true])>.pc-data-grid-cell:first-child{box-shadow:inset 3px 0 0 var(--pc-mark,var(--pc-row))}
.pc-data-grid-row:is([data-tone],[aria-selected=true])>.pc-data-grid-cell:first-child:dir(rtl){box-shadow:inset -3px 0 0 var(--pc-mark,var(--pc-row))}
.pc-data-grid-row[aria-selected=true]{--pc-mark:var(--pc-c)}

.pc-data-grid-cell[data-edge=start]{border-inline-end:1px solid var(--pc-line)}
.pc-data-grid-cell[data-edge=end]{border-inline-start:1px solid var(--pc-line)}
.pc-data-grid[data-sx-start] .pc-data-grid-cell[data-edge=start]{box-shadow:6px 0 10px -6px rgb(0 0 0/.2)}
.pc-data-grid[data-sx-start] .pc-data-grid-cell[data-edge=start]:dir(rtl){box-shadow:-6px 0 10px -6px rgb(0 0 0/.2)}
.pc-data-grid[data-sx-end] .pc-data-grid-cell[data-edge=end]{box-shadow:-6px 0 10px -6px rgb(0 0 0/.2)}
.pc-data-grid[data-sx-end] .pc-data-grid-cell[data-edge=end]:dir(rtl){box-shadow:6px 0 10px -6px rgb(0 0 0/.2)}

.pc-data-grid-hcell{gap:.125rem;padding-inline-end:.25rem;user-select:none}
.pc-data-grid-hcell[data-dragging]{opacity:.45}
.pc-data-grid-hcell[data-drop=before]{box-shadow:inset 2px 0 0 var(--pc-c)}
.pc-data-grid-hcell[data-drop=after]{box-shadow:inset -2px 0 0 var(--pc-c)}
.pc-data-grid-hcell[data-drop=before]:dir(rtl){box-shadow:inset -2px 0 0 var(--pc-c)}
.pc-data-grid-hcell[data-drop=after]:dir(rtl){box-shadow:inset 2px 0 0 var(--pc-c)}
.pc-data-grid-hcell[data-movable]{cursor:grab}
.pc-data-grid-hlabel{display:inline-flex;align-items:center;gap:.25rem;min-width:0;flex:1;height:100%;color:inherit;font:inherit;text-align:start;background:none;border:0;padding:0;cursor:pointer;outline:none;transition:color .15s}
.pc-data-grid-hcell[data-align=end] .pc-data-grid-hlabel{justify-content:flex-end}
.pc-data-grid-hcell[data-align=center] .pc-data-grid-hlabel{justify-content:center}
.pc-data-grid-hlabel:hover,.pc-data-grid-hcell[aria-sort] .pc-data-grid-hlabel{color:var(--foreground)}
.pc-data-grid-sort{display:inline-flex;align-items:center;color:var(--pc-ink);flex:none}
.pc-data-grid-sort svg{width:.875rem;height:.875rem}
.pc-data-grid-prio{font-size:.625rem;font-weight:600;line-height:1;margin-inline-start:1px}
.pc-data-grid-fdot{width:.375rem;height:.375rem;border-radius:9999px;background:var(--pc-c);flex:none}
.pc-data-grid-hmenu{display:grid;place-items:center;width:1.5rem;height:1.5rem;flex:none;border-radius:.375rem;color:var(--pc-muted);background:none;border:0;padding:0;cursor:pointer;opacity:0;outline:none;transition:opacity .15s,background-color .15s}
.pc-data-grid-hmenu svg{width:.9rem;height:.9rem}
.pc-data-grid-hcell:hover .pc-data-grid-hmenu,.pc-data-grid-hcell:focus-visible .pc-data-grid-hmenu,.pc-data-grid-hmenu[aria-expanded=true],.pc-data-grid-hmenu[data-active]{opacity:1}
.pc-data-grid-hmenu:hover,.pc-data-grid-hmenu[aria-expanded=true]{background:color-mix(in oklab,var(--foreground) 8%,transparent);color:var(--foreground)}
@media (hover:none){.pc-data-grid-hmenu{opacity:1}}
.pc-data-grid-resize{position:absolute;top:0;bottom:0;inset-inline-end:0;width:8px;display:flex;justify-content:center;cursor:col-resize;touch-action:none;z-index:2}
.pc-data-grid-resize::after{content:"";width:2px;height:55%;margin-block:auto;border-radius:2px;background:transparent;transition:background-color .15s}
.pc-data-grid-hcell:hover .pc-data-grid-resize::after{background:var(--pc-line)}
.pc-data-grid-resize:hover::after,.pc-data-grid-resize[data-active]::after{background:var(--pc-c)}

.pc-data-grid-check{position:relative;display:grid;place-items:center;width:1rem;height:1rem;flex:none;border-radius:.3rem;border:1.5px solid color-mix(in oklab,var(--foreground) 30%,transparent);background:var(--pc-surface);color:var(--pc-fg);transition:background-color .12s,border-color .12s}
.pc-data-grid-check:is([data-state=on],[data-state=mixed]){background:var(--pc-c);border-color:var(--pc-c)}
.pc-data-grid-check input{position:absolute;inset:-6px;opacity:0;margin:0;cursor:pointer}
.pc-data-grid-check svg{width:.7rem;height:.7rem;stroke-width:3.5;pointer-events:none}
.pc-data-grid-check:has(input:focus-visible){outline:2px solid var(--pc-c);outline-offset:2px}
.pc-data-grid-exp{display:grid;place-items:center;width:1.5rem;height:1.5rem;border-radius:.375rem;color:var(--pc-muted);background:none;border:0;padding:0;cursor:pointer;outline:none}
.pc-data-grid-exp:hover{background:color-mix(in oklab,var(--foreground) 8%,transparent);color:var(--foreground)}
.pc-data-grid-exp svg{width:1rem;height:1rem;transition:transform .2s var(--pc-ease-out)}
.pc-data-grid-exp:dir(rtl) svg{transform:scaleX(-1)}
.pc-data-grid-exp[aria-expanded=true] svg{transform:rotate(90deg)}
.pc-data-grid-detail{border-bottom:1px solid var(--pc-line);background:color-mix(in oklab,var(--muted) 35%,var(--pc-surface))}
.pc-data-grid-detail>[role=gridcell]{position:sticky;inset-inline-start:0;padding:.875rem var(--pc-px);white-space:normal}
.pc-data-grid-bool{display:inline-grid;place-items:center;width:1.25rem;height:1.25rem;border-radius:9999px}
.pc-data-grid-bool[data-on]{background:var(--pc-tint);color:var(--pc-ink)}
.pc-data-grid-bool:not([data-on]){color:color-mix(in oklab,var(--pc-muted) 70%,transparent)}
.pc-data-grid-bool svg{width:.8rem;height:.8rem;stroke-width:3}
.pc-data-grid-act{display:inline-grid;place-items:center;min-width:1.75rem;height:1.75rem;padding-inline:.375rem;border-radius:.375rem;color:var(--pc-muted);background:none;border:0;cursor:pointer;font:inherit;font-size:.8125rem;font-weight:500;outline:none;transition:background-color .15s,color .15s}
.pc-data-grid-act:hover{background:color-mix(in oklab,var(--foreground) 8%,transparent);color:var(--foreground)}
.pc-data-grid-act[data-tone=danger]:hover{background:color-mix(in oklab,var(--pc-danger) 12%,transparent);color:var(--pc-danger)}
.pc-data-grid-act:focus-visible{outline:2px solid var(--pc-c);outline-offset:-1px}
.pc-data-grid-act:disabled{opacity:.4;cursor:not-allowed}
.pc-data-grid-act svg{width:.95rem;height:.95rem}

.pc-data-grid-cell[data-editing]{overflow:visible;z-index:3;padding:0}
.pc-data-grid-editor{width:100%;height:100%;min-width:0;padding-inline:var(--pc-px);background:var(--pc-surface);color:inherit;font:inherit;border:0;border-radius:2px;outline:2px solid var(--pc-c);outline-offset:-2px;text-align:inherit}
.pc-data-grid-editor[aria-invalid=true]{outline-color:var(--pc-danger)}
.pc-data-grid-editor[aria-busy=true]{opacity:.6}
.pc-data-grid-err{position:absolute;top:calc(100% + 4px);inset-inline-start:0;z-index:4;max-width:18rem;width:max-content;white-space:normal;padding:.25rem .5rem;border-radius:.375rem;font-size:.75rem;font-weight:500;line-height:1.35;background:var(--pc-danger);color:#fff;box-shadow:0 8px 20px -8px rgb(0 0 0/.35)}
.pc-data-grid-err[data-up]{top:auto;bottom:calc(100% + 4px)}
.pc-data-grid-cell[data-flash]{animation:pc-data-grid-flash .9s ease-out}
@keyframes pc-data-grid-flash{from{background-color:color-mix(in oklab,var(--pc-c) 30%,var(--pc-surface))}}

.pc-data-grid-skel{display:block;height:.625rem;border-radius:9999px;background:linear-gradient(90deg,var(--muted) 25%,color-mix(in oklab,var(--muted) 40%,var(--pc-surface)) 50%,var(--muted) 75%);background-size:200% 100%;animation:pc-data-grid-shimmer 1.4s linear infinite}
@keyframes pc-data-grid-shimmer{to{background-position:-200% 0}}
.pc-data-grid-bar{position:absolute;top:0;inset-inline:0;height:2px;z-index:5;overflow:hidden;background:var(--pc-tint)}
.pc-data-grid-bar::after{content:"";position:absolute;inset-block:0;width:35%;background:var(--pc-c);animation:pc-data-grid-bar 1.1s var(--pc-ease-in-out) infinite}
@keyframes pc-data-grid-bar{from{transform:translateX(-100%)}to{transform:translateX(300%)}}
.pc-data-grid-overlay{position:absolute;inset-inline:0;z-index:2;display:grid;place-items:center;padding:1.5rem;text-align:center}

.pc-data-grid-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:.5rem;margin-bottom:.75rem}
.pc-data-grid-search{display:flex;align-items:center;gap:.5rem;height:2.25rem;padding-inline:.625rem;border:1px solid var(--input);border-radius:.5rem;background:var(--background);min-width:0;flex:1 1 11rem;max-width:20rem;transition:border-color .15s,box-shadow .15s}
.pc-data-grid-search:focus-within{border-color:color-mix(in oklab,var(--pc-c) 55%,var(--border));box-shadow:0 0 0 3px color-mix(in oklab,var(--pc-c) 25%,transparent)}
.pc-data-grid-search>svg{width:1rem;height:1rem;color:var(--pc-muted);flex:none}
.pc-data-grid-search input{flex:1;min-width:0;height:100%;background:transparent;border:0;outline:none;font:inherit;font-size:.875rem;color:inherit}
.pc-data-grid-search input::-webkit-search-cancel-button{display:none}
.pc-data-grid-x{display:grid;place-items:center;width:1.25rem;height:1.25rem;border-radius:9999px;color:var(--pc-muted);background:none;border:0;padding:0;cursor:pointer;outline:none;flex:none}
.pc-data-grid-x:hover{background:color-mix(in oklab,var(--foreground) 10%,transparent);color:var(--foreground)}
.pc-data-grid-x:focus-visible{outline:2px solid var(--pc-c)}
.pc-data-grid-x svg{width:.8rem;height:.8rem}
.pc-data-grid-btn{display:inline-flex;align-items:center;gap:.375rem;height:2.25rem;padding-inline:.75rem;border:1px solid var(--input);border-radius:.5rem;background:var(--background);font:inherit;font-size:.875rem;font-weight:500;color:var(--foreground);cursor:pointer;outline:none;white-space:nowrap;transition:background-color .15s,border-color .15s,box-shadow .15s}
.pc-data-grid-btn:hover{background:color-mix(in oklab,var(--foreground) 5%,var(--background))}
.pc-data-grid-btn:focus-visible{border-color:color-mix(in oklab,var(--pc-c) 55%,var(--border));box-shadow:0 0 0 3px color-mix(in oklab,var(--pc-c) 28%,transparent)}
.pc-data-grid-btn[aria-expanded=true]{background:var(--pc-tint);border-color:color-mix(in oklab,var(--pc-c) 40%,var(--border))}
.pc-data-grid-btn svg{width:1rem;height:1rem;color:var(--pc-muted)}
.pc-data-grid-btn[data-ghost]{border-color:transparent;background:none;color:var(--pc-muted)}
.pc-data-grid-btn[data-ghost]:hover{color:var(--foreground);background:color-mix(in oklab,var(--foreground) 6%,transparent)}
.pc-data-grid-chip{display:inline-flex;align-items:center;gap:.25rem;height:1.75rem;max-width:18rem;padding-inline:.625rem .25rem;border-radius:9999px;background:var(--pc-tint);color:var(--pc-ink);font-size:.75rem;font-weight:500;border:1px solid color-mix(in oklab,var(--pc-c) 18%,transparent)}
.pc-data-grid-chip>button:first-child{display:inline-flex;gap:.25rem;min-width:0;background:none;border:0;padding:0;color:inherit;font:inherit;cursor:pointer;outline:none}
.pc-data-grid-chip>button:first-child:focus-visible{text-decoration:underline}
.pc-data-grid-chip .pc-data-grid-x{color:inherit}

.pc-data-grid-bulk{position:absolute;inset-inline:0;margin-inline:auto;bottom:calc(var(--pc-fh) + .75rem);z-index:6;display:flex;align-items:center;gap:.125rem;width:max-content;max-width:calc(100% - 1.5rem);overflow-x:auto;padding:.3rem;border-radius:.75rem;background:var(--foreground);color:var(--background);box-shadow:0 14px 34px -10px rgb(0 0 0/.45)}
.pc-data-grid-bulk>span{padding-inline:.625rem .375rem;font-size:.8125rem;font-weight:600;white-space:nowrap;font-variant-numeric:tabular-nums}
.pc-data-grid-bulk button{display:inline-flex;align-items:center;gap:.375rem;height:2rem;padding-inline:.625rem;border-radius:.5rem;border:0;background:none;font:inherit;font-size:.8125rem;font-weight:500;color:inherit;white-space:nowrap;cursor:pointer;outline:none;transition:background-color .15s}
.pc-data-grid-bulk button:hover{background:color-mix(in oklab,var(--background) 16%,transparent)}
.pc-data-grid-bulk button:focus-visible{box-shadow:0 0 0 2px color-mix(in oklab,var(--background) 70%,transparent)}
.pc-data-grid-bulk button[data-tone=danger]{color:oklch(0.78 0.14 25)}
.dark .pc-data-grid-bulk button[data-tone=danger]{color:oklch(0.5 0.2 27)}
.pc-data-grid-bulk svg{width:.95rem;height:.95rem}
.pc-data-grid-bulk i{width:1px;align-self:stretch;margin:.35rem .25rem;background:color-mix(in oklab,var(--background) 25%,transparent)}

.pc-data-grid-pop{z-index:60;min-width:13.5rem;max-width:min(20rem,calc(100vw - 16px));overflow:auto;overscroll-behavior:contain;padding:.375rem;border-radius:.75rem;border:1px solid var(--border);background:var(--popover);color:var(--popover-foreground);font-size:.875rem;box-shadow:0 16px 40px -12px rgb(0 0 0/.25),0 4px 10px -4px rgb(0 0 0/.08);outline:none}
.dark .pc-data-grid-pop{box-shadow:0 16px 40px -12px rgb(0 0 0/.6),0 0 0 1px rgb(255 255 255/.04)}
.pc-data-grid-mi{display:flex;width:100%;align-items:center;gap:.5rem;padding:.4rem .5rem;border-radius:.5rem;border:0;background:none;color:inherit;font:inherit;text-align:start;cursor:pointer;outline:none}
.pc-data-grid-mi:hover,.pc-data-grid-mi:focus-visible{background:color-mix(in oklab,var(--pc-c) 7%,var(--accent))}
.pc-data-grid-mi[data-on]{color:var(--pc-ink);font-weight:500}
.pc-data-grid-mi:disabled{opacity:.45;cursor:not-allowed;background:none}
.pc-data-grid-mi>svg{width:1rem;height:1rem;flex:none;color:var(--pc-muted)}
.pc-data-grid-mi[data-on]>svg{color:var(--pc-ink)}
.pc-data-grid-sep{height:1px;background:var(--border);margin:.375rem -.375rem}
.pc-data-grid-ptitle{display:flex;align-items:center;justify-content:space-between;gap:.5rem;padding:.25rem .5rem .375rem;font-size:.6875rem;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--muted-foreground)}
.pc-data-grid-in{width:100%;min-width:0;height:2rem;padding-inline:.5rem;border:1px solid var(--input);border-radius:.4rem;background:var(--background);font:inherit;font-size:.8125rem;color:inherit;outline:none}
.pc-data-grid-in:focus{border-color:color-mix(in oklab,var(--pc-c) 55%,var(--border));box-shadow:0 0 0 3px color-mix(in oklab,var(--pc-c) 22%,transparent)}
.pc-data-grid-in[aria-invalid=true]{border-color:oklch(0.56 0.21 27)}
.pc-data-grid-opt{display:flex;align-items:center;gap:.5rem;padding:.3rem .5rem;border-radius:.4rem;cursor:pointer}
.pc-data-grid-opt:hover{background:color-mix(in oklab,var(--pc-c) 6%,var(--accent))}
.pc-data-grid-opt input{accent-color:var(--pc-c);width:.9rem;height:.9rem;margin:0}
.pc-data-grid-hint{padding:.125rem .5rem .375rem;font-size:.75rem;color:var(--muted-foreground)}

.pc-data-grid[data-anim=none] *,.pc-data-grid-pop[data-anim=none] *{transition:none!important}
.pc-data-grid[data-anim=none] .pc-data-grid-skel,.pc-data-grid[data-anim=none] .pc-data-grid-bar::after{animation:none}
@media (prefers-reduced-motion:reduce){
  .pc-data-grid *,.pc-data-grid-pop *{transition:none!important}
  .pc-data-grid .pc-data-grid-item{transition:none!important}
  .pc-data-grid-cell[data-flash],.pc-data-grid-skel,.pc-data-grid-bar::after{animation:none!important}
}
`

const DENSITY = {
  compact: { row: 34, text: "text-[13px]", avatar: "xs" },
  normal: { row: 42, text: "text-sm", avatar: "sm" },
  relaxed: { row: 54, text: "text-sm", avatar: "sm" },
} as const

/* ------------------------------------------------------------------------------------------------------------------
 * Values, formatting, parsing
 * ---------------------------------------------------------------------------------------------------------------- */

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
const pad = (n: number) => String(n).padStart(2, "0")
const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const isoLocal = (d: Date) => `${isoDate(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`
const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi)
const isNum = (t: DataGridColumnType) => t === "number" || t === "currency" || t === "percent"
const typeOf = <T,>(c: DataGridColumn<T>): DataGridColumnType => c.type ?? "text"

/** Parses Date, epoch ms, "YYYY-MM-DD" (as a local calendar day) and other ISO strings. */
function toDate(v: unknown): Date | null {
  if (v == null || v === "") return null
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v
  if (typeof v === "number") return new Date(v)
  if (typeof v === "string") {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v)
    const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(v)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

function readValue<T>(col: DataGridColumn<T>, row: T): unknown {
  const a = col.accessor
  if (typeof a === "function") return a(row)
  const k = (a ?? col.id) as PropertyKey
  return row != null && typeof row === "object" ? (row as Record<PropertyKey, unknown>)[k] : undefined
}

function defaultRowId(row: unknown, i: number) {
  const v = row != null && typeof row === "object" ? (row as Record<string, unknown>).id : undefined
  return typeof v === "string" || typeof v === "number" ? String(v) : String(i)
}

function defaultWidth<T>(c: DataGridColumn<T>) {
  const t = typeOf(c)
  if (t === "actions") {
    const n = Array.isArray(c.actions) ? c.actions.length : 2
    return Math.max(72, n * 30 + 28)
  }
  return { text: 180, number: 120, currency: 130, percent: 104, date: 132, datetime: 184, boolean: 104, badge: 140, avatar: 220 }[t]
}

function filterKindOf<T>(c: DataGridColumn<T>): DataGridFilterKind | null {
  if (c.filter === false) return null
  if (c.filter) return c.filter
  const t = typeOf(c)
  if (t === "actions") return null
  if (isNum(t)) return "number"
  if (t === "date" || t === "datetime") return "date"
  if (t === "badge" || t === "boolean" || c.options) return "select"
  return "text"
}

function makeFormat<T>(col: DataGridColumn<T>, locale: string, currency: string, timeZone: string | undefined, l: DataGridLabels): (v: unknown) => string {
  const t = typeOf(col)
  if (isNum(t)) {
    const nf = new Intl.NumberFormat(
      locale,
      t === "currency"
        ? { style: "currency", currency: col.currency ?? currency, ...col.numberFormat }
        : t === "percent"
          ? { style: "percent", maximumFractionDigits: 1, ...col.numberFormat }
          : { maximumFractionDigits: 2, ...col.numberFormat },
    )
    return (v) => {
      const n = typeof v === "number" ? v : v == null || v === "" ? NaN : Number(v)
      return Number.isFinite(n) ? nf.format(n) : ""
    }
  }
  if (t === "date" || t === "datetime") {
    const df = new Intl.DateTimeFormat(locale, col.dateFormat ? col.dateFormat : t === "date" ? { dateStyle: "medium" } : { dateStyle: "medium", timeStyle: "short", timeZone })
    return (v) => {
      const d = toDate(v)
      return d ? df.format(d) : ""
    }
  }
  if (t === "boolean") return (v) => (v == null ? "" : v ? l.yes : l.no)
  if (col.options) {
    const m = new Map(col.options.map((o) => [o.value, o.label]))
    return (v) => (v == null ? "" : (m.get(String(v)) ?? String(v)))
  }
  if (t === "actions") return () => ""
  return (v) => (v == null ? "" : v instanceof Date ? v.toISOString() : String(v))
}

function separators(locale: string) {
  const parts = new Intl.NumberFormat(locale).formatToParts(12345.6)
  return { group: parts.find((p) => p.type === "group")?.value ?? ",", decimal: parts.find((p) => p.type === "decimal")?.value ?? "." }
}

/** Locale-aware number parsing: "1.234,5" in de-DE, "1,234.5" in en-US. null for empty, "invalid" when unparsable. */
function parseNumber(s: string, locale: string): number | null | "invalid" {
  const { group, decimal } = separators(locale)
  let t = s.trim().replace(/[\s  ]/g, "")
  if (!t) return null
  t = t.replace(/[^0-9+\-.,eE]/g, "")
  if (group !== decimal) t = t.split(group).join("")
  if (decimal !== ".") t = t.replace(decimal, ".")
  if (t === "" || t === "-" || t === "+") return "invalid"
  const n = Number(t)
  return Number.isFinite(n) ? n : "invalid"
}

function toDraft<T>(col: DataGridColumn<T>, v: unknown, locale: string) {
  const t = typeOf(col)
  if (isNum(t)) {
    const n = typeof v === "number" ? v : v == null || v === "" ? NaN : Number(v)
    if (!Number.isFinite(n)) return ""
    return new Intl.NumberFormat(locale, { useGrouping: false, maximumFractionDigits: 10 }).format(t === "percent" ? Math.round(n * 1e10) / 1e8 : n)
  }
  if (t === "date") {
    const d = toDate(v)
    return d ? isoDate(d) : ""
  }
  if (t === "datetime") {
    const d = toDate(v)
    return d ? isoLocal(d) : ""
  }
  return v == null ? "" : String(v)
}

function fromDraft<T>(col: DataGridColumn<T>, draft: string, previous: unknown, locale: string, l: DataGridLabels): { value: unknown } | { error: string } {
  const t = typeOf(col)
  if (isNum(t)) {
    const n = parseNumber(draft, locale)
    if (n === "invalid") return { error: l.invalidNumber }
    return { value: n == null ? null : t === "percent" ? n / 100 : n }
  }
  if (t === "date" || t === "datetime") {
    if (!draft.trim()) return { value: null }
    const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/.exec(draft.trim())
    if (!m) return { error: l.invalidDate }
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4] ?? 0), Number(m[5] ?? 0))
    if (Number.isNaN(d.getTime())) return { error: l.invalidDate }
    if (previous instanceof Date) return { value: d }
    if (typeof previous === "number") return { value: d.getTime() }
    return { value: t === "date" ? isoDate(d) : d.toISOString() }
  }
  return { value: draft }
}

const sameValue = (a: unknown, b: unknown) => (a instanceof Date && b instanceof Date ? a.getTime() === b.getTime() : Object.is(a, b) || (a == null && b == null))

/* ------------------------------------------------------------------------------------------------------------------
 * Export: CSV and a minimal XLSX (SpreadsheetML in a store-only ZIP)
 * ---------------------------------------------------------------------------------------------------------------- */

/** RFC 4180 CSV with a UTF-8 BOM (so Excel reads accents) and CRLF line ends. Text starting with = + - @ is prefixed with ' (formula injection). */
export function buildCsv(header: string[], rows: unknown[][]): string {
  const cell = (v: unknown, guard: boolean) => {
    if (v == null) return ""
    let s: string
    if (v instanceof Date) s = v.getHours() || v.getMinutes() || v.getSeconds() ? `${isoDate(v)} ${pad(v.getHours())}:${pad(v.getMinutes())}` : isoDate(v)
    else s = String(v)
    if (guard && typeof v === "string" && /^[=+\-@\t\r]/.test(s)) s = "'" + s
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return "﻿" + [header.map((h) => cell(h, true)), ...rows.map((r) => r.map((v) => cell(v, true)))].map((r) => r.join(",")).join("\r\n") + "\r\n"
}

export type XlsxColumn = {
  header: string
  /** Column width in characters. */
  width?: number
  /** Excel number format code, e.g. "#,##0.00", "0.0%", "yyyy-mm-dd" or "\"$\"#,##0.00". Dates default to yyyy-mm-dd. */
  format?: string
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(data: Uint8Array) {
  let c = 0xffffffff
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]!) & 0xff]! ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

/** Store-only (uncompressed) ZIP: local headers, data, central directory, end record. */
function zipStore(files: { name: string; data: Uint8Array }[], date: Date): Uint8Array<ArrayBuffer> {
  const enc = new TextEncoder()
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1)
  const day = ((Math.max(1980, date.getFullYear()) - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
  const entries = files.map((f) => ({ name: enc.encode(f.name), data: f.data, crc: crc32(f.data), offset: 0 }))
  const size = entries.reduce((a, e) => a + 30 + e.name.length + e.data.length + 46 + e.name.length, 0) + 22
  const out = new Uint8Array(size)
  const dv = new DataView(out.buffer)
  let p = 0
  const u16 = (v: number) => {
    dv.setUint16(p, v, true)
    p += 2
  }
  const u32 = (v: number) => {
    dv.setUint32(p, v >>> 0, true)
    p += 4
  }
  for (const e of entries) {
    e.offset = p
    u32(0x04034b50)
    u16(20)
    u16(0x0800)
    u16(0)
    u16(time)
    u16(day)
    u32(e.crc)
    u32(e.data.length)
    u32(e.data.length)
    u16(e.name.length)
    u16(0)
    out.set(e.name, p)
    p += e.name.length
    out.set(e.data, p)
    p += e.data.length
  }
  const cd = p
  for (const e of entries) {
    u32(0x02014b50)
    u16(20)
    u16(20)
    u16(0x0800)
    u16(0)
    u16(time)
    u16(day)
    u32(e.crc)
    u32(e.data.length)
    u32(e.data.length)
    u16(e.name.length)
    u16(0)
    u16(0)
    u16(0)
    u16(0)
    u32(0)
    u32(e.offset)
    out.set(e.name, p)
    p += e.name.length
  }
  const cdSize = p - cd
  u32(0x06054b50)
  u16(0)
  u16(0)
  u16(entries.length)
  u16(entries.length)
  u32(cdSize)
  u32(cd)
  u16(0)
  return out
}

// eslint-disable-next-line no-control-regex
const xml = (s: string) => s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f￾￿]/g, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
const colName = (i: number) => {
  let s = ""
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s
  return s
}
const BUILTIN_FMT: Record<string, number> = { General: 0, "0": 1, "0.00": 2, "#,##0": 3, "#,##0.00": 4, "0%": 9, "0.00%": 10 }

/**
 * A real .xlsx workbook (one sheet) without dependencies: numbers, booleans and dates as typed cells, strings inline,
 * a bold frozen header row with an auto filter, column widths and number formats. Returns the file bytes.
 */
export function buildXlsx(columns: XlsxColumn[], rows: unknown[][], sheetName = "Sheet1"): Uint8Array<ArrayBuffer> {
  const name = sheetName.replace(/[[\]:*?/\\]/g, " ").slice(0, 31).trim() || "Sheet1"
  // Styles: 0 default, 1 bold header, then one per distinct number format.
  const fmtIds = new Map<string, number>()
  const custom: [number, string][] = []
  const xfs: number[] = []
  const styleOf = new Map<string, number>()
  const styleFor = (code: string) => {
    let s = styleOf.get(code)
    if (s !== undefined) return s
    let id = BUILTIN_FMT[code] ?? fmtIds.get(code)
    if (id === undefined) {
      id = 164 + custom.length
      custom.push([id, code])
      fmtIds.set(code, id)
    }
    xfs.push(id)
    s = 1 + xfs.length
    styleOf.set(code, s)
    return s
  }
  const colStyle = columns.map((c) => (c.format ? styleFor(c.format) : 0))
  const dateStyle = styleFor("yyyy-mm-dd")
  const lastCol = colName(Math.max(0, columns.length - 1))
  const lastRow = rows.length + 1
  const ref = `A1:${lastCol}${lastRow}`

  const cell = (v: unknown, r: number, c: number) => {
    const at = `${colName(c)}${r}`
    if (v == null || v === "") return ""
    const s = colStyle[c] ?? 0
    if (typeof v === "number") return Number.isFinite(v) ? `<c r="${at}"${s ? ` s="${s}"` : ""}><v>${v}</v></c>` : ""
    if (typeof v === "boolean") return `<c r="${at}" t="b"><v>${v ? 1 : 0}</v></c>`
    if (v instanceof Date) {
      if (Number.isNaN(v.getTime())) return ""
      const serial = Date.UTC(v.getFullYear(), v.getMonth(), v.getDate(), v.getHours(), v.getMinutes(), v.getSeconds()) / 86400000 + 25569
      return `<c r="${at}" s="${s || dateStyle}"><v>${serial}</v></c>`
    }
    const str = String(v)
    return `<c r="${at}" t="inlineStr"><is><t${/^\s|\s$/.test(str) ? ' xml:space="preserve"' : ""}>${xml(str)}</t></is></c>`
  }

  const sheetRows: string[] = [`<row r="1">${columns.map((c, i) => `<c r="${colName(i)}1" t="inlineStr" s="1"><is><t>${xml(c.header)}</t></is></c>`).join("")}</row>`]
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r]!
    let cells = ""
    for (let c = 0; c < columns.length; c++) cells += cell(row[c], r + 2, c)
    sheetRows.push(`<row r="${r + 2}">${cells}</row>`)
  }
  const NS = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"'
  const head = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
  const sheet =
    head +
    `<worksheet ${NS}><dimension ref="${ref}"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A2" sqref="A2"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/>` +
    (columns.length ? `<cols>${columns.map((c, i) => `<col min="${i + 1}" max="${i + 1}" width="${clamp(c.width ?? Math.max(10, c.header.length + 4), 4, 120)}" customWidth="1"/>`).join("")}</cols>` : "") +
    `<sheetData>${sheetRows.join("")}</sheetData>${columns.length ? `<autoFilter ref="${ref}"/>` : ""}</worksheet>`
  const quoted = `'${name.replace(/'/g, "''")}'`
  const workbook =
    head +
    `<workbook ${NS}><bookViews><workbookView/></bookViews><sheets><sheet name="${xml(name)}" sheetId="1" r:id="rId1"/></sheets>` +
    (columns.length ? `<definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">${xml(`${quoted}!$A$1:$${lastCol}$${lastRow}`)}</definedName></definedNames>` : "") +
    `</workbook>`
  const styles =
    head +
    `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    (custom.length ? `<numFmts count="${custom.length}">${custom.map(([id, code]) => `<numFmt numFmtId="${id}" formatCode="${xml(code)}"/>`).join("")}</numFmts>` : "") +
    `<fonts count="2"><font><sz val="11"/><name val="Calibri"/><family val="2"/></font><font><b/><sz val="11"/><name val="Calibri"/><family val="2"/></font></fonts>` +
    `<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>` +
    `<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>` +
    `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
    `<cellXfs count="${2 + xfs.length}"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>${xfs.map((id) => `<xf numFmtId="${id}" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>`).join("")}</cellXfs>` +
    `<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`
  const types =
    head +
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>` +
    `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`
  const rels = head + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`
  const wbRels =
    head +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`
  const enc = new TextEncoder()
  return zipStore(
    [
      { name: "[Content_Types].xml", data: enc.encode(types) },
      { name: "_rels/.rels", data: enc.encode(rels) },
      { name: "xl/workbook.xml", data: enc.encode(workbook) },
      { name: "xl/_rels/workbook.xml.rels", data: enc.encode(wbRels) },
      { name: "xl/styles.xml", data: enc.encode(styles) },
      { name: "xl/worksheets/sheet1.xml", data: enc.encode(sheet) },
    ],
    new Date(),
  )
}

/** Saves bytes or text as a file through a temporary object URL. */
export function downloadFile(data: BlobPart, fileName: string, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }))
  const a = document.createElement("a")
  a.href = url
  a.download = fileName
  a.style.display = "none"
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}

function excelFormat<T>(col: DataGridColumn<T>, locale: string, currency: string): string | undefined {
  const t = typeOf(col)
  const fixed = (o: Intl.ResolvedNumberFormatOptions) => {
    const max = o.maximumFractionDigits ?? 2
    const min = o.minimumFractionDigits ?? 0
    return max === 0 ? "#,##0" : min === max ? `#,##0.${"0".repeat(max)}` : "General"
  }
  if (t === "number") return fixed(new Intl.NumberFormat(locale, { maximumFractionDigits: 2, ...col.numberFormat }).resolvedOptions())
  if (t === "percent") {
    const max = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1, ...col.numberFormat }).resolvedOptions().maximumFractionDigits ?? 0
    return max ? `0.${"0".repeat(max)}%` : "0%"
  }
  if (t === "currency") {
    const nf = new Intl.NumberFormat(locale, { style: "currency", currency: col.currency ?? currency, ...col.numberFormat })
    const parts = nf.formatToParts(1)
    const sym = (parts.find((p) => p.type === "currency")?.value ?? "").replace(/"/g, "")
    const digits = nf.resolvedOptions().maximumFractionDigits ?? 2
    const num = digits ? `#,##0.${"0".repeat(digits)}` : "#,##0"
    const before = parts.findIndex((p) => p.type === "currency") < parts.findIndex((p) => p.type === "integer")
    return before ? `"${sym}"${num}` : `${num} "${sym}"`
  }
  if (t === "date") return "yyyy-mm-dd"
  if (t === "datetime") return "yyyy-mm-dd hh:mm"
  return undefined
}

/* ------------------------------------------------------------------------------------------------------------------
 * Floating popover: portal into body, flips above when there is no room below, shifts inside the viewport.
 * ---------------------------------------------------------------------------------------------------------------- */

type FloatPos = { top: number; left: number; maxHeight: number; side: "top" | "bottom"; rtl: boolean }

function useFloating(open: boolean, anchor: HTMLElement | null, floating: React.RefObject<HTMLDivElement | null>, align: "start" | "end") {
  const [pos, setPos] = React.useState<FloatPos | null>(null)
  React.useLayoutEffect(() => {
    if (!open || !anchor) {
      setPos(null)
      return
    }
    let raf = 0
    const place = () => {
      const el = floating.current
      if (!el || !anchor.isConnected) return
      const a = anchor.getBoundingClientRect()
      const vw = document.documentElement.clientWidth
      const vh = window.innerHeight
      const gap = 6
      const edge = 8
      const w = el.offsetWidth
      const h = el.scrollHeight + 2
      const rtl = getComputedStyle(anchor).direction === "rtl"
      const alignLeft = (align === "start") !== rtl
      const left = clamp(alignLeft ? a.left : a.right - w, edge, Math.max(edge, vw - w - edge))
      const below = vh - a.bottom - gap - edge
      const above = a.top - gap - edge
      const side: "top" | "bottom" = h > below && above > below ? "top" : "bottom"
      const maxHeight = Math.max(140, side === "top" ? above : below)
      const shown = Math.min(h, maxHeight)
      const top = clamp(side === "top" ? a.top - gap - shown : a.bottom + gap, edge, Math.max(edge, vh - edge - shown))
      setPos((p) => (p && p.top === top && p.left === left && p.maxHeight === maxHeight && p.side === side && p.rtl === rtl ? p : { top, left, maxHeight, side, rtl }))
    }
    place()
    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(place)
    }
    window.addEventListener("resize", schedule)
    window.addEventListener("scroll", schedule, true)
    const ro = new ResizeObserver(schedule)
    if (floating.current) ro.observe(floating.current)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", schedule)
      window.removeEventListener("scroll", schedule, true)
      ro.disconnect()
    }
  }, [open, anchor, align, floating])
  return pos
}

const FOCUSABLE = 'button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

type PopoverProps = {
  open: boolean
  anchor: HTMLElement | null
  onClose: (restoreFocus: boolean) => void
  label: string
  align?: "start" | "end"
  tone: DataGridTone
  anim: DataGridAnimation
  className?: string
  children: React.ReactNode
}

function Popover({ open, anchor, onClose, label, align = "start", tone, anim, className, children }: PopoverProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  const pos = useFloating(open, anchor, ref, align)
  const closeRef = React.useRef(onClose)
  closeRef.current = onClose

  React.useEffect(() => {
    if (!open) return
    const id = requestAnimationFrame(() => {
      const el = ref.current
      const first = el?.querySelector<HTMLElement>("[data-autofocus]") ?? el?.querySelector<HTMLElement>(FOCUSABLE)
      ;(first ?? el)?.focus({ preventScroll: true })
    })
    const down = (e: PointerEvent) => {
      const t = e.target as Node
      if (ref.current?.contains(t) || anchor?.contains(t)) return
      closeRef.current(false)
    }
    document.addEventListener("pointerdown", down, true)
    return () => {
      cancelAnimationFrame(id)
      document.removeEventListener("pointerdown", down, true)
    }
  }, [open, anchor])

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault()
      e.stopPropagation()
      closeRef.current(true)
      return
    }
    const el = ref.current
    if (!el) return
    const items = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE))
    const i = items.indexOf(document.activeElement as HTMLElement)
    if (e.key === "Tab" && items.length) {
      // Keep focus inside the dialog.
      if (e.shiftKey && i <= 0) {
        e.preventDefault()
        items[items.length - 1]!.focus()
      } else if (!e.shiftKey && i === items.length - 1) {
        e.preventDefault()
        items[0]!.focus()
      }
    } else if ((e.key === "ArrowDown" || e.key === "ArrowUp") && (e.target as HTMLElement).matches("button")) {
      // Arrow keys walk the menu buttons.
      const buttons = items.filter((b) => b.matches("button"))
      const j = buttons.indexOf(e.target as HTMLElement)
      const next = buttons[(j + (e.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length]
      if (next) {
        e.preventDefault()
        next.focus()
      }
    }
  }

  const t: Transition = anim === "spring" ? spring.snap : anim === "fade" ? { duration: 0.14 } : { duration: 0 }
  const lift = pos?.side === "top" ? 4 : -4
  const motionProps =
    anim === "spring"
      ? { initial: { opacity: 0, scale: 0.96, y: lift }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.97, transition: { duration: 0.1 } } }
      : { initial: { opacity: anim === "fade" ? 0 : 1 }, animate: { opacity: 1 }, exit: { opacity: 0, transition: { duration: anim === "fade" ? 0.1 : 0 } } }

  if (!mounted) return null
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          role="dialog"
          aria-label={label}
          tabIndex={-1}
          data-tone={tone}
          data-anim={anim}
          dir={pos?.rtl ? "rtl" : undefined}
          onKeyDown={onKeyDown}
          {...motionProps}
          transition={t}
          className={cn("pc-data-grid-pop fixed", className)}
          style={{
            top: pos?.top ?? 0,
            left: pos?.left ?? 0,
            maxHeight: pos?.maxHeight,
            visibility: pos ? "visible" : "hidden",
            transformOrigin: `${pos?.rtl ? "right" : "left"} ${pos?.side === "top" ? "bottom" : "top"}`,
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

/* ------------------------------------------------------------------------------------------------------------------
 * Small parts
 * ---------------------------------------------------------------------------------------------------------------- */

function TickBox({ checked, mixed, label, onToggle, disabled }: { checked: boolean; mixed?: boolean; label: string; onToggle: (shift: boolean) => void; disabled?: boolean }) {
  return (
    <span className="pc-data-grid-check" data-state={mixed ? "mixed" : checked ? "on" : "off"}>
      <input
        type="checkbox"
        tabIndex={-1}
        aria-label={label}
        checked={checked}
        disabled={disabled}
        ref={(el) => {
          if (el) el.indeterminate = !!mixed
        }}
        onChange={() => {}}
        onMouseDown={(e) => {
          if (e.shiftKey) e.preventDefault()
        }}
        onClick={(e) => onToggle(e.shiftKey)}
      />
      {mixed ? <Minus aria-hidden="true" /> : checked ? <Check aria-hidden="true" /> : null}
    </span>
  )
}

function NumberRange({ value, onChange, l, locale, scale, header }: { value?: DataGridFilter; onChange: (f: DataGridFilter | null) => void; l: DataGridLabels; locale: string; scale: number; header: string }) {
  const show = (n?: number) => (n == null ? "" : new Intl.NumberFormat(locale, { useGrouping: false, maximumFractionDigits: 6 }).format(n * scale))
  const [min, setMin] = React.useState(value?.kind === "number" ? show(value.min) : "")
  const [max, setMax] = React.useState(value?.kind === "number" ? show(value.max) : "")
  // "Clear filter" resets the drafts.
  const cleared = !value
  React.useEffect(() => {
    if (!cleared) return
    setMin("")
    setMax("")
  }, [cleared])
  const pa = parseNumber(min, locale)
  const pb = parseNumber(max, locale)
  const emit = (a: string, b: string) => {
    const x = parseNumber(a, locale)
    const y = parseNumber(b, locale)
    if (x === "invalid" || y === "invalid") return
    onChange(x == null && y == null ? null : { kind: "number", min: x == null ? undefined : x / scale, max: y == null ? undefined : y / scale })
  }
  return (
    <div className="grid grid-cols-2 gap-2 px-1.5 pb-1">
      <input
        data-autofocus
        className="pc-data-grid-in"
        inputMode="decimal"
        placeholder={l.min}
        aria-label={`${header} ${l.min}`}
        aria-invalid={pa === "invalid" || undefined}
        value={min}
        onChange={(e) => {
          setMin(e.target.value)
          emit(e.target.value, max)
        }}
      />
      <input
        className="pc-data-grid-in"
        inputMode="decimal"
        placeholder={l.max}
        aria-label={`${header} ${l.max}`}
        aria-invalid={pb === "invalid" || undefined}
        value={max}
        onChange={(e) => {
          setMax(e.target.value)
          emit(min, e.target.value)
        }}
      />
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------------------------
 * The grid
 * ---------------------------------------------------------------------------------------------------------------- */

type DCol<T> = { id: string; kind: "select" | "expand" | "data"; col: DataGridColumn<T> | null; width: number; pin?: DataGridPin; offset: number; edge?: "start" | "end"; grow: boolean }
type EditState = { key: string; colId: string; r: number; c: number; draft: string; replace: boolean; error?: string; pending: boolean }
type MenuState = { id: string; anchor: HTMLElement; returnTo: HTMLElement | null }

function useControllable<V>(prop: V | undefined, initial: V, onChange?: (v: V) => void) {
  const [inner, setInner] = React.useState<V>(initial)
  const value = prop !== undefined ? prop : inner
  const set = (v: V) => {
    if (prop === undefined) setInner(() => v)
    onChange?.(v)
  }
  return [value, set] as const
}

const NO_SORT: DataGridSort[] = []
const NO_FILTERS: DataGridFilters = {}
const NO_KEYS: string[] = []
const NO_STATE: Partial<DataGridColumnState> = {}

export function DataGrid<T>({
  columns,
  data,
  getRowId,
  variant = "lined",
  tone = "primary",
  density = "normal",
  shadow = "sm",
  shape = "rounded",
  animation = "fade",
  height = 480,
  rowHeight,
  locale: localeProp,
  currency = "USD",
  timeZone,
  rowTone,
  toolbar = true,
  toolbarExtra,
  searchable = true,
  exportable = true,
  exportFileName = "export",
  columnMenu = true,
  showStatus = true,
  selectable = false,
  selectedKeys,
  defaultSelectedKeys = NO_KEYS,
  onSelectionChange,
  bulkActions,
  sort: sortProp,
  defaultSort = NO_SORT,
  onSortChange,
  filters: filtersProp,
  defaultFilters = NO_FILTERS,
  onFiltersChange,
  search: searchProp,
  defaultSearch = "",
  onSearchChange,
  columnState: columnStateProp,
  defaultColumnState = NO_STATE,
  onColumnStateChange,
  renderExpanded,
  expandedKeys,
  defaultExpandedKeys = NO_KEYS,
  onExpandedChange,
  onCellEdit,
  aggregates,
  loading = false,
  error,
  onRetry,
  emptyState,
  mode = "client",
  pagination = false,
  page: pageProp,
  defaultPage = 1,
  onPageChange,
  pageSize: pageSizeProp,
  defaultPageSize = 25,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  rowCount,
  onQueryChange,
  overscan = 6,
  "aria-label": ariaLabel,
  labels,
  className,
  style,
  ...rest
}: DataGridProps<T>) {
  const l = useLabels("data-grid", DEFAULT_LABELS, labels)
  const { lang } = useGooduiLocale()
  const locale = localeProp ?? lang
  const prefersReduced = useReducedMotion()
  // Reduced motion only after mount, so the server and first client render agree.
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  const anim: DataGridAnimation = mounted && prefersReduced ? "none" : animation
  const uid = React.useId()

  const rootRef = React.useRef<HTMLDivElement>(null)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const gridRef = React.useRef<HTMLDivElement>(null)

  /* ---- controlled / uncontrolled state ---- */
  const [sort, setSortState] = useControllable(sortProp, defaultSort, onSortChange)
  const [filters, setFiltersState] = useControllable(filtersProp, defaultFilters, onFiltersChange)
  const [search, setSearchState] = useControllable(searchProp, defaultSearch, onSearchChange)
  const [csRaw, setCsRaw] = useControllable(columnStateProp, defaultColumnState)
  const [selArr, setSelArr] = useControllable(selectedKeys, defaultSelectedKeys, onSelectionChange)
  const [expArr, setExpArr] = useControllable(expandedKeys, defaultExpandedKeys, onExpandedChange)
  const [page, setPageState] = useControllable(pageProp, defaultPage, onPageChange)
  const [pageSize, setPageSizeState] = useControllable(pageSizeProp, defaultPageSize, onPageSizeChange)
  const selected = React.useMemo(() => new Set(selArr), [selArr])
  const expanded = React.useMemo(() => new Set(expArr), [expArr])

  /* ---- columns ---- */
  const byId = React.useMemo(() => new Map(columns.map((c) => [c.id, c])), [columns])
  const fmts = React.useMemo(
    () => new Map(columns.map((c) => [c.id, makeFormat(c, locale, currency, timeZone, l)])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [columns, locale, currency, timeZone, l.yes, l.no],
  )
  const display = (col: DataGridColumn<T>, row: T, v = readValue(col, row)) => (col.format ? col.format(v, row) : (fmts.get(col.id)?.(v) ?? ""))

  const cs: DataGridColumnState = React.useMemo(() => {
    const ids = columns.map((c) => c.id)
    const known = (csRaw.order ?? []).filter((id) => byId.has(id))
    const order = [...known, ...ids.filter((id) => !known.includes(id))]
    const widths: Record<string, number> = {}
    for (const c of columns) widths[c.id] = csRaw.widths?.[c.id] ?? c.width ?? defaultWidth(c)
    const pinned: Record<string, DataGridPin> = {}
    for (const c of columns) {
      const p = csRaw.pinned ? csRaw.pinned[c.id] : c.pin
      if (p) pinned[c.id] = p
    }
    const hidden = csRaw.hidden ?? columns.filter((c) => c.hidden).map((c) => c.id)
    return { order, widths, pinned, hidden }
  }, [columns, csRaw, byId])
  const updateCs = (patch: Partial<DataGridColumnState>) => {
    const next = { ...cs, ...patch }
    setCsRaw(next)
    onColumnStateChange?.(next)
  }

  const [resizing, setResizing] = React.useState<{ id: string; w: number } | null>(null)
  const [view, setView] = React.useState({ h: typeof height === "number" ? height : 480, w: 0 })
  const layout = React.useMemo(() => {
    const vis = cs.order.map((id) => byId.get(id)).filter((c): c is DataGridColumn<T> => !!c && !cs.hidden.includes(c.id))
    const mk = (c: DataGridColumn<T>, pin?: DataGridPin): DCol<T> => ({
      id: c.id,
      kind: "data",
      col: c,
      width: resizing?.id === c.id ? resizing.w : (cs.widths[c.id] ?? defaultWidth(c)),
      pin,
      offset: 0,
      grow: !!c.grow && !pin,
    })
    // On narrow grids pins yield when they would cover more than ~55% of the width (select/expand stay).
    const pinnedW = vis.reduce((a, c) => a + (cs.pinned[c.id] ? (cs.widths[c.id] ?? defaultWidth(c)) : 0), (selectable ? 44 : 0) + (renderExpanded ? 40 : 0))
    const narrow = view.w > 0 && pinnedW > view.w * 0.55
    const pinOf = (c: DataGridColumn<T>) => (narrow ? undefined : cs.pinned[c.id])
    const list: DCol<T>[] = []
    if (selectable) list.push({ id: "__select", kind: "select", col: null, width: 44, pin: "start", offset: 0, grow: false })
    if (renderExpanded) list.push({ id: "__expand", kind: "expand", col: null, width: 40, pin: "start", offset: 0, grow: false })
    list.push(...vis.filter((c) => pinOf(c) === "start").map((c) => mk(c, "start")))
    const middle = vis.filter((c) => !pinOf(c)).map((c) => mk(c))
    if (!middle.some((d) => d.grow) && middle.length) middle[middle.length - 1]!.grow = true
    list.push(...middle)
    list.push(...vis.filter((c) => pinOf(c) === "end").map((c) => mk(c, "end")))
    let startW = 0
    for (const d of list) {
      if (d.pin !== "start") break
      d.offset = startW
      startW += d.width
    }
    let endW = 0
    for (let i = list.length - 1; i >= 0; i--) {
      const d = list[i]!
      if (d.pin !== "end") break
      d.offset = endW
      endW += d.width
    }
    const starts = list.filter((d) => d.pin === "start")
    const lastStart = starts[starts.length - 1]
    if (lastStart && starts.length < list.length) lastStart.edge = "start"
    const firstEnd = list.find((d) => d.pin === "end")
    if (firstEnd && list.some((d) => d.pin !== "end")) firstEnd.edge = "end"
    const total = list.reduce((a, d) => a + d.width, 0)
    const template = list.map((d) => (d.grow ? `minmax(${d.width}px,1fr)` : `${d.width}px`)).join(" ")
    return { list, total, template, startW, endW }
  }, [cs, byId, resizing, selectable, renderExpanded, view.w])
  const cols = layout.list

  /* ---- rows: keys, search, filters, sort ---- */
  const getRowIdRef = React.useRef(getRowId)
  getRowIdRef.current = getRowId
  const keys = React.useMemo(() => data.map((row, i) => (getRowIdRef.current ? getRowIdRef.current(row, i) : defaultRowId(row, i))), [data])
  const keyIndex = React.useMemo(() => new Map(keys.map((k, i) => [k, i])), [keys])

  // Per data+columns caches: sort keys per column, a folded search string per row.
  const cache = React.useRef<{ data: T[] | null; columns: DataGridColumn<T>[] | null; fmts: unknown; sort: Map<string, Float64Array>; search: string[] | null }>({
    data: null,
    columns: null,
    fmts: null,
    sort: new Map(),
    search: null,
  })
  if (cache.current.data !== data || cache.current.columns !== columns || cache.current.fmts !== fmts) cache.current = { data, columns, fmts, sort: new Map(), search: null }

  /** display() for bulk passes: without a custom format, each distinct raw value is formatted once. */
  const bulkDisplay = (col: DataGridColumn<T>) => {
    if (col.format) return (row: T, v: unknown) => display(col, row, v)
    const f = fmts.get(col.id) ?? String
    const memo = new Map<unknown, string>()
    return (_row: T, v: unknown) => {
      const k = v instanceof Date ? v.getTime() : v
      let s = memo.get(k)
      if (s === undefined) {
        s = f(v)
        memo.set(k, s)
      }
      return s
    }
  }
  const sortKeysFor = (col: DataGridColumn<T>) => {
    const hit = cache.current.sort.get(col.id)
    if (hit) return hit
    const t = typeOf(col)
    const out = new Float64Array(data.length)
    if (isNum(t)) data.forEach((row, i) => (out[i] = (() => { const v = readValue(col, row); return v == null || v === "" ? NaN : Number(v) })()))
    else if (t === "date" || t === "datetime") data.forEach((row, i) => (out[i] = toDate(readValue(col, row))?.getTime() ?? NaN))
    else if (t === "boolean") data.forEach((row, i) => { const v = readValue(col, row); out[i] = v == null ? NaN : v ? 1 : 0 })
    else if (col.options && !col.format) {
      // Options sort in their declared order (a status pipeline), unknown values last.
      const rank = new Map(col.options.map((o, i) => [o.value, i]))
      data.forEach((row, i) => { const v = readValue(col, row); out[i] = v == null || v === "" ? NaN : (rank.get(String(v)) ?? col.options!.length) })
    } else {
      // Strings: rank the distinct values once with Intl.Collator, then sort numbers.
      const show = bulkDisplay(col)
      const strs = data.map((row) => show(row, readValue(col, row)))
      const uniq = Array.from(new Set(strs)).sort(new Intl.Collator(locale, { numeric: true, sensitivity: "base" }).compare)
      const rank = new Map(uniq.map((u, i) => [u, i]))
      strs.forEach((s, i) => (out[i] = s === "" ? NaN : (rank.get(s) ?? NaN)))
    }
    cache.current.sort.set(col.id, out)
    return out
  }
  const searchIndex = () => {
    if (cache.current.search) return cache.current.search
    const cs2 = columns.filter((c) => c.searchable ?? (typeOf(c) !== "actions" && typeOf(c) !== "boolean"))
    const shows = cs2.map((c) => bulkDisplay(c))
    const idx = data.map((row) =>
      fold(
        cs2
          .map((c, ci) => {
            const v = readValue(c, row)
            const shown = shows[ci]!(row, v)
            const sub = c.subtitle?.(row)
            return (typeof v === "string" && v !== shown ? v + " " : "") + shown + (sub ? " " + sub : "")
          })
          .join("\u0001"),
      ),
    )
    cache.current.search = idx
    return idx
  }

  const query = React.useDeferredValue(React.useMemo(() => ({ search, filters, sort }), [search, filters, sort]))
  const processed = React.useMemo(() => {
    const all = Array.from({ length: data.length }, (_, i) => i)
    if (mode === "server") return all
    let idx = all
    const q = fold(query.search.trim())
    if (q) {
      const ix = searchIndex()
      idx = idx.filter((i) => ix[i]!.includes(q))
    }
    const tests: ((row: T) => boolean)[] = []
    for (const [cid, f] of Object.entries(query.filters)) {
      const col = byId.get(cid)
      if (!col) continue
      if (f.kind === "text") {
        const needle = fold(f.value.trim())
        if (needle) {
          const show = bulkDisplay(col)
          const folded = new Map<string, string>()
          tests.push((row) => {
            const text = show(row, readValue(col, row))
            let f2 = folded.get(text)
            if (f2 === undefined) folded.set(text, (f2 = fold(text)))
            return f2.includes(needle)
          })
        }
      } else if (f.kind === "number") {
        if (f.min == null && f.max == null) continue
        tests.push((row) => {
          const v = readValue(col, row)
          const n = v == null || v === "" ? NaN : Number(v)
          return Number.isFinite(n) && (f.min == null || n >= f.min) && (f.max == null || n <= f.max)
        })
      } else if (f.kind === "date") {
        const from = f.from ? toDate(f.from)?.getTime() : undefined
        const toD = f.to ? toDate(f.to) : null
        const to = toD ? new Date(toD.getFullYear(), toD.getMonth(), toD.getDate() + 1).getTime() : undefined
        if (from == null && to == null) continue
        tests.push((row) => {
          const d = toDate(readValue(col, row))?.getTime()
          return d != null && (from == null || d >= from) && (to == null || d < to)
        })
      } else if (f.values.length) {
        const set = new Set(f.values)
        const t = typeOf(col)
        tests.push((row) => {
          const v = readValue(col, row)
          return set.has(t === "boolean" ? String(!!v) : v == null ? "" : String(v))
        })
      }
    }
    if (tests.length) idx = idx.filter((i) => tests.every((t) => t(data[i]!)))
    const specs = query.sort.flatMap((s) => {
      const col = byId.get(s.id)
      return col ? [{ keys: sortKeysFor(col), desc: s.desc }] : []
    })
    if (specs.length) {
      idx = idx === all ? idx : idx.slice()
      idx.sort((a, b) => {
        for (const s of specs) {
          const x = s.keys[a]!
          const y = s.keys[b]!
          const xn = x !== x
          const yn = y !== y
          if (xn || yn) {
            if (xn && yn) continue
            return xn ? 1 : -1
          }
          if (x !== y) return s.desc ? y - x : x - y
        }
        return a - b
      })
    }
    return idx
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, columns, fmts, query, mode, byId, locale])

  /* ---- paging ---- */
  const paging = mode === "server" ? rowCount !== undefined : pagination
  const total = mode === "server" ? (rowCount ?? data.length) : processed.length
  const pageCount = Math.max(1, Math.ceil(total / Math.max(1, pageSize)))
  const curPage = clamp(page, 1, pageCount)
  const pageOffset = paging ? (curPage - 1) * pageSize : 0
  const paged = React.useMemo(() => (mode === "client" && pagination ? processed.slice(pageOffset, pageOffset + pageSize) : processed), [mode, pagination, processed, pageOffset, pageSize])
  const n = paged.length

  /* ---- query changes (server mode) ---- */
  const searchTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  React.useEffect(() => () => clearTimeout(searchTimer.current), [])
  const emit = (patch: Partial<DataGridQuery>, delay = 0) => {
    if (mode !== "server" || !onQueryChange) return
    const q: DataGridQuery = { sort, filters, search, page: curPage, pageSize, ...patch }
    clearTimeout(searchTimer.current)
    if (delay) searchTimer.current = setTimeout(() => onQueryChange(q), delay)
    else onQueryChange(q)
  }
  const firstPage = () => {
    if (paging && curPage !== 1) setPageState(1)
    return 1
  }
  const setSort = (next: DataGridSort[]) => {
    setSortState(next)
    emit({ sort: next, page: firstPage() })
  }
  const setFilters = (next: DataGridFilters) => {
    setFiltersState(next)
    emit({ filters: next, page: firstPage() })
  }
  const setSearch = (next: string) => {
    setSearchState(next)
    emit({ search: next, page: firstPage() }, 250)
  }
  const setPage = (p: number) => {
    setPageState(p)
    emit({ page: p })
    scrollRef.current?.scrollTo({ top: 0 })
  }
  const setPageSize = (s: number) => {
    setPageSizeState(s)
    emit({ pageSize: s })
  }
  const setFilter = (id: string, f: DataGridFilter | null) => {
    const next = { ...filters }
    const empty = !f || (f.kind === "text" && !f.value) || (f.kind === "number" && f.min == null && f.max == null) || (f.kind === "date" && !f.from && !f.to) || (f.kind === "select" && !f.values.length)
    if (empty) delete next[id]
    else next[id] = f
    setFilters(next)
  }
  const activeFilters = Object.entries(filters).filter(([id]) => byId.has(id))

  const toggleSort = (id: string, multi: boolean) => {
    const cur = sort.find((s) => s.id === id)
    if (!multi) setSort(!cur || sort.length > 1 ? [{ id, desc: false }] : !cur.desc ? [{ id, desc: true }] : [])
    else setSort(!cur ? [...sort, { id, desc: false }] : !cur.desc ? sort.map((s) => (s.id === id ? { id, desc: true } : s)) : sort.filter((s) => s.id !== id))
  }
  const setSortTo = (id: string, desc: boolean | null) => {
    const others = sort.filter((s) => s.id !== id)
    setSort(desc === null ? others : sort.some((s) => s.id === id) ? sort.map((s) => (s.id === id ? { id, desc } : s)) : [{ id, desc }])
  }

  /* ---- selection ---- */
  const anchorRow = React.useRef<number | null>(null)
  const scope = mode === "server" ? paged : processed
  const selectedInScope = React.useMemo(() => {
    let c = 0
    for (const i of scope) if (selected.has(keys[i]!)) c++
    return c
  }, [scope, selected, keys])
  const allSelected = scope.length > 0 && selectedInScope === scope.length
  const someSelected = selectedInScope > 0 && !allSelected
  const commitSelection = (next: Set<string>) => setSelArr(Array.from(next))
  const toggleRow = (r: number, shift: boolean) => {
    const di = paged[r]
    if (di === undefined) return
    const key = keys[di]!
    const on = !selected.has(key)
    const next = new Set(selected)
    const a = anchorRow.current
    if (shift && a !== null && a < n) {
      for (let i = Math.min(a, r); i <= Math.max(a, r); i++) {
        const k = keys[paged[i]!]!
        if (on) next.add(k)
        else next.delete(k)
      }
    } else if (on) next.add(key)
    else next.delete(key)
    anchorRow.current = r
    commitSelection(next)
  }
  const toggleAll = () => {
    const next = new Set(selected)
    for (const i of scope) {
      if (allSelected) next.delete(keys[i]!)
      else next.add(keys[i]!)
    }
    commitSelection(next)
  }
  const selectedRows = () => {
    const rows: T[] = []
    const ks: string[] = []
    for (const k of selected) {
      const i = keyIndex.get(k)
      if (i !== undefined) {
        rows.push(data[i]!)
        ks.push(k)
      }
    }
    return { rows, ks }
  }

  const toggleExpand = (key: string) => {
    const next = new Set(expanded)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setExpArr(Array.from(next))
  }

  /* ---- virtualization ---- */
  const rowH = rowHeight ?? DENSITY[density].row
  const hasFooter = columns.some((c) => c.aggregate) || !!aggregates
  const headH = rowH
  const footH = hasFooter ? rowH : 0
  const [scroll, setScroll] = React.useState({ top: 0, sxs: false, sxe: false })
  const [measured, setMeasured] = React.useState<Record<string, number>>({})
  const roRef = React.useRef<ResizeObserver | null>(null)
  const detailRO = () =>
    (roRef.current ??= new ResizeObserver((entries) =>
      setMeasured((prev) => {
        let next = prev
        for (const en of entries) {
          const el = en.target as HTMLElement
          const k = el.dataset.key
          if (!k) continue
          const h = el.offsetHeight
          if (Math.abs((prev[k] ?? -1) - h) > 0.5) {
            if (next === prev) next = { ...prev }
            next[k] = h
          }
        }
        return next
      }),
    ))
  React.useEffect(() => () => roRef.current?.disconnect(), [])

  const offsets = React.useMemo(() => {
    if (!renderExpanded || expanded.size === 0) return null
    const o = new Float64Array(n + 1)
    for (let i = 0; i < n; i++) {
      const k = keys[paged[i]!]!
      o[i + 1] = o[i]! + rowH + (expanded.has(k) ? (measured[k] ?? 120) : 0)
    }
    return o
  }, [renderExpanded, expanded, n, keys, paged, rowH, measured])
  const offsetOf = (i: number) => (offsets ? offsets[i]! : i * rowH)
  const findRow = (y: number) => {
    if (!offsets) return Math.floor(y / rowH)
    let lo = 0
    let hi = n
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1
      if (offsets[mid]! <= y) lo = mid
      else hi = mid - 1
    }
    return lo
  }
  const bodyView = Math.max(rowH, view.h - headH - footH)
  const first = Math.max(0, findRow(scroll.top) - overscan)
  const last = Math.min(n - 1, findRow(scroll.top + bodyView) + overscan)

  const readScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const sl = Math.abs(el.scrollLeft)
    const max = el.scrollWidth - el.clientWidth
    const next = { top: el.scrollTop, sxs: sl > 1, sxe: sl < max - 1 }
    setScroll((s) => (s.top === next.top && s.sxs === next.sxs && s.sxe === next.sxe ? s : next))
  }
  React.useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setView((v) => (v.h === el.clientHeight && v.w === el.clientWidth ? v : { h: el.clientHeight, w: el.clientWidth }))
      readScroll()
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  React.useEffect(readScroll, [layout.total])

  /* ---- focus (roving tabindex over cells) ---- */
  const [focus, setFocus] = React.useState({ r: 0, c: 0 })
  const fr = n === 0 ? -1 : clamp(focus.r, -1, n - 1)
  const fc = clamp(focus.c, 0, Math.max(0, cols.length - 1))
  const wantFocus = React.useRef(false)
  const moveFocus = (r: number, c: number) => {
    wantFocus.current = true
    setFocus({ r: clamp(r, -1, n - 1), c: clamp(c, 0, cols.length - 1) })
  }
  React.useLayoutEffect(() => {
    if (!wantFocus.current) return
    wantFocus.current = false
    const el = gridRef.current?.querySelector<HTMLElement>(`[data-r="${fr}"][data-c="${fc}"]`)
    if (!el) return
    el.focus({ preventScroll: true })
    el.scrollIntoView({ block: "nearest", inline: "nearest" })
  }, [focus, fr, fc])

  /* ---- editing ---- */
  const [edit, setEditState] = React.useState<EditState | null>(null)
  const editRef = React.useRef<EditState | null>(null)
  const setEdit = (e: EditState | null) => {
    editRef.current = e
    setEditState(e)
  }
  const editorRef = React.useRef<HTMLInputElement | HTMLSelectElement | null>(null)
  const [flash, setFlash] = React.useState<string | null>(null)
  const flashTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  React.useEffect(() => () => clearTimeout(flashTimer.current), [])
  const editableFor = (col: DataGridColumn<T>, row: T) => typeOf(col) !== "actions" && (typeof col.editable === "function" ? col.editable(row) : !!col.editable)

  React.useEffect(() => {
    const el = editorRef.current
    if (!edit || !el) return
    el.focus({ preventScroll: true })
    if (el instanceof HTMLInputElement && el.type === "text") {
      if (edit.replace) el.setSelectionRange(el.value.length, el.value.length)
      else el.select()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edit?.key, edit?.colId])

  const apply = async (row: T, key: string, col: DataGridColumn<T>, value: unknown, previous: unknown, ed?: EditState): Promise<string | null> => {
    const invalid = col.validate?.(value, row)
    if (invalid) return invalid
    if (sameValue(value, previous)) return null
    let res: unknown
    try {
      res = onCellEdit?.({ row, rowKey: key, columnId: col.id, value, previous })
      if (res && typeof (res as Promise<unknown>).then === "function") {
        if (ed) setEdit({ ...ed, pending: true, error: undefined })
        res = await res
      }
    } catch (err) {
      return err instanceof Error && err.message ? err.message : l.saveFailed
    }
    if (typeof res === "string" && res) return res
    if (anim !== "none") {
      clearTimeout(flashTimer.current)
      setFlash(key + "\u0000" + col.id)
      flashTimer.current = setTimeout(() => setFlash(null), 950)
    }
    return null
  }

  const startEdit = (r: number, c: number, initial?: string) => {
    const d = cols[c]
    const di = paged[r]
    if (!d?.col || di === undefined) return
    const row = data[di]!
    if (!editableFor(d.col, row)) return
    const v = readValue(d.col, row)
    if (typeOf(d.col) === "boolean") {
      void apply(row, keys[di]!, d.col, !v, v)
      return
    }
    setEdit({ key: keys[di]!, colId: d.col.id, r, c, draft: initial ?? toDraft(d.col, v, locale), replace: initial !== undefined, pending: false })
  }
  const cancelEdit = () => {
    const ed = editRef.current
    setEdit(null)
    if (ed) moveFocus(ed.r, ed.c)
  }
  const commitEdit = async (move: { dc: number } | null) => {
    const ed = editRef.current
    if (!ed || ed.pending) return
    const di = keyIndex.get(ed.key)
    const col = byId.get(ed.colId)
    if (di === undefined || !col) {
      setEdit(null)
      return
    }
    const row = data[di]!
    const previous = readValue(col, row)
    const parsed = fromDraft(col, ed.draft, previous, locale, l)
    if ("error" in parsed) {
      setEdit({ ...ed, error: parsed.error })
      return
    }
    const err = await apply(row, ed.key, col, parsed.value, previous, ed)
    if (editRef.current?.key !== ed.key || editRef.current.colId !== ed.colId) return
    if (err) {
      setEdit({ ...ed, pending: false, error: err })
      return
    }
    setEdit(null)
    if (move) moveFocus(ed.r, ed.c + move.dc)
  }

  /* ---- column operations ---- */
  const moveColumn = (id: string, target: string, after: boolean) => {
    if (id === target) return
    const order = cs.order.filter((x) => x !== id)
    let i = order.indexOf(target)
    if (i < 0) return
    if (after) i++
    order.splice(i, 0, id)
    updateCs({ order })
  }
  /** Moves a column one step left or right on screen, within its pin group. */
  const shiftColumn = (id: string, visual: -1 | 1) => {
    const rtl = !!rootRef.current && getComputedStyle(rootRef.current).direction === "rtl"
    const dir = rtl ? -visual : visual
    const d = cols.find((x) => x.id === id)
    if (!d) return
    const group = cols.filter((x) => x.kind === "data" && x.pin === d.pin)
    const j = group.indexOf(d) + dir
    const target = group[j]
    if (target) moveColumn(id, target.id, dir > 0)
  }
  const widthOf = (id: string) => cs.widths[id] ?? 120
  const setWidth = (col: DataGridColumn<T>, w: number) => updateCs({ widths: { ...cs.widths, [col.id]: Math.round(clamp(w, col.minWidth ?? 64, col.maxWidth ?? 800)) } })
  const pinColumn = (id: string, pin: DataGridPin | null) => {
    const pinned = { ...cs.pinned }
    if (pin) pinned[id] = pin
    else delete pinned[id]
    updateCs({ pinned })
  }
  const hideColumn = (id: string, hide: boolean) => updateCs({ hidden: hide ? [...cs.hidden.filter((x) => x !== id), id] : cs.hidden.filter((x) => x !== id) })
  const visibleDataCount = cols.filter((d) => d.kind === "data").length

  const onResizeDown = (e: React.PointerEvent<HTMLDivElement>, col: DataGridColumn<T>) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)
    el.dataset.active = ""
    const x0 = e.clientX
    const w0 = widthOf(col.id)
    const rtl = getComputedStyle(el).direction === "rtl"
    const min = col.minWidth ?? 64
    const max = col.maxWidth ?? 800
    const at = (x: number) => clamp(w0 + (x - x0) * (rtl ? -1 : 1), min, max)
    const move = (ev: PointerEvent) => setResizing({ id: col.id, w: at(ev.clientX) })
    const up = (ev: PointerEvent) => {
      el.removeEventListener("pointermove", move)
      el.removeEventListener("pointerup", up)
      el.removeEventListener("pointercancel", up)
      delete el.dataset.active
      setResizing(null)
      setWidth(col, at(ev.clientX))
    }
    el.addEventListener("pointermove", move)
    el.addEventListener("pointerup", up)
    el.addEventListener("pointercancel", up)
  }

  // Drag to reorder: pointer events (mouse and pen), within the column's pin group.
  const [drag, setDrag] = React.useState<{ id: string; over: string | null; after: boolean } | null>(null)
  const dragLive = React.useRef<{ id: string; over: string | null; after: boolean } | null>(null)
  const suppressClick = React.useRef(false)
  const onHeaderPointerDown = (e: React.PointerEvent<HTMLDivElement>, d: DCol<T>) => {
    if (e.button !== 0 || e.pointerType === "touch" || !d.col || d.col.reorderable === false || (e.target as HTMLElement).closest("[data-noreorder]")) return
    const x0 = e.clientX
    const y0 = e.clientY
    let active = false
    const move = (ev: PointerEvent) => {
      if (!active) {
        if (Math.hypot(ev.clientX - x0, ev.clientY - y0) < 6) return
        active = true
      }
      const grid = gridRef.current
      if (!grid) return
      const rtl = getComputedStyle(grid).direction === "rtl"
      let over: string | null = null
      let after = false
      for (const el of Array.from(grid.querySelectorAll<HTMLElement>("[data-hcol]"))) {
        if ((el.dataset.pin ?? "") !== (d.pin ?? "")) continue
        const r = el.getBoundingClientRect()
        if (ev.clientX >= r.left && ev.clientX < r.right) {
          over = el.dataset.hcol ?? null
          after = rtl ? ev.clientX < r.left + r.width / 2 : ev.clientX > r.left + r.width / 2
        }
      }
      dragLive.current = { id: d.id, over, after }
      setDrag(dragLive.current)
    }
    const end = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", end)
      window.removeEventListener("pointercancel", end)
      const s = dragLive.current
      dragLive.current = null
      setDrag(null)
      if (!active) return
      suppressClick.current = true
      setTimeout(() => (suppressClick.current = false), 0)
      if (ev.type === "pointerup" && s?.over && s.over !== s.id) moveColumn(s.id, s.over, s.after)
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", end)
    window.addEventListener("pointercancel", end)
  }

  /* ---- menus ---- */
  const [menu, setMenu] = React.useState<MenuState | null>(null)
  const [panel, setPanel] = React.useState<"columns" | "export" | null>(null)
  const columnsBtn = React.useRef<HTMLButtonElement>(null)
  const exportBtn = React.useRef<HTMLButtonElement>(null)
  const closeMenu = (restore: boolean) => {
    const m = menu
    setMenu(null)
    if (restore && m) (m.returnTo ?? m.anchor).focus({ preventScroll: true })
  }
  const closePanel = (restore: boolean) => {
    const p = panel
    setPanel(null)
    if (restore) (p === "columns" ? columnsBtn : exportBtn).current?.focus()
  }
  const openMenu = (id: string, anchor: HTMLElement, returnTo: HTMLElement | null) => {
    setPanel(null)
    setMenu((m) => (m?.id === id && m.anchor === anchor ? null : { id, anchor, returnTo }))
  }

  /* ---- export ---- */
  const exportCols = cols.filter((d): d is DCol<T> & { col: DataGridColumn<T> } => !!d.col && d.col.exportable !== false && typeOf(d.col) !== "actions")
  const exportCount = selected.size ? scope.filter((i) => selected.has(keys[i]!)).length : scope.length
  const exportValue = (col: DataGridColumn<T>, row: T): unknown => {
    if (col.exportValue) return col.exportValue(row)
    const t = typeOf(col)
    const v = readValue(col, row)
    if (isNum(t)) {
      const x = v == null || v === "" ? NaN : Number(v)
      return Number.isFinite(x) ? x : null
    }
    if (t === "date" || t === "datetime") return toDate(v)
    if (t === "boolean") return v == null ? null : !!v
    return display(col, row, v)
  }
  const runExport = (kind: "csv" | "xlsx") => {
    const idx = selected.size ? scope.filter((i) => selected.has(keys[i]!)) : scope
    const rows = idx.map((i) => exportCols.map((d) => exportValue(d.col, data[i]!)))
    if (kind === "csv") downloadFile(buildCsv(exportCols.map((d) => d.col.header), rows), `${exportFileName}.csv`, "text/csv;charset=utf-8")
    else
      downloadFile(
        buildXlsx(
          exportCols.map((d) => ({ header: d.col.header, width: Math.round(d.width / 7), format: excelFormat(d.col, locale, currency) })),
          rows,
          exportFileName,
        ),
        `${exportFileName}.xlsx`,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      )
    setPanel(null)
  }

  /* ---- aggregates ---- */
  const aggValues = React.useMemo(() => {
    const out: Record<string, React.ReactNode> = {}
    if (!hasFooter || mode === "server") return out
    for (const c of columns) {
      const agg = c.aggregate
      if (!agg) continue
      if (typeof agg === "function") {
        out[c.id] = agg(processed.map((i) => data[i]!))
        continue
      }
      const t = typeOf(c)
      const isDate = t === "date" || t === "datetime"
      let sum = 0
      let cnt = 0
      let present = 0
      let min = Infinity
      let max = -Infinity
      for (const i of processed) {
        const v = readValue(c, data[i]!)
        if (v == null || v === "") continue
        present++
        const x = isDate ? (toDate(v)?.getTime() ?? NaN) : Number(v)
        if (!Number.isFinite(x)) continue
        sum += x
        cnt++
        if (x < min) min = x
        if (x > max) max = x
      }
      const f = fmts.get(c.id) ?? String
      const shown = (x: number) => (isDate ? f(new Date(x)) : f(x))
      const label = { sum: l.aggSum, avg: l.aggAvg, count: l.aggCount, min: l.aggMin, max: l.aggMax }[agg]
      const value =
        agg === "count"
          ? new Intl.NumberFormat(locale).format(present)
          : !cnt
            ? "–"
            : agg === "sum"
              ? shown(sum)
              : agg === "avg"
                ? shown(sum / cnt)
                : agg === "min"
                  ? shown(min)
                  : shown(max)
      out[c.id] = (
        <span className="pc-data-grid-aggv">
          <span className="pc-data-grid-agg">{label}</span>
          <span className="truncate" suppressHydrationWarning>
            {value}
          </span>
        </span>
      )
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasFooter, mode, columns, processed, data, fmts, locale, l.aggSum, l.aggAvg, l.aggCount, l.aggMin, l.aggMax])

  /* ---- keyboard ---- */
  const nameCol = cols.find((d) => d.col && (typeOf(d.col) === "text" || typeOf(d.col) === "avatar"))?.col
  const rowName = (row: T, key: string) => (nameCol ? display(nameCol, row) || key : key)
  const pageStep = Math.max(1, Math.floor(bodyView / rowH) - 1)

  const activate = (r: number, c: number, e: React.KeyboardEvent) => {
    const d = cols[c]
    if (!d) return
    if (r === -1) {
      if (d.kind === "select") toggleAll()
      else if (d.col && (d.col.sortable ?? typeOf(d.col) !== "actions")) toggleSort(d.col.id, e.shiftKey)
      return
    }
    const di = paged[r]
    if (di === undefined) return
    const key = keys[di]!
    if (d.kind === "select") toggleRow(r, e.shiftKey)
    else if (d.kind === "expand") toggleExpand(key)
    else if (d.col) {
      if (editableFor(d.col, data[di]!)) startEdit(r, c)
      else {
        const inner = (e.currentTarget as HTMLElement).querySelector<HTMLElement>(`[data-r="${r}"][data-c="${c}"]`)?.querySelector<HTMLElement>("button:not([disabled]),a[href],input,select")
        inner?.focus()
      }
    }
  }

  const onGridKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.defaultPrevented) return
    const target = e.target as HTMLElement
    if (target.closest("[data-editor]")) return
    const cell = target.closest<HTMLElement>("[data-c]")
    if (!cell || !e.currentTarget.contains(cell)) return
    const r = Number(cell.dataset.r)
    const c = Number(cell.dataset.c)
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl"
    const fwd = (key: string) => (key === "ArrowRight") !== rtl
    if (target !== cell) {
      // Focus is on a widget inside the cell (an action button, a link).
      if (e.key === "Escape") {
        e.preventDefault()
        moveFocus(r, c)
      } else if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "Tab") {
        const items = Array.from(cell.querySelectorAll<HTMLElement>("button:not([disabled]),a[href]"))
        const i = items.indexOf(target)
        if (i < 0 || items.length < 2) return
        e.preventDefault()
        const step = e.key === "Tab" ? (e.shiftKey ? -1 : 1) : fwd(e.key) ? 1 : -1
        items[(i + step + items.length) % items.length]!.focus()
      }
      return
    }
    const d = cols[c]
    const mod = e.ctrlKey || e.metaKey
    switch (e.key) {
      case "ArrowDown":
        if (r === -1 && e.altKey && d?.col && columnMenu) {
          e.preventDefault()
          openMenu(d.col.id, cell.querySelector<HTMLElement>("[data-hmenu]") ?? cell, cell)
          return
        }
        e.preventDefault()
        moveFocus(r + 1, c)
        return
      case "ArrowUp":
        e.preventDefault()
        moveFocus(r - 1, c)
        return
      case "ArrowLeft":
      case "ArrowRight": {
        e.preventDefault()
        if (r === -1 && e.altKey && d?.col) {
          const grow = fwd(e.key) ? 1 : -1
          if (e.shiftKey) {
            if (d.col.reorderable !== false) shiftColumn(d.col.id, e.key === "ArrowRight" ? 1 : -1)
          } else if (d.col.resizable !== false) setWidth(d.col, widthOf(d.col.id) + grow * 16)
          return
        }
        moveFocus(r, c + (fwd(e.key) ? 1 : -1))
        return
      }
      case "Home":
        e.preventDefault()
        // The header is sticky, so Ctrl+Home also scrolls back to the first row.
        if (mod) scrollRef.current?.scrollTo({ top: 0 })
        moveFocus(mod ? -1 : r, 0)
        return
      case "End":
        e.preventDefault()
        moveFocus(mod ? n - 1 : r, cols.length - 1)
        return
      case "PageDown":
        e.preventDefault()
        moveFocus(Math.min(n - 1, r + pageStep), c)
        return
      case "PageUp":
        e.preventDefault()
        moveFocus(r === -1 ? -1 : Math.max(0, r - pageStep), c)
        return
      case "Enter":
        e.preventDefault()
        activate(r, c, e)
        return
      case "F2":
        if (r >= 0) {
          e.preventDefault()
          startEdit(r, c)
        }
        return
      case "ContextMenu":
      case "F10":
        if (r === -1 && d?.col && columnMenu && (e.key === "ContextMenu" || e.shiftKey)) {
          e.preventDefault()
          openMenu(d.col.id, cell.querySelector<HTMLElement>("[data-hmenu]") ?? cell, cell)
        }
        return
      case " ": {
        e.preventDefault()
        if (r === -1) {
          if (d?.kind === "select") toggleAll()
          return
        }
        const di = paged[r]
        if (di === undefined || !d) return
        if (selectable && (d.kind === "select" || e.shiftKey)) toggleRow(r, false)
        else if (d.kind === "expand") toggleExpand(keys[di]!)
        else if (d.col && typeOf(d.col) === "boolean" && editableFor(d.col, data[di]!)) startEdit(r, c)
        return
      }
      default:
        if (mod && e.key.toLowerCase() === "a" && selectable) {
          e.preventDefault()
          if (!allSelected) toggleAll()
          return
        }
        if (r >= 0 && d?.col && e.key.length === 1 && !mod && !e.altKey) {
          const t = typeOf(d.col)
          const di = paged[r]
          if (di !== undefined && (t === "text" || t === "avatar" || isNum(t)) && !d.col.options && editableFor(d.col, data[di]!)) {
            e.preventDefault()
            startEdit(r, c, e.key)
          }
        }
    }
  }
  const onGridFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    const cell = (e.target as HTMLElement).closest<HTMLElement>("[data-c]")
    if (!cell || (e.target as HTMLElement).closest("[data-editor]")) return
    const r = Number(cell.dataset.r)
    const c = Number(cell.dataset.c)
    if (r !== fr || c !== fc) setFocus({ r, c })
  }
  /** After clicking a control inside a header/select/expand cell, keep keyboard focus on the cell itself. */
  const refocus = (r: number, c: number) => moveFocus(r, c)

  /* ---- render helpers ---- */
  const pinStyle = (d: DCol<T>): React.CSSProperties | undefined => (d.pin === "start" ? { insetInlineStart: d.offset } : d.pin === "end" ? { insetInlineEnd: d.offset } : undefined)
  const alignOf = (col: DataGridColumn<T>) => col.align ?? (isNum(typeOf(col)) || typeOf(col) === "actions" ? "end" : typeOf(col) === "boolean" ? "center" : undefined)
  const hintId = uid + "-hint"
  const editHintId = uid + "-edit"
  const sortIndex = (id: string) => sort.findIndex((s) => s.id === id)

  const optionsFor = (col: DataGridColumn<T>): DataGridOption[] => {
    if (col.options) return col.options
    if (typeOf(col) === "boolean")
      return [
        { value: "true", label: l.yes },
        { value: "false", label: l.no },
      ]
    if (mode === "server") return []
    const seen = new Map<string, string>()
    for (const row of data) {
      const v = readValue(col, row)
      if (v == null || v === "") continue
      const k = String(v)
      if (!seen.has(k)) seen.set(k, display(col, row, v))
      if (seen.size >= 100) break
    }
    return Array.from(seen, ([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label, locale))
  }

  const filterSummary = (col: DataGridColumn<T>, f: DataGridFilter) => {
    const fmt = fmts.get(col.id) ?? String
    if (f.kind === "text") return `“${f.value}”`
    if (f.kind === "number") return f.min != null && f.max != null ? `${fmt(f.min)}–${fmt(f.max)}` : f.min != null ? `≥ ${fmt(f.min)}` : `≤ ${fmt(f.max)}`
    if (f.kind === "date") {
      const df = new Intl.DateTimeFormat(locale, { dateStyle: "medium" })
      const show = (s?: string) => {
        const d = toDate(s)
        return d ? df.format(d) : ""
      }
      return f.from && f.to ? `${show(f.from)}–${show(f.to)}` : f.from ? `≥ ${show(f.from)}` : `≤ ${show(f.to)}`
    }
    const opts = optionsFor(col)
    const names = f.values.map((v) => opts.find((o) => o.value === v)?.label ?? v)
    return names.length > 2 ? `${names.slice(0, 2).join(", ")} +${names.length - 2}` : names.join(", ")
  }

  const renderHeaderCell = (d: DCol<T>, c: number) => {
    const base = {
      role: "columnheader" as const,
      "aria-colindex": c + 1,
      "data-r": -1,
      "data-c": c,
      tabIndex: fr === -1 && fc === c ? 0 : -1,
      "data-pin": d.pin,
      "data-edge": d.edge,
      style: pinStyle(d),
    }
    if (d.kind === "select")
      return (
        <div key={d.id} {...base} aria-label={l.selectAll} className="pc-data-grid-cell pc-data-grid-hcell justify-center !p-0">
          <TickBox
            checked={allSelected}
            mixed={someSelected}
            label={l.selectAll}
            disabled={!scope.length}
            onToggle={() => {
              toggleAll()
              refocus(-1, c)
            }}
          />
        </div>
      )
    if (d.kind === "expand")
      return (
        <div key={d.id} {...base} className="pc-data-grid-cell pc-data-grid-hcell">
          <span className="sr-only">{l.details}</span>
        </div>
      )
    const col = d.col!
    const t = typeOf(col)
    const sortable = col.sortable ?? t !== "actions"
    const si = sortIndex(col.id)
    const s = sort[si]
    const filtered = !!filters[col.id]
    const kind = filterKindOf(col)
    const menuOpen = menu?.id === col.id
    const align = alignOf(col)
    const label = col.header || (t === "actions" ? l.actions : col.id)
    return (
      <div
        key={d.id}
        {...base}
        aria-sort={s ? (s.desc ? "descending" : "ascending") : undefined}
        aria-label={label}
        aria-describedby={hintId}
        data-hcol={col.id}
        data-align={align}
        data-movable={col.reorderable !== false ? "" : undefined}
        data-dragging={drag?.id === col.id && drag.over ? "" : undefined}
        data-drop={drag && drag.over === col.id && drag.id !== col.id ? (drag.after ? "after" : "before") : undefined}
        className={cn("pc-data-grid-cell pc-data-grid-hcell", col.className)}
        onPointerDown={(e) => onHeaderPointerDown(e, d)}
      >
        {sortable ? (
          <button
            type="button"
            tabIndex={-1}
            className="pc-press pc-data-grid-hlabel"
            onClick={(e) => {
              if (suppressClick.current) return
              toggleSort(col.id, e.shiftKey)
              refocus(-1, c)
            }}
          >
            <span className="truncate">{col.header}</span>
            {s && (
              <span className="pc-data-grid-sort" aria-hidden="true">
                {s.desc ? <ArrowDown /> : <ArrowUp />}
                {sort.length > 1 && <span className="pc-data-grid-prio">{si + 1}</span>}
              </span>
            )}
            {filtered && <span className="pc-data-grid-fdot" aria-hidden="true" />}
            {s && (
              <span className="sr-only">
                , {s.desc ? l.sortedDescending : l.sortedAscending}
                {sort.length > 1 ? `, ${l.sortPriority(si + 1)}` : ""}
              </span>
            )}
          </button>
        ) : (
          <span className="pc-data-grid-hlabel cursor-default">
            <span className={cn("truncate", !col.header && "sr-only")}>{label}</span>
            {filtered && <span className="pc-data-grid-fdot" aria-hidden="true" />}
          </span>
        )}
        {columnMenu && (kind || sortable || col.hideable !== false) && (
          <button
            type="button"
            tabIndex={-1}
            data-hmenu=""
            data-noreorder=""
            data-active={filtered ? "" : undefined}
            className="pc-press pc-data-grid-hmenu"
            aria-label={l.columnMenu(label)}
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            onClick={(e) => openMenu(col.id, e.currentTarget, e.currentTarget.closest<HTMLElement>("[data-c]"))}
          >
            <EllipsisVertical aria-hidden="true" />
          </button>
        )}
        {col.resizable !== false && t !== "actions" && (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label={l.resizeColumn(label)}
            aria-valuenow={Math.round(d.width)}
            aria-valuemin={col.minWidth ?? 64}
            aria-valuemax={col.maxWidth ?? 800}
            data-noreorder=""
            className="pc-data-grid-resize"
            onPointerDown={(e) => onResizeDown(e, col)}
            onDoubleClick={() => setWidth(col, col.width ?? defaultWidth(col))}
          />
        )}
      </div>
    )
  }

  const avatarSize = DENSITY[density].avatar

  const renderBodyCell = (d: DCol<T>, c: number, r: number, row: T, key: string) => {
    const base = {
      role: "gridcell" as const,
      "aria-colindex": c + 1,
      "data-r": r,
      "data-c": c,
      tabIndex: fr === r && fc === c ? 0 : -1,
      "data-pin": d.pin,
      "data-edge": d.edge,
      style: pinStyle(d),
    }
    const name = rowName(row, key)
    if (d.kind === "select")
      return (
        <div key={d.id} {...base} className="pc-data-grid-cell justify-center !p-0">
          <TickBox
            checked={selected.has(key)}
            label={l.selectRow(name)}
            onToggle={(shift) => {
              toggleRow(r, shift)
              refocus(r, c)
            }}
          />
        </div>
      )
    if (d.kind === "expand") {
      const open = expanded.has(key)
      return (
        <div key={d.id} {...base} className="pc-data-grid-cell justify-center !p-0">
          <button
            type="button"
            tabIndex={-1}
            className="pc-press pc-data-grid-exp"
            aria-expanded={open}
            aria-label={open ? l.collapseRow(name) : l.expandRow(name)}
            onClick={() => {
              toggleExpand(key)
              refocus(r, c)
            }}
          >
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      )
    }
    const col = d.col!
    const t = typeOf(col)
    const v = readValue(col, row)
    const editable = editableFor(col, row)
    const isEditing = edit?.key === key && edit.colId === col.id
    const flashing = flash === key + "\u0000" + col.id
    const formatted = display(col, row, v)
    let content: React.ReactNode
    if (isEditing) {
      const errId = uid + "-err"
      const common = {
        "data-editor": "",
        className: "pc-data-grid-editor",
        "aria-label": col.header,
        "aria-invalid": !!edit.error || undefined,
        "aria-describedby": edit.error ? errId : undefined,
        "aria-busy": edit.pending || undefined,
        onKeyDown: (e: React.KeyboardEvent) => {
          e.stopPropagation()
          if (e.key === "Enter") {
            e.preventDefault()
            void commitEdit({ dc: 0 })
          } else if (e.key === "Escape") {
            e.preventDefault()
            cancelEdit()
          } else if (e.key === "Tab") {
            e.preventDefault()
            void commitEdit({ dc: e.shiftKey ? -1 : 1 })
          }
        },
        onBlur: () => {
          const cur = editRef.current
          if (cur && !cur.pending && cur.key === key && cur.colId === col.id && !cur.error) void commitEdit(null)
        },
      }
      content = (
        <>
          {col.options ? (
            <select
              {...common}
              ref={(el) => {
                editorRef.current = el
              }}
              value={edit.draft}
              onChange={(e) => !edit.pending && setEdit({ ...edit, draft: e.target.value, error: undefined })}
            >
              {col.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              {...common}
              ref={(el) => {
                editorRef.current = el
              }}
              type={t === "date" ? "date" : t === "datetime" ? "datetime-local" : "text"}
              inputMode={isNum(t) ? "decimal" : undefined}
              readOnly={edit.pending}
              value={edit.draft}
              onChange={(e) => setEdit({ ...edit, draft: e.target.value, error: undefined })}
            />
          )}
          {edit.error && (
            <span id={errId} role="alert" className="pc-data-grid-err" data-up={r === n - 1 && n > 2 ? "" : undefined}>
              {edit.error}
            </span>
          )}
        </>
      )
    } else if (col.render) content = col.render({ value: v, row, rowKey: key, formatted })
    else if (t === "boolean")
      content =
        v == null ? null : (
          <span className="pc-data-grid-bool" data-on={v ? "" : undefined}>
            {v ? <Check aria-hidden="true" /> : <Minus aria-hidden="true" />}
            <span className="sr-only">{v ? l.yes : l.no}</span>
          </span>
        )
    else if (t === "badge" && v != null && v !== "") {
      const o = col.options?.find((x) => x.value === String(v))
      content = (
        <Badge size="xs" shape="pill" variant="soft" tone={o?.tone ?? "neutral"}>
          {formatted}
        </Badge>
      )
    } else if (t === "avatar") {
      const sub = col.subtitle?.(row)
      content = (
        <span className="flex min-w-0 items-center gap-2.5">
          <Avatar size={avatarSize} name={formatted} src={col.image?.(row)} aria-hidden="true" />
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate font-medium">{formatted}</span>
            {sub && density !== "compact" && <span className="pc-data-grid-muted truncate text-xs">{sub}</span>}
          </span>
        </span>
      )
    } else if (t === "actions") {
      const acts = typeof col.actions === "function" ? col.actions(row) : (col.actions ?? [])
      content = (
        <span className="flex items-center gap-0.5">
          {acts.map((a, i) => (
            <button
              key={a.label + i}
              type="button"
              tabIndex={-1}
              className="pc-press pc-data-grid-act"
              data-tone={a.tone}
              aria-label={a.icon ? `${a.label}, ${name}` : undefined}
              title={a.icon ? a.label : undefined}
              disabled={a.disabled?.(row)}
              onClick={(e) => {
                e.stopPropagation()
                a.onClick(row)
              }}
            >
              {a.icon ?? a.label}
            </button>
          ))}
        </span>
      )
    } else
      content = (
        <span className="truncate" suppressHydrationWarning={t === "date" || t === "datetime" || undefined}>
          {formatted}
        </span>
      )
    return (
      <div
        key={d.id}
        {...base}
        data-align={alignOf(col)}
        data-num={isNum(t) || undefined}
        data-editable={editable && t !== "boolean" ? "" : undefined}
        data-editing={isEditing ? "" : undefined}
        data-flash={flashing ? "" : undefined}
        aria-readonly={!editable && onCellEdit ? true : undefined}
        aria-describedby={editable && !isEditing ? editHintId : undefined}
        className={cn("pc-data-grid-cell", col.className)}
        onDoubleClick={editable && !isEditing ? () => startEdit(r, c) : undefined}
      >
        {content}
      </div>
    )
  }

  // Rows to render: the visible window plus the focused and edited rows, so focus is never lost to virtualization.
  const indices: number[] = []
  if (!error) {
    for (let i = first; i <= last; i++) indices.push(i)
    const extra = [fr, edit ? edit.r : -1].filter((x) => x >= 0 && x < n && (x < first || x > last))
    for (const x of Array.from(new Set(extra))) indices.push(x)
    indices.sort((a, b) => a - b)
  }

  const filteredOut = mode === "client" && data.length > 0 && processed.length === 0
  const showSkeleton = loading && data.length === 0 && !error
  const showEmpty = !loading && !error && n === 0
  const rowCountTotal = mode === "server" ? (rowCount ?? data.length) + 1 + (hasFooter ? 1 : 0) : n + 1 + (hasFooter ? 1 : 0)
  const shownTotal = mode === "server" ? (rowCount ?? data.length) : processed.length
  const allTotal = mode === "server" ? (rowCount ?? data.length) : data.length
  const status = l.rowCount(shownTotal, allTotal)
  const menuCol = menu ? byId.get(menu.id) : undefined
  const bodyHeight = showSkeleton ? undefined : n === 0 ? 200 : offsetOf(n)

  return (
    <>
      <GooduiTokens />
      <style href="pc-data-grid" precedence="default">
        {CSS}
      </style>
      <div
        {...rest}
        ref={rootRef}
        data-slot="data-grid"
        data-variant={variant}
        data-tone={tone}
        data-density={density}
        data-shadow={shadow}
        data-shape={shape}
        data-anim={anim}
        data-sx-start={scroll.sxs ? "" : undefined}
        data-sx-end={scroll.sxe ? "" : undefined}
        className={cn("pc-data-grid flex w-full flex-col", DENSITY[density].text, className)}
        style={{ ...style, ["--pc-rh" as string]: `${rowH}px`, ["--pc-fh" as string]: `${footH}px` }}
      >
        {toolbar && (
          <div className="pc-data-grid-toolbar">
            {searchable && (
              <div className="pc-data-grid-search">
                <Search aria-hidden="true" />
                <input
                  type="search"
                  value={search}
                  placeholder={l.search}
                  aria-label={l.searchLabel}
                  aria-controls={uid + "-grid"}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={() => {
                    // Build the search index before the first keystroke.
                    if (mode === "client") setTimeout(searchIndex, 0)
                  }}
                />
                {search && (
                  <button type="button" className="pc-press pc-data-grid-x" aria-label={l.clearSearch} onClick={() => setSearch("")}>
                    <X aria-hidden="true" />
                  </button>
                )}
              </div>
            )}
            {activeFilters.map(([id, f]) => {
              const col = byId.get(id)!
              return (
                <span key={id} className="pc-data-grid-chip">
                  <button className="pc-press" type="button" aria-haspopup="dialog" onClick={(e) => openMenu(id, e.currentTarget.parentElement ?? e.currentTarget, e.currentTarget)}>
                    <span className="opacity-75">{col.header}:</span>
                    <span className="truncate" suppressHydrationWarning>
                      {filterSummary(col, f)}
                    </span>
                  </button>
                  <button type="button" className="pc-press pc-data-grid-x" aria-label={l.removeFilter(col.header)} onClick={() => setFilter(id, null)}>
                    <X aria-hidden="true" />
                  </button>
                </span>
              )
            })}
            {activeFilters.length > 1 && (
              <button type="button" className="pc-press pc-data-grid-btn" data-ghost="" onClick={() => setFilters({})}>
                {l.clearFilters}
              </button>
            )}
            <div className="ms-auto flex flex-wrap items-center gap-2">
              {toolbarExtra}
              {columnMenu && (
                <button
                  ref={columnsBtn}
                  type="button"
                  className="pc-press pc-data-grid-btn"
                  aria-haspopup="dialog"
                  aria-expanded={panel === "columns"}
                  onClick={() => {
                    setMenu(null)
                    setPanel((p) => (p === "columns" ? null : "columns"))
                  }}
                >
                  <Columns3 aria-hidden="true" />
                  <span className="max-sm:sr-only">{l.columns}</span>
                </button>
              )}
              {exportable && (
                <button
                  ref={exportBtn}
                  type="button"
                  className="pc-press pc-data-grid-btn"
                  aria-haspopup="dialog"
                  aria-expanded={panel === "export"}
                  onClick={() => {
                    setMenu(null)
                    setPanel((p) => (p === "export" ? null : "export"))
                  }}
                >
                  <Download aria-hidden="true" />
                  <span className="max-sm:sr-only">{l.export}</span>
                </button>
              )}
            </div>
          </div>
        )}

        <div className="pc-data-grid-frame">
          {loading && !showSkeleton && <div className="pc-data-grid-bar" role="presentation" />}
          <div
            ref={scrollRef}
            className="pc-data-grid-scroll"
            onScroll={readScroll}
            style={{ maxHeight: height, scrollPaddingTop: headH, scrollPaddingBottom: footH, scrollPaddingInlineStart: layout.startW, scrollPaddingInlineEnd: layout.endW }}
          >
            <div
              ref={gridRef}
              id={uid + "-grid"}
              role="grid"
              aria-label={ariaLabel ?? l.grid}
              aria-rowcount={rowCountTotal}
              aria-colcount={cols.length}
              aria-multiselectable={selectable || undefined}
              aria-busy={loading || undefined}
              className="pc-data-grid-grid"
              style={{ width: layout.total, ["--pc-cols" as string]: layout.template }}
              onKeyDown={onGridKeyDown}
              onFocus={onGridFocus}
            >
              <div role="rowgroup" className="pc-data-grid-head">
                <div role="row" aria-rowindex={1} className="pc-data-grid-row">
                  {cols.map((d, c) => renderHeaderCell(d, c))}
                </div>
              </div>
              <div role="rowgroup" className="pc-data-grid-body" style={{ height: bodyHeight }}>
                {showSkeleton
                  ? Array.from({ length: 6 }, (_, r) => (
                      <div key={r} role="row" className="pc-data-grid-row" style={{ position: "relative" }}>
                        {cols.map((d, c) => (
                          <div key={d.id} role="gridcell" className="pc-data-grid-cell" data-pin={d.pin} style={pinStyle(d)}>
                            <span className="pc-data-grid-skel" style={{ width: `${40 + ((r * 7 + c * 13) % 45)}%`, marginInlineStart: d.col && alignOf(d.col) === "end" ? "auto" : undefined }} />
                            {r === 0 && c === 0 && <span className="sr-only">{l.loading}</span>}
                          </div>
                        ))}
                      </div>
                    ))
                  : indices.map((r) => {
                      const di = paged[r]!
                      const row = data[di]!
                      const key = keys[di]!
                      const isSel = selected.has(key)
                      const rt = rowTone?.(row)
                      const open = !!renderExpanded && expanded.has(key)
                      return (
                        <div key={key} role="presentation" className="pc-data-grid-item" data-raise={edit?.key === key ? "" : undefined} style={{ transform: `translateY(${offsetOf(r)}px)` }}>
                          <div
                            role="row"
                            aria-rowindex={2 + pageOffset + r}
                            aria-selected={selectable ? isSel : undefined}
                            data-odd={r % 2 ? "" : undefined}
                            data-tone={rt && rt !== "none" ? rt : undefined}
                            className="pc-data-grid-row"
                          >
                            {cols.map((d, c) => renderBodyCell(d, c, r, row, key))}
                          </div>
                          {open && (
                            <div
                              role="row"
                              data-key={key}
                              className="pc-data-grid-detail"
                              ref={(el) => {
                                if (!el) return
                                const ro = detailRO()
                                ro.observe(el)
                                return () => ro.unobserve(el)
                              }}
                            >
                              <motion.div
                                role="gridcell"
                                aria-colspan={cols.length}
                                aria-label={l.details}
                                initial={anim === "none" ? false : { opacity: 0, y: anim === "spring" ? -6 : 0 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={anim === "spring" ? spring.ui : { duration: anim === "fade" ? 0.18 : 0 }}
                                style={{ width: view.w || "100%" }}
                              >
                                {renderExpanded(row)}
                              </motion.div>
                            </div>
                          )}
                        </div>
                      )
                    })}
              </div>
              {hasFooter && (
                <div role="rowgroup" className="pc-data-grid-foot">
                  <div role="row" aria-rowindex={rowCountTotal} className="pc-data-grid-row">
                    {cols.map((d, c) => (
                      <div key={d.id} role="gridcell" aria-colindex={c + 1} className="pc-data-grid-cell" data-pin={d.pin} data-edge={d.edge} data-num="" data-align={d.col ? alignOf(d.col) : undefined} style={pinStyle(d)}>
                        {d.col && (aggregates?.[d.col.id] ?? aggValues[d.col.id])}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {(showEmpty || !!error) && (
            <div className="pc-data-grid-overlay" style={{ top: headH, bottom: footH }}>
              {error ? (
                <div role="alert" className="flex flex-col items-center gap-2">
                  <TriangleAlert className="size-5 text-[var(--pc-danger)]" aria-hidden="true" />
                  <p className="text-sm font-medium">{error === true ? l.error : error}</p>
                  {onRetry && (
                    <button type="button" className="pc-press pc-data-grid-btn mt-1" onClick={onRetry}>
                      <RotateCcw aria-hidden="true" />
                      {l.retry}
                    </button>
                  )}
                </div>
              ) : filteredOut || search || activeFilters.length ? (
                <div className="flex flex-col items-center gap-2">
                  <Search className="pc-data-grid-muted size-5" aria-hidden="true" />
                  <p className="pc-data-grid-muted text-sm">{l.noResults}</p>
                  {mode === "client" && (
                    <button
                      type="button"
                      className="pc-press pc-data-grid-btn mt-1"
                      onClick={() => {
                        setFilters({})
                        setSearch("")
                      }}
                    >
                      {l.clearFilters}
                    </button>
                  )}
                </div>
              ) : (
                (emptyState ?? <p className="pc-data-grid-muted text-sm">{l.empty}</p>)
              )}
            </div>
          )}

          <AnimatePresence initial={false}>
            {selectable && selected.size > 0 && (
              <motion.div
                key="bulk"
                role="toolbar"
                aria-label={l.bulkActions}
                className="pc-data-grid-bulk"
                initial={anim === "spring" ? { opacity: 0, y: 16, scale: 0.96 } : { opacity: anim === "none" ? 1 : 0 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={anim === "spring" ? { opacity: 0, y: 12, scale: 0.97 } : { opacity: anim === "none" ? 1 : 0 }}
                transition={anim === "spring" ? spring.snap : { duration: anim === "fade" ? 0.15 : 0 }}
              >
                <span>{l.selectedCount(selected.size)}</span>
                {bulkActions && bulkActions.length > 0 && <i aria-hidden="true" />}
                {bulkActions?.map((a) => (
                  <button className="pc-press"
                    key={a.label}
                    type="button"
                    data-tone={a.tone}
                    onClick={() => {
                      const { rows, ks } = selectedRows()
                      a.onClick(rows, ks)
                    }}
                  >
                    {a.icon}
                    {a.label}
                  </button>
                ))}
                <i aria-hidden="true" />
                <button className="pc-press" type="button" aria-label={l.clearSelection} title={l.clearSelection} onClick={() => commitSelection(new Set())}>
                  <X aria-hidden="true" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {(showStatus || paging) && (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-1">
            {showStatus && (
              <span className="pc-data-grid-muted text-xs tabular-nums" aria-hidden="true">
                {status}
                {selected.size > 0 && ` · ${l.selectedCount(selected.size)}`}
              </span>
            )}
            {paging && (
              <Pagination
                className="ms-auto"
                tone={tone}
                variant="ghost"
                size="sm"
                totalItems={total}
                page={curPage}
                onPageChange={setPage}
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
                pageSizeOptions={pageSizeOptions}
                showPageSize
                showInfo={!showStatus}
                animation={anim === "none" ? "none" : "slide"}
              />
            )}
          </div>
        )}
        <div role="status" aria-live="polite" className="sr-only">
          {mounted ? status : ""}
        </div>
        <span id={hintId} hidden>
          {l.headerHint}
        </span>
        <span id={editHintId} hidden>
          {l.editHint}
        </span>

        {/* Column menu: filter, sort, pin, move, hide. */}
        <Popover open={!!menu && !!menuCol} anchor={menu?.anchor ?? null} onClose={closeMenu} label={menuCol ? l.columnMenu(menuCol.header) : ""} tone={tone} anim={anim} className="w-64">
          {menuCol && (
            <ColumnMenuBody
              key={menuCol.id}
              col={menuCol}
              kind={filterKindOf(menuCol)}
              filter={filters[menuCol.id]}
              onFilter={(f) => setFilter(menuCol.id, f)}
              options={filterKindOf(menuCol) === "select" ? optionsFor(menuCol) : []}
              sortDir={(() => {
                const s = sort.find((x) => x.id === menuCol.id)
                return s ? (s.desc ? "desc" : "asc") : null
              })()}
              sortable={menuCol.sortable ?? typeOf(menuCol) !== "actions"}
              onSort={(dir) => setSortTo(menuCol.id, dir === null ? null : dir === "desc")}
              pin={cs.pinned[menuCol.id] ?? null}
              onPin={(p) => pinColumn(menuCol.id, p)}
              canHide={menuCol.hideable !== false && visibleDataCount > 1}
              onHide={() => {
                hideColumn(menuCol.id, true)
                setMenu(null)
                moveFocus(-1, Math.max(0, fc - 1))
              }}
              canMove={menuCol.reorderable !== false}
              onMove={(dir) => shiftColumn(menuCol.id, dir)}
              l={l}
              locale={locale}
            />
          )}
        </Popover>

        <Popover open={panel === "columns"} anchor={columnsBtn.current} onClose={closePanel} label={l.columns} align="end" tone={tone} anim={anim} className="w-60">
          <div className="pc-data-grid-ptitle">{l.columns}</div>
          <div className="flex flex-col">
            {cs.order.map((id) => {
              const c = byId.get(id)
              if (!c) return null
              const on = !cs.hidden.includes(id)
              const locked = c.hideable === false || (on && visibleDataCount <= 1)
              return (
                <label key={id} className={cn("pc-data-grid-opt", locked && "cursor-not-allowed opacity-60")}>
                  <input type="checkbox" checked={on} disabled={locked} onChange={() => hideColumn(id, on)} />
                  <span className="min-w-0 flex-1 truncate">{c.header || l.actions}</span>
                  {cs.pinned[id] && <Pin className="pc-data-grid-muted size-3.5" aria-hidden="true" />}
                </label>
              )
            })}
          </div>
          <div className="pc-data-grid-sep" />
          <button type="button" className="pc-press pc-data-grid-mi" disabled={!cs.hidden.length} onClick={() => updateCs({ hidden: [] })}>
            <Columns3 aria-hidden="true" />
            {l.showAll}
          </button>
          <button
            type="button"
            className="pc-press pc-data-grid-mi"
            onClick={() => {
              const reset: DataGridColumnState = {
                order: columns.map((c) => c.id),
                widths: Object.fromEntries(columns.map((c) => [c.id, c.width ?? defaultWidth(c)])),
                pinned: Object.fromEntries(columns.flatMap((c) => (c.pin ? [[c.id, c.pin]] : []))),
                hidden: columns.filter((c) => c.hidden).map((c) => c.id),
              }
              setCsRaw(reset)
              onColumnStateChange?.(reset)
            }}
          >
            <RotateCcw aria-hidden="true" />
            {l.resetColumns}
          </button>
        </Popover>

        <Popover open={panel === "export"} anchor={exportBtn.current} onClose={closePanel} label={l.export} align="end" tone={tone} anim={anim} className="w-56">
          <div className="pc-data-grid-hint">{l.exportScope(selected.size ? exportCount : 0, exportCount)}</div>
          <button type="button" className="pc-press pc-data-grid-mi" disabled={!exportCount} onClick={() => runExport("csv")}>
            <FileText aria-hidden="true" />
            {l.exportCsv}
          </button>
          <button type="button" className="pc-press pc-data-grid-mi" disabled={!exportCount} onClick={() => runExport("xlsx")}>
            <FileSpreadsheet aria-hidden="true" />
            {l.exportXlsx}
          </button>
        </Popover>
      </div>
    </>
  )
}

type ColumnMenuBodyProps<T> = {
  col: DataGridColumn<T>
  kind: DataGridFilterKind | null
  filter?: DataGridFilter
  onFilter: (f: DataGridFilter | null) => void
  options: DataGridOption[]
  sortDir: "asc" | "desc" | null
  sortable: boolean
  onSort: (dir: "asc" | "desc" | null) => void
  pin: DataGridPin | null
  onPin: (pin: DataGridPin | null) => void
  canHide: boolean
  onHide: () => void
  canMove: boolean
  onMove: (dir: -1 | 1) => void
  l: DataGridLabels
  locale: string
}

function ColumnMenuBody<T>({ col, kind, filter, onFilter, options, sortDir, sortable, onSort, pin, onPin, canHide, onHide, canMove, onMove, l, locale }: ColumnMenuBodyProps<T>) {
  const header = col.header || l.actions
  const values = filter?.kind === "select" ? filter.values : []
  return (
    <>
      {kind && (
        <>
          <div className="pc-data-grid-ptitle">
            <span className="truncate">
              {l.filter} · {header}
            </span>
            {filter && (
              <button type="button" className="pc-press pc-data-grid-x" aria-label={l.clearFilter} title={l.clearFilter} onClick={() => onFilter(null)}>
                <X aria-hidden="true" />
              </button>
            )}
          </div>
          {kind === "text" && (
            <div className="px-1.5 pb-1">
              <input
                data-autofocus
                className="pc-data-grid-in"
                placeholder={l.contains}
                aria-label={`${l.filter} ${header}`}
                value={filter?.kind === "text" ? filter.value : ""}
                onChange={(e) => onFilter({ kind: "text", value: e.target.value })}
              />
            </div>
          )}
          {kind === "number" && <NumberRange value={filter} onChange={onFilter} l={l} locale={locale} scale={typeOf(col) === "percent" ? 100 : 1} header={header} />}
          {kind === "date" && (
            <div className="grid grid-cols-1 gap-2 px-1.5 pb-1">
              <label className="flex items-center gap-2 text-xs">
                <span className="w-10 shrink-0 text-muted-foreground">{l.from}</span>
                <input
                  data-autofocus
                  type="date"
                  className="pc-data-grid-in"
                  value={filter?.kind === "date" ? (filter.from ?? "") : ""}
                  onChange={(e) => onFilter({ kind: "date", from: e.target.value || undefined, to: filter?.kind === "date" ? filter.to : undefined })}
                />
              </label>
              <label className="flex items-center gap-2 text-xs">
                <span className="w-10 shrink-0 text-muted-foreground">{l.to}</span>
                <input
                  type="date"
                  className="pc-data-grid-in"
                  value={filter?.kind === "date" ? (filter.to ?? "") : ""}
                  onChange={(e) => onFilter({ kind: "date", from: filter?.kind === "date" ? filter.from : undefined, to: e.target.value || undefined })}
                />
              </label>
            </div>
          )}
          {kind === "select" && (
            <div className="flex max-h-48 flex-col overflow-y-auto pb-1">
              {options.map((o, i) => (
                <label key={o.value} className="pc-data-grid-opt">
                  <input
                    type="checkbox"
                    data-autofocus={i === 0 ? "" : undefined}
                    checked={values.includes(o.value)}
                    onChange={(e) => onFilter({ kind: "select", values: e.target.checked ? [...values, o.value] : values.filter((v) => v !== o.value) })}
                  />
                  <span className="truncate">{o.label}</span>
                </label>
              ))}
            </div>
          )}
          <div className="pc-data-grid-sep" />
        </>
      )}
      {sortable && (
        <>
          <button type="button" className="pc-press pc-data-grid-mi" data-on={sortDir === "asc" ? "" : undefined} onClick={() => onSort("asc")}>
            <ArrowUp aria-hidden="true" />
            {l.sortAscending}
          </button>
          <button type="button" className="pc-press pc-data-grid-mi" data-on={sortDir === "desc" ? "" : undefined} onClick={() => onSort("desc")}>
            <ArrowDown aria-hidden="true" />
            {l.sortDescending}
          </button>
          {sortDir && (
            <button type="button" className="pc-press pc-data-grid-mi" onClick={() => onSort(null)}>
              <X aria-hidden="true" />
              {l.clearSort}
            </button>
          )}
          <div className="pc-data-grid-sep" />
        </>
      )}
      {pin !== "start" && (
        <button type="button" className="pc-press pc-data-grid-mi" onClick={() => onPin("start")}>
          <Pin aria-hidden="true" />
          {l.pinStart}
        </button>
      )}
      {pin !== "end" && (
        <button type="button" className="pc-press pc-data-grid-mi" onClick={() => onPin("end")}>
          <Pin aria-hidden="true" className="-scale-x-100" />
          {l.pinEnd}
        </button>
      )}
      {pin && (
        <button type="button" className="pc-press pc-data-grid-mi" onClick={() => onPin(null)}>
          <PinOff aria-hidden="true" />
          {l.unpin}
        </button>
      )}
      {canMove && (
        <div className="flex gap-1">
          <button type="button" className="pc-press pc-data-grid-mi" onClick={() => onMove(-1)}>
            <ArrowLeft aria-hidden="true" />
            {l.moveLeft}
          </button>
          <button type="button" className="pc-press pc-data-grid-mi" onClick={() => onMove(1)}>
            <ArrowRight aria-hidden="true" />
            {l.moveRight}
          </button>
        </div>
      )}
      {canHide && (
        <button type="button" className="pc-press pc-data-grid-mi" onClick={onHide}>
          <EyeOff aria-hidden="true" />
          {l.hideColumn}
        </button>
      )}
    </>
  )
}

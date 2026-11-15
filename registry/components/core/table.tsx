"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import { GooduiTokens } from "@/lib/goodui-motion"

/*
 * One table, independent layers: every axis combines with every other.
 *   variant   lined, striped, bordered, cards (each row a card), minimal       tone       sort, selection and hover accent
 *   density   compact, normal, relaxed                                       shadow     frame elevation
 *   shape     square, rounded, soft corners                                  animation  rows fade or stagger in
 *   hover     none, tint, accent bar, lift                                   stack      rows become cards below a container width
 * Plus a sticky header, row tones for states (paid, overdue…), selected rows, a sortable-header affordance and a caption.
 * Two ways to use it: the parts (TableHeader, TableBody, TableRow, TableHead, TableCell…) like a plain <table>, or
 * columns + data, which sorts client-side and handles empty, loading, footer and stacking for you.
 * For editing, filtering, virtualization and export use data-grid.
 */

export type TableVariant = "lined" | "striped" | "bordered" | "cards" | "minimal"
export type TableTone = "primary" | "neutral" | "success" | "warning" | "danger" | "info"
export type TableDensity = "compact" | "normal" | "relaxed"
export type TableShadow = "none" | "sm" | "md" | "lg"
export type TableShape = "square" | "rounded" | "soft"
export type TableAnimation = "none" | "fade" | "stagger"
export type TableHover = "none" | "tint" | "accent" | "lift"
export type TableStack = "never" | "sm" | "md" | "lg"
export type TableRowTone = "none" | TableTone
export type TableAlign = "start" | "center" | "end"
export type TableSortDirection = "asc" | "desc"
export type TableSort = { key: string; direction: TableSortDirection }

export type TableLabels = {
  /** Shown in the body when data is an empty array. */
  empty: string
  /** Read after a sorted header's text. */
  sortedAscending: string
  sortedDescending: string
  /** Screen-reader text for the loading skeleton. */
  loading: string
  /** Name of the keyboard-scrollable box (maxHeight or wide tables) when there is no caption or aria-label. */
  scrollRegion: string
}
const DEFAULT_LABELS: TableLabels = { empty: "No rows to show", sortedAscending: "sorted ascending", sortedDescending: "sorted descending", loading: "Loading", scrollRegion: "Scrollable table" }

export type TableColumn<T> = {
  /** Unique key; also the property read from each row when there is no accessor or render. */
  key: string
  header: React.ReactNode
  /** Plain-text name, used as the label of stacked cells when header is not a string. */
  label?: string
  /** Value used for display (when there is no render) and for sorting (when there is no sortValue). */
  accessor?: (row: T) => unknown
  /** Custom cell content. */
  render?: (row: T, index: number) => React.ReactNode
  /** Value to sort by, if it differs from the accessor (e.g. a timestamp behind a formatted date). */
  sortValue?: (row: T) => string | number | boolean | null | undefined
  sortable?: boolean
  align?: TableAlign
  /** Right-aligned (end) tabular figures. */
  numeric?: boolean
  /** CSS width of the column, e.g. 120 or "30%". */
  width?: number | string
  /** Footer cell content (totals). */
  footer?: React.ReactNode
  /** In stacked mode this cell becomes the card title instead of a label/value line. */
  primary?: boolean
  /** Hide this cell when rows are stacked as cards. */
  hideWhenStacked?: boolean
  className?: string
}

export type TableProps<T = Record<string, unknown>> = Omit<React.ComponentProps<"table">, "children"> & {
  /** lined (default), striped, bordered (every cell), cards (each row a separate card) or minimal (no frame). */
  variant?: TableVariant
  /** Accent for the sort arrow, selected rows, the accent hover bar and focus rings. */
  tone?: TableTone
  /** Cell padding and text size. */
  density?: TableDensity
  /** Frame shadow. Ignored by minimal. */
  shadow?: TableShadow
  /** Corner radius of the frame (and of each row in cards). */
  shape?: TableShape
  /** fade or stagger rows in on mount; remount (change key) to replay. */
  animation?: TableAnimation
  /** Row hover style. */
  hover?: TableHover
  /** Below this container width (sm 480px, md 640px, lg 768px) rows turn into cards with a label per value. */
  stack?: TableStack
  /** Keeps the header visible while scrolling. With maxHeight it sticks inside the table's own scroll box. */
  stickyHeader?: boolean
  /** Makes the table scroll inside a box of this height (px number or CSS length). */
  maxHeight?: number | string
  caption?: React.ReactNode
  captionSide?: "top" | "bottom"
  /** Columns for the data shorthand. With children, columns and data are ignored. */
  columns?: TableColumn<T>[]
  data?: T[]
  /** Stable key per row; defaults to row.id, then the index. */
  rowKey?: (row: T, index: number) => string
  /** State color per row: a tinted background and a start-edge marker. */
  rowTone?: (row: T, index: number) => TableRowTone | undefined
  /** Keys of rows drawn as selected. */
  selectedKeys?: string[]
  /** Makes rows clickable and focusable (Enter or Space activates). */
  onRowClick?: (row: T, index: number) => void
  /** Sort (controlled). null means unsorted. */
  sort?: TableSort | null
  defaultSort?: TableSort | null
  /** Called when a sortable header is clicked: asc, desc, then unsorted. With sort controlled, sort the data yourself. */
  onSortChange?: (sort: TableSort | null) => void
  /** Shows skeleton rows instead of data. */
  loading?: boolean
  /** Number of skeleton rows. */
  loadingRows?: number
  /** Replaces the default empty text. */
  empty?: React.ReactNode
  /** Classes for the inner <table>. className goes on the outer frame. */
  tableClassName?: string
  /** Parts, for full control of the markup. */
  children?: React.ReactNode
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<TableLabels>
}

const CSS = `
.pc-table{--pc-c:var(--primary);--pc-fg:var(--primary-foreground)}
.pc-table[data-tone=neutral]{--pc-c:var(--foreground);--pc-fg:var(--background)}
.pc-table[data-tone=success]{--pc-c:oklch(0.53 0.13 155);--pc-fg:#fff}
.pc-table[data-tone=warning]{--pc-c:oklch(0.75 0.16 70);--pc-fg:oklch(0.25 0.05 70)}
.pc-table[data-tone=danger]{--pc-c:oklch(0.56 0.21 27);--pc-fg:#fff}
.pc-table[data-tone=info]{--pc-c:oklch(0.55 0.17 250);--pc-fg:#fff}
.dark .pc-table[data-tone=success]{--pc-c:oklch(0.7 0.16 155);--pc-fg:oklch(0.2 0.05 155)}
.dark .pc-table[data-tone=danger]{--pc-c:oklch(0.68 0.2 25);--pc-fg:oklch(0.2 0.05 25)}
.dark .pc-table[data-tone=info]{--pc-c:oklch(0.7 0.15 245);--pc-fg:oklch(0.2 0.05 245)}
.pc-table{--pc-tint:color-mix(in oklab,var(--pc-c) 14%,transparent);--pc-ink:color-mix(in oklab,var(--pc-c) 82%,var(--foreground))}
.pc-table[data-tone=warning]{--pc-ink:color-mix(in oklab,var(--pc-c) 62%,var(--foreground))}

.pc-table{--pc-r:.75rem;--pc-px:1rem;--pc-py:.625rem;--pc-line:color-mix(in oklab,var(--border) 85%,transparent);--pc-head:color-mix(in oklab,var(--muted) 55%,var(--card));--pc-muted:color-mix(in oklab,var(--muted-foreground) 85%,var(--foreground));container-type:inline-size;position:relative;color:var(--foreground)}
.pc-table[data-shape=square]{--pc-r:0px}
.pc-table[data-shape=soft]{--pc-r:1.25rem}
.pc-table[data-density=compact]{--pc-px:.75rem;--pc-py:.375rem}
.pc-table[data-density=relaxed]{--pc-px:1.25rem;--pc-py:1rem}
.pc-table-scroll{overflow:auto;overscroll-behavior-x:contain;border-radius:inherit}
.pc-table-scroll:focus-visible{outline:2px solid var(--ring);outline-offset:2px}
.pc-table[data-sticky]:not([data-boxed]) .pc-table-scroll{overflow:visible}
.pc-table-el{width:100%;border-collapse:separate;border-spacing:0;caption-side:bottom}
.pc-table-el[data-caption=top]{caption-side:top}
.pc-table-el th,.pc-table-el td{padding:var(--pc-py) var(--pc-px);text-align:start;vertical-align:middle}
.pc-table-el th{font-weight:500;color:var(--pc-muted);white-space:nowrap}
.pc-table-el [data-align=center]{text-align:center}
.pc-table-el [data-align=end]{text-align:end}
.pc-table-el [data-numeric]{font-variant-numeric:tabular-nums}
.pc-table-cap{padding:.625rem var(--pc-px);color:var(--pc-muted);font-size:.8125rem;text-align:start}

/* Frame */
.pc-table:is([data-variant=lined],[data-variant=striped],[data-variant=bordered]){border:1px solid var(--pc-line);border-radius:var(--pc-r);background:var(--card)}
.pc-table[data-shadow=sm]:not([data-variant=minimal]){box-shadow:0 1px 2px rgb(0 0 0/.06),0 1px 3px rgb(0 0 0/.05)}
.pc-table[data-shadow=md]:not([data-variant=minimal]){box-shadow:0 6px 18px -6px rgb(0 0 0/.14)}
.pc-table[data-shadow=lg]:not([data-variant=minimal]){box-shadow:0 18px 40px -14px rgb(0 0 0/.25)}
.dark .pc-table[data-shadow]:not([data-shadow=none]):not([data-variant=minimal]){box-shadow:0 12px 32px -12px rgb(0 0 0/.65)}
.pc-table[data-variant=cards][data-shadow] .pc-table-el>tbody>tr{box-shadow:none}

/* Header */
.pc-table:is([data-variant=lined],[data-variant=striped],[data-variant=bordered]) .pc-table-el>thead th{background:var(--pc-head);border-bottom:1px solid var(--pc-line)}
.pc-table[data-variant=minimal] .pc-table-el>thead th{border-bottom:1px solid var(--pc-line);font-size:.6875rem;letter-spacing:.06em;text-transform:uppercase}
.pc-table[data-variant=cards] .pc-table-el>thead th{font-size:.75rem;padding-block:.25rem}
.pc-table[data-sticky] .pc-table-el>thead th{position:sticky;top:0;z-index:2}
.pc-table:is([data-variant=lined],[data-variant=striped],[data-variant=bordered]) .pc-table-el>thead>tr:first-child>th:first-child{border-start-start-radius:calc(var(--pc-r) - 1px)}
.pc-table:is([data-variant=lined],[data-variant=striped],[data-variant=bordered]) .pc-table-el>thead>tr:first-child>th:last-child{border-start-end-radius:calc(var(--pc-r) - 1px)}
.pc-table[data-sticky]:is([data-variant=minimal],[data-variant=cards]) .pc-table-el>thead th{background:var(--background)}

/* Body lines */
.pc-table[data-variant=lined] .pc-table-el>tbody>tr:not(:last-child)>td{border-bottom:1px solid var(--pc-line)}
.pc-table[data-variant=minimal] .pc-table-el>tbody>tr:not(:last-child)>td{border-bottom:1px solid color-mix(in oklab,var(--pc-line) 55%,transparent)}
.pc-table[data-variant=striped] .pc-table-el>tbody>tr:nth-child(even){background:color-mix(in oklab,var(--muted) 60%,transparent)}
.pc-table[data-variant=bordered] .pc-table-el :is(th,td):not(:last-child){border-inline-end:1px solid var(--pc-line)}
.pc-table[data-variant=bordered] .pc-table-el>tbody>tr:not(:last-child)>td{border-bottom:1px solid var(--pc-line)}
.pc-table-el>tfoot td{font-weight:600;border-top:1px solid var(--pc-line)}
.pc-table:is([data-variant=lined],[data-variant=striped],[data-variant=bordered]) .pc-table-el>tfoot td{background:var(--pc-head)}

/* Cards: every row is its own card. */
.pc-table[data-variant=cards] .pc-table-el{border-spacing:0 .5rem;margin-block:-.5rem}
.pc-table[data-variant=cards] .pc-table-el>tbody>tr>td{background-color:var(--card);border-block:1px solid var(--pc-line)}
.pc-table[data-variant=cards] .pc-table-el>tbody>tr>td:first-child{border-inline-start:1px solid var(--pc-line);border-start-start-radius:var(--pc-r);border-end-start-radius:var(--pc-r)}
.pc-table[data-variant=cards] .pc-table-el>tbody>tr>td:last-child{border-inline-end:1px solid var(--pc-line);border-start-end-radius:var(--pc-r);border-end-end-radius:var(--pc-r)}
.pc-table[data-variant=cards][data-shadow=sm] .pc-table-el>tbody>tr>td{box-shadow:0 1px 2px -1px rgb(0 0 0/.12)}
.pc-table[data-variant=cards][data-shadow=md] .pc-table-el>tbody>tr>td{box-shadow:0 6px 12px -10px rgb(0 0 0/.35)}
.pc-table[data-variant=cards][data-shadow=lg] .pc-table-el>tbody>tr>td{box-shadow:0 14px 22px -16px rgb(0 0 0/.45)}
.pc-table[data-variant=cards] .pc-table-el>tfoot td{border-top:0}

/* Row tones and selection: a tint plus a start-edge marker. */
.pc-table-el>tbody>tr[data-tone]{--pc-row:var(--pc-c)}
.pc-table-el>tbody>tr[data-tone=neutral]{--pc-row:var(--muted-foreground)}
.pc-table-el>tbody>tr[data-tone=success]{--pc-row:oklch(0.53 0.13 155)}
.pc-table-el>tbody>tr[data-tone=warning]{--pc-row:oklch(0.75 0.16 70)}
.pc-table-el>tbody>tr[data-tone=danger]{--pc-row:oklch(0.56 0.21 27)}
.pc-table-el>tbody>tr[data-tone=info]{--pc-row:oklch(0.55 0.17 250)}
.dark .pc-table-el>tbody>tr[data-tone=success]{--pc-row:oklch(0.7 0.16 155)}
.dark .pc-table-el>tbody>tr[data-tone=danger]{--pc-row:oklch(0.68 0.2 25)}
.dark .pc-table-el>tbody>tr[data-tone=info]{--pc-row:oklch(0.7 0.15 245)}
.pc-table-el>tbody>tr[data-tone]>td{background-image:linear-gradient(color-mix(in oklab,var(--pc-row) 8%,transparent),color-mix(in oklab,var(--pc-row) 8%,transparent))}
.pc-table-el>tbody>tr[data-selected]>td{background-image:linear-gradient(color-mix(in oklab,var(--pc-c) 10%,transparent),color-mix(in oklab,var(--pc-c) 10%,transparent))}
.pc-table-el>tbody>tr:is([data-tone],[data-selected])>td:first-child{box-shadow:inset 3px 0 0 var(--pc-mark,var(--pc-row))}
.pc-table-el>tbody>tr[data-selected]{--pc-mark:var(--pc-c)}
.pc-table-el>tbody>tr:is([data-tone],[data-selected])>td:first-child:dir(rtl){box-shadow:inset -3px 0 0 var(--pc-mark,var(--pc-row))}

/* Hover */
.pc-table-el>tbody>tr{transition:background-color .15s,transform .18s var(--pc-ease-out)}
.pc-table-el>tbody>tr>td{transition:background-color .15s,box-shadow .15s}
.pc-table[data-hover=tint] .pc-table-el>tbody>tr:hover>td,.pc-table[data-hover=accent] .pc-table-el>tbody>tr:hover>td{background-color:color-mix(in oklab,var(--foreground) 4%,transparent)}
.pc-table[data-hover=accent] .pc-table-el>tbody>tr:hover>td:first-child{box-shadow:inset 3px 0 0 var(--pc-c)}
.pc-table[data-hover=accent] .pc-table-el>tbody>tr:hover>td:first-child:dir(rtl){box-shadow:inset -3px 0 0 var(--pc-c)}
.pc-table[data-hover=lift] .pc-table-el>tbody>tr:hover{transform:translateY(-1px)}
.pc-table[data-hover=lift] .pc-table-el>tbody>tr:hover>td{background-color:color-mix(in oklab,var(--pc-c) 4%,var(--card))}
.pc-table[data-hover=lift][data-variant=cards] .pc-table-el>tbody>tr:hover>td{border-color:color-mix(in oklab,var(--pc-c) 30%,var(--pc-line));box-shadow:0 10px 20px -14px color-mix(in oklab,var(--pc-c) 60%,rgb(0 0 0/.4))}
.pc-table-el>tbody>tr[data-interactive]{cursor:pointer;outline:none}
.pc-table-el>tbody>tr[data-interactive]:focus-visible>td{box-shadow:inset 0 2px 0 var(--pc-c),inset 0 -2px 0 var(--pc-c)}
.pc-table-el>tbody>tr[data-interactive]:focus-visible>td:first-child{box-shadow:inset 2px 2px 0 var(--pc-c),inset 0 -2px 0 var(--pc-c)}
.pc-table-el>tbody>tr[data-interactive]:focus-visible>td:last-child{box-shadow:inset -2px 2px 0 var(--pc-c),inset 0 -2px 0 var(--pc-c)}

/* Sort affordance */
.pc-table-sort{display:inline-flex;align-items:center;gap:.375rem;margin:-.25rem -.375rem;padding:.25rem .375rem;border-radius:.375rem;color:inherit;font:inherit;cursor:pointer;outline:none;transition:background-color .15s,color .15s}
.pc-table-sort:hover{background:color-mix(in oklab,var(--foreground) 6%,transparent);color:var(--foreground)}
.pc-table-sort:focus-visible{box-shadow:0 0 0 3px color-mix(in oklab,var(--pc-c) 35%,transparent)}
.pc-table th[aria-sort] .pc-table-sort{color:var(--foreground)}
.pc-table-arrow{width:.875rem;height:.875rem;flex:none;opacity:.45;transition:opacity .15s,transform .2s var(--pc-ease-out)}
.pc-table-sort:hover .pc-table-arrow{opacity:.8}
.pc-table th[aria-sort] .pc-table-arrow{opacity:1;color:var(--pc-ink)}
.pc-table th[aria-sort=descending] .pc-table-arrow{transform:rotate(180deg)}
.pc-table-el [data-align=end] .pc-table-sort{flex-direction:row-reverse}

/* Skeleton */
.pc-table-skel{display:block;height:.75rem;border-radius:9999px;background:linear-gradient(90deg,var(--muted) 25%,color-mix(in oklab,var(--muted) 40%,var(--card)) 50%,var(--muted) 75%);background-size:200% 100%;animation:pc-table-shimmer 1.4s linear infinite}
@keyframes pc-table-shimmer{to{background-position:-200% 0}}

/* Entrances */
.pc-table[data-anim=fade] .pc-table-el>tbody>tr{animation:pc-table-in .35s var(--pc-ease-out) both}
.pc-table[data-anim=stagger] .pc-table-el>tbody>tr{animation:pc-table-up .4s var(--pc-ease-out) both}
${Array.from({ length: 12 }, (_, i) => `.pc-table[data-anim=stagger] .pc-table-el>tbody>tr:nth-child(${i + 2}){animation-delay:${(i + 1) * 35}ms}`).join("\n")}
.pc-table[data-anim=stagger] .pc-table-el>tbody>tr:nth-child(n+14){animation-delay:455ms}
@keyframes pc-table-in{from{opacity:0}}
@keyframes pc-table-up{from{opacity:0;transform:translateY(6px)}}

/* Stacked: rows become cards with a label per value. */
${(["sm", "md", "lg"] as const)
  .map(
    (s) => `@container (max-width:${{ sm: 480, md: 640, lg: 768 }[s]}px){
.pc-table[data-stack=${s}] .pc-table-el{display:flex;flex-direction:column}
.pc-table[data-stack=${s}] .pc-table-el>caption{display:block}
.pc-table[data-stack=${s}] .pc-table-el[data-caption=bottom]>caption{order:1}
.pc-table[data-stack=${s}] .pc-table-el>:is(tbody,tfoot),.pc-table[data-stack=${s}] .pc-table-el>:is(tbody,tfoot)>tr{display:block}
.pc-table[data-stack=${s}] .pc-table-el>thead{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.pc-table[data-stack=${s}] .pc-table-el>:is(tbody,tfoot)>tr{padding:.5rem 0;border-bottom:1px solid var(--pc-line)}
.pc-table[data-stack=${s}] .pc-table-el>:is(tbody,tfoot)>tr:last-child{border-bottom:0}
.pc-table[data-stack=${s}] .pc-table-el>:is(tbody,tfoot)>tr>td{display:grid;grid-template-columns:minmax(6.5rem,38%) 1fr;gap:.75rem;align-items:baseline;padding-block:.3rem;border:0!important;border-radius:0!important;box-shadow:none!important;text-align:start;background-color:transparent}
.pc-table[data-stack=${s}] .pc-table-el>:is(tbody,tfoot)>tr>td::before{content:attr(data-label);color:var(--pc-muted);font-size:.75rem;font-weight:500}
.pc-table[data-stack=${s}] .pc-table-el>:is(tbody,tfoot)>tr>td:is([data-primary],[data-full]){display:block;font-weight:600}
.pc-table[data-stack=${s}] .pc-table-el>:is(tbody,tfoot)>tr>td:is([data-primary],[data-full])::before{display:none}
.pc-table[data-stack=${s}] .pc-table-el>:is(tbody,tfoot)>tr>td[data-hide-stacked]{display:none}
.pc-table[data-stack=${s}] .pc-table-el>tbody>tr:is([data-tone],[data-selected]){box-shadow:inset 3px 0 0 var(--pc-mark,var(--pc-row))}
.pc-table[data-stack=${s}] .pc-table-el>tbody>tr:is([data-tone],[data-selected]):dir(rtl){box-shadow:inset -3px 0 0 var(--pc-mark,var(--pc-row))}
.pc-table[data-stack=${s}][data-variant=striped] .pc-table-el>tbody>tr:nth-child(even){background:color-mix(in oklab,var(--muted) 60%,transparent)}
.pc-table[data-stack=${s}][data-variant=cards] .pc-table-el{border-spacing:0;margin:0}
.pc-table[data-stack=${s}][data-variant=cards] .pc-table-el>tbody>tr{margin-bottom:.5rem;border:1px solid var(--pc-line);border-radius:var(--pc-r);background:var(--card);padding:.5rem 0}
.pc-table[data-stack=${s}] .pc-table-el>tfoot>tr>td{background:transparent}
}`,
  )
  .join("\n")}

@media (prefers-reduced-motion:reduce){
  .pc-table *{transition:none!important}
  .pc-table[data-anim] .pc-table-el>tbody>tr{animation:none!important}
  .pc-table[data-hover=lift] .pc-table-el>tbody>tr:hover{transform:none}
  .pc-table-skel{animation:none}
}
`

type Ctx = { labels: TableLabels; stack: boolean }
const TableContext = React.createContext<Ctx>({ labels: DEFAULT_LABELS, stack: false })

const Arrow = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...p}>
    <path d="M8 12.5v-9M4.5 7 8 3.5 11.5 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const UpDown = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...p}>
    <path d="m5 6 3-3 3 3M5 10l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" })
function compare(a: unknown, b: unknown) {
  if (a == null || a === "") return b == null || b === "" ? 0 : 1
  if (b == null || b === "") return -1
  if (typeof a === "number" && typeof b === "number") return a - b
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime()
  if (typeof a === "boolean" && typeof b === "boolean") return Number(a) - Number(b)
  return collator.compare(String(a), String(b))
}

const cellText = (v: unknown): React.ReactNode => (v == null ? "" : v instanceof Date ? v.toLocaleDateString() : typeof v === "object" && !React.isValidElement(v) ? JSON.stringify(v) : (v as React.ReactNode))

function readKey<T>(row: T, key: string) {
  return row && typeof row === "object" ? (row as Record<string, unknown>)[key] : undefined
}

export function Table<T = Record<string, unknown>>({
  variant = "lined",
  tone = "primary",
  density = "normal",
  shadow = "none",
  shape = "rounded",
  animation = "none",
  hover = "tint",
  stack = "never",
  stickyHeader = false,
  maxHeight,
  caption,
  captionSide = "bottom",
  columns,
  data,
  rowKey,
  rowTone,
  selectedKeys,
  onRowClick,
  sort: sortProp,
  defaultSort = null,
  onSortChange,
  loading = false,
  loadingRows = 4,
  empty,
  className,
  tableClassName,
  children,
  labels,
  style,
  ...props
}: TableProps<T>) {
  const l = useLabels("table", DEFAULT_LABELS, labels)
  const [sortInner, setSortInner] = React.useState<TableSort | null>(defaultSort)
  const sort = sortProp !== undefined ? sortProp : sortInner
  const stacked = stack !== "never"
  const ctx = React.useMemo(() => ({ labels: l, stack: stacked }), [l.empty, l.sortedAscending, l.sortedDescending, l.loading, l.scrollRegion, stacked]) // eslint-disable-line react-hooks/exhaustive-deps

  const cycle = (key: string) => {
    const next: TableSort | null = sort?.key !== key ? { key, direction: "asc" } : sort.direction === "asc" ? { key, direction: "desc" } : null
    if (sortProp === undefined) setSortInner(next)
    onSortChange?.(next)
  }

  // Client-side sort for the data shorthand (stable; uncontrolled only, controlled sort means the caller sorts).
  const rows = React.useMemo(() => {
    const list = (data ?? []).map((row, i) => ({ row, i }))
    if (!sort || sortProp !== undefined || !columns) return list
    const col = columns.find((c) => c.key === sort.key)
    if (!col) return list
    const val = (r: T) => (col.sortValue ? col.sortValue(r) : col.accessor ? col.accessor(r) : readKey(r, col.key))
    const dir = sort.direction === "asc" ? 1 : -1
    return list.sort((a, b) => {
      const va = val(a.row)
      const vb = val(b.row)
      // Empty values stay last in both directions.
      if (va == null || va === "" || vb == null || vb === "") return compare(va, vb) || a.i - b.i
      return dir * compare(va, vb) || a.i - b.i
    })
  }, [data, columns, sort, sortProp])

  const labelOf = (c: TableColumn<T>) => c.label ?? (typeof c.header === "string" ? c.header : c.key)
  const keyOf = (row: T, i: number) => (rowKey ? rowKey(row, i) : String(readKey(row, "id") ?? i))
  const selected = React.useMemo(() => new Set(selectedKeys ?? []), [selectedKeys])

  let body: React.ReactNode = children
  if (!children && columns) {
    const hasFooter = columns.some((c) => c.footer !== undefined)
    body = (
      <>
        <TableHeader>
          <TableRow>
            {columns.map((c) => (
              <TableHead
                key={c.key}
                align={c.align}
                numeric={c.numeric}
                style={c.width !== undefined ? { width: c.width } : undefined}
                sortable={c.sortable}
                sort={sort?.key === c.key ? sort.direction : false}
                onSort={() => cycle(c.key)}
                className={c.className}
              >
                {c.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody aria-busy={loading || undefined}>
          {loading ? (
            Array.from({ length: loadingRows }, (_, r) => (
              <TableRow key={"skel" + r}>
                {columns.map((c, ci) => (
                  <TableCell key={c.key} label={labelOf(c)} align={c.align} numeric={c.numeric}>
                    <span className="pc-table-skel" style={{ width: `${45 + ((r * 7 + ci * 13) % 45)}%`, marginInlineStart: c.align === "end" || c.numeric ? "auto" : undefined }} />
                    {r === 0 && ci === 0 && <span className="sr-only">{l.loading}</span>}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} data-full="" className="!py-10 text-center text-sm" style={{ color: "var(--pc-muted)" }}>
                {empty ?? l.empty}
              </td>
            </tr>
          ) : (
            rows.map(({ row, i }) => {
              const k = keyOf(row, i)
              const t = rowTone?.(row, i)
              return (
                <TableRow
                  key={k}
                  tone={t && t !== "none" ? t : undefined}
                  selected={selected.has(k)}
                  onClick={onRowClick ? () => onRowClick(row, i) : undefined}
                  onKeyDown={
                    onRowClick
                      ? (e) => {
                          if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                            e.preventDefault()
                            onRowClick(row, i)
                          }
                        }
                      : undefined
                  }
                  tabIndex={onRowClick ? 0 : undefined}
                >
                  {columns.map((c) => (
                    <TableCell key={c.key} label={labelOf(c)} align={c.align} numeric={c.numeric} primary={c.primary} hideWhenStacked={c.hideWhenStacked} className={c.className}>
                      {c.render ? c.render(row, i) : cellText(c.accessor ? c.accessor(row) : readKey(row, c.key))}
                    </TableCell>
                  ))}
                </TableRow>
              )
            })
          )}
        </TableBody>
        {hasFooter && !loading && rows.length > 0 && (
          <TableFooter>
            <TableRow>
              {columns.map((c) => (
                <TableCell key={c.key} label={c.footer !== undefined ? labelOf(c) : ""} align={c.align} numeric={c.numeric} hideWhenStacked={c.footer === undefined}>
                  {c.footer}
                </TableCell>
              ))}
            </TableRow>
          </TableFooter>
        )}
      </>
    )
  }

  const boxed = maxHeight !== undefined
  // A scroll box with no focusable content must be reachable by keyboard (WCAG 2.1.1): make it a named,
  // focusable region whenever it can scroll. maxHeight always can; otherwise only when the table is wider.
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [overflowing, setOverflowing] = React.useState(false)
  React.useEffect(() => {
    const el = scrollRef.current
    if (!el || boxed || typeof ResizeObserver === "undefined") return
    const check = () => setOverflowing(el.scrollWidth > el.clientWidth + 1)
    check()
    const ro = new ResizeObserver(check)
    ro.observe(el)
    const table = el.firstElementChild
    if (table) ro.observe(table)
    return () => ro.disconnect()
  }, [boxed])
  const scrollable = boxed || overflowing
  const capId = React.useId()
  const tableLabel = props["aria-label"]
  return (
    <TableContext.Provider value={ctx}>
      <GooduiTokens />
      <style href="pc-table" precedence="default">
        {CSS}
      </style>
      <div
        data-slot="table"
        data-variant={variant}
        data-tone={tone}
        data-density={density}
        data-shadow={shadow}
        data-shape={shape}
        data-anim={animation === "none" ? undefined : animation}
        data-hover={hover}
        data-stack={stack}
        data-sticky={stickyHeader ? "" : undefined}
        data-boxed={boxed ? "" : undefined}
        className={cn("pc-table w-full", density === "compact" ? "text-[13px]" : "text-sm", className)}
      >
        <div
          ref={scrollRef}
          className="pc-table-scroll"
          style={boxed ? { maxHeight } : undefined}
          tabIndex={scrollable ? 0 : undefined}
          role={scrollable ? "region" : undefined}
          aria-labelledby={scrollable && caption ? capId : undefined}
          aria-label={scrollable && !caption ? (tableLabel ?? l.scrollRegion) : undefined}
        >
          <table data-caption={captionSide} className={cn("pc-table-el", tableClassName)} role={stacked ? "table" : undefined} style={style} {...props}>
            {caption && (
              <caption id={capId} className="pc-table-cap">
                {caption}
              </caption>
            )}
            {body}
          </table>
        </div>
      </div>
    </TableContext.Provider>
  )
}

export function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  const { stack } = React.useContext(TableContext)
  return <thead data-slot="table-header" role={stack ? "rowgroup" : undefined} className={className} {...props} />
}

export function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  const { stack } = React.useContext(TableContext)
  return <tbody data-slot="table-body" role={stack ? "rowgroup" : undefined} className={className} {...props} />
}

export function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  const { stack } = React.useContext(TableContext)
  return <tfoot data-slot="table-footer" role={stack ? "rowgroup" : undefined} className={className} {...props} />
}

export type TableRowProps = React.ComponentProps<"tr"> & {
  /** State color: tinted background and a start-edge marker (paid, overdue, pending…). */
  tone?: TableRowTone
  /** Draws the row as selected (tone tint + marker) and sets aria-selected. */
  selected?: boolean
}

export function TableRow({ tone, selected, className, onClick, ...props }: TableRowProps) {
  const { stack } = React.useContext(TableContext)
  return (
    <tr
      data-slot="table-row"
      role={stack ? "row" : undefined}
      data-tone={tone && tone !== "none" ? tone : undefined}
      data-selected={selected ? "" : undefined}
      data-interactive={onClick ? "" : undefined}
      aria-selected={selected || undefined}
      onClick={onClick}
      className={className}
      {...props}
    />
  )
}

export type TableHeadProps = Omit<React.ComponentProps<"th">, "align"> & {
  align?: TableAlign
  /** End-aligned tabular figures. */
  numeric?: boolean
  /** Wraps the header text in a sort button with an arrow. */
  sortable?: boolean
  /** Current direction for this column, or false when unsorted. */
  sort?: TableSortDirection | false
  onSort?: () => void
}

export function TableHead({ align, numeric, sortable, sort, onSort, className, children, ...props }: TableHeadProps) {
  const { stack, labels } = React.useContext(TableContext)
  const a = align ?? (numeric ? "end" : undefined)
  return (
    <th
      data-slot="table-head"
      scope="col"
      role={stack ? "columnheader" : undefined}
      data-align={a}
      data-numeric={numeric ? "" : undefined}
      aria-sort={sortable && sort ? (sort === "asc" ? "ascending" : "descending") : undefined}
      className={className}
      {...props}
    >
      <GooduiTokens />
      {sortable ? (
        <button type="button" className="pc-press pc-table-sort" onClick={onSort}>
          <span>{children}</span>
          {sort ? <Arrow className="pc-table-arrow" /> : <UpDown className="pc-table-arrow" />}
          {sort && <span className="sr-only">, {sort === "asc" ? labels.sortedAscending : labels.sortedDescending}</span>}
        </button>
      ) : (
        children
      )}
    </th>
  )
}

export type TableCellProps = Omit<React.ComponentProps<"td">, "align"> & {
  align?: TableAlign
  numeric?: boolean
  /** Label shown before the value when rows are stacked as cards. */
  label?: string
  /** In stacked mode this cell is the card title. */
  primary?: boolean
  /** Hidden when rows are stacked as cards. */
  hideWhenStacked?: boolean
}

export function TableCell({ align, numeric, label, primary, hideWhenStacked, className, ...props }: TableCellProps) {
  const { stack } = React.useContext(TableContext)
  return (
    <td
      data-slot="table-cell"
      role={stack ? "cell" : undefined}
      data-align={align ?? (numeric ? "end" : undefined)}
      data-numeric={numeric ? "" : undefined}
      data-label={label}
      data-primary={primary ? "" : undefined}
      data-hide-stacked={hideWhenStacked ? "" : undefined}
      className={className}
      {...props}
    />
  )
}

export function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
  return <caption data-slot="table-caption" className={cn("pc-table-cap", className)} {...props} />
}

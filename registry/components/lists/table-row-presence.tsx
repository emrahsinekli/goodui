"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion, type Transition } from "motion/react"
import { cn } from "@/lib/utils"

const CSS = `
@keyframes pc-table-row-presence-flash {
  0%, 35% { background-color: color-mix(in oklab, var(--primary) 11%, transparent) }
  100% { background-color: transparent }
}
.pc-table-row-presence-new { animation: pc-table-row-presence-flash 2.2s ease-out both }
@media (prefers-reduced-motion: reduce) { .pc-table-row-presence-new { animation-duration: 0.01s } }
`

export type TableRowPresenceColumn<T> = {
  /** Unique column id. */
  key: string
  /** Header cell content. */
  header: React.ReactNode
  /** Renders this column's cell for a row. */
  cell: (row: T) => React.ReactNode
  /** Classes for both the header and body cells, e.g. "hidden sm:table-cell" or "w-24". */
  className?: string
  /** Text alignment of the header and body cells. Default "left". Left and right are mirrored under RTL (they map to start and end). */
  align?: "left" | "right" | "center"
}

export type TableRowPresenceProps<T> = Omit<React.ComponentProps<"table">, "children"> & {
  /** Rows in display order. Add, remove or re-sort this array and the table animates the difference. */
  rows: T[]
  /** Column definitions, in order. */
  columns: TableRowPresenceColumn<T>[]
  /** Stable unique id of a row; rows are matched across renders by it. */
  getRowId: (row: T) => string
  /** Briefly tint rows that arrive after the first render. */
  highlightNew?: boolean
  /** Shown in a full-width row when there are no rows. */
  empty?: React.ReactNode
  /** Table caption, shown below the table. */
  caption?: React.ReactNode
  /** Makes rows clickable: pointer cursor, and each row becomes focusable and activates with Enter or Space. */
  onRowClick?: (row: T) => void
}

const ALIGN = { left: "text-start", right: "text-end", center: "text-center" } as const

// Table rows can't animate their height, so every cell wraps its content in a div that grows from 0 to auto.
// Neighbours then slide down or close the gap in normal flow, while `layout` animates re-sorting.
const cellVariants = {
  hidden: { height: 0, opacity: 0 },
  shown: { height: "auto", opacity: 1 },
}

type RowProps<T> = {
  row: T
  columns: TableRowPresenceColumn<T>[]
  fresh: boolean
  highlight: boolean
  reduce: boolean
  /** Mirrors the slide-in/out direction for right-to-left layouts. */
  rtl: boolean
  onRowClick?: (row: T) => void
}

function PresenceRow<T>({ row, columns, fresh, highlight, reduce, rtl, onRowClick }: RowProps<T>) {
  // Decided once on mount: rows present on first render are not "new".
  const [isNew] = React.useState(fresh)
  const t: Transition = reduce ? { duration: 0 } : { type: "spring", bounce: 0, duration: 0.42 }
  return (
    <motion.tr
      layout={reduce ? false : "position"}
      transition={t}
      initial={{ opacity: 0, x: reduce ? 0 : rtl ? 12 : -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: reduce ? 0 : rtl ? -24 : 24, transition: reduce ? { duration: 0 } : { duration: 0.2, ease: "easeIn" } }}
      onClick={onRowClick ? () => onRowClick(row) : undefined}
      tabIndex={onRowClick ? 0 : undefined}
      onKeyDown={
        onRowClick
          ? (e) => {
              // Only when the row itself has focus, so buttons and links inside cells keep their own keys.
              if (e.target !== e.currentTarget || (e.key !== "Enter" && e.key !== " ")) return
              e.preventDefault()
              onRowClick(row)
            }
          : undefined
      }
      className={cn(
        "relative border-b transition-colors last:border-b-0 hover:bg-muted/40",
        onRowClick && "cursor-pointer outline-none focus-visible:bg-muted/40 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
        isNew && highlight && "pc-table-row-presence-new",
      )}
    >
      {columns.map((col) => (
        <td key={col.key} className={cn("p-0 align-middle", ALIGN[col.align ?? "left"], col.className)}>
          <motion.div
            variants={cellVariants}
            initial="hidden"
            animate="shown"
            exit="hidden"
            transition={reduce ? { duration: 0 } : { height: { type: "spring", bounce: 0, duration: 0.42 }, opacity: { duration: 0.2 } }}
            className="overflow-hidden"
          >
            <div className="px-3 py-2.5">{col.cell(row)}</div>
          </motion.div>
        </td>
      ))}
    </motion.tr>
  )
}

/** Data table whose rows slide in, collapse out and glide to new positions when sorted. */
export function TableRowPresence<T>({
  rows,
  columns,
  getRowId,
  highlightNew = true,
  empty = "No rows",
  caption,
  onRowClick,
  className,
  ...props
}: TableRowPresenceProps<T>) {
  const reduce = useReducedMotion() ?? false
  const [mounted, setMounted] = React.useState(false)
  const [rtl, setRtl] = React.useState(false)
  const headRef = React.useRef<HTMLTableSectionElement>(null)
  React.useEffect(() => {
    setMounted(true)
    if (headRef.current) setRtl(getComputedStyle(headRef.current).direction === "rtl")
  }, [])

  return (
    <>
      <style href="pc-table-row-presence" precedence="default">
        {CSS}
      </style>
      <table className={cn("w-full caption-bottom border-collapse text-sm", className)} {...props}>
        {caption && <caption className="mt-3 text-xs text-muted-foreground">{caption}</caption>}
        <thead ref={headRef}>
          <tr className="border-b">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn(
                  "h-9 px-3 text-xs font-medium whitespace-nowrap text-muted-foreground",
                  ALIGN[col.align ?? "left"],
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <AnimatePresence initial={false}>
            {rows.map((row) => (
              <PresenceRow
                key={getRowId(row)}
                row={row}
                columns={columns}
                fresh={mounted}
                highlight={highlightNew}
                reduce={reduce}
                rtl={rtl}
                onRowClick={onRowClick}
              />
            ))}
            {rows.length === 0 && (
              <motion.tr
                key="pc-empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: reduce ? 0 : 0.2 } }}
                exit={{ opacity: 0, transition: { duration: 0 } }}
              >
                <td colSpan={columns.length} className="px-3 py-10 text-center text-sm text-muted-foreground">
                  {empty}
                </td>
              </motion.tr>
            )}
          </AnimatePresence>
        </tbody>
      </table>
    </>
  )
}

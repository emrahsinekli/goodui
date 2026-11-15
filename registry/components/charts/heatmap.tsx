"use client"

import * as React from "react"
import { useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import { GooduiTokens } from "@/lib/goodui-motion"

const CSS = `
.pc-heatmap-cell{transform-box:fill-box;transform-origin:center}
.pc-heatmap[data-inview=false] .pc-heatmap-cell{opacity:0}
.pc-heatmap[data-inview=true] .pc-heatmap-cell{animation:pc-heatmap-in .45s var(--pc-ease-out) both;animation-delay:calc(var(--d) * 14ms)}
@keyframes pc-heatmap-in{from{opacity:0;transform:scale(.55)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.pc-heatmap .pc-heatmap-cell{animation:none!important;opacity:1!important}}
`

export type HeatmapCell = {
  /** ISO date, e.g. "2026-10-28". */
  date: string
  value: number
}

export type HeatmapLabels = {
  less: string
  more: string
  /** Announced for the active cell. */
  cell: (label: string, value: string) => string
  summary: (name: string, cells: number, max: string) => string
  noData: string
}
const DEFAULT_LABELS: HeatmapLabels = {
  less: "Less",
  more: "More",
  cell: (label, value) => `${label}: ${value}`,
  summary: (name, cells, max) => `${name ? name + ": " : ""}${cells} cells, highest ${max}`,
  noData: "No data",
}

export type HeatmapProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** calendar: weeks as columns, weekdays as rows (needs data). matrix: rows × columns (needs rows, columns, values). */
  mode?: "calendar" | "matrix"
  /** Calendar values by ISO date. Days without an entry count as 0. */
  data?: HeatmapCell[]
  /** Last day of the calendar (ISO). Defaults to the latest date in data. */
  end?: string
  /** Weeks shown in calendar mode. */
  weeks?: number
  /** First weekday: 1 Monday (default) or 0 Sunday. */
  weekStart?: 0 | 1
  /** Matrix row labels. */
  rows?: string[]
  /** Matrix column labels. */
  columns?: string[]
  /** Matrix values, values[row][column]. */
  values?: number[][]
  /** Chart name for screen readers. */
  title?: React.ReactNode
  /** One hue; intensity is its opacity in `steps` levels. Defaults to the theme's first chart color. */
  color?: string
  /** Number of intensity levels above zero. */
  steps?: number
  /** linear splits 0..max evenly; quantile gives each level the same number of cells. */
  scale?: "linear" | "quantile"
  /** Cell size in px (calendar) or minimum cell size (matrix, cells stretch to the width). */
  cellSize?: number
  cellGap?: number
  /** Less … More scale under the chart. */
  legend?: boolean
  format?: Intl.NumberFormatOptions
  locale?: string
  formatValue?: (value: number) => string
  /** Formats calendar dates for the tooltip and screen readers. */
  formatDate?: (date: Date) => string
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<HeatmapLabels>
}

function useReduce() {
  const prefers = useReducedMotion()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  return mounted && !!prefers
}

function useInView(ref: React.RefObject<Element | null>, threshold = 0.2) {
  const [inView, setInView] = React.useState(false)
  React.useEffect(() => {
    const el = ref.current
    if (!el || inView) return
    if (typeof IntersectionObserver === "undefined") {
      setInView(true)
      return
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { threshold },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, inView, threshold])
  return inView
}

function useWidth(ref: React.RefObject<HTMLElement | null>) {
  const [width, setWidth] = React.useState<number | null>(null)
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    // A hidden parent (display:none) measures 0: keep the last real width instead of collapsing the chart.
    const measure = () => {
      const w = Math.round(el.clientWidth)
      if (w > 0) setWidth(Math.max(120, w))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return width
}

// Local-time parsing of ISO dates, so "2026-10-28" is Oct 28 in every time zone.
function parseDate(s: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s)
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(s)
}
const pad = (n: number) => String(n).padStart(2, "0")
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)

type Cell = { id: number; col: number; row: number; value: number; label: string; has: boolean }

/** Calendar (GitHub-style) or matrix heatmap on one hue, with cells that pop in by column, a tooltip, arrow-key navigation and a Less–More scale. */
export function Heatmap({
  mode = "calendar",
  data,
  end,
  weeks = 26,
  weekStart = 1,
  rows,
  columns,
  values,
  title,
  color = "var(--chart-1)",
  steps = 4,
  scale = "linear",
  cellSize = 12,
  cellGap = 3,
  legend = true,
  format,
  locale = "en-US",
  formatValue,
  formatDate,
  labels,
  className,
  "aria-label": ariaLabel,
  ...props
}: HeatmapProps) {
  const l = useLabels("heatmap", DEFAULT_LABELS, labels)
  const reduce = useReduce()
  const rootRef = React.useRef<HTMLDivElement>(null)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const inView = useInView(rootRef)
  const width = useWidth(rootRef)
  const [active, setActive] = React.useState<number | null>(null)
  const [scrollLeft, setScrollLeft] = React.useState(0)
  const calendar = mode === "calendar"

  const fmt = React.useMemo(() => formatValue ?? ((v: number) => new Intl.NumberFormat(locale, format).format(v)), [formatValue, locale, format])
  const dateFmt = React.useMemo(() => formatDate ?? ((d: Date) => new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" }).format(d)), [formatDate, locale])
  const monthFmt = React.useMemo(() => new Intl.DateTimeFormat(locale, { month: "short" }), [locale])
  const dayFmt = React.useMemo(() => new Intl.DateTimeFormat(locale, { weekday: "short" }), [locale])

  // Build the grid: one entry per cell with its column, row and value.
  const built = React.useMemo(() => {
    const cells: Cell[] = []
    let cols = 0
    let rowCount = 0
    const colLabels: { col: number; text: string }[] = []
    const rowLabels: { row: number; text: string }[] = []
    if (calendar) {
      const map = new Map<string, number>()
      for (const d of data ?? []) map.set(d.date.slice(0, 10), (map.get(d.date.slice(0, 10)) ?? 0) + d.value)
      const dates = [...map.keys()].sort()
      const last = end ? parseDate(end) : dates.length ? parseDate(dates[dates.length - 1] ?? "") : null
      if (last) {
        const days = weeks * 7
        const first = addDays(last, -(days - 1))
        const lead = (first.getDay() - weekStart + 7) % 7
        cols = Math.ceil((days + lead) / 7)
        rowCount = 7
        let prevMonth = -1
        let lastLabelCol = -10
        for (let i = 0; i < days; i++) {
          const d = addDays(first, i)
          const slot = i + lead
          const col = Math.floor(slot / 7)
          const row = slot % 7
          const key = iso(d)
          const v = map.get(key)
          cells.push({ id: i, col, row, value: v ?? 0, label: dateFmt(d), has: v !== undefined })
          if (d.getMonth() !== prevMonth) {
            if (prevMonth !== -1 && col - lastLabelCol >= 3) {
              colLabels.push({ col, text: monthFmt.format(d) })
              lastLabelCol = col
            } else if (prevMonth === -1 && col === 0 && d.getDate() <= 7) {
              colLabels.push({ col, text: monthFmt.format(d) })
              lastLabelCol = col
            }
            prevMonth = d.getMonth()
          }
        }
        // Weekday names from a known week (Sunday Jan 7 2024); Mon, Wed and Fri keep the column from getting busy.
        const ref = new Date(2024, 0, 7 + weekStart)
        for (const row of weekStart === 1 ? [0, 2, 4] : [1, 3, 5]) rowLabels.push({ row, text: dayFmt.format(addDays(ref, row)) })
      }
    } else if (rows && columns && values) {
      cols = columns.length
      rowCount = rows.length
      rows.forEach((r, ri) => {
        columns.forEach((c, ci) => {
          const v = values[ri]?.[ci]
          cells.push({ id: ri * cols + ci, col: ci, row: ri, value: v ?? 0, label: `${r} · ${c}`, has: v !== undefined })
        })
        rowLabels.push({ row: ri, text: r })
      })
      columns.forEach((c, ci) => colLabels.push({ col: ci, text: c }))
    }
    return { cells, cols, rowCount, colLabels, rowLabels }
  }, [calendar, data, end, weeks, weekStart, rows, columns, values, dateFmt, monthFmt, dayFmt])

  const { cells, cols, rowCount, colLabels, rowLabels } = built
  const max = cells.reduce((m, c) => Math.max(m, c.value), 0)
  const thresholds = React.useMemo(() => {
    if (scale === "quantile") {
      const positive = cells.map((c) => c.value).filter((v) => v > 0).sort((a, b) => a - b)
      return Array.from({ length: steps - 1 }, (_, i) => positive[Math.floor(((i + 1) / steps) * positive.length)] ?? 0)
    }
    return Array.from({ length: steps - 1 }, (_, i) => (max * (i + 1)) / steps)
  }, [cells, steps, scale, max])
  const levelOf = (v: number) => {
    if (v <= 0) return 0
    let lv = 1
    for (const t of thresholds) if (v > t) lv++
    return Math.min(steps, lv)
  }
  const opacityOf = (level: number) => (level === 0 ? 0 : steps <= 1 ? 1 : 0.22 + (0.78 * (level - 1)) / (steps - 1))

  // Geometry. Calendar cells are fixed and scroll; matrix cells stretch to the container width.
  const W = width ?? 0
  const labelW = calendar ? 30 : Math.min(120, Math.max(40, (rows ?? []).reduce((m, r) => Math.max(m, r.length), 0) * 6.5 + 12))
  const top = 18
  const cw = calendar ? cellSize : Math.max(cellSize, (W - labelW - (cols - 1) * cellGap) / Math.max(1, cols))
  const ch = calendar ? cellSize : Math.min(Math.max(cellSize, cw), 28)
  const svgW = labelW + cols * (cw + cellGap) - cellGap
  const svgH = top + rowCount * (ch + cellGap) - cellGap
  const xOf = (col: number) => labelW + col * (cw + cellGap)
  const yOf = (row: number) => top + row * (ch + cellGap)

  // Start scrolled to the latest weeks.
  React.useLayoutEffect(() => {
    const el = scrollRef.current
    if (el && calendar && width !== null) el.scrollLeft = el.scrollWidth
  }, [calendar, svgW, width])

  const activeCell = active !== null ? cells.find((c) => c.id === active) : undefined
  const name = typeof title === "string" ? title : ""
  const summary = ariaLabel ?? (cells.length ? l.summary(name, cells.length, fmt(max)) : l.noData)
  const announce = activeCell ? l.cell(activeCell.label, fmt(activeCell.value)) : ""

  const move = (dc: number, dr: number) => {
    const from = active !== null ? cells.find((c) => c.id === active) : undefined
    const base = from ?? cells[cells.length - 1]
    if (!base) return
    const next = cells.find((c) => c.col === base.col + dc && c.row === base.row + dr) ?? base
    // Keep the active cell in view when the calendar scrolls.
    const el = scrollRef.current
    if (el && calendar) {
      const x = xOf(next.col) - el.scrollLeft
      if (x < labelW + 4) el.scrollLeft = xOf(next.col) - labelW - 4
      else if (x + cw > el.clientWidth - 4) el.scrollLeft = xOf(next.col) + cw - el.clientWidth + 4
    }
    setActive(next.id)
  }
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!cells.length) return
    const map: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
    const m = map[e.key]
    if (m) {
      e.preventDefault()
      move(m[0], m[1])
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault()
      setActive((e.key === "Home" ? cells[0] : cells[cells.length - 1])?.id ?? null)
    } else if (e.key === "Escape") setActive(null)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const t = (e.target as Element).closest("[data-cell]")
    setActive(t ? Number(t.getAttribute("data-cell")) : null)
  }

  const tipX = activeCell ? xOf(activeCell.col) + cw / 2 - (calendar ? scrollLeft : 0) : 0
  const tipY = activeCell ? yOf(activeCell.row) : 0
  const tipRight = tipX > W * 0.55
  const ready = inView || reduce

  return (
    <div ref={rootRef} data-inview={ready} className={cn("pc-heatmap flex w-full min-w-0 flex-col gap-2", className)} {...props}>
      <GooduiTokens />
      <style href="pc-heatmap" precedence="default">
        {CSS}
      </style>
      <div
        role="group"
        aria-roledescription="heatmap"
        aria-label={summary}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onFocus={() => setActive((i) => i ?? (cells[cells.length - 1]?.id ?? null))}
        onBlur={() => setActive(null)}
        className="relative rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <div ref={scrollRef} dir="ltr" onScroll={(e) => setScrollLeft(e.currentTarget.scrollLeft)} className={cn("w-full", calendar && "overflow-x-auto overflow-y-hidden [scrollbar-width:thin]")} onPointerMove={onPointerMove} onPointerLeave={() => setActive(null)}>
          {width !== null && cells.length > 0 && (
            <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} className="block shrink-0 touch-pan-y" style={calendar ? undefined : { width: "100%" }} aria-hidden="true">
              {colLabels.map((c) => (
                <text key={c.col} x={xOf(c.col) + (calendar ? 0 : cw / 2)} y={11} textAnchor={calendar ? "start" : "middle"} className="fill-muted-foreground text-[10px]">
                  {c.text}
                </text>
              ))}
              {rowLabels.map((r) => (
                <text key={r.row} x={labelW - 6} y={yOf(r.row) + ch / 2} dy=".35em" textAnchor="end" className="fill-muted-foreground text-[10px]">
                  {r.text}
                </text>
              ))}
              {cells.map((c) => {
                const level = levelOf(c.value)
                const isActive = active === c.id
                return (
                  <rect
                    key={c.id}
                    data-cell={c.id}
                    className={cn("pc-heatmap-cell", level === 0 && "fill-muted", isActive && "stroke-foreground")}
                    style={{ ["--d" as string]: c.col, ...(level > 0 ? { fill: color, fillOpacity: opacityOf(level) } : {}) }}
                    x={xOf(c.col)}
                    y={yOf(c.row)}
                    width={cw}
                    height={ch}
                    rx={Math.min(3, cw / 4)}
                    strokeWidth={isActive ? 1.5 : 0}
                  />
                )
              })}
            </svg>
          )}
          {width !== null && cells.length === 0 && <div className="grid h-24 place-items-center text-sm text-muted-foreground">{l.noData}</div>}
        </div>
        {activeCell && (
          <div
            className="pointer-events-none absolute z-10 flex flex-col gap-0.5 rounded-md border bg-popover px-2.5 py-1.5 text-xs whitespace-nowrap text-popover-foreground shadow-[var(--pc-e2)]"
            style={{ left: tipX, top: tipY, transform: `translate(${tipRight ? "calc(-100% - 10px)" : "10px"}, calc(-100% - 6px))` }}
          >
            <span className="text-muted-foreground">{activeCell.label}</span>
            <span className="flex items-center gap-1.5 font-semibold tabular-nums">
              <span className="inline-block size-2 rounded-[2px]" style={{ background: color, opacity: Math.max(0.22, opacityOf(levelOf(activeCell.value))) }} />
              {fmt(activeCell.value)}
            </span>
          </div>
        )}
        <span className="sr-only" aria-live="polite">
          {announce}
        </span>
      </div>
      {legend && cells.length > 0 && (
        <div className="flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground" aria-hidden="true">
          <span>{l.less}</span>
          {Array.from({ length: steps + 1 }, (_, i) => (
            <span key={i} className={cn("inline-block size-2.5 rounded-[2px]", i === 0 && "bg-muted")} style={i > 0 ? { background: color, opacity: opacityOf(i) } : undefined} />
          ))}
          <span>{l.more}</span>
        </div>
      )}
    </div>
  )
}

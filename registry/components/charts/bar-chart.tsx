"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { ChartLegend } from "@/registry/components/charts/chart-legend"
import { useLabels } from "@/lib/goodui-locale"
import { GooduiTokens, spring as springs } from "@/lib/goodui-motion"

export type BarSeries = {
  key: string
  label: string
  /** One value per category, in order. Stacked mode expects values of 0 or more. */
  data: number[]
  /** Any CSS color. Defaults to the theme chart colors in series order (--chart-1 … --chart-5). */
  color?: string
}

export type BarChartLabels = {
  summary: (name: string, seriesCount: number, categoryCount: number) => string
  /** Announced while scrubbing: `parts` is "Series: value, Series: value". */
  point: (category: string, parts: string) => string
  total: string
  legend: string
  columnCategory: string
  noData: string
}
const DEFAULT_LABELS: BarChartLabels = {
  summary: (name, s, c) => `${name ? name + ": " : ""}${s} series across ${c} categories`,
  point: (category, parts) => `${category}: ${parts}`,
  total: "Total",
  legend: "Series",
  columnCategory: "Category",
  noData: "No data",
}

export type BarChartProps = Omit<React.ComponentProps<"div">, "title" | "hidden"> & {
  series: BarSeries[]
  categories: string[]
  /** Chart name for screen readers and the table caption. */
  title?: React.ReactNode
  /** grouped: one bar per series side by side. stacked: one bar per category, segments separated by a 2px gap. */
  mode?: "grouped" | "stacked"
  /** vertical columns or horizontal bars (category labels on the start side, values along the bottom). */
  orientation?: "vertical" | "horizontal"
  /** Prints the value at each bar's end (the stack total in stacked mode). */
  valueLabels?: boolean
  /** Maximum bar thickness in px; the rest of the slot stays air. */
  barSize?: number
  /** Corner radius of the data end in px. The baseline end stays square. */
  radius?: number
  /** Keys of hidden series (controlled). */
  hidden?: string[]
  defaultHidden?: string[]
  onHiddenChange?: (hidden: string[]) => void
  /** Legend placement; a single series shows none. */
  legend?: "top" | "bottom" | "none"
  /** Plot height in px, axes included. Horizontal charts default to a row height per category. */
  height?: number
  /** Row height per category in horizontal mode. */
  rowHeight?: number
  grid?: boolean
  axis?: boolean
  /** Space for the value ticks (vertical) or the category labels (horizontal), in px. */
  axisWidth?: number
  format?: Intl.NumberFormatOptions
  locale?: string
  formatValue?: (value: number) => string
  formatTick?: (value: number) => string
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<BarChartLabels>
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

function niceTicks(lo: number, hi: number, count = 4): number[] {
  if (hi <= lo) hi = lo + 1
  const raw = (hi - lo) / count
  const mag = 10 ** Math.floor(Math.log10(raw))
  const norm = raw / mag
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag
  const start = Math.floor(lo / step) * step
  const end = Math.ceil(hi / step) * step
  const ticks: number[] = []
  for (let v = start; v <= end + step / 2; v += step) ticks.push(Number(v.toFixed(10)))
  return ticks
}

/** Rounded rectangle with per-corner radii drawn with quadratic corners, so every bar shares one path template and morphs. */
function rrect(x: number, y: number, w: number, h: number, tl: number, tr: number, br: number, bl: number) {
  const m = Math.max(0, Math.min(w / 2, h / 2))
  const a = Math.min(tl, m)
  const b = Math.min(tr, m)
  const c = Math.min(br, m)
  const d = Math.min(bl, m)
  const f = (v: number) => v.toFixed(1)
  return `M${f(x + a)},${f(y)}H${f(x + w - b)}Q${f(x + w)},${f(y)} ${f(x + w)},${f(y + b)}V${f(y + h - c)}Q${f(x + w)},${f(y + h)} ${f(x + w - c)},${f(y + h)}H${f(x + d)}Q${f(x)},${f(y + h)} ${f(x)},${f(y + h - d)}V${f(y + a)}Q${f(x)},${f(y)} ${f(x + a)},${f(y)}Z`
}

type Bar = { key: string; cat: number; x: number; y: number; w: number; h: number; from: string; to: string; color: string; value: number; label: string; dim: boolean }

/** Grouped or stacked bars that grow from the baseline on view and morph on data changes, with a hover band, a legend and arrow-key scrubbing. */
export function BarChart({
  series,
  categories,
  title,
  mode = "grouped",
  orientation = "vertical",
  valueLabels = false,
  barSize = 24,
  radius = 4,
  hidden: hiddenProp,
  defaultHidden,
  onHiddenChange,
  legend = "bottom",
  height: heightProp,
  rowHeight = 34,
  grid = true,
  axis = true,
  axisWidth,
  format,
  locale = "en-US",
  formatValue,
  formatTick,
  labels,
  className,
  "aria-label": ariaLabel,
  ...props
}: BarChartProps) {
  const l = useLabels("bar-chart", DEFAULT_LABELS, labels)
  const reduce = useReduce()
  const rootRef = React.useRef<HTMLDivElement>(null)
  const plotRef = React.useRef<HTMLDivElement>(null)
  const inView = useInView(rootRef)
  const width = useWidth(plotRef)
  const [innerHidden, setInnerHidden] = React.useState<string[]>(defaultHidden ?? [])
  const hidden = hiddenProp ?? innerHidden
  const [hot, setHot] = React.useState<string | null>(null)
  const [active, setActive] = React.useState<number | null>(null)

  const horizontal = orientation === "horizontal"
  const stacked = mode === "stacked"
  const n = categories.length
  const gap = 2
  const colorOf = (s: BarSeries, i: number) => s.color ?? `var(--chart-${(i % 5) + 1})`
  const visible = series.filter((s) => !hidden.includes(s.key))
  const k = visible.length
  const totals = categories.map((_, i) => visible.reduce((sum, s) => sum + Math.max(0, s.data[i] ?? 0), 0))
  const all = stacked ? totals : visible.flatMap((s) => s.data.slice(0, n))
  const min = Math.min(0, ...(all.length ? all : [0]))
  const max = Math.max(0, ...(all.length ? all : [0]))
  const ticks = niceTicks(min, max, 4)
  const lo = ticks[0] ?? 0
  const hi = ticks[ticks.length - 1] ?? 1
  const fmt = React.useMemo(() => formatValue ?? ((v: number) => new Intl.NumberFormat(locale, format).format(v)), [formatValue, locale, format])
  const tick = React.useMemo(() => {
    if (formatTick) return formatTick
    const compact = Math.max(Math.abs(hi), Math.abs(lo)) >= 10000
    const f = new Intl.NumberFormat(locale, compact ? { ...format, notation: "compact", maximumFractionDigits: Math.max(1, format?.minimumFractionDigits ?? 0) } : format)
    return (v: number) => f.format(v)
  }, [formatTick, locale, format, hi, lo])

  const W = width ?? 0
  const padL = axis ? (axisWidth ?? (horizontal ? 96 : 44)) : 6
  const padR = horizontal && valueLabels ? 56 : 10
  const padT = !horizontal && valueLabels ? 20 : 12
  const padB = axis ? 24 : 8
  const height = heightProp ?? (horizontal ? n * rowHeight + padT + padB : 240)
  const plotW = Math.max(10, W - padL - padR)
  const plotH = Math.max(10, height - padT - padB)
  // Value scale along y (vertical) or x (horizontal).
  const span = hi - lo || 1
  const vy = (v: number) => padT + (1 - (v - lo) / span) * plotH
  const vx = (v: number) => padL + ((v - lo) / span) * plotW
  const slot = horizontal ? plotH / Math.max(1, n) : plotW / Math.max(1, n)
  const inner = slot * 0.72
  const thick = stacked ? Math.min(barSize, inner) : Math.max(1, Math.min(barSize, (inner - (k - 1) * gap) / Math.max(1, k)))
  const groupSize = stacked ? thick : k * thick + (k - 1) * gap
  const catPos = (i: number) => (horizontal ? padT : padL) + i * slot + (slot - groupSize) / 2
  const catCenter = (i: number) => (horizontal ? padT : padL) + i * slot + slot / 2
  const base = horizontal ? vx(0) : vy(0)

  const bars: Bar[] = []
  categories.forEach((_cat, i) => {
    let cum = 0
    const topIndex = stacked ? visible.reduce((last, s, j) => (Math.max(0, s.data[i] ?? 0) > 0 ? j : last), -1) : -1
    visible.forEach((s, j) => {
      const v = s.data[i] ?? 0
      const si = series.indexOf(s)
      const color = colorOf(s, si)
      const dim = hot !== null && hot !== s.key
      if (stacked) {
        const a = cum
        const b = cum + Math.max(0, v)
        cum = b
        const isTop = j === topIndex
        if (horizontal) {
          const x0 = vx(a)
          const x1 = vx(b)
          const w = Math.max(0, x1 - x0 - (isTop ? 0 : gap))
          const y = catPos(i)
          const r = isTop ? radius : 0
          bars.push({ key: `${s.key}-${i}`, cat: i, x: x0, y, w, h: thick, from: rrect(x0, y, 0, thick, 0, 0, 0, 0), to: rrect(x0, y, w, thick, 0, r, r, 0), color, value: v, label: s.label, dim })
        } else {
          const y1 = vy(b)
          const y0 = vy(a)
          const y = y1 + (isTop ? 0 : gap)
          const h = Math.max(0, y0 - y)
          const x = catPos(i)
          const r = isTop ? radius : 0
          bars.push({ key: `${s.key}-${i}`, cat: i, x, y, w: thick, h, from: rrect(x, y0, thick, 0, 0, 0, 0, 0), to: rrect(x, y, thick, h, r, r, 0, 0), color, value: v, label: s.label, dim })
        }
      } else if (horizontal) {
        const x0 = Math.min(base, vx(v))
        const x1 = Math.max(base, vx(v))
        const y = catPos(i) + j * (thick + gap)
        const pos = v >= 0
        bars.push({ key: `${s.key}-${i}`, cat: i, x: x0, y, w: x1 - x0, h: thick, from: rrect(base, y, 0, thick, 0, 0, 0, 0), to: rrect(x0, y, x1 - x0, thick, pos ? 0 : radius, pos ? radius : 0, pos ? radius : 0, pos ? 0 : radius), color, value: v, label: s.label, dim })
      } else {
        const y0 = Math.min(base, vy(v))
        const y1 = Math.max(base, vy(v))
        const x = catPos(i) + j * (thick + gap)
        const pos = v >= 0
        bars.push({ key: `${s.key}-${i}`, cat: i, x, y: y0, w: thick, h: y1 - y0, from: rrect(x, base, thick, 0, 0, 0, 0, 0), to: rrect(x, y0, thick, y1 - y0, pos ? radius : 0, pos ? radius : 0, pos ? 0 : radius, pos ? 0 : radius), color, value: v, label: s.label, dim })
      }
    })
  })

  const catLabels: number[] = []
  if (n > 0) {
    const step = horizontal ? 1 : Math.max(1, Math.ceil(n / Math.max(2, Math.floor(plotW / 56))))
    for (let i = 0; i < n; i += step) catLabels.push(i)
  }

  const name = typeof title === "string" ? title : ""
  const summary = ariaLabel ?? (n && series.length ? l.summary(name, series.length, n) : l.noData)
  const setHidden = (next: string[]) => {
    if (hiddenProp === undefined) setInnerHidden(next)
    onHiddenChange?.(next)
  }
  const indexAt = (clientX: number, clientY: number) => {
    const rect = plotRef.current?.getBoundingClientRect()
    if (!rect || n === 0) return null
    const p = horizontal ? clientY - rect.top - padT : clientX - rect.left - padL
    return Math.min(n - 1, Math.max(0, Math.floor(p / slot)))
  }
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (n === 0) return
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
      e.preventDefault()
      const dir = e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 1
      setActive((i) => Math.min(n - 1, Math.max(0, (i ?? (dir > 0 ? -1 : n)) + dir)))
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault()
      setActive(e.key === "Home" ? 0 : n - 1)
    } else if (e.key === "Escape") setActive(null)
  }

  const ready = inView || reduce
  // A container resize reshapes the bars at once; only data changes morph.
  const widthRef = React.useRef(W)
  const resized = widthRef.current !== W
  widthRef.current = W
  const spring = reduce || resized ? { duration: 0 } : springs.morph
  const activeRows = active !== null ? visible.map((s) => ({ s, i: series.indexOf(s), v: s.data[active] ?? 0 })) : []
  const activeCat = active !== null ? (categories[active] ?? "") : ""
  const announce = active !== null ? l.point(activeCat, activeRows.map((r) => `${r.s.label}: ${fmt(r.v)}`).join(", ") + (stacked ? `, ${l.total}: ${fmt(totals[active] ?? 0)}` : "")) : ""
  const tipX = active !== null ? (horizontal ? padL + plotW * 0.5 : catCenter(active)) : 0
  const tipY = active !== null ? (horizontal ? catCenter(active) : padT) : 0
  const tipRight = tipX > W * 0.55

  const legendNode =
    legend !== "none" && series.length > 1 ? (
      <ChartLegend items={series.map((s, i) => ({ key: s.key, label: s.label, color: colorOf(s, i) }))} hidden={hidden} onHiddenChange={setHidden} active={hot} onActiveChange={setHot} size="sm" labels={{ legend: l.legend }} />
    ) : null

  return (
    <div ref={rootRef} className={cn("pc-bar-chart flex w-full min-w-0 flex-col gap-2", className)} {...props}>
      <GooduiTokens />
      {legend === "top" && legendNode}
      <div
        ref={plotRef}
        role="group"
        aria-roledescription="bar chart"
        aria-label={summary}
        tabIndex={0}
        onPointerMove={(e) => setActive(indexAt(e.clientX, e.clientY))}
        onPointerLeave={() => setActive(null)}
        onFocus={() => setActive((i) => i ?? (n ? 0 : null))}
        onBlur={() => setActive(null)}
        onKeyDown={onKeyDown}
        className="relative w-full touch-pan-y rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        style={{ height }}
      >
        {width !== null && n > 0 && (
          <svg width={W} height={height} viewBox={`0 0 ${W} ${height}`} className="absolute inset-0 overflow-visible" aria-hidden="true">
            {active !== null && (
              <motion.rect
                className="fill-foreground"
                initial={false}
                animate={horizontal ? { x: padL - 4, y: padT + active * slot, width: plotW + 8, height: slot } : { x: padL + active * slot, y: padT - 4, width: slot, height: plotH + 8 }}
                transition={reduce ? { duration: 0 } : springs.snap}
                rx={6}
                style={{ opacity: 0.045 }}
              />
            )}
            <AnimatePresence initial={false}>
              {ticks.map((t) => (
                <motion.g key={t} initial={{ opacity: 0, ...(horizontal ? { x: vx(t) } : { y: vy(t) }) }} animate={{ opacity: 1, ...(horizontal ? { x: vx(t) } : { y: vy(t) }) }} exit={{ opacity: 0 }} transition={spring}>
                  {grid && (horizontal ? <line x1={0} x2={0} y1={padT} y2={padT + plotH} className="stroke-border" /> : <line x1={padL} x2={padL + plotW} y1={0} y2={0} className="stroke-border" />)}
                  {axis &&
                    (horizontal ? (
                      <text x={0} y={height - 6} textAnchor="middle" className="fill-muted-foreground text-[11px] tabular-nums">
                        {tick(t)}
                      </text>
                    ) : (
                      <text x={padL - 8} y={0} dy=".35em" textAnchor="end" className="fill-muted-foreground text-[11px] tabular-nums">
                        {tick(t)}
                      </text>
                    ))}
                </motion.g>
              ))}
            </AnimatePresence>
            {horizontal ? <line x1={base} x2={base} y1={padT} y2={padT + plotH} className="stroke-border" /> : <line x1={padL} x2={padL + plotW} y1={base} y2={base} className="stroke-border" />}
            {bars.map((b, idx) => (
              <motion.path
                key={b.key}
                d={ready ? b.to : b.from}
                style={{ fill: b.color }}
                initial={false}
                animate={{ d: ready ? b.to : b.from, opacity: !ready ? 0 : b.dim ? 0.3 : active !== null && active !== b.cat ? 0.75 : 1 }}
                transition={{ d: reduce ? { duration: 0 } : { ...spring, delay: b.cat * 0.035 + (idx % Math.max(1, k)) * 0.05 }, opacity: { duration: reduce ? 0 : 0.2 } }}
              />
            ))}
            {valueLabels &&
              categories.map((_, i) => {
                const v = stacked ? (totals[i] ?? 0) : null
                const items = stacked ? [{ v: v ?? 0, key: `t${i}`, pos: horizontal ? vx(v ?? 0) : vy(v ?? 0), off: catCenter(i) }] : bars.filter((b) => b.cat === i).map((b) => ({ v: b.value, key: b.key, pos: horizontal ? (b.value >= 0 ? b.x + b.w : b.x) : b.value >= 0 ? b.y : b.y + b.h, off: horizontal ? b.y + b.h / 2 : b.x + b.w / 2 }))
                return items.map((it) => (
                  <motion.text
                    key={it.key}
                    x={horizontal ? it.pos + (it.v >= 0 ? 6 : -6) : it.off}
                    y={horizontal ? it.off : it.pos + (it.v >= 0 ? -6 : 14)}
                    dy={horizontal ? ".35em" : 0}
                    textAnchor={horizontal ? (it.v >= 0 ? "start" : "end") : "middle"}
                    className="fill-foreground text-[11px] font-medium tabular-nums"
                    initial={false}
                    animate={{ opacity: ready ? 1 : 0 }}
                    transition={reduce ? { duration: 0 } : { duration: 0.3, delay: 0.45 + i * 0.035 }}
                  >
                    {fmt(it.v)}
                  </motion.text>
                ))
              })}
            {axis &&
              catLabels.map((i) =>
                horizontal ? (
                  <text key={i} x={padL - 8} y={catCenter(i)} dy=".35em" textAnchor="end" className="fill-muted-foreground text-[11px]">
                    {categories[i]}
                  </text>
                ) : (
                  <text key={i} x={catCenter(i)} y={height - 6} textAnchor="middle" className="fill-muted-foreground text-[11px]">
                    {categories[i]}
                  </text>
                ),
              )}
          </svg>
        )}
        {width !== null && (n === 0 || series.length === 0) && <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">{l.noData}</div>}
        {active !== null && activeRows.length > 0 && (
          <div
            className="pointer-events-none absolute z-10 flex min-w-32 flex-col gap-1 rounded-md border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-[var(--pc-e2)]"
            style={{ left: tipX, top: tipY, transform: `translate(${tipRight ? "calc(-100% - 12px)" : "12px"}, ${horizontal ? "-50%" : "0"})` }}
          >
            <span className="text-muted-foreground">{activeCat}</span>
            {activeRows.map((r) => (
              <span key={r.s.key} className="flex items-center gap-2 whitespace-nowrap">
                <span className="inline-block size-2 shrink-0 rounded-[2px]" style={{ background: colorOf(r.s, r.i) }} />
                <span className="flex-1 text-muted-foreground">{r.s.label}</span>
                <span className="font-semibold tabular-nums">{fmt(r.v)}</span>
              </span>
            ))}
            {stacked && activeRows.length > 1 && (
              <span className="mt-0.5 flex items-center gap-2 border-t pt-1 whitespace-nowrap">
                <span className="flex-1 text-muted-foreground">{l.total}</span>
                <span className="font-semibold tabular-nums">{fmt(totals[active] ?? 0)}</span>
              </span>
            )}
          </div>
        )}
        <span className="sr-only" aria-live="polite">
          {announce}
        </span>
      </div>
      {legend === "bottom" && legendNode}
      {n > 0 && series.length > 0 && (
        <div className="sr-only">
          <table>
          <caption>{summary}</caption>
          <thead>
            <tr>
              <th scope="col">{l.columnCategory}</th>
              {series.map((s) => (
                <th key={s.key} scope="col">
                  {s.label}
                </th>
              ))}
              {stacked && series.length > 1 && <th scope="col">{l.total}</th>}
            </tr>
          </thead>
          <tbody>
            {categories.map((c, i) => (
              <tr key={i}>
                <th scope="row">{c}</th>
                {series.map((s) => (
                  <td key={s.key}>{fmt(s.data[i] ?? 0)}</td>
                ))}
                {stacked && series.length > 1 && <td>{fmt(series.reduce((sum, s) => sum + Math.max(0, s.data[i] ?? 0), 0))}</td>}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  )
}

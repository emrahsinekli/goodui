"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { ChartLegend } from "@/registry/components/charts/chart-legend"
import { useLabels } from "@/lib/goodui-locale"
import { GooduiTokens, spring } from "@/lib/goodui-motion"

export type LineSeries = {
  key: string
  label: string
  /** One value per category, in order. */
  data: number[]
  /** Any CSS color. Defaults to the theme chart colors in series order (--chart-1 … --chart-5). */
  color?: string
}

export type LineChartLabels = {
  /** Screen reader summary; `name` is the title when it is a string. */
  summary: (name: string, seriesCount: number, periodCount: number) => string
  /** Announced while scrubbing: `parts` is "Series: value, Series: value". */
  point: (period: string, parts: string) => string
  /** Marks the dashed forecast segment. */
  forecast: string
  legend: string
  /** First column header of the screen reader table. */
  columnPeriod: string
  noData: string
}
const DEFAULT_LABELS: LineChartLabels = {
  summary: (name, s, p) => `${name ? name + ": " : ""}${s} series over ${p} periods`,
  point: (period, parts) => `${period}: ${parts}`,
  forecast: "Forecast",
  legend: "Series",
  columnPeriod: "Period",
  noData: "No data",
}

export type LineChartProps = Omit<React.ComponentProps<"div">, "title" | "hidden"> & {
  series: LineSeries[]
  /** X labels, one per data point. */
  categories: string[]
  /** Chart name for screen readers and the table caption. */
  title?: React.ReactNode
  /** Index from which the lines are drawn dashed (a projection); a divider labelled "Forecast" marks it. */
  forecastFrom?: number
  /** Keys of hidden series (controlled). */
  hidden?: string[]
  defaultHidden?: string[]
  onHiddenChange?: (hidden: string[]) => void
  /** Legend placement; a single series shows none. */
  legend?: "top" | "bottom" | "none"
  /** Plot height in px, axes included. The width follows the container. */
  height?: number
  curve?: "smooth" | "linear"
  /** zero keeps 0 in view; auto zooms to the data. */
  baseline?: "zero" | "auto"
  grid?: boolean
  axis?: boolean
  axisWidth?: number
  /** Ring dot on the last point of every line. */
  endDots?: boolean
  /** Intl.NumberFormat options for values and ticks. */
  format?: Intl.NumberFormatOptions
  locale?: string
  formatValue?: (value: number) => string
  formatTick?: (value: number) => string
  /** Resampled points per line; constant, so lines morph when the data changes. */
  samples?: number
  /** Seconds one line takes to draw; lines stagger by 0.12 s. */
  duration?: number
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<LineChartLabels>
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

/** Monotone cubic (Fritsch–Carlson) or linear resampling at n evenly spaced positions. */
function sampleCurve(values: number[], n: number, smooth: boolean): number[] {
  const len = values.length
  if (len === 0) return []
  if (len === 1) return Array.from({ length: n }, () => values[0] ?? 0)
  const d: number[] = []
  for (let i = 0; i < len - 1; i++) d.push((values[i + 1] ?? 0) - (values[i] ?? 0))
  const m: number[] = [d[0] ?? 0]
  for (let i = 1; i < len - 1; i++) {
    const a = d[i - 1] ?? 0
    const b = d[i] ?? 0
    m.push(a * b <= 0 ? 0 : (a + b) / 2)
  }
  m.push(d[len - 2] ?? 0)
  for (let i = 0; i < len - 1; i++) {
    const di = d[i] ?? 0
    if (di === 0) {
      m[i] = 0
      m[i + 1] = 0
      continue
    }
    const a = (m[i] ?? 0) / di
    const b = (m[i + 1] ?? 0) / di
    const s = a * a + b * b
    if (s > 9) {
      const k = 3 / Math.sqrt(s)
      m[i] = k * a * di
      m[i + 1] = k * b * di
    }
  }
  const out: number[] = []
  for (let i = 0; i < n; i++) {
    const t = (i / (n - 1)) * (len - 1)
    const k = Math.min(len - 2, Math.floor(t))
    const u = t - k
    const y0 = values[k] ?? 0
    const y1 = values[k + 1] ?? 0
    if (!smooth) {
      out.push(y0 + (y1 - y0) * u)
      continue
    }
    const u2 = u * u
    const u3 = u2 * u
    out.push((2 * u3 - 3 * u2 + 1) * y0 + (u3 - 2 * u2 + u) * (m[k] ?? 0) + (-2 * u3 + 3 * u2) * y1 + (u3 - u2) * (m[k + 1] ?? 0))
  }
  return out
}

/** Multi-series line chart: lines draw in on view, a legend toggles them, a crosshair reads every series, and a dashed segment marks the forecast. */
export function LineChart({
  series,
  categories,
  title,
  forecastFrom,
  hidden: hiddenProp,
  defaultHidden,
  onHiddenChange,
  legend = "bottom",
  height = 240,
  curve = "smooth",
  baseline = "zero",
  grid = true,
  axis = true,
  axisWidth = 44,
  endDots = true,
  format,
  locale = "en-US",
  formatValue,
  formatTick,
  samples = 160,
  duration = 1.1,
  labels,
  className,
  "aria-label": ariaLabel,
  ...props
}: LineChartProps) {
  const l = useLabels("line-chart", DEFAULT_LABELS, labels)
  const reduce = useReduce()
  const rootRef = React.useRef<HTMLDivElement>(null)
  const plotRef = React.useRef<HTMLDivElement>(null)
  const inView = useInView(rootRef)
  const width = useWidth(plotRef)
  const [innerHidden, setInnerHidden] = React.useState<string[]>(defaultHidden ?? [])
  const hidden = hiddenProp ?? innerHidden
  const [hot, setHot] = React.useState<string | null>(null)
  const [active, setActive] = React.useState<number | null>(null)

  const n = categories.length
  const colorOf = (s: LineSeries, i: number) => s.color ?? `var(--chart-${(i % 5) + 1})`
  const visible = series.filter((s) => !hidden.includes(s.key))
  const all = visible.flatMap((s) => s.data.slice(0, n))
  const min = all.length ? Math.min(...all) : 0
  const max = all.length ? Math.max(...all) : 0
  const ticks = niceTicks(baseline === "zero" ? Math.min(0, min) : min, baseline === "zero" ? Math.max(0, max) : max, 4)
  const bottom = ticks[0] ?? 0
  const top = ticks[ticks.length - 1] ?? 1
  const fmt = React.useMemo(() => formatValue ?? ((v: number) => new Intl.NumberFormat(locale, format).format(v)), [formatValue, locale, format])
  const tick = React.useMemo(() => {
    if (formatTick) return formatTick
    const compact = Math.max(Math.abs(top), Math.abs(bottom)) >= 10000
    const f = new Intl.NumberFormat(locale, compact ? { ...format, notation: "compact", maximumFractionDigits: Math.max(1, format?.minimumFractionDigits ?? 0) } : format)
    return (v: number) => f.format(v)
  }, [formatTick, locale, format, top, bottom])

  const W = width ?? 0
  const hasForecast = forecastFrom !== undefined && forecastFrom > 0 && forecastFrom < n
  const padL = axis ? axisWidth : 6
  const padR = 10
  const padT = hasForecast ? 24 : 12
  const padB = 24
  const plotW = Math.max(10, W - padL - padR)
  const plotH = Math.max(10, height - padT - padB)
  const yOf = (v: number) => padT + (1 - (v - bottom) / (top - bottom || 1)) * plotH
  const xOf = (i: number) => padL + (n > 1 ? (i / (n - 1)) * plotW : plotW / 2)
  const sx = (i: number) => padL + (i / (samples - 1)) * plotW
  const splitAt = hasForecast ? Math.round(((forecastFrom ?? 0) / (n - 1)) * (samples - 1)) : samples - 1
  const structure = `${n}-${samples}-${splitAt}`

  const xLabels: number[] = []
  if (n > 0) {
    const step = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(plotW / 64))))
    for (let i = 0; i < n; i += step) xLabels.push(i)
    const lastShown = xLabels[xLabels.length - 1] ?? 0
    if (n > 1 && lastShown !== n - 1) {
      // The last label is always shown; it replaces the previous one when the two would touch.
      if (((n - 1 - lastShown) * plotW) / (n - 1) >= 56) xLabels.push(n - 1)
      else xLabels[xLabels.length - 1] = n - 1
    }
  }

  const name = typeof title === "string" ? title : ""
  const summary = ariaLabel ?? (n && series.length ? l.summary(name, series.length, n) : l.noData)
  const setHidden = (next: string[]) => {
    if (hiddenProp === undefined) setInnerHidden(next)
    onHiddenChange?.(next)
  }

  const indexAt = (clientX: number) => {
    const rect = plotRef.current?.getBoundingClientRect()
    if (!rect || n === 0) return null
    if (n === 1) return 0
    return Math.min(n - 1, Math.max(0, Math.round((clientX - rect.left - padL) / (plotW / (n - 1)))))
  }
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (n === 0) return
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault()
      const dir = e.key === "ArrowLeft" ? -1 : 1
      setActive((i) => Math.min(n - 1, Math.max(0, (i ?? n - 1) + dir)))
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault()
      setActive(e.key === "Home" ? 0 : n - 1)
    } else if (e.key === "Escape") setActive(null)
  }

  const ready = inView || reduce
  // Once the entrance has played, labels that appear later (a resize) show without the stagger.
  const [entered, setEntered] = React.useState(false)
  React.useEffect(() => {
    if (!inView) return
    const id = window.setTimeout(() => setEntered(true), reduce ? 0 : duration * 1000 + series.length * 120 + 300)
    return () => window.clearTimeout(id)
  }, [inView, reduce, duration, series.length])
  // A container resize reshapes the chart at once; only data changes morph.
  const widthRef = React.useRef(W)
  const resized = widthRef.current !== W
  widthRef.current = W
  const ease = [0.65, 0, 0.35, 1] as const
  const morph = reduce || resized ? { duration: 0 } : spring.morph
  const snap = reduce ? { duration: 0 } : spring.snap
  const ax = active !== null ? xOf(active) : 0
  const tipRight = ax > W * 0.55
  const period = active !== null ? (categories[active] ?? "") : ""
  const activeRows = active !== null ? visible.map((s) => ({ s, i: series.indexOf(s), v: s.data[active] })) : []
  const announce = active !== null ? l.point(period, activeRows.map((r) => `${r.s.label}: ${r.v === undefined ? "–" : fmt(r.v)}`).join(", ")) : ""

  const legendNode =
    legend !== "none" && series.length > 1 ? (
      <ChartLegend
        items={series.map((s, i) => ({ key: s.key, label: s.label, color: colorOf(s, i), shape: "line" }))}
        hidden={hidden}
        onHiddenChange={setHidden}
        active={hot}
        onActiveChange={setHot}
        size="sm"
        labels={{ legend: l.legend }}
      />
    ) : null

  return (
    <div ref={rootRef} className={cn("pc-line-chart flex w-full min-w-0 flex-col gap-2", className)} {...props}>
      <GooduiTokens />
      {legend === "top" && legendNode}
      <div
        ref={plotRef}
        role="group"
        aria-roledescription="line chart"
        aria-label={summary}
        tabIndex={0}
        onPointerMove={(e) => setActive(indexAt(e.clientX))}
        onPointerLeave={() => setActive(null)}
        onFocus={() => setActive((i) => i ?? (n ? n - 1 : null))}
        onBlur={() => setActive(null)}
        onKeyDown={onKeyDown}
        className="relative w-full touch-pan-y rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        style={{ height }}
      >
        {width !== null && n > 0 && (
          <svg width={W} height={height} viewBox={`0 0 ${W} ${height}`} className="absolute inset-0 overflow-visible" aria-hidden="true">
            <AnimatePresence initial={false}>
              {ticks.map((t) => (
                <motion.g key={t} initial={{ opacity: 0, y: yOf(t) }} animate={{ opacity: 1, y: yOf(t) }} exit={{ opacity: 0 }} transition={morph}>
                  {grid && <line x1={padL} x2={padL + plotW} y1={0} y2={0} className="stroke-border" strokeWidth={1} />}
                  {axis && (
                    <text x={padL - 8} y={0} dy=".35em" textAnchor="end" className="fill-muted-foreground text-[11px] tabular-nums">
                      {tick(t)}
                    </text>
                  )}
                </motion.g>
              ))}
            </AnimatePresence>
            {!grid && <line x1={padL} x2={padL + plotW} y1={padT + plotH} y2={padT + plotH} className="stroke-border" />}
            {hasForecast && (
              <motion.g initial={false} animate={{ opacity: ready ? 1 : 0 }} transition={reduce ? { duration: 0 } : { duration: 0.4, delay: duration }}>
                <line x1={xOf(forecastFrom ?? 0)} x2={xOf(forecastFrom ?? 0)} y1={padT - 4} y2={padT + plotH} className="stroke-border" strokeWidth={1} />
                <text x={xOf(forecastFrom ?? 0) + 6} y={padT - 8} className="fill-muted-foreground text-[10px] font-medium tracking-wide uppercase">
                  {l.forecast}
                </text>
              </motion.g>
            )}
            {series.map((s, i) => {
              const isHidden = hidden.includes(s.key)
              const ys = sampleCurve(s.data.slice(0, n), samples, curve === "smooth")
              const pts = ys.map((v, k) => `${sx(k).toFixed(1)},${yOf(v).toFixed(1)}`)
              const solid = "M" + pts.slice(0, splitAt + 1).join("L")
              const dashed = hasForecast ? "M" + pts.slice(splitAt).join("L") : ""
              const color = colorOf(s, i)
              const dim = hot !== null && hot !== s.key
              const op = isHidden ? 0 : dim ? 0.25 : 1
              const lastV = s.data[n - 1]
              return (
                <g key={s.key}>
                  <motion.path
                    key={`s${structure}`}
                    d={solid}
                    fill="none"
                    style={{ stroke: color }}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={false}
                    animate={{ d: solid, pathLength: ready ? 1 : 0, opacity: ready ? op : 0 }}
                    transition={{ d: morph, pathLength: reduce ? { duration: 0 } : { duration: duration * (hasForecast ? splitAt / (samples - 1) : 1), delay: i * 0.12, ease }, opacity: { duration: reduce ? 0 : 0.25 } }}
                  />
                  {hasForecast && (
                    <motion.path
                      key={`f${structure}`}
                      d={dashed}
                      fill="none"
                      style={{ stroke: color }}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={false}
                      animate={{ d: dashed, opacity: ready ? op : 0 }}
                      transition={{ d: morph, opacity: reduce ? { duration: 0 } : { duration: 0.5, delay: duration * (splitAt / (samples - 1)) + i * 0.12 } }}
                    />
                  )}
                  {endDots && lastV !== undefined && (
                    <motion.g
                      initial={false}
                      animate={{ x: xOf(n - 1), y: yOf(lastV), scale: ready ? 1 : 0, opacity: ready ? op : 0 }}
                      transition={{ x: morph, y: morph, scale: reduce ? { duration: 0 } : { ...spring.play, delay: duration * 0.9 + i * 0.12 }, opacity: { duration: 0.2 } }}
                    >
                      <circle r={4} style={{ fill: color }} className="stroke-background" strokeWidth={2} />
                    </motion.g>
                  )}
                </g>
              )
            })}
            <g>
              {xLabels.map((i) => (
                <motion.text
                  key={`${categories[i] ?? ""}-${i}`}
                  x={xOf(i)}
                  y={height - 6}
                  textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
                  className="fill-muted-foreground text-[11px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: ready ? 1 : 0 }}
                  transition={reduce ? { duration: 0 } : entered ? { duration: 0.2 } : { duration: 0.4, delay: 0.1 + (i / Math.max(1, n - 1)) * duration * 0.8 }}
                >
                  {categories[i]}
                </motion.text>
              ))}
            </g>
            {active !== null && (
              <motion.g initial={false} animate={{ x: ax }} transition={snap}>
                <line x1={0} x2={0} y1={padT} y2={padT + plotH} className="stroke-foreground/35" strokeWidth={1} />
                {activeRows.map((r) =>
                  r.v === undefined ? null : (
                    <motion.circle key={r.s.key} r={5} style={{ fill: colorOf(r.s, r.i) }} className="stroke-background" strokeWidth={2} initial={false} animate={{ cy: yOf(r.v), opacity: hot !== null && hot !== r.s.key ? 0.25 : 1 }} transition={{ cy: snap, opacity: { duration: 0.2 } }} />
                  ),
                )}
              </motion.g>
            )}
          </svg>
        )}
        {width !== null && (n === 0 || series.length === 0) && <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">{l.noData}</div>}
        {active !== null && activeRows.length > 0 && (
          <div
            className="pointer-events-none absolute z-10 flex min-w-32 flex-col gap-1 rounded-md border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-[var(--pc-e2)]"
            style={{ left: ax, top: padT, transform: `translateX(${tipRight ? "calc(-100% - 12px)" : "12px"})` }}
          >
            <span className="text-muted-foreground">
              {period}
              {hasForecast && active >= (forecastFrom ?? 0) ? ` · ${l.forecast}` : ""}
            </span>
            {activeRows.map((r) => (
              <span key={r.s.key} className="flex items-center gap-2 whitespace-nowrap">
                <span className="inline-block h-0.5 w-3 shrink-0 rounded-full" style={{ background: colorOf(r.s, r.i) }} />
                <span className="flex-1 text-muted-foreground">{r.s.label}</span>
                <span className="font-semibold tabular-nums">{r.v === undefined ? "–" : fmt(r.v)}</span>
              </span>
            ))}
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
              <th scope="col">{l.columnPeriod}</th>
              {series.map((s) => (
                <th key={s.key} scope="col">
                  {s.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.map((c, i) => (
              <tr key={i}>
                <th scope="row">
                  {c}
                  {hasForecast && i >= (forecastFrom ?? 0) ? ` (${l.forecast})` : ""}
                </th>
                {series.map((s) => (
                  <td key={s.key}>{s.data[i] === undefined ? "" : fmt(s.data[i] ?? 0)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  )
}

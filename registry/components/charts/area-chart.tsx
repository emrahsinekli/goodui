"use client"

import * as React from "react"
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { NumberFlow } from "@/registry/components/numbers/number-flow"
import { useLabels } from "@/lib/goodui-locale"
import { GooduiTokens, spring } from "@/lib/goodui-motion"

/* Mono film grain, tiled through an SVG pattern over the area fill. */
const GRAIN = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`)}`

const CSS = `
.pc-area-chart-delta{--pc-d:var(--muted-foreground);color:color-mix(in oklab,var(--pc-d) 75%,var(--foreground));background:color-mix(in oklab,var(--pc-d) 13%,transparent);transition:color .2s ease,background-color .2s ease}
.pc-area-chart-delta[data-trend=good]{--pc-d:oklch(0.53 0.13 155)}
.pc-area-chart-delta[data-trend=bad]{--pc-d:oklch(0.56 0.21 27)}
.dark .pc-area-chart-delta[data-trend=good]{--pc-d:oklch(0.72 0.16 155)}
.dark .pc-area-chart-delta[data-trend=bad]{--pc-d:oklch(0.7 0.19 25)}
.pc-area-chart-line{filter:drop-shadow(0 3px 6px color-mix(in oklab,var(--pc-area-c) 35%,transparent))}
@keyframes pc-area-chart-ping{0%{transform:scale(1);opacity:.45}80%,100%{transform:scale(2.8);opacity:0}}
.pc-area-chart-ping{transform-box:fill-box;transform-origin:center;animation:pc-area-chart-ping 2.4s var(--pc-ease-out) infinite}
@media (prefers-reduced-motion:reduce){.pc-area-chart-ping{animation:none;opacity:0}}
`

const CHANGE_FORMAT: Intl.NumberFormatOptions = { maximumFractionDigits: 1 }

export type AreaPoint = { label: string; value: number }
export type AreaRange = { key: string; label: string; data: AreaPoint[] }

export type AreaChartLabels = {
  /** Screen reader summary of the plot; `name` is the title when it is a string. */
  summary: (name: string, first: string, last: string, low: string, high: string) => string
  /** Announced while scrubbing. */
  point: (label: string, value: string) => string
  /** Accessible name of the range picker. */
  range: string
  /** Column headers of the screen reader table. */
  columnLabel: string
  columnValue: string
  noData: string
}
const DEFAULT_LABELS: AreaChartLabels = {
  summary: (name, first, last, low, high) => `${name ? name + ": " : ""}from ${first} to ${last}, low ${low}, high ${high}`,
  point: (label, value) => `${label}: ${value}`,
  range: "Time range",
  columnLabel: "Period",
  columnValue: "Value",
  noData: "No data",
}

export type AreaChartProps = Omit<React.ComponentProps<"div">, "title"> & {
  /** Points in order, oldest first. Changing them morphs the curve to the new shape. */
  data?: AreaPoint[]
  /** Named data sets with a built-in picker (1W / 1M / 1Y); the curve morphs between them. Takes precedence over data. */
  ranges?: AreaRange[]
  /** Selected range key (controlled). */
  range?: string
  /** Initial range key when uncontrolled; defaults to the first. */
  defaultRange?: string
  onRangeChange?: (key: string) => void
  /** Metric name above the headline, e.g. "Revenue". */
  title?: React.ReactNode
  /** What the rolling headline shows while nobody is scrubbing: the sum, the latest point, the average, or nothing. */
  headline?: "total" | "last" | "average" | "none"
  /** Pill with the change from the first point, following the scrub position. Its arrow flips when the sign does. */
  showChange?: boolean
  /** A drop is good news (no-shows, wait time): swaps the pill's colors. */
  invertChange?: boolean
  /** Film grain over the gradient fill. */
  grain?: boolean
  /** Muted text beside the headline, replaced by the hovered point's label while scrubbing. */
  description?: React.ReactNode
  /** Any CSS color for the line and gradient. Defaults to the theme's first chart color. */
  color?: string
  /** Plot height in px, axes included. The width follows the container. */
  height?: number
  /** smooth: monotone curve that never overshoots the data. linear: straight segments. */
  curve?: "smooth" | "linear"
  /** Horizontal hairline gridlines. */
  grid?: boolean
  /** Value ticks on the start side. */
  axis?: boolean
  /** Space reserved for the value ticks, in px. */
  axisWidth?: number
  /** Intl.NumberFormat options for the headline, tooltip and ticks, e.g. { style: "currency", currency: "USD" }. */
  format?: Intl.NumberFormatOptions
  locale?: string
  /** Replaces the default formatter for the tooltip, table and screen readers. */
  formatValue?: (value: number) => string
  /** Replaces the default tick formatter (compact above 10,000). */
  formatTick?: (value: number) => string
  /** Resampled points along the curve; a constant count is what lets 7 and 365 points morph into each other. */
  samples?: number
  /** Seconds the line takes to draw in. */
  duration?: number
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<AreaChartLabels>
}

// Reduced motion is read after mount, so the first client render matches the server.
function useReduce() {
  const prefers = useReducedMotion()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  return mounted && !!prefers
}

// True once the element has been at least `threshold` visible; the entrance plays from then on.
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

// Measured before paint; null until then so the server and the first client render both show an empty plot.
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

/** Round ticks (1, 2, 2.5, 5 × 10^n) covering lo..hi. */
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

/**
 * Samples the series at `n` evenly spaced positions: monotone cubic (Fritsch–Carlson, no overshoot) or linear.
 * Every data set becomes a path with the same number of points, so motion can morph one into the next.
 */
function sampleCurve(values: number[], n: number, smooth: boolean): number[] {
  const len = values.length
  if (len === 0) return []
  if (len === 1) return Array.from({ length: n }, () => values[0] ?? 0)
  // Tangents on unit spacing; every index below stays in range (len >= 2).
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

/** Area chart that draws in on view, morphs between ranges, and rolls its headline while you scrub with the pointer or arrow keys. */
export function AreaChart({
  data: dataProp,
  ranges,
  range: rangeProp,
  defaultRange,
  onRangeChange,
  title,
  headline = "total",
  showChange = true,
  invertChange = false,
  grain = true,
  description,
  color = "var(--chart-1)",
  height = 220,
  curve = "smooth",
  grid = true,
  axis = true,
  axisWidth = 44,
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
}: AreaChartProps) {
  const l = useLabels("area-chart", DEFAULT_LABELS, labels)
  const reduce = useReduce()
  const rootRef = React.useRef<HTMLDivElement>(null)
  const plotRef = React.useRef<HTMLDivElement>(null)
  const inView = useInView(rootRef)
  const width = useWidth(plotRef)
  const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g, "")
  const [innerRange, setInnerRange] = React.useState(defaultRange ?? ranges?.[0]?.key ?? "")
  const rangeKey = rangeProp ?? innerRange
  const data = React.useMemo(() => (ranges ? ((ranges.find((r) => r.key === rangeKey) ?? ranges[0])?.data ?? []) : (dataProp ?? [])), [ranges, rangeKey, dataProp])
  const [active, setActive] = React.useState<number | null>(null)
  const signature = data.map((d) => d.value).join(",")
  // A new data set clears the scrub position; the hairline would otherwise point at a value that no longer exists.
  const [seen, setSeen] = React.useState(signature)
  if (seen !== signature) {
    setSeen(signature)
    setActive(null)
  }

  const fmt = React.useMemo(() => formatValue ?? ((v: number) => new Intl.NumberFormat(locale, format).format(v)), [formatValue, locale, format])
  const n = data.length
  const values = data.map((d) => d.value)
  const min = n ? Math.min(...values) : 0
  const max = n ? Math.max(...values) : 0
  const ticks = niceTicks(Math.min(0, min), Math.max(0, max), 4)
  const bottom = ticks[0] ?? 0
  const top = ticks[ticks.length - 1] ?? 1
  const tick = React.useMemo(() => {
    if (formatTick) return formatTick
    const compact = Math.max(Math.abs(top), Math.abs(bottom)) >= 10000
    const f = new Intl.NumberFormat(locale, compact ? { ...format, notation: "compact", maximumFractionDigits: Math.max(1, format?.minimumFractionDigits ?? 0) } : format)
    return (v: number) => f.format(v)
  }, [formatTick, locale, format, top, bottom])

  const W = width ?? 0
  const padL = axis ? axisWidth : 6
  const padR = 10
  const padT = 12
  const padB = 24
  const plotW = Math.max(10, W - padL - padR)
  const plotH = Math.max(10, height - padT - padB)
  const yOf = (v: number) => padT + (1 - (v - bottom) / (top - bottom || 1)) * plotH
  const xOf = (i: number) => padL + (n > 1 ? (i / (n - 1)) * plotW : plotW / 2)
  const ys = React.useMemo(() => sampleCurve(values, samples, curve === "smooth"), [signature, samples, curve]) // eslint-disable-line react-hooks/exhaustive-deps
  const linePath = ys.map((v, i) => `${i ? "L" : "M"}${(padL + (i / (samples - 1)) * plotW).toFixed(1)},${yOf(v).toFixed(1)}`).join("")
  const base = (padT + plotH).toFixed(1)
  const areaPath = linePath ? `${linePath}L${(padL + plotW).toFixed(1)},${base}L${padL.toFixed(1)},${base}Z` : ""

  // Which x labels fit: every k-th, always the first, and the last when there is room for it.
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

  const total = values.reduce((s, v) => s + v, 0)
  const resting = headline === "total" ? total : headline === "last" ? (values[n - 1] ?? 0) : headline === "average" ? (n ? total / n : 0) : 0
  const activePoint = active !== null ? data[active] : undefined
  const shownValue = activePoint ? activePoint.value : resting
  const name = typeof title === "string" ? title : ""
  const summary = ariaLabel ?? (n ? l.summary(name, fmt(values[0] ?? 0), fmt(values[n - 1] ?? 0), fmt(min), fmt(max)) : l.noData)

  const firstValue = values[0] ?? 0
  const change = n > 1 && firstValue !== 0 ? (((activePoint ? activePoint.value : (values[n - 1] ?? 0)) - firstValue) / Math.abs(firstValue)) * 100 : 0
  const changeTrend = change === 0 ? "flat" : change > 0 !== invertChange ? "good" : "bad"

  const select = (key: string) => {
    if (rangeProp === undefined) setInnerRange(key)
    onRangeChange?.(key)
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

  const onRangeKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!ranges || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return
    e.preventDefault()
    const i = ranges.findIndex((r) => r.key === rangeKey)
    const next = ranges[(i + (e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 1) + ranges.length) % ranges.length]
    if (!next) return
    select(next.key)
    e.currentTarget.querySelector<HTMLButtonElement>(`[data-key="${next.key}"]`)?.focus()
  }

  const ready = inView || reduce
  // Once the entrance has played, labels that appear later (a resize, a new range) show without the stagger.
  const [entered, setEntered] = React.useState(false)
  React.useEffect(() => {
    if (!inView) return
    const id = window.setTimeout(() => setEntered(true), reduce ? 0 : duration * 1000 + 300)
    return () => window.clearTimeout(id)
  }, [inView, reduce, duration])
  // A container resize reshapes the chart at once; only data changes morph.
  const widthRef = React.useRef(W)
  const resized = widthRef.current !== W
  widthRef.current = W
  const ease = [0.65, 0, 0.35, 1] as const
  const morph = reduce || resized ? { duration: 0 } : spring.morph
  const snap = reduce ? { duration: 0 } : spring.snap
  const ax = activePoint ? xOf(active ?? 0) : 0
  const ay = activePoint ? yOf(activePoint.value) : 0
  const tipRight = ax > W * 0.55
  const tipBelow = ay < padT + 44
  const last = n ? { x: xOf(n - 1), y: yOf(values[n - 1] ?? 0) } : null

  return (
    <div ref={rootRef} className={cn("pc-area-chart flex w-full min-w-0 flex-col gap-3", className)} {...props}>
      <GooduiTokens />
      <style href="pc-area-chart" precedence="default">
        {CSS}
      </style>
      {(title !== undefined || headline !== "none" || ranges) && (
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="flex min-w-0 flex-col gap-0.5">
            {title !== undefined && <div className="text-sm text-muted-foreground">{title}</div>}
            {headline !== "none" && (
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <NumberFlow value={shownValue} format={format} locale={locale} speed={activePoint ? "fast" : "smooth"} className="text-2xl leading-none font-semibold tracking-tight" />
                {showChange && n > 1 && (
                  <span data-trend={changeTrend} className="pc-area-chart-delta inline-flex items-center gap-0.5 self-center rounded-full px-1.5 py-0.5 text-xs font-semibold">
                    <motion.svg viewBox="0 0 12 12" className="size-3" fill="none" aria-hidden="true" initial={false} animate={{ rotate: change < 0 ? 180 : 0 }} transition={reduce ? { duration: 0 } : spring.play}>
                      <path d="M6 9.5v-7M3 5l3-3 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </motion.svg>
                    <span className="sr-only">{change < 0 ? "−" : "+"}</span>
                    <NumberFlow value={Math.abs(change)} format={CHANGE_FORMAT} suffix="%" locale={locale} speed="fast" />
                  </span>
                )}
                <span className="text-xs text-muted-foreground">{activePoint ? activePoint.label : description}</span>
              </div>
            )}
          </div>
          {ranges && ranges.length > 1 && (
            <LayoutGroup id={uid}>
              <div role="radiogroup" aria-label={l.range} onKeyDown={onRangeKey} className="flex shrink-0 rounded-lg bg-muted p-0.5 text-xs">
                {ranges.map((r) => {
                  const on = r.key === rangeKey
                  return (
                    <button
                      key={r.key}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      tabIndex={on ? 0 : -1}
                      data-key={r.key}
                      onClick={() => select(r.key)}
                      className="pc-press relative rounded-md px-2.5 py-1 font-medium text-foreground/65 transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 aria-checked:text-foreground"
                    >
                      {on && <motion.span layoutId="thumb" className="absolute inset-0 rounded-md bg-background shadow-[var(--pc-e1)]" transition={reduce ? { duration: 0 } : spring.snap} />}
                      <span className="relative">{r.label}</span>
                    </button>
                  )
                })}
              </div>
            </LayoutGroup>
          )}
        </div>
      )}
      <div
        ref={plotRef}
        role="group"
        aria-roledescription="area chart"
        aria-label={summary}
        tabIndex={0}
        onPointerMove={(e) => setActive(indexAt(e.clientX))}
        onPointerLeave={() => setActive(null)}
        onFocus={() => setActive((i) => i ?? (n ? n - 1 : null))}
        onBlur={() => setActive(null)}
        onKeyDown={onKeyDown}
        className="relative w-full touch-pan-y rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        style={{ height, "--pc-area-c": color } as React.CSSProperties}
      >
        {width !== null && n > 0 && (
          <svg width={W} height={height} viewBox={`0 0 ${W} ${height}`} className="absolute inset-0 overflow-visible" aria-hidden="true">
            <defs>
              <linearGradient id={`pc-area-${uid}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.42 }} />
                <stop offset="55%" style={{ stopColor: color, stopOpacity: 0.14 }} />
                <stop offset="100%" style={{ stopColor: color, stopOpacity: 0 }} />
              </linearGradient>
              <linearGradient id={`pc-area-fade-${uid}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#fff" stopOpacity="0" />
              </linearGradient>
              <mask id={`pc-area-mask-${uid}`}>
                <rect x={0} y={0} width={W} height={height} fill={`url(#pc-area-fade-${uid})`} />
              </mask>
              <pattern id={`pc-area-grain-${uid}`} patternUnits="userSpaceOnUse" width={120} height={120}>
                <image href={GRAIN} width={120} height={120} />
              </pattern>
              <clipPath id={`pc-area-past-${uid}`}>
                <motion.rect x={0} y={-8} height={height + 16} initial={false} animate={{ width: activePoint ? ax : W }} transition={snap} />
              </clipPath>
            </defs>
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
            <motion.path
              d={areaPath}
              fill={`url(#pc-area-${uid})`}
              initial={false}
              animate={{ d: areaPath, opacity: ready ? 1 : 0 }}
              transition={{ d: morph, opacity: reduce ? { duration: 0 } : { duration: 0.7, delay: duration * 0.4, ease: "easeOut" } }}
              clipPath={`url(#pc-area-past-${uid})`}
            />
            {grain && (
              <motion.path
                d={areaPath}
                fill={`url(#pc-area-grain-${uid})`}
                mask={`url(#pc-area-mask-${uid})`}
                clipPath={`url(#pc-area-past-${uid})`}
                style={{ mixBlendMode: "overlay" }}
                initial={false}
                animate={{ d: areaPath, opacity: ready ? 0.5 : 0 }}
                transition={{ d: morph, opacity: reduce ? { duration: 0 } : { duration: 0.7, delay: duration * 0.4, ease: "easeOut" } }}
              />
            )}
            <motion.path
              d={linePath}
              fill="none"
              style={{ stroke: color }}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={false}
              animate={{ d: linePath, pathLength: ready ? 1 : 0, opacity: ready ? (activePoint ? 0.28 : 1) : 0 }}
              transition={{ d: morph, pathLength: reduce ? { duration: 0 } : { duration, ease }, opacity: { duration: activePoint ? 0.15 : 0.01 } }}
            />
            {activePoint && <path d={linePath} fill="none" className="pc-area-chart-line" style={{ stroke: color }} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" clipPath={`url(#pc-area-past-${uid})`} />}
            {last && (
              <motion.g initial={false} animate={{ x: last.x, y: last.y, opacity: ready ? 1 : 0, scale: ready ? 1 : 0 }} transition={{ x: morph, y: morph, scale: reduce ? { duration: 0 } : { ...spring.play, delay: duration * 0.85 }, opacity: { duration: 0.01, delay: reduce ? 0 : duration * 0.85 } }}>
                <circle className="pc-area-chart-ping" r={4} style={{ fill: color }} />
                <circle r={4} style={{ fill: color }} className="stroke-background" strokeWidth={2} />
              </motion.g>
            )}
            <g>
              {xLabels.map((i) => (
                <motion.text
                  key={`${data[i]?.label ?? ""}-${i}`}
                  x={xOf(i)}
                  y={height - 6}
                  textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
                  className="fill-muted-foreground text-[11px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: ready ? 1 : 0 }}
                  transition={reduce ? { duration: 0 } : entered ? { duration: 0.2 } : { duration: 0.4, delay: 0.1 + (i / Math.max(1, n - 1)) * duration * 0.8 }}
                >
                  {data[i]?.label}
                </motion.text>
              ))}
            </g>
            {activePoint && (
              <motion.line x1={padL} x2={padL + plotW} initial={false} animate={{ y1: ay, y2: ay }} transition={snap} className="stroke-foreground/15" strokeWidth={1} strokeDasharray="3 4" />
            )}
            {activePoint && (
              <motion.g initial={false} animate={{ x: ax }} transition={snap}>
                <line x1={0} x2={0} y1={padT} y2={padT + plotH} className="stroke-foreground/40" strokeWidth={1} strokeDasharray="3 4" />
                <motion.circle r={5} style={{ fill: color }} className="stroke-background" strokeWidth={2} initial={false} animate={{ cy: ay }} transition={snap} />
              </motion.g>
            )}
          </svg>
        )}
        {width !== null && n === 0 && <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">{l.noData}</div>}
        {activePoint && (
          <div
            className="pointer-events-none absolute z-10 flex flex-col gap-0.5 rounded-md border bg-popover px-2.5 py-1.5 text-xs whitespace-nowrap text-popover-foreground shadow-[var(--pc-e2)]"
            style={{ left: ax, top: ay, transform: `translate(${tipRight ? "calc(-100% - 12px)" : "12px"}, ${tipBelow ? "10px" : "calc(-100% - 10px)"})` }}
          >
            <span className="text-muted-foreground">{activePoint.label}</span>
            <span className="flex items-center gap-1.5 font-semibold tabular-nums">
              <span className="inline-block h-0.5 w-3 rounded-full" style={{ background: color }} />
              {fmt(activePoint.value)}
            </span>
          </div>
        )}
        <span className="sr-only" aria-live="polite">
          {activePoint ? l.point(activePoint.label, fmt(activePoint.value)) : ""}
        </span>
      </div>
      {n > 0 && (
        <div className="sr-only">
          <table>
          <caption>{summary}</caption>
          <thead>
            <tr>
              <th scope="col">{l.columnLabel}</th>
              <th scope="col">{l.columnValue}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => (
              <tr key={i}>
                <th scope="row">{d.label}</th>
                <td>{fmt(d.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  )
}

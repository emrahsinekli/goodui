"use client"

import * as React from "react"
import { motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import { GooduiTokens, spring as springs } from "@/lib/goodui-motion"

export type WaterfallStep = {
  /** Defaults to the label. */
  key?: string
  label: string
  /** Change from the previous step (ignored for totals). */
  value: number
  /** Draws the running total so far as a full bar from zero. */
  total?: boolean
}

export type WaterfallChartLabels = {
  summary: (name: string, start: string, end: string) => string
  /** Announced for the active step. */
  step: (label: string, change: string | null, runningTotal: string) => string
  runningTotal: string
  columnStep: string
  columnChange: string
  columnTotal: string
  noData: string
}
const DEFAULT_LABELS: WaterfallChartLabels = {
  summary: (name, start, end) => `${name ? name + ": " : ""}from ${start} to ${end}`,
  step: (label, change, total) => `${label}: ${change ? `${change}, ` : ""}total ${total}`,
  runningTotal: "Running total",
  columnStep: "Step",
  columnChange: "Change",
  columnTotal: "Running total",
  noData: "No data",
}

export type WaterfallChartProps = Omit<React.ComponentProps<"div">, "title"> & {
  steps: WaterfallStep[]
  /** Running total before the first step, e.g. an opening balance that a leading total step then draws. */
  start?: number
  /** Chart name for screen readers and the table caption. */
  title?: React.ReactNode
  /** Plot height in px, axes included. */
  height?: number
  /** Maximum bar thickness in px. */
  barSize?: number
  radius?: number
  /** Hairlines joining each bar's end to the next bar's start. */
  connectors?: boolean
  /** Signed change above each bar (the total on total bars). */
  valueLabels?: boolean
  /** Colors for increases, decreases and totals. Default to the kit's success, danger and neutral tones. */
  colors?: { positive?: string; negative?: string; total?: string }
  grid?: boolean
  axis?: boolean
  axisWidth?: number
  format?: Intl.NumberFormatOptions
  locale?: string
  formatValue?: (value: number) => string
  formatTick?: (value: number) => string
  /** Seconds a bar takes to grow; bars run one after another at 80 ms. */
  duration?: number
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<WaterfallChartLabels>
}

const CSS = `
.pc-waterfall-chart{--pc-wf-pos:oklch(0.53 0.13 155);--pc-wf-neg:oklch(0.56 0.21 27);--pc-wf-total:color-mix(in oklab,var(--foreground) 72%,transparent)}
.dark .pc-waterfall-chart{--pc-wf-pos:oklch(0.7 0.16 155);--pc-wf-neg:oklch(0.68 0.2 25)}
`

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

function rrect(x: number, y: number, w: number, h: number, tl: number, tr: number, br: number, bl: number) {
  const m = Math.max(0, Math.min(w / 2, h / 2))
  const a = Math.min(tl, m)
  const b = Math.min(tr, m)
  const c = Math.min(br, m)
  const d = Math.min(bl, m)
  const f = (v: number) => v.toFixed(1)
  return `M${f(x + a)},${f(y)}H${f(x + w - b)}Q${f(x + w)},${f(y)} ${f(x + w)},${f(y + b)}V${f(y + h - c)}Q${f(x + w)},${f(y + h)} ${f(x + w - c)},${f(y + h)}H${f(x + d)}Q${f(x)},${f(y + h)} ${f(x)},${f(y + h - d)}V${f(y + a)}Q${f(x)},${f(y)} ${f(x + a)},${f(y)}Z`
}

/** Waterfall of running totals: floating bars step up in green and down in red one after another, totals anchor to zero, connectors join the steps. */
export function WaterfallChart({
  steps,
  start = 0,
  title,
  height = 240,
  barSize = 28,
  radius = 4,
  connectors = true,
  valueLabels = true,
  colors,
  grid = true,
  axis = true,
  axisWidth = 44,
  format,
  locale = "en-US",
  formatValue,
  formatTick,
  duration = 0.5,
  labels,
  className,
  "aria-label": ariaLabel,
  ...props
}: WaterfallChartProps) {
  const l = useLabels("waterfall-chart", DEFAULT_LABELS, labels)
  const reduce = useReduce()
  const rootRef = React.useRef<HTMLDivElement>(null)
  const plotRef = React.useRef<HTMLDivElement>(null)
  const inView = useInView(rootRef)
  const width = useWidth(plotRef)
  const [active, setActive] = React.useState<number | null>(null)
  const fmt = React.useMemo(() => formatValue ?? ((v: number) => new Intl.NumberFormat(locale, format).format(v)), [formatValue, locale, format])
  const signed = React.useMemo(() => new Intl.NumberFormat(locale, { ...format, signDisplay: "exceptZero" }), [locale, format])

  // Running totals: each step floats from the previous total; total steps draw the running total from zero.
  let run = start
  const items = steps.map((s, i) => {
    const key = s.key ?? s.label
    if (s.total) return { ...s, key, index: i, from: 0, to: run, change: null as number | null, total: true, running: run }
    const from = run
    run += s.value
    return { ...s, key, index: i, from, to: run, change: s.value, total: false, running: run }
  })
  const n = items.length
  const all = items.flatMap((s) => [s.from, s.to])
  const lo0 = Math.min(0, ...(all.length ? all : [0]))
  const hi0 = Math.max(0, ...(all.length ? all : [0]))
  const ticks = niceTicks(lo0, hi0, 4)
  const lo = ticks[0] ?? 0
  const hi = ticks[ticks.length - 1] ?? 1
  const tick = React.useMemo(() => {
    if (formatTick) return formatTick
    const compact = Math.max(Math.abs(hi), Math.abs(lo)) >= 10000
    const f = new Intl.NumberFormat(locale, compact ? { ...format, notation: "compact", maximumFractionDigits: Math.max(1, format?.minimumFractionDigits ?? 0) } : format)
    return (v: number) => f.format(v)
  }, [formatTick, locale, format, hi, lo])

  const W = width ?? 0
  const padL = axis ? axisWidth : 6
  const padR = 10
  const padT = valueLabels ? 22 : 12
  const padB = 24
  const plotW = Math.max(10, W - padL - padR)
  const plotH = Math.max(10, height - padT - padB)
  const vy = (v: number) => padT + (1 - (v - lo) / (hi - lo || 1)) * plotH
  const slot = plotW / Math.max(1, n)
  const thick = Math.min(barSize, slot * 0.72)
  const xOf = (i: number) => padL + i * slot + (slot - thick) / 2
  const colorOf = (s: (typeof items)[number]) => (s.total ? (colors?.total ?? "var(--pc-wf-total)") : (s.change ?? 0) >= 0 ? (colors?.positive ?? "var(--pc-wf-pos)") : (colors?.negative ?? "var(--pc-wf-neg)"))

  const bars = items.map((s, i) => {
    const yTop = vy(Math.max(s.from, s.to))
    const yBot = vy(Math.min(s.from, s.to))
    const up = s.to >= s.from
    const x = xOf(i)
    const h = Math.max(0, yBot - yTop)
    const r = radius
    return { ...s, x, yTop, yBot, h, color: colorOf(s), from: s.from, to: s.to, fromPath: rrect(x, vy(s.from), thick, 0, 0, 0, 0, 0), toPath: s.total ? rrect(x, yTop, thick, h, r, r, 0, 0) : up ? rrect(x, yTop, thick, h, r, r, 0, 0) : rrect(x, yTop, thick, h, 0, 0, r, r), up }
  })

  // Dense charts keep the value labels on the totals only, and thin the step labels so neighbours never touch.
  const denseValues = slot < 54
  const labelStep = Math.max(1, Math.ceil(64 / Math.max(1, slot)))
  const showStepLabel = (i: number) => i === n - 1 || (i % labelStep === 0 && (n - 1 - i) * slot >= 56)
  const name = typeof title === "string" ? title : ""
  const first = items[0]
  const last = items[n - 1]
  const summary = ariaLabel ?? (n && first && last ? l.summary(name, fmt(first.from), fmt(last.to)) : l.noData)
  const act = active !== null ? bars[active] : undefined
  const announce = act ? l.step(act.label, act.change === null ? null : signed.format(act.change), fmt(act.running)) : ""

  const indexAt = (clientX: number) => {
    const rect = plotRef.current?.getBoundingClientRect()
    if (!rect || n === 0) return null
    return Math.min(n - 1, Math.max(0, Math.floor((clientX - rect.left - padL) / slot)))
  }
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (n === 0) return
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault()
      const dir = e.key === "ArrowLeft" ? -1 : 1
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
  const delayOf = (i: number) => (reduce ? 0 : i * 0.08)
  const tipX = act ? act.x + thick / 2 : 0
  const tipRight = tipX > W * 0.55

  return (
    <div ref={rootRef} className={cn("pc-waterfall-chart flex w-full min-w-0 flex-col gap-2", className)} {...props}>
      <GooduiTokens />
      <style href="pc-waterfall-chart" precedence="default">
        {CSS}
      </style>
      <div
        ref={plotRef}
        role="group"
        aria-roledescription="waterfall chart"
        aria-label={summary}
        tabIndex={0}
        onPointerMove={(e) => setActive(indexAt(e.clientX))}
        onPointerLeave={() => setActive(null)}
        onFocus={() => setActive((i) => i ?? (n ? 0 : null))}
        onBlur={() => setActive(null)}
        onKeyDown={onKeyDown}
        className="relative w-full touch-pan-y rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        style={{ height }}
      >
        {width !== null && n > 0 && (
          <svg width={W} height={height} viewBox={`0 0 ${W} ${height}`} className="absolute inset-0 overflow-visible" aria-hidden="true">
            {active !== null && <rect x={padL + active * slot} y={padT - 4} width={slot} height={plotH + 8} rx={6} className="fill-foreground" style={{ opacity: 0.045 }} />}
            {ticks.map((t) => (
              <g key={t}>
                {grid && <line x1={padL} x2={padL + plotW} y1={vy(t)} y2={vy(t)} className={cn(t === 0 ? "stroke-foreground/30" : "stroke-border")} strokeWidth={1} />}
                {axis && (
                  <text x={padL - 8} y={vy(t)} dy=".35em" textAnchor="end" className="fill-muted-foreground text-[11px] tabular-nums">
                    {tick(t)}
                  </text>
                )}
              </g>
            ))}
            {bars.map((b, i) => (
              <g key={b.key}>
                <motion.path
                  d={ready ? b.toPath : b.fromPath}
                  style={{ fill: b.color }}
                  initial={false}
                  animate={{ d: ready ? b.toPath : b.fromPath, opacity: !ready ? 0 : active !== null && active !== i ? 0.7 : 1 }}
                  transition={{ d: reduce ? { duration: 0 } : { ...spring, delay: delayOf(i) }, opacity: { duration: reduce ? 0 : 0.2 } }}
                />
                {connectors && i < n - 1 && (
                  <motion.line
                    x1={b.x + thick}
                    x2={xOf(i + 1)}
                    y1={vy(b.to)}
                    y2={vy(b.to)}
                    className="stroke-foreground/30"
                    strokeWidth={1}
                    initial={false}
                    animate={{ pathLength: ready ? 1 : 0, opacity: ready ? 1 : 0 }}
                    transition={reduce ? { duration: 0 } : { duration: 0.25, delay: delayOf(i) + duration * 0.6 }}
                  />
                )}
                {valueLabels && (!denseValues || b.total) && (
                  <motion.text
                    x={b.x + thick / 2}
                    y={b.up || b.total ? b.yTop - 6 : b.yBot + 13}
                    textAnchor="middle"
                    className={cn("text-[11px] font-medium tabular-nums", b.total ? "fill-foreground" : "fill-muted-foreground")}
                    initial={false}
                    animate={{ opacity: ready ? 1 : 0 }}
                    transition={reduce ? { duration: 0 } : { duration: 0.3, delay: delayOf(i) + duration * 0.5 }}
                  >
                    {b.total ? fmt(b.to) : signed.format(b.change ?? 0)}
                  </motion.text>
                )}
              </g>
            ))}
            {axis &&
              items.map((s, i) =>
                showStepLabel(i) ? (
                  <text key={s.key} x={xOf(i) + thick / 2} y={height - 6} textAnchor="middle" className={cn("text-[11px]", s.total ? "fill-foreground font-medium" : "fill-muted-foreground")}>
                    {s.label}
                  </text>
                ) : null,
              )}
          </svg>
        )}
        {width !== null && n === 0 && <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">{l.noData}</div>}
        {act && (
          <div
            className="pointer-events-none absolute z-10 flex min-w-32 flex-col gap-0.5 rounded-md border bg-popover px-2.5 py-1.5 text-xs whitespace-nowrap text-popover-foreground shadow-[var(--pc-e2)]"
            style={{ left: tipX, top: padT, transform: `translateX(${tipRight ? "calc(-100% - 12px)" : "12px"})` }}
          >
            <span className="text-muted-foreground">{act.label}</span>
            {act.change !== null && (
              <span className="flex items-center gap-1.5 font-semibold tabular-nums">
                <span className="inline-block size-2 rounded-[2px]" style={{ background: act.color }} />
                {signed.format(act.change)}
              </span>
            )}
            <span className="flex items-center justify-between gap-3 tabular-nums">
              <span className="text-muted-foreground">{l.runningTotal}</span>
              <span className="font-semibold">{fmt(act.running)}</span>
            </span>
          </div>
        )}
        <span className="sr-only" aria-live="polite">
          {announce}
        </span>
      </div>
      {n > 0 && (
        <div className="sr-only">
          <table>
          <caption>{summary}</caption>
          <thead>
            <tr>
              <th scope="col">{l.columnStep}</th>
              <th scope="col">{l.columnChange}</th>
              <th scope="col">{l.columnTotal}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr key={s.key}>
                <th scope="row">{s.label}</th>
                <td>{s.change === null ? "" : signed.format(s.change)}</td>
                <td>{fmt(s.running)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  )
}

"use client"

import * as React from "react"
import { motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { useGooduiLocale, useLabels } from "@/lib/goodui-locale"
import { GooduiTokens, spring, ease as easing } from "@/lib/goodui-motion"

const CSS = `
@keyframes pc-sparkline-draw-ping { 0% { transform: scale(1); opacity: .5 } 80%, 100% { transform: scale(2.6); opacity: 0 } }
.pc-sparkline-draw-ping { transform-box: fill-box; transform-origin: center; animation: pc-sparkline-draw-ping 2s var(--pc-ease-out) infinite; }
@media (prefers-reduced-motion: reduce) { .pc-sparkline-draw-ping { animation: none; opacity: 0 } }
`

type Point = [number, number]

/** Monotone cubic interpolation (Fritsch–Carlson): smooth, but never overshoots above a peak or below a dip. */
function smoothPath(p: Point[]) {
  const n = p.length
  if (n === 0) return ""
  if (n < 3) return p.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join("")
  // Every index below stays within 0..n-1 (n >= 3), so the non-null assertions are safe.
  const m: number[] = []
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = p[i]!
    const [x1, y1] = p[i + 1]!
    m.push((y1 - y0) / (x1 - x0 || 1))
  }
  const t: number[] = [m[0]!]
  for (let i = 1; i < n - 1; i++) {
    const m0 = m[i - 1]!
    const m1 = m[i]!
    t.push(m0 * m1 <= 0 ? 0 : (m0 + m1) / 2)
  }
  t.push(m[n - 2]!)
  for (let i = 0; i < n - 1; i++) {
    const mi = m[i]!
    if (mi === 0) {
      t[i] = 0
      t[i + 1] = 0
      continue
    }
    const a = t[i]! / mi
    const b = t[i + 1]! / mi
    const s = a * a + b * b
    if (s > 9) {
      const k = 3 / Math.sqrt(s)
      t[i] = k * a * mi
      t[i + 1] = k * b * mi
    }
  }
  const [sx, sy] = p[0]!
  let d = `M${sx},${sy}`
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = p[i]!
    const [x1, y1] = p[i + 1]!
    const dx = (x1 - x0) / 3
    d += `C${x0 + dx},${y0 + t[i]! * dx},${x1 - dx},${y1 - t[i + 1]! * dx},${x1},${y1}`
  }
  return d
}


export type SparklineDrawLabels = {
  point: (n: number) => string
  summary: (first: string, last: string, low: string, high: string) => string
  noData: string
}
const DEFAULT_LABELS: SparklineDrawLabels = {
  point: (n) => `Point ${n}`,
  summary: (first, last, low, high) => `Trend from ${first} to ${last}, low ${low}, high ${high}`,
  noData: "No data",
}

export type SparklineDrawProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** Values in order, oldest first. The line scales between their min and max; changed values redraw the line. */
  data: number[]
  /** One label per point, shown in the tooltip (e.g. dates). */
  pointLabels?: string[]
  /** Height in px. The width follows the container. */
  height?: number
  /** Line thickness in px; the end dot and padding grow with it. */
  strokeWidth?: number
  /** Any CSS color. Defaults to the theme's first chart color. */
  color?: string
  /** Gradient fill under the line. */
  area?: boolean
  /** smooth: monotone curve that never overshoots the data. linear: straight segments. */
  curve?: "smooth" | "linear"
  /** Show the hovered point's value. Arrow keys move it when focused. */
  tooltip?: boolean
  /** Pulsing dot on the latest point. */
  endDot?: boolean
  /** Seconds the line takes to draw. */
  duration?: number
  /** Formats values for the tooltip and screen readers. index is -1 for the low and high in the summary. */
  formatValue?: (value: number, index: number) => string
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<SparklineDrawLabels>
}

/** Sparkline that draws itself in, fades in a gradient area and shows point values on hover. Redraws when data changes. */
export function SparklineDraw({
  data,
  pointLabels,
  labels,
  height = 48,
  strokeWidth = 2,
  color = "var(--chart-1)",
  area = true,
  curve = "smooth",
  tooltip = true,
  endDot = true,
  duration = 0.9,
  formatValue: formatValueProp,
  className,
  style,
  "aria-label": ariaLabel,
  ...props
}: SparklineDrawProps) {
  const l = useLabels("sparkline-draw", DEFAULT_LABELS, labels)
  const { lang } = useGooduiLocale()
  const formatValue = React.useMemo<(value: number, index: number) => string>(() => {
    if (formatValueProp) return formatValueProp
    const nf = new Intl.NumberFormat(lang, { maximumFractionDigits: 2 })
    return (v: number) => nf.format(v)
  }, [formatValueProp, lang])
  const reduce = useReducedMotion() ?? false
  const ref = React.useRef<HTMLDivElement>(null)
  const [width, setWidth] = React.useState(240)
  const [active, setActive] = React.useState<number | null>(null)
  const gradientId = `pc-spark-${React.useId().replace(/[^a-zA-Z0-9_-]/g, "")}`

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.max(40, Math.round(entry.contentRect.width)))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const padX = endDot || tooltip ? strokeWidth + 4 : strokeWidth
  const padY = strokeWidth + 4
  const min = data.length ? Math.min(...data) : 0
  const max = data.length ? Math.max(...data) : 0
  const range = max - min || 1
  const step = data.length > 1 ? (width - padX * 2) / (data.length - 1) : 0
  const points: Point[] = data.map((v, i) => [
    padX + i * step,
    max === min ? height / 2 : padY + (1 - (v - min) / range) * (height - padY * 2),
  ])
  const line = curve === "smooth" ? smoothPath(points) : points.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join("")
  const fill = points.length > 1 ? `${line}L${points[points.length - 1]![0]},${height}L${points[0]![0]},${height}Z` : ""
  // A new data set remounts the paths so they draw in again; a resize only reshapes them.
  const signature = data.join(",")
  const last = points[points.length - 1]
  const activePoint = active !== null ? points[active] : undefined
  const summary =
    ariaLabel ??
    (data.length ? l.summary(formatValue(data[0]!, 0), formatValue(data[data.length - 1]!, data.length - 1), formatValue(min, -1), formatValue(max, -1)) : l.noData)

  const indexAt = (clientX: number) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect || data.length === 0) return null
    if (data.length === 1) return 0
    return Math.min(data.length - 1, Math.max(0, Math.round((clientX - rect.left - padX) / step)))
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!tooltip || data.length === 0) return
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault()
      setActive((i) => {
        const cur = i ?? data.length - 1
        return Math.min(data.length - 1, Math.max(0, cur + (e.key === "ArrowLeft" ? -1 : 1)))
      })
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault()
      setActive(e.key === "Home" ? 0 : data.length - 1)
    } else if (e.key === "Escape") setActive(null)
  }

  const snap = reduce ? { duration: 0 } : spring.snap
  const tipAlign = activePoint ? (activePoint[0] < 48 ? "0%" : activePoint[0] > width - 48 ? "-100%" : "-50%") : "-50%"

  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="sparkline"
      aria-label={summary}
      tabIndex={tooltip ? 0 : undefined}
      onPointerMove={tooltip ? (e) => setActive(indexAt(e.clientX)) : undefined}
      onPointerLeave={tooltip ? () => setActive(null) : undefined}
      onFocus={tooltip ? () => setActive((i) => i ?? data.length - 1) : undefined}
      onBlur={tooltip ? () => setActive(null) : undefined}
      onKeyDown={onKeyDown}
      className={cn("relative w-full touch-pan-y rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50", className)}
      style={{ height, ...style }}
      {...props}
    >
      <GooduiTokens />
      <style href="pc-sparkline-draw" precedence="default">
        {CSS}
      </style>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 overflow-visible" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.28 }} />
            <stop offset="100%" style={{ stopColor: color, stopOpacity: 0 }} />
          </linearGradient>
        </defs>
        {area && fill && (
          <motion.path
            key={`a${signature}`}
            d={fill}
            fill={`url(#${gradientId})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={reduce ? { duration: 0 } : { duration: 0.6, delay: duration * 0.45, ease: "easeOut" }}
          />
        )}
        {line && (
          <motion.path
            key={`l${signature}`}
            d={line}
            fill="none"
            style={{ stroke: color }}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: reduce ? 1 : 0 }}
            animate={{ pathLength: 1 }}
            transition={reduce ? { duration: 0 } : { duration, ease: easing.inOut }}
          />
        )}
        {endDot && last && (
          <motion.g
            key={`d${signature}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={reduce ? { duration: 0 } : { duration: 0.2, delay: duration * 0.9 }}
          >
            <circle className="pc-sparkline-draw-ping" cx={last[0]} cy={last[1]} r={strokeWidth + 1.5} style={{ fill: color }} />
            <circle cx={last[0]} cy={last[1]} r={strokeWidth + 1.5} style={{ fill: color }} className="stroke-background" strokeWidth={2} />
          </motion.g>
        )}
        {activePoint && (
          <g>
            <motion.line
              x1={0}
              x2={0}
              y1={0}
              y2={height}
              className="stroke-border"
              strokeDasharray="3 3"
              initial={false}
              animate={{ x: activePoint[0] }}
              transition={snap}
            />
            <motion.circle
              r={strokeWidth + 2}
              style={{ fill: color }}
              className="stroke-background"
              strokeWidth={2}
              initial={false}
              animate={{ cx: activePoint[0], cy: activePoint[1] }}
              transition={snap}
            />
          </g>
        )}
      </svg>
      {tooltip && activePoint && active !== null && (
        <div
          className="pointer-events-none absolute z-10 rounded-md border bg-popover px-2 py-1 text-xs whitespace-nowrap text-popover-foreground shadow-[var(--pc-e2)]"
          style={{ left: activePoint[0], top: Math.min(activePoint[1], height) - 10, transform: `translate(${tipAlign}, -100%)` }}
        >
          {pointLabels?.[active] && <span className="me-1.5 text-muted-foreground">{pointLabels[active]}</span>}
          <span className="font-medium tabular-nums">{formatValue(data[active]!, active)}</span>
        </div>
      )}
      <span className="sr-only" aria-live="polite">
        {active !== null && data[active] !== undefined ? `${pointLabels?.[active] ?? l.point(active + 1)}: ${formatValue(data[active], active)}` : ""}
      </span>
    </div>
  )
}

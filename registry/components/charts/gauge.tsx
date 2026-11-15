"use client"

import * as React from "react"
import { useMotionValueEvent, useReducedMotion, useSpring } from "motion/react"
import { cn } from "@/lib/utils"
import { NumberFlow } from "@/registry/components/numbers/number-flow"
import { useLabels } from "@/lib/goodui-locale"

export type GaugeTone = "primary" | "neutral" | "success" | "warning" | "danger" | "info"

export type GaugeBand = {
  from: number
  to: number
  /** Core tone of the band. */
  tone?: GaugeTone
  /** Any CSS color, overrides the tone. */
  color?: string
  /** Shown as a pill under the value while the needle is in this band. */
  label?: string
}

export type GaugeLabels = {
  /** Accessible name when `label` is not a string. */
  name: string
  /** aria-valuetext and the live announcement. */
  valueText: (value: string, band: string | null) => string
}
const DEFAULT_LABELS: GaugeLabels = {
  name: "Gauge",
  valueText: (value, band) => (band ? `${value}, ${band}` : value),
}

export type GaugeProps = Omit<React.ComponentProps<"div">, "children"> & {
  value: number
  min?: number
  max?: number
  /** Colored ranges along the arc, e.g. healthy / watch / critical. Drawn with 2px gaps. */
  bands?: GaugeBand[]
  /** needle: a needle springs to the value over the bands. arc: the arc fills to the value in the band's color. */
  variant?: "needle" | "arc"
  /** Width in px; the gauge is half as tall plus the readout. */
  size?: number
  /** Arc thickness in px. */
  thickness?: number
  /** Metric name under the value; also the accessible name when it is a string. */
  label?: React.ReactNode
  /** Color of the needle (needle) or of the arc when no band covers the value (arc). */
  color?: string
  /** Min and max printed under the arc ends. */
  showRange?: boolean
  /** Intl.NumberFormat options for the value, e.g. { style: "percent" } with values 0..1. */
  format?: Intl.NumberFormatOptions
  locale?: string
  formatValue?: (value: number) => string
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<GaugeLabels>
}

const CSS = `
.pc-gauge{--pc-gauge-primary:var(--primary);--pc-gauge-neutral:color-mix(in oklab,var(--foreground) 55%,transparent);--pc-gauge-success:oklch(0.53 0.13 155);--pc-gauge-warning:oklch(0.75 0.16 70);--pc-gauge-danger:oklch(0.56 0.21 27);--pc-gauge-info:oklch(0.55 0.17 250)}
.dark .pc-gauge{--pc-gauge-success:oklch(0.7 0.16 155);--pc-gauge-danger:oklch(0.68 0.2 25);--pc-gauge-info:oklch(0.7 0.15 245)}
.pc-gauge-needle{transition:none}
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

const polar = (cx: number, cy: number, r: number, deg: number) => ({ x: cx + r * Math.cos((deg * Math.PI) / 180), y: cy + r * Math.sin((deg * Math.PI) / 180) })
// Arc along the top half, from 180° (start side) clockwise to 360° (end side).
function arcPath(cx: number, cy: number, r: number, a0: number, a1: number) {
  const p0 = polar(cx, cy, r, a0)
  const p1 = polar(cx, cy, r, a1)
  return `M${p0.x.toFixed(2)},${p0.y.toFixed(2)}A${r},${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${p1.x.toFixed(2)},${p1.y.toFixed(2)}`
}

/** Semi-circular gauge with tone bands, a needle that springs (and overshoots a little) to the value, and a rolling readout. */
export function Gauge({
  value,
  min = 0,
  max = 100,
  bands = [],
  variant = "needle",
  size = 240,
  thickness = 14,
  label,
  color,
  showRange = true,
  format,
  locale = "en-US",
  formatValue,
  labels,
  className,
  "aria-label": ariaLabel,
  ...props
}: GaugeProps) {
  const l = useLabels("gauge", DEFAULT_LABELS, labels)
  const reduce = useReduce()
  const rootRef = React.useRef<HTMLDivElement>(null)
  const inView = useInView(rootRef)
  const fmt = React.useMemo(() => formatValue ?? ((v: number) => new Intl.NumberFormat(locale, format).format(v)), [formatValue, locale, format])

  const span = max - min || 1
  const ratio = Math.min(1, Math.max(0, (value - min) / span))
  const targetDeg = -90 + ratio * 180
  // The needle angle lives in a spring; React only re-renders with the rounded value.
  const spring = useSpring(-90, { stiffness: 70, damping: 11, mass: 0.9 })
  const [deg, setDeg] = React.useState(-90)
  useMotionValueEvent(spring, "change", (v) => setDeg(v))
  React.useEffect(() => {
    if (!inView && !reduce) return
    if (reduce) spring.jump(targetDeg)
    else spring.set(targetDeg)
  }, [inView, reduce, targetDeg, spring])
  const ready = inView || reduce

  const pad = 6
  const r = (size - thickness) / 2 - pad
  const cx = size / 2
  const cy = r + thickness / 2 + pad
  const height = cy + (showRange ? 22 : 8)
  const gapDeg = (2 / r) * (180 / Math.PI)
  const angleOf = (v: number) => 180 + (Math.min(1, Math.max(0, (v - min) / span)) * 180)
  const toneColor = (b: GaugeBand) => b.color ?? `var(--pc-gauge-${b.tone ?? "primary"})`
  const current = bands.find((b) => value >= b.from && value <= b.to) ?? bands.find((b) => value >= b.from && value < b.to)
  const arcColor = color ?? (current ? toneColor(current) : "var(--chart-1)")
  const name = typeof label === "string" ? label : l.name
  const valueText = l.valueText(fmt(value), current?.label ?? null)
  const shownRatio = ready ? ratio : 0
  const fillLength = Math.max(0.0001, (reduce ? ratio : (deg + 90) / 180))
  // Arc variant: bands become a thin ring at the rim and the value arc sits inside it with a 4px gap.
  const bandW = Math.max(3, thickness * 0.3)
  const arcR = variant === "arc" && bands.length > 0 ? r - bandW / 2 - 4 - thickness / 2 : r

  return (
    <div
      ref={rootRef}
      role="meter"
      aria-label={ariaLabel ?? name}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuetext={valueText}
      className={cn("pc-gauge inline-flex flex-col items-center", className)}
      style={{ width: size }}
      {...props}
    >
      <style href="pc-gauge" precedence="default">
        {CSS}
      </style>
      <svg width={size} height={height} viewBox={`0 0 ${size} ${height}`} className="overflow-visible" aria-hidden="true">
        {bands.length === 0 && <path d={arcPath(cx, cy, r, 180, 360)} fill="none" strokeWidth={thickness} strokeLinecap="butt" className="stroke-muted" />}
        {bands.map((b, i) => {
          const a0 = angleOf(b.from) + (i === 0 ? 0 : gapDeg / 2)
          const a1 = angleOf(b.to) - (i === bands.length - 1 ? 0 : gapDeg / 2)
          if (a1 <= a0) return null
          const isCurrent = current === b
          return <path key={i} d={arcPath(cx, cy, r, a0, a1)} fill="none" strokeWidth={variant === "arc" ? bandW : thickness} style={{ stroke: toneColor(b), opacity: variant === "needle" ? (isCurrent ? 1 : 0.4) : 0.9 }} strokeLinecap="butt" />
        })}
        {variant === "arc" && (
          <>
            {bands.length > 0 && <path d={arcPath(cx, cy, arcR, 180, 360)} fill="none" strokeWidth={thickness} strokeLinecap="round" className="stroke-muted" />}
            <path
              d={arcPath(cx, cy, arcR, 180, 360)}
              fill="none"
              strokeWidth={thickness}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={`${fillLength} 1`}
              style={{ stroke: arcColor, transition: reduce ? "none" : undefined }}
            />
          </>
        )}
        {variant === "needle" && (
          <g transform={`rotate(${deg} ${cx} ${cy})`} className="pc-gauge-needle">
            <path d={`M${cx - 3.5},${cy} L${cx},${cy - r + thickness / 2 + 4} L${cx + 3.5},${cy} Z`} style={{ fill: color ?? "var(--foreground)" }} strokeLinejoin="round" />
            <circle cx={cx} cy={cy} r={6} style={{ fill: color ?? "var(--foreground)" }} />
            <circle cx={cx} cy={cy} r={2.5} className="fill-background" />
          </g>
        )}
        {showRange && (
          <>
            <text x={cx - r} y={cy + 16} textAnchor="middle" className="fill-muted-foreground text-[10px] tabular-nums">
              {fmt(min)}
            </text>
            <text x={cx + r} y={cy + 16} textAnchor="middle" className="fill-muted-foreground text-[10px] tabular-nums">
              {fmt(max)}
            </text>
          </>
        )}
      </svg>
      <div className="-mt-1 flex flex-col items-center gap-1 text-center" aria-hidden="true">
        <NumberFlow value={ready ? value : min} format={format} locale={locale} className="text-3xl leading-none font-semibold tracking-tight" />
        {label !== undefined && <span className="text-xs text-muted-foreground">{label}</span>}
        {current?.label && (
          <span className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium" style={{ opacity: shownRatio > 0 || reduce ? 1 : 0, transition: "opacity .3s" }}>
            <span className="size-1.5 rounded-full" style={{ background: toneColor(current) }} />
            {current.label}
          </span>
        )}
      </div>
      <span className="sr-only" aria-live="polite">
        {valueText}
      </span>
    </div>
  )
}

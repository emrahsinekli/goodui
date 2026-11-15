"use client"

import * as React from "react"
import { useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { NumberFlow } from "@/registry/components/numbers/number-flow"
import { SparklineDraw } from "@/registry/components/numbers/sparkline-draw"
import { useLabels } from "@/lib/goodui-locale"
import { GooduiTokens } from "@/lib/goodui-motion"

/*
 * KPI tile family: headline number (NumberFlow rolls it in on view and on every change), a delta badge that
 * pulses when the change changes, and a SparklineDraw that redraws when the data changes. KpiTrendGroup lines
 * tiles up with hairline dividers.
 */

export type KpiTrendLabels = { increase: string; decrease: string; noChange: string }
const DEFAULT_LABELS: KpiTrendLabels = { increase: "increase", decrease: "decrease", noChange: "no change" }

export type KpiTrendSize = "sm" | "md" | "lg"

export type KpiTrendProps = Omit<React.ComponentProps<"div">, "prefix"> & {
  /** Metric name above the value. */
  label: React.ReactNode
  value: number
  /** Intl.NumberFormat options, e.g. { style: "currency", currency: "USD", maximumFractionDigits: 0 }. */
  format?: Intl.NumberFormatOptions
  locale?: string
  /** Text before the number. */
  prefix?: string
  /** Text after the number, e.g. "%". */
  suffix?: string
  /** Change vs the previous period, e.g. 12.4 for +12.4%. */
  delta?: number
  /** Unit after the delta number. */
  deltaSuffix?: string
  /** Decimals of the delta. */
  deltaDecimals?: number
  /** A drop is good news (no-shows, churn, wait time). */
  invertDelta?: boolean
  /** Muted text after the delta, e.g. "vs last week". */
  deltaLabel?: React.ReactNode
  /** Sparkline values, oldest first. */
  data?: number[]
  /** One label per sparkline point, shown in its tooltip. */
  pointLabels?: string[]
  /** Sparkline color. Defaults to the theme's first chart color. */
  color?: string
  /** stack: sparkline under the number. row: sparkline on the end side. */
  layout?: "stack" | "row"
  size?: KpiTrendSize
  /** Hover lift for tiles that link somewhere. */
  interactive?: boolean
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<KpiTrendLabels>
}

const CSS = `
.pc-kpi-trend{background:var(--card);color:var(--card-foreground)}
.pc-kpi-trend[data-interactive]{transition:transform .2s var(--pc-ease-out),border-color .2s;cursor:pointer}
.pc-kpi-trend[data-interactive]:hover{transform:translateY(-2px);border-color:color-mix(in oklab,var(--foreground) 22%,var(--border))}
.pc-kpi-trend-delta{--pc-d:var(--muted-foreground);color:color-mix(in oklab,var(--pc-d) 72%,var(--foreground));background:color-mix(in oklab,var(--pc-d) 13%,transparent)}
.pc-kpi-trend-delta[data-trend=good]{--pc-d:oklch(0.53 0.13 155)}
.pc-kpi-trend-delta[data-trend=bad]{--pc-d:oklch(0.56 0.21 27)}
.dark .pc-kpi-trend-delta[data-trend=good]{--pc-d:oklch(0.72 0.16 155)}
.dark .pc-kpi-trend-delta[data-trend=bad]{--pc-d:oklch(0.7 0.19 25)}
.pc-kpi-trend-delta[data-pulse]{animation:pc-kpi-trend-pulse .6s ease-out}
@keyframes pc-kpi-trend-pulse{0%{box-shadow:0 0 0 0 color-mix(in oklab,var(--pc-d) 45%,transparent)}100%{box-shadow:0 0 0 8px transparent}}
.pc-kpi-trend[data-inview=false] .pc-kpi-trend-delta{opacity:0;transform:scale(.7)}
.pc-kpi-trend[data-inview=true] .pc-kpi-trend-delta{animation:pc-kpi-trend-pop .45s var(--pc-ease-spring) both}
@keyframes pc-kpi-trend-pop{from{opacity:0;transform:scale(.7)}to{opacity:1;transform:none}}
.pc-kpi-trend-group{display:grid;gap:1px;background:var(--border);border:1px solid var(--border);border-radius:.75rem;overflow:hidden}
.pc-kpi-trend-group>.pc-kpi-trend{border:0;border-radius:0}
@media (prefers-reduced-motion:reduce){.pc-kpi-trend,.pc-kpi-trend-delta{animation:none!important;transition:none!important;opacity:1!important;transform:none!important}}
`

function useReduce() {
  const prefers = useReducedMotion()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  return mounted && !!prefers
}

function useInView(ref: React.RefObject<Element | null>, threshold = 0.3) {
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

const SIZE: Record<KpiTrendSize, { pad: string; value: string; label: string; chart: number; gap: string }> = {
  sm: { pad: "p-3.5", value: "text-xl", label: "text-xs", chart: 32, gap: "gap-2" },
  md: { pad: "p-5", value: "text-3xl", label: "text-sm", chart: 44, gap: "gap-3" },
  lg: { pad: "p-6", value: "text-4xl", label: "text-sm", chart: 56, gap: "gap-3.5" },
}

function Arrow({ dir }: { dir: number }) {
  return (
    <svg viewBox="0 0 12 12" className={cn("size-3", dir < 0 && "rotate-180")} fill="none" aria-hidden="true">
      <path d="M6 9.5v-7M3 5l3-3 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** KPI tile: the number rolls in on view and on every change, the delta badge pops and pulses, and the sparkline draws itself. */
export function KpiTrend({
  label,
  value,
  format,
  locale = "en-US",
  prefix = "",
  suffix = "",
  delta,
  deltaSuffix = "%",
  deltaDecimals = 1,
  invertDelta,
  deltaLabel,
  data,
  pointLabels,
  color = "var(--chart-1)",
  layout = "stack",
  size = "md",
  interactive,
  labels,
  className,
  ...props
}: KpiTrendProps) {
  const l = useLabels("kpi-trend", DEFAULT_LABELS, labels)
  const reduce = useReduce()
  const ref = React.useRef<HTMLDivElement>(null)
  const inView = useInView(ref)
  const ready = inView || reduce
  const s = SIZE[size]
  const formatter = React.useMemo(() => new Intl.NumberFormat(locale, format), [locale, format])
  const finalText = `${prefix}${formatter.format(value)}${suffix}`
  const d = delta === undefined ? null : Number(delta.toFixed(deltaDecimals))
  const dir = d === null ? 0 : d > 0 ? 1 : d < 0 ? -1 : 0
  const trend = dir === 0 ? "flat" : (dir > 0) !== !!invertDelta ? "good" : "bad"
  const deltaText = d === null ? "" : `${Math.abs(d).toLocaleString(locale, { minimumFractionDigits: deltaDecimals, maximumFractionDigits: deltaDecimals })}${deltaSuffix}`

  // Count delta changes during render so the pulse starts on the same frame as the new value.
  const [seen, setSeen] = React.useState(d)
  const [pulse, setPulse] = React.useState(0)
  if (seen !== d) {
    setSeen(d)
    if (seen !== null) setPulse((p) => p + 1)
  }

  const chart =
    data && data.length > 1 ? (
      ready ? (
        <SparklineDraw data={data} pointLabels={pointLabels} color={color} height={s.chart} formatValue={(v) => `${prefix}${formatter.format(v)}${suffix}`} aria-label={typeof label === "string" ? label : undefined} className={layout === "row" ? "w-28 shrink-0 sm:w-32" : undefined} />
      ) : (
        <div className={layout === "row" ? "w-28 shrink-0 sm:w-32" : "w-full"} style={{ height: s.chart }} aria-hidden="true" />
      )
    ) : null

  return (
    <div ref={ref} data-inview={ready} data-interactive={interactive ? "" : undefined} className={cn("pc-kpi-trend flex min-w-0 flex-col rounded-xl border", s.pad, s.gap, className)} {...props}>
      <GooduiTokens />
      <style href="pc-kpi-trend" precedence="default">
        {CSS}
      </style>
      <div className={cn("flex min-w-0 flex-1", layout === "row" ? "items-center justify-between gap-4" : "flex-col", s.gap)}>
        <div className={cn("flex min-w-0 flex-col", size === "sm" ? "gap-1" : "gap-1.5")}>
          <span className={cn("truncate font-medium text-muted-foreground", s.label)}>{label}</span>
          <span className={cn("leading-none font-semibold tracking-tight", s.value)}>
            <span className="sr-only">{finalText}</span>
            <span aria-hidden="true">
              <NumberFlow value={ready ? value : 0} format={format} locale={locale} prefix={prefix} suffix={suffix} />
            </span>
          </span>
          {d !== null && (
            <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <span key={pulse} data-trend={trend} data-pulse={pulse > 0 ? "" : undefined} className="pc-kpi-trend-delta inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums">
                {dir !== 0 && <Arrow dir={dir} />}
                <span aria-hidden="true">
                  <NumberFlow value={ready ? Math.abs(d) : 0} format={{ minimumFractionDigits: deltaDecimals, maximumFractionDigits: deltaDecimals }} locale={locale} suffix={deltaSuffix} />
                </span>
                <span className="sr-only">{`${deltaText} ${dir > 0 ? l.increase : dir < 0 ? l.decrease : l.noChange}`}</span>
              </span>
              {deltaLabel && <span className="text-xs text-muted-foreground">{deltaLabel}</span>}
            </span>
          )}
        </div>
        {chart}
      </div>
    </div>
  )
}

export type KpiTrendGroupProps = React.ComponentProps<"div"> & {
  /** Tiles per row on wide screens; they stack to one and two columns below. */
  columns?: 2 | 3 | 4
}

const COLS: Record<2 | 3 | 4, string> = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
}

/** Lines KpiTrend tiles up with hairline dividers inside one rounded border. */
export function KpiTrendGroup({ columns = 4, className, children, ...props }: KpiTrendGroupProps) {
  return (
    <div className={cn("pc-kpi-trend-group", COLS[columns], className)} {...props}>
      <style href="pc-kpi-trend" precedence="default">
        {CSS}
      </style>
      {children}
    </div>
  )
}

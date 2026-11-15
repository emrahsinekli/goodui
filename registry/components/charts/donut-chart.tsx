"use client"

import * as React from "react"
import { motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { ChartLegend } from "@/registry/components/charts/chart-legend"
import { NumberFlow } from "@/registry/components/numbers/number-flow"
import { useLabels } from "@/lib/goodui-locale"
import { spring as springs } from "@/lib/goodui-motion"

export type DonutSlice = {
  /** Defaults to the label. */
  key?: string
  label: string
  value: number
  /** Any CSS color. Defaults to the theme chart colors in order (--chart-1 … --chart-5). */
  color?: string
}

export type DonutChartLabels = {
  summary: (name: string, total: string, parts: string) => string
  /** Announced for the active slice. */
  slice: (label: string, value: string, share: string) => string
  total: string
  legend: string
  columnLabel: string
  columnValue: string
  columnShare: string
  noData: string
}
const DEFAULT_LABELS: DonutChartLabels = {
  summary: (name, total, parts) => `${name ? name + ": " : ""}total ${total}. ${parts}`,
  slice: (label, value, share) => `${label}: ${value}, ${share}`,
  total: "Total",
  legend: "Slices",
  columnLabel: "Label",
  columnValue: "Value",
  columnShare: "Share",
  noData: "No data",
}

export type DonutChartProps = Omit<React.ComponentProps<"div">, "title" | "hidden"> & {
  data: DonutSlice[]
  /** Name shown under the center number and used by screen readers. */
  title?: React.ReactNode
  /** donut (ring with the total in the middle) or pie (full disc, readout under it). */
  variant?: "donut" | "pie"
  /** Diameter in px. */
  size?: number
  /** Ring thickness in px (donut). */
  thickness?: number
  /** Surface gap between slices in px. */
  gap?: number
  /** Legend placement, with each slice's share. */
  legend?: "end" | "bottom" | "none"
  /** Show "42%" next to legend labels. */
  showPercent?: boolean
  /** Keys of hidden slices (controlled); hidden slices leave the ring and the others re-share it. */
  hidden?: string[]
  defaultHidden?: string[]
  onHiddenChange?: (hidden: string[]) => void
  /** Intl.NumberFormat options for the values, e.g. { style: "currency", currency: "USD" }. */
  format?: Intl.NumberFormatOptions
  locale?: string
  formatValue?: (value: number) => string
  /** Seconds the whole ring takes to sweep in. */
  duration?: number
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<DonutChartLabels>
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

/** Donut or pie whose slices sweep in on view, re-share the ring when one is toggled, expand on hover and roll the center total. */
export function DonutChart({
  data,
  title,
  variant = "donut",
  size = 200,
  thickness = 24,
  gap = 2,
  legend = "end",
  showPercent = true,
  hidden: hiddenProp,
  defaultHidden,
  onHiddenChange,
  format,
  locale = "en-US",
  formatValue,
  duration = 1,
  labels,
  className,
  "aria-label": ariaLabel,
  ...props
}: DonutChartProps) {
  const l = useLabels("donut-chart", DEFAULT_LABELS, labels)
  const reduce = useReduce()
  const rootRef = React.useRef<HTMLDivElement>(null)
  const inView = useInView(rootRef)
  const [innerHidden, setInnerHidden] = React.useState<string[]>(defaultHidden ?? [])
  const hidden = hiddenProp ?? innerHidden
  const [active, setActive] = React.useState<string | null>(null)
  const [entered, setEntered] = React.useState(false)
  React.useEffect(() => {
    if (!inView) return
    const id = window.setTimeout(() => setEntered(true), reduce ? 0 : duration * 1000 + 100)
    return () => window.clearTimeout(id)
  }, [inView, reduce, duration])

  const pie = variant === "pie"
  const stroke = pie ? size / 2 : Math.min(thickness, size / 2)
  const r = (size - stroke) / 2
  const c = size / 2
  const circumference = 2 * Math.PI * r
  const keyOf = (s: DonutSlice) => s.key ?? s.label
  const colorOf = (i: number) => data[i]?.color ?? `var(--chart-${(i % 5) + 1})`
  const slices = data.map((s, i) => ({ ...s, key: keyOf(s), color: colorOf(i), index: i }))
  const visible = slices.filter((s) => !hidden.includes(s.key) && s.value > 0)
  const total = visible.reduce((sum, s) => sum + s.value, 0)
  const grand = slices.reduce((sum, s) => sum + s.value, 0)
  const fmt = React.useMemo(() => formatValue ?? ((v: number) => new Intl.NumberFormat(locale, format).format(v)), [formatValue, locale, format])
  const pct = React.useMemo(() => new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }), [locale])
  const gapFrac = visible.length > 1 ? gap / circumference : 0

  let acc = 0
  const arcs = visible.map((s) => {
    const share = total > 0 ? s.value / total : 0
    const start = acc
    acc += share
    return { ...s, share, start, length: Math.max(0.0001, share - gapFrac), offset: start + gapFrac / 2 }
  })
  const activeSlice = active !== null ? arcs.find((a) => a.key === active) : undefined
  const shownValue = activeSlice ? activeSlice.value : total
  const name = typeof title === "string" ? title : ""
  const summary = ariaLabel ?? (visible.length ? l.summary(name, fmt(total), arcs.map((a) => `${a.label} ${pct.format(a.share)}`).join(", ")) : l.noData)
  const announce = activeSlice ? l.slice(activeSlice.label, fmt(activeSlice.value), pct.format(activeSlice.share)) : ""

  const setHidden = (next: string[]) => {
    if (hiddenProp === undefined) setInnerHidden(next)
    onHiddenChange?.(next)
  }
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!arcs.length) return
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
      e.preventDefault()
      const dir = e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 1
      const i = arcs.findIndex((a) => a.key === active)
      setActive(arcs[(i + dir + arcs.length) % arcs.length]?.key ?? null)
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault()
      setActive((e.key === "Home" ? arcs[0] : arcs[arcs.length - 1])?.key ?? null)
    } else if (e.key === "Escape") setActive(null)
  }

  const ready = inView || reduce
  const spring = reduce ? { duration: 0 } : springs.morph
  const legendNode =
    legend !== "none" && slices.length > 0 ? (
      <ChartLegend
        items={slices.map((s) => ({ key: s.key, label: s.label, color: s.color, value: showPercent ? pct.format(total > 0 && !hidden.includes(s.key) ? s.value / total : 0) : undefined, shape: "dot" }))}
        hidden={hidden}
        onHiddenChange={setHidden}
        active={active}
        onActiveChange={setActive}
        layout={legend === "end" ? "column" : "row"}
        size="sm"
        labels={{ legend: l.legend }}
        className={legend === "end" ? "min-w-32" : "justify-center"}
      />
    ) : null

  return (
    <div ref={rootRef} className={cn("pc-donut-chart flex w-full min-w-0 flex-wrap items-center gap-x-8 gap-y-4", legend === "end" ? "flex-row justify-center" : "flex-col", className)} {...props}>
      <div className="flex flex-col items-center gap-2">
        <div
          role="group"
          aria-roledescription={pie ? "pie chart" : "donut chart"}
          aria-label={summary}
          tabIndex={0}
          onKeyDown={onKeyDown}
          onBlur={() => setActive(null)}
          className="relative shrink-0 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          style={{ width: size, height: size }}
        >
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible" aria-hidden="true">
            {!pie && <circle cx={c} cy={c} r={r} fill="none" strokeWidth={stroke} className="stroke-muted" />}
            <g transform={`rotate(-90 ${c} ${c})`}>
              {arcs.map((a) => {
                const isActive = active === a.key
                const dim = active !== null && !isActive
                return (
                  <motion.circle
                    key={a.key}
                    cx={c}
                    cy={c}
                    r={r}
                    fill="none"
                    style={{ stroke: a.color }}
                    strokeWidth={stroke}
                    className="cursor-pointer"
                    initial={false}
                    animate={{ pathLength: ready ? a.length : 0.0001, pathOffset: a.offset, r: isActive && !pie ? r + 4 : r, opacity: dim ? 0.45 : 1 }}
                    transition={{
                      pathLength: reduce ? { duration: 0 } : entered ? spring : { duration: duration * a.share, delay: duration * a.start, ease: "linear" },
                      pathOffset: reduce ? { duration: 0 } : entered ? spring : { duration: 0 },
                      r: reduce ? { duration: 0 } : springs.play,
                      opacity: { duration: reduce ? 0 : 0.2 },
                    }}
                    onPointerEnter={() => setActive(a.key)}
                    onPointerLeave={() => setActive(null)}
                  />
                )
              })}
            </g>
          </svg>
          {!pie && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5 text-center" style={{ padding: stroke + 8 }}>
              <NumberFlow value={shownValue} format={format} locale={locale} className="text-2xl leading-none font-semibold tracking-tight" />
              <span className="max-w-full truncate text-xs text-muted-foreground">{activeSlice ? activeSlice.label : (title ?? l.total)}</span>
              <span className="h-4 text-xs font-medium tabular-nums" aria-hidden="true">
                {activeSlice ? pct.format(activeSlice.share) : ""}
              </span>
            </div>
          )}
          {visible.length === 0 && <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">{l.noData}</div>}
          <span className="sr-only" aria-live="polite">
            {announce}
          </span>
        </div>
        {pie && (
          <div className="flex h-10 flex-col items-center justify-center text-center">
            <span className="text-lg leading-none font-semibold tabular-nums">{activeSlice ? `${fmt(activeSlice.value)} · ${pct.format(activeSlice.share)}` : fmt(total)}</span>
            <span className="text-xs text-muted-foreground">{activeSlice ? activeSlice.label : (title ?? l.total)}</span>
          </div>
        )}
      </div>
      {legendNode}
      {slices.length > 0 && (
        <div className="sr-only">
          <table>
          <caption>{summary}</caption>
          <thead>
            <tr>
              <th scope="col">{l.columnLabel}</th>
              <th scope="col">{l.columnValue}</th>
              <th scope="col">{l.columnShare}</th>
            </tr>
          </thead>
          <tbody>
            {slices.map((s) => (
              <tr key={s.key}>
                <th scope="row">{s.label}</th>
                <td>{fmt(s.value)}</td>
                <td>{pct.format(grand > 0 ? s.value / grand : 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  )
}

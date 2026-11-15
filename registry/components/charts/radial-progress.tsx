"use client"

import * as React from "react"
import { motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { ChartLegend } from "@/registry/components/charts/chart-legend"
import { NumberFlow } from "@/registry/components/numbers/number-flow"
import { useLabels } from "@/lib/goodui-locale"
import { spring as springs, ease as easing } from "@/lib/goodui-motion"

export type RadialRing = {
  /** Defaults to the label. */
  key?: string
  label: string
  value: number
  /** Value that closes the ring. */
  max?: number
  /** Any CSS color. Defaults to the theme chart colors in order (--chart-1 … --chart-5). */
  color?: string
  /** Formats this ring's "value / max" (e.g. money) instead of the component's formatValue. */
  formatValue?: (value: number, max: number) => string
}

export type RadialProgressLabels = {
  /** Screen reader text per ring. */
  ring: (label: string, value: string, max: string, percent: string) => string
  summary: (name: string, parts: string) => string
  legend: string
}
const DEFAULT_LABELS: RadialProgressLabels = {
  ring: (label, value, max, percent) => `${label}: ${value} of ${max}, ${percent}`,
  summary: (name, parts) => `${name ? name + ": " : ""}${parts}`,
  legend: "Goals",
}

export type RadialProgressProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** Rings from the outside in. One ring makes a goal ring; several make activity-style concentric rings. */
  rings: RadialRing[]
  /** Name under the center number, used by screen readers too. */
  title?: React.ReactNode
  /** Diameter in px. */
  size?: number
  /** Ring thickness in px. */
  thickness?: number
  /** Space between rings in px. */
  gap?: number
  /** Replaces the rolling percentage in the middle. Pass null to leave the center empty. */
  center?: React.ReactNode
  /** Legend placement with each ring's value. */
  legend?: "end" | "bottom" | "none"
  /** Intl.NumberFormat options for the values. */
  format?: Intl.NumberFormatOptions
  locale?: string
  /** Formats "value / max" for the legend and screen readers. */
  formatValue?: (value: number, max: number) => string
  /** Seconds the first ring takes to fill; inner rings start 0.12 s later each. */
  duration?: number
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<RadialProgressLabels>
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

/** Concentric goal rings (activity style) that fill on view, spring to new values and roll the center percentage of the ring you point at. */
export function RadialProgress({
  rings,
  title,
  size = 160,
  thickness = 12,
  gap = 4,
  center,
  legend = "end",
  format,
  locale = "en-US",
  formatValue,
  duration = 1.2,
  labels,
  className,
  "aria-label": ariaLabel,
  ...props
}: RadialProgressProps) {
  const l = useLabels("radial-progress", DEFAULT_LABELS, labels)
  const reduce = useReduce()
  const rootRef = React.useRef<HTMLDivElement>(null)
  const inView = useInView(rootRef)
  const [active, setActive] = React.useState<string | null>(null)
  const [entered, setEntered] = React.useState(false)
  React.useEffect(() => {
    if (!inView) return
    const id = window.setTimeout(() => setEntered(true), reduce ? 0 : duration * 1000 + rings.length * 120)
    return () => window.clearTimeout(id)
  }, [inView, reduce, duration, rings.length])

  const nf = React.useMemo(() => new Intl.NumberFormat(locale, format), [locale, format])
  const fmt = React.useMemo(() => formatValue ?? ((v: number, max: number) => `${nf.format(v)} / ${nf.format(max)}`), [formatValue, nf])
  const pct = React.useMemo(() => new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }), [locale])
  const items = rings.map((r, i) => {
    const max = r.max ?? 100
    const ratio = max > 0 ? Math.max(0, r.value / max) : 0
    return { ...r, key: r.key ?? r.label, max, ratio, color: r.color ?? `var(--chart-${(i % 5) + 1})`, radius: (size - thickness) / 2 - i * (thickness + gap) }
  })
  const c = size / 2
  const focus = items.find((r) => r.key === active) ?? items[0]
  const name = typeof title === "string" ? title : ""
  const summary = ariaLabel ?? l.summary(name, items.map((r) => l.ring(r.label, nf.format(r.value), nf.format(r.max), pct.format(r.ratio))).join("; "))
  const announce = active && focus ? l.ring(focus.label, nf.format(focus.value), nf.format(focus.max), pct.format(focus.ratio)) : ""

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!items.length) return
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
      e.preventDefault()
      const dir = e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 1
      const i = items.findIndex((r) => r.key === active)
      setActive(items[(i + dir + items.length) % items.length]?.key ?? null)
    } else if (e.key === "Escape") setActive(null)
  }

  const ready = inView || reduce
  const spring = reduce ? { duration: 0 } : springs.morph
  const innerRadius = (items[items.length - 1]?.radius ?? c) - thickness / 2

  return (
    <div ref={rootRef} className={cn("pc-radial-progress flex w-full min-w-0 flex-wrap items-center justify-center gap-x-8 gap-y-4", legend === "bottom" && "flex-col", className)} {...props}>
      <div
        role="group"
        aria-roledescription="progress rings"
        aria-label={summary}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onBlur={() => setActive(null)}
        className="relative shrink-0 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        style={{ width: size, height: size }}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible" aria-hidden="true">
          <g transform={`rotate(-90 ${c} ${c})`}>
            {items.map((r, i) => {
              const dim = active !== null && active !== r.key
              return (
                <g key={r.key} className="cursor-pointer" onPointerEnter={() => setActive(r.key)} onPointerLeave={() => setActive(null)}>
                  <circle cx={c} cy={c} r={r.radius} fill="none" strokeWidth={thickness} style={{ stroke: `color-mix(in oklab, ${r.color} 18%, transparent)`, opacity: dim ? 0.5 : 1 }} />
                  <motion.circle
                    cx={c}
                    cy={c}
                    r={r.radius}
                    fill="none"
                    style={{ stroke: r.color }}
                    strokeWidth={thickness}
                    strokeLinecap="round"
                    initial={false}
                    animate={{ pathLength: ready ? Math.max(0.0001, Math.min(1, r.ratio)) : 0.0001, opacity: dim ? 0.35 : 1 }}
                    transition={{
                      pathLength: reduce ? { duration: 0 } : entered ? spring : { duration, delay: i * 0.12, ease: easing.outExpo },
                      opacity: { duration: reduce ? 0 : 0.2 },
                    }}
                  />
                </g>
              )
            })}
          </g>
        </svg>
        {center !== null && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5 text-center" style={{ padding: Math.max(0, c - innerRadius + 4) }}>
            {center !== undefined ? (
              center
            ) : (
              focus && (
                <>
                  <NumberFlow value={ready ? focus.ratio : 0} format={{ style: "percent", maximumFractionDigits: 0 }} locale={locale} className={cn("leading-none font-semibold tracking-tight", innerRadius > 44 ? "text-2xl" : "text-base")} />
                  {innerRadius > 36 && <span className="max-w-full truncate text-[11px] text-muted-foreground">{active ? focus.label : (title ?? focus.label)}</span>}
                </>
              )
            )}
          </div>
        )}
        <span className="sr-only" aria-live="polite">
          {announce}
        </span>
      </div>
      {legend !== "none" && items.length > 0 && (
        <ChartLegend
          items={items.map((r) => ({ key: r.key, label: r.label, color: r.color, value: (r.formatValue ?? fmt)(r.value, r.max), shape: "dot" }))}
          active={active}
          onActiveChange={setActive}
          layout={legend === "end" ? "column" : "row"}
          size="sm"
          labels={{ legend: l.legend }}
          className={legend === "end" ? "min-w-36" : "justify-center"}
        />
      )}
    </div>
  )
}

"use client"

import * as React from "react"
import { motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import { spring, ease as easing } from "@/lib/goodui-motion"

export type FunnelStage = {
  /** Defaults to the label. */
  key?: string
  label: string
  value: number
  /** Any CSS color. Defaults to an ordinal ramp of `color`, darkest first. */
  color?: string
}

export type FunnelChartLabels = {
  summary: (name: string, first: string, last: string, conversion: string) => string
  /** Announced for the active stage. */
  stage: (label: string, value: string, conversion: string, dropOff: string | null) => string
  /** Chip between stages, e.g. "−38%". */
  dropOff: (percent: string) => string
  /** Share of the first stage, e.g. "31% of Visited". */
  conversion: (percent: string, first: string) => string
  columnStage: string
  columnValue: string
  columnConversion: string
  noData: string
}
const DEFAULT_LABELS: FunnelChartLabels = {
  summary: (name, first, last, conversion) => `${name ? name + ": " : ""}from ${first} to ${last}, ${conversion} overall`,
  stage: (label, value, conversion, dropOff) => `${label}: ${value}, ${conversion}${dropOff ? `, ${dropOff} from the previous stage` : ""}`,
  dropOff: (percent) => `−${percent}`,
  conversion: (percent, first) => `${percent} of ${first}`,
  columnStage: "Stage",
  columnValue: "Value",
  columnConversion: "Conversion",
  noData: "No data",
}

export type FunnelChartProps = Omit<React.ComponentProps<"div">, "children"> & {
  stages: FunnelStage[]
  /** Chart name for screen readers and the table caption. */
  title?: React.ReactNode
  /** center: symmetric funnel. start: bars aligned to the start side, like a ranked list. */
  align?: "center" | "start"
  /** Base hue of the ordinal ramp (first stage full, later stages lighter). */
  color?: string
  /** "−38%" chips between stages. */
  showDropOff?: boolean
  /** Share of the first stage beside each value. */
  showConversion?: boolean
  /** Width of the label column in px. */
  labelWidth?: number
  rowHeight?: number
  format?: Intl.NumberFormatOptions
  locale?: string
  formatValue?: (value: number) => string
  /** Seconds the first bar takes to grow; each next one starts 0.08 s later. */
  duration?: number
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<FunnelChartLabels>
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

/** Funnel whose stage bars grow in sequence, with drop-off chips between stages, conversion from the first stage and arrow-key navigation. */
export function FunnelChart({
  stages,
  title,
  align = "center",
  color = "var(--chart-1)",
  showDropOff = true,
  showConversion = true,
  labelWidth = 112,
  rowHeight = 40,
  format,
  locale = "en-US",
  formatValue,
  duration = 0.8,
  labels,
  className,
  "aria-label": ariaLabel,
  ...props
}: FunnelChartProps) {
  const l = useLabels("funnel-chart", DEFAULT_LABELS, labels)
  const reduce = useReduce()
  const rootRef = React.useRef<HTMLDivElement>(null)
  const inView = useInView(rootRef)
  const [active, setActive] = React.useState<number | null>(null)
  const fmt = React.useMemo(() => formatValue ?? ((v: number) => new Intl.NumberFormat(locale, format).format(v)), [formatValue, locale, format])
  const pct = React.useMemo(() => new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }), [locale])

  const n = stages.length
  const first = stages[0]?.value ?? 0
  const items = stages.map((s, i) => {
    const prev = i > 0 ? (stages[i - 1]?.value ?? 0) : null
    return {
      ...s,
      key: s.key ?? s.label,
      share: first > 0 ? Math.max(0, s.value / first) : 0,
      conversion: first > 0 ? s.value / first : 0,
      dropOff: prev && prev > 0 ? Math.max(0, 1 - s.value / prev) : null,
      color: s.color ?? `color-mix(in oklab, ${color} ${Math.round(100 - (n > 1 ? (i / (n - 1)) * 58 : 0))}%, var(--background))`,
    }
  })
  const name = typeof title === "string" ? title : ""
  const lastItem = items[n - 1]
  const summary = ariaLabel ?? (n && lastItem ? l.summary(name, fmt(first), fmt(lastItem.value), pct.format(lastItem.conversion)) : l.noData)
  const activeItem = active !== null ? items[active] : undefined
  const announce = activeItem ? l.stage(activeItem.label, fmt(activeItem.value), l.conversion(pct.format(activeItem.conversion), items[0]?.label ?? ""), activeItem.dropOff !== null ? l.dropOff(pct.format(activeItem.dropOff)) : null) : ""

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!n) return
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      e.preventDefault()
      const dir = e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 1
      setActive((i) => Math.min(n - 1, Math.max(0, (i ?? (dir > 0 ? -1 : n)) + dir)))
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault()
      setActive(e.key === "Home" ? 0 : n - 1)
    } else if (e.key === "Escape") setActive(null)
  }

  const ready = inView || reduce
  const center = align === "center"

  return (
    <div ref={rootRef} className={cn("pc-funnel-chart flex w-full min-w-0 flex-col gap-2", className)} {...props}>
      <div
        role="group"
        aria-roledescription="funnel chart"
        aria-label={summary}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onFocus={() => setActive((i) => i ?? (n ? 0 : null))}
        onBlur={() => setActive(null)}
        onPointerLeave={() => setActive(null)}
        className="flex flex-col rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {items.map((s, i) => {
          const isActive = active === i
          const dim = active !== null && !isActive
          return (
            <div
              key={s.key}
              data-active={isActive || undefined}
              onPointerEnter={() => setActive(i)}
              className={cn("grid items-center gap-3 rounded-md px-1 transition-colors", isActive && "bg-muted/60")}
              style={{ gridTemplateColumns: `${labelWidth}px minmax(0,1fr) auto`, height: rowHeight }}
            >
              <span className={cn("truncate text-sm transition-opacity", dim && "opacity-60", isActive ? "font-medium text-foreground" : "text-foreground/85")}>{s.label}</span>
              <div className="relative h-full">
                {showDropOff && s.dropOff !== null && (
                  <motion.span
                    className={cn("absolute top-0 z-[1] -translate-y-1/2 rounded-full border bg-background px-1.5 text-[10px] leading-4 font-medium tabular-nums text-muted-foreground", center ? "left-1/2 -translate-x-1/2" : "start-0")}
                    initial={false}
                    animate={{ opacity: ready ? 1 : 0, scale: ready ? 1 : 0.6 }}
                    transition={reduce ? { duration: 0 } : { ...spring.play, delay: i * 0.08 + duration * 0.55 }}
                    aria-hidden="true"
                  >
                    {l.dropOff(pct.format(s.dropOff))}
                  </motion.span>
                )}
                <motion.div
                  className={cn("absolute top-1/2 h-[55%] rounded-[5px] transition-opacity", center ? "origin-center" : "origin-left rtl:origin-right", dim && "opacity-55")}
                  style={{ background: s.color, width: `${Math.max(0.6, s.share * 100)}%`, insetInlineStart: center ? `${50 - Math.max(0.6, s.share * 100) / 2}%` : 0, y: "-50%" }}
                  initial={false}
                  animate={{ scaleX: ready ? 1 : 0 }}
                  transition={reduce ? { duration: 0 } : { duration, delay: i * 0.08, ease: easing.outExpo }}
                />
              </div>
              <motion.span className="flex flex-col items-end text-end leading-tight" initial={false} animate={{ opacity: ready ? 1 : 0 }} transition={reduce ? { duration: 0 } : { duration: 0.35, delay: i * 0.08 + duration * 0.4 }}>
                <span className="text-sm font-semibold tabular-nums">{fmt(s.value)}</span>
                {showConversion && <span className="text-[11px] text-muted-foreground tabular-nums">{pct.format(s.conversion)}</span>}
              </motion.span>
            </div>
          )
        })}
        {n === 0 && <div className="grid h-24 place-items-center text-sm text-muted-foreground">{l.noData}</div>}
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
              <th scope="col">{l.columnStage}</th>
              <th scope="col">{l.columnValue}</th>
              <th scope="col">{l.columnConversion}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr key={s.key}>
                <th scope="row">{s.label}</th>
                <td>{fmt(s.value)}</td>
                <td>{pct.format(s.conversion)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  )
}

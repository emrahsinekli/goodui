"use client"

import * as React from "react"
import { motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { NumberFlow } from "@/registry/components/numbers/number-flow"
import { useLabels } from "@/lib/goodui-locale"
import { spring as springs } from "@/lib/goodui-motion"

/*
 * Context window usage: a bar that fills by segment (system prompt, history, tools, response…), rolling
 * numbers for used / limit and a legend. Turns amber near the limit and rose over it.
 */

export type TokenSegment = {
  label: string
  value: number
  /** Any CSS color; defaults cycle through --chart-1..5. */
  color?: string
}

export type TokenMeterLabels = {
  used: (used: string, max: string) => string
  /** Suffix after the remaining count. */
  left: string
  warning: string
  over: string
}
const DEFAULT_LABELS: TokenMeterLabels = { used: (u, m) => `${u} of ${m} tokens used`, left: "left", warning: "Close to the limit", over: "Over the limit" }

export type TokenMeterProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** Tokens used, when there is one number. */
  used?: number
  /** Breakdown by part of the context; used = sum of the values. */
  segments?: TokenSegment[]
  /** The context window. */
  max: number
  label?: React.ReactNode
  /** Fraction of max where the meter turns amber. */
  warnAt?: number
  /** Fraction of max where it turns rose. */
  dangerAt?: number
  /** Show the segment legend. */
  showLegend?: boolean
  /** Show the remaining count instead of used / max. */
  showRemaining?: boolean
  /** Compact (12.4K) or full (12,400) numbers. */
  format?: "compact" | "full"
  size?: "sm" | "md" | "lg"
  locale?: string
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<TokenMeterLabels>
}

const CHART = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"]
const HEIGHT = { sm: "h-1.5", md: "h-2.5", lg: "h-4" }

/** Context window usage bar with segments, rolling numbers and a legend. */
export function TokenMeter({
  used: usedProp,
  segments,
  max,
  label,
  warnAt = 0.8,
  dangerAt = 0.95,
  showLegend = true,
  showRemaining = false,
  format = "compact",
  size = "md",
  locale = "en-US",
  labels,
  className,
  ...props
}: TokenMeterProps) {
  const l = useLabels("token-meter", DEFAULT_LABELS, labels)
  const reduce = useReducedMotion() ?? false
  const parts = segments ?? []
  const used = usedProp ?? parts.reduce((s, p) => s + p.value, 0)
  const ratio = max > 0 ? used / max : 0
  const state = ratio > 1 ? "over" : ratio >= dangerAt ? "danger" : ratio >= warnAt ? "warning" : "ok"
  const fmtOpts = React.useMemo<Intl.NumberFormatOptions>(() => (format === "compact" ? { notation: "compact", maximumFractionDigits: 1 } : {}), [format])
  const formatter = React.useMemo(() => new Intl.NumberFormat(locale, fmtOpts), [locale, fmtOpts])
  const spring = reduce ? { duration: 0 } : springs.morph
  const stateTone = state === "over" || state === "danger" ? "text-rose-700 dark:text-rose-400" : state === "warning" ? "text-amber-700 dark:text-amber-400" : "text-foreground"
  const fill = state === "over" || state === "danger" ? "oklch(0.6 0.2 25)" : state === "warning" ? "oklch(0.72 0.16 70)" : "var(--foreground)"

  // Each segment is a flex item sized by its tokens; motion's layout animation springs them to new widths.
  const shownParts = parts.length ? parts : [{ label: "", value: used, color: fill }]
  const free = Math.max(0, max - Math.min(used, max))

  return (
    <div data-state={state} className={cn("pc-token-meter flex flex-col gap-1.5", className)} {...props}>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        {label !== undefined && <span className="min-w-0 truncate font-medium">{label}</span>}
        <span className={cn("ms-auto inline-flex items-baseline gap-1 text-xs tabular-nums", stateTone)} aria-hidden="true">
          {showRemaining ? (
            <>
              <NumberFlow value={Math.max(0, max - used)} locale={locale} format={fmtOpts} className="text-sm font-semibold" />
              <span className="text-muted-foreground">{l.left}</span>
            </>
          ) : (
            <>
              <NumberFlow value={used} locale={locale} format={fmtOpts} className="text-sm font-semibold" />
              <span className="text-muted-foreground">/ {formatter.format(max)}</span>
            </>
          )}
        </span>
      </div>
      <div
        role="meter"
        aria-label={typeof label === "string" ? label : l.used(formatter.format(used), formatter.format(max))}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.min(used, max)}
        aria-valuetext={`${l.used(formatter.format(used), formatter.format(max))}${state === "over" ? `. ${l.over}` : state !== "ok" ? `. ${l.warning}` : ""}`}
        className={cn("flex w-full overflow-hidden rounded-full bg-muted", HEIGHT[size])}
      >
        {shownParts.map((p, i) => (
          <motion.div
            key={p.label || i}
            layout
            transition={spring}
            className="h-full min-w-0 first:rounded-s-full last:rounded-e-full"
            style={{ flex: `${Math.max(0, p.value)} 0 0px`, background: p.color ?? CHART[i % CHART.length], marginInlineEnd: i < shownParts.length - 1 && size !== "sm" ? 2 : 0 }}
          />
        ))}
        <motion.div layout transition={spring} className="h-full" style={{ flex: `${free} 0 0px` }} />
      </div>
      {showLegend && parts.length > 0 && (
        <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {parts.map((p, i) => (
            <li key={p.label} className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ background: p.color ?? CHART[i % CHART.length] }} aria-hidden="true" />
              <span>{p.label}</span>
              <span className="text-foreground tabular-nums">{formatter.format(p.value)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

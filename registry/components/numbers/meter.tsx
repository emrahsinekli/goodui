"use client"

import * as React from "react"
import { motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { useGooduiLocale, useLabels } from "@/lib/goodui-locale"
import { NumberFlow } from "@/registry/components/numbers/number-flow"
import { spring as springs } from "@/lib/goodui-motion"

export type MeterTone = "normal" | "warning" | "danger"

export type MeterProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** Name shown above the bar and used as the meter's accessible name, e.g. "SMS credits". */
  label: React.ReactNode
  /** Amount used. It rolls with NumberFlow and the fill springs to it; it is clamped between 0 and max for the bar. */
  value: number
  /** Limit the value is measured against, e.g. 10000 credits. */
  max: number
  /** Formats value and max, e.g. { maximumFractionDigits: 1 }. */
  format?: Intl.NumberFormatOptions
  /** Locale passed to Intl.NumberFormat for value and max. Defaults to the GooduiLocaleProvider language, else en-US. */
  locale?: string
  /** Text after the numbers, e.g. " GB". */
  unit?: string
  /** Share of max (0 to 1) where the bar turns amber. */
  warnAt?: number
  /** Share of max (0 to 1) where the bar turns rose. */
  dangerAt?: number
  /** Split the bar into this many segments, e.g. one per seat. */
  segments?: number
  /** Small line under the bar. Receives the current tone and percentage. */
  hint?: React.ReactNode | ((state: { tone: MeterTone; percent: number }) => React.ReactNode)
  /** Bar height: sm 6px, md 8px, lg 12px. */
  size?: "sm" | "md" | "lg"
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<MeterLabels>
}

/** aria-valuetext of the meter. value and max arrive formatted (max with the unit). */
export type MeterLabels = { valueText: (value: string, max: string, percent: number) => string }
const DEFAULT_LABELS: MeterLabels = { valueText: (value, max, percent) => `${value} of ${max}, ${percent}%` }

const FILL: Record<MeterTone, string> = {
  normal: "bg-primary",
  warning: "bg-amber-500 dark:bg-amber-400",
  danger: "bg-rose-500 dark:bg-rose-400",
}
const TEXT: Record<MeterTone, string> = {
  normal: "text-muted-foreground",
  warning: "text-amber-700 dark:text-amber-400",
  danger: "text-rose-700 dark:text-rose-400",
}
const HEIGHT = { sm: "h-1.5", md: "h-2", lg: "h-3" }

/** Usage meter: the fill springs to the new value and shifts to amber and rose as it nears the limit. */
export function Meter({
  label,
  value,
  max,
  format,
  locale: localeProp,
  unit = "",
  warnAt = 0.75,
  dangerAt = 0.9,
  segments,
  hint,
  size = "md",
  labels,
  className,
  ...props
}: MeterProps) {
  const l = useLabels("meter", DEFAULT_LABELS, labels)
  const { lang } = useGooduiLocale()
  const locale = localeProp ?? lang
  const reduce = useReducedMotion() ?? false
  const ratio = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0
  const tone: MeterTone = ratio >= dangerAt ? "danger" : ratio >= warnAt ? "warning" : "normal"
  const percent = Math.round(ratio * 100)
  const spring = reduce ? { duration: 0 } : springs.morph
  const formatter = React.useMemo(() => new Intl.NumberFormat(locale, format), [locale, format])
  const id = React.useId()

  const count = segments && segments > 1 ? Math.round(segments) : 1
  const filled = ratio * count

  return (
    <div className={cn("w-full", className)} {...props}>
      <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
        <span id={id} className="truncate font-medium">
          {label}
        </span>
        <span className="flex shrink-0 items-end tabular-nums text-muted-foreground">
          <NumberFlow value={value} format={format} locale={locale} className="font-medium text-foreground" />
          <span aria-hidden="true" className="leading-[1.15em] whitespace-pre">
            {" / "}
            {formatter.format(max)}
            {unit}
          </span>
        </span>
      </div>
      <div
        role="meter"
        aria-labelledby={id}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.min(value, max)}
        aria-valuetext={l.valueText(formatter.format(value), `${formatter.format(max)}${unit}`, percent)}
        className={cn("flex w-full gap-1", HEIGHT[size])}
      >
        {Array.from({ length: count }, (_, i) => {
          const part = Math.min(Math.max(filled - i, 0), 1)
          return (
            // Mirrored under RTL so each segment fills from the inline start.
            <div key={i} className="relative h-full flex-1 overflow-hidden rounded-full bg-muted rtl:-scale-x-100">
              <motion.div
                className={cn("absolute inset-0 rounded-full transition-colors duration-500", FILL[tone])}
                initial={{ x: "-100%" }}
                // Fading out at 0 hides the 1px sliver that sub-pixel rounding can leave at the track edge.
                animate={{ x: `${(part - 1) * 100}%`, opacity: part > 0 ? 1 : 0 }}
                transition={
                  reduce
                    ? spring
                    : { ...spring, delay: count > 1 ? i * 0.025 : 0, opacity: { duration: 0.15, delay: part > 0 ? 0 : 0.3 } }
                }
              />
            </div>
          )
        })}
      </div>
      {hint !== undefined && (
        <div className={cn("mt-1.5 text-xs transition-colors duration-500", TEXT[tone])}>
          {typeof hint === "function" ? hint({ tone, percent }) : hint}
        </div>
      )}
    </div>
  )
}

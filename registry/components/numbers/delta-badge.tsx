"use client"

import * as React from "react"
import { AnimatePresence, motion, useAnimate, useReducedMotion } from "motion/react"
import { ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import { NumberFlow } from "@/registry/components/numbers/number-flow"
import { spring } from "@/lib/goodui-motion"

export type DeltaBadgeProps = Omit<React.ComponentProps<"span">, "children"> & {
  /** The change, e.g. 12.4 for +12.4%. */
  value: number
  /** Decimals shown. */
  decimals?: number
  /** Text after the number; use "" or " pts" for non-percent changes. */
  suffix?: string
  /** Which direction is good. Use "down" for churn, no-shows or costs. */
  goodWhen?: "up" | "down"
  /** soft: tinted background, solid: filled green or red with white text, outline: colored border and text. */
  variant?: "soft" | "solid" | "outline"
  /** sm is 20px tall with 11px text, md is 24px with 12px text. */
  size?: "sm" | "md"
  /** Hide the arrow icon. */
  hideIcon?: boolean
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<DeltaBadgeLabels>
}

/** Screen-reader wording of the change; `amount` is the formatted absolute value with suffix, e.g. "12.4%". */
export type DeltaBadgeLabels = { up: (amount: string) => string; down: (amount: string) => string; flat: (amount: string) => string }
const DEFAULT_LABELS: DeltaBadgeLabels = {
  up: (amount) => `Up ${amount}`,
  down: (amount) => `Down ${amount}`,
  flat: (amount) => `No change, ${amount}`,
}

type Tone = "good" | "bad" | "flat"

const TONES: Record<DeltaBadgeProps["variant"] & string, Record<Tone, string>> = {
  soft: {
    good: "bg-emerald-500/12 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300",
    bad: "bg-rose-500/12 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300",
    flat: "bg-muted text-foreground/75",
  },
  // Solid fills use the kit's success and danger tones so white text keeps 4.5:1 in light and dark.
  solid: {
    good: "bg-[oklch(0.53_0.13_155)] text-white",
    bad: "bg-[oklch(0.56_0.21_27)] text-white",
    flat: "bg-muted-foreground text-background",
  },
  outline: {
    good: "border-emerald-500/40 text-emerald-700 dark:text-emerald-300",
    bad: "border-rose-500/40 text-rose-700 dark:text-rose-300",
    flat: "border-border text-muted-foreground",
  },
}
const PULSE: Record<Tone, string> = { good: "bg-emerald-500/35", bad: "bg-rose-500/35", flat: "bg-foreground/15" }

/** Percent-change badge: digits roll, the arrow turns to the new direction and the badge pulses green or red. */
export function DeltaBadge({
  value,
  decimals = 1,
  suffix = "%",
  goodWhen = "up",
  variant = "soft",
  size = "md",
  hideIcon = false,
  labels,
  className,
  ...props
}: DeltaBadgeProps) {
  const l = useLabels("delta-badge", DEFAULT_LABELS, labels)
  const reduce = useReducedMotion() ?? false
  const rounded = Number(value.toFixed(decimals))
  const dir = rounded > 0 ? 1 : rounded < 0 ? -1 : 0
  const tone: Tone = dir === 0 ? "flat" : (dir > 0) === (goodWhen === "up") ? "good" : "bad"

  // Count changes during render (React's "derived state" pattern) so the pulse starts in the same frame.
  const [prev, setPrev] = React.useState(rounded)
  const [pulse, setPulse] = React.useState(0)
  if (prev !== rounded) {
    setPrev(rounded)
    setPulse((p) => p + 1)
  }

  const format = React.useMemo<Intl.NumberFormatOptions>(
    () => ({ minimumFractionDigits: decimals, maximumFractionDigits: decimals }),
    [decimals],
  )
  const [scope, animate] = useAnimate<HTMLSpanElement>()
  React.useEffect(() => {
    if (pulse === 0 || reduce || !scope.current) return
    const controls = animate(scope.current, { scale: [1, 1.12, 1] }, { duration: 0.35, ease: "easeOut" })
    return () => controls.stop()
  }, [pulse, reduce, animate, scope])

  const sign = dir > 0 ? "+" : dir < 0 ? "−" : ""
  const amount = `${Math.abs(rounded).toFixed(decimals)}${suffix}`
  const spoken = dir > 0 ? l.up(amount) : dir < 0 ? l.down(amount) : l.flat(amount)

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center gap-0.5 rounded-full border border-transparent font-medium tabular-nums transition-colors duration-300",
        size === "sm" ? "h-5 px-1.5 text-[11px]" : "h-6 px-2 text-xs",
        TONES[variant][tone],
        className,
      )}
      {...props}
    >
      <span className="sr-only">{spoken}</span>
      <AnimatePresence>
        {pulse > 0 && !reduce && (
          <motion.span
            key={pulse}
            aria-hidden="true"
            className={cn("pointer-events-none absolute inset-0 rounded-full", PULSE[tone])}
            initial={{ opacity: 1, scale: 1 }}
            animate={{ opacity: 0, scale: 1.35 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>
      {!hideIcon && (
        // The outer span mirrors under RTL, so the flat arrow points toward the inline end.
        <span aria-hidden="true" className="relative inline-flex rtl:-scale-x-100">
          <motion.span
            className="inline-flex"
            initial={false}
            animate={{ rotate: dir > 0 ? 0 : dir < 0 ? 180 : 90 }}
            transition={reduce ? { duration: 0 } : spring.play}
          >
            <ArrowUp className={size === "sm" ? "size-3" : "size-3.5"} strokeWidth={2.5} />
          </motion.span>
        </span>
      )}
      <span ref={scope} aria-hidden="true" className="relative inline-flex">
        <span className="inline-block w-[1ch] text-center">{sign}</span>
        <NumberFlow value={Math.abs(rounded)} format={format} suffix={suffix} />
      </span>
    </span>
  )
}

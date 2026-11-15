"use client"

import * as React from "react"
import { motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import { GooduiTokens, spring as springs } from "@/lib/goodui-motion"

const CSS = `
@keyframes pc-progress-sweep { 0% { transform: translateX(-100%) scaleX(.6) } 60% { transform: translateX(160%) scaleX(1) } 100% { transform: translateX(260%) scaleX(.6) } }
@keyframes pc-progress-sweep-2 { 0% { transform: translateX(-120%) } 100% { transform: translateX(480%) } }
@keyframes pc-progress-stripes { from { transform: translateX(-1rem) } to { transform: translateX(0) } }
.pc-progress-sweep { position: absolute; inset-block: 0; left: 0; width: 40%; border-radius: inherit; animation: pc-progress-sweep 1.6s var(--pc-ease-in-out) infinite; }
.pc-progress-sweep-2 { position: absolute; inset-block: 0; left: 0; width: 22%; border-radius: inherit; animation: pc-progress-sweep-2 1.6s var(--pc-ease-in-out) .8s infinite; transform: translateX(-120%); }
.pc-progress-stripes::after {
  content: ""; position: absolute; top: 0; bottom: 0; left: -1rem; right: 0;
  background-image: linear-gradient(45deg, rgb(255 255 255 / .22) 25%, transparent 25%, transparent 50%, rgb(255 255 255 / .22) 50%, rgb(255 255 255 / .22) 75%, transparent 75%, transparent);
  background-size: 1rem 1rem;
  animation: pc-progress-stripes .8s linear infinite;
}
@media (prefers-reduced-motion: reduce) {
  .pc-progress-sweep { animation: none; transform: none; width: 100%; opacity: .45 }
  .pc-progress-sweep-2 { display: none }
  .pc-progress-stripes::after { animation: none }
}
`

export type ProgressVariant = "determinate" | "indeterminate" | "striped" | "steps"

export type ProgressProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** Current value, 0 to max. Ignored by the indeterminate variant. */
  value?: number
  /** Value that counts as complete. For steps, set it to the step count so value is the number of finished steps. */
  max?: number
  /** determinate: spring fill. indeterminate: looping sweep for unknown duration. striped: fill with moving stripes. steps: one segment per step. */
  variant?: ProgressVariant
  /** Number of segments for the steps variant. */
  steps?: number
  /** Bar height: sm 4px, md 8px, lg 12px. */
  size?: "sm" | "md" | "lg"
  /** Optional label above the bar. */
  label?: React.ReactNode
  /** Show the percentage (or "step x of n") next to the label. */
  showValue?: boolean
  /** Classes for the filled part, e.g. "bg-emerald-500". */
  indicatorClassName?: string
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<ProgressLabels>
}

/** Built-in text: the fallback accessible name and the steps variant's "Step x of n". */
export type ProgressLabels = { progress: string; stepOf: (step: number, count: number) => string }
const DEFAULT_LABELS: ProgressLabels = { progress: "Progress", stepOf: (step, count) => `Step ${step} of ${count}` }

const HEIGHT = { sm: "h-1", md: "h-2", lg: "h-3" }

/** Progress bar with four variants: spring fill, indeterminate sweep, moving stripes and filling steps. */
export function Progress({
  value = 0,
  max = 100,
  variant = "determinate",
  steps = 4,
  size = "md",
  label,
  showValue = false,
  indicatorClassName,
  labels,
  className,
  ...props
}: ProgressProps) {
  const l = useLabels("progress", DEFAULT_LABELS, labels)
  const reduce = useReducedMotion() ?? false
  const ratio = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0
  const spring = reduce ? { duration: 0 } : springs.morph
  const indeterminate = variant === "indeterminate"
  const stepCount = Math.max(1, Math.round(steps))
  const done = Math.round(ratio * stepCount * 100) / 100
  const valueText = variant === "steps" ? l.stepOf(Math.min(Math.floor(done) + (done < stepCount ? 1 : 0), stepCount), stepCount) : `${Math.round(ratio * 100)}%`
  const labelId = React.useId()

  // The track holds no text, so RTL simply mirrors it: fills and sweeps then run from the inline start.
  const track = cn("relative w-full overflow-hidden rounded-full bg-muted rtl:-scale-x-100", HEIGHT[size])
  const fill = cn("bg-primary", indicatorClassName)

  return (
    <div className={cn("w-full", className)} {...props}>
      <GooduiTokens />
      <style href="pc-progress" precedence="default">
        {CSS}
      </style>
      {(label || (showValue && !indeterminate)) && (
        <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
          <span id={labelId} className="truncate font-medium">
            {label}
          </span>
          {showValue && !indeterminate && <span className="shrink-0 tabular-nums text-muted-foreground">{valueText}</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-labelledby={label ? labelId : undefined}
        aria-label={label ? undefined : l.progress}
        aria-valuemin={indeterminate ? undefined : 0}
        aria-valuemax={indeterminate ? undefined : max}
        aria-valuenow={indeterminate ? undefined : Math.min(Math.max(value, 0), max)}
        aria-valuetext={indeterminate ? undefined : valueText}
        aria-busy={indeterminate || undefined}
        className={variant === "steps" ? cn("flex w-full gap-1.5", HEIGHT[size]) : track}
      >
        {variant === "indeterminate" && (
          <>
            <div className={cn("pc-progress-sweep", fill)} />
            <div className={cn("pc-progress-sweep-2", fill)} />
          </>
        )}
        {(variant === "determinate" || variant === "striped") && (
          <motion.div
            className={cn("absolute inset-0 overflow-hidden rounded-full", fill, variant === "striped" && "pc-progress-stripes")}
            initial={{ x: "-100%" }}
            // Fading out at 0 hides the 1px sliver that sub-pixel rounding can leave at the track edge.
            animate={{ x: `${(ratio - 1) * 100}%`, opacity: ratio > 0 ? 1 : 0 }}
            transition={reduce ? spring : { ...spring, opacity: { duration: 0.15, delay: ratio > 0 ? 0 : 0.3 } }}
          />
        )}
        {variant === "steps" &&
          Array.from({ length: stepCount }, (_, i) => {
            const part = Math.min(Math.max(done - i, 0), 1)
            return (
              <div key={i} className="relative h-full flex-1 overflow-hidden rounded-full bg-muted rtl:-scale-x-100">
                <motion.div
                  className={cn("absolute inset-0 rounded-full", fill)}
                  initial={{ x: "-100%" }}
                  animate={{ x: `${(part - 1) * 100}%`, opacity: part > 0 ? 1 : 0 }}
                  transition={reduce ? spring : { ...spring, opacity: { duration: 0.15, delay: part > 0 ? 0 : 0.3 } }}
                />
              </div>
            )
          })}
      </div>
    </div>
  )
}

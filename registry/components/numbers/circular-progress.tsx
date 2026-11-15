"use client"

import * as React from "react"
import { motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { NumberFlow } from "@/registry/components/numbers/number-flow"
import { spring } from "@/lib/goodui-motion"

export type CircularProgressProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** Current value on the 0 to max scale; the arc springs to it. */
  value: number
  /** Value that fills the whole ring or gauge. */
  max?: number
  /** Diameter in px. */
  size?: number
  /** Ring thickness in px. Defaults to 9% of the size. */
  strokeWidth?: number
  /** "ring" is a full circle, "gauge" is a 270° arc open at the bottom. */
  variant?: "ring" | "gauge"
  /** Center content. Defaults to the rolling percentage. Pass null to hide it. */
  label?: React.ReactNode
  /** Small line under the center label. */
  sublabel?: React.ReactNode
  /** Classes for the arc; it is drawn with currentColor, e.g. "text-emerald-500". */
  indicatorClassName?: string
  /** Classes for the track; drawn with currentColor. */
  trackClassName?: string
  /** Accessible name for the progress bar. */
  "aria-label"?: string
}

/** SVG ring or 270° gauge whose arc springs to the value, with a rolling percentage in the middle. */
export function CircularProgress({
  value,
  max = 100,
  size = 120,
  strokeWidth,
  variant = "ring",
  label,
  sublabel,
  indicatorClassName,
  trackClassName,
  className,
  style,
  "aria-label": ariaLabel = "Progress",
  ...props
}: CircularProgressProps) {
  const reduce = useReducedMotion() ?? false
  const ratio = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0
  const stroke = strokeWidth ?? Math.max(3, Math.round(size * 0.09))
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const gauge = variant === "gauge"
  const arc = gauge ? c * 0.75 : c
  // Ring starts at 12 o'clock; the gauge starts at 7:30 so its gap sits at the bottom.
  const rotate = gauge ? 135 : -90
  const center = size / 2

  const content =
    label === undefined ? (
      <NumberFlow value={ratio} format={{ style: "percent", maximumFractionDigits: 0 }} className="font-semibold tracking-tight" />
    ) : (
      label
    )

  return (
    <div
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(Math.max(value, 0), max)}
      aria-valuetext={`${Math.round(ratio * 100)}%`}
      className={cn("relative inline-grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size, ...style }}
      {...props}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 overflow-visible" aria-hidden="true">
        <g transform={`rotate(${rotate} ${center} ${center})`}>
          <circle
            cx={center}
            cy={center}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${arc} ${c}`}
            className={cn("text-muted", trackClassName)}
          />
          <motion.circle
            cx={center}
            cy={center}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${arc} ${c}`}
            className={cn("text-primary", indicatorClassName)}
            initial={{ strokeDashoffset: arc, opacity: 0 }}
            // A round cap still paints a dot at 0, so the arc fades out instead.
            animate={{ strokeDashoffset: arc * (1 - ratio), opacity: ratio > 0 ? 1 : 0 }}
            transition={
              reduce
                ? { duration: 0 }
                : { strokeDashoffset: spring.morph, opacity: { duration: 0.15 } }
            }
          />
        </g>
      </svg>
      {content !== null && (
        // aria-valuetext carries the value; pass your own aria-valuetext when the label says more.
        <div aria-hidden="true" className="relative flex flex-col items-center leading-none" style={{ fontSize: Math.max(11, size * 0.2), marginTop: gauge ? size * 0.04 : 0 }}>
          <div>{content}</div>
          {sublabel && (
            <div className="mt-1 text-muted-foreground" style={{ fontSize: Math.max(10, size * 0.09) }}>
              {sublabel}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

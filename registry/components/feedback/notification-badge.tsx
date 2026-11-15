"use client"

import * as React from "react"
import { AnimatePresence, motion, useAnimate, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import { NumberFlow } from "@/registry/components/numbers/number-flow"
import { GooduiTokens, spring } from "@/lib/goodui-motion"

const CSS = `
@keyframes pc-notification-badge-ping { 0% { transform: scale(1); opacity: .55 } 75%, 100% { transform: scale(2.1); opacity: 0 } }
.pc-notification-badge-ping { animation: pc-notification-badge-ping 1.6s var(--pc-ease-out) infinite; }
@media (prefers-reduced-motion: reduce) { .pc-notification-badge-ping { animation: none; opacity: 0 } }
`

export type NotificationBadgeProps = Omit<React.ComponentProps<"span">, "children"> & {
  /** The element the badge sits on, usually an icon button. */
  children: React.ReactNode
  /** Number shown in the badge. At 0 the badge hides (unless showZero); a higher count bumps it. */
  count: number
  /** Above this the badge reads "99+". */
  max?: number
  /** A plain dot instead of a number. */
  dot?: boolean
  /** A ring that keeps pinging outward while the count is above zero. */
  pulse?: boolean
  /** Keep the badge visible at 0. */
  showZero?: boolean
  /** Badge color: red (rose) for alerts, primary for your theme color, emerald or amber. */
  tone?: "red" | "primary" | "emerald" | "amber"
  /** Badge corner. Left and right are mirrored under RTL (right means the inline end). */
  placement?: "top-right" | "top-left" | "bottom-right"
  /** Words for screen readers after the count. */
  label?: string
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<NotificationBadgeLabels>
  /** Classes for the badge itself; className goes on the wrapper around children. */
  badgeClassName?: string
}

/** Screen-reader wording for a capped count, e.g. "More than 99". */
export type NotificationBadgeLabels = { moreThan: (max: number) => string }
const DEFAULT_LABELS: NotificationBadgeLabels = { moreThan: (max) => `More than ${max}` }

// Badge colors keep the small count at 4.5:1 or more: darker red and green fills, dark ink on amber.
const TONE = {
  red: "bg-rose-600 text-white",
  primary: "bg-primary text-primary-foreground",
  emerald: "bg-[oklch(0.53_0.13_155)] text-white",
  amber: "bg-amber-500 text-amber-950",
}
const PING = { red: "bg-rose-500", primary: "bg-primary", emerald: "bg-emerald-500", amber: "bg-amber-500" }
const PLACE = {
  "top-right": "top-0 end-0 translate-x-1/3 -translate-y-1/3 rtl:-translate-x-1/3",
  "top-left": "top-0 start-0 -translate-x-1/3 -translate-y-1/3 rtl:translate-x-1/3",
  "bottom-right": "bottom-0 end-0 translate-x-1/3 translate-y-1/3 rtl:-translate-x-1/3",
}

/** Count badge for an icon button. It springs in, bumps when the count goes up, caps at "99+" and can pulse. */
export function NotificationBadge({
  children,
  count,
  max = 99,
  dot = false,
  pulse = false,
  showZero = false,
  tone = "red",
  placement = "top-right",
  label = "unread",
  labels,
  className,
  badgeClassName,
  ...props
}: NotificationBadgeProps) {
  const l = useLabels("notification-badge", DEFAULT_LABELS, labels)
  const reduce = useReducedMotion() ?? false
  const [scope, animate] = useAnimate<HTMLSpanElement>()
  const prev = React.useRef(count)
  const visible = count > 0 || showZero
  const capped = count > max

  React.useEffect(() => {
    const was = prev.current
    prev.current = count
    if (reduce || count <= was || was === 0 || !scope.current) return
    // Quick swell, then a spring settles it back with a small overshoot.
    let stopped = false
    const up = animate(scope.current, { scale: 1.3 }, { duration: 0.1, ease: "easeOut" })
    up.then(() => {
      if (!stopped && scope.current) animate(scope.current, { scale: 1 }, spring.play)
    })
    return () => {
      stopped = true
    }
  }, [count, reduce, animate, scope])

  return (
    <span className={cn("relative inline-flex shrink-0", className)} {...props}>
      <GooduiTokens />
      <style href="pc-notification-badge" precedence="default">
        {CSS}
      </style>
      {children}
      <span className="sr-only" aria-live="polite">
        {count > 0 ? `${capped ? l.moreThan(max) : count} ${label}` : ""}
      </span>
      <span aria-hidden="true" className={cn("pointer-events-none absolute z-10", PLACE[placement])}>
        <AnimatePresence initial={false}>
          {visible && (
            <motion.span
              key="badge"
              className="relative flex"
              initial={reduce ? { opacity: 0 } : { scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { scale: 0, opacity: 0 }}
              transition={reduce ? { duration: 0 } : spring.play}
            >
              {pulse && count > 0 && <span className={cn("pc-notification-badge-ping absolute inset-0 rounded-full", PING[tone])} />}
              <span
                ref={scope}
                className={cn(
                  "relative flex items-center justify-center rounded-full font-semibold tabular-nums ring-2 ring-background",
                  dot ? "size-2.5" : "h-[18px] min-w-[18px] px-1 text-[10.5px] leading-none",
                  TONE[tone],
                  badgeClassName,
                )}
              >
                {!dot && (
                  <NumberFlow value={Math.min(count, max)} suffix={capped ? "+" : ""} />
                )}
              </span>
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </span>
  )
}

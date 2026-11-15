"use client"

import * as React from "react"
import { animate, useInView, useReducedMotion, type Easing } from "motion/react"
import { cn } from "@/lib/utils"
import { useGooduiLocale } from "@/lib/goodui-locale"

export type CounterUpProps = Omit<React.ComponentProps<"span">, "children" | "prefix"> & {
  /** Target value. Changing it later counts from the current value to the new one. */
  value: number
  /** Start value for the first count. */
  from?: number
  /** Seconds the count takes. */
  duration?: number
  /** Seconds to wait after the element enters the viewport. */
  delay?: number
  /** motion easing for the count; defaults to a strong ease-out [0.16, 1, 0.3, 1]. */
  ease?: Easing | Easing[]
  /** Intl.NumberFormat options, e.g. { style: "currency", currency: "USD" }. */
  format?: Intl.NumberFormatOptions
  /** Locale passed to Intl.NumberFormat ("de-DE" gives 1.234,5). Defaults to the GooduiLocaleProvider language, else en-US. */
  locale?: string
  /** Text placed before the formatted number. */
  prefix?: string
  /** Text placed after the formatted number, e.g. "%" or " / 5". */
  suffix?: string
  /** Count only the first time it scrolls into view. With false it resets when it leaves and replays on return. */
  once?: boolean
  /** Share of the element that must be visible before it starts, 0 to 1. */
  amount?: number
  /** Scroll container to observe instead of the viewport. */
  root?: React.RefObject<Element | null>
  /** Called when a count finishes (also right away when reduced motion skips it). */
  onComplete?: () => void
}

function decimalsOf(n: number) {
  if (!Number.isFinite(n)) return 0
  const s = String(n)
  const i = s.indexOf(".")
  return i === -1 ? 0 : Math.min(s.length - i - 1, 6)
}

/** Counts up to `value` once it scrolls into view. Updates the DOM directly, so a count never re-renders React. */
export function CounterUp({
  value,
  from = 0,
  duration = 1.6,
  delay = 0,
  ease = [0.16, 1, 0.3, 1],
  format,
  locale: localeProp,
  prefix = "",
  suffix = "",
  once = true,
  amount = 0.5,
  root,
  onComplete,
  className,
  ...props
}: CounterUpProps) {
  const reduce = useReducedMotion() ?? false
  const { lang } = useGooduiLocale()
  const locale = localeProp ?? lang
  const ref = React.useRef<HTMLSpanElement>(null)
  const textRef = React.useRef<HTMLSpanElement>(null)
  const current = React.useRef(from)
  const inView = useInView(ref, { once, amount, root })

  const formatter = React.useMemo(() => {
    const hasDigits = format?.minimumFractionDigits !== undefined || format?.maximumFractionDigits !== undefined
    if (hasDigits || format?.style === "currency") return new Intl.NumberFormat(locale, format)
    // Intermediate frames keep the precision of the target, so 4.9 never flickers through 4.8731.
    const d = decimalsOf(value)
    return new Intl.NumberFormat(locale, { ...format, minimumFractionDigits: d, maximumFractionDigits: d })
  }, [locale, format, value])

  const fmt = React.useCallback((n: number) => `${prefix}${formatter.format(n)}${suffix}`, [formatter, prefix, suffix])
  const completeRef = React.useRef(onComplete)
  React.useEffect(() => {
    completeRef.current = onComplete
  })

  React.useEffect(() => {
    const el = textRef.current
    if (!el) return
    if (!inView) {
      if (!once) {
        current.current = from
        el.textContent = fmt(from)
      }
      return
    }
    if (reduce || current.current === value) {
      current.current = value
      el.textContent = fmt(value)
      completeRef.current?.()
      return
    }
    const controls = animate(current.current, value, {
      duration,
      delay,
      ease,
      onUpdate: (v) => {
        current.current = v
        el.textContent = fmt(v)
      },
      onComplete: () => completeRef.current?.(),
    })
    return () => controls.stop()
    // `ease` is usually an inline array; it is read once per count.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, value, reduce, once, from, duration, delay, fmt])

  return (
    <span ref={ref} className={cn("inline-block tabular-nums", className)} {...props}>
      <span ref={textRef} aria-hidden="true">
        {fmt(from)}
      </span>
      <span className="sr-only">{fmt(value)}</span>
    </span>
  )
}

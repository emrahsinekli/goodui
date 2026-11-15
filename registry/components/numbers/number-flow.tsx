"use client"

import * as React from "react"
import { motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { useGooduiLocale } from "@/lib/goodui-locale"
import { spring } from "@/lib/goodui-motion"

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
// Every character sits in a box of the same height, so digits, separators and symbols share one baseline.
const BOX = "inline-block h-[1.15em] overflow-hidden leading-[1.15em]"

function Digit({ value, reduce, fast, delay, enter }: { value: number; reduce: boolean; fast: boolean; delay: number; enter: boolean }) {
  return (
    <motion.span
      className={cn(BOX, "relative w-[1ch] [mask-image:linear-gradient(transparent,#000_14%,#000_86%,transparent)]")}
      aria-hidden="true"
      initial={enter && !reduce ? { opacity: 0, y: "0.4em" } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={spring.ui}
    >
      <motion.span
        className="absolute inset-x-0 top-0 flex flex-col"
        initial={false}
        animate={{ y: `${-value * 1.15}em` }}
        transition={reduce ? { duration: 0 } : fast ? spring.snap : { ...spring.morph, delay }}
      >
        {DIGITS.map((d) => (
          <span key={d} className="h-[1.15em] text-center">
            {d}
          </span>
        ))}
      </motion.span>
    </motion.span>
  )
}

export type NumberFlowProps = {
  /** Number to show. Changing it rolls each digit to its new value. */
  value: number
  /** Intl.NumberFormat options, e.g. { style: "currency", currency: "USD" }. */
  format?: Intl.NumberFormatOptions
  /** Locale passed to Intl.NumberFormat ("de-DE" gives 1.234,5). Defaults to the GooduiLocaleProvider language, else en-US. */
  locale?: string
  /** Text placed before the formatted number, e.g. "~". */
  prefix?: string
  /** Text placed after the formatted number, e.g. " / mo". */
  suffix?: string
  /** fast: snappier roll with no stagger, for values driven by a pointer (scrubbing a chart). */
  speed?: "smooth" | "fast"
  className?: string
}

/** Animated number: each digit rolls to its new value. Screen readers get the formatted value once. */
export function NumberFlow({ value, format, locale: localeProp, prefix = "", suffix = "", speed = "smooth", className }: NumberFlowProps) {
  const reduce = useReducedMotion() ?? false
  const { lang } = useGooduiLocale()
  const locale = localeProp ?? lang
  const formatter = React.useMemo(() => new Intl.NumberFormat(locale, format), [locale, format])
  const text = `${prefix}${formatter.format(value)}${suffix}`

  const mounted = React.useRef(false)
  React.useEffect(() => {
    mounted.current = true
  }, [])

  // Key characters by their distance from the end so digits keep their column as the length changes.
  const chars = [...text]
  return (
    <span className={cn("inline-flex items-end tabular-nums", className)}>
      <span className="sr-only">{text}</span>
      {chars.map((ch, i) => {
        const key = chars.length - i
        return /\d/.test(ch) ? (
          <Digit key={key} value={Number(ch)} reduce={reduce} fast={speed === "fast"} delay={(key - 1) * 0.012} enter={mounted.current} />
        ) : (
          <span key={key} className={cn(BOX, "whitespace-pre")} aria-hidden="true">
            {ch}
          </span>
        )
      })}
    </span>
  )
}

"use client"

import * as React from "react"
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { spring } from "@/lib/goodui-motion"

export type WordRotateProps = Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> & {
  /** Words or short phrases shown one at a time, in order. */
  words: string[]
  /** Milliseconds each word stays before the next one. */
  interval?: number
  /** Controlled index of the visible word. */
  index?: number
  /** Starting word when uncontrolled. */
  defaultIndex?: number
  /** Called with the next index on every automatic rotation. */
  onIndexChange?: (index: number) => void
  /** Stop auto-rotating (controls and `index` still work). */
  paused?: boolean
  /** Where the word sits while the box resizes. */
  align?: "start" | "center" | "end"
}

/**
 * Rotates words in place with a vertical slide and blur. The box width springs to each word, so the
 * surrounding sentence glides instead of jumping. Pauses while off-screen or when the tab is hidden.
 */
export function WordRotate({
  words,
  interval = 2400,
  index,
  defaultIndex = 0,
  onIndexChange,
  paused = false,
  align = "start",
  className,
  ...props
}: WordRotateProps) {
  const reduce = useReducedMotion() ?? false
  const n = words.length
  const [inner, setInner] = React.useState(defaultIndex)
  const controlled = index !== undefined
  const raw = controlled ? index : inner
  const current = n ? ((raw % n) + n) % n : 0

  const rootRef = React.useRef<HTMLSpanElement>(null)
  const measureRef = React.useRef<HTMLSpanElement>(null)
  const inView = useInView(rootRef)
  const [width, setWidth] = React.useState<number | null>(null)
  const measured = React.useRef(false)

  const changeRef = React.useRef(onIndexChange)
  changeRef.current = onIndexChange

  React.useEffect(() => {
    if (paused || !inView || n < 2) return
    const t = setTimeout(() => {
      if (document.hidden) return
      const next = (current + 1) % n
      if (!controlled) setInner(next)
      changeRef.current?.(next)
    }, interval)
    return () => clearTimeout(t)
  }, [paused, inView, n, current, interval, controlled])

  // Measure the incoming word (also after web fonts load) so the box can spring to it.
  React.useEffect(() => {
    const el = measureRef.current
    if (!el) return
    const update = () => setWidth(el.getBoundingClientRect().width)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const firstMeasure = width !== null && !measured.current
  React.useEffect(() => {
    if (width !== null) measured.current = true
  }, [width])

  const word = words[current] ?? ""
  const slide = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: "0.7em", filter: "blur(6px)" },
        animate: { opacity: 1, y: 0, filter: "blur(0px)" },
        exit: { opacity: 0, y: "-0.7em", filter: "blur(6px)" },
      }

  return (
    <span ref={rootRef} className={cn("relative inline-block align-bottom", className)} {...props}>
      <span className="sr-only">{word}</span>
      <span ref={measureRef} aria-hidden="true" className="invisible absolute top-0 left-0 whitespace-nowrap">
        {word}
      </span>
      <motion.span
        aria-hidden="true"
        className="relative -my-[0.15em] inline-grid overflow-hidden py-[0.15em] align-bottom whitespace-nowrap"
        style={{ justifyItems: align }}
        initial={false}
        animate={width === null ? undefined : { width }}
        transition={reduce || firstMeasure ? { duration: 0 } : spring.morph}
      >
        <AnimatePresence initial={false}>
          <motion.span
            key={current}
            className="[grid-area:1/1]"
            {...slide}
            transition={reduce ? { duration: 0.15 } : spring.morph}
          >
            {word}
          </motion.span>
        </AnimatePresence>
      </motion.span>
    </span>
  )
}

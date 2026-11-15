"use client"

import * as React from "react"
import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react"
import { cn } from "@/lib/utils"

function wrap(min: number, max: number, v: number) {
  const range = max - min
  return ((((v - min) % range) + range) % range) + min
}

export type ScrollVelocityRowProps = Omit<React.HTMLAttributes<HTMLDivElement>, "children"> & {
  /** Content of one repeat; it is copied as many times as needed to fill the row. */
  children: React.ReactNode
  /** Pixels per second at rest. Negative moves to the right. */
  baseVelocity?: number
  /** Scrollable element to track. Defaults to the window. */
  scrollContainer?: React.RefObject<HTMLElement | null>
  /** How strongly scroll speed boosts the row. 0 turns the effect off. */
  velocityFactor?: number
}

/**
 * One endlessly looping row. It drifts at `baseVelocity`, speeds up with scroll speed and flips direction with
 * scroll direction. Stops while off-screen and stays still for reduced motion.
 */
export function ScrollVelocityRow({
  children,
  baseVelocity = 40,
  scrollContainer,
  velocityFactor = 1,
  className,
  ...props
}: ScrollVelocityRowProps) {
  const reduce = useReducedMotion() ?? false
  const rootRef = React.useRef<HTMLDivElement>(null)
  const itemRef = React.useRef<HTMLDivElement>(null)
  const itemWidth = React.useRef(0)
  const [copies, setCopies] = React.useState(2)
  const inView = useInView(rootRef)

  const { scrollY } = useScroll(scrollContainer ? { container: scrollContainer } : undefined)
  const velocity = useVelocity(scrollY)
  const smooth = useSpring(velocity, { damping: 50, stiffness: 400 })
  const boost = useTransform(smooth, [0, 1000], [0, 5], { clamp: false })
  const x = useMotionValue(0)
  const direction = React.useRef(1)

  // Repeat the content enough times to cover the row, plus one copy to wrap into.
  React.useEffect(() => {
    const root = rootRef.current
    const item = itemRef.current
    if (!root || !item) return
    const update = () => {
      const w = item.offsetWidth
      itemWidth.current = w
      if (w > 0) setCopies(Math.max(2, Math.ceil(root.offsetWidth / w) + 1))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(root)
    ro.observe(item)
    return () => ro.disconnect()
  }, [])

  // The frame loop exists only while the row is on screen: a row far down the page must not keep every frame busy.
  React.useEffect(() => {
    if (reduce || !inView) return
    let last = performance.now()
    let id = requestAnimationFrame(function tick(now) {
      id = requestAnimationFrame(tick)
      const w = itemWidth.current
      const dt = Math.min(now - last, 50) / 1000
      last = now
      if (!w || document.hidden) return
      const b = boost.get() * velocityFactor
      if (b < 0) direction.current = -1
      else if (b > 0) direction.current = 1
      const move = direction.current * baseVelocity * dt * (1 + Math.abs(b))
      x.set(wrap(-w, 0, x.get() - move))
    })
    return () => cancelAnimationFrame(id)
  }, [reduce, inView, baseVelocity, velocityFactor, boost, x])

  return (
    <div ref={rootRef} className={cn("flex overflow-hidden whitespace-nowrap", className)} {...props}>
      <motion.div className="flex shrink-0" style={{ x }}>
        {Array.from({ length: copies }, (_, i) => (
          <div key={i} ref={i === 0 ? itemRef : undefined} aria-hidden={i > 0 ? true : undefined} className="flex shrink-0 items-center">
            {children}
          </div>
        ))}
      </motion.div>
    </div>
  )
}

export type ScrollVelocityProps = Omit<React.HTMLAttributes<HTMLDivElement>, "children"> & {
  /** One string per row. Rows alternate direction. */
  items: string[]
  /** Pixels per second at rest. */
  baseVelocity?: number
  /** Scrollable element to track. Defaults to the window. */
  scrollContainer?: React.RefObject<HTMLElement | null>
  /** How strongly scroll speed boosts the rows. 0 turns the effect off. */
  velocityFactor?: number
  /** Shown between repeats of a row. */
  separator?: React.ReactNode
  /** Classes for every row, e.g. the font size and weight. */
  rowClassName?: string
}

/** Stacked rows of large text that drift in alternating directions and react to scroll speed. */
export function ScrollVelocity({
  items,
  baseVelocity = 40,
  scrollContainer,
  velocityFactor = 1,
  separator = "·",
  rowClassName,
  className,
  ...props
}: ScrollVelocityProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)} {...props}>
      <p className="sr-only">{items.join(". ")}</p>
      {items.map((text, i) => (
        <ScrollVelocityRow
          key={i}
          aria-hidden="true"
          baseVelocity={i % 2 === 0 ? baseVelocity : -baseVelocity}
          scrollContainer={scrollContainer}
          velocityFactor={velocityFactor}
          className={rowClassName}
        >
          <span className="px-[0.3em]">{text}</span>
          <span className="px-[0.3em] text-muted-foreground/60">{separator}</span>
        </ScrollVelocityRow>
      ))}
    </div>
  )
}

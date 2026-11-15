"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { spring as springs } from "@/lib/goodui-motion"

export type AnimatedListProps<T> = Omit<React.ComponentProps<"ul">, "children"> & {
  /** Newest first. New items enter at the top and push the rest down. */
  items: T[]
  /** Stable unique key of an item; a new key is what makes an item animate in. */
  getKey: (item: T) => string
  /** Content of one item; `index` is 0 for the newest. */
  renderItem: (item: T, index: number) => React.ReactNode
  /** Items beyond this count leave the bottom of the stack. */
  maxItems?: number
  /** Dim and shrink older items slightly, like a notification stack. Dimming lowers text contrast, so use text-foreground/75 rather than text-muted-foreground for secondary text. */
  depth?: boolean
  /** Fade the bottom edge out. */
  fadeEdge?: boolean
  /** Accessible name for the live region. */
  label?: string
}

/** Notification stack: new items spring in from the top while older ones glide down and drop off the end. */
export function AnimatedList<T>({
  items,
  getKey,
  renderItem,
  maxItems = 5,
  depth = false,
  fadeEdge = false,
  label = "Notifications",
  className,
  style,
  ...props
}: AnimatedListProps<T>) {
  const reduce = useReducedMotion() ?? false
  const visible = items.slice(0, maxItems)
  const spring = reduce ? { duration: 0 } : springs.ui

  return (
    // A plain list (so <li> children stay valid) that is also a polite live region announcing new items.
    <ul
      aria-live="polite"
      aria-relevant="additions"
      aria-label={label}
      className={cn("relative flex w-full flex-col gap-2", className)}
      style={
        fadeEdge
          ? {
              maskImage: "linear-gradient(to bottom, black 70%, transparent)",
              WebkitMaskImage: "linear-gradient(to bottom, black 70%, transparent)",
              ...style,
            }
          : style
      }
      {...props}
    >
      <AnimatePresence initial={false} mode="popLayout">
        {visible.map((item, i) => {
          const dim = depth ? Math.min(i, 4) : 0
          // 6% per step keeps text in older items readable (at most 24% dimmer).
          return (
            <motion.li
              key={getKey(item)}
              layout={reduce ? false : "position"}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: -24, scale: 0.92, filter: "blur(4px)" }}
              animate={{ opacity: 1 - dim * 0.06, y: 0, scale: 1 - dim * 0.02, filter: "blur(0px)" }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9, filter: "blur(4px)", transition: { duration: 0.2 } }}
              transition={spring}
              style={{ transformOrigin: "50% 0%" }}
              className="list-none"
            >
              {renderItem(item, i)}
            </motion.li>
          )
        })}
      </AnimatePresence>
    </ul>
  )
}

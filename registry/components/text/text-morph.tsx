"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { spring } from "@/lib/goodui-motion"

export type TextMorphProps = Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> & {
  /** The current string; change it to morph. Characters both strings share slide into place. */
  text: string
}

/**
 * Morphs between strings character by character: characters both strings share slide to their new place,
 * the rest fade and blur in or out. Screen readers get the current string.
 */
export function TextMorph({ text, className, ...props }: TextMorphProps) {
  const reduce = useReducedMotion() ?? false
  const id = React.useId()

  // Key each character by itself plus its occurrence ("o-0", "o-1") so shared letters keep their identity.
  const chars = React.useMemo(() => {
    const seen: Record<string, number> = {}
    return Array.from(text).map((ch) => {
      const n = (seen[ch] = (seen[ch] ?? -1) + 1)
      return { ch, key: `${id}-${ch}-${n}` }
    })
  }, [text, id])

  const layout = reduce ? { duration: 0 } : spring.ui

  return (
    <span className={cn("relative inline-flex whitespace-pre", className)} {...props}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="relative inline-flex">
        <AnimatePresence mode="popLayout" initial={false}>
          {chars.map(({ ch, key }) => (
            <motion.span
              key={key}
              layout="position"
              className="inline-block"
              initial={reduce ? { opacity: 0 } : { opacity: 0, filter: "blur(4px)", scale: 0.9 }}
              animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, filter: "blur(4px)", scale: 0.9 }}
              transition={{ layout, default: reduce ? { duration: 0 } : { duration: 0.22, ease: "easeOut" } }}
            >
              {ch === " " ? " " : ch}
            </motion.span>
          ))}
        </AnimatePresence>
      </span>
    </span>
  )
}

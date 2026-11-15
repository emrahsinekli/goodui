"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import { GooduiTokens, spring } from "@/lib/goodui-motion"

/*
 * "Aiko is typing" with three dots that wave. Bubble, inline and dots-only variants, one or several names,
 * and an enter/exit animation driven by `show`. Reduced motion keeps the dots still.
 */

const CSS = `
@keyframes pc-typing-wave{0%,60%,100%{transform:translateY(0);opacity:.45}30%{transform:translateY(-35%);opacity:1}}
.pc-typing-dot{animation:pc-typing-wave 1.2s ease-in-out infinite}
.pc-typing-dot:nth-child(2){animation-delay:.15s}
.pc-typing-dot:nth-child(3){animation-delay:.3s}
@media (prefers-reduced-motion:reduce){.pc-typing-dot{animation:none;opacity:.7}}
`

export type TypingIndicatorLabels = {
  /** Builds the sentence from the names: "Aiko is typing", "Aiko and Sam are typing". */
  typing: (names: string[]) => string
  /** Used when no name is given. */
  someone: string
}
const list = (names: string[]) => (names.length <= 1 ? (names[0] ?? "") : names.length === 2 ? `${names[0]} and ${names[1]}` : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`)
const DEFAULT_LABELS: TypingIndicatorLabels = { typing: (names) => (names.length ? `${list(names)} ${names.length > 1 ? "are" : "is"} typing` : "Typing"), someone: "Someone" }

export type TypingIndicatorProps = Omit<React.ComponentProps<"div">, "children" | "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart"> & {
  /** Who is typing. */
  names?: string | string[]
  /** Mount and unmount with an animation. */
  show?: boolean
  /** bubble: a chat bubble with the dots. inline: dots and the sentence on one line. dots: dots only (the sentence stays for screen readers). */
  variant?: "bubble" | "inline" | "dots"
  size?: "sm" | "md" | "lg"
  /** Avatar or icon shown before the bubble. */
  avatar?: React.ReactNode
  /** Text for screen readers; pass translations here. */
  labels?: Partial<TypingIndicatorLabels>
}

const DOT = { sm: "size-1", md: "size-1.5", lg: "size-2" }
const GAP = { sm: "gap-0.5", md: "gap-1", lg: "gap-1.5" }
const TEXT = { sm: "text-[11px]", md: "text-xs", lg: "text-sm" }

/** Three-dot wave with an "is typing" sentence. */
export function TypingIndicator({ names, show = true, variant = "bubble", size = "md", avatar, labels, className, ...props }: TypingIndicatorProps) {
  const l = useLabels("typing-indicator", DEFAULT_LABELS, labels)
  const reduce = useReducedMotion() ?? false
  const people = names === undefined ? [] : Array.isArray(names) ? names : [names]
  const sentence = l.typing(people)
  const dots = (
    <span className={cn("inline-flex items-center", GAP[size])} aria-hidden="true">
      <span className={cn("pc-typing-dot rounded-full bg-current", DOT[size])} />
      <span className={cn("pc-typing-dot rounded-full bg-current", DOT[size])} />
      <span className={cn("pc-typing-dot rounded-full bg-current", DOT[size])} />
    </span>
  )

  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          key="typing"
          role="status"
          aria-live="polite"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduce ? { opacity: 0, transition: { duration: 0.1 } } : { opacity: 0, scale: 0.9, transition: { duration: 0.14 } }}
          transition={reduce ? { duration: 0 } : spring.ui}
          className={cn("pc-typing inline-flex items-center gap-2 text-muted-foreground", variant === "bubble" ? "origin-bottom-left rtl:origin-bottom-right" : "origin-left rtl:origin-right", className)}
          {...props}
        >
          <GooduiTokens />
          <style href="pc-typing-indicator" precedence="default">
            {CSS}
          </style>
          {variant === "bubble" ? (
            <>
              {avatar && <span className="grid size-7 shrink-0 place-items-center overflow-hidden rounded-full bg-muted [&_img]:size-full [&_svg]:size-4">{avatar}</span>}
              <span className={cn("flex flex-col gap-0.5", TEXT[size])}>
                <span className={cn("inline-flex items-center rounded-2xl rounded-ss-md bg-muted text-foreground", size === "sm" ? "h-7 px-3" : size === "lg" ? "h-10 px-4" : "h-9 px-3.5")}>{dots}</span>
                <span className="ps-1">{sentence}</span>
              </span>
            </>
          ) : (
            <>
              {avatar && <span className="grid size-5 shrink-0 place-items-center overflow-hidden rounded-full bg-muted [&_img]:size-full [&_svg]:size-3">{avatar}</span>}
              <span className="text-foreground">{dots}</span>
              <span className={cn(TEXT[size], variant === "dots" && "sr-only")}>{sentence}</span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

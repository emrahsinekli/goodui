"use client"

import * as React from "react"
import { useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { GooduiTokens } from "@/lib/goodui-motion"

const CSS = `
@keyframes pc-typewriter-blink { 0%, 45% { opacity: 1 } 50%, 95% { opacity: 0 } 100% { opacity: 1 } }
.pc-typewriter-caret { animation: pc-typewriter-blink 1.05s step-end infinite }
.pc-typewriter-caret[data-typing] { animation: none; opacity: 1 }
@media (prefers-reduced-motion: reduce) { .pc-typewriter-caret { animation: none } }
`

export type TypewriterProps = Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> & {
  /** One phrase or a list of phrases typed one after another. */
  phrases: string | string[]
  /** Milliseconds per typed character (lightly randomised so it feels human). */
  typeSpeed?: number
  /** Milliseconds per deleted character. */
  deleteSpeed?: number
  /** Milliseconds a finished phrase stays on screen. */
  pause?: number
  /** Milliseconds before the first character. */
  startDelay?: number
  /** Start again from the first phrase after the last one. */
  loop?: boolean
  /** Show the blinking caret. */
  caret?: boolean
  /** bar is a thin line; block is a terminal cell. */
  caretStyle?: "bar" | "block"
  /** Shown before the typed text and never deleted, e.g. "$" in a terminal. */
  prompt?: React.ReactNode
  /** Classes for the caret, e.g. a color or width. */
  caretClassName?: string
  /** Freeze typing where it is, for example while an input is focused. */
  paused?: boolean
  /** Called with the phrase index each time a phrase is fully typed. */
  onPhraseComplete?: (index: number) => void
}

type State = { index: number; length: number; deleting: boolean; started: boolean }

/** Types and deletes phrases with a caret, best for terminals and command demos; for AI answers use streaming-text. Screen readers get every phrase as plain text. */
export function Typewriter({
  phrases,
  typeSpeed = 55,
  deleteSpeed = 28,
  pause = 1600,
  startDelay = 300,
  loop = true,
  caret = true,
  caretStyle = "bar",
  prompt,
  caretClassName,
  paused = false,
  onPhraseComplete,
  className,
  ...props
}: TypewriterProps) {
  const list = React.useMemo(() => (Array.isArray(phrases) ? phrases : [phrases]), [phrases])
  const reduce = useReducedMotion() ?? false
  const [state, setState] = React.useState<State>({ index: 0, length: 0, deleting: false, started: false })
  const completeRef = React.useRef(onPhraseComplete)
  completeRef.current = onPhraseComplete

  const chars = React.useMemo(() => Array.from(list[state.index] ?? ""), [list, state.index])
  const last = state.index === list.length - 1

  React.useEffect(() => {
    if (paused || list.length === 0) return
    let t: ReturnType<typeof setTimeout>

    // Reduced motion: show whole phrases and swap them without typing.
    if (reduce) {
      if (state.length !== chars.length) {
        setState((s) => ({ ...s, length: chars.length, started: true }))
        return
      }
      if (list.length > 1 && (loop || !last)) {
        t = setTimeout(() => setState((s) => ({ ...s, index: (s.index + 1) % list.length, length: Array.from(list[(s.index + 1) % list.length]!).length })), pause * 1.5)
      }
      return () => clearTimeout(t)
    }

    if (!state.deleting) {
      if (state.length < chars.length) {
        const wait = !state.started ? startDelay : typeSpeed * (0.6 + Math.random() * 0.8)
        t = setTimeout(() => setState((s) => ({ ...s, length: s.length + 1, started: true })), wait)
      } else {
        completeRef.current?.(state.index)
        if (last && !loop) return
        if (list.length === 1 && !loop) return
        t = setTimeout(() => setState((s) => ({ ...s, deleting: true })), pause)
      }
    } else if (state.length > 0) {
      t = setTimeout(() => setState((s) => ({ ...s, length: s.length - 1 })), deleteSpeed)
    } else {
      t = setTimeout(() => setState((s) => ({ ...s, deleting: false, index: (s.index + 1) % list.length })), typeSpeed * 3)
    }
    return () => clearTimeout(t)
  }, [state, chars.length, list, last, loop, pause, paused, reduce, startDelay, typeSpeed, deleteSpeed])

  const typing = state.deleting || (state.length > 0 && state.length < chars.length)

  return (
    <span className={cn("whitespace-pre-wrap", className)} {...props}>
      <GooduiTokens />
      <style href="pc-typewriter" precedence="default">
        {CSS}
      </style>
      <span className="sr-only">{list.join(" ")}</span>
      {prompt != null && <span aria-hidden="true" className="me-[1ch] select-none opacity-60">{prompt}</span>}
      <span aria-hidden="true">{chars.slice(0, state.length).join("")}</span>
      {caret && (
        <span
          aria-hidden="true"
          data-typing={typing ? "" : undefined}
          className={cn("pc-typewriter-caret ms-[0.06em] inline-block h-[1.05em] translate-y-[0.15em] bg-current align-baseline", caretStyle === "bar" ? "w-[2px] rounded-full" : "w-[1ch] rounded-[1px] opacity-80", caretClassName)}
        />
      )}
    </span>
  )
}

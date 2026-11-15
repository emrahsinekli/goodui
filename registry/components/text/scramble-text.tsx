"use client"

import * as React from "react"
import { useInView, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=<>/"

export type ScrambleTextProps = Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> & {
  /** The final text; it is rendered as-is on the server and before the first run. */
  text: string
  /** When to play: on mount, when scrolled into view, on hover/focus (of the text or its closest link/button), or only via `replay`. */
  trigger?: "mount" | "view" | "hover" | "manual"
  /** Change this value (e.g. a counter) to play again. */
  replay?: number | string
  /** Milliseconds until the last character resolves. */
  duration?: number
  /** Milliseconds between glyph changes. */
  speed?: number
  /** Glyphs used while scrambling. */
  characters?: string
  /** Classes for the not-yet-resolved part (default: 60% opacity of the current color). */
  scrambledClassName?: string
  /** Called when the last character has resolved. */
  onComplete?: () => void
}

/**
 * Scrambles through random glyphs, then resolves left to right. Renders the real text on the server and before
 * the first run; randomness only happens after mount. Static for reduced motion.
 */
export function ScrambleText({
  text,
  trigger = "mount",
  replay,
  duration = 900,
  speed = 45,
  characters = GLYPHS,
  scrambledClassName,
  onComplete,
  className,
  onPointerEnter,
  onFocus,
  ...props
}: ScrambleTextProps) {
  const reduce = useReducedMotion() ?? false
  const ref = React.useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })
  const [frame, setFrame] = React.useState<{ done: string; tail: string } | null>(null)
  const raf = React.useRef(0)
  const running = React.useRef(false)
  const completeRef = React.useRef(onComplete)
  completeRef.current = onComplete

  const play = React.useCallback(() => {
    if (reduce) return
    cancelAnimationFrame(raf.current)
    running.current = true
    const chars = Array.from(text)
    const n = chars.length
    const start = performance.now()
    let lastSwap = -Infinity
    let tail = ""
    let resolved = -1
    const random = () => characters[Math.floor(Math.random() * characters.length)] ?? ""
    const tick = (now: number) => {
      const r = Math.min(n, Math.floor(((now - start) / duration) * (n + 1)))
      if (r >= n) {
        running.current = false
        setFrame(null)
        completeRef.current?.()
        return
      }
      if (now - lastSwap >= speed || r !== resolved) {
        if (now - lastSwap >= speed) {
          lastSwap = now
          tail = chars
            .slice(r)
            .map((c) => (/\s/.test(c) ? c : random()))
            .join("")
        } else {
          tail = Array.from(tail).slice(r - resolved).join("")
        }
        resolved = r
        setFrame({ done: chars.slice(0, r).join(""), tail })
      }
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
  }, [text, duration, speed, characters, reduce])

  React.useEffect(() => () => cancelAnimationFrame(raf.current), [])

  // The span itself is not focusable, so with trigger="hover" it also listens to its closest link or button.
  const playRef = React.useRef(play)
  playRef.current = play
  React.useEffect(() => {
    if (trigger !== "hover") return
    const host = ref.current?.parentElement?.closest<HTMLElement>("a[href], button, summary, [tabindex], [role=button], [role=link], [role=tab], [role=menuitem]")
    if (!host) return
    const onIn = () => {
      if (!running.current) playRef.current()
    }
    host.addEventListener("focusin", onIn)
    host.addEventListener("pointerenter", onIn)
    return () => {
      host.removeEventListener("focusin", onIn)
      host.removeEventListener("pointerenter", onIn)
    }
  }, [trigger])

  React.useEffect(() => {
    if (trigger === "mount") play()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, text])

  React.useEffect(() => {
    if (trigger === "view" && inView) play()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, inView])

  const first = React.useRef(true)
  React.useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    play()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replay])

  return (
    <span
      ref={ref}
      className={cn("whitespace-pre-wrap", className)}
      onPointerEnter={(e) => {
        if (trigger === "hover" && !running.current) play()
        onPointerEnter?.(e)
      }}
      onFocus={(e) => {
        if (trigger === "hover" && !running.current) play()
        onFocus?.(e)
      }}
      {...props}
    >
      <span className="sr-only">{text}</span>
      {frame ? (
        <span aria-hidden="true">
          {frame.done}
          {/* Dimmed with opacity, not a muted color, so the glyphs keep contrast on muted or tinted backgrounds. */}
          <span className={cn("opacity-60", scrambledClassName)}>{frame.tail}</span>
        </span>
      ) : (
        <span aria-hidden="true">{text}</span>
      )}
    </span>
  )
}

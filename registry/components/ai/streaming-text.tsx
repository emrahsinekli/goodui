"use client"

import * as React from "react"
import { useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import { GooduiTokens } from "@/lib/goodui-motion"

/*
 * Reveals text the way a model streams it: tokens arrive at a steady rate and settle out of a 4px blur, with no caret
 * by default (a cursor is a prop). Pass the full text you have so far; as the string grows (SSE chunks) the reveal
 * catches up smoothly, so jittery chunk sizes read like one calm stream. The rest of the current word is laid out
 * invisibly, so a word never starts on one line and jumps to the next.
 */

const CSS = `
@keyframes pc-stream-blink{0%,45%{opacity:1}50%,95%{opacity:0}100%{opacity:1}}
@keyframes pc-stream-in{from{opacity:0;filter:blur(4px)}to{opacity:1;filter:blur(0)}}
@keyframes pc-stream-pulse{0%,100%{transform:scale(.7);opacity:.5}50%{transform:scale(1);opacity:1}}
.pc-stream-tail{animation:pc-stream-in .42s var(--pc-ease-out) both}
.pc-stream-cursor{animation:pc-stream-blink 1s step-end infinite}
.pc-stream-cursor[data-busy]{animation:none;opacity:1}
.pc-stream-cursor[data-style=dot][data-busy]{animation:pc-stream-pulse .9s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.pc-stream-tail,.pc-stream-cursor,.pc-stream-cursor[data-style=dot][data-busy]{animation:none;opacity:1;transform:none}}
`

export type StreamingTextLabels = { streaming: string }
const DEFAULT_LABELS: StreamingTextLabels = { streaming: "Streaming" }

export type StreamingTextProps = Omit<React.ComponentProps<"span">, "children"> & {
  /** All the text received so far. Growing it continues the stream; a different string starts over. */
  text: string
  /** Characters per second at a steady state. When a lot of text is waiting the reveal speeds up so it catches up within about a second. */
  speed?: number
  /** Reveal unit: single characters or whole words. */
  by?: "char" | "word"
  /** false pauses the reveal where it is (a Stop button); true resumes. */
  playing?: boolean
  /** More text may still arrive: the cursor stays and blinks while waiting. Set false once the response is complete. */
  streaming?: boolean
  /** Cursor style, or false for none (the default). */
  cursor?: "bar" | "block" | "dot" | false
  /** Keep the cursor after the text is complete and not streaming. */
  cursorWhenDone?: boolean
  /** New tokens fade in from a 4px blur instead of popping. */
  fade?: boolean
  /** Characters already visible at mount, or "all" to show restored history without replaying it. */
  initialRevealed?: number | "all"
  /** Change it to replay from the start. */
  resetKey?: React.Key
  /** Called when every character of `text` is visible and `streaming` is false. */
  onComplete?: () => void
  /** Called as the reveal advances, with visible and total character counts. */
  onProgress?: (revealed: number, total: number) => void
  /** Text for screen readers; pass translations here. */
  labels?: Partial<StreamingTextLabels>
}

const SPACE = /\s/

// Index just past the next word (leading spaces + the word) starting at `from`.
function wordEnd(chars: string[], from: number) {
  let i = from
  while (i < chars.length && SPACE.test(chars[i] ?? "")) i++
  while (i < chars.length && !SPACE.test(chars[i] ?? "")) i++
  return i
}

// Reduced motion: whole sentences (or ~70-character chunks) appear at once.
function chunkEnd(chars: string[], from: number) {
  const limit = Math.min(chars.length, from + 110)
  for (let i = from + 1; i < limit; i++) {
    const c = chars[i] ?? ""
    if (c === "\n" || ((c === "." || c === "!" || c === "?") && SPACE.test(chars[i + 1] ?? " "))) return i + 1
  }
  return Math.min(chars.length, from + 70)
}

/** Token-by-token text reveal with a soft blur, stop/resume and smooth catch-up for live streams. */
export function StreamingText({
  text,
  speed = 60,
  by = "char",
  playing = true,
  streaming = false,
  cursor = false,
  cursorWhenDone = false,
  fade = true,
  initialRevealed = 0,
  resetKey,
  onComplete,
  onProgress,
  labels,
  className,
  ...props
}: StreamingTextProps) {
  const l = useLabels("streaming-text", DEFAULT_LABELS, labels)
  const prefersReduced = useReducedMotion()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  const reduce = mounted && !!prefersReduced

  const chars = React.useMemo(() => Array.from(text), [text])
  const total = chars.length
  const [revealed, setRevealed] = React.useState(() => (initialRevealed === "all" ? total : Math.min(initialRevealed, total)))
  const revealedRef = React.useRef(revealed)

  // A text that no longer starts with what was shown is a new message: start over.
  const [prevText, setPrevText] = React.useState(text)
  if (prevText !== text) {
    setPrevText(text)
    const shownSoFar = Array.from(prevText).slice(0, revealed).join("")
    if (!text.startsWith(shownSoFar)) setRevealed(0)
    else if (revealed > total) setRevealed(total)
  }

  const firstReset = React.useRef(true)
  React.useEffect(() => {
    if (firstReset.current) {
      firstReset.current = false
      return
    }
    setRevealed(0)
  }, [resetKey])

  React.useEffect(() => {
    revealedRef.current = revealed
  }, [revealed])

  const progressRef = React.useRef(onProgress)
  progressRef.current = onProgress
  React.useEffect(() => {
    progressRef.current?.(Math.min(revealed, total), total)
  }, [revealed, total])

  React.useEffect(() => {
    if (!playing || revealedRef.current >= total) return
    const commit = (next: number) => {
      revealedRef.current = next
      setRevealed(next)
    }
    if (reduce) {
      const id = window.setInterval(() => {
        if (document.hidden) return
        const next = chunkEnd(chars, revealedRef.current)
        commit(next)
        if (next >= total) window.clearInterval(id)
      }, 140)
      return () => window.clearInterval(id)
    }
    let raf = 0
    let last = 0
    let budget = 0
    const tick = (now: number) => {
      if (last) {
        const dt = Math.min(0.1, (now - last) / 1000)
        const backlog = total - revealedRef.current
        // Steady speed, but never more than about a second behind a live stream.
        budget += dt * Math.max(speed, backlog / 0.9)
        const cur = revealedRef.current
        let next = cur
        if (by === "word") {
          for (;;) {
            const e = wordEnd(chars, next)
            if (e === next || e - cur > budget) break
            next = e
          }
        } else next = Math.min(total, cur + Math.floor(budget))
        if (next > cur) {
          budget -= next - cur
          commit(next)
        }
      }
      last = now
      if (revealedRef.current < total) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, total, chars, speed, by, reduce])

  const shown = Math.min(revealed, total)
  const done = shown >= total
  const completeRef = React.useRef(onComplete)
  completeRef.current = onComplete
  const announced = React.useRef<string | null>(null)
  React.useEffect(() => {
    if (done && !streaming && announced.current !== text) {
      announced.current = text
      completeRef.current?.()
    }
    if (!done) announced.current = null
  }, [done, streaming, text])

  const busy = playing && (!done || streaming)
  const showCursor = cursor && (busy || !done || (cursorWhenDone && done))
  const animated = !done || streaming
  // The tail is what is still fading, about 0.45s of text at the current pace, so catching up never cuts a fade short.
  const TAIL = Math.min(96, Math.max(24, Math.ceil(Math.max(speed, (total - shown) / 0.9) * 0.45)))
  const settledEnd = fade && !reduce ? Math.max(0, shown - TAIL) : shown

  return (
    <span className={cn("whitespace-pre-wrap", className)} {...props}>
      <GooduiTokens />
      <style href="pc-streaming-text" precedence="default">
        {CSS}
      </style>
      {animated && <span className="sr-only">{text}</span>}
      <span aria-hidden={animated ? true : undefined}>
        {chars.slice(0, settledEnd).join("")}
        {settledEnd < shown &&
          chars.slice(settledEnd, shown).map((ch, i) => (
            <span key={settledEnd + i} className="pc-stream-tail">
              {ch}
            </span>
          ))}
        {!done && !showCursor && !SPACE.test(chars[shown - 1] ?? " ") && <span className="invisible">{chars.slice(shown, wordEnd(chars, shown)).join("")}</span>}
      </span>
      {showCursor && (
        <span
          aria-hidden="true"
          data-busy={busy ? "" : undefined}
          data-style={cursor}
          className={cn(
            "pc-stream-cursor ms-[0.1em] inline-block bg-current align-text-bottom",
            cursor === "bar" && "h-[1.1em] w-[2px] rounded-full",
            cursor === "block" && "h-[1.1em] w-[0.55em] rounded-[2px] opacity-80",
            cursor === "dot" && "mb-[0.15em] size-[0.55em] rounded-full",
          )}
        />
      )}
      {busy && <span className="sr-only">{l.streaming}</span>}
    </span>
  )
}

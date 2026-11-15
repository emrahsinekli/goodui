"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import type { SoundName } from "@/lib/goodui-sounds"
import { GooduiTokens, spring } from "@/lib/goodui-motion"

export type StatefulButtonState = "idle" | "loading" | "success" | "error"

export type StatefulButtonLabels = {
  /** Announced (sr-only) while loading. */
  loading: string
  /** Announced (sr-only) on success. */
  success: string
  /** Announced (sr-only) on failure. */
  error: string
  /** Default visible text after success (successText overrides it). */
  successText: string
  /** Default visible text after a failure (errorText overrides it). */
  errorText: string
}
const DEFAULT_LABELS: StatefulButtonLabels = {
  loading: "Working…",
  success: "Done",
  error: "Something went wrong",
  successText: "Done",
  errorText: "Try again",
}

const VARIANTS = {
  default: "bg-primary text-primary-foreground shadow-[var(--pc-e1)] hover:bg-primary/90",
  outline: "border bg-background text-foreground shadow-xs hover:bg-muted dark:bg-input/30 dark:hover:bg-input/50",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
} as const

const SIZES = {
  sm: "h-8 text-xs [&_svg]:size-3.5",
  md: "h-10 text-sm [&_svg]:size-4",
  lg: "h-12 text-base [&_svg]:size-5",
} as const

const PAD = { sm: "px-3 gap-1.5", md: "px-5 gap-2", lg: "px-7 gap-2" } as const

export type StatefulButtonProps = Omit<
  React.ComponentProps<"button">,
  "onClick" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"
> & {
  /** Return a promise to drive the states: pending → loading, resolved → success, rejected → error. */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void | Promise<unknown>
  /** Control the state yourself instead. */
  state?: StatefulButtonState
  /** Called on every state change, including the automatic return to idle. */
  onStateChange?: (state: StatefulButtonState) => void
  /** "default" | "outline" | "secondary": idle look; success turns emerald and error destructive in every variant. */
  variant?: keyof typeof VARIANTS
  /** "sm" | "md" | "lg": height, text size and padding. */
  size?: keyof typeof SIZES
  /** Shown next to the spinner while loading; empty by default (spinner only). */
  loadingText?: React.ReactNode
  /** Shown next to the drawn check after success. */
  successText?: React.ReactNode
  /** Shown next to the drawn cross after a failure; clicking again retries. */
  errorText?: React.ReactNode
  /** Milliseconds before success/error returns to idle; 0 keeps it. */
  resetAfter?: number
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<StatefulButtonLabels>
  /** Plays "tap" on click, then "success" or "error" with the result, when the visitor has sounds on (lib/goodui-sounds); a sound name replaces the tap. Off by default. */
  sound?: boolean | SoundName
}

// Optional UI sound: the sound module is loaded only when `sound` is on, so silent apps pay nothing.
function useCue(sound: boolean | SoundName | undefined) {
  React.useEffect(() => {
    if (sound) void import("@/lib/goodui-sounds")
  }, [sound])
  return React.useCallback(
    (fallback: SoundName, o?: { rate?: number; exact?: boolean }) => {
      if (!sound) return
      void import("@/lib/goodui-sounds").then((m) => m.play(sound === true || o?.exact ? fallback : sound, { rate: o?.rate }))
    },
    [sound],
  )
}

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="animate-spin motion-reduce:animate-[spin_1.5s_linear_infinite]" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function DrawCheck({ reduce }: { reduce: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <motion.path
        d="M5 12.5 10 17.5 19.5 7"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.08, ease: "easeOut" }}
      />
    </svg>
  )
}

function DrawX({ reduce }: { reduce: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {["M7 7l10 10", "M17 7 7 17"].map((d, i) => (
        <motion.path
          key={d}
          d={d}
          stroke="currentColor"
          strokeWidth="2.8"
          strokeLinecap="round"
          initial={reduce ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.18, delay: 0.06 + i * 0.1, ease: "easeOut" }}
        />
      ))}
    </svg>
  )
}

/** Button that morphs idle → loading → success or error, with a smooth width change and a shake on failure. */
export function StatefulButton({
  onClick,
  state: stateProp,
  onStateChange,
  variant = "default",
  size = "md",
  loadingText,
  successText,
  errorText,
  resetAfter = 2200,
  labels,
  sound,
  className,
  children,
  disabled,
  ...props
}: StatefulButtonProps) {
  const l = useLabels("stateful-button", DEFAULT_LABELS, labels)
  const sr: Record<StatefulButtonState, string> = { idle: "", loading: l.loading, success: l.success, error: l.error }
  const reduce = useReducedMotion() ?? false
  const [inner, setInner] = React.useState<StatefulButtonState>("idle")
  const state = stateProp ?? inner
  const cue = useCue(sound)
  // The result sound follows the state, so it also plays when the parent controls `state`.
  const prevState = React.useRef(state)
  React.useEffect(() => {
    if (prevState.current === state) return
    prevState.current = state
    if (state === "success" || state === "error") cue(state, { exact: true })
  }, [state, cue])
  const measureRef = React.useRef<HTMLSpanElement>(null)
  const [width, setWidth] = React.useState<number | null>(null)
  const alive = React.useRef(true)

  React.useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  React.useEffect(() => {
    const el = measureRef.current
    if (!el) return
    // Button width = content + the button's own borders (outline variant).
    const ro = new ResizeObserver(() => {
      const btn = el.parentElement
      const border = btn ? btn.offsetWidth - btn.clientWidth : 0
      setWidth(el.offsetWidth + border)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const set = React.useCallback(
    (s: StatefulButtonState) => {
      if (!alive.current) return
      if (stateProp === undefined) setInner(s)
      onStateChange?.(s)
    },
    [stateProp, onStateChange],
  )

  React.useEffect(() => {
    if ((state !== "success" && state !== "error") || !resetAfter || stateProp !== undefined) return
    const t = window.setTimeout(() => set("idle"), resetAfter)
    return () => window.clearTimeout(t)
  }, [state, resetAfter, stateProp, set])

  const busy = state === "loading" || state === "success"

  const handle = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (busy) return
    cue("tap")
    const r = onClick?.(e)
    if (r && typeof (r as Promise<unknown>).then === "function") {
      set("loading")
      ;(r as Promise<unknown>).then(
        () => set("success"),
        () => set("error"),
      )
    }
  }

  const content =
    state === "loading" ? (
      <>
        <Spinner />
        {loadingText}
      </>
    ) : state === "success" ? (
      <>
        <DrawCheck reduce={reduce} />
        {successText ?? l.successText}
      </>
    ) : state === "error" ? (
      <>
        <DrawX reduce={reduce} />
        {errorText ?? l.errorText}
      </>
    ) : (
      children
    )

  return (
    <>
      <GooduiTokens />
      <motion.button
        data-slot="button"
        data-state={state}
        aria-busy={state === "loading" || undefined}
        aria-disabled={busy || undefined}
        disabled={disabled}
        onClick={handle}
        initial={false}
        animate={{
          width: width ?? "auto",
          x: state === "error" && !reduce ? [0, -8, 8, -5, 5, -2, 0] : 0,
        }}
        transition={{
          width: reduce ? { duration: 0 } : spring.ui,
          x: { duration: 0.42, ease: "easeInOut" },
        }}
        whileTap={busy || reduce ? undefined : { scale: 0.97 }}
        className={cn(
          "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg font-medium whitespace-nowrap transition-[background-color,color,box-shadow,border-color] duration-200 outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
          VARIANTS[variant],
          // emerald-700 and a darkened destructive in dark mode keep white text at 4.5:1.
          state === "success" && "border-transparent bg-emerald-700 text-white hover:bg-emerald-700",
          state === "error" &&
            "border-transparent bg-destructive text-white hover:bg-destructive dark:bg-[color-mix(in_oklab,var(--destructive)_75%,black)] dark:hover:bg-[color-mix(in_oklab,var(--destructive)_75%,black)]",
          state === "loading" && "cursor-progress",
          SIZES[size],
          className,
        )}
        {...props}
      >
        <span ref={measureRef} className={cn("inline-flex items-center", PAD[size])}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={state}
              className="inline-flex items-center gap-[inherit]"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -14, filter: "blur(3px)" }}
              transition={reduce ? { duration: 0.1 } : spring.snap}
            >
              {content}
            </motion.span>
          </AnimatePresence>
        </span>
      </motion.button>
      <span role="status" aria-live="polite" className="sr-only">
        {sr[state]}
      </span>
    </>
  )
}

"use client"

import * as React from "react"
import { animate, motion, useAnimate, useMotionValue, useReducedMotion, useTransform, type AnimationPlaybackControls } from "motion/react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import type { SoundName } from "@/lib/goodui-sounds"
import { GooduiTokens, spring } from "@/lib/goodui-motion"

// The destructive text and fill are darkened just enough to keep 4.5:1 contrast in light and dark.
const VARIANTS = {
  destructive: {
    base: "border border-destructive/30 bg-destructive/10 text-[color-mix(in_oklab,var(--destructive)_85%,black)] dark:bg-destructive/20 dark:text-destructive",
    fill: "bg-destructive text-white dark:bg-[color-mix(in_oklab,var(--destructive)_75%,black)]",
  },
  default: {
    base: "border bg-muted text-foreground",
    fill: "bg-primary text-primary-foreground",
  },
  outline: {
    base: "border bg-background text-foreground shadow-xs dark:bg-input/30",
    fill: "bg-foreground text-background",
  },
} as const

const SIZES = {
  sm: "h-8 rounded-md px-3 text-xs gap-1.5 [&_svg]:size-3.5",
  md: "h-10 rounded-lg px-4 text-sm gap-2 [&_svg]:size-4",
  lg: "h-12 rounded-xl px-6 text-base gap-2 [&_svg]:size-5",
} as const

export type HoldToConfirmLabels = {
  /** sr-only instructions linked with aria-describedby; gets the hold time in seconds. */
  instructions: (seconds: number) => string
  /** Announced after confirming when confirmedLabel is not a string. */
  confirmed: string
  /** Default visible text after confirming; the confirmedLabel prop overrides it. */
  confirmedLabel: string
  /** Default hint after a quick tap; the tapHint prop overrides it. */
  tapHint: string
}
const DEFAULT_LABELS: HoldToConfirmLabels = {
  instructions: (seconds) => `Press and hold for ${seconds} seconds to confirm.`,
  confirmed: "Confirmed",
  confirmedLabel: "Done",
  tapHint: "Press and hold",
}

export type HoldToConfirmProps = Omit<
  React.ComponentProps<"button">,
  "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd" | "onClick"
> & {
  /** Milliseconds the button must be held. */
  duration?: number
  /** Called once when the hold completes. There is no onClick: a tap only shows the hint. */
  onConfirm?: () => void
  /** "destructive" | "default" | "outline": resting look and fill color (red, primary, foreground). */
  variant?: keyof typeof VARIANTS
  /** "sm" | "md" | "lg": height, padding and corner radius. */
  size?: keyof typeof SIZES
  /** Label while holding. */
  holdingLabel?: React.ReactNode
  /** Label after confirming. */
  confirmedLabel?: React.ReactNode
  /** Shown briefly when the button is only tapped. */
  tapHint?: React.ReactNode
  /** Milliseconds before returning to idle after confirming; 0 stays confirmed. */
  resetAfter?: number
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<HoldToConfirmLabels>
  /** Plays a "tick" when the hold starts and "confirm" when it completes, when the visitor has sounds on (lib/goodui-sounds); a sound name replaces the confirm. Off by default. */
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

/**
 * Press-and-hold button for destructive actions: a fill sweeps across while held, releasing early rewinds it.
 * Works with pointer, touch and keyboard (hold Space or Enter).
 */
export function HoldToConfirm({
  duration = 1500,
  onConfirm,
  variant = "destructive",
  size = "md",
  holdingLabel,
  confirmedLabel: confirmedLabelProp,
  tapHint: tapHintProp,
  resetAfter = 2000,
  labels,
  sound,
  disabled,
  className,
  children,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  onPointerCancel,
  onKeyDown,
  onKeyUp,
  onBlur,
  onContextMenu,
  ...props
}: HoldToConfirmProps) {
  const l = useLabels("hold-to-confirm", DEFAULT_LABELS, labels)
  const confirmedLabel = confirmedLabelProp ?? l.confirmedLabel
  const tapHint = tapHintProp ?? l.tapHint
  const reduce = useReducedMotion() ?? false
  const cue = useCue(sound)
  const progress = useMotionValue(0)
  const [scope, animateBtn] = useAnimate<HTMLButtonElement>()
  // The fill sweeps from the inline start: left to right, or right to left under dir="rtl".
  const [rtl, setRtl] = React.useState(false)
  React.useLayoutEffect(() => {
    if (scope.current) setRtl(getComputedStyle(scope.current).direction === "rtl")
  }, [scope])
  const clip = useTransform(progress, (p) => (rtl ? `inset(0 0 0 ${(1 - p) * 100}%)` : `inset(0 ${(1 - p) * 100}% 0 0)`))
  const [phase, setPhaseState] = React.useState<"idle" | "holding" | "confirmed">("idle")
  const [hint, setHint] = React.useState(false)
  const run = React.useRef<AnimationPlaybackControls | null>(null)
  // Pointer events can arrive before a re-render, so the current phase also lives in a ref.
  const phaseRef = React.useRef(phase)
  const setPhase = (p: "idle" | "holding" | "confirmed") => {
    phaseRef.current = p
    setPhaseState(p)
  }
  const timers = React.useRef<number[]>([])
  const uid = React.useId()
  const v = VARIANTS[variant]

  React.useEffect(() => {
    const list = timers.current
    return () => {
      list.forEach((t) => window.clearTimeout(t))
      run.current?.stop()
    }
  }, [])

  const confirm = () => {
    setPhase("confirmed")
    cue("confirm")
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(25)
    if (!reduce && scope.current) animateBtn(scope.current, { scale: [0.97, 1.04, 1] }, { duration: 0.35, ease: "easeOut" })
    onConfirm?.()
    if (resetAfter > 0) {
      timers.current.push(
        window.setTimeout(() => {
          setPhase("idle")
          run.current = animate(progress, 0, { duration: reduce ? 0 : 0.4, ease: "easeOut" })
        }, resetAfter),
      )
    }
  }

  const start = () => {
    if (disabled || phaseRef.current !== "idle") return
    setPhase("holding")
    setHint(false)
    cue("tick", { exact: true })
    if (!reduce && scope.current) animateBtn(scope.current, { scale: 0.97 }, spring.ui)
    run.current?.stop()
    const left = 1 - progress.get()
    run.current = animate(progress, 1, { duration: (duration * left) / 1000, ease: "linear", onComplete: confirm })
  }

  const cancel = () => {
    if (phaseRef.current !== "holding") return
    const p = progress.get()
    run.current?.stop()
    setPhase("idle")
    if (scope.current) animateBtn(scope.current, { scale: 1 }, reduce ? { duration: 0 } : spring.play)
    run.current = animate(progress, 0, reduce ? { duration: 0 } : spring.morph)
    // A quick tap teaches the gesture.
    if (p < 0.2) {
      setHint(true)
      if (!reduce && scope.current) animateBtn(scope.current, { x: [0, -4, 4, -2, 2, 0] }, { duration: 0.35 })
      timers.current.push(window.setTimeout(() => setHint(false), 1400))
    }
  }

  const label = phase === "confirmed" ? confirmedLabel : phase === "holding" && holdingLabel ? holdingLabel : hint ? tapHint : children

  return (
    <>
      <GooduiTokens />
      <motion.button
        ref={scope}
        type="button"
        data-phase={phase}
        disabled={disabled}
        aria-describedby={`${uid}-how`}
        onPointerDown={(e) => {
          if (e.button === 0) start()
          onPointerDown?.(e)
        }}
        onPointerUp={(e) => {
          cancel()
          onPointerUp?.(e)
        }}
        onPointerLeave={(e) => {
          cancel()
          onPointerLeave?.(e)
        }}
        onPointerCancel={(e) => {
          cancel()
          onPointerCancel?.(e)
        }}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault()
            if (!e.repeat) start()
          }
          onKeyDown?.(e)
        }}
        onKeyUp={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault()
            cancel()
          }
          onKeyUp?.(e)
        }}
        onBlur={(e) => {
          cancel()
          onBlur?.(e)
        }}
        onContextMenu={(e) => {
          e.preventDefault()
          onContextMenu?.(e)
        }}
        className={cn(
          "pc-press relative inline-flex shrink-0 touch-manipulation items-center justify-center overflow-hidden font-medium whitespace-nowrap transition-[background-color,box-shadow,color] outline-none select-none [-webkit-touch-callout:none] focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
          v.base,
          SIZES[size],
          className,
        )}
        {...props}
      >
        <span className="inline-flex items-center gap-[inherit]">{label}</span>
        {/* The fill carries its own copy of the label, so text color flips exactly at the fill edge. */}
        <motion.span
          aria-hidden="true"
          className={cn("pointer-events-none absolute inset-0 flex items-center justify-center gap-[inherit]", v.fill)}
          style={{ clipPath: clip, WebkitClipPath: clip }}
        >
          <span className="inline-flex items-center gap-[inherit]">{label}</span>
        </motion.span>
      </motion.button>
      <span id={`${uid}-how`} className="sr-only">
        {l.instructions(Math.round(duration / 100) / 10)}
      </span>
      <span role="status" aria-live="assertive" className="sr-only">
        {phase === "confirmed" ? (typeof confirmedLabel === "string" ? confirmedLabel : l.confirmed) : ""}
      </span>
    </>
  )
}

"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import { GooduiTokens, spring, ease as easing } from "@/lib/goodui-motion"

export type SuccessCheckProps = Omit<React.ComponentProps<"span">, "children"> & {
  /** "success" draws a check, "error" draws an X. */
  variant?: "success" | "error"
  /** Diameter in px. The burst reaches about 15% beyond it. */
  size?: number
  /** Rays and a ring that shoot outward once the mark lands. */
  burst?: boolean
  /** Seconds before the drawing starts. */
  delay?: number
  /** Change it to play the animation again. */
  playKey?: React.Key
  /** Accessible name. Defaults to "Success" or "Error". */
  label?: string
  /** Draws only the mark and burst, with no circle, and sooner: for a mark on a filled surface such as a button. */
  plain?: boolean
}

const RAYS = Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * Math.PI * 2 - Math.PI / 2 + Math.PI / 8
  return { x1: 26 + Math.cos(a) * 29, y1: 26 + Math.sin(a) * 29, x2: 26 + Math.cos(a) * 34, y2: 26 + Math.sin(a) * 34 }
})

/** Check (or X) in a circle that draws itself in, fills, then pops with a ring burst. For payment and booking results. */
export function SuccessCheck({ variant = "success", size = 72, burst = true, delay = 0, playKey, label, plain = false, className, style, ...props }: SuccessCheckProps) {
  // Read after mount: the server can't know the setting, so the first client render must match it.
  const prefersReduced = useReducedMotion()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  const reduce = mounted && !!prefersReduced
  const error = variant === "error"
  // The circle takes the first .32s; a plain mark starts there instead.
  const d = delay - (plain ? 0.32 : 0)
  // Round caps paint a dot at pathLength 0, so every stroke stays transparent until its own draw starts.
  const t = (base: number, duration: number) =>
    reduce
      ? { duration: 0 }
      : { duration, delay: d + base, ease: easing.inOut, opacity: { duration: 0.01, delay: d + base } }
  const draw = { initial: { pathLength: reduce ? 1 : 0, opacity: reduce ? 1 : 0 }, animate: { pathLength: 1, opacity: 1 } }

  return (
    <span
      role="img"
      aria-label={label ?? (error ? "Error" : "Success")}
      className={cn("relative inline-grid shrink-0 place-items-center", error ? "text-rose-500" : "text-emerald-500", className)}
      style={{ width: size, height: size, ...style }}
      {...props}
    >
      <motion.svg
        key={`${String(playKey ?? "")}-${variant}`}
        viewBox="0 0 52 52"
        width={size}
        height={size}
        fill="none"
        className="overflow-visible"
        aria-hidden="true"
        initial={reduce ? false : { scale: 1 }}
        animate={reduce ? undefined : { scale: [1, 1.08, 1] }}
        transition={reduce ? undefined : { duration: 0.35, delay: d + 0.62, times: [0, 0.4, 1], ease: "easeOut" }}
      >
        {!plain && (
          <>
            <motion.circle
              cx="26"
              cy="26"
              r="24"
              fill="currentColor"
              initial={reduce ? { opacity: 0.14, scale: 1 } : { opacity: 0, scale: 0.6 }}
              animate={{ opacity: 0.14, scale: 1 }}
              transition={reduce ? { duration: 0 } : { ...spring.play, delay: d + 0.28 }}
            />
            <motion.circle
              cx="26"
              cy="26"
              r="24"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              transform="rotate(-90 26 26)"
              {...draw}
              transition={t(0, 0.5)}
            />
          </>
        )}
        {error ? (
          <>
            <motion.path d="M18.5 18.5l15 15" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" {...draw} transition={t(0.42, 0.2)} />
            <motion.path d="M33.5 18.5l-15 15" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" {...draw} transition={t(0.58, 0.2)} />
          </>
        ) : (
          <motion.path
            d="M15.5 27l7 7 14-15"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...draw}
            transition={t(0.42, 0.32)}
          />
        )}
        {burst && !reduce && (
          <>
            <motion.circle
              cx="26"
              cy="26"
              r="24"
              stroke="var(--pc-check-burst,currentColor)"
              strokeWidth="1.5"
              initial={{ opacity: 0, scale: 1 }}
              animate={{ opacity: [0, 0.5, 0], scale: [1, 1, 1.4] }}
              transition={{ duration: 0.7, delay: d + 0.6, times: [0, 0.1, 1], ease: "easeOut" }}
            />
            {RAYS.map((r, i) => (
              <motion.line
                key={i}
                {...r}
                stroke="var(--pc-check-burst,currentColor)"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0, pathOffset: 0, opacity: 0 }}
                // The first keyframe applies during the delay, so it must be invisible.
                animate={{ pathLength: [0, 0, 1, 1], pathOffset: [0, 0, 0, 1], opacity: [0, 1, 1, 0] }}
                transition={{ duration: 0.5, delay: d + 0.62, times: [0, 0.02, 0.45, 1], ease: "easeOut" }}
              />
            ))}
          </>
        )}
      </motion.svg>
    </span>
  )
}

export type SuccessButtonStatus = "idle" | "loading" | "success" | "error"

export type SuccessButtonLabels = { loading: string; success: string; error: string }
const DEFAULT_BUTTON_LABELS: SuccessButtonLabels = { loading: "Working", success: "Done", error: "Failed" }

export type SuccessButtonProps = Omit<React.ComponentProps<typeof motion.button>, "children"> & {
  /** Drive it from your request: idle, then loading, then success or error, then idle again. */
  status?: SuccessButtonStatus
  /** Height in px; the button collapses into a circle of this size. */
  size?: number
  children?: React.ReactNode
  /** Announced to screen readers; pass translations here. */
  labels?: Partial<SuccessButtonLabels>
}

/** The check grows out of the button itself: the label blurs away, the button folds into a circle and the mark draws on it. */
export function SuccessButton({ status = "idle", size = 40, labels, className, style, onClick, children, ...props }: SuccessButtonProps) {
  const l = useLabels("success-check-button", DEFAULT_BUTTON_LABELS, labels)
  const reduce = useReducedMotion() ?? false
  const idle = status === "idle"
  const morph = reduce ? { duration: 0 } : spring.morph
  const swap = {
    initial: reduce ? { opacity: 0 } : { opacity: 0, filter: "blur(4px)" },
    animate: { opacity: 1, filter: "blur(0px)" },
    exit: reduce ? { opacity: 0 } : { opacity: 0, filter: "blur(4px)" },
    transition: { duration: reduce ? 0 : 0.16 },
  }
  return (
    <motion.button
      type="button"
      layout
      data-status={status}
      aria-busy={status === "loading"}
      aria-disabled={!idle}
      onClick={(e) => {
        if (idle) onClick?.(e)
      }}
      animate={{ borderRadius: idle ? 10 : size / 2 }}
      transition={morph}
      className={cn(
        "pc-press relative inline-flex cursor-pointer items-center justify-center bg-primary text-sm font-medium whitespace-nowrap text-primary-foreground shadow-[var(--pc-e1)] transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 data-[status=error]:bg-rose-600 data-[status=error]:text-white data-[status=error]:[--pc-check-burst:var(--color-rose-500)] data-[status=success]:bg-emerald-600 data-[status=success]:text-white data-[status=success]:[--pc-check-burst:var(--color-emerald-500)]",
        idle && "px-5",
        className,
      )}
      style={{ height: size, width: idle ? undefined : size, ...style }}
      {...props}
    >
      <GooduiTokens />
      <AnimatePresence mode="popLayout" initial={false}>
        {status === "idle" ? (
          <motion.span key="idle" layout="position" className="inline-flex items-center gap-2" {...swap}>
            {children}
          </motion.span>
        ) : status === "loading" ? (
          <motion.svg key="loading" viewBox="0 0 24 24" fill="none" className="size-[45%]" aria-hidden="true" animate={{ ...swap.animate, rotate: 360 }} initial={swap.initial} exit={swap.exit} transition={{ ...swap.transition, rotate: { duration: reduce ? 2.4 : 0.8, repeat: Infinity, ease: "linear" } }}>
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".3" strokeWidth="3" />
            <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </motion.svg>
        ) : (
          <motion.span key={status} className="grid place-items-center" {...swap}>
            <SuccessCheck plain variant={status === "error" ? "error" : "success"} size={size} className="text-current" aria-hidden="true" />
          </motion.span>
        )}
      </AnimatePresence>
      <span className="sr-only" role="status">
        {idle ? "" : l[status]}
      </span>
    </motion.button>
  )
}

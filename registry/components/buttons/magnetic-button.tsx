"use client"

import * as React from "react"
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react"
import { cn } from "@/lib/utils"
import { GooduiTokens } from "@/lib/goodui-motion"

const VARIANTS = {
  default: "bg-primary text-primary-foreground shadow-[var(--pc-e1)] hover:bg-primary/90",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  outline: "border bg-background text-foreground shadow-xs hover:bg-muted dark:bg-input/30 dark:hover:bg-input/50",
  ghost: "text-foreground hover:bg-muted",
} as const

const SIZES = {
  sm: "h-8 gap-1.5 rounded-md px-3 text-xs [&_svg]:size-3.5",
  md: "h-10 gap-2 rounded-lg px-5 text-sm [&_svg]:size-4",
  lg: "h-12 gap-2 rounded-xl px-7 text-base [&_svg]:size-5",
  icon: "size-11 rounded-full [&_svg]:size-5",
} as const

const SPRING = { stiffness: 220, damping: 15, mass: 0.6 }

export type MagneticButtonProps = Omit<React.ComponentProps<"button">, "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> & {
  /** "default" | "secondary" | "outline" | "ghost", matching shadcn's button variants. */
  variant?: keyof typeof VARIANTS
  /** "sm" | "md" | "lg" | "icon"; "icon" is a round 44px button. */
  size?: keyof typeof SIZES
  /** Share of the pointer offset the button follows (0–1). */
  strength?: number
  /** Extra share for the label, for a parallax feel. */
  labelStrength?: number
  /** Distance in px outside the button where the pull starts. */
  radius?: number
}

/**
 * Button (and its label, a bit more) pulled toward the pointer when it comes near, springing back when it leaves.
 * Off for touch, coarse pointers, disabled buttons and reduced motion.
 */
export function MagneticButton({
  variant = "default",
  size = "md",
  strength = 0.35,
  labelStrength = 0.2,
  radius = 70,
  className,
  children,
  disabled,
  ...props
}: MagneticButtonProps) {
  const reduce = useReducedMotion() ?? false
  const anchor = React.useRef<HTMLSpanElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const lx = useMotionValue(0)
  const ly = useMotionValue(0)
  const sx = useSpring(x, SPRING)
  const sy = useSpring(y, SPRING)
  const slx = useSpring(lx, SPRING)
  const sly = useSpring(ly, SPRING)

  React.useEffect(() => {
    const el = anchor.current
    if (!el || reduce || disabled) return
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)")
    let visible = false
    let listening = false

    const reset = () => {
      x.set(0)
      y.set(0)
      lx.set(0)
      ly.set(0)
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return
      const r = el.getBoundingClientRect()
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      // Full pull over the button, fading to zero at `radius` outside it.
      const out = Math.hypot(Math.max(0, Math.abs(dx) - r.width / 2), Math.max(0, Math.abs(dy) - r.height / 2))
      const f = Math.max(0, 1 - out / radius)
      if (f === 0) return reset()
      const ease = f * f * (3 - 2 * f)
      x.set(dx * strength * ease)
      y.set(dy * strength * ease)
      lx.set(dx * labelStrength * ease)
      ly.set(dy * labelStrength * ease)
    }
    const sync = () => {
      const want = visible && fine.matches && !document.hidden
      if (want && !listening) {
        window.addEventListener("pointermove", onMove, { passive: true })
        document.documentElement.addEventListener("pointerleave", reset)
        listening = true
      } else if (!want && listening) {
        window.removeEventListener("pointermove", onMove)
        document.documentElement.removeEventListener("pointerleave", reset)
        listening = false
        reset()
      }
    }
    const io = new IntersectionObserver(([entry]) => {
      if (!entry) return
      visible = entry.isIntersecting
      sync()
    })
    io.observe(el)
    fine.addEventListener("change", sync)
    document.addEventListener("visibilitychange", sync)
    return () => {
      io.disconnect()
      fine.removeEventListener("change", sync)
      document.removeEventListener("visibilitychange", sync)
      window.removeEventListener("pointermove", onMove)
      document.documentElement.removeEventListener("pointerleave", reset)
      reset()
    }
  }, [reduce, disabled, strength, labelStrength, radius, x, y, lx, ly])

  return (
    <span ref={anchor} className="inline-flex">
      <GooduiTokens />
      <motion.button
        data-slot="button"
        disabled={disabled}
        style={{ x: sx, y: sy }}
        whileTap={reduce ? undefined : { scale: 0.95 }}
        className={cn(
          "relative inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap transition-[background-color,box-shadow,color] outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
          VARIANTS[variant],
          SIZES[size],
          className,
        )}
        {...props}
      >
        <motion.span className="inline-flex items-center gap-[inherit]" style={{ x: slx, y: sly }}>
          {children}
        </motion.span>
      </motion.button>
    </span>
  )
}

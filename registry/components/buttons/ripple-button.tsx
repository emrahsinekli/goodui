"use client"

import * as React from "react"
import { useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { GooduiTokens } from "@/lib/goodui-motion"

const CSS = `
@keyframes pc-ripple-button-grow { to { transform: translate(-50%, -50%) scale(1) } }
.pc-ripple-button-wave {
  position: absolute; border-radius: 9999px; pointer-events: none;
  background: var(--pc-ripple-color, currentColor); opacity: var(--pc-ripple-opacity, .22);
  transform: translate(-50%, -50%) scale(0);
  animation: pc-ripple-button-grow var(--pc-ripple-duration, 550ms) var(--pc-ease-out) forwards;
  transition: opacity 420ms ease-out;
}
.pc-ripple-button-wave[data-out] { opacity: 0 }
@media (prefers-reduced-motion: reduce) { .pc-ripple-button-wave { display: none } }
`

const VARIANTS = {
  default: "bg-primary text-primary-foreground shadow-[var(--pc-e1)] hover:bg-primary/90",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  outline: "border bg-background text-foreground shadow-xs hover:bg-muted dark:bg-input/30 dark:hover:bg-input/50",
  ghost: "text-foreground hover:bg-muted",
  destructive: "bg-destructive text-white shadow-[var(--pc-e1)] hover:bg-destructive/90",
} as const

const SIZES = {
  sm: "h-8 gap-1.5 rounded-md px-3 text-xs [&_svg]:size-3.5",
  md: "h-10 gap-2 rounded-lg px-4 text-sm [&_svg]:size-4",
  lg: "h-11 gap-2 rounded-lg px-6 text-base [&_svg]:size-5",
  icon: "size-10 rounded-full [&_svg]:size-4",
} as const

type Wave = { id: number; x: number; y: number; size: number; out: boolean }

export type RippleButtonProps = React.ComponentProps<"button"> & {
  /** "default" | "secondary" | "outline" | "ghost" | "destructive", matching shadcn's button variants. */
  variant?: keyof typeof VARIANTS
  /** "sm" | "md" | "lg" | "icon"; "icon" is a round 40px button. */
  size?: keyof typeof SIZES
  /** Ripple color; defaults to the text color. */
  rippleColor?: string
  /** Ripple opacity at its peak (0–1). */
  rippleOpacity?: number
  /** Milliseconds for the ripple to cover the button. */
  rippleDuration?: number
  /** Always start the ripple from the center (good for icon buttons). */
  centerRipple?: boolean
}

/** Button with a material-style ink ripple that grows from the press point and fades on release. Pure CSS animation. */
export function RippleButton({
  variant = "default",
  size = "md",
  rippleColor,
  rippleOpacity,
  rippleDuration = 550,
  centerRipple,
  className,
  style,
  children,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  onPointerCancel,
  onKeyDown,
  onKeyUp,
  onBlur,
  ...props
}: RippleButtonProps) {
  const reduce = useReducedMotion() ?? false
  const [waves, setWaves] = React.useState<Wave[]>([])
  const nextId = React.useRef(0)
  const timers = React.useRef<number[]>([])

  React.useEffect(() => {
    const list = timers.current
    return () => list.forEach((t) => window.clearTimeout(t))
  }, [])

  const spawn = (el: HTMLElement, clientX?: number, clientY?: number) => {
    if (reduce) return
    const r = el.getBoundingClientRect()
    const x = clientX === undefined || centerRipple ? r.width / 2 : clientX - r.left
    const y = clientY === undefined || centerRipple ? r.height / 2 : clientY - r.top
    const size = 2 * Math.hypot(Math.max(x, r.width - x), Math.max(y, r.height - y))
    const id = nextId.current++
    setWaves((w) => [...w.slice(-4), { id, x, y, size, out: false }])
  }

  const release = () => {
    setWaves((w) => (w.some((x) => !x.out) ? w.map((x) => ({ ...x, out: true })) : w))
    const t = window.setTimeout(() => setWaves((w) => w.filter((x) => !x.out)), 520)
    timers.current.push(t)
  }

  return (
    <button
      data-slot="button"
      className={cn(
        "pc-press relative isolate inline-flex shrink-0 items-center justify-center overflow-hidden font-medium whitespace-nowrap transition-[background-color,box-shadow,color] outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      style={{
        ...style,
        ["--pc-ripple-duration" as string]: `${rippleDuration}ms`,
        ...(rippleColor ? { ["--pc-ripple-color" as string]: rippleColor } : {}),
        ...(rippleOpacity !== undefined ? { ["--pc-ripple-opacity" as string]: rippleOpacity } : {}),
      }}
      onPointerDown={(e) => {
        if (e.button === 0) spawn(e.currentTarget, e.clientX, e.clientY)
        onPointerDown?.(e)
      }}
      onPointerUp={(e) => {
        release()
        onPointerUp?.(e)
      }}
      onPointerLeave={(e) => {
        release()
        onPointerLeave?.(e)
      }}
      onPointerCancel={(e) => {
        release()
        onPointerCancel?.(e)
      }}
      onKeyDown={(e) => {
        if ((e.key === " " || e.key === "Enter") && !e.repeat) spawn(e.currentTarget)
        onKeyDown?.(e)
      }}
      onKeyUp={(e) => {
        release()
        onKeyUp?.(e)
      }}
      onBlur={(e) => {
        release()
        onBlur?.(e)
      }}
      {...props}
    >
      <GooduiTokens />
      <style href="pc-ripple-button" precedence="default">
        {CSS}
      </style>
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        {waves.map((w) => (
          <span
            key={w.id}
            data-out={w.out || undefined}
            className="pc-ripple-button-wave"
            style={{ left: w.x, top: w.y, width: w.size, height: w.size }}
          />
        ))}
      </span>
      {children}
    </button>
  )
}

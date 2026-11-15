"use client"

import * as React from "react"
import { motion, useInView, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { GooduiTokens, ease as easing } from "@/lib/goodui-motion"

const CSS = `
.pc-highlighter[data-color="amber"] { --pc-hl-fill: oklch(0.9 0.15 95 / 0.8); --pc-hl-stroke: oklch(0.75 0.17 70) }
.pc-highlighter[data-color="emerald"] { --pc-hl-fill: oklch(0.91 0.1 160 / 0.8); --pc-hl-stroke: oklch(0.64 0.15 160) }
.pc-highlighter[data-color="sky"] { --pc-hl-fill: oklch(0.9 0.07 230 / 0.85); --pc-hl-stroke: oklch(0.64 0.15 240) }
.pc-highlighter[data-color="rose"] { --pc-hl-fill: oklch(0.9 0.07 10 / 0.85); --pc-hl-stroke: oklch(0.63 0.21 18) }
.pc-highlighter[data-color="violet"] { --pc-hl-fill: oklch(0.89 0.08 300 / 0.85); --pc-hl-stroke: oklch(0.58 0.21 295) }
.pc-highlighter[data-color="primary"] { --pc-hl-fill: color-mix(in oklch, var(--primary) 16%, transparent); --pc-hl-stroke: var(--primary) }
:where(.dark) .pc-highlighter[data-color="amber"] { --pc-hl-fill: oklch(0.8 0.15 85 / 0.3); --pc-hl-stroke: oklch(0.83 0.15 80) }
:where(.dark) .pc-highlighter[data-color="emerald"] { --pc-hl-fill: oklch(0.75 0.14 160 / 0.28); --pc-hl-stroke: oklch(0.79 0.15 160) }
:where(.dark) .pc-highlighter[data-color="sky"] { --pc-hl-fill: oklch(0.72 0.12 230 / 0.3); --pc-hl-stroke: oklch(0.78 0.12 230) }
:where(.dark) .pc-highlighter[data-color="rose"] { --pc-hl-fill: oklch(0.7 0.17 15 / 0.3); --pc-hl-stroke: oklch(0.75 0.16 15) }
:where(.dark) .pc-highlighter[data-color="violet"] { --pc-hl-fill: oklch(0.7 0.17 295 / 0.32); --pc-hl-stroke: oklch(0.76 0.15 295) }
.pc-highlighter[data-action="highlight"] {
  background-image: linear-gradient(var(--pc-hl-fill), var(--pc-hl-fill));
  background-repeat: no-repeat;
  background-position: 0 88%;
  background-size: 0% 72%;
  padding: 0 0.12em; margin: 0 -0.12em;
  border-radius: 0.2em;
  transition: background-size var(--pc-hl-duration, 0.8s) var(--pc-ease-in-out) var(--pc-hl-delay, 0s);
}
.pc-highlighter[data-action="highlight"][data-shown] { background-size: 100% 72% }
@media (prefers-reduced-motion: reduce) { .pc-highlighter[data-action="highlight"] { transition: none } }
`

export type HighlighterAction = "highlight" | "underline" | "circle" | "box" | "strike"
export type HighlighterColor = "amber" | "emerald" | "sky" | "rose" | "violet" | "primary"

export type HighlighterProps = Omit<React.HTMLAttributes<HTMLSpanElement>, "color"> & {
  /** Marker highlight (wraps across lines), or a hand-drawn underline, circle, box or strike-through. */
  action?: HighlighterAction
  /** Marker and stroke color, tuned for light and dark; "primary" follows the theme. */
  color?: HighlighterColor
  /** Controlled: true draws, false erases. Leave undefined to draw when scrolled into view. */
  show?: boolean
  /** With automatic triggering: draw only the first time it enters the viewport. */
  once?: boolean
  /** Seconds before drawing starts. */
  delay?: number
  /** Seconds the stroke takes. */
  duration?: number
  /** Stroke width in px for underline, circle, box and strike (not used by highlight). */
  strokeWidth?: number
  /** Extra space in px between the text and a circle or box. */
  padding?: number
}

// Hand-drawn shapes, built in pixels from the measured size so strokes never stretch.
function shapePath(action: HighlighterAction, w: number, h: number, p: number) {
  switch (action) {
    case "underline":
      return `M ${-2} ${h + 1} Q ${w * 0.35} ${h - 1.5} ${w * 0.6} ${h + 0.5} T ${w + 3} ${h - 0.5}`
    case "strike":
      return `M ${-3} ${h * 0.56} Q ${w * 0.5} ${h * 0.5} ${w + 3} ${h * 0.53}`
    case "box": {
      const x0 = -p, y0 = -p * 0.55, x1 = w + p, y1 = h + p * 0.55
      return `M ${x0 + 3} ${y0 + 1} L ${x1} ${y0 - 1} L ${x1 + 1} ${y1} L ${x0} ${y1 + 1} L ${x0 - 1} ${y0 - 1} L ${x0 + 10} ${y0 + 0.5}`
    }
    case "circle": {
      const cx = w / 2, cy = h / 2, rx = w / 2 + p, ry = h / 2 + p * 0.7
      const start = Math.PI * 1.08
      const sweep = Math.PI * 2.18
      const pts: string[] = []
      for (let i = 0; i <= 64; i++) {
        const t = i / 64
        const a = start + sweep * t
        const grow = 1 + 0.07 * t + 0.02 * Math.sin(a * 3)
        pts.push(`${(cx + Math.cos(a) * rx * grow).toFixed(1)} ${(cy + Math.sin(a) * ry * grow).toFixed(1)}`)
      }
      return `M ${pts.join(" L ")}`
    }
    default:
      return ""
  }
}

/** Draws a marker highlight, underline, circle, box or strike-through behind a phrase when it scrolls into view. */
export function Highlighter({
  action = "highlight",
  color = "amber",
  show,
  once = true,
  delay = 0,
  duration = 0.8,
  strokeWidth = 2,
  padding = 6,
  className,
  style,
  children,
  ...props
}: HighlighterProps) {
  const reduce = useReducedMotion() ?? false
  const ref = React.useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once, amount: 0.8 })
  const shown = show ?? inView
  const [size, setSize] = React.useState<{ w: number; h: number } | null>(null)
  const svg = action !== "highlight"
  // The CSS marker needs one painted frame at 0% so it can transition in, even when it mounts already shown.
  const [ready, setReady] = React.useState(false)
  React.useEffect(() => {
    const r = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(r)
  }, [])

  React.useEffect(() => {
    const el = ref.current
    if (!el || !svg) return
    const update = () => setSize({ w: el.offsetWidth, h: el.offsetHeight })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [svg])

  return (
    <>
      <GooduiTokens />
      <style href="pc-highlighter" precedence="default">
        {CSS}
      </style>
      <span
        ref={ref}
        data-action={action}
        data-color={color}
        data-shown={shown && ready ? "" : undefined}
        className={cn("pc-highlighter", svg ? "relative inline-block" : "[box-decoration-break:slice]", className)}
        style={{ ...style, ["--pc-hl-delay" as string]: `${delay}s`, ["--pc-hl-duration" as string]: `${duration}s` }}
        {...props}
      >
        {children}
        {svg && size && (
          <svg aria-hidden="true" className="pointer-events-none absolute top-0 left-0 overflow-visible" width={size.w} height={size.h}>
            <motion.path
              d={shapePath(action, size.w, size.h, padding)}
              fill="none"
              stroke="var(--pc-hl-stroke)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={shown ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
              transition={
                reduce
                  ? { duration: 0 }
                  : { pathLength: { delay, duration, ease: easing.inOut }, opacity: { delay, duration: 0.05 } }
              }
            />
          </svg>
        )}
      </span>
    </>
  )
}

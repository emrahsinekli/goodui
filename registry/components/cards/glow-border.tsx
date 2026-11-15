"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// A registered <angle> property lets the conic gradient rotate. Browsers without @property show it still.
const CSS = `
@property --pc-glow-border-angle { syntax: "<angle>"; inherits: true; initial-value: 0deg }
@keyframes pc-glow-border-spin { to { --pc-glow-border-angle: 360deg } }
.pc-glow-border {
  --pc-gb-gradient: conic-gradient(from var(--pc-glow-border-angle), var(--pc-gb-stops));
  position: relative; isolation: isolate;
  padding: var(--pc-gb-width, 1px);
  background: var(--pc-gb-gradient), var(--border);
  animation: pc-glow-border-spin var(--pc-gb-duration, 6s) linear infinite;
}
.pc-glow-border::before {
  content: ""; position: absolute; inset: 0; z-index: -1; border-radius: inherit; pointer-events: none;
  background: var(--pc-gb-gradient);
  filter: blur(var(--pc-gb-blur, 14px));
  opacity: var(--pc-gb-rest, 0.25);
  transition: opacity 0.4s ease, filter 0.4s ease;
}
.pc-glow-border:is(:hover, :focus-within, [data-active])::before { opacity: var(--pc-gb-hover, 0.75); filter: blur(calc(var(--pc-gb-blur, 14px) * 1.4)) }
.pc-glow-border[data-paused] { animation-play-state: paused }
:where(.dark) .pc-glow-border::before { opacity: calc(var(--pc-gb-rest, 0.25) * 1.6) }
:where(.dark) .pc-glow-border:is(:hover, :focus-within, [data-active])::before { opacity: var(--pc-gb-hover, 0.75) }
@media (prefers-reduced-motion: reduce) { .pc-glow-border { animation: none } .pc-glow-border::before { transition: none } }
`

export type GlowBorderProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Colors of the moving arc. Defaults to the theme's chart colors. */
  colors?: string[]
  /** Seconds per rotation. */
  duration?: number
  /** Border width in px. */
  borderWidth?: number
  /** Glow blur in px. */
  blur?: number
  /** Glow opacity at rest and on hover/focus (0–1). */
  restOpacity?: number
  /** Glow opacity on hover, with focus inside, or while active (0 to 1). */
  hoverOpacity?: number
  /** Keep the intense state on, e.g. for a selected plan. */
  active?: boolean
  /** Classes for the inner surface. */
  innerClassName?: string
}

/**
 * A card whose border carries a slowly rotating gradient arc with a soft glow behind it; the glow intensifies on
 * hover and focus. Pauses off-screen and stops for reduced motion.
 */
export function GlowBorder({
  colors = ["var(--chart-1)", "var(--chart-4)", "var(--chart-5)"],
  duration = 6,
  borderWidth = 1,
  blur = 14,
  restOpacity = 0.25,
  hoverOpacity = 0.75,
  active = false,
  className,
  innerClassName,
  style,
  children,
  ...props
}: GlowBorderProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [paused, setPaused] = React.useState(false)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => entry && setPaused(!entry.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // The arc covers the first ~55% of the circle and fades out at both ends; the rest shows the plain border.
  const step = 45 / Math.max(1, colors.length - 1)
  const stops = ["transparent 0%", ...colors.map((c, i) => `${c} ${(5 + i * step).toFixed(1)}%`), "transparent 55%", "transparent 100%"].join(", ")

  return (
    <div
      ref={ref}
      data-active={active ? "" : undefined}
      data-paused={paused ? "" : undefined}
      className={cn("pc-glow-border rounded-xl", className)}
      style={{
        ...style,
        ["--pc-gb-stops" as string]: stops,
        ["--pc-gb-duration" as string]: `${duration}s`,
        ["--pc-gb-width" as string]: `${borderWidth}px`,
        ["--pc-gb-blur" as string]: `${blur}px`,
        ["--pc-gb-rest" as string]: restOpacity,
        ["--pc-gb-hover" as string]: hoverOpacity,
      }}
      {...props}
    >
      <style href="pc-glow-border" precedence="default">
        {CSS}
      </style>
      <div className={cn("h-full rounded-[inherit] bg-card text-card-foreground", innerClassName)}>
        {children}
      </div>
    </div>
  )
}

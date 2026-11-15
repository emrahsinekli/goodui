"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// The ring is a padding-sized mask (content-box excluded); the beam travels the ring on an offset-path rect().
const CSS = `
@keyframes pc-border-beam-move { from { offset-distance: 0% } to { offset-distance: 100% } }
.pc-border-beam {
  position: absolute; inset: 0; border-radius: var(--pc-bb-radius, 0px); padding: var(--pc-bb-width, 1px);
  pointer-events: none; z-index: 1; overflow: hidden;
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0);
}
.pc-border-beam-dot {
  position: absolute; top: 0; left: 0; width: var(--pc-bb-size, 80px); aspect-ratio: 1;
  offset-path: rect(0 auto auto 0 round var(--pc-bb-radius, 12px));
  offset-anchor: 50% 50%;
  background: linear-gradient(to left, var(--pc-bb-from), var(--pc-bb-to), transparent);
  animation: pc-border-beam-move var(--pc-bb-duration, 6s) linear infinite;
  animation-delay: var(--pc-bb-delay, 0s);
}
.pc-border-beam[data-reverse] .pc-border-beam-dot { animation-direction: reverse }
.pc-border-beam[data-paused] .pc-border-beam-dot { animation-play-state: paused }
@supports not (offset-path: rect(0 auto auto 0)) { .pc-border-beam { display: none } }
@media (prefers-reduced-motion: reduce) { .pc-border-beam { display: none } }
`

export type BorderBeamProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Length of the beam in px. */
  size?: number
  /** Seconds per lap. */
  duration?: number
  /** Seconds to offset the start (useful for several beams). */
  delay?: number
  /** Head color of the beam. Defaults to the theme's --chart-1. */
  colorFrom?: string
  /** Tail color of the beam. Defaults to the theme's --chart-4. */
  colorTo?: string
  /** Width of the lit ring in px; match the border of the wrapped element. */
  borderWidth?: number
  /** Corner radius of the path. Defaults to the wrapped element's own radius. */
  radius?: number
  /** Run the beam the other way around the border. */
  reverse?: boolean
  /** Number of beams, spaced evenly around the border. */
  beams?: 1 | 2
}

/**
 * Wraps any card or input and runs a light beam around its border. Measures the child's corner radius, pauses
 * off-screen and is hidden for reduced motion or in browsers without offset-path rect().
 */
export function BorderBeam({
  size = 80,
  duration = 6,
  delay = 0,
  colorFrom = "var(--chart-1)",
  colorTo = "var(--chart-4)",
  borderWidth = 1,
  radius,
  reverse = false,
  beams = 1,
  className,
  style,
  children,
  ...props
}: BorderBeamProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [paused, setPaused] = React.useState(false)
  const [measured, setMeasured] = React.useState<string | null>(null)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    if (radius === undefined) {
      const child = el.firstElementChild as HTMLElement | null
      const r = child ? getComputedStyle(child).borderTopLeftRadius : "0px"
      setMeasured(r && r !== "0px" ? r : getComputedStyle(el).borderTopLeftRadius)
    }
    // Pause the beam while off-screen.
    const io = new IntersectionObserver(([entry]) => {
      if (!entry) return
      setPaused(!entry.isIntersecting)
    })
    io.observe(el)
    return () => io.disconnect()
  }, [radius])

  const r = radius !== undefined ? `${radius}px` : measured ?? undefined

  return (
    <div
      ref={ref}
      className={cn("relative", className)}
      style={{
        ...style,
        ["--pc-bb-size" as string]: `${size}px`,
        ["--pc-bb-duration" as string]: `${duration}s`,
        ["--pc-bb-from" as string]: colorFrom,
        ["--pc-bb-to" as string]: colorTo,
        ["--pc-bb-width" as string]: `${borderWidth}px`,
        ...(r ? { ["--pc-bb-radius" as string]: r } : {}),
      }}
      {...props}
    >
      <style href="pc-border-beam" precedence="default">
        {CSS}
      </style>
      {children}
      {r && (
        <div aria-hidden="true" className="pc-border-beam" data-reverse={reverse ? "" : undefined} data-paused={paused ? "" : undefined}>
          {Array.from({ length: beams }, (_, i) => (
            <div key={i} className="pc-border-beam-dot" style={{ ["--pc-bb-delay" as string]: `${-delay - (i * duration) / beams}s` }} />
          ))}
        </div>
      )}
    </div>
  )
}

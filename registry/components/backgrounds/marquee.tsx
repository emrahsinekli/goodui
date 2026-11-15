"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Each copy moves by its own length plus the gap, so N identical copies loop seamlessly.
const CSS = `
@keyframes pc-marquee-x { from { transform: translateX(0) } to { transform: translateX(calc(-100% - var(--pc-mq-gap))) } }
@keyframes pc-marquee-y { from { transform: translateY(0) } to { transform: translateY(calc(-100% - var(--pc-mq-gap))) } }
@keyframes pc-marquee-x-rtl { from { transform: translateX(0) } to { transform: translateX(calc(100% + var(--pc-mq-gap))) } }
.pc-marquee { display: flex; overflow: hidden; gap: var(--pc-mq-gap) }
.pc-marquee[data-vertical] { flex-direction: column }
.pc-marquee-track {
  display: flex; flex-shrink: 0; align-items: var(--pc-mq-align, center); justify-content: space-around; gap: var(--pc-mq-gap);
  animation: pc-marquee-x var(--pc-mq-duration, 40s) linear infinite;
}
.pc-marquee[data-vertical] .pc-marquee-track { flex-direction: column; align-items: var(--pc-mq-align, stretch); animation-name: pc-marquee-y }
/* Right-to-left: copies are laid out from the right, so they travel right (toward the inline start) to loop. */
:where([dir=rtl]) .pc-marquee:not([data-vertical]) .pc-marquee-track { animation-name: pc-marquee-x-rtl }
.pc-marquee[dir=rtl]:not([data-vertical]) .pc-marquee-track { animation-name: pc-marquee-x-rtl }
:where([dir=rtl]) .pc-marquee[dir=ltr]:not([data-vertical]) .pc-marquee-track { animation-name: pc-marquee-x }
.pc-marquee[data-reverse] .pc-marquee-track { animation-direction: reverse }
.pc-marquee[data-pause-on-hover]:is(:hover, :focus-within) .pc-marquee-track,
.pc-marquee[data-paused] .pc-marquee-track { animation-play-state: paused }
.pc-marquee[data-fade] {
  -webkit-mask-image: linear-gradient(to right, transparent, #000 var(--pc-mq-fade), #000 calc(100% - var(--pc-mq-fade)), transparent);
  mask-image: linear-gradient(to right, transparent, #000 var(--pc-mq-fade), #000 calc(100% - var(--pc-mq-fade)), transparent);
}
.pc-marquee[data-fade][data-vertical] {
  -webkit-mask-image: linear-gradient(to bottom, transparent, #000 var(--pc-mq-fade), #000 calc(100% - var(--pc-mq-fade)), transparent);
  mask-image: linear-gradient(to bottom, transparent, #000 var(--pc-mq-fade), #000 calc(100% - var(--pc-mq-fade)), transparent);
}
@media (prefers-reduced-motion: reduce) {
  .pc-marquee-track { animation: none }
  .pc-marquee-track[data-copy] { display: none }
  .pc-marquee:not([data-vertical]) { overflow-x: auto; scrollbar-width: thin }
  .pc-marquee[data-vertical] { overflow-y: auto; scrollbar-width: thin }
}
`

export type MarqueeProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Scroll toward the inline start (right-to-left in LTR, left-to-right under dir="rtl") or bottom-to-top when false; the other way when true. */
  reverse?: boolean
  /** Pause while the pointer is over it or focus is inside it. */
  pauseOnHover?: boolean
  /** Scroll vertically instead of horizontally; give the marquee a height. */
  vertical?: boolean
  /** Seconds for one copy to pass. */
  duration?: number
  /** Space between items and between copies (any CSS length). */
  gap?: string
  /** How many copies to render; raise it if the content is shorter than the container. */
  repeat?: number
  /** Fade the edges with a mask. */
  fade?: boolean
  /** Length of each faded edge (any CSS length). */
  fadeSize?: string
  /** Cross-axis alignment of the items. Defaults to center (horizontal) or stretch (vertical). */
  align?: "start" | "center" | "end" | "stretch"
}

/**
 * An endless CSS marquee, horizontal or vertical, with faded edges. Pauses on hover and focus, off-screen and in
 * hidden tabs. Reduced motion turns it into a plain scrollable row without duplicates.
 */
export function Marquee({
  reverse = false,
  pauseOnHover = true,
  vertical = false,
  duration = 40,
  gap = "1rem",
  repeat = 3,
  fade = true,
  fadeSize = "12%",
  align,
  className,
  style,
  children,
  ...props
}: MarqueeProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [paused, setPaused] = React.useState(false)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    let inView = true
    const update = () => setPaused(!inView || document.hidden)
    const io = new IntersectionObserver(([e]) => {
      if (!e) return
      inView = e.isIntersecting
      update()
    })
    io.observe(el)
    document.addEventListener("visibilitychange", update)
    return () => {
      io.disconnect()
      document.removeEventListener("visibilitychange", update)
    }
  }, [])

  return (
    <div
      ref={ref}
      data-vertical={vertical ? "" : undefined}
      data-reverse={reverse ? "" : undefined}
      data-pause-on-hover={pauseOnHover ? "" : undefined}
      data-paused={paused ? "" : undefined}
      data-fade={fade ? "" : undefined}
      className={cn("pc-marquee", className)}
      style={{ ...style, ["--pc-mq-gap" as string]: gap, ["--pc-mq-duration" as string]: `${duration}s`, ["--pc-mq-fade" as string]: fadeSize, ...(align ? { ["--pc-mq-align" as string]: align } : {}) }}
      {...props}
    >
      <style href="pc-marquee" precedence="default">
        {CSS}
      </style>
      {Array.from({ length: Math.max(2, repeat) }, (_, i) => (
        <div key={i} className="pc-marquee-track" data-copy={i > 0 ? "" : undefined} aria-hidden={i > 0 ? true : undefined} inert={i > 0 ? true : undefined}>
          {children}
        </div>
      ))}
    </div>
  )
}

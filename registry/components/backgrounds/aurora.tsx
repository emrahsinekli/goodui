"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Soft blobs are radial gradients (no filter: blur), moved with transform only, so the compositor does the work.
const CSS = `
.pc-aurora-blob {
  position: absolute; aspect-ratio: 1; border-radius: 9999px; will-change: transform;
  background: radial-gradient(closest-side, var(--pc-au-c) 0%, color-mix(in oklch, var(--pc-au-c) 45%, transparent) 50%, transparent 100%);
  opacity: var(--pc-au-opacity, 0.9);
  animation: var(--pc-au-name) calc(var(--pc-au-base) / var(--pc-au-speed, 1)) ease-in-out infinite alternate;
}
.pc-aurora[data-paused] .pc-aurora-blob { animation-play-state: paused }
@keyframes pc-aurora-a { 0% { transform: translate3d(0, 0, 0) scale(1) } 50% { transform: translate3d(22%, 14%, 0) scale(1.15) } 100% { transform: translate3d(-8%, 26%, 0) scale(0.95) } }
@keyframes pc-aurora-b { 0% { transform: translate3d(0, 0, 0) scale(1.05) } 50% { transform: translate3d(-24%, 18%, 0) scale(0.9) } 100% { transform: translate3d(-10%, -6%, 0) scale(1.15) } }
@keyframes pc-aurora-c { 0% { transform: translate3d(0, 0, 0) scale(0.95) } 50% { transform: translate3d(18%, -20%, 0) scale(1.1) } 100% { transform: translate3d(30%, -4%, 0) scale(1) } }
@keyframes pc-aurora-d { 0% { transform: translate3d(0, 0, 0) scale(1.1) } 50% { transform: translate3d(-16%, -22%, 0) scale(0.95) } 100% { transform: translate3d(-26%, 6%, 0) scale(1.1) } }
.pc-aurora[data-palette="aurora"] { --pc-au-1: oklch(0.86 0.1 195); --pc-au-2: oklch(0.82 0.11 285); --pc-au-3: oklch(0.9 0.1 160); --pc-au-4: oklch(0.84 0.1 245) }
.pc-aurora[data-palette="sunset"] { --pc-au-1: oklch(0.88 0.09 60); --pc-au-2: oklch(0.84 0.1 15); --pc-au-3: oklch(0.85 0.09 330); --pc-au-4: oklch(0.92 0.09 90) }
.pc-aurora[data-palette="ocean"] { --pc-au-1: oklch(0.86 0.08 225); --pc-au-2: oklch(0.83 0.09 260); --pc-au-3: oklch(0.9 0.07 190); --pc-au-4: oklch(0.82 0.09 280) }
.pc-aurora[data-palette="brand"] { --pc-au-1: color-mix(in oklch, var(--chart-1) 45%, var(--background)); --pc-au-2: color-mix(in oklch, var(--chart-4) 40%, var(--background)); --pc-au-3: color-mix(in oklch, var(--chart-2) 40%, var(--background)); --pc-au-4: color-mix(in oklch, var(--chart-5) 35%, var(--background)) }
:where(.dark) .pc-aurora[data-palette="aurora"] { --pc-au-1: oklch(0.5 0.13 190); --pc-au-2: oklch(0.42 0.19 285); --pc-au-3: oklch(0.52 0.14 160); --pc-au-4: oklch(0.42 0.16 250) }
:where(.dark) .pc-aurora[data-palette="sunset"] { --pc-au-1: oklch(0.55 0.15 50); --pc-au-2: oklch(0.45 0.17 15); --pc-au-3: oklch(0.42 0.17 330); --pc-au-4: oklch(0.58 0.13 80) }
:where(.dark) .pc-aurora[data-palette="ocean"] { --pc-au-1: oklch(0.47 0.12 225); --pc-au-2: oklch(0.4 0.15 260); --pc-au-3: oklch(0.5 0.11 195); --pc-au-4: oklch(0.38 0.14 280) }
:where(.dark) .pc-aurora[data-palette="brand"] { --pc-au-1: color-mix(in oklch, var(--chart-1) 55%, var(--background)); --pc-au-2: color-mix(in oklch, var(--chart-4) 50%, var(--background)); --pc-au-3: color-mix(in oklch, var(--chart-2) 45%, var(--background)); --pc-au-4: color-mix(in oklch, var(--chart-5) 45%, var(--background)) }
:where(.dark) .pc-aurora .pc-aurora-blob { opacity: calc(var(--pc-au-opacity, 0.9) * 0.85) }
@media (prefers-reduced-motion: reduce) { .pc-aurora-blob { animation: none } }
`

const BLOBS = [
  { c: 1, name: "pc-aurora-a", base: 18, style: { top: "-35%", left: "-15%", width: "65%" } },
  { c: 2, name: "pc-aurora-b", base: 22, style: { top: "-30%", right: "-20%", width: "70%" } },
  { c: 3, name: "pc-aurora-c", base: 26, style: { bottom: "-45%", left: "5%", width: "60%" } },
  { c: 4, name: "pc-aurora-d", base: 20, style: { bottom: "-40%", right: "-5%", width: "55%" } },
] as const

export type AuroraPalette = "aurora" | "sunset" | "ocean" | "brand"

export type AuroraProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Theme-aware preset; "brand" mixes the theme's chart colors. */
  palette?: AuroraPalette
  /** Custom colors for the four blobs (overrides the palette in both themes). */
  colors?: [string, string, string, string]
  /** Speed multiplier; 1 is a slow drift. */
  speed?: number
  /** Blob opacity, 0–1. */
  intensity?: number
}

/**
 * A soft, slowly drifting mesh of colored light. CSS only (transform keyframes), light and dark palettes, pauses
 * off-screen and in hidden tabs, still for reduced motion. Place it inside a `relative overflow-hidden` parent.
 */
export function Aurora({ palette = "aurora", colors, speed = 1, intensity = 0.9, className, style, ...props }: AuroraProps) {
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
      aria-hidden="true"
      data-palette={palette}
      data-paused={paused ? "" : undefined}
      className={cn("pc-aurora pointer-events-none absolute inset-0 overflow-hidden", className)}
      style={{
        ...style,
        ["--pc-au-speed" as string]: speed,
        ["--pc-au-opacity" as string]: intensity,
        ...(colors ? Object.fromEntries(colors.map((c, i) => [`--pc-au-${i + 1}`, c])) : {}),
      }}
      {...props}
    >
      <style href="pc-aurora" precedence="default">
        {CSS}
      </style>
      {BLOBS.map((b) => (
        <div
          key={b.name}
          className="pc-aurora-blob"
          style={{
            ...b.style,
            ["--pc-au-c" as string]: `var(--pc-au-${b.c})`,
            ["--pc-au-name" as string]: b.name,
            ["--pc-au-base" as string]: `${b.base}s`,
          }}
        />
      ))}
    </div>
  )
}

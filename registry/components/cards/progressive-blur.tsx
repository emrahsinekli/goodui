"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export type ProgressiveBlurProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Edge the blur sits on; it grows toward that edge. */
  side?: "top" | "bottom" | "left" | "right"
  /** Size of the blurred band (any CSS length). */
  size?: string | number
  /** Blur in px at the very edge. */
  blur?: number
  /** Number of stacked layers; more is smoother, fewer is cheaper. */
  layers?: number
  /** Also fade to this color at the edge (e.g. "var(--card)"). Off when undefined. */
  fadeColor?: string
}

const DIR = { top: "to top", bottom: "to bottom", left: "to left", right: "to right" } as const

/**
 * A blur that gets stronger toward one edge, made of stacked backdrop-filter layers that each cover a slice of
 * the band. Place it inside a `relative` wrapper around a scroll container.
 */
export function ProgressiveBlur({
  side = "bottom",
  size = "35%",
  blur = 8,
  layers = 6,
  fadeColor,
  className,
  style,
  ...props
}: ProgressiveBlurProps) {
  const n = Math.max(2, Math.round(layers))
  const dir = DIR[side]
  const seg = 100 / (n + 1)
  const vertical = side === "top" || side === "bottom"
  const length = typeof size === "number" ? `${size}px` : size

  const position: React.CSSProperties = vertical
    ? { left: 0, right: 0, [side]: 0, height: length }
    : { top: 0, bottom: 0, [side]: 0, width: length }

  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute z-10", className)} style={{ ...position, ...style }} {...props}>
      {Array.from({ length: n }, (_, i) => {
        // Blur doubles per layer up to `blur`; each layer is fully opaque over its own slice and fades at the ends.
        const amount = blur / 2 ** (n - 1 - i)
        const a = i * seg
        const b = (i + 1) * seg
        const c = (i + 2) * seg
        const mask =
          i === n - 1
            ? `linear-gradient(${dir}, transparent ${a}%, #000 ${b}%, #000 100%)`
            : `linear-gradient(${dir}, transparent ${a}%, #000 ${b}%, #000 ${c}%, transparent ${Math.min(100, (i + 3) * seg)}%)`
        return (
          <div
            key={i}
            className="absolute inset-0"
            style={{
              backdropFilter: `blur(${amount.toFixed(2)}px)`,
              WebkitBackdropFilter: `blur(${amount.toFixed(2)}px)`,
              maskImage: mask,
              WebkitMaskImage: mask,
            }}
          />
        )
      })}
      {fadeColor && <div className="absolute inset-0" style={{ background: `linear-gradient(${dir}, transparent 20%, ${fadeColor})` }} />}
    </div>
  )
}

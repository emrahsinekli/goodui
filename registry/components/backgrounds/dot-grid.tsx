"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const CSS = `
.pc-dot-grid { --pc-dg-x: 50%; --pc-dg-y: 50% }
.pc-dot-grid-highlight {
  opacity: 0; transition: opacity 0.4s ease;
  -webkit-mask-image: radial-gradient(var(--pc-dg-r, 180px) circle at var(--pc-dg-x) var(--pc-dg-y), #000, transparent);
  mask-image: radial-gradient(var(--pc-dg-r, 180px) circle at var(--pc-dg-x) var(--pc-dg-y), #000, transparent);
}
.pc-dot-grid[data-pointer] .pc-dot-grid-highlight { opacity: 1 }
@media (prefers-reduced-motion: reduce) { .pc-dot-grid-highlight { transition: none } }
`

const FADES = {
  radial: "radial-gradient(ellipse 70% 65% at 50% 50%, #000 30%, transparent 100%)",
  top: "linear-gradient(to bottom, #000 10%, transparent 90%)",
  bottom: "linear-gradient(to top, #000 10%, transparent 90%)",
  edges: "linear-gradient(to right, transparent, #000 15%, #000 85%, transparent), linear-gradient(to bottom, transparent, #000 15%, #000 85%, transparent)",
  none: "none",
} as const

export type DotGridProps = React.HTMLAttributes<HTMLDivElement> & {
  /** "dots" is a dot pattern; "lines" a square line grid. */
  variant?: "dots" | "lines"
  /** Distance between dots or lines, in px. */
  gap?: number
  /** Dot radius or line width, in px. */
  size?: number
  /** Pattern color. Defaults to the foreground at low opacity, so it works in light and dark. */
  color?: string
  /** Where the pattern fades out: "radial" | "top" | "bottom" | "edges" | "none". */
  fade?: keyof typeof FADES
  /** Brighten the pattern around the pointer (listens on the parent element). */
  highlight?: boolean
  /** Color of the pattern inside the pointer highlight. Defaults to the theme's --chart-1. */
  highlightColor?: string
  /** Radius of the pointer highlight, in px. */
  highlightRadius?: number
}

function pattern(variant: "dots" | "lines", size: number, color: string) {
  if (variant === "dots") return `radial-gradient(circle, ${color} ${size}px, transparent ${size + 0.6}px)`
  return `linear-gradient(to right, ${color} ${size}px, transparent ${size}px), linear-gradient(to bottom, ${color} ${size}px, transparent ${size}px)`
}

/**
 * A dot or line grid for the back of a section, with a fade mask and an optional highlight that follows the
 * pointer. Pure CSS; place it inside a `relative` parent.
 */
export function DotGrid({
  variant = "dots",
  gap = 22,
  size = 1,
  color,
  fade = "radial",
  highlight = false,
  highlightColor = "color-mix(in oklch, var(--chart-1) 90%, transparent)",
  highlightRadius = 180,
  className,
  style,
  ...props
}: DotGridProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const base = color ?? `color-mix(in oklch, var(--foreground) ${variant === "dots" ? 22 : 9}%, transparent)`

  React.useEffect(() => {
    const el = ref.current
    const host = el?.parentElement
    if (!el || !host || !highlight) return
    let frame = 0
    const move = (e: PointerEvent) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        el.style.setProperty("--pc-dg-x", `${e.clientX - r.left}px`)
        el.style.setProperty("--pc-dg-y", `${e.clientY - r.top}px`)
        el.setAttribute("data-pointer", "")
      })
    }
    const leave = () => {
      cancelAnimationFrame(frame)
      el.removeAttribute("data-pointer")
    }
    host.addEventListener("pointermove", move)
    host.addEventListener("pointerleave", leave)
    return () => {
      cancelAnimationFrame(frame)
      host.removeEventListener("pointermove", move)
      host.removeEventListener("pointerleave", leave)
    }
  }, [highlight])

  const layer: React.CSSProperties = {
    backgroundSize: `${gap}px ${gap}px`,
    backgroundPosition: variant === "dots" ? "center" : `calc(50% - ${size / 2}px) calc(50% - ${size / 2}px)`,
  }
  const mask = FADES[fade]

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn("pc-dot-grid pointer-events-none absolute inset-0 overflow-hidden", className)}
      style={{
        ...style,
        ["--pc-dg-r" as string]: `${highlightRadius}px`,
        maskImage: mask,
        WebkitMaskImage: mask,
        ...(fade === "edges" ? { maskComposite: "intersect", WebkitMaskComposite: "source-in" } : {}),
      }}
      {...props}
    >
      <style href="pc-dot-grid" precedence="default">
        {CSS}
      </style>
      <div className="absolute inset-0" style={{ ...layer, backgroundImage: pattern(variant, size, base) }} />
      {highlight && (
        <div
          className="pc-dot-grid-highlight absolute inset-0"
          style={{ ...layer, backgroundImage: pattern(variant, variant === "dots" ? size + 0.4 : size, highlightColor) }}
        />
      )}
    </div>
  )
}

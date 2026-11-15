"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { GooduiTokens } from "@/lib/goodui-motion"

// The band sweeps left to right, then rests off-screen for the last part of the cycle.
const CSS = `
@keyframes pc-shiny-text-sweep { 0% { background-position: 100% 0 } 65%, 100% { background-position: 0% 0 } }
.pc-shiny-text {
  --pc-shiny-base: var(--muted-foreground);
  --pc-shiny-shine: var(--foreground);
  --pc-shiny-dir: 110deg;
  color: var(--pc-shiny-base);
}
.pc-shiny-text[data-tone="ink"] { --pc-shiny-base: color-mix(in oklab, var(--foreground) 72%, transparent); --pc-shiny-shine: var(--foreground) }
.pc-shiny-text[data-tone="metal"] { --pc-shiny-base: oklch(0.45 0.012 260); --pc-shiny-shine: oklch(0.82 0.02 260) }
.pc-shiny-text[data-tone="accent"] { --pc-shiny-base: var(--muted-foreground); --pc-shiny-shine: var(--chart-1) }
:where(.dark) .pc-shiny-text[data-tone="metal"] { --pc-shiny-base: oklch(0.62 0.01 260); --pc-shiny-shine: oklch(0.99 0.004 260) }
.pc-shiny-text:dir(rtl) { --pc-shiny-dir: 250deg }
@supports ((-webkit-background-clip: text) or (background-clip: text)) {
  .pc-shiny-text {
    color: transparent;
    background-image: linear-gradient(var(--pc-shiny-dir), var(--pc-shiny-base) calc(50% - var(--pc-shiny-spread, 9%)), color-mix(in oklab, var(--pc-shiny-base), var(--pc-shiny-shine) 55%) calc(50% - var(--pc-shiny-spread, 9%) * .4), var(--pc-shiny-shine) 50%, color-mix(in oklab, var(--pc-shiny-base), var(--pc-shiny-shine) 55%) calc(50% + var(--pc-shiny-spread, 9%) * .4), var(--pc-shiny-base) calc(50% + var(--pc-shiny-spread, 9%)));
    background-size: 250% 100%;
    background-position: 0% 0;
    background-repeat: no-repeat;
    -webkit-background-clip: text;
    background-clip: text;
  }
  .pc-shiny-text[data-trigger="loop"] { animation: pc-shiny-text-sweep var(--pc-shiny-duration, 2.8s) var(--pc-ease-in-out) infinite }
  .pc-shiny-text:dir(rtl) { animation-direction: reverse !important }
  :is(a, button, [data-shiny-group]):is(:hover, :focus-visible) .pc-shiny-text[data-trigger="hover"],
  .pc-shiny-text[data-trigger="hover"]:hover {
    animation: pc-shiny-text-sweep var(--pc-shiny-duration, 2.8s) var(--pc-ease-in-out) infinite;
  }
}
@media (prefers-reduced-motion: reduce) {
  .pc-shiny-text, .pc-shiny-text[data-trigger] { animation: none !important; background-position: 0% 0 }
}
`

export type ShinyTextProps = React.HTMLAttributes<HTMLSpanElement> & {
  /** Seconds per cycle (the sweep takes about two thirds of it). */
  duration?: number
  /** "loop" sweeps forever; "hover" sweeps while the text or its parent link/button is hovered or focused. */
  trigger?: "loop" | "hover"
  /** Preset: muted (default) sweeps foreground over muted, ink keeps the text strong, metal is steel, accent shines in the theme color. */
  tone?: "muted" | "ink" | "metal" | "accent"
  /** Text color at rest; overrides `tone`. */
  baseColor?: string
  /** Color of the light band; overrides `tone`. */
  shineColor?: string
  /** Half-width of the band, as a percent of the gradient. */
  spread?: number
}

/** Muted text with a soft light band sweeping across it. Pure CSS (background-clip), static for reduced motion. */
export function ShinyText({
  duration = 2.8,
  trigger = "loop",
  tone = "muted",
  baseColor,
  shineColor,
  spread = 9,
  className,
  style,
  children,
  ...props
}: ShinyTextProps) {
  return (
    <>
      <GooduiTokens />
      <style href="pc-shiny-text" precedence="default">
        {CSS}
      </style>
      <span
        data-trigger={trigger}
        data-tone={tone}
        className={cn("pc-shiny-text inline-block", className)}
        style={{
          ...style,
          ["--pc-shiny-duration" as string]: `${duration}s`,
          ["--pc-shiny-spread" as string]: `${spread}%`,
          ...(baseColor ? { ["--pc-shiny-base" as string]: baseColor } : {}),
          ...(shineColor ? { ["--pc-shiny-shine" as string]: shineColor } : {}),
        }}
        {...props}
      >
        {children}
      </span>
    </>
  )
}

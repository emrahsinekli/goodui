"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { GooduiTokens } from "@/lib/goodui-motion"

// Light palettes are deeper so every stop keeps 4.5:1 on white; dark palettes are brighter (4.5:1 on dark cards).
const CSS = `
@keyframes pc-gradient-text-move { from { background-position: 0% 50% } to { background-position: 200% 50% } }
.pc-gradient-text { color: var(--pc-gt-1) }
@supports ((-webkit-background-clip: text) or (background-clip: text)) {
  .pc-gradient-text {
    color: transparent;
    background-image: var(--pc-gt-gradient, linear-gradient(100deg, var(--pc-gt-1), var(--pc-gt-2), var(--pc-gt-3), var(--pc-gt-4), var(--pc-gt-1)));
    background-size: 200% 100%;
    background-repeat: repeat;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-box-decoration-break: clone;
    box-decoration-break: clone;
  }
  .pc-gradient-text[data-animate] { animation: pc-gradient-text-move var(--pc-gt-duration, 8s) linear infinite }
}
/* Restrained first: two stops, no hue party. Ink falls off to muted, metal is brushed steel, accent lifts the theme color. */
.pc-gradient-text[data-palette="ink"] { --pc-gt-1: var(--foreground); --pc-gt-gradient: linear-gradient(100deg, var(--foreground) 10%, var(--muted-foreground) 50%, var(--foreground) 90%) }
.pc-gradient-text[data-palette="metal"] { --pc-gt-1: oklch(0.35 0.01 260); --pc-gt-gradient: linear-gradient(100deg, oklch(0.28 0.01 260), oklch(0.5 0.012 260) 22%, oklch(0.36 0.01 260) 38%, oklch(0.6 0.012 260) 50%, oklch(0.36 0.01 260) 62%, oklch(0.5 0.012 260) 78%, oklch(0.28 0.01 260)) }
:where(.dark) .pc-gradient-text[data-palette="metal"] { --pc-gt-1: oklch(0.86 0.005 260); --pc-gt-gradient: linear-gradient(100deg, oklch(0.97 0.004 260), oklch(0.72 0.008 260) 22%, oklch(0.88 0.006 260) 38%, oklch(0.62 0.01 260) 50%, oklch(0.88 0.006 260) 62%, oklch(0.72 0.008 260) 78%, oklch(0.97 0.004 260)) }
.pc-gradient-text[data-palette="accent"] { --pc-gt-1: var(--chart-1); --pc-gt-gradient: linear-gradient(100deg, var(--foreground) 8%, var(--chart-1) 50%, var(--foreground) 92%) }
.pc-gradient-text[data-palette="aurora"] { --pc-gt-1: oklch(0.55 0.2 275); --pc-gt-2: oklch(0.53 0.15 220); --pc-gt-3: oklch(0.53 0.15 170); --pc-gt-4: oklch(0.55 0.22 300) }
.pc-gradient-text[data-palette="sunset"] { --pc-gt-1: oklch(0.58 0.2 35); --pc-gt-2: oklch(0.58 0.22 10); --pc-gt-3: oklch(0.55 0.22 330); --pc-gt-4: oklch(0.57 0.16 65) }
.pc-gradient-text[data-palette="ocean"] { --pc-gt-1: oklch(0.55 0.16 240); --pc-gt-2: oklch(0.53 0.12 200); --pc-gt-3: oklch(0.5 0.17 265); --pc-gt-4: oklch(0.53 0.13 185) }
.pc-gradient-text[data-palette="brand"] { --pc-gt-1: var(--chart-1); --pc-gt-2: var(--chart-2); --pc-gt-3: var(--chart-4); --pc-gt-4: var(--chart-5) }
:where(.dark) /* Restrained first: two stops, no hue party. Ink falls off to muted, metal is brushed steel, accent lifts the theme color. */
.pc-gradient-text[data-palette="ink"] { --pc-gt-1: var(--foreground); --pc-gt-gradient: linear-gradient(100deg, var(--foreground) 10%, var(--muted-foreground) 50%, var(--foreground) 90%) }
.pc-gradient-text[data-palette="metal"] { --pc-gt-1: oklch(0.35 0.01 260); --pc-gt-gradient: linear-gradient(100deg, oklch(0.28 0.01 260), oklch(0.5 0.012 260) 22%, oklch(0.36 0.01 260) 38%, oklch(0.6 0.012 260) 50%, oklch(0.36 0.01 260) 62%, oklch(0.5 0.012 260) 78%, oklch(0.28 0.01 260)) }
:where(.dark) .pc-gradient-text[data-palette="metal"] { --pc-gt-1: oklch(0.86 0.005 260); --pc-gt-gradient: linear-gradient(100deg, oklch(0.97 0.004 260), oklch(0.72 0.008 260) 22%, oklch(0.88 0.006 260) 38%, oklch(0.62 0.01 260) 50%, oklch(0.88 0.006 260) 62%, oklch(0.72 0.008 260) 78%, oklch(0.97 0.004 260)) }
.pc-gradient-text[data-palette="accent"] { --pc-gt-1: var(--chart-1); --pc-gt-gradient: linear-gradient(100deg, var(--foreground) 8%, var(--chart-1) 50%, var(--foreground) 92%) }
.pc-gradient-text[data-palette="aurora"] { --pc-gt-1: oklch(0.78 0.14 275); --pc-gt-2: oklch(0.82 0.12 210); --pc-gt-3: oklch(0.85 0.14 165); --pc-gt-4: oklch(0.76 0.17 305) }
:where(.dark) .pc-gradient-text[data-palette="sunset"] { --pc-gt-1: oklch(0.8 0.15 50); --pc-gt-2: oklch(0.74 0.18 15); --pc-gt-3: oklch(0.72 0.18 335); --pc-gt-4: oklch(0.86 0.14 80) }
:where(.dark) .pc-gradient-text[data-palette="ocean"] { --pc-gt-1: oklch(0.78 0.13 235); --pc-gt-2: oklch(0.85 0.1 195); --pc-gt-3: oklch(0.72 0.15 265); --pc-gt-4: oklch(0.86 0.11 175) }
@media (prefers-reduced-motion: reduce) { .pc-gradient-text[data-animate] { animation: none } }
`

export type GradientTextPalette = "ink" | "metal" | "accent" | "aurora" | "sunset" | "ocean" | "brand"

export type GradientTextProps = React.HTMLAttributes<HTMLSpanElement> & {
  /** Theme-aware preset. ink, metal and accent are the restrained ones; aurora, sunset and ocean are loud, so use them sparingly. "brand" follows the chart colors. */
  palette?: GradientTextPalette
  /** Custom stops; overrides `palette`. The first color is repeated at the end for a seamless loop. */
  colors?: string[]
  /** Move the gradient. */
  animate?: boolean
  /** Seconds per loop. */
  duration?: number
}

/** Text filled with a slow gradient: ink to muted by default, with metal, accent and louder presets. */
export function GradientText({ palette = "ink", colors, animate = true, duration = 8, className, style, children, ...props }: GradientTextProps) {
  const custom = colors && colors.length > 1 ? `linear-gradient(100deg, ${[...colors, colors[0]].join(", ")})` : undefined
  return (
    <>
      <GooduiTokens />
      <style href="pc-gradient-text" precedence="default">
        {CSS}
      </style>
      <span
        data-palette={palette}
        data-animate={animate ? "" : undefined}
        className={cn("pc-gradient-text", className)}
        style={{
          ...style,
          ["--pc-gt-duration" as string]: `${duration}s`,
          ...(custom ? { ["--pc-gt-gradient" as string]: custom, ["--pc-gt-1" as string]: colors![0] } : {}),
        }}
        {...props}
      >
        {children}
      </span>
    </>
  )
}

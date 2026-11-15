"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { GooduiTokens } from "@/lib/goodui-motion"

// One gradient strip, twice the button width, slides by half its width so the loop is seamless (transform only).
const CSS = `
@keyframes pc-rainbow-button-flow { to { transform: translateX(-50%) } }
.pc-rainbow-button-strip {
  position: absolute; top: 0; left: 0; height: 100%; width: 200%;
  background: linear-gradient(90deg, var(--pc-rb-1), var(--pc-rb-2), var(--pc-rb-3), var(--pc-rb-4), var(--pc-rb-5), var(--pc-rb-1)) 0 0 / 50% 100% repeat-x;
  animation: pc-rainbow-button-flow var(--pc-rb-speed, 3s) linear infinite;
}
.pc-rainbow-button-glow { opacity: .55; transition: opacity .3s, transform .3s }
.pc-rainbow-button:hover .pc-rainbow-button-glow { opacity: .9; transform: translateY(2px) scaleX(1.04) }
.dark .pc-rainbow-button-glow { opacity: .45 }
.dark .pc-rainbow-button:hover .pc-rainbow-button-glow { opacity: .75 }
@media (prefers-reduced-motion: reduce) { .pc-rainbow-button-strip { animation: none } }
`

const DEFAULT_COLORS = ["hsl(0 100% 63%)", "hsl(270 100% 63%)", "hsl(210 100% 63%)", "hsl(195 100% 63%)", "hsl(90 100% 63%)"]

const SIZES = {
  sm: { cls: "h-8 px-3.5 text-xs gap-1.5 [&_svg]:size-3.5", r: 10 },
  md: { cls: "h-10 px-5 text-sm gap-2 [&_svg]:size-4", r: 12 },
  lg: { cls: "h-12 px-7 text-base gap-2 [&_svg]:size-5", r: 14 },
} as const

export type RainbowButtonProps = React.ComponentProps<"button"> & {
  /** "solid" inverts with the theme (black in light, white in dark); "outline" uses the page background. */
  variant?: "solid" | "outline"
  /** "sm" | "md" | "lg": height, padding and corner radius (10, 12 or 14 px). */
  size?: keyof typeof SIZES
  /** Fully rounded ends. */
  pill?: boolean
  /** Five CSS colors for the flowing gradient. */
  colors?: string[]
  /** Seconds per loop. */
  speed?: number
  /** Border thickness in px. */
  borderWidth?: number
}

/** Button with a flowing rainbow border and a soft colored glow underneath; tuned for light and dark themes. */
export function RainbowButton({
  variant = "solid",
  size = "md",
  pill,
  colors = DEFAULT_COLORS,
  speed = 3,
  borderWidth = 2,
  className,
  style,
  children,
  ...props
}: RainbowButtonProps) {
  const s = SIZES[size]
  const r = pill ? 999 : s.r
  const vars: Record<string, string | number> = { "--pc-rb-speed": `${speed}s` }
  for (let i = 0; i < 5; i++) {
    const c = colors[i % colors.length]
    if (c !== undefined) vars[`--pc-rb-${i + 1}`] = c
  }

  return (
    <button
      data-slot="button"
      className={cn(
        "pc-press pc-rainbow-button group relative isolate inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap transition-transform outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
        variant === "solid" ? "text-background" : "text-foreground",
        s.cls,
        className,
      )}
      style={{ borderRadius: r, ...vars, ...style }}
      {...props}
    >
      <GooduiTokens />
      <style href="pc-rainbow-button" precedence="default">
        {CSS}
      </style>
      {/* Glow */}
      <span
        aria-hidden="true"
        className="pc-rainbow-button-glow pointer-events-none absolute inset-x-[8%] -bottom-[18%] -z-10 h-3/5 overflow-hidden blur-[14px]"
        style={{ borderRadius: r }}
      >
        <span className="pc-rainbow-button-strip" />
      </span>
      {/* Border */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" style={{ borderRadius: r }}>
        <span className="pc-rainbow-button-strip" />
      </span>
      {/* Face */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -z-10",
          variant === "solid"
            ? "bg-foreground bg-[linear-gradient(180deg,rgb(255_255_255/0.08),transparent_60%)] dark:bg-[linear-gradient(180deg,transparent_40%,rgb(0_0_0/0.06))]"
            : "bg-background",
        )}
        style={{ inset: borderWidth, borderRadius: Math.max(0, r - borderWidth) }}
      />
      {children}
    </button>
  )
}

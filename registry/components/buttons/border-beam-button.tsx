"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { GooduiTokens } from "@/lib/goodui-motion"

// The ring is masked to the border band. Inside it a short gradient "beam" rides the rounded-rect edge with
// offset-path; browsers without offset-path rect() get a rotating conic sweep instead.
const CSS = `
.pc-border-beam-button-ring {
  position: absolute; inset: 0; border-radius: inherit; padding: var(--pc-bb-width); pointer-events: none;
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
}
.pc-border-beam-button-beam {
  position: absolute; display: none; width: var(--pc-bb-size); aspect-ratio: 1;
  background: linear-gradient(to left, var(--pc-bb-from), var(--pc-bb-to), transparent);
  offset-path: rect(0 auto auto 0 round var(--pc-bb-radius)); offset-anchor: 90% 50%;
  animation: pc-border-beam-button-travel var(--pc-bb-duration) linear infinite;
}
.pc-border-beam-button-spin {
  position: absolute; left: 50%; top: 50%; width: 300%; aspect-ratio: 1; margin: -150% 0 0 -150%;
  background: conic-gradient(from 0deg, transparent 0 72%, var(--pc-bb-to) 88%, var(--pc-bb-from) 98%, transparent 100%);
  animation: pc-border-beam-button-spin var(--pc-bb-duration) linear infinite;
}
.pc-border-beam-button-late { animation-delay: calc(var(--pc-bb-duration) / -2) }
@keyframes pc-border-beam-button-travel { from { offset-distance: 0% } to { offset-distance: 100% } }
@keyframes pc-border-beam-button-spin { to { transform: rotate(360deg) } }
@supports (offset-path: rect(0 auto auto 0)) {
  .pc-border-beam-button-beam { display: block }
  .pc-border-beam-button-spin { display: none }
}
@media (prefers-reduced-motion: reduce) {
  .pc-border-beam-button-beam, .pc-border-beam-button-spin { display: none !important }
  .pc-border-beam-button-ring { background: linear-gradient(90deg, var(--pc-bb-from), var(--pc-bb-to)); opacity: .55 }
}
`

const SIZES = {
  sm: "h-8 gap-1.5 px-3 text-xs [&_svg]:size-3.5",
  md: "h-10 gap-2 px-4 text-sm [&_svg]:size-4",
  lg: "h-12 gap-2 px-6 text-base [&_svg]:size-5",
} as const

export type BorderBeamButtonProps = React.ComponentProps<"button"> & {
  /** "outline" is a page-colored face with a hairline border; "solid" fills with the primary color. */
  variant?: "outline" | "solid"
  /** "sm" | "md" | "lg": height and padding of the button. */
  size?: keyof typeof SIZES
  /** Corner radius in px (use 999 for a pill). Kept in sync with the beam path. */
  radius?: number
  /** Head color of the beam. */
  colorFrom?: string
  /** Tail color of the beam. */
  colorTo?: string
  /** Seconds per lap. */
  duration?: number
  /** Beam length in px. */
  beamSize?: number
  /** Border thickness in px. */
  borderWidth?: number
  /** Two beams chasing each other half a lap apart. */
  double?: boolean
}

/** Button with a short light beam that travels around its border. CSS only; static gradient border for reduced motion. */
export function BorderBeamButton({
  variant = "outline",
  size = "md",
  radius = 10,
  colorFrom = "#ffaa40",
  colorTo = "#9c40ff",
  duration = 4,
  beamSize = 56,
  borderWidth = 1.5,
  double,
  className,
  style,
  children,
  ...props
}: BorderBeamButtonProps) {
  const vars = {
    "--pc-bb-from": colorFrom,
    "--pc-bb-to": colorTo,
    "--pc-bb-duration": `${duration}s`,
    "--pc-bb-size": `${beamSize}px`,
    "--pc-bb-width": `${borderWidth}px`,
    "--pc-bb-radius": `${radius}px`,
  } as React.CSSProperties

  return (
    <button
      data-slot="button"
      className={cn(
        "pc-press relative isolate inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap transition-[background-color,box-shadow,transform] outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
        variant === "outline"
          ? "bg-background text-foreground shadow-[inset_0_0_0_1px_var(--border),0_1px_2px_rgb(0_0_0/0.05)] hover:bg-muted/60 dark:bg-input/20 dark:hover:bg-input/40"
          : "bg-primary text-primary-foreground shadow-[var(--pc-e1)] hover:bg-primary/90",
        SIZES[size],
        className,
      )}
      style={{ borderRadius: radius, ...vars, ...style }}
      {...props}
    >
      <GooduiTokens />
      <style href="pc-border-beam-button" precedence="default">
        {CSS}
      </style>
      <span aria-hidden="true" className="pc-border-beam-button-ring">
        <span className="pc-border-beam-button-beam" />
        <span className="pc-border-beam-button-spin" />
        {double && (
          <>
            <span className="pc-border-beam-button-beam pc-border-beam-button-late" />
            <span className="pc-border-beam-button-spin pc-border-beam-button-late" />
          </>
        )}
      </span>
      {children}
    </button>
  )
}

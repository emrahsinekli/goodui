"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { GooduiTokens } from "@/lib/goodui-motion"

// React 19 hoists and dedupes <style href precedence>, so the keyframes ship with the component.
const CSS = `
@keyframes pc-shimmer-sweep { from { transform: translateX(-120%) skewX(-20deg) } to { transform: translateX(220%) skewX(-20deg) } }
.pc-shimmer::after {
  content: ""; position: absolute; inset: 0; width: 45%;
  background: linear-gradient(90deg, transparent, var(--pc-shimmer-color, rgb(255 255 255 / 0.45)), transparent);
  animation: pc-shimmer-sweep var(--pc-shimmer-duration, 2.4s) ease-in-out infinite;
  pointer-events: none;
}
@media (prefers-reduced-motion: reduce) { .pc-shimmer::after { animation: none; opacity: 0 } }
`

export type ShimmerButtonProps = React.ComponentProps<"button"> & {
  /** Seconds per sweep. */
  duration?: number
  /** Color of the light band. */
  shimmerColor?: string
}

export function ShimmerButton({ className, duration = 2.4, shimmerColor, style, children, ...props }: ShimmerButtonProps) {
  return (
    <>
      <GooduiTokens />
      <style href="pc-shimmer-button" precedence="default">
        {CSS}
      </style>
      <button
        data-slot="button"
        className={cn(
          "pc-press pc-shimmer relative inline-flex h-10 items-center justify-center gap-2 overflow-hidden rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground shadow-[var(--pc-e1)] transition-[transform,box-shadow] outline-none hover:shadow-[var(--pc-e2)] focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4",
          className,
        )}
        style={{ ...style, ["--pc-shimmer-duration" as string]: `${duration}s`, ...(shimmerColor ? { ["--pc-shimmer-color" as string]: shimmerColor } : {}) }}
        {...props}
      >
        {children}
      </button>
    </>
  )
}

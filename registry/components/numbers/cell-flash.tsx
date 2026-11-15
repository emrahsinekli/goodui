"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { GooduiTokens } from "@/lib/goodui-motion"

const CSS = `
@keyframes pc-cell-flash-bg { 0% { opacity: 1 } 100% { opacity: 0 } }
@keyframes pc-cell-flash-arrow { 0% { opacity: 0; transform: translateY(var(--pc-cell-flash-from)) } 15%, 70% { opacity: 1; transform: translateY(0) } 100% { opacity: 0; transform: translateY(0) } }
.pc-cell-flash-bg { animation: pc-cell-flash-bg var(--pc-cell-flash-duration, 900ms) var(--pc-ease-in-out) forwards; }
.pc-cell-flash-arrow { animation: pc-cell-flash-arrow var(--pc-cell-flash-duration, 900ms) ease-out forwards; }
@media (prefers-reduced-motion: reduce) {
  .pc-cell-flash-arrow { animation-name: pc-cell-flash-bg; transform: none }
}
`

export type CellFlashDirection = "up" | "down" | "neutral"

export type CellFlashProps = Omit<React.ComponentProps<"span">, "children"> & {
  /** The value to watch. Numbers flash green when they rise and red when they fall; other values flash neutral. */
  value: number | string
  /** Rendered content. Defaults to the value. */
  children?: React.ReactNode
  /** Force a direction instead of comparing with the previous value. */
  direction?: CellFlashDirection
  /** Flash length in ms. */
  duration?: number
  /** Show a small ▲/▼ that fades out with the flash. */
  indicator?: boolean
}

const BG: Record<CellFlashDirection, string> = {
  up: "bg-emerald-500/20 dark:bg-emerald-400/20",
  down: "bg-rose-500/20 dark:bg-rose-400/20",
  neutral: "bg-sky-500/20 dark:bg-sky-400/20",
}
const FG: Record<CellFlashDirection, string> = {
  up: "text-emerald-700 dark:text-emerald-400",
  down: "text-rose-700 dark:text-rose-400",
  neutral: "text-sky-700 dark:text-sky-400",
}

/** Briefly highlights a value when it changes, green for up and red for down, like a trading terminal. */
export function CellFlash({ value, children, direction, duration = 900, indicator = true, className, style, ...props }: CellFlashProps) {
  // Track changes during render so the flash and the new value paint in the same frame.
  const [state, setState] = React.useState<{ value: number | string; count: number; dir: CellFlashDirection }>({ value, count: 0, dir: "neutral" })
  if (!Object.is(state.value, value)) {
    const dir: CellFlashDirection =
      direction ?? (typeof value === "number" && typeof state.value === "number" ? (value > state.value ? "up" : value < state.value ? "down" : "neutral") : "neutral")
    setState({ value, count: state.count + 1, dir })
  }
  const { count, dir } = state
  const vars = { ["--pc-cell-flash-duration" as string]: `${duration}ms`, ["--pc-cell-flash-from" as string]: dir === "down" ? "-3px" : "3px" }

  return (
    <span
      data-direction={count > 0 ? dir : undefined}
      className={cn("relative -mx-1.5 inline-flex items-center rounded-md px-1.5 tabular-nums", className)}
      style={{ ...vars, ...style }}
      {...props}
    >
      <GooduiTokens />
      <style href="pc-cell-flash" precedence="default">
        {CSS}
      </style>
      {count > 0 && <span key={count} aria-hidden="true" className={cn("pc-cell-flash-bg pointer-events-none absolute inset-0 rounded-[inherit]", BG[dir])} />}
      <span className="relative">{children ?? value}</span>
      {indicator && count > 0 && dir !== "neutral" && (
        // Positioned outside the text box so the arrow never shifts the layout.
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 start-full flex items-center">
          <span key={count} className={cn("pc-cell-flash-arrow text-[0.6em] leading-none opacity-0", FG[dir])}>
            {dir === "up" ? "▲" : "▼"}
          </span>
        </span>
      )}
    </span>
  )
}

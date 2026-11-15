"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import { GooduiTokens } from "@/lib/goodui-motion"

/*
 * The legend the goodui charts share. Items are real toggle buttons when the legend is interactive, so
 * hiding a series works with the keyboard and screen readers (aria-pressed), and hovering an item can
 * highlight its series in the chart through onActiveChange.
 */

export type ChartLegendShape = "square" | "dot" | "line" | "dashed"

export type ChartLegendItem = {
  key: string
  label: React.ReactNode
  /** Any CSS color, e.g. "var(--chart-2)". */
  color: string
  /** Muted value after the label, e.g. "42%" or "$12.4K". */
  value?: React.ReactNode
  /** Swatch shape for this item; the legend's shape otherwise. */
  shape?: ChartLegendShape
}

export type ChartLegendLabels = {
  /** Tooltip (title) of a toggle button; its accessible name stays the visible label. */
  toggle: (label: string, hidden: boolean) => string
  /** Accessible name of the list. */
  legend: string
}
const DEFAULT_LABELS: ChartLegendLabels = {
  toggle: (label, hidden) => (hidden ? `Show ${label}` : `Hide ${label}`),
  legend: "Legend",
}

export type ChartLegendProps = Omit<React.ComponentProps<"div">, "onToggle" | "hidden"> & {
  items: ChartLegendItem[]
  /** Keys of hidden items (controlled). */
  hidden?: string[]
  /** Hidden keys to start with when uncontrolled. */
  defaultHidden?: string[]
  /** Called with the new hidden keys after a toggle. */
  onHiddenChange?: (hidden: string[]) => void
  /** Items toggle on click, Enter and Space. On by default when hidden, defaultHidden or onHiddenChange is set. */
  interactive?: boolean
  /** Key of the highlighted item (controlled hover sync). */
  active?: string | null
  /** Called when the pointer or focus enters an item (key) or leaves (null). */
  onActiveChange?: (key: string | null) => void
  /** Swatch shape: square for bars and areas, line or dashed for lines, dot for points. */
  shape?: ChartLegendShape
  layout?: "row" | "column"
  align?: "start" | "center" | "end"
  size?: "sm" | "md"
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<ChartLegendLabels>
}

const CSS = `
.pc-chart-legend-item{color:var(--foreground);transition:color .2s,opacity .2s}
.pc-chart-legend-item[data-hidden=true]{color:var(--muted-foreground)}
.pc-chart-legend-item[data-dim=true]{opacity:.45}
.pc-chart-legend-swatch{--pc-sw:var(--chart-1);background:var(--pc-sw);transition:background-color .2s,box-shadow .2s,transform .3s var(--pc-ease-spring)}
.pc-chart-legend-item[data-hidden=true] .pc-chart-legend-swatch{transform:scale(.85)}
button.pc-chart-legend-item:active .pc-chart-legend-swatch{transform:scale(.8);transition-duration:.08s}
.pc-chart-legend-swatch[data-shape=square]{width:10px;height:10px;border-radius:3px}
.pc-chart-legend-swatch[data-shape=dot]{width:9px;height:9px;border-radius:999px}
.pc-chart-legend-swatch[data-shape=line]{width:14px;height:2.5px;border-radius:999px}
.pc-chart-legend-swatch[data-shape=dashed]{width:14px;height:0;background:none;border-top:2.5px dashed var(--pc-sw)}
.pc-chart-legend-item[data-hidden=true] .pc-chart-legend-swatch{background:transparent;box-shadow:inset 0 0 0 1.5px var(--pc-sw)}
.pc-chart-legend-item[data-hidden=true] .pc-chart-legend-swatch[data-shape=dashed]{border-color:color-mix(in oklab,var(--pc-sw) 45%,transparent)}
.pc-chart-legend-item[data-hidden=true] .pc-chart-legend-text{text-decoration:line-through;text-decoration-color:color-mix(in oklab,var(--muted-foreground) 60%,transparent)}
@media (prefers-reduced-motion:reduce){.pc-chart-legend-item,.pc-chart-legend-swatch{transition:none}}
`

/** Interactive legend: toggle buttons with aria-pressed, a hover highlight channel and square, dot, line or dashed swatches. */
export function ChartLegend({
  items,
  hidden: hiddenProp,
  defaultHidden,
  onHiddenChange,
  interactive,
  active,
  onActiveChange,
  shape = "square",
  layout = "row",
  align = "start",
  size = "md",
  labels,
  className,
  ...props
}: ChartLegendProps) {
  const l = useLabels("chart-legend", DEFAULT_LABELS, labels)
  const [inner, setInner] = React.useState<string[]>(defaultHidden ?? [])
  const hidden = hiddenProp ?? inner
  const canToggle = interactive ?? (hiddenProp !== undefined || defaultHidden !== undefined || onHiddenChange !== undefined)

  const toggle = (key: string) => {
    const next = hidden.includes(key) ? hidden.filter((k) => k !== key) : [...hidden, key]
    if (hiddenProp === undefined) setInner(next)
    onHiddenChange?.(next)
  }

  const text = size === "sm" ? "text-xs" : "text-sm"
  const pad = size === "sm" ? "px-1.5 py-0.5" : "px-2 py-1"

  return (
    <div
      role={canToggle ? "group" : "list"}
      aria-label={l.legend}
      className={cn(
        "pc-chart-legend flex min-w-0",
        layout === "row" ? "flex-row flex-wrap items-center" : "flex-col items-stretch",
        layout === "row" && (align === "center" ? "justify-center" : align === "end" ? "justify-end" : "justify-start"),
        size === "sm" ? "gap-x-1 gap-y-0.5" : "gap-x-2 gap-y-1",
        className,
      )}
      {...props}
    >
      <GooduiTokens />
      <style href="pc-chart-legend" precedence="default">
        {CSS}
      </style>
      {items.map((item) => {
        const isHidden = hidden.includes(item.key)
        const dim = active != null && active !== item.key && !isHidden
        const label = typeof item.label === "string" ? item.label : item.key
        const content = (
          <>
            <span aria-hidden="true" data-shape={item.shape ?? shape} className="pc-chart-legend-swatch inline-block shrink-0" style={{ ["--pc-sw" as string]: item.color }} />
            <span className="pc-chart-legend-text truncate">{item.label}</span>
            {item.value !== undefined && <span className="shrink-0 text-muted-foreground tabular-nums">{item.value}</span>}
          </>
        )
        const common = {
          "data-hidden": isHidden,
          "data-dim": dim,
          onPointerEnter: () => onActiveChange?.(item.key),
          onPointerLeave: () => onActiveChange?.(null),
          className: cn("pc-chart-legend-item inline-flex min-w-0 items-center gap-2 rounded-md leading-none", text, pad, layout === "column" && "justify-start"),
        }
        return canToggle ? (
          <button
            key={item.key}
            type="button"
            aria-pressed={!isHidden}
            title={l.toggle(label, isHidden)}
            onClick={() => toggle(item.key)}
            onFocus={() => onActiveChange?.(item.key)}
            onBlur={() => onActiveChange?.(null)}
            {...common}
            className={cn("pc-press", common.className, "cursor-pointer outline-none select-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50")}
          >
            {content}
          </button>
        ) : (
          <div key={item.key} role="listitem" {...common}>
            {content}
          </div>
        )
      })}
    </div>
  )
}

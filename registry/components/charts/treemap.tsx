"use client"

import * as React from "react"
import { motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import { GooduiTokens, spring as springs, ease as easing } from "@/lib/goodui-motion"

export type TreemapItem = {
  /** Defaults to the label. */
  key?: string
  label: string
  value: number
  /** Any CSS color. Defaults to the theme chart colors by size order (--chart-1 … --chart-5, then lighter tints). */
  color?: string
}

export type TreemapLabels = {
  summary: (name: string, count: number, total: string) => string
  /** Announced for the active tile. */
  item: (label: string, value: string, share: string) => string
  columnLabel: string
  columnValue: string
  columnShare: string
  noData: string
}
const DEFAULT_LABELS: TreemapLabels = {
  summary: (name, count, total) => `${name ? name + ": " : ""}${count} items, total ${total}`,
  item: (label, value, share) => `${label}: ${value}, ${share}`,
  columnLabel: "Label",
  columnValue: "Value",
  columnShare: "Share",
  noData: "No data",
}

export type TreemapProps = Omit<React.ComponentProps<"div">, "children"> & {
  data: TreemapItem[]
  /** Chart name for screen readers and the table caption. */
  title?: React.ReactNode
  /** Height in px. The width follows the container. */
  height?: number
  /** Surface gap between tiles in px. */
  gap?: number
  radius?: number
  /** Print each tile's value under its label when there is room. */
  showValues?: boolean
  /** Print each tile's share instead of (or next to) the value. */
  showShare?: boolean
  format?: Intl.NumberFormatOptions
  locale?: string
  formatValue?: (value: number) => string
  /** Seconds the layout takes to settle in; tiles stagger by 40 ms. */
  duration?: number
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<TreemapLabels>
}

function useReduce() {
  const prefers = useReducedMotion()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  return mounted && !!prefers
}

function useInView(ref: React.RefObject<Element | null>, threshold = 0.2) {
  const [inView, setInView] = React.useState(false)
  React.useEffect(() => {
    const el = ref.current
    if (!el || inView) return
    if (typeof IntersectionObserver === "undefined") {
      setInView(true)
      return
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { threshold },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, inView, threshold])
  return inView
}

function useWidth(ref: React.RefObject<HTMLElement | null>) {
  const [width, setWidth] = React.useState<number | null>(null)
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    // A hidden parent (display:none) measures 0: keep the last real width instead of collapsing the chart.
    const measure = () => {
      const w = Math.round(el.clientWidth)
      if (w > 0) setWidth(Math.max(120, w))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return width
}

type Rect = { x: number; y: number; w: number; h: number }

/** Squarified treemap (Bruls, Huizing, van Wijk): rows are laid along the shorter side while the worst aspect ratio keeps improving. */
function squarify(values: number[], rect: Rect): Rect[] {
  const total = values.reduce((s, v) => s + v, 0)
  const out: Rect[] = values.map(() => ({ x: rect.x, y: rect.y, w: 0, h: 0 }))
  if (total <= 0 || rect.w <= 0 || rect.h <= 0) return out
  const areas = values.map((v) => (v / total) * rect.w * rect.h)
  let { x, y, w, h } = rect
  let i = 0
  while (i < areas.length) {
    const vertical = w >= h
    const side = vertical ? h : w
    let count = 0
    let sum = 0
    let best = Infinity
    let lo = Infinity
    let hi = 0
    for (let j = i; j < areas.length; j++) {
      const a = areas[j] ?? 0
      const s = sum + a
      const mn = Math.min(lo, a)
      const mx = Math.max(hi, a)
      const worst = Math.max((side * side * mx) / (s * s), (s * s) / (side * side * mn))
      if (count > 0 && worst > best) break
      count++
      sum = s
      lo = mn
      hi = mx
      best = worst
    }
    if (vertical) {
      const rw = side > 0 ? sum / side : 0
      let yy = y
      for (let j = i; j < i + count; j++) {
        const rh = rw > 0 ? (areas[j] ?? 0) / rw : 0
        out[j] = { x, y: yy, w: rw, h: rh }
        yy += rh
      }
      x += rw
      w -= rw
    } else {
      const rh = side > 0 ? sum / side : 0
      let xx = x
      for (let j = i; j < i + count; j++) {
        const rw = rh > 0 ? (areas[j] ?? 0) / rh : 0
        out[j] = { x: xx, y, w: rw, h: rh }
        xx += rw
      }
      y += rh
      h -= rh
    }
    i += count
  }
  return out
}

/** Squarified treemap whose tiles spring to a new layout when values change, with labels that only show where they fit, hover and arrow-key tooltips. */
export function Treemap({
  data,
  title,
  height = 240,
  gap = 3,
  radius = 6,
  showValues = true,
  showShare = false,
  format,
  locale = "en-US",
  formatValue,
  duration = 0.8,
  labels,
  className,
  "aria-label": ariaLabel,
  ...props
}: TreemapProps) {
  const l = useLabels("treemap", DEFAULT_LABELS, labels)
  const reduce = useReduce()
  const rootRef = React.useRef<HTMLDivElement>(null)
  const plotRef = React.useRef<HTMLDivElement>(null)
  const inView = useInView(rootRef)
  const width = useWidth(plotRef)
  const [active, setActive] = React.useState<string | null>(null)
  const fmt = React.useMemo(() => formatValue ?? ((v: number) => new Intl.NumberFormat(locale, format).format(v)), [formatValue, locale, format])
  const pct = React.useMemo(() => new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }), [locale])

  const W = width ?? 0
  const items = data
    .map((d, i) => ({ ...d, key: d.key ?? d.label, index: i }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value)
  const total = items.reduce((s, d) => s + d.value, 0)
  const rects = squarify(
    items.map((d) => d.value),
    { x: -gap / 2, y: -gap / 2, w: W + gap, h: height + gap },
  )
  const tiles = items.map((d, i) => {
    const r = rects[i] ?? { x: 0, y: 0, w: 0, h: 0 }
    const base = `var(--chart-${(i % 5) + 1})`
    const color = d.color ?? (i < 5 ? base : `color-mix(in oklab, ${base} ${Math.max(35, 75 - Math.floor(i / 5) * 20)}%, var(--background))`)
    return { ...d, color, share: total > 0 ? d.value / total : 0, x: r.x + gap / 2, y: r.y + gap / 2, w: Math.max(0, r.w - gap), h: Math.max(0, r.h - gap) }
  })
  const name = typeof title === "string" ? title : ""
  const summary = ariaLabel ?? (tiles.length ? l.summary(name, tiles.length, fmt(total)) : l.noData)
  const act = active !== null ? tiles.find((t) => t.key === active) : undefined
  const announce = act ? l.item(act.label, fmt(act.value), pct.format(act.share)) : ""

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!tiles.length) return
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
      e.preventDefault()
      const dir = e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 1
      const i = tiles.findIndex((t) => t.key === active)
      setActive(tiles[(i + dir + tiles.length) % tiles.length]?.key ?? null)
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault()
      setActive((e.key === "Home" ? tiles[0] : tiles[tiles.length - 1])?.key ?? null)
    } else if (e.key === "Escape") setActive(null)
  }

  const ready = inView || reduce
  // A container resize re-packs the tiles at once; only data changes animate.
  const widthRef = React.useRef(W)
  const resized = widthRef.current !== W
  widthRef.current = W
  const spring = reduce || resized ? { duration: 0 } : springs.morph
  const tipX = act ? act.x + act.w / 2 : 0
  const tipY = act ? act.y : 0
  const tipRight = tipX > W * 0.55
  const tipBelow = tipY < 40

  return (
    <div ref={rootRef} className={cn("pc-treemap flex w-full min-w-0 flex-col gap-2", className)} {...props}>
      <GooduiTokens />
      <div
        ref={plotRef}
        role="group"
        aria-roledescription="treemap"
        aria-label={summary}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onFocus={() => setActive((k) => k ?? (tiles[0]?.key ?? null))}
        onBlur={() => setActive(null)}
        onPointerLeave={() => setActive(null)}
        className="relative w-full rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        style={{ height }}
      >
        {width !== null && tiles.length > 0 && (
          <svg width={W} height={height} viewBox={`0 0 ${W} ${height}`} className="absolute inset-0" aria-hidden="true">
            {tiles.map((t, i) => {
              const isActive = active === t.key
              const label = t.w >= t.label.length * 6.6 + 16 && t.h >= 26
              const second = label && t.h >= 46 && (showValues || showShare)
              const secondText = [showValues ? fmt(t.value) : null, showShare ? pct.format(t.share) : null].filter(Boolean).join(" · ")
              return (
                <motion.g
                  key={t.key}
                  initial={false}
                  animate={{ x: t.x, y: t.y, opacity: ready ? 1 : 0, scale: ready ? 1 : 0.85 }}
                  transition={{ x: spring, y: spring, opacity: reduce ? { duration: 0 } : { duration: 0.3, delay: i * 0.04 }, scale: reduce ? { duration: 0 } : { duration, delay: i * 0.04, ease: easing.outExpo } }}
                  className="cursor-pointer"
                  onPointerEnter={() => setActive(t.key)}
                >
                  <motion.rect
                    rx={radius}
                    initial={false}
                    animate={{ width: Math.max(0, t.w), height: Math.max(0, t.h) }}
                    transition={{ width: spring, height: spring }}
                    style={{ fill: `color-mix(in oklab, ${t.color} ${isActive ? 34 : 22}%, var(--card))`, transition: reduce ? undefined : "fill .2s" }}
                    className={cn(isActive && "stroke-foreground/40")}
                    strokeWidth={isActive ? 1 : 0}
                  />
                  <motion.rect y={0} height={3} rx={1.5} initial={false} animate={{ width: Math.max(0, t.w - radius * 2) }} transition={{ width: spring }} x={radius} style={{ fill: t.color }} />
                  {label && (
                    <text x={9} y={20} className="fill-foreground text-[12px] font-medium">
                      {t.label}
                    </text>
                  )}
                  {second && (
                    <text x={9} y={36} className="fill-muted-foreground text-[11px] tabular-nums">
                      {secondText}
                    </text>
                  )}
                </motion.g>
              )
            })}
          </svg>
        )}
        {width !== null && tiles.length === 0 && <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">{l.noData}</div>}
        {act && (
          <div
            className="pointer-events-none absolute z-10 flex flex-col gap-0.5 rounded-md border bg-popover px-2.5 py-1.5 text-xs whitespace-nowrap text-popover-foreground shadow-[var(--pc-e2)]"
            style={{ left: tipX, top: tipY, transform: `translate(${tipRight ? "calc(-100% - 10px)" : "10px"}, ${tipBelow ? "8px" : "calc(-100% - 6px)"})` }}
          >
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="inline-block size-2 rounded-[2px]" style={{ background: act.color }} />
              {act.label}
            </span>
            <span className="font-semibold tabular-nums">
              {fmt(act.value)} <span className="font-normal text-muted-foreground">· {pct.format(act.share)}</span>
            </span>
          </div>
        )}
        <span className="sr-only" aria-live="polite">
          {announce}
        </span>
      </div>
      {tiles.length > 0 && (
        <div className="sr-only">
          <table>
          <caption>{summary}</caption>
          <thead>
            <tr>
              <th scope="col">{l.columnLabel}</th>
              <th scope="col">{l.columnValue}</th>
              <th scope="col">{l.columnShare}</th>
            </tr>
          </thead>
          <tbody>
            {tiles.map((t) => (
              <tr key={t.key}>
                <th scope="row">{t.label}</th>
                <td>{fmt(t.value)}</td>
                <td>{pct.format(t.share)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  )
}

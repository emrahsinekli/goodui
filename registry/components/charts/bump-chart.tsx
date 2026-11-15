"use client"

import * as React from "react"
import { motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import { GooduiTokens, spring } from "@/lib/goodui-motion"

export type BumpSeries = {
  key: string
  label: string
  /** Rank per period, 1 = top. */
  ranks: number[]
  /** Any CSS color. Defaults to the theme chart colors in series order (--chart-1 … --chart-5). */
  color?: string
}

export type BumpChartLabels = {
  summary: (name: string, seriesCount: number, periodCount: number) => string
  /** Announced for the active point; `change` is up/down/same text or null for the first period. */
  point: (label: string, rank: string, period: string, change: string | null) => string
  rank: (n: number) => string
  up: (n: number) => string
  down: (n: number) => string
  same: string
  columnPeriod: string
  noData: string
}
const DEFAULT_LABELS: BumpChartLabels = {
  summary: (name, s, p) => `${name ? name + ": " : ""}rank of ${s} items over ${p} periods`,
  point: (label, rank, period, change) => `${label}: ${rank} in ${period}${change ? `, ${change}` : ""}`,
  rank: (n) => `#${n}`,
  up: (n) => `up ${n}`,
  down: (n) => `down ${n}`,
  same: "unchanged",
  columnPeriod: "Period",
  noData: "No data",
}

export type BumpChartProps = Omit<React.ComponentProps<"div">, "children"> & {
  series: BumpSeries[]
  periods: string[]
  /** Chart name for screen readers and the table caption. */
  title?: React.ReactNode
  /** Vertical space per rank in px. */
  rowHeight?: number
  /** Space reserved for the names at the end side, in px. */
  labelWidth?: number
  /** "#1 … #n" on the start side. */
  rankLabels?: boolean
  strokeWidth?: number
  /** Seconds one line takes to draw; lines stagger by 0.1 s. */
  duration?: number
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<BumpChartLabels>
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

/** Rank-over-time chart: lines draw in, dots pop at every rank, names sit at the line ends, and hovering or arrowing highlights one item. */
export function BumpChart({
  series,
  periods,
  title,
  rowHeight = 36,
  labelWidth = 88,
  rankLabels = true,
  strokeWidth = 2.5,
  duration = 1.1,
  labels,
  className,
  "aria-label": ariaLabel,
  ...props
}: BumpChartProps) {
  const l = useLabels("bump-chart", DEFAULT_LABELS, labels)
  const reduce = useReduce()
  const rootRef = React.useRef<HTMLDivElement>(null)
  const plotRef = React.useRef<HTMLDivElement>(null)
  const inView = useInView(rootRef)
  const width = useWidth(plotRef)
  const [active, setActive] = React.useState<{ s: number; p: number } | null>(null)
  const [hot, setHot] = React.useState<string | null>(null)

  const m = periods.length
  const maxRank = Math.max(series.length, ...series.flatMap((s) => s.ranks.slice(0, m)))
  const colorOf = (s: BumpSeries, i: number) => s.color ?? `var(--chart-${(i % 5) + 1})`
  const W = width ?? 0
  const padL = rankLabels ? 30 : 10
  const padR = labelWidth + 12
  const padT = 10
  const padB = 24
  const plotW = Math.max(10, W - padL - padR)
  const plotH = Math.max(rowHeight, (maxRank - 1) * rowHeight)
  const height = padT + plotH + padB
  const xOf = (i: number) => padL + (m > 1 ? (i / (m - 1)) * plotW : plotW / 2)
  const yOf = (rank: number) => padT + (maxRank > 1 ? ((rank - 1) / (maxRank - 1)) * plotH : plotH / 2)
  const dx = m > 1 ? plotW / (m - 1) : 0
  // Period labels thin out when columns are closer than 40px; the last period keeps its label.
  const every = Math.max(1, Math.ceil(40 / Math.max(1, dx)))
  const showPeriod = (i: number) => i === m - 1 || (i % every === 0 && (m - 1 - i) * dx >= 40)

  const pathOf = (ranks: number[]) => {
    let d = ""
    for (let i = 0; i < m; i++) {
      const r = ranks[i]
      if (r === undefined) continue
      const x = xOf(i)
      const y = yOf(r)
      if (!d) d = `M${x.toFixed(1)},${y.toFixed(1)}`
      else {
        const px = xOf(i - 1)
        const py = yOf(ranks[i - 1] ?? r)
        d += `C${(px + dx * 0.5).toFixed(1)},${py.toFixed(1)} ${(x - dx * 0.5).toFixed(1)},${y.toFixed(1)} ${x.toFixed(1)},${y.toFixed(1)}`
      }
    }
    return d
  }

  const name = typeof title === "string" ? title : ""
  const summary = ariaLabel ?? (m && series.length ? l.summary(name, series.length, m) : l.noData)
  const act = active ? series[active.s] : undefined
  const actRank = act ? act.ranks[active?.p ?? 0] : undefined
  const changeText = (s: BumpSeries, p: number) => {
    if (p === 0) return null
    const cur = s.ranks[p]
    const prev = s.ranks[p - 1]
    if (cur === undefined || prev === undefined) return null
    return cur < prev ? l.up(prev - cur) : cur > prev ? l.down(cur - prev) : l.same
  }
  const announce = act && active && actRank !== undefined ? l.point(act.label, l.rank(actRank), periods[active.p] ?? "", changeText(act, active.p)) : ""
  const highlight = hot ?? (act ? act.key : null)

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!series.length || !m) return
    const cur = active ?? { s: 0, p: m - 1 }
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault()
      setActive({ s: cur.s, p: Math.min(m - 1, Math.max(0, cur.p + (e.key === "ArrowLeft" ? -1 : 1))) })
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault()
      // Move by rank at the current period, so Up goes to the item drawn above.
      const dir = e.key === "ArrowUp" ? -1 : 1
      const order = series.map((s, i) => ({ i, r: s.ranks[cur.p] ?? Infinity })).sort((a, b) => a.r - b.r)
      const pos = order.findIndex((o) => o.i === cur.s)
      const next = order[Math.min(order.length - 1, Math.max(0, pos + dir))]
      if (next) setActive({ s: next.i, p: cur.p })
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault()
      setActive({ s: cur.s, p: e.key === "Home" ? 0 : m - 1 })
    } else if (e.key === "Escape") setActive(null)
  }

  const ready = inView || reduce
  const ease = [0.65, 0, 0.35, 1] as const
  const tipX = active ? xOf(active.p) : 0
  const tipY = active && actRank !== undefined ? yOf(actRank) : 0
  const tipRight = tipX > W * 0.55

  return (
    <div ref={rootRef} className={cn("pc-bump-chart flex w-full min-w-0 flex-col gap-2", className)} {...props}>
      <GooduiTokens />
      <div
        ref={plotRef}
        role="group"
        aria-roledescription="bump chart"
        aria-label={summary}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onFocus={() => setActive((a) => a ?? (series.length && m ? { s: 0, p: m - 1 } : null))}
        onBlur={() => setActive(null)}
        onPointerLeave={() => {
          setActive(null)
          setHot(null)
        }}
        className="relative w-full rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        style={{ height }}
      >
        {width !== null && series.length > 0 && m > 0 && (
          <svg width={W} height={height} viewBox={`0 0 ${W} ${height}`} className="absolute inset-0 overflow-visible" aria-hidden="true">
            {rankLabels &&
              Array.from({ length: maxRank }, (_, i) => (
                <text key={i} x={padL - 10} y={yOf(i + 1)} dy=".35em" textAnchor="end" className="fill-muted-foreground text-[11px] tabular-nums">
                  {l.rank(i + 1)}
                </text>
              ))}
            {periods.map((p, i) => (
              <g key={i}>
                <line x1={xOf(i)} x2={xOf(i)} y1={padT - 4} y2={padT + plotH + 4} className="stroke-border" strokeWidth={1} />
                {showPeriod(i) && (
                  <text x={xOf(i)} y={height - 6} textAnchor={i === 0 ? "start" : i === m - 1 ? "end" : "middle"} className="fill-muted-foreground text-[11px]">
                    {p}
                  </text>
                )}
              </g>
            ))}
            {series.map((s, i) => {
              const d = pathOf(s.ranks)
              const color = colorOf(s, i)
              const dim = highlight !== null && highlight !== s.key
              const last = s.ranks[m - 1]
              return (
                <g key={s.key} style={{ opacity: dim ? 0.22 : 1, transition: reduce ? undefined : "opacity .2s" }}>
                  <motion.path
                    d={d}
                    fill="none"
                    style={{ stroke: color }}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    initial={false}
                    animate={{ pathLength: ready ? 1 : 0, opacity: ready ? 1 : 0 }}
                    transition={{ pathLength: reduce ? { duration: 0 } : { duration, delay: i * 0.1, ease }, opacity: { duration: 0.01 } }}
                  />
                  <path d={d} fill="none" stroke="transparent" strokeWidth={16} className="cursor-pointer" onPointerEnter={() => setHot(s.key)} onPointerLeave={() => setHot(null)} />
                  {s.ranks.slice(0, m).map((r, p) => (
                    <motion.g
                      key={p}
                      initial={false}
                      animate={{ x: xOf(p), y: yOf(r), scale: ready ? 1 : 0, opacity: ready ? 1 : 0 }}
                      transition={{ x: { duration: 0 }, y: { duration: 0 }, scale: reduce ? { duration: 0 } : { ...spring.play, delay: i * 0.1 + (m > 1 ? (p / (m - 1)) * duration : 0) }, opacity: { duration: 0.01 } }}
                      className="cursor-pointer"
                      onPointerEnter={() => {
                        setHot(s.key)
                        setActive({ s: i, p })
                      }}
                      onPointerLeave={() => setActive(null)}
                    >
                      <circle r={11} fill="transparent" />
                      <circle r={active && active.s === i && active.p === p ? strokeWidth + 3.5 : strokeWidth + 2} style={{ fill: color }} className="stroke-background" strokeWidth={2} />
                    </motion.g>
                  ))}
                  {last !== undefined && (
                    <motion.text
                      x={padL + plotW + 12}
                      y={yOf(last)}
                      dy=".35em"
                      className={cn("text-[12px]", dim ? "fill-muted-foreground" : "fill-foreground font-medium")}
                      initial={false}
                      animate={{ opacity: ready ? 1 : 0, x: ready ? 0 : -6 }}
                      transition={reduce ? { duration: 0 } : { duration: 0.35, delay: i * 0.1 + duration * 0.9 }}
                    >
                      {s.label}
                    </motion.text>
                  )}
                </g>
              )
            })}
          </svg>
        )}
        {width !== null && (series.length === 0 || m === 0) && <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">{l.noData}</div>}
        {act && active && actRank !== undefined && (
          <div
            className="pointer-events-none absolute z-10 flex flex-col gap-0.5 rounded-md border bg-popover px-2.5 py-1.5 text-xs whitespace-nowrap text-popover-foreground shadow-[var(--pc-e2)]"
            style={{ left: tipX, top: tipY, transform: `translate(${tipRight ? "calc(-100% - 14px)" : "14px"}, -50%)` }}
          >
            <span className="text-muted-foreground">{periods[active.p]}</span>
            <span className="flex items-center gap-1.5 font-semibold">
              <span className="inline-block size-2 rounded-full" style={{ background: colorOf(act, active.s) }} />
              {act.label}
              <span className="ms-1 tabular-nums">{l.rank(actRank)}</span>
            </span>
            {changeText(act, active.p) && <span className="text-muted-foreground">{changeText(act, active.p)}</span>}
          </div>
        )}
        <span className="sr-only" aria-live="polite">
          {announce}
        </span>
      </div>
      {series.length > 0 && m > 0 && (
        <div className="sr-only">
          <table>
          <caption>{summary}</caption>
          <thead>
            <tr>
              <th scope="col">{l.columnPeriod}</th>
              {series.map((s) => (
                <th key={s.key} scope="col">
                  {s.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map((p, i) => (
              <tr key={i}>
                <th scope="row">{p}</th>
                {series.map((s) => (
                  <td key={s.key}>{s.ranks[i] === undefined ? "" : l.rank(s.ranks[i] ?? 0)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  )
}

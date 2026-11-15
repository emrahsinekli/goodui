"use client"

import * as React from "react"
import { motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import { GooduiTokens, spring, ease as easing } from "@/lib/goodui-motion"

export type TimelineRow = {
  /** Defaults to the label. */
  key?: string
  label: string
  /** ISO date, e.g. "2026-11-02". */
  start: string
  /** ISO date; omit for a milestone. */
  end?: string
  /** 0 to 1, fills the bar. */
  progress?: number
  /** Any CSS color. Defaults to the theme chart colors by group order (--chart-1 … --chart-5). */
  color?: string
  /** Rows with the same group sit under one header. */
  group?: string
  /** Draws a diamond on the start date instead of a bar. */
  milestone?: boolean
}

export type TimelineChartLabels = {
  today: string
  summary: (name: string, rows: number, from: string, to: string) => string
  /** Announced for the active row. */
  row: (label: string, start: string, end: string | null, days: string, progress: string | null) => string
  days: (n: number) => string
  milestone: string
  columnTask: string
  columnStart: string
  columnEnd: string
  columnProgress: string
  noData: string
}
const DEFAULT_LABELS: TimelineChartLabels = {
  today: "Today",
  summary: (name, rows, from, to) => `${name ? name + ": " : ""}${rows} rows from ${from} to ${to}`,
  row: (label, start, end, days, progress) => `${label}: ${end ? `${start} to ${end}, ${days}` : start}${progress ? `, ${progress}` : ""}`,
  days: (n) => `${n} ${n === 1 ? "day" : "days"}`,
  milestone: "Milestone",
  columnTask: "Task",
  columnStart: "Start",
  columnEnd: "End",
  columnProgress: "Progress",
  noData: "No data",
}

export type TimelineChartProps = Omit<React.ComponentProps<"div">, "children"> & {
  rows: TimelineRow[]
  /** Chart name for screen readers and the table caption. */
  title?: React.ReactNode
  /** First day shown (ISO). Defaults to the earliest start, minus a day. */
  from?: string
  /** Last day shown (ISO). Defaults to the latest end, plus a day. */
  to?: string
  /** ISO date of the today marker. Pass it in (no clock is read during render). */
  today?: string
  rowHeight?: number
  /** Width of the label column in px. */
  labelWidth?: number
  /** First weekday for week ticks: 1 Monday (default) or 0 Sunday. */
  weekStart?: 0 | 1
  locale?: string
  /** Formats dates for the tooltip and screen readers. */
  formatDate?: (date: Date) => string
  /** Seconds a bar takes to grow; bars stagger by 60 ms. */
  duration?: number
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<TimelineChartLabels>
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
      if (w > 0) setWidth(Math.max(60, w))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return width
}

const DAY = 86400000
function parseDate(s: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s)
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(s)
}
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
const daysBetween = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / DAY)

/** Mini Gantt: rows of bars that grow from their start date on view, with progress fills, milestones, group headers, a today marker and arrow-key rows. */
export function TimelineChart({
  rows,
  title,
  from: fromProp,
  to: toProp,
  today,
  rowHeight = 36,
  labelWidth = 128,
  weekStart = 1,
  locale = "en-US",
  formatDate,
  duration = 0.9,
  labels,
  className,
  "aria-label": ariaLabel,
  ...props
}: TimelineChartProps) {
  const l = useLabels("timeline-chart", DEFAULT_LABELS, labels)
  const reduce = useReduce()
  const rootRef = React.useRef<HTMLDivElement>(null)
  const trackRef = React.useRef<HTMLDivElement>(null)
  const inView = useInView(rootRef)
  const trackW = useWidth(trackRef)
  const [active, setActive] = React.useState<number | null>(null)
  const dateFmt = React.useMemo(() => formatDate ?? ((d: Date) => new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(d)), [formatDate, locale])
  const pct = React.useMemo(() => new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }), [locale])

  const items = rows.map((r, i) => {
    const start = parseDate(r.start)
    const end = r.end && !r.milestone ? parseDate(r.end) : null
    return { ...r, key: r.key ?? r.label, index: i, start, end }
  })
  const starts = items.map((r) => r.start.getTime())
  const ends = items.map((r) => (r.end ?? r.start).getTime())
  const from = fromProp ? parseDate(fromProp) : items.length ? addDays(new Date(Math.min(...starts)), -1) : new Date(2026, 0, 1)
  const to = toProp ? parseDate(toProp) : items.length ? addDays(new Date(Math.max(...ends)), 2) : addDays(from, 30)
  const span = Math.max(1, to.getTime() - from.getTime())
  const posOf = (d: Date) => Math.min(100, Math.max(0, ((d.getTime() - from.getTime()) / span) * 100))
  const spanDays = span / DAY

  // Ticks: days, week starts or month starts, thinned until labels have room.
  const ticks: { date: Date; text: string }[] = []
  const unit = spanDays <= 21 ? "day" : spanDays <= 130 ? "week" : "month"
  const tickFmt = new Intl.DateTimeFormat(locale, unit === "month" ? { month: "short" } : unit === "day" ? { day: "numeric" } : { month: "short", day: "numeric" })
  const monthDay = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" })
  for (let d = new Date(from.getFullYear(), from.getMonth(), from.getDate()); d <= to; d = unit === "month" ? new Date(d.getFullYear(), d.getMonth() + 1, 1) : addDays(d, 1)) {
    if (unit === "week" && d.getDay() !== weekStart) continue
    if (unit === "month" && d.getDate() !== 1) {
      d = new Date(d.getFullYear(), d.getMonth() + 1, 1)
      if (d > to) break
    }
    ticks.push({ date: d, text: unit === "day" && (d.getDate() === 1 || ticks.length === 0) ? monthDay.format(d) : tickFmt.format(d) })
  }
  const pxPerTick = trackW && ticks.length > 1 ? (trackW * (posOf(ticks[1]?.date ?? to) - posOf(ticks[0]?.date ?? from))) / 100 : 999
  const every = pxPerTick < 44 ? Math.ceil(44 / Math.max(1, pxPerTick)) : 1

  // Groups keep their first-seen order; rows without a group come first.
  const groups: { name: string | undefined; rows: typeof items }[] = []
  for (const r of items) {
    const g = groups.find((x) => x.name === r.group)
    if (g) g.rows.push(r)
    else groups.push({ name: r.group, rows: [r] })
  }
  const colorOf = (r: (typeof items)[number]) => r.color ?? `var(--chart-${((groups.findIndex((g) => g.name === r.group) + 5) % 5) + 1})`
  const todayDate = today ? parseDate(today) : null
  const showToday = todayDate && todayDate >= from && todayDate <= to

  const name = typeof title === "string" ? title : ""
  const summary = ariaLabel ?? (items.length ? l.summary(name, items.length, dateFmt(from), dateFmt(to)) : l.noData)
  const act = active !== null ? items[active] : undefined
  const rowText = (r: (typeof items)[number]) =>
    l.row(r.label, dateFmt(r.start), r.end ? dateFmt(r.end) : null, r.end ? l.days(daysBetween(r.start, r.end) + 1) : l.milestone, r.progress !== undefined && r.end ? pct.format(r.progress) : null)
  const announce = act ? rowText(act) : ""

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!items.length) return
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      e.preventDefault()
      const dir = e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 1
      setActive((i) => Math.min(items.length - 1, Math.max(0, (i ?? (dir > 0 ? -1 : items.length)) + dir)))
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault()
      setActive(e.key === "Home" ? 0 : items.length - 1)
    } else if (e.key === "Escape") setActive(null)
  }

  const ready = inView || reduce
  const tipLeft = act ? posOf(act.start) : 0
  const tipRight = tipLeft > 55
  let order = 0

  return (
    <div ref={rootRef} className={cn("pc-timeline-chart flex w-full min-w-0 flex-col gap-2", className)} {...props}>
      <GooduiTokens />
      <div
        role="group"
        aria-roledescription="timeline"
        aria-label={summary}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onFocus={() => setActive((i) => i ?? (items.length ? 0 : null))}
        onBlur={() => setActive(null)}
        onPointerLeave={() => setActive(null)}
        className="relative grid rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        style={{ gridTemplateColumns: `${labelWidth}px minmax(0,1fr)` }}
      >
        <div className="h-6" />
        <div ref={trackRef} dir="ltr" className="relative h-6">
          {ticks.map((t, i) =>
            i % every === 0 && !(showToday && todayDate && (Math.abs(posOf(t.date) - posOf(todayDate)) * (trackW ?? 0)) / 100 < 34) ? (
              <span key={i} className="absolute top-1 -translate-x-1/2 text-[10px] whitespace-nowrap text-muted-foreground" style={{ left: `${posOf(t.date)}%` }}>
                {t.text}
              </span>
            ) : null,
          )}
          {showToday && todayDate && (
            <span className="absolute top-0.5 z-[1] -translate-x-1/2 rounded-full bg-primary px-1.5 text-[10px] leading-4 font-medium text-primary-foreground" style={{ left: `${posOf(todayDate)}%` }}>
              {l.today}
            </span>
          )}
        </div>
        {groups.map((g) => (
          <React.Fragment key={g.name ?? "__none"}>
            {g.name !== undefined && (
              <>
                <div className="flex h-7 items-end pb-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{g.name}</div>
                <div className="h-7" />
              </>
            )}
            {g.rows.map((r) => {
              const i = r.index
              const k = order++
              const isActive = active === i
              const left = posOf(r.start)
              const widthPct = r.end ? Math.max(0.8, posOf(addDays(r.end, 1)) - left) : 0
              const barPx = trackW ? (trackW * widthPct) / 100 : 0
              const color = colorOf(r)
              return (
                <React.Fragment key={r.key}>
                  <div
                    onPointerEnter={() => setActive(i)}
                    className={cn("flex items-center truncate rounded-s-md pe-3 text-sm transition-colors", isActive ? "bg-muted/60 font-medium" : "text-foreground/85")}
                    style={{ height: rowHeight }}
                  >
                    <span className="truncate">{r.label}</span>
                  </div>
                  <div dir="ltr" onPointerEnter={() => setActive(i)} className={cn("relative rounded-e-md transition-colors", isActive && "bg-muted/60")} style={{ height: rowHeight }}>
                    {ticks.map((t, ti) => (
                      <span key={ti} className="absolute inset-y-0 w-px bg-border" style={{ left: `${posOf(t.date)}%` }} />
                    ))}
                    {r.end ? (
                      <motion.div
                        className="absolute top-1/2 h-[22px] origin-left overflow-hidden rounded-[5px]"
                        style={{ left: `${left}%`, width: `${widthPct}%`, y: "-50%", background: `color-mix(in oklab, ${color} 26%, var(--card))` }}
                        initial={false}
                        animate={{ scaleX: ready ? 1 : 0 }}
                        transition={reduce ? { duration: 0 } : { duration, delay: k * 0.06, ease: easing.outExpo }}
                      >
                        {r.progress !== undefined && <span className="absolute inset-y-0 left-0 rounded-[5px]" style={{ width: `${Math.min(1, Math.max(0, r.progress)) * 100}%`, background: color }} />}
                        {r.progress !== undefined && barPx >= 52 && (
                          <span className="absolute inset-y-0 right-1.5 flex items-center">
                            <span className="rounded-sm bg-card/85 px-1 text-[10px] leading-4 font-medium text-foreground/85 tabular-nums">{pct.format(r.progress)}</span>
                          </span>
                        )}
                      </motion.div>
                    ) : (
                      <motion.span
                        className="absolute top-1/2 size-3 -translate-x-1/2 rotate-45 rounded-[2px]"
                        style={{ left: `${left}%`, y: "-50%", background: color }}
                        initial={false}
                        animate={{ scale: ready ? 1 : 0, rotate: 45 }}
                        transition={reduce ? { duration: 0 } : { ...spring.play, delay: k * 0.06 + 0.2 }}
                      />
                    )}
                  </div>
                </React.Fragment>
              )
            })}
          </React.Fragment>
        ))}
        {showToday && todayDate && (
          <span className="pointer-events-none absolute top-6 bottom-0 w-px bg-primary" style={{ left: `calc(${labelWidth}px + (100% - ${labelWidth}px) * ${posOf(todayDate) / 100})` }} aria-hidden="true" />
        )}
        {items.length === 0 && <div className="col-span-2 grid h-24 place-items-center text-sm text-muted-foreground">{l.noData}</div>}
        {act && (
          <div
            className="pointer-events-none absolute z-10 flex flex-col gap-0.5 rounded-md border bg-popover px-2.5 py-1.5 text-xs whitespace-nowrap text-popover-foreground shadow-[var(--pc-e2)]"
            style={{ left: `calc(${labelWidth}px + (100% - ${labelWidth}px) * ${tipLeft / 100})`, top: 24, transform: `translateX(${tipRight ? "calc(-100% - 8px)" : "8px"})` }}
          >
            <span className="flex items-center gap-1.5 font-semibold">
              <span className="inline-block size-2 rounded-[2px]" style={{ background: colorOf(act) }} />
              {act.label}
            </span>
            <span className="text-muted-foreground">{act.end ? `${dateFmt(act.start)} – ${dateFmt(act.end)} · ${l.days(daysBetween(act.start, act.end) + 1)}` : `${dateFmt(act.start)} · ${l.milestone}`}</span>
            {act.progress !== undefined && act.end && <span className="tabular-nums">{pct.format(act.progress)}</span>}
          </div>
        )}
        <span className="sr-only" aria-live="polite">
          {announce}
        </span>
      </div>
      {items.length > 0 && (
        <div className="sr-only">
          <table>
          <caption>{summary}</caption>
          <thead>
            <tr>
              <th scope="col">{l.columnTask}</th>
              <th scope="col">{l.columnStart}</th>
              <th scope="col">{l.columnEnd}</th>
              <th scope="col">{l.columnProgress}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.key}>
                <th scope="row">{r.label}</th>
                <td>{dateFmt(r.start)}</td>
                <td>{r.end ? dateFmt(r.end) : l.milestone}</td>
                <td>{r.progress !== undefined && r.end ? pct.format(r.progress) : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  )
}

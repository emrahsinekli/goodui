"use client"

import * as React from "react"
import { CalendarDays, Clock3, Flame, Trophy } from "lucide-react"
import { Tooltip, TooltipGroup } from "@/registry/components/core/tooltip"
import { NumberFlow } from "@/registry/components/numbers/number-flow"
import { cn } from "@/lib/utils"

/* ---------- Demo data: one year of daily bookings ending Sat 31 Oct 2026 ---------- */

const END = Date.UTC(2026, 9, 31) // last cell
const DAYS = 371 // 53 weeks
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

type Metric = "bookings" | "revenue"
type Day = { ts: number; dow: number; bookings: number; revenue: number }

function hash(i: number) {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}

// Deterministic: Saturdays busy, Sundays closed, a slow February, a holiday dip at Christmas.
const START = END - (DAYS - 1) * 86400000
const startDow = new Date(START).getUTCDay()
const DATA: Day[] = Array.from({ length: DAYS }, (_, i) => {
  const ts = START + i * 86400000
  const d = new Date(ts)
  const dow = d.getUTCDay()
  const month = d.getUTCMonth()
  let base = dow === 0 ? 0 : dow === 6 ? 30 : dow === 5 ? 24 : 17
  if (month === 1) base *= 0.7
  if (month === 11 && d.getUTCDate() >= 23) base *= 0.25
  if (month === 11 && d.getUTCDate() < 23) base *= 1.25
  if (month === 5 || month === 6) base *= 1.1
  const closed = (month === 11 && (d.getUTCDate() === 25 || d.getUTCDate() === 26)) || (month === 0 && d.getUTCDate() === 1) || (month === 7 && d.getUTCDate() >= 10 && d.getUTCDate() <= 16)
  if (closed) base = 0
  const bookings = base === 0 ? 0 : Math.max(0, Math.round(base + (hash(i) - 0.4) * 14 + i / 60))
  return { ts, dow, bookings, revenue: Math.round(bookings * (58 + hash(i + 7) * 30)) }
})

const HOURS = Array.from({ length: 13 }, (_, h) => h + 8) // 08:00–20:00
const HOUR_LOAD = [6, 14, 22, 27, 25, 18, 21, 28, 30, 26, 19, 11, 4]
const WEEKDAY_LOAD = [0, 62, 70, 74, 88, 96, 100]

const fmtDate = (ts: number) => {
  const d = new Date(ts)
  return `${DOW[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}
const money = (n: number) => `$${n.toLocaleString("en-US")}`
const ring = "outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background"

/* ---------- Block ---------- */

export default function ActivityHeatmap() {
  const [metric, setMetric] = React.useState<Metric>("bookings")
  const [focus, setFocus] = React.useState<Day | null>(null)
  const [range, setRange] = React.useState<"year" | "quarter">("year")

  const shown = range === "year" ? DATA : DATA.slice(DAYS - 91)
  const max = Math.max(...shown.map((d) => d[metric]))
  const level = (v: number) => (v === 0 ? 0 : Math.min(4, 1 + Math.floor((v / max) * 3.99)))
  const firstDow = range === "year" ? startDow : new Date(shown[0]!.ts).getUTCDay()
  const cols = Math.ceil((shown.length + firstDow) / 7)
  const weeks = Array.from({ length: cols }, (_, w) => Array.from({ length: 7 }, (_, d) => shown[w * 7 + d - firstDow] ?? null))

  // Streaks: consecutive open days with at least one booking.
  let cur = 0
  let longest = 0
  let run = 0
  for (const d of DATA) {
    if (d.dow === 0) continue
    if (d.bookings > 0) {
      run++
      longest = Math.max(longest, run)
    } else run = 0
  }
  cur = run
  const total = shown.reduce((s, d) => s + d[metric], 0)
  const busiest = shown.reduce((a, b) => (b[metric] > a[metric] ? b : a))
  const openDays = shown.filter((d) => d.dow !== 0).length
  const monthLabels = weeks.map((w, i) => {
    const first = w.find((d) => d)
    if (!first) return null
    const m = new Date(first.ts).getUTCMonth()
    const prev = weeks[i - 1]?.find((d) => d)
    return prev && new Date(prev.ts).getUTCMonth() === m ? null : MONTHS[m]
  })
  const shades = ["bg-muted", "bg-primary/25", "bg-primary/50", "bg-primary/75", "bg-primary"]

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Booking activity</h2>
            <p className="text-sm text-muted-foreground">Every day of the last year at a glance · Downtown studio</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div role="radiogroup" aria-label="Metric" className="flex rounded-lg bg-muted p-0.5 text-xs">
              {(["bookings", "revenue"] as const).map((m) => (
                <button key={m} type="button" role="radio" aria-checked={metric === m} onClick={() => setMetric(m)} className={cn("rounded-md px-2.5 py-1 font-medium text-foreground/70 capitalize transition-colors", metric === m && "bg-background text-foreground shadow-xs", ring)}>
                  {m}
                </button>
              ))}
            </div>
            <div role="radiogroup" aria-label="Range" className="flex rounded-lg bg-muted p-0.5 text-xs">
              {(
                [
                  ["year", "12 months"],
                  ["quarter", "90 days"],
                ] as const
              ).map(([k, label]) => (
                <button key={k} type="button" role="radio" aria-checked={range === k} onClick={() => setRange(k)} className={cn("rounded-md px-2.5 py-1 font-medium text-foreground/70 transition-colors", range === k && "bg-background text-foreground shadow-xs", ring)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Streak strip */}
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="flex items-center gap-3 rounded-2xl border bg-gradient-to-br from-orange-500/15 to-rose-500/10 p-4">
            <span className="flex size-10 items-center justify-center rounded-xl bg-orange-500 text-white">
              <Flame className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Current streak</p>
              <p className="text-2xl font-semibold tabular-nums">
                {cur} <span className="text-sm font-normal text-muted-foreground">open days</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border bg-card p-4">
            <span className="flex size-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300">
              <Trophy className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Longest streak</p>
              <p className="text-2xl font-semibold tabular-nums">
                {longest} <span className="text-sm font-normal text-muted-foreground">days</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border bg-card p-4">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarDays className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total {metric}</p>
              <p className="text-2xl font-semibold tabular-nums">
                <NumberFlow value={total} format={metric === "revenue" ? { style: "currency", currency: "USD", maximumFractionDigits: 0 } : undefined} />
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border bg-card p-4">
            <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-700 dark:text-emerald-300">
              <Clock3 className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Busiest day</p>
              <p className="truncate text-sm font-semibold">{fmtDate(busiest.ts)}</p>
              <p className="text-xs text-muted-foreground tabular-nums">{metric === "revenue" ? money(busiest.revenue) : `${busiest.bookings} bookings`}</p>
            </div>
          </div>
        </div>

        {/* Heatmap */}
        <section className="rounded-2xl border bg-card p-4 sm:p-5" aria-label="Calendar heatmap">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">{range === "year" ? "Last 12 months" : "Last 90 days"}</h3>
            <p className="text-xs text-muted-foreground tabular-nums" aria-live="polite">
              {focus ? `${fmtDate(focus.ts)} · ${focus.bookings} bookings · ${money(focus.revenue)}` : `${openDays} open days · avg ${metric === "revenue" ? money(Math.round(total / openDays)) : Math.round(total / openDays)} per day`}
            </p>
          </div>
          <TooltipGroup delay={100}>
            <div className="relative mt-3 overflow-x-auto pb-1">
              <div className="flex gap-2" style={{ minWidth: range === "year" ? 760 : 0 }}>
                <div className="flex flex-col gap-[3px] pt-5 text-[10px] text-muted-foreground" aria-hidden="true">
                  {DOW.map((d, i) => (
                    <span key={d} className="h-3 leading-3">
                      {i % 2 === 1 ? d : ""}
                    </span>
                  ))}
                </div>
                <div className="flex-1">
                  <div className="flex h-5 text-[10px] text-muted-foreground" aria-hidden="true">
                    {monthLabels.map((m, i) => (
                      <span key={i} className="min-w-0 flex-1 whitespace-nowrap">
                        {m ?? ""}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-[3px]" aria-label={`Daily ${metric}`}>
                    {weeks.map((w, wi) => (
                      <div key={wi} className="flex flex-1 flex-col gap-[3px]">
                        {w.map((d, di) =>
                          d ? (
                            <Tooltip key={di} content={`${fmtDate(d.ts)}: ${d.bookings} bookings, ${money(d.revenue)}`} side="top">
                              <button
                                type="button"
                                aria-label={`${fmtDate(d.ts)}: ${d.bookings} bookings`}
                                onFocus={() => setFocus(d)}
                                onBlur={() => setFocus(null)}
                                onMouseEnter={() => setFocus(d)}
                                onMouseLeave={() => setFocus(null)}
                                className={cn("block h-3 w-full rounded-[3px] transition-transform hover:scale-125", shades[level(d[metric])], d.dow === 0 && "bg-muted/40", ring)}
                              />
                            </Tooltip>
                          ) : (
                            <span key={di} className="block h-3 w-full" aria-hidden="true" />
                          ),
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TooltipGroup>
          <div className="mt-3 flex items-center justify-end gap-1.5 text-[11px] text-muted-foreground">
            <span>Less</span>
            {shades.map((s) => (
              <span key={s} className={cn("size-3 rounded-[3px]", s)} aria-hidden="true" />
            ))}
            <span>More</span>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-[1.5fr_1fr] [&>*]:min-w-0">
          {/* Best hours */}
          <section className="rounded-2xl border bg-card p-4 sm:p-5" aria-label="Best hours">
            <h3 className="text-sm font-semibold">Best hours</h3>
            <p className="text-xs text-muted-foreground">Average bookings per hour, open days only</p>
            <div className="mt-4 flex h-36 items-end gap-1.5" role="img" aria-label="Bookings by hour; busiest at 16:00 and 11:00">
              {HOURS.map((h, i) => {
                const v = HOUR_LOAD[i]!
                const top = v === Math.max(...HOUR_LOAD)
                return (
                  <div key={h} className="group flex h-full flex-1 flex-col items-center justify-end gap-1">
                    <span className={cn("text-[10px] font-medium tabular-nums", top ? "text-primary" : "text-muted-foreground opacity-0 group-hover:opacity-100")}>{v}</span>
                    <div className={cn("w-full rounded-t-md transition-colors", top ? "bg-primary" : "bg-primary/35 group-hover:bg-primary/60")} style={{ height: `${(v / 30) * 100}%` }} />
                    <span className="text-[10px] text-muted-foreground tabular-nums">{h}</span>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Best weekdays */}
          <section className="rounded-2xl border bg-card p-4 sm:p-5" aria-label="Best weekdays">
            <h3 className="text-sm font-semibold">Best weekdays</h3>
            <p className="text-xs text-muted-foreground">Relative to the busiest day</p>
            <ul className="mt-4 flex flex-col gap-2">
              {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                <li key={d} className="flex items-center gap-3 text-xs">
                  <span className="w-8 text-muted-foreground">{DOW[d]}</span>
                  <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                    <span className={cn("block h-full rounded-full", WEEKDAY_LOAD[d] === 100 ? "bg-primary" : "bg-primary/50")} style={{ width: `${WEEKDAY_LOAD[d]}%` }} />
                  </span>
                  <span className="w-10 text-right font-medium tabular-nums">{d === 0 ? "closed" : `${WEEKDAY_LOAD[d]}%`}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}

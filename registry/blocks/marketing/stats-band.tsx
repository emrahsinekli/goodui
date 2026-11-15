"use client"

import * as React from "react"
import { Clock, Globe2, RotateCcw, type LucideIcon, CalendarCheck, Star } from "lucide-react"
import { Button } from "@/registry/components/core/button"
import { CounterUp } from "@/registry/components/numbers/counter-up"
import { SparklineDraw } from "@/registry/components/numbers/sparkline-draw"
import { cn } from "@/lib/utils"

/* ---------- Demo data ---------- */

type Stat = { id: string; label: string; value: number; prefix?: string; suffix?: string; format?: Intl.NumberFormatOptions; icon: LucideIcon; note: string; data: number[]; accent: string }

const STATS: Stat[] = [
  { id: "bookings", label: "Bookings made", value: 12.4, suffix: "M", format: { minimumFractionDigits: 1, maximumFractionDigits: 1 }, icon: CalendarCheck, note: "and about 9,000 more every hour", data: [3, 4, 4, 6, 7, 9, 12, 14, 18, 24], accent: "var(--chart-1)" },
  { id: "noshow", label: "Fewer no-shows", value: 38, suffix: "%", icon: RotateCcw, note: "median across studios after 90 days", data: [14, 13, 11, 10, 9, 8, 7, 7, 6, 5], accent: "var(--chart-2)" },
  { id: "hours", label: "Hours saved weekly", value: 6.5, suffix: " h", format: { minimumFractionDigits: 1, maximumFractionDigits: 1 }, icon: Clock, note: "per front desk, no more phone tag", data: [1, 2, 2, 3, 4, 4, 5, 6, 6, 7], accent: "var(--chart-3)" },
  { id: "countries", label: "Countries", value: 14, icon: Globe2, note: "18 languages on the booking page", data: [2, 3, 4, 5, 7, 8, 10, 11, 13, 14], accent: "var(--chart-4)" },
]

/* ---------- Block ---------- */

export default function StatsBand() {
  const [run, setRun] = React.useState(0)
  const [active, setActive] = React.useState<string>("bookings")
  const stat = STATS.find((s) => s.id === active) ?? STATS[0]!

  return (
    <div className="p-4 md:p-6">
      <section className="mx-auto max-w-6xl overflow-hidden rounded-3xl border bg-card">
        <div className="grid lg:grid-cols-[1fr_1.4fr]">
          <div className="flex flex-col justify-between gap-6 border-b p-6 sm:p-8 lg:border-r lg:border-b-0">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <span className="flex text-amber-500" role="img" aria-label="5 stars"><Star className="size-3.5 fill-current" /></span> Numbers from the last 12 months
              </div>
              <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">The boring numbers behind calmer front desks</h2>
              <p className="mt-3 text-muted-foreground">Every stat here is pulled from live accounts. Hover one to see its trend.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" tone="neutral" iconLeft={<RotateCcw />} onClick={() => setRun((r) => r + 1)}>Replay counters</Button>
            </div>
          </div>
          <div className="grid grid-cols-2" key={run}>
            {STATS.map((s, i) => {
              const Icon = s.icon
              const on = active === s.id
              return (
                <div key={s.id} className={cn("relative", i % 2 === 0 && "border-r", i < 2 && "border-b")}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => setActive(s.id)}
                  onPointerEnter={() => setActive(s.id)}
                  onFocus={() => setActive(s.id)}
                  className={cn("group flex h-full w-full flex-col items-start gap-1 p-5 text-start transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:ring-inset sm:p-7", on ? "bg-muted/60" : "hover:bg-muted/30")}
                >
                  <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Icon className="size-4" style={{ color: s.accent }} /> {s.label}
                  </span>
                  <span className="mt-1 text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
                    <CounterUp value={s.value} prefix={s.prefix} suffix={s.suffix} format={s.format} delay={i * 0.1} duration={1.4} />
                  </span>
                  <span className="text-xs text-muted-foreground">{s.note}</span>
                </button>
                <span aria-hidden="true" className={cn("pointer-events-none absolute right-3 bottom-3 w-24 opacity-0 transition-opacity duration-300", on && "opacity-100")}>
                  <SparklineDraw data={s.data} className="h-8 w-24" color={s.accent} tooltip={false} />
                </span>
                </div>
              )
            })}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t bg-muted/30 px-6 py-3 text-xs text-muted-foreground sm:px-8" aria-live="polite">
          <span><strong className="font-medium text-foreground">{stat.label}</strong>: {stat.data[0]} → {stat.data[stat.data.length - 1]} over the year</span>
          <span className="ms-auto hidden sm:inline">Updated nightly from production</span>
        </div>
      </section>
    </div>
  )
}

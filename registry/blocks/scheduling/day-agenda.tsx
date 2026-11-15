"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, GripHorizontal, Pause, Play } from "lucide-react"
import { Avatar } from "@/registry/components/core/avatar"
import { Button } from "@/registry/components/core/button"
import { cn } from "@/lib/utils"

/* ---------- Demo data ---------- */

type Ev = { id: number; start: number; end: number; title: string; client: string; staff: string; tone: string }
const START_H = 8
const END_H = 19
const PX_PER_MIN = 1.4
const SNAP = 15

const TONES = {
  maya: "border-violet-500/50 bg-violet-500/12 text-violet-900 dark:text-violet-100",
  diego: "border-sky-500/50 bg-sky-500/12 text-sky-900 dark:text-sky-100",
  lena: "border-rose-500/50 bg-rose-500/12 text-rose-900 dark:text-rose-100",
  priya: "border-emerald-500/50 bg-emerald-500/12 text-emerald-900 dark:text-emerald-100",
}

const INITIAL: Ev[] = [
  { id: 1, start: 9 * 60, end: 11 * 60 + 30, title: "Balayage", client: "Maya Chen", staff: "Priya Shah", tone: TONES.priya },
  { id: 2, start: 9 * 60 + 30, end: 10 * 60, title: "Beard trim", client: "Omar Haddad", staff: "Diego Ramos", tone: TONES.diego },
  { id: 3, start: 9 * 60 + 45, end: 10 * 60 + 45, title: "Gel manicure", client: "Lena P.", staff: "Lena Park", tone: TONES.lena },
  { id: 4, start: 10 * 60 + 15, end: 11 * 60, title: "Skin fade", client: "Jonas Weber", staff: "Diego Ramos", tone: TONES.diego },
  { id: 5, start: 11 * 60 + 30, end: 12 * 60 + 15, title: "Cut & style", client: "Aisha Khan", staff: "Maya Okafor", tone: TONES.maya },
  { id: 6, start: 12 * 60 + 30, end: 13 * 60 + 30, title: "Lunch", client: "", staff: "Everyone", tone: "border-dashed border-border bg-muted/60 text-foreground/70" },
  { id: 7, start: 13 * 60 + 30, end: 15 * 60, title: "Highlights", client: "Sofia Rossi", staff: "Priya Shah", tone: TONES.priya },
  { id: 8, start: 14 * 60, end: 14 * 60 + 45, title: "Nail art", client: "Noah F.", staff: "Lena Park", tone: TONES.lena },
  { id: 9, start: 14 * 60 + 30, end: 15 * 60 + 15, title: "Beard + cut", client: "Diego M.", staff: "Diego Ramos", tone: TONES.diego },
  { id: 10, start: 15 * 60 + 30, end: 17 * 60, title: "Bridal trial", client: "Sofia R.", staff: "Maya Okafor", tone: TONES.maya },
  { id: 11, start: 17 * 60 + 15, end: 18 * 60, title: "Gloss", client: "Jonas W.", staff: "Priya Shah", tone: TONES.priya },
]

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background"
const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`
const y = (m: number) => (m - START_H * 60) * PX_PER_MIN

// Column packing for overlapping events: each cluster gets as many columns as its max concurrency.
function layout(events: Ev[]) {
  const sorted = [...events].sort((a, b) => a.start - b.start || b.end - a.end)
  const out = new Map<number, { col: number; cols: number }>()
  let cluster: Ev[] = []
  let clusterEnd = -1
  const flush = () => {
    const cols: number[] = []
    const assign = new Map<number, number>()
    for (const e of cluster) {
      let c = cols.findIndex((end) => end <= e.start)
      if (c < 0) {
        c = cols.length
        cols.push(0)
      }
      cols[c] = e.end
      assign.set(e.id, c)
    }
    for (const e of cluster) out.set(e.id, { col: assign.get(e.id)!, cols: cols.length })
    cluster = []
  }
  for (const e of sorted) {
    if (cluster.length && e.start >= clusterEnd) flush()
    cluster.push(e)
    clusterEnd = Math.max(clusterEnd, e.end)
  }
  if (cluster.length) flush()
  return out
}

/* ---------- Block ---------- */

export default function DayAgenda() {
  const [events, setEvents] = React.useState(INITIAL)
  const [now, setNow] = React.useState<number | null>(null) // minutes; null until mounted
  const [running, setRunning] = React.useState(true)
  const [resizing, setResizing] = React.useState<{ id: number; startY: number; end: number } | null>(null)
  const [selected, setSelected] = React.useState<number | null>(null)
  const [announce, setAnnounce] = React.useState("")
  const [dayOffset, setDayOffset] = React.useState(0)
  const scroller = React.useRef<HTMLDivElement>(null)

  // A simulated clock starting at 10:42 so the "now" line is always inside the day. Starts after mount.
  React.useEffect(() => {
    setNow(10 * 60 + 42)
  }, [])
  React.useEffect(() => {
    if (!running || now === null) return
    const t = setInterval(() => setNow((n) => (n === null ? n : n + 1 > END_H * 60 ? START_H * 60 : n + 1)), 1500)
    return () => clearInterval(t)
  }, [running, now === null])
  React.useEffect(() => {
    if (now !== null && scroller.current) scroller.current.scrollTop = Math.max(0, y(now) - 160)
  }, [now === null])

  const pos = layout(events)
  const onResizeStart = (e: React.PointerEvent, ev: Ev) => {
    e.preventDefault()
    e.stopPropagation()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    setResizing({ id: ev.id, startY: e.clientY, end: ev.end })
  }
  const onResizeMove = (e: React.PointerEvent) => {
    if (!resizing) return
    const ev = events.find((x) => x.id === resizing.id)
    if (!ev) return
    const delta = (e.clientY - resizing.startY) / PX_PER_MIN
    const end = Math.max(ev.start + SNAP, Math.min(END_H * 60, Math.round((resizing.end + delta) / SNAP) * SNAP))
    if (end !== ev.end) setEvents((l) => l.map((x) => (x.id === ev.id ? { ...x, end } : x)))
  }
  const onResizeEnd = () => {
    if (!resizing) return
    const ev = events.find((x) => x.id === resizing.id)
    if (ev) setAnnounce(`${ev.title} now ends at ${fmt(ev.end)}.`)
    setResizing(null)
  }
  const keyResize = (ev: Ev, delta: number) => {
    const end = Math.max(ev.start + SNAP, Math.min(END_H * 60, ev.end + delta))
    setEvents((l) => l.map((x) => (x.id === ev.id ? { ...x, end } : x)))
    setAnnounce(`${ev.title} now ends at ${fmt(end)}.`)
  }

  const hours = Array.from({ length: END_H - START_H + 1 }, (_, i) => START_H + i)
  const current = now === null ? null : events.find((e) => e.start <= now && now < e.end && e.client)
  const next = now === null ? null : events.filter((e) => e.start > now && e.client).sort((a, b) => a.start - b.start)[0]
  const dayLabel = ["Tue, Nov 3", "Wed, Nov 4", "Thu, Nov 5", "Mon, Nov 2", "Sun, Nov 1"][dayOffset >= 0 ? dayOffset % 3 : 3 + ((-dayOffset - 1) % 2)]

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto flex max-w-4xl flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" tone="neutral" size="xs" iconOnly aria-label="Previous day" onClick={() => setDayOffset((d) => d - 1)}>
              <ChevronLeft />
            </Button>
            <h2 className="text-lg font-semibold tracking-tight">{dayLabel}</h2>
            <Button variant="ghost" tone="neutral" size="xs" iconOnly aria-label="Next day" onClick={() => setDayOffset((d) => d + 1)}>
              <ChevronRight />
            </Button>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-foreground/70 tabular-nums">{events.filter((e) => e.client).length} bookings</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {now !== null && (
              <span className="font-mono tabular-nums">
                <span className="mr-1 inline-block size-2 rounded-full bg-rose-500 align-middle motion-safe:animate-pulse" aria-hidden="true" />
                {fmt(now)}
              </span>
            )}
            <Button variant="outline" tone="neutral" size="xs" iconLeft={running ? <Pause /> : <Play />} onClick={() => setRunning((r) => !r)} aria-pressed={!running}>
              {running ? "Pause clock" : "Run clock"}
            </Button>
          </div>
        </div>

        {/* Now / next strip */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-2xl border bg-card p-3">
            <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Now</span>
            {current ? (
              <>
                <Avatar name={current.client} size="sm" />
                <span className="min-w-0 flex-1 text-sm">
                  <span className="block truncate font-medium">{current.title} · {current.client}</span>
                  <span className="block text-xs text-muted-foreground">
                    {fmt(current.start)}–{fmt(current.end)} with {current.staff.split(" ")[0]}
                  </span>
                </span>
                {now !== null && <span className="text-xs text-muted-foreground tabular-nums">{current.end - now} min left</span>}
              </>
            ) : (
              <span className="text-sm text-muted-foreground">{now === null ? "…" : "No one in the chair"}</span>
            )}
          </div>
          <div className="flex items-center gap-3 rounded-2xl border bg-card p-3">
            <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Next</span>
            {next ? (
              <>
                <Avatar name={next.client} size="sm" />
                <span className="min-w-0 flex-1 text-sm">
                  <span className="block truncate font-medium">{next.title} · {next.client}</span>
                  <span className="block text-xs text-muted-foreground">
                    {fmt(next.start)} with {next.staff.split(" ")[0]}
                  </span>
                </span>
                {now !== null && <span className="text-xs text-muted-foreground tabular-nums">in {next.start - now} min</span>}
              </>
            ) : (
              <span className="text-sm text-muted-foreground">{now === null ? "…" : "Nothing more today"}</span>
            )}
          </div>
        </div>

        <p className="sr-only" aria-live="polite">
          {announce}
        </p>

        {/* Timeline */}
        <div ref={scroller} className="relative h-[520px] overflow-y-auto rounded-2xl border bg-card" onPointerMove={onResizeMove} onPointerUp={onResizeEnd} onPointerCancel={onResizeEnd}>
          <div className="relative" style={{ height: y(END_H * 60) + 24 }}>
            {/* Hour lines */}
            {hours.map((h) => (
              <div key={h} className="absolute inset-x-0 flex items-start" style={{ top: y(h * 60) }}>
                <span className="w-14 shrink-0 -translate-y-2 pr-2 text-right font-mono text-[11px] text-muted-foreground tabular-nums">{String(h).padStart(2, "0")}:00</span>
                <span className="h-px flex-1 bg-border" aria-hidden="true" />
              </div>
            ))}
            {hours.slice(0, -1).map((h) => (
              <span key={`half-${h}`} className="absolute right-0 left-14 h-px bg-border/50" style={{ top: y(h * 60 + 30) }} aria-hidden="true" />
            ))}

            {/* Events */}
            <div className="absolute inset-y-0 right-3 left-16">
              {events.map((ev) => {
                const p = pos.get(ev.id) ?? { col: 0, cols: 1 }
                const w = 100 / p.cols
                const isSel = selected === ev.id
                const past = now !== null && ev.end <= now
                return (
                  <div
                    key={ev.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelected(isSel ? null : ev.id)}
                    onKeyDown={(e) => {
                      if (e.shiftKey && e.key === "ArrowDown") keyResize(ev, SNAP)
                      else if (e.shiftKey && e.key === "ArrowUp") keyResize(ev, -SNAP)
                      else if (e.key === "Enter" || e.key === " ") setSelected(isSel ? null : ev.id)
                      else return
                      e.preventDefault()
                    }}
                    style={{ top: y(ev.start), height: Math.max(22, y(ev.end) - y(ev.start) - 2), left: `calc(${p.col * w}% + ${p.col ? 3 : 0}px)`, width: `calc(${w}% - ${p.cols > 1 ? 3 : 0}px)` }}
                    className={cn("absolute overflow-hidden rounded-lg border-l-[3px] px-2 py-1 text-left text-xs shadow-sm transition-[box-shadow,opacity]", ev.tone, past && "opacity-80", isSel && "z-10 ring-2 ring-primary", resizing?.id === ev.id && "z-10 shadow-lg", ring)}
                  >
                    <div className="truncate font-semibold leading-4">{ev.title}</div>
                    <span className="sr-only">{fmt(ev.start)} to {fmt(ev.end)}. Shift plus up or down arrow changes the end time.</span>
                    {ev.end - ev.start >= 40 && (
                      <div className="truncate text-[11px] leading-4 opacity-85">
                        {fmt(ev.start)}–{fmt(ev.end)}
                        {ev.client && ` · ${ev.client}`}
                      </div>
                    )}
                    {ev.end - ev.start >= 70 && ev.client && <div className="mt-0.5 truncate text-[11px] opacity-85">{ev.staff}</div>}
                    <div
                      onPointerDown={(e) => onResizeStart(e, ev)}
                      className="absolute inset-x-0 bottom-0 flex h-3 cursor-ns-resize items-center justify-center opacity-0 transition-opacity hover:opacity-100 [[role=button]:focus-visible_&]:opacity-100 [[role=button]:hover_&]:opacity-100"
                      aria-hidden="true"
                    >
                      <GripHorizontal className="size-3 opacity-70" />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Current time line */}
            {now !== null && (
              <div className="pointer-events-none absolute inset-x-0 z-20 flex items-center transition-[top] duration-700" style={{ top: y(now) }} aria-hidden="true">
                <span className="w-14 pr-2 text-right font-mono text-[10px] font-semibold text-rose-600 tabular-nums dark:text-rose-400">{fmt(now)}</span>
                <span className="size-2.5 -ml-1 rounded-full bg-rose-500 shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-rose-500)_25%,transparent)]" />
                <span className="h-0.5 flex-1 bg-rose-500" />
              </div>
            )}
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">Drag the bottom edge of a booking to change its length (snaps to 15 min). Overlapping bookings share the width.</p>
      </div>
    </div>
  )
}

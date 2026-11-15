"use client"

import * as React from "react"
import { AlertTriangle, ChevronLeft, ChevronRight, Clock, Plus } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { addDays, addMinutes, expandOccurrences, formatTime, groupByResource, isSameDay, layoutLanes, overlaps, snap, startOfDay, type Resource, type SlotgridEvent } from "@/components/slotgrid/core"
import { cn } from "@/lib/utils"

const START_HOUR = 8
const END_HOUR = 20
const HOUR_WIDTH = 104
const LANE_HEIGHT = 44
const STEP = 15

type Booking = SlotgridEvent & { client: string; service: string }

const STAFF: (Resource & { role: string; initials: string; lunch: [number, number] })[] = [
  { id: "sofia", title: "Sofia Martinez", role: "Senior stylist", initials: "SM", color: "#8b5cf6", lunch: [12.5, 13.5] },
  { id: "liam", title: "Liam Chen", role: "Barber", initials: "LC", color: "#3b82f6", lunch: [13, 14] },
  { id: "amara", title: "Amara Okafor", role: "Colorist", initials: "AO", color: "#f43f5e", lunch: [12, 13] },
  { id: "jonas", title: "Jonas Weber", role: "Massage therapist", initials: "JW", color: "#10b981", lunch: [13.5, 14.5] },
  { id: "olivia", title: "Olivia Brown", role: "Nail technician", initials: "OB", color: "#f59e0b", lunch: [12.5, 13.5] },
]

function template(day: Date): Booking[] {
  const at = (h: number) => addMinutes(day, h * 60)
  const b = (id: string, resourceId: string, from: number, to: number, client: string, service: string): Booking => ({
    id,
    resourceId,
    start: at(from),
    end: at(to),
    client,
    service,
    title: service,
    color: STAFF.find((s) => s.id === resourceId)!.color,
  })
  return [
    b("1", "sofia", 9, 10.5, "Emma Clarke", "Cut & blow-dry"),
    b("2", "sofia", 10.75, 12.25, "Hannah Lee", "Balayage"),
    b("3", "sofia", 14, 15, "Grace Kim", "Trim"),
    b("4", "sofia", 16, 18, "Zoe Adams", "Bridal styling"),
    b("5", "liam", 9, 9.5, "Leo Garcia", "Beard trim"),
    b("6", "liam", 9.5, 10.25, "Noah Patel", "Skin fade"),
    b("7", "liam", 11, 11.75, "Ethan Wilson", "Classic cut"),
    b("8", "liam", 15, 16, "Lucas Rossi", "Cut & beard"),
    b("9", "amara", 9.5, 12, "Mia Wong", "Full color"),
    b("10", "amara", 13, 15.5, "Chloe Martin", "Highlights"),
    b("11", "amara", 14.5, 15.25, "Ivy Turner", "Toner"),
    b("12", "jonas", 10, 11, "Ava Johnson", "Deep tissue 60′"),
    b("13", "jonas", 11.5, 13, "Ruby Hall", "Hot stone 90′"),
    b("14", "jonas", 15, 16, "Oscar Young", "Sports massage"),
    b("15", "olivia", 9, 10, "Lily Evans", "Gel manicure"),
    b("16", "olivia", 10.5, 12, "Sophie Scott", "Mani + pedi"),
    b("17", "olivia", 14, 15, "Isla Green", "Nail art"),
    b("18", "olivia", 17, 18, "Ella White", "Gel removal"),
  ]
}

const SERVICES = [
  { name: "Cut & blow-dry", minutes: 60 },
  { name: "Trim", minutes: 30 },
  { name: "Beard trim", minutes: 30 },
  { name: "Full color", minutes: 120 },
  { name: "Deep tissue 60′", minutes: 60 },
  { name: "Gel manicure", minutes: 45 },
]

/** Demo data for two weeks around today: the daily template, shifted and thinned per day. */
function seed(today: Date): Booking[] {
  const out: Booking[] = []
  for (let k = -7; k <= 14; k++) {
    const day = addDays(today, k)
    const shift = (((k % 3) + 3) % 3) * 30
    template(day).forEach((b, i) => {
      if (k !== 0 && (i + k * 7) % 4 === 0) return
      out.push({ ...b, id: `${k}-${b.id}`, start: addMinutes(b.start, k ? shift : 0), end: addMinutes(b.end, k ? shift : 0) })
    })
  }
  return out
}

type Editor = { id?: string; client: string; service: string; staff: string; date: Date; time: string }

const pad = (n: number) => String(n).padStart(2, "0")
const toTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`

function useToday() {
  const [today, setToday] = React.useState<Date | null>(null)
  React.useEffect(() => setToday(startOfDay(new Date())), [])
  return today
}

type Drag = { id: string; kind: "move" | "resize"; x0: number; y0: number; dMin: number; resourceId: string; moved: boolean }

export default function ResourceTimeline() {
  const today = useToday()
  const [day, setDay] = React.useState<Date | null>(null)
  const [bookings, setBookings] = React.useState<Booking[]>([])
  const [selected, setSelected] = React.useState<string | null>(null)
  const [drag, setDrag] = React.useState<Drag | null>(null)
  const [now, setNow] = React.useState<Date | null>(null)
  const [editor, setEditor] = React.useState<Editor | null>(null)
  const dragRef = React.useRef(drag)
  dragRef.current = drag
  const scrollRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!today) return
    setDay(today)
    setBookings(seed(today))
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [today])

  const ready = now !== null
  React.useEffect(() => {
    // Open scrolled near the current hour, snapped to a whole hour so no label is cut.
    const el = scrollRef.current
    if (!ready || !el) return
    const target = Math.min(Math.max(0, (new Date().getHours() - START_HOUR - 1) * HOUR_WIDTH), el.scrollWidth - el.clientWidth)
    el.scrollLeft = Math.floor(target / HOUR_WIDTH) * HOUR_WIDTH
  }, [ready])

  if (!day) return <div className="h-[520px] p-4 md:p-6"><div className="h-full animate-pulse rounded-xl bg-muted" /></div>

  const rangeStart = addMinutes(day, START_HOUR * 60)
  const rangeEnd = addMinutes(day, END_HOUR * 60)
  const pxPerMin = HOUR_WIDTH / 60
  const width = (END_HOUR - START_HOUR) * HOUR_WIDTH

  // Live preview of the dragged booking.
  const shown = bookings.map((b) => {
    if (!drag || drag.id !== b.id || !drag.moved) return b
    if (drag.kind === "resize") {
      const end = addMinutes(b.end, drag.dMin)
      return { ...b, end: end > addMinutes(b.start, STEP) ? end : addMinutes(b.start, STEP) }
    }
    return { ...b, start: addMinutes(b.start, drag.dMin), end: addMinutes(b.end, drag.dMin), resourceId: drag.resourceId, color: STAFF.find((s) => s.id === drag.resourceId)!.color }
  })
  const occurrences = expandOccurrences(shown, rangeStart, rangeEnd)
  const byStaff = groupByResource(occurrences, STAFF)
  const todays = shown.filter((b) => isSameDay(b.start, day))
  const conflicts = new Set(
    todays.filter((a) => todays.some((b) => b.id !== a.id && b.resourceId === a.resourceId && overlaps(a.start, a.end, b.start, b.end))).map((b) => b.id),
  )
  const selectedBooking = shown.find((b) => b.id === selected)
  const dayCount = bookings.filter((b) => isSameDay(b.start, day)).length

  const openNew = (staff: string, at?: Date) => {
    const base = at ?? (now && isSameDay(now, day) ? addMinutes(startOfDay(now), Math.ceil((now.getHours() * 60 + now.getMinutes()) / 30) * 30) : addMinutes(day, 10 * 60))
    setEditor({ client: "", service: SERVICES[0]!.name, staff, date: day, time: toTime(base) })
  }
  const openEdit = (b: Booking) => setEditor({ id: b.id, client: b.client, service: b.service, staff: b.resourceId!, date: startOfDay(b.start), time: toTime(b.start) })

  const saveEditor = (e: Editor) => {
    const [h = 0, m = 0] = e.time.split(":").map(Number)
    const start = addMinutes(startOfDay(e.date), h * 60 + m)
    const old = bookings.find((b) => b.id === e.id)
    const minutes = SERVICES.find((x) => x.name === e.service)?.minutes ?? (old ? (old.end.getTime() - old.start.getTime()) / 60_000 : 60)
    const next: Booking = {
      id: e.id ?? crypto.randomUUID(),
      title: e.service,
      client: e.client.trim() || "Walk-in",
      service: e.service,
      resourceId: e.staff,
      start,
      end: addMinutes(start, minutes),
      color: STAFF.find((x) => x.id === e.staff)!.color,
    }
    setBookings((list) => (e.id ? list.map((b) => (b.id === e.id ? next : b)) : [...list, next]))
    setSelected(next.id)
    setEditor(null)
  }

  // Clicking empty space in a row opens a new booking for that staff member at that time.
  const clickRow = (e: React.MouseEvent<HTMLDivElement>, staff: string) => {
    if ((e.target as HTMLElement).closest("[role=button]")) return
    const r = e.currentTarget.getBoundingClientRect()
    const min = Math.floor((e.clientX - r.left) / pxPerMin / 30) * 30
    openNew(staff, addMinutes(rangeStart, min))
  }

  const begin = (e: React.PointerEvent, b: Booking, kind: Drag["kind"]) => {
    if (e.button !== 0) return
    e.stopPropagation()
    setDrag({ id: b.id, kind, x0: e.clientX, y0: e.clientY, dMin: 0, resourceId: b.resourceId!, moved: false })
    const move = (ev: PointerEvent) => {
      const d = dragRef.current
      if (!d) return
      const moved = d.moved || Math.hypot(ev.clientX - d.x0, ev.clientY - d.y0) > 4
      const row = document.elementFromPoint(ev.clientX, ev.clientY)?.closest<HTMLElement>("[data-resource]")
      setDrag({ ...d, moved, dMin: snap((ev.clientX - d.x0) / pxPerMin, STEP), resourceId: kind === "move" ? (row?.dataset.resource ?? d.resourceId) : d.resourceId })
    }
    const up = () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
      const d = dragRef.current
      setDrag(null)
      if (!d) return
      if (!d.moved) return setSelected((s) => (s === b.id ? null : b.id))
      setBookings((list) =>
        list.map((x) => {
          if (x.id !== d.id) return x
          if (d.kind === "resize") {
            const end = addMinutes(x.end, d.dMin)
            return { ...x, end: end > addMinutes(x.start, STEP) ? end : addMinutes(x.start, STEP) }
          }
          return { ...x, start: addMinutes(x.start, d.dMin), end: addMinutes(x.end, d.dMin), resourceId: d.resourceId, color: STAFF.find((s) => s.id === d.resourceId)!.color }
        }),
      )
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
  }

  const nowLeft = now && isSameDay(now, day) ? (now.getTime() - rangeStart.getTime()) / 60_000 : -1

  return (
    <div className="p-4 md:p-6">
      <Card className="gap-0 py-0">
        <CardHeader className="border-b py-4">
          <CardTitle>Staff schedule</CardTitle>
          <CardDescription>
            {new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(day)} · {dayCount} bookings
          </CardDescription>
          <CardAction className="flex items-center gap-2">
            <div className="flex">
              <Button variant="outline" size="icon" className="rounded-r-none" aria-label="Previous day" onClick={() => setDay(addDays(day, -1))}>
                <ChevronLeft />
              </Button>
              <Button variant="outline" className="-ml-px rounded-none" onClick={() => today && setDay(today)}>
                Today
              </Button>
              <Button variant="outline" size="icon" className="-ml-px rounded-l-none" aria-label="Next day" onClick={() => setDay(addDays(day, 1))}>
                <ChevronRight />
              </Button>
            </div>
            <Button onClick={() => openNew(STAFF[0]!.id)}>
              <Plus /> New booking
            </Button>
          </CardAction>
        </CardHeader>

        <div className="flex">
          {/* Staff column */}
          <div className="w-52 shrink-0 border-r">
            <div className="h-10 border-b" />
            {STAFF.map((s) => {
              const list = byStaff.get(s.id) ?? []
              const lanes = Math.max(1, ...layoutLanes(list, rangeStart, rangeEnd).map((p) => p.lanes))
              const booked = list.reduce((sum, o) => sum + (o.end.getTime() - o.start.getTime()) / 60_000, 0)
              const util = Math.min(100, Math.round((booked / ((END_HOUR - START_HOUR) * 60)) * 100))
              return (
                <div key={s.id} className="flex items-center gap-3 border-b px-3 last:border-b-0" style={{ height: lanes * LANE_HEIGHT + 12 }}>
                  <Avatar className="size-9">
                    <AvatarFallback className="text-xs font-medium text-white" style={{ backgroundColor: s.color }}>
                      {s.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{s.title}</div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="truncate">{s.role}</span>
                      <span>·</span>
                      <span className={cn(util >= 75 && "text-emerald-600 dark:text-emerald-400")}>{util}%</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Timeline */}
          <div ref={scrollRef} className="min-w-0 flex-1 overflow-x-auto">
            <div className="relative select-none" style={{ width }}>
              <div className="flex h-10 border-b">
                {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => (
                  <div key={i} className="shrink-0 border-l px-2 pt-2.5 text-xs text-muted-foreground first:border-l-0" style={{ width: HOUR_WIDTH }}>
                    {new Intl.DateTimeFormat(undefined, { hour: "numeric" }).format(addMinutes(day, (START_HOUR + i) * 60))}
                  </div>
                ))}
              </div>

              {STAFF.map((s) => {
                const placed = layoutLanes(byStaff.get(s.id) ?? [], rangeStart, rangeEnd)
                const lanes = Math.max(1, ...placed.map((p) => p.lanes))
                const height = lanes * LANE_HEIGHT + 12
                const over = drag?.moved && drag.kind === "move" && drag.resourceId === s.id
                return (
                  <div
                    key={s.id}
                    data-resource={s.id}
                    onClick={(e) => clickRow(e, s.id)}
                    className={cn("relative cursor-copy border-b transition-colors last:border-b-0", over && "bg-primary/5")}
                    style={{
                      height,
                      backgroundImage: `repeating-linear-gradient(to right, var(--border) 0 1px, transparent 1px ${HOUR_WIDTH / 2}px)`,
                    }}
                  >
                    {/* Lunch break */}
                    <div
                      className="absolute inset-y-0 bg-muted/70"
                      style={{
                        left: (s.lunch[0] - START_HOUR) * HOUR_WIDTH,
                        width: (s.lunch[1] - s.lunch[0]) * HOUR_WIDTH,
                        backgroundImage: "repeating-linear-gradient(135deg, transparent 0 6px, color-mix(in oklab, var(--foreground) 6%, transparent) 6px 12px)",
                      }}
                    >
                      <span className="absolute top-1.5 left-2 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">Break</span>
                    </div>

                    {placed.map((p) => {
                      const b = p.occurrence.event as Booking
                      const w = (p.right - p.left) * pxPerMin
                      const isActive = drag?.id === b.id && drag.moved
                      return (
                        <div
                          key={b.id}
                          role="button"
                          tabIndex={0}
                          onPointerDown={(e) => begin(e, b, "move")}
                          onKeyDown={(e) => e.key === "Enter" && setSelected(b.id)}
                          className={cn(
                            "group absolute flex cursor-grab flex-col justify-center overflow-hidden rounded-md border-l-[3px] px-2 text-xs shadow-xs ring-1 ring-black/5 transition-shadow dark:ring-white/10",
                            isActive && "z-20 cursor-grabbing shadow-lg",
                            selected === b.id && "ring-2 ring-primary",
                            conflicts.has(b.id) && "ring-2 ring-destructive",
                          )}
                          style={{
                            left: p.left * pxPerMin + 1,
                            width: Math.max(24, w - 3),
                            top: 6 + p.lane * LANE_HEIGHT,
                            height: LANE_HEIGHT - 6,
                            borderLeftColor: b.color,
                            backgroundColor: `color-mix(in oklab, ${b.color} 14%, var(--card))`,
                          }}
                        >
                          <div className="flex items-center gap-1 truncate font-medium">
                            {conflicts.has(b.id) && <AlertTriangle className="size-3 shrink-0 text-destructive" />}
                            <span className="truncate">{b.client}</span>
                          </div>
                          {w > 80 && (
                            <div className="truncate text-muted-foreground">
                              {formatTime(b.start)} · {b.service}
                            </div>
                          )}
                          <div className="absolute inset-y-0 right-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100" onPointerDown={(e) => begin(e, b, "resize")}>
                            <div className="absolute top-1/2 right-0.5 h-4 w-1 -translate-y-1/2 rounded-full bg-foreground/30" />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}

              {nowLeft >= 0 && nowLeft <= (END_HOUR - START_HOUR) * 60 && (
                <div className="pointer-events-none absolute top-8 bottom-0 z-30 w-0.5 bg-red-500" style={{ left: nowLeft * pxPerMin }}>
                  <div className="absolute -top-1 -left-[3px] size-2 rounded-full bg-red-500" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex min-h-14 flex-wrap items-center gap-3 border-t bg-muted/40 px-4 py-2.5 text-sm">
          {selectedBooking ? (
            <>
              <Clock className="size-4 text-muted-foreground" />
              <span className="font-medium">{selectedBooking.client}</span>
              <span className="text-muted-foreground">
                {selectedBooking.service} · {formatTime(selectedBooking.start)} – {formatTime(selectedBooking.end)} · {STAFF.find((s) => s.id === selectedBooking.resourceId)?.title}
              </span>
              <div className="ml-auto flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(selectedBooking)}>Reschedule</Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setBookings((l) => l.filter((x) => x.id !== selectedBooking.id))
                    setSelected(null)
                  }}
                >
                  Cancel booking
                </Button>
              </div>
            </>
          ) : (
            <span className="text-muted-foreground">Drag to move or reassign staff · pull the right edge to change the length · click empty time to book</span>
          )}
          {conflicts.size > 0 && (
            <Badge variant="destructive" className="ml-auto">
              <AlertTriangle /> {conflicts.size} overlapping bookings today
            </Badge>
          )}
        </div>
      </Card>
      <BookingEditor value={editor} onClose={() => setEditor(null)} onSave={saveEditor} />
    </div>
  )
}

function BookingEditor({ value, onClose, onSave }: { value: Editor | null; onClose: () => void; onSave: (e: Editor) => void }) {
  const [form, setForm] = React.useState<Editor | null>(value)
  React.useEffect(() => setForm(value), [value])
  const chip = (active: boolean) => cn("rounded-md border px-2.5 py-1.5 text-left text-sm transition-colors hover:border-foreground/30", active && "border-primary bg-primary/5 ring-1 ring-primary")

  return (
    <Dialog open={!!value} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{value?.id ? "Reschedule booking" : "New booking"}</DialogTitle>
          <DialogDescription>{form ? new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(form.date) : ""}</DialogDescription>
        </DialogHeader>
        {form && (
          <form
            id="booking-editor"
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              onSave(form)
            }}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="be-client">Client</Label>
              <Input id="be-client" autoFocus value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} placeholder="Walk-in" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Service</Label>
              <div className="grid grid-cols-2 gap-2">
                {SERVICES.map((sv) => (
                  <button key={sv.name} type="button" className={chip(form.service === sv.name)} onClick={() => setForm({ ...form, service: sv.name })}>
                    <div className="font-medium">{sv.name}</div>
                    <div className="text-xs text-muted-foreground">{sv.minutes} min</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Staff</Label>
              <div className="flex flex-wrap gap-2">
                {STAFF.map((st) => (
                  <button key={st.id} type="button" className={cn(chip(form.staff === st.id), "flex items-center gap-2")} onClick={() => setForm({ ...form, staff: st.id })}>
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: st.color }} />
                    {st.title.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="be-time">Start time</Label>
              <Input id="be-time" type="time" step={900} value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="w-36" />
            </div>
          </form>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="booking-editor">{value?.id ? "Save changes" : "Create booking"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

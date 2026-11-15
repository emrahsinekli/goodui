"use client"

import * as React from "react"
import { ArrowLeft, CalendarCheck, Clock, Globe, MapPin, Video } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const DURATION = 45

/** Demo availability: weekdays 9:00–17:00, some slots already taken. Replace with your API. */
function slotsFor(day: Date): { time: Date; taken: boolean }[] {
  if (day.getDay() === 0 || day.getDay() === 6) return []
  const out = []
  for (let m = 9 * 60; m + DURATION <= 17 * 60; m += 30) {
    const time = new Date(day.getFullYear(), day.getMonth(), day.getDate(), Math.floor(m / 60), m % 60)
    const taken = (day.getDate() * 7 + m / 30) % 5 === 0 || (day.getDate() + m) % 7 === 0
    out.push({ time, taken })
  }
  return out
}

function useToday() {
  const [today, setToday] = React.useState<Date | null>(null)
  React.useEffect(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    setToday(d)
  }, [])
  return today
}

export default function SlotPicker() {
  const today = useToday()
  const [date, setDate] = React.useState<Date | undefined>()
  const [slot, setSlot] = React.useState<Date | null>(null)
  const [hour12, setHour12] = React.useState(true)
  const [confirmed, setConfirmed] = React.useState(false)
  const zone = React.useMemo(() => (today ? Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/_/g, " ") : ""), [today])

  React.useEffect(() => {
    if (!today || date) return
    const d = new Date(today)
    do d.setDate(d.getDate() + 1)
    while (d.getDay() === 0 || d.getDay() === 6)
    setDate(d)
  }, [today, date])

  const fmtTime = (d: Date) => new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", hour12 }).format(d)
  const slots = date ? slotsFor(date) : []

  if (!today) return <div className="h-[580px] p-4 md:p-6"><div className="h-full animate-pulse rounded-xl bg-muted" /></div>

  return (
    <div className="flex justify-center p-4 md:p-6">
      <Card className="w-full max-w-4xl gap-0 overflow-hidden py-0 md:flex-row">
        {/* Event details */}
        <div className="flex flex-col gap-4 border-b p-6 md:w-72 md:border-r md:border-b-0">
          <div className="flex items-center gap-3">
            <Avatar className="size-10">
              <AvatarFallback className="bg-violet-500 font-medium text-white">SM</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm text-muted-foreground">Sofia Martinez</div>
              <div className="font-semibold">Strategy call</div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">A focused session to review your goals and map out the next 90 days.</p>
          <div className="flex flex-col gap-2.5 text-sm">
            <span className="flex items-center gap-2"><Clock className="size-4 text-muted-foreground" /> {DURATION} min</span>
            <span className="flex items-center gap-2"><Video className="size-4 text-muted-foreground" /> Google Meet</span>
            <span className="flex items-center gap-2"><MapPin className="size-4 text-muted-foreground" /> Or in person, Berlin</span>
            <span className="flex items-center gap-2"><Globe className="size-4 text-muted-foreground" /> {zone}</span>
          </div>
          {slot && (
            <div className="mt-auto rounded-lg border bg-muted/50 p-3 text-sm">
              <div className="font-medium">{new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(slot)}</div>
              <div className="text-muted-foreground">{fmtTime(slot)} – {fmtTime(new Date(slot.getTime() + DURATION * 60_000))}</div>
            </div>
          )}
        </div>

        {confirmed && slot ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <CalendarCheck className="size-6" />
            </div>
            <h3 className="text-lg font-semibold">You are booked in</h3>
            <p className="max-w-xs text-sm text-muted-foreground">
              A calendar invitation for {new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(slot)} at {fmtTime(slot)} is on its way to your inbox.
            </p>
            <Button variant="outline" onClick={() => { setConfirmed(false); setSlot(null) }}>
              <ArrowLeft /> Book another time
            </Button>
          </div>
        ) : (
          <div className="flex flex-1 flex-col sm:flex-row">
            <div className="flex-1 p-4 sm:p-6">
              <h3 className="mb-3 font-semibold">Select a date</h3>
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => { setDate(d); setSlot(null) }}
                defaultMonth={today}
                disabled={(d) => d < today || d.getDay() === 0 || d.getDay() === 6}
                className="w-full p-0 [--cell-size:--spacing(10)]"
              />
            </div>
            <Separator orientation="vertical" className="hidden sm:block" />
            <div className="flex w-full flex-col p-4 sm:w-60 sm:p-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">{date ? new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(date) : "Pick a day"}</h3>
                <div className="flex rounded-md bg-muted p-0.5 text-xs">
                  {[true, false].map((h) => (
                    <button key={String(h)} type="button" onClick={() => setHour12(h)} className={cn("rounded px-2 py-0.5 font-medium text-muted-foreground", hour12 === h && "bg-background text-foreground shadow-xs")}>
                      {h ? "12h" : "24h"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="-mr-2 flex max-h-[380px] flex-col gap-2 overflow-y-auto pr-2">
                {!date && <p className="text-sm text-muted-foreground">Available times appear here.</p>}
                {date && slots.length === 0 && <p className="text-sm text-muted-foreground">No availability on this day.</p>}
                {slots.map(({ time, taken }) =>
                  slot?.getTime() === time.getTime() ? (
                    <div key={time.getTime()} className="grid grid-cols-2 gap-2">
                      <Button variant="secondary" className="h-10">{fmtTime(time)}</Button>
                      <Button className="h-10" onClick={() => setConfirmed(true)}>Confirm</Button>
                    </div>
                  ) : (
                    <Button key={time.getTime()} variant="outline" className="h-10 border-primary/30 font-semibold text-primary hover:border-primary" disabled={taken} onClick={() => setSlot(time)}>
                      {fmtTime(time)}
                    </Button>
                  ),
                )}
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

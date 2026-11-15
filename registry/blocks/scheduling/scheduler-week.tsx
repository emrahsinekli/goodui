"use client"

import * as React from "react"
import { Scheduler, type SlotgridEvent } from "@/components/slotgrid/scheduler"
import { addDays, startOfWeek } from "@/components/slotgrid/core"

const COLORS = { blue: "#3b82f6", violet: "#8b5cf6", emerald: "#10b981", amber: "#f59e0b", rose: "#f43f5e" }

function seed(): SlotgridEvent[] {
  const monday = startOfWeek(new Date(), 1)
  const at = (day: number, h: number, m = 0) => {
    const d = addDays(monday, day)
    d.setHours(h, m, 0, 0)
    return d
  }
  return [
    { id: "standup", title: "Team standup", start: at(0, 9), end: at(0, 9, 15), color: COLORS.blue, recurrence: { freq: "weekly", byWeekday: [1, 2, 3, 4, 5] } },
    { id: "1", title: "Haircut · Emma Clarke", start: at(0, 10), end: at(0, 11), color: COLORS.violet },
    { id: "2", title: "Color & style · Mia Wong", start: at(0, 10, 30), end: at(0, 12, 30), color: COLORS.rose },
    { id: "3", title: "Consultation · Noah Patel", start: at(1, 13), end: at(1, 14), color: COLORS.emerald },
    { id: "4", title: "Beard trim · Leo Garcia", start: at(1, 15), end: at(1, 15, 45), color: COLORS.violet },
    { id: "5", title: "Yoga class (12 spots)", start: at(2, 18), end: at(2, 19, 30), color: COLORS.amber },
    { id: "6", title: "Physio · Ava Johnson", start: at(3, 11), end: at(3, 11, 45), color: COLORS.emerald },
    { id: "7", title: "Room 2 · Workshop", start: at(3, 14), end: at(3, 17), color: COLORS.blue },
    { id: "8", title: "Quarterly review", start: at(4, 15), end: at(4, 16, 30), color: COLORS.rose },
    { id: "9", title: "Trade show", start: at(2, 0), end: at(4, 0), allDay: true, color: COLORS.amber },
  ]
}

export default function SchedulerWeek() {
  // Demo data is anchored to the current week, so it is created after mount (not during prerender).
  const [events, setEvents] = React.useState<SlotgridEvent[]>([])
  React.useEffect(() => setEvents(seed()), [])

  return (
    <div className="p-4 md:p-6">
      <Scheduler
        events={events}
        defaultView="week"
        height={680}
        onEventChange={({ event, start, end }) =>
          setEvents((list) => list.map((e) => (e.id === event.id ? { ...e, start, end } : e)))
        }
        onSlotSelect={({ start, end, allDay }) =>
          setEvents((list) => [...list, { id: crypto.randomUUID(), title: "New booking", start, end, allDay, color: COLORS.emerald }])
        }
      />
    </div>
  )
}

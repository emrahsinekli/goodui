"use client"

import * as React from "react"
import { CheckCircle2, Clock, Eye, EyeOff, MapPin, Video } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type Item = { id: string; title: string; client: string; from: number; to: number; place: "room" | "video"; location: string }

// Times are hours from midnight; the list is anchored to today after mount.
const ITEMS: Item[] = [
  { id: "1", title: "Initial consultation", client: "Emma Clarke", from: 8.5, to: 9.25, place: "room", location: "Room 1" },
  { id: "2", title: "Follow-up session", client: "Noah Patel", from: 9.5, to: 10, place: "video", location: "Google Meet" },
  { id: "3", title: "Physiotherapy", client: "Ava Johnson", from: 10.5, to: 11.5, place: "room", location: "Room 2" },
  { id: "4", title: "Treatment plan review", client: "Mia Wong", from: 12, to: 12.5, place: "video", location: "Zoom" },
  { id: "5", title: "Sports massage", client: "Oscar Young", from: 14, to: 15, place: "room", location: "Room 1" },
  { id: "6", title: "Check-up", client: "Ruby Hall", from: 15.5, to: 16, place: "room", location: "Room 3" },
  { id: "7", title: "Online coaching", client: "Leo Garcia", from: 17, to: 17.75, place: "video", location: "Google Meet" },
]

function useNow() {
  const [now, setNow] = React.useState<Date | null>(null)
  React.useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])
  return now
}

export default function TodaySchedule() {
  const now = useNow()
  const [checkedIn, setCheckedIn] = React.useState<Set<string>>(new Set())
  const [hideDone, setHideDone] = React.useState(false)
  if (!now) return <div className="h-[480px] p-4 md:p-6"><div className="mx-auto h-full max-w-md animate-pulse rounded-xl bg-muted" /></div>

  const hourNow = now.getHours() + now.getMinutes() / 60
  const at = (h: number) => new Date(now.getFullYear(), now.getMonth(), now.getDate(), Math.floor(h), Math.round((h % 1) * 60))
  const fmt = (h: number) => new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(at(h))
  const next = ITEMS.find((i) => i.from > hourNow && !checkedIn.has(i.id))
  const done = ITEMS.filter((i) => i.to <= hourNow).length
  const items = hideDone ? ITEMS.filter((i) => i.to > hourNow) : ITEMS
  const checkIn = (id: string) => setCheckedIn((s) => new Set(s).add(id))

  return (
    <div className="p-4 md:p-6">
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>Today</CardTitle>
          <CardDescription>
            {new Intl.DateTimeFormat(undefined, { weekday: "long", month: "short", day: "numeric" }).format(now)} · {done} of {ITEMS.length} done
          </CardDescription>
          <CardAction>
            <Button variant="ghost" size="sm" onClick={() => setHideDone(!hideDone)} disabled={done === 0}>
              {hideDone ? <Eye /> : <EyeOff />} {hideDone ? "Show done" : "Hide done"}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {next && (
            <div className="flex items-center gap-3 rounded-lg bg-primary px-3 py-2.5 text-primary-foreground">
              <Clock className="size-4 shrink-0" />
              <div className="min-w-0 flex-1 text-sm">
                <span className="opacity-80">Next: </span>
                <span className="font-medium">{next.client}</span>
                <span className="opacity-80"> in {Math.max(1, Math.round((next.from - hourNow) * 60))} min</span>
              </div>
              <Button size="sm" variant="secondary" className="h-7" onClick={() => checkIn(next.id)}>Check in</Button>
            </div>
          )}
          <ol className="relative flex flex-col">
            {items.map((item, i) => {
              const live = item.from <= hourNow && hourNow < item.to
              const past = item.to <= hourNow
              const progress = live ? ((hourNow - item.from) / (item.to - item.from)) * 100 : 0
              return (
                <li key={item.id} className="relative flex gap-3 pb-4 last:pb-0">
                  <div className="w-16 shrink-0 pt-0.5 text-right text-xs text-muted-foreground tabular-nums">{fmt(item.from)}</div>
                  <div className="relative flex flex-col items-center">
                    <span className={cn("z-10 mt-1 size-2.5 rounded-full border-2 border-background ring-1", live ? "bg-emerald-500 ring-emerald-500" : past ? "bg-muted-foreground/40 ring-muted-foreground/40" : "bg-background ring-border")} />
                    {i < items.length - 1 && <span className="absolute top-3 bottom-[-4px] w-px bg-border" />}
                  </div>
                  <div className={cn("min-w-0 flex-1 rounded-lg border p-3", live && "border-emerald-500/40 bg-emerald-500/5", past && "opacity-60")}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{item.title}</div>
                        <div className="mt-1 flex items-center gap-2">
                          <Avatar className="size-5"><AvatarFallback className="text-[9px]">{item.client.split(" ").map((p) => p[0]).join("")}</AvatarFallback></Avatar>
                          <span className="truncate text-xs text-muted-foreground">{item.client}</span>
                        </div>
                      </div>
                      {checkedIn.has(item.id) && !live ? (
                        <Badge variant="secondary" className="gap-1"><CheckCircle2 className="size-3" /> Checked in</Badge>
                      ) : live ? (
                        <Badge className="border-0 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Live</Badge>
                      ) : (
                        !past && item.from - hourNow < 1.5 ? (
                          <Button size="xs" variant="outline" onClick={() => checkIn(item.id)}>Check in</Button>
                        ) : (
                        <span className="text-xs text-muted-foreground tabular-nums">{Math.round((item.to - item.from) * 60)}m</span>
                        )
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      {item.place === "video" ? <Video className="size-3" /> : <MapPin className="size-3" />} {item.location}
                    </div>
                    {live && (
                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-emerald-500/15">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}

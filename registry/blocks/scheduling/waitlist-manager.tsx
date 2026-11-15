"use client"

import * as React from "react"
import { ArrowDown, ArrowUp, BellRing, Check, Clock, Hourglass, Send, Sparkles, UserPlus, X } from "lucide-react"
import { Avatar } from "@/registry/components/core/avatar"
import { Button } from "@/registry/components/core/button"
import { cn } from "@/lib/utils"

/* ---------- Model ---------- */

type Person = { id: number; name: string; service: string; wants: string; joined: string; offer?: { slot: string; expiresAt: number }; status: "waiting" | "offered" | "booked" | "declined" | "expired" }
type Slot = { id: string; label: string; staff: string; state: "open" | "offered" | "booked" }

const OFFER_SECONDS = 15 * 60

const INITIAL: Person[] = [
  { id: 1, name: "Jonas Weber", service: "Skin fade", wants: "Sat mornings", joined: "3 days ago", status: "waiting" },
  { id: 2, name: "Aisha Khan", service: "Cut & style", wants: "Any weekday after 17:00", joined: "2 days ago", status: "waiting" },
  { id: 3, name: "Sofia Rossi", service: "Balayage", wants: "Thu or Fri", joined: "Yesterday", status: "waiting" },
  { id: 4, name: "Noah Fischer", service: "Beard trim", wants: "Lunchtime", joined: "Yesterday", status: "waiting" },
  { id: 5, name: "Priya S.", service: "Gloss", wants: "Anytime", joined: "Today", status: "waiting" },
]
const SLOTS: Slot[] = [
  { id: "s1", label: "Sat 7 Nov · 09:30", staff: "Diego", state: "open" },
  { id: "s2", label: "Thu 5 Nov · 17:30", staff: "Maya", state: "open" },
  { id: "s3", label: "Fri 6 Nov · 12:15", staff: "Diego", state: "open" },
]

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background"
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`

/* ---------- Block ---------- */

export default function WaitlistManager() {
  const [people, setPeople] = React.useState(INITIAL)
  const [slots, setSlots] = React.useState(SLOTS)
  const [tick, setTick] = React.useState<number | null>(null) // seconds since mount; null before mount
  const [picked, setPicked] = React.useState<string>(SLOTS[0]!.id)
  const [name, setName] = React.useState("")
  const [service, setService] = React.useState("Skin fade")
  const [announce, setAnnounce] = React.useState("")
  const nextId = React.useRef(10)

  React.useEffect(() => {
    setTick(0)
    const t = setInterval(() => setTick((x) => (x === null ? 0 : x + 1)), 1000)
    return () => clearInterval(t)
  }, [])

  // Expire offers and auto-offer the slot to the next person.
  React.useEffect(() => {
    if (tick === null) return
    const expired = people.filter((p) => p.status === "offered" && p.offer && p.offer.expiresAt <= tick)
    if (!expired.length) return
    setPeople((l) => l.map((p) => (expired.some((e) => e.id === p.id) ? { ...p, status: "expired", offer: undefined } : p)))
    for (const e of expired) {
      const slotId = slots.find((s) => s.label === e.offer?.slot)?.id
      if (slotId) {
        setSlots((l) => l.map((s) => (s.id === slotId ? { ...s, state: "open" } : s)))
        setAnnounce(`${e.name} didn't answer in time. ${e.offer?.slot} is open again.`)
      }
    }
  }, [tick, people, slots])

  const waiting = people.filter((p) => p.status === "waiting")
  const offered = people.filter((p) => p.status === "offered")
  const done = people.filter((p) => p.status === "booked" || p.status === "declined" || p.status === "expired")
  const slot = slots.find((s) => s.id === picked)
  const nextUp = waiting[0]

  const offer = (personId: number, slotId: string) => {
    if (tick === null) return
    const s = slots.find((x) => x.id === slotId)
    const p = people.find((x) => x.id === personId)
    if (!s || !p || s.state !== "open") return
    setSlots((l) => l.map((x) => (x.id === slotId ? { ...x, state: "offered" } : x)))
    setPeople((l) => l.map((x) => (x.id === personId ? { ...x, status: "offered", offer: { slot: s.label, expiresAt: tick + OFFER_SECONDS } } : x)))
    setAnnounce(`Offered ${s.label} to ${p.name}. They have 15 minutes.`)
  }
  const respond = (personId: number, accept: boolean) => {
    const p = people.find((x) => x.id === personId)
    if (!p?.offer) return
    const slotId = slots.find((s) => s.label === p.offer?.slot)?.id
    setPeople((l) => l.map((x) => (x.id === personId ? { ...x, status: accept ? "booked" : "declined", offer: accept ? x.offer : undefined } : x)))
    if (slotId) setSlots((l) => l.map((s) => (s.id === slotId ? { ...s, state: accept ? "booked" : "open" } : s)))
    setAnnounce(accept ? `${p.name} accepted ${p.offer.slot}. Booked.` : `${p.name} declined. ${p.offer.slot} is open again.`)
  }
  const moveP = (id: number, dir: -1 | 1) => {
    setPeople((l) => {
      const idx = l.findIndex((p) => p.id === id)
      const j = idx + dir
      if (idx < 0 || j < 0 || j >= l.length || l[j]!.status !== "waiting") return l
      const copy = [...l]
      ;[copy[idx], copy[j]] = [copy[j]!, copy[idx]!]
      return copy
    })
  }
  const remove = (id: number) => setPeople((l) => l.filter((p) => p.id !== id))
  const add = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setPeople((l) => [...l, { id: nextId.current++, name: name.trim(), service, wants: "Anytime", joined: "Just now", status: "waiting" }])
    setName("")
  }
  const requeue = (id: number) => setPeople((l) => l.map((p) => (p.id === id ? { ...p, status: "waiting", offer: undefined } : p)))

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[1fr_340px] [&>*]:min-w-0">
        {/* Queue */}
        <section className="rounded-2xl border bg-card" aria-label="Waitlist">
          <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
            <Hourglass className="size-4 text-muted-foreground" aria-hidden="true" />
            <h2 className="text-base font-semibold">Waitlist</h2>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-foreground/70 tabular-nums">{waiting.length} waiting</span>
            {offered.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-300">
                <BellRing className="size-3" aria-hidden="true" /> {offered.length} offer{offered.length > 1 ? "s" : ""} out
              </span>
            )}
          </div>
          <p className="sr-only" aria-live="polite">
            {announce}
          </p>

          {/* Pending offers */}
          {offered.length > 0 && (
            <ul className="divide-y border-b bg-amber-500/5">
              {offered.map((p) => {
                const left = tick === null || !p.offer ? OFFER_SECONDS : Math.max(0, p.offer.expiresAt - tick)
                const pct = (left / OFFER_SECONDS) * 100
                return (
                  <li key={p.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
                    <Avatar name={p.name} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">
                        {p.name} <span className="font-normal text-muted-foreground">· {p.service}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Offered <span className="font-medium text-foreground">{p.offer?.slot}</span> by SMS · waiting for a reply
                      </p>
                      <div className="mt-1.5 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Time left to accept" aria-valuemin={0} aria-valuemax={OFFER_SECONDS} aria-valuenow={left}>
                        <div className={cn("h-full rounded-full transition-[width] duration-1000 ease-linear", left < 120 ? "bg-rose-500" : "bg-amber-500")} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn("font-mono text-sm font-semibold tabular-nums", left < 120 ? "text-rose-700 dark:text-rose-300" : "text-amber-800 dark:text-amber-300")}>
                        <Clock className="mr-1 inline size-3.5 align-[-2px]" aria-hidden="true" />
                        {mmss(left)}
                      </span>
                      <span className="mx-1 text-[11px] text-muted-foreground">Simulate reply:</span>
                      <Button size="xs" tone="success" iconLeft={<Check />} onClick={() => respond(p.id, true)}>
                        Accepts
                      </Button>
                      <Button size="xs" variant="outline" tone="neutral" iconLeft={<X />} onClick={() => respond(p.id, false)}>
                        Declines
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          <ol className="divide-y">
            {waiting.map((p, i) => (
              <li key={p.id} className={cn("flex items-center gap-3 px-4 py-3", i === 0 && "bg-primary/5")}>
                <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums", i === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-foreground/70")}>{i + 1}</span>
                <Avatar name={p.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {p.name} <span className="font-normal text-foreground/70">· {p.service}</span>
                  </p>
                  <p className="truncate text-xs text-foreground/70">
                    Wants {p.wants} · joined {p.joined}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="xs" variant={i === 0 ? "solid" : "soft"} tone={i === 0 ? "primary" : "neutral"} iconLeft={<Send />} disabled={!slot || slot.state !== "open"} onClick={() => offer(p.id, picked)}>
                    <span className="hidden sm:inline">Offer</span> {slot ? slot.label.split(" · ")[1] : ""}
                  </Button>
                  <button type="button" aria-label={`Move ${p.name} up`} disabled={i === 0} onClick={() => moveP(p.id, -1)} className={cn("rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30", ring)}>
                    <ArrowUp className="size-3.5" />
                  </button>
                  <button type="button" aria-label={`Move ${p.name} down`} disabled={i === waiting.length - 1} onClick={() => moveP(p.id, 1)} className={cn("rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30", ring)}>
                    <ArrowDown className="size-3.5" />
                  </button>
                  <button type="button" aria-label={`Remove ${p.name} from the waitlist`} onClick={() => remove(p.id)} className={cn("rounded-md p-1 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-700 dark:hover:text-rose-300", ring)}>
                    <X className="size-3.5" />
                  </button>
                </div>
              </li>
            ))}
            {waiting.length === 0 && <li className="px-4 py-10 text-center text-sm text-muted-foreground">Nobody is waiting. Add someone below.</li>}
          </ol>

          <form onSubmit={add} className="flex flex-wrap items-center gap-2 border-t px-4 py-3">
            <UserPlus className="size-4 text-muted-foreground" aria-hidden="true" />
            <label htmlFor="wl-name" className="sr-only">
              Client name
            </label>
            <input id="wl-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Add a client" className={cn("h-8 min-w-0 flex-1 rounded-lg border bg-background px-2.5 text-sm", ring)} />
            <label htmlFor="wl-service" className="sr-only">
              Service
            </label>
            <select id="wl-service" value={service} onChange={(e) => setService(e.target.value)} className={cn("h-8 rounded-lg border bg-background px-2 text-xs", ring)}>
              {["Skin fade", "Cut & style", "Balayage", "Beard trim", "Gel manicure"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <Button size="sm" type="submit" variant="outline" tone="neutral" disabled={!name.trim()}>
              Add
            </Button>
          </form>

          {done.length > 0 && (
            <ul className="divide-y border-t bg-muted/20">
              {done.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-4 py-2 text-xs">
                  <Avatar name={p.name} size="xs" />
                  <span className="font-medium">{p.name}</span>
                  <span className={cn("rounded-full px-2 py-0.5 font-medium", p.status === "booked" ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300" : p.status === "expired" ? "bg-rose-500/12 text-rose-700 dark:text-rose-300" : "bg-muted text-foreground/70")}>{p.status === "booked" ? `Booked ${p.offer?.slot}` : p.status === "expired" ? "No reply in 15 min" : "Declined"}</span>
                  {p.status !== "booked" && (
                    <Button size="xs" variant="ghost" tone="neutral" className="ml-auto" onClick={() => requeue(p.id)}>
                      Back on the list
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Open slots */}
        <aside className="flex flex-col gap-4">
          <div className="rounded-2xl border bg-card p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" aria-hidden="true" />
              <h3 className="text-sm font-semibold">Slots that just opened</h3>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">Pick one, then offer it to whoever is next.</p>
            <div role="radiogroup" aria-label="Open slots" className="mt-3 flex flex-col gap-2">
              {slots.map((s) => (
                <button key={s.id} type="button" role="radio" aria-checked={picked === s.id} disabled={s.state !== "open"} onClick={() => setPicked(s.id)} className={cn("flex items-center gap-3 rounded-xl border p-3 text-left text-sm transition-colors disabled:opacity-60", picked === s.id && s.state === "open" ? "border-primary bg-primary/5" : "bg-background hover:bg-muted/50", ring)}>
                  <span className={cn("size-2.5 rounded-full", s.state === "open" ? "bg-emerald-500" : s.state === "offered" ? "bg-amber-500 motion-safe:animate-pulse" : "bg-muted-foreground/40")} aria-hidden="true" />
                  <span className="flex-1">
                    <span className="block font-medium tabular-nums">{s.label}</span>
                    <span className="block text-xs text-foreground/70">with {s.staff}</span>
                  </span>
                  <span className="text-[11px] font-medium text-foreground/70 capitalize">{s.state}</span>
                </button>
              ))}
            </div>
          </div>
          {nextUp && slot?.state === "open" && (
            <div className="rounded-2xl border bg-gradient-to-br from-primary/10 to-card p-4">
              <p className="text-xs font-medium text-muted-foreground">Next up</p>
              <div className="mt-2 flex items-center gap-3">
                <Avatar name={nextUp.name} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{nextUp.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {nextUp.service} · wants {nextUp.wants}
                  </p>
                </div>
              </div>
              <Button fullWidth className="mt-3" iconLeft={<Send />} onClick={() => offer(nextUp.id, picked)}>
                Offer {slot.label}
              </Button>
              <p className="mt-2 text-[11px] text-muted-foreground">They get an SMS with a one-tap link and 15 minutes to accept. If they don't, the slot comes back here.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

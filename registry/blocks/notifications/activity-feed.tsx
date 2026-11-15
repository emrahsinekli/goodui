"use client"

import * as React from "react"
import { ArrowRightLeft, CalendarPlus, ChevronDown, CreditCard, FileUp, Loader2, StickyNote } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type EventType = "booking" | "payment" | "note" | "status" | "file"

type Activity = {
  id: number
  type: EventType
  /** Minutes before "now". Converted to a real timestamp after mount. */
  ago: number
  who: string
  initials: string
  title: React.ReactNode
  detail?: string
  amount?: string
  from?: string
  to?: string
  file?: { name: string; size: string }
}

const TYPES: Record<EventType, { label: string; icon: React.ElementType; dot: string; chip: string }> = {
  booking: { label: "Bookings", icon: CalendarPlus, dot: "bg-violet-500 text-white", chip: "data-[on=true]:border-violet-500/40 data-[on=true]:bg-violet-500/10 data-[on=true]:text-violet-700 dark:data-[on=true]:text-violet-300" },
  payment: { label: "Payments", icon: CreditCard, dot: "bg-emerald-500 text-white", chip: "data-[on=true]:border-emerald-500/40 data-[on=true]:bg-emerald-500/10 data-[on=true]:text-emerald-700 dark:data-[on=true]:text-emerald-300" },
  note: { label: "Notes", icon: StickyNote, dot: "bg-amber-400 text-amber-950", chip: "data-[on=true]:border-amber-500/40 data-[on=true]:bg-amber-500/10 data-[on=true]:text-amber-700 dark:data-[on=true]:text-amber-300" },
  status: { label: "Status", icon: ArrowRightLeft, dot: "bg-sky-500 text-white", chip: "data-[on=true]:border-sky-500/40 data-[on=true]:bg-sky-500/10 data-[on=true]:text-sky-700 dark:data-[on=true]:text-sky-300" },
  file: { label: "Files", icon: FileUp, dot: "bg-rose-500 text-white", chip: "data-[on=true]:border-rose-500/40 data-[on=true]:bg-rose-500/10 data-[on=true]:text-rose-700 dark:data-[on=true]:text-rose-300" },
}

const RECENT: Activity[] = [
  { id: 1, type: "booking", ago: 3, who: "Sofia Martinez", initials: "SM", title: <>booked <b>Hannah Lee</b> for Balayage</>, detail: "Sat, Nov 8 · 10:45 AM · 2h 30m with Sofia" },
  { id: 2, type: "payment", ago: 11, who: "Stripe", initials: "ST", title: <>received a payment from <b>Ethan Wilson</b></>, amount: "$85.00", detail: "Visa •••• 4242 · Classic cut + beard" },
  { id: 3, type: "status", ago: 26, who: "Liam Brooks", initials: "LB", title: <>updated <b>Ava Johnson</b>&apos;s appointment</>, from: "Pending", to: "Confirmed" },
  { id: 4, type: "note", ago: 48, who: "Olivia Chen", initials: "OC", title: <>added a note to <b>Mia Wong</b></>, detail: "Prefers almond shape, no cuticle oil — sensitive skin. Offer the hypoallergenic top coat." },
  { id: 5, type: "file", ago: 95, who: "Jonas Weber", initials: "JW", title: <>uploaded an intake form</>, file: { name: "noah-patel-consent.pdf", size: "182 KB" } },
  { id: 6, type: "booking", ago: 140, who: "Online booking", initials: "OB", title: <><b>Lucas Rossi</b> booked a Deep tissue massage</>, detail: "Mon, Nov 10 · 5:30 PM · 60 min with Jonas" },
  { id: 7, type: "payment", ago: 210, who: "Front desk", initials: "FD", title: <>sold a gift card to <b>Sophie Scott</b></>, amount: "$150.00", detail: "Cash · valid 12 months" },
  { id: 8, type: "status", ago: 330, who: "Automation", initials: "AU", title: <>marked <b>Ruby Hall</b> as no-show</>, from: "Confirmed", to: "No-show" },
]

const OLDER: Activity[][] = [
  [
    { id: 9, type: "note", ago: 26 * 60, who: "Sofia Martinez", initials: "SM", title: <>pinned a note on <b>Ethan Wilson</b></>, detail: "Always books the last slot on Fridays — offer recurring." },
    { id: 10, type: "file", ago: 27 * 60, who: "Olivia Chen", initials: "OC", title: <>uploaded before/after photos</>, file: { name: "mia-wong-nails-03.jpg", size: "2.4 MB" } },
    { id: 11, type: "payment", ago: 29 * 60, who: "Stripe", initials: "ST", title: <>refunded a deposit to <b>Ruby Hall</b></>, amount: "−$40.00", detail: "Cancelled more than 24h before" },
    { id: 12, type: "booking", ago: 31 * 60, who: "Liam Brooks", initials: "LB", title: <>rebooked <b>Noah Patel</b> every 4 weeks</>, detail: "6 appointments created through March" },
  ],
  [
    { id: 13, type: "status", ago: 50 * 60, who: "Jonas Weber", initials: "JW", title: <>moved <b>Room 2</b> to maintenance</>, from: "Available", to: "Blocked" },
    { id: 14, type: "file", ago: 53 * 60, who: "Sofia Martinez", initials: "SM", title: <>shared the November price list</>, file: { name: "northside-prices-nov.pdf", size: "640 KB" } },
    { id: 15, type: "payment", ago: 70 * 60, who: "Payouts", initials: "PO", title: <>sent a payout to your bank</>, amount: "$2,418.60", detail: "Arrives in 1–2 business days" },
  ],
]

const ACTOR_COLOR: Record<string, string> = { SM: "bg-violet-500", LB: "bg-sky-500", OC: "bg-pink-500", JW: "bg-teal-500" }

export default function ActivityFeed() {
  const [base, setBase] = React.useState<number | null>(null)
  const [now, setNow] = React.useState<number | null>(null)
  const [items, setItems] = React.useState(RECENT)
  const [page, setPage] = React.useState(0)
  const [loading, setLoading] = React.useState(false)
  const [active, setActive] = React.useState<EventType[]>([])
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    const t = Date.now()
    setBase(t)
    setNow(t)
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => {
      clearInterval(id)
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  const toggle = (t: EventType) => setActive((a) => (a.includes(t) ? a.filter((x) => x !== t) : [...a, t]))
  const shown = items.filter((i) => active.length === 0 || active.includes(i.type))
  const hasMore = page < OLDER.length

  const loadMore = () => {
    setLoading(true)
    timer.current = setTimeout(() => {
      setItems((l) => [...l, ...(OLDER[page] ?? [])])
      setPage((p) => p + 1)
      setLoading(false)
    }, 700)
  }

  const relative = (ago: number) => {
    if (now === null || base === null) return ""
    const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" })
    const diff = (base - ago * 60_000 - now) / 60_000
    if (Math.abs(diff) < 1) return "just now"
    if (Math.abs(diff) < 60) return rtf.format(Math.round(diff), "minute")
    if (Math.abs(diff) < 60 * 24) return rtf.format(Math.round(diff / 60), "hour")
    return rtf.format(Math.round(diff / 60 / 24), "day")
  }
  const absolute = (ago: number) => (base === null ? "" : new Intl.DateTimeFormat(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" }).format(new Date(base - ago * 60_000)))

  const counts = (Object.keys(TYPES) as EventType[]).map((t) => ({ t, n: items.filter((i) => i.type === t).length }))
  const total = items.length

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-[240px_1fr]">
        {/* Summary rail */}
        <aside className="flex flex-col gap-5 md:sticky md:top-6 md:self-start">
          <div>
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Team activity</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-5xl font-bold tracking-tight tabular-nums">{total}</span>
              <span className="text-sm text-muted-foreground">events loaded</span>
            </div>
          </div>
          {/* Stacked distribution bar */}
          <div>
            <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
              {counts.map(({ t, n }) => (
                <div key={t} className={cn("h-full transition-all duration-500", TYPES[t].dot.split(" ")[0], active.length && !active.includes(t) && "opacity-25")} style={{ width: `${(n / total) * 100}%` }} />
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Share of events by type</p>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by event type">
            {counts.map(({ t, n }) => {
              const T = TYPES[t]
              const on = active.includes(t)
              return (
                <button
                  key={t}
                  type="button"
                  data-on={on}
                  aria-pressed={on}
                  onClick={() => toggle(t)}
                  className={cn("inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground", T.chip)}
                >
                  <T.icon className="size-3.5" /> {T.label}
                  <span className="tabular-nums opacity-70">{n}</span>
                </button>
              )
            })}
            {active.length > 0 && (
              <button type="button" onClick={() => setActive([])} className="px-1 text-sm font-medium text-primary underline-offset-4 hover:underline">
                Clear
              </button>
            )}
          </div>
        </aside>

        {/* Timeline */}
        <div className="min-w-0">
          {now === null || base === null ? (
            <div className="flex flex-col gap-4">
              {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-[76px] animate-pulse rounded-xl bg-muted" />)}
            </div>
          ) : (
            <ol className="relative">
              <span className="absolute top-2 bottom-2 left-[17px] w-px bg-gradient-to-b from-border via-border to-transparent" aria-hidden />
              {shown.length === 0 && (
                <li className="ml-12 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No {active.map((t) => TYPES[t].label.toLowerCase()).join(" or ")} in this period. Load older activity or clear the filter.</li>
              )}
              {shown.map((a, idx) => {
                const T = TYPES[a.type]
                const dayKey = (x: Activity) => new Date(base - x.ago * 60_000).toDateString()
                const dayBreak = idx === 0 ? dayKey(a) !== new Date(now).toDateString() : dayKey(a) !== dayKey(shown[idx - 1]!)
                return (
                  <React.Fragment key={a.id}>
                    {dayBreak && (
                      <li className="relative mb-4 ml-12 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        {new Intl.DateTimeFormat(undefined, { weekday: "long", month: "short", day: "numeric" }).format(new Date(base - a.ago * 60_000))}
                      </li>
                    )}
                    <li className="relative flex gap-4 pb-6 animate-in fade-in-0 slide-in-from-bottom-1">
                      <span className={cn("relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full ring-4 ring-background", T.dot)}>
                        <T.icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1 pt-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <Avatar className="size-5">
                            <AvatarFallback className={cn("text-[9px] font-semibold", ACTOR_COLOR[a.initials] ? cn(ACTOR_COLOR[a.initials], "text-white") : "")}>{a.initials}</AvatarFallback>
                          </Avatar>
                          <p className="min-w-0 text-sm text-muted-foreground [&_b]:font-semibold [&_b]:text-foreground">
                            <span className="font-semibold text-foreground">{a.who}</span> {a.title}
                          </p>
                          <time className="ml-auto shrink-0 text-xs text-muted-foreground tabular-nums" title={absolute(a.ago)}>{relative(a.ago)}</time>
                        </div>
                        <Detail a={a} />
                      </div>
                    </li>
                  </React.Fragment>
                )
              })}
            </ol>
          )}

          <div className="ml-12">
            {hasMore ? (
              <Button variant="outline" className="w-full" onClick={loadMore} disabled={loading || now === null}>
                {loading ? <Loader2 className="animate-spin" /> : <ChevronDown />}
                {loading ? "Loading older activity…" : "Load more"}
              </Button>
            ) : (
              <p className="py-2 text-center text-xs text-muted-foreground">You&apos;ve reached the beginning of this week&apos;s activity.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Detail({ a }: { a: Activity }) {
  if (a.type === "payment")
    return (
      <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border bg-card px-3 py-2.5">
        <span className="truncate text-xs text-muted-foreground">{a.detail}</span>
        <span className={cn("shrink-0 text-base font-semibold tabular-nums", a.amount?.startsWith("−") ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400")}>{a.amount}</span>
      </div>
    )
  if (a.type === "status")
    return (
      <div className="mt-2 flex items-center gap-2 text-xs">
        <span className="rounded-md border bg-muted px-2 py-0.5 text-muted-foreground line-through decoration-muted-foreground/50">{a.from}</span>
        <ArrowRightLeft className="size-3 text-muted-foreground" />
        <span className="rounded-md border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 font-medium text-sky-700 dark:text-sky-300">{a.to}</span>
      </div>
    )
  if (a.type === "note")
    return <p className="mt-2 rounded-xl border-l-2 border-amber-400 bg-amber-500/5 px-3 py-2 text-sm text-foreground/80 italic dark:bg-amber-500/10">“{a.detail}”</p>
  if (a.type === "file" && a.file)
    return (
      <div className="mt-2 inline-flex max-w-full items-center gap-3 rounded-xl border bg-card py-2 pr-4 pl-2">
        <span className="flex h-9 w-8 shrink-0 items-end justify-center rounded-md bg-rose-500/10 pb-1 text-[9px] font-bold text-rose-700 uppercase dark:text-rose-300">{a.file.name.split(".").pop()}</span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">{a.file.name}</span>
          <span className="block text-xs text-muted-foreground">{a.file.size}</span>
        </span>
      </div>
    )
  return a.detail ? <p className="mt-1 text-sm text-muted-foreground">{a.detail}</p> : null
}

"use client"

import * as React from "react"
import { CalendarPlus, Check, Clock, Loader2, Lock, RefreshCw, Search, Send, WifiOff, X } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

const SAMPLE_BOOKINGS = [
  { time: "9:30 AM", client: "Grace Kim", service: "Haircut & blow-dry", staff: "Sofia", color: "var(--chart-1)" },
  { time: "11:00 AM", client: "Daniel Ortiz", service: "Beard trim", staff: "Liam", color: "var(--chart-2)" },
  { time: "2:15 PM", client: "Mia Rossi", service: "Balayage", staff: "Amara", color: "var(--chart-3)" },
]

const CLIENTS = [
  { name: "Grace Kim", visits: 12, last: "Haircut · 3 days ago" },
  { name: "Daniel Ortiz", visits: 4, last: "Beard trim · 2 weeks ago" },
  { name: "Mia Rossi", visits: 7, last: "Balayage · last month" },
  { name: "Noah Fischer", visits: 1, last: "Consultation · yesterday" },
  { name: "Aisha Rahman", visits: 9, last: "Gel manicure · 5 days ago" },
]

export default function EmptyStates() {
  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2">
        <NoBookings />
        <NoResults />
        <Offline />
        <NoAccess />
      </div>
    </div>
  )
}

function Panel({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <section aria-label={label} className={cn("flex min-h-[340px] flex-col overflow-hidden rounded-2xl border bg-card", className)}>
      {children}
    </section>
  )
}

/* 1. No bookings yet */
function NoBookings() {
  const [bookings, setBookings] = React.useState<typeof SAMPLE_BOOKINGS>([])
  const [loading, setLoading] = React.useState(false)

  if (bookings.length) {
    return (
      <Panel label="Today's bookings">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div className="text-sm font-semibold">Today · {bookings.length} bookings</div>
          <Button variant="ghost" size="sm" onClick={() => setBookings([])}>Clear samples</Button>
        </div>
        <ul className="flex flex-1 flex-col gap-2 p-4">
          {bookings.map((b, i) => (
            <li key={b.client} className="flex animate-in items-center gap-3 rounded-xl border p-3 fade-in slide-in-from-bottom-2" style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}>
              <span className="h-10 w-1 rounded-full" style={{ background: b.color }} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{b.client}</div>
                <div className="truncate text-xs text-muted-foreground">{b.service} · with {b.staff}</div>
              </div>
              <Badge variant="secondary" className="tabular-nums">{b.time}</Badge>
            </li>
          ))}
        </ul>
        <p className="px-5 pb-4 text-xs text-muted-foreground">Sample data. Real bookings replace these automatically.</p>
      </Panel>
    )
  }

  return (
    <Panel label="No bookings" className="items-center justify-center p-8 text-center">
      <svg viewBox="0 0 160 120" className="h-28 w-36" aria-hidden>
        <rect x="24" y="22" width="112" height="86" rx="12" className="fill-muted stroke-border" strokeWidth="2" />
        <path d="M24 46h112" className="stroke-border" strokeWidth="2" />
        <rect x="24" y="22" width="112" height="24" rx="12" className="fill-primary/15" />
        <rect x="48" y="12" width="6" height="20" rx="3" className="fill-primary" />
        <rect x="106" y="12" width="6" height="20" rx="3" className="fill-primary" />
        {[0, 1, 2, 3].map((c) => [0, 1].map((r) => <rect key={`${c}${r}`} x={38 + c * 22} y={58 + r * 22} width="14" height="12" rx="3" className="fill-background stroke-border" strokeWidth="1.5" />))}
        <circle cx="128" cy="96" r="16" className="fill-primary" />
        <path d="M128 89v14M121 96h14" stroke="white" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <h3 className="mt-4 text-base font-semibold">No bookings yet</h3>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">Share your booking page or add an appointment yourself. Want to see how it looks first?</p>
      <Button className="mt-5" disabled={loading} onClick={() => { setLoading(true); setTimeout(() => { setLoading(false); setBookings(SAMPLE_BOOKINGS) }, 600) }}>
        {loading ? <Loader2 className="animate-spin" /> : <CalendarPlus />} Add sample bookings
      </Button>
    </Panel>
  )
}

/* 2. No search results */
function NoResults() {
  const [q, setQ] = React.useState("balayage tuesday")
  const results = CLIENTS.filter((c) => `${c.name} ${c.last}`.toLowerCase().includes(q.trim().toLowerCase()))

  return (
    <Panel label="Client search">
      <div className="border-b p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Search clients" className="h-9 px-9" placeholder="Search clients or services" value={q} onChange={(e) => setQ(e.target.value)} />
          {q && <button type="button" aria-label="Clear search" onClick={() => setQ("")} className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"><X className="size-3.5" /></button>}
        </div>
      </div>
      {results.length ? (
        <ul className="flex-1 divide-y">
          {results.map((c) => (
            <li key={c.name} className="flex items-center gap-3 px-4 py-2.5">
              <Avatar className="size-8"><AvatarFallback className="text-xs">{c.name.split(" ").map((p) => p[0]).join("")}</AvatarFallback></Avatar>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{c.name}</div>
                <div className="truncate text-xs text-muted-foreground">{c.last}</div>
              </div>
              <span className="text-xs text-muted-foreground">{c.visits} visits</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
          <svg viewBox="0 0 160 120" className="h-28 w-36" aria-hidden>
            <rect x="20" y="30" width="84" height="12" rx="6" className="fill-muted" />
            <rect x="20" y="52" width="64" height="12" rx="6" className="fill-muted" />
            <rect x="20" y="74" width="74" height="12" rx="6" className="fill-muted" />
            <circle cx="104" cy="58" r="26" className="fill-background stroke-foreground/70" strokeWidth="6" />
            <path d="M123 77l18 18" className="stroke-foreground/70" strokeWidth="9" strokeLinecap="round" />
            <path d="M94 54q4-6 10 0t10 0" className="stroke-[var(--chart-4)]" strokeWidth="3" fill="none" strokeLinecap="round" />
            <circle cx="96" cy="64" r="2" className="fill-foreground/70" />
            <circle cx="112" cy="64" r="2" className="fill-foreground/70" />
          </svg>
          <h3 className="mt-4 text-base font-semibold">No matches for “{q}”</h3>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">Try a client's first name or a single service. Search doesn't look at dates.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button onClick={() => setQ("")}>Clear search</Button>
            <Button variant="outline" onClick={() => setQ(q.split(" ")[0] ?? "")}>Search “{q.split(" ")[0]}”</Button>
          </div>
        </div>
      )}
    </Panel>
  )
}

/* 3. Offline */
function Offline() {
  const [state, setState] = React.useState<"offline" | "retrying" | "online">("offline")
  const [tries, setTries] = React.useState(0)

  const retry = () => {
    setState("retrying")
    setTimeout(() => {
      setTries((t) => t + 1)
      setState(tries >= 1 ? "online" : "offline")
    }, 1400)
  }

  return (
    <Panel label="Connection status" className="relative items-center justify-center p-8 text-center">
      <div className={cn("pointer-events-none absolute inset-x-0 top-0 h-1 transition-colors", state === "online" ? "bg-emerald-500" : state === "retrying" ? "bg-amber-500" : "bg-destructive/70")} />
      {state === "online" ? (
        <div className="flex animate-in flex-col items-center duration-300 fade-in zoom-in-95">
          <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"><Check className="size-8" /></div>
          <h3 className="mt-4 text-base font-semibold">Back online</h3>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">Synced 12 changes made while you were offline. Nothing was lost.</p>
          <Button variant="outline" className="mt-5" onClick={() => { setState("offline"); setTries(0) }}><WifiOff /> Simulate going offline</Button>
        </div>
      ) : (
        <>
          <svg viewBox="0 0 160 120" className="h-28 w-36" aria-hidden>
            <path d="M44 90a22 22 0 0 1 2-44 30 30 0 0 1 57-8 24 24 0 0 1 13 52z" className="fill-muted stroke-border" strokeWidth="2" />
            <path d="M58 72q22-18 44 0M68 82q12-9 24 0" className="stroke-muted-foreground/60" strokeWidth="4" fill="none" strokeLinecap="round" />
            <circle cx="80" cy="92" r="4" className="fill-muted-foreground/60" />
            <path d="M40 28l80 72" className="stroke-destructive" strokeWidth="5" strokeLinecap="round" />
          </svg>
          <h3 className="mt-4 text-base font-semibold">You're offline</h3>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            {tries > 0 && state === "offline" ? "Still can't reach Slotwise. Check your Wi-Fi, then try once more." : "Changes are saved on this device and will sync when your connection is back."}
          </p>
          <Button className="mt-5" disabled={state === "retrying"} onClick={retry}>
            {state === "retrying" ? <><Loader2 className="animate-spin" /> Reconnecting…</> : <><RefreshCw /> Try again</>}
          </Button>
          <span className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="size-3" /> 12 changes waiting to sync</span>
        </>
      )}
    </Panel>
  )
}

/* 4. No access */
function NoAccess() {
  const [state, setState] = React.useState<"locked" | "form" | "pending" | "granted">("locked")
  const [note, setNote] = React.useState("")
  const [sending, setSending] = React.useState(false)

  return (
    <Panel label="Payouts access" className="items-center justify-center p-8 text-center">
      {state === "granted" ? (
        <div className="flex w-full animate-in flex-col gap-3 text-left duration-300 fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Payouts · October</h3>
            <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Access granted</Badge>
          </div>
          <div className="text-3xl font-bold tracking-tight tabular-nums">$18,420.50</div>
          {[{ d: "Oct 28", a: "$4,210.00" }, { d: "Oct 21", a: "$5,380.25" }, { d: "Oct 14", a: "$4,105.75" }, { d: "Oct 7", a: "$4,724.50" }].map((p) => (
            <div key={p.d} className="flex justify-between border-b pb-2 text-sm last:border-b-0"><span className="text-muted-foreground">{p.d}</span><span className="font-medium tabular-nums">{p.a}</span></div>
          ))}
          <Button variant="ghost" size="sm" className="self-start" onClick={() => { setState("locked"); setNote("") }}>Reset demo</Button>
        </div>
      ) : (
        <>
          <svg viewBox="0 0 160 120" className="h-28 w-36" aria-hidden>
            <rect x="34" y="20" width="92" height="84" rx="10" className="fill-muted stroke-border" strokeWidth="2" />
            <rect x="46" y="34" width="40" height="6" rx="3" className="fill-muted-foreground/30" />
            <rect x="46" y="48" width="68" height="6" rx="3" className="fill-muted-foreground/20" />
            <rect x="46" y="60" width="54" height="6" rx="3" className="fill-muted-foreground/20" />
            <path d="M96 66v-8a12 12 0 0 1 24 0v8" className="stroke-foreground/70" strokeWidth="5" fill="none" />
            <rect x="88" y="64" width="40" height="32" rx="7" className={state === "pending" ? "fill-amber-500" : "fill-primary"} />
            <circle cx="108" cy="78" r="4" fill="white" />
            <path d="M108 80v7" stroke="white" strokeWidth="3" strokeLinecap="round" />
          </svg>
          {state === "pending" ? (
            <div className="animate-in duration-300 fade-in">
              <h3 className="mt-4 text-base font-semibold">Request sent</h3>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">Sofia Martinez (Owner) has been notified. You'll get an email when she responds.</p>
              <Badge variant="outline" className="mt-3 gap-1.5"><span className="size-1.5 animate-pulse rounded-full bg-amber-500" /> Pending approval</Badge>
              <div className="mt-4 flex justify-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setState("locked")}>Cancel request</Button>
                <Button variant="secondary" size="sm" onClick={() => setState("granted")}>Simulate approval</Button>
              </div>
            </div>
          ) : state === "form" ? (
            <form className="mt-4 flex w-full max-w-xs animate-in flex-col gap-2 text-left duration-200 fade-in" onSubmit={(e) => { e.preventDefault(); setSending(true); setTimeout(() => { setSending(false); setState("pending") }, 800) }}>
              <label htmlFor="es-note" className="text-sm font-medium">Why do you need access? <span className="font-normal text-muted-foreground">(optional)</span></label>
              <Textarea id="es-note" rows={2} maxLength={140} placeholder="I reconcile weekly payouts for the Shoreditch studio." value={note} onChange={(e) => setNote(e.target.value)} />
              <div className="flex justify-between text-xs text-muted-foreground"><span>Goes to the workspace owner</span><span>{note.length}/140</span></div>
              <div className="mt-1 flex gap-2">
                <Button type="button" variant="ghost" onClick={() => setState("locked")}>Cancel</Button>
                <Button type="submit" className="flex-1" disabled={sending}>{sending ? <Loader2 className="animate-spin" /> : <Send />} Send request</Button>
              </div>
            </form>
          ) : (
            <>
              <h3 className="mt-4 text-base font-semibold">You don't have access to Payouts</h3>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">Only Owners and Admins can see payout amounts and bank details.</p>
              <Button className="mt-5" onClick={() => setState("form")}><Lock /> Request access</Button>
            </>
          )}
        </>
      )}
    </Panel>
  )
}

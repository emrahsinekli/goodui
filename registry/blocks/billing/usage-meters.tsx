"use client"

import * as React from "react"
import { BellRing, CalendarCheck, Check, HardDrive, Loader2, MessageSquareText, Minus, Plus, RefreshCw, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

type MeterId = "bookings" | "sms" | "seats" | "storage"
type Meter = {
  id: MeterId
  label: string
  unit: string
  used: number
  limit: number
  icon: React.ComponentType<{ className?: string }>
  resets: boolean
  daily: number[]
  pack: { size: number; price: number; noun: string; recurring?: boolean }
  cta: string
}

const PERIOD = { start: "Oct 18", end: "Nov 18", days: 31, elapsed: 14 }

const INITIAL: Meter[] = [
  { id: "bookings", label: "Online bookings", unit: "bookings", used: 1842, limit: 2000, icon: CalendarCheck, resets: true, daily: [118, 124, 131, 140, 122, 156, 171, 98, 120, 133, 129, 145, 162, 143], pack: { size: 250, price: 15, noun: "booking pack" }, cta: "Buy bookings" },
  { id: "sms", label: "SMS credits", unit: "credits", used: 1036, limit: 1000, icon: MessageSquareText, resets: true, daily: [64, 71, 69, 80, 75, 92, 88, 61, 70, 74, 66, 79, 85, 62], pack: { size: 500, price: 20, noun: "credit pack" }, cta: "Buy credits" },
  { id: "seats", label: "Staff seats", unit: "seats", used: 6, limit: 10, icon: Users, resets: false, daily: [5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6], pack: { size: 1, price: 12, noun: "seat", recurring: true }, cta: "Add seats" },
  { id: "storage", label: "File storage", unit: "GB", used: 3.2, limit: 5, icon: HardDrive, resets: false, daily: [2.6, 2.6, 2.7, 2.7, 2.8, 2.8, 2.9, 2.9, 3, 3, 3.1, 3.1, 3.2, 3.2], pack: { size: 10, price: 4, noun: "10 GB block", recurring: true }, cta: "Add storage" },
]

const LEVEL = {
  ok: { label: "Healthy", stroke: "stroke-emerald-500", bg: "bg-emerald-500", pill: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  warn: { label: "Running low", stroke: "stroke-amber-500", bg: "bg-amber-500", pill: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  over: { label: "Over limit", stroke: "stroke-rose-500", bg: "bg-rose-500", pill: "bg-rose-500/10 text-rose-700 dark:text-rose-400" },
} as const
const levelOf = (pct: number) => (pct >= 100 ? "over" : pct >= 75 ? "warn" : "ok")
const fmt = (n: number, unit: string) => (unit === "GB" ? `${n.toFixed(1)} GB` : n.toLocaleString("en-US"))

const R = 50
const polar = (deg: number, r = R) => [60 + r * Math.cos((deg * Math.PI) / 180), 60 + r * Math.sin((deg * Math.PI) / 180)]
const [SX, SY] = polar(135)
const [EX, EY] = polar(45)
const ARC = `M ${SX} ${SY} A ${R} ${R} 0 1 1 ${EX} ${EY}`

function Gauge({ pct, alertAt, className }: { pct: number; alertAt: number | null; className?: string }) {
  const level = levelOf(pct)
  const tick = alertAt ? 135 + (270 * alertAt) / 100 : null
  const [ax, ay] = tick ? polar(tick, 41) : [0, 0]
  const [bx, by] = tick ? polar(tick, 59) : [0, 0]
  return (
    <svg viewBox="0 0 120 108" className={className} aria-hidden>
      <path d={ARC} pathLength={100} fill="none" strokeWidth={10} strokeLinecap="round" className="stroke-muted" />
      <path
        d={ARC}
        pathLength={100}
        fill="none"
        strokeWidth={10}
        strokeLinecap="round"
        strokeDasharray={`${Math.min(100, Math.max(0.5, pct))} 100`}
        className={cn(LEVEL[level].stroke, "transition-[stroke-dasharray] duration-700 ease-out")}
      />
      {tick && <line x1={ax} y1={ay} x2={bx} y2={by} strokeWidth={2} strokeLinecap="round" className="stroke-foreground/50" />}
    </svg>
  )
}

export default function UsageMeters() {
  const [meters, setMeters] = React.useState(INITIAL)
  const [alerts, setAlerts] = React.useState(true)
  const [buyFor, setBuyFor] = React.useState<MeterId | null>(null)
  const [qty, setQty] = React.useState(1)
  const [phase, setPhase] = React.useState<"form" | "processing" | "done">("form")
  const [justBought, setJustBought] = React.useState<MeterId | null>(null)

  const open = (id: MeterId) => {
    setBuyFor(id)
    setQty(id === "seats" ? 2 : 1)
    setPhase("form")
  }
  const sel = meters.find((m) => m.id === buyFor) ?? null
  const discount = qty >= 5 ? 0.1 : 0
  const subtotal = sel ? sel.pack.price * qty : 0
  const total = subtotal * (1 - discount)
  const newLimit = sel ? sel.limit + sel.pack.size * qty : 0
  const newPct = sel ? (sel.used / newLimit) * 100 : 0

  const purchase = () => {
    if (!sel || qty < 1) return
    setPhase("processing")
    setTimeout(() => {
      setMeters((list) => list.map((m) => (m.id === sel.id ? { ...m, limit: m.limit + m.pack.size * qty } : m)))
      setPhase("done")
      setJustBought(sel.id)
      setTimeout(() => setJustBought(null), 2500)
    }, 1000)
  }

  const elapsedPct = (PERIOD.elapsed / PERIOD.days) * 100
  const needsAttention = meters.filter((m) => m.used / m.limit >= 0.75).length

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col gap-4">
        <div className="relative overflow-hidden rounded-2xl border bg-card p-5">
          <div className="pointer-events-none absolute -top-20 -right-20 size-64 rounded-full bg-[var(--chart-2)] opacity-15 blur-3xl" />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Usage this period</div>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                {needsAttention ? `${needsAttention} of ${meters.length} limits need attention` : "All limits look healthy"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">Studio plan · {PERIOD.start} – {PERIOD.end}</p>
            </div>
            <label className="flex items-center gap-3 rounded-xl border bg-background/70 px-3 py-2 text-sm backdrop-blur">
              <BellRing className="size-4 text-muted-foreground" />
              <span>
                <span className="font-medium">Alert me at 80%</span>
                <span className="block text-xs text-muted-foreground">{alerts ? "Email to owner@lumensalon.com" : "Alerts are off"}</span>
              </span>
              <Switch checked={alerts} onCheckedChange={setAlerts} aria-label="Usage alerts at 80%" />
            </label>
          </div>
          <div className="relative mt-5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{PERIOD.start}</span>
              <span className="inline-flex items-center gap-1 font-medium text-foreground"><RefreshCw className="size-3" /> Resets in {PERIOD.days - PERIOD.elapsed} days</span>
              <span>{PERIOD.end}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-foreground/80" style={{ width: `${elapsedPct}%` }} />
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {meters.map((m) => {
            const pct = (m.used / m.limit) * 100
            const level = levelOf(pct)
            const projected = m.resets ? Math.round(m.used / (PERIOD.elapsed / PERIOD.days)) : null
            const projectedOver = projected !== null && projected > m.limit
            const maxDaily = Math.max(...m.daily)
            const Icon = m.icon
            return (
              <div key={m.id} className={cn("flex flex-col rounded-2xl border bg-card p-4 transition-shadow", justBought === m.id && "ring-2 ring-emerald-500")}>
                <div className="flex items-center gap-2">
                  <span className="inline-flex size-8 items-center justify-center rounded-lg bg-muted"><Icon className="size-4" /></span>
                  <span className="text-sm font-medium">{m.label}</span>
                  <span className={cn("ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold", LEVEL[level].pill)}>{LEVEL[level].label}</span>
                </div>
                <div className="relative mx-auto mt-3 w-40">
                  <Gauge pct={pct} alertAt={alerts ? 80 : null} className="w-full" />
                  <div className="absolute inset-x-0 top-[34%] text-center">
                    <div className="text-3xl font-semibold tracking-tight tabular-nums">{Math.round(pct)}%</div>
                    <div className="text-xs text-muted-foreground tabular-nums">
                      {fmt(m.used, m.unit)} / {fmt(m.limit, m.unit)}
                    </div>
                  </div>
                </div>
                <div className="mt-1 flex h-8 items-end gap-0.5" aria-label="Last 14 days">
                  {m.daily.map((d, i) => (
                    <div key={i} className={cn("flex-1 rounded-t-sm", i === m.daily.length - 1 ? LEVEL[level].bg : "bg-muted-foreground/25")} style={{ height: `${Math.max(12, (d / maxDaily) * 100)}%` }} />
                  ))}
                </div>
                <div className="mt-3 min-h-10 text-xs text-muted-foreground">
                  {level === "over" ? (
                    <span className="text-rose-700 dark:text-rose-400">{fmt(m.used - m.limit, m.unit)} {m.unit === "GB" ? "" : m.unit} over — extra usage is billed at overage rates.</span>
                  ) : projected !== null ? (
                    <>
                      On pace for <span className={cn("font-medium", projectedOver ? "text-amber-700 dark:text-amber-400" : "text-foreground")}>{fmt(projected, m.unit)}</span> by {PERIOD.end}
                      {projectedOver ? ` — ${Math.round((projected / m.limit - 1) * 100)}% over limit.` : "."}
                    </>
                  ) : (
                    <>{fmt(m.limit - m.used, m.unit)} {m.unit === "GB" ? "free" : `${m.unit} available`} · doesn't reset</>
                  )}
                </div>
                <Button className="mt-3 w-full" variant={level === "ok" ? "outline" : "default"} onClick={() => open(m.id)}>
                  <Plus /> {m.cta}
                </Button>
              </div>
            )
          })}
        </div>
      </div>

      <Dialog open={!!buyFor} onOpenChange={(o) => !o && phase !== "processing" && setBuyFor(null)}>
        <DialogContent className="sm:max-w-md">
          {sel && phase === "done" ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="inline-flex size-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"><Check className="size-7" /></div>
              <DialogTitle className="text-xl">Limit increased</DialogTitle>
              <DialogDescription>
                {sel.label} now has {fmt(sel.limit, sel.unit)} {sel.unit === "GB" ? "" : sel.unit} available. ${total.toFixed(2)} was charged to Visa •••• 4242.
              </DialogDescription>
              <Button className="mt-2 w-full" onClick={() => setBuyFor(null)}>Back to usage</Button>
            </div>
          ) : sel ? (
            <>
              <DialogHeader>
                <DialogTitle>Add more capacity</DialogTitle>
                <DialogDescription>Applies instantly. {sel.pack.recurring ? "Added to your monthly bill." : "Unused credits roll over for 12 months."}</DialogDescription>
              </DialogHeader>

              <div role="radiogroup" aria-label="What to add" className="grid grid-cols-2 gap-2">
                {meters.map((m) => {
                  const Icon = m.icon
                  const on = m.id === sel.id
                  return (
                    <button
                      key={m.id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      disabled={phase === "processing"}
                      onClick={() => {
                        setBuyFor(m.id)
                        setQty(1)
                      }}
                      className={cn("flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors hover:bg-muted/50", on && "border-primary bg-primary/5 ring-1 ring-primary")}
                    >
                      <Icon className="size-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{m.label}</span>
                      <span className="text-xs text-muted-foreground">${m.pack.price} / {m.pack.size === 1 ? m.pack.noun : `${m.pack.size.toLocaleString("en-US")} ${m.unit === "GB" ? "GB" : m.unit}`}{m.pack.recurring ? " / mo" : ""}</span>
                    </button>
                  )
                })}
              </div>

              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="buy-qty" className="flex flex-col items-start gap-0.5">
                  Quantity
                  <span className="text-xs font-normal text-muted-foreground">10% off 5 or more</span>
                </Label>
                <div className="flex items-center rounded-lg border">
                  <Button variant="ghost" size="icon-sm" aria-label="Decrease quantity" disabled={qty <= 1 || phase === "processing"} onClick={() => setQty((q) => Math.max(1, q - 1))}><Minus /></Button>
                  <Input
                    id="buy-qty"
                    inputMode="numeric"
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, Math.min(50, Number(e.target.value.replace(/\D/g, "")) || 1)))}
                    className="h-7 w-12 border-0 text-center tabular-nums shadow-none focus-visible:ring-0 dark:bg-transparent"
                  />
                  <Button variant="ghost" size="icon-sm" aria-label="Increase quantity" disabled={qty >= 50 || phase === "processing"} onClick={() => setQty((q) => Math.min(50, q + 1))}><Plus /></Button>
                </div>
              </div>

              <div className="rounded-xl bg-muted/60 p-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>New limit</span>
                  <span className="tabular-nums">{fmt(sel.limit, sel.unit)} → <span className="font-semibold text-foreground">{fmt(newLimit, sel.unit)}</span></span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-background">
                  <div className={cn("h-full rounded-full transition-all duration-500", LEVEL[levelOf(newPct)].bg)} style={{ width: `${Math.min(100, newPct)}%` }} />
                </div>
                <div className="mt-1 text-right text-xs text-muted-foreground tabular-nums">{Math.round(newPct)}% used after purchase</div>
              </div>

              <dl className="flex flex-col gap-1.5 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">{qty} × {sel.pack.noun}</dt><dd className="tabular-nums">${subtotal.toFixed(2)}</dd></div>
                {discount > 0 && <div className="flex justify-between text-emerald-700 dark:text-emerald-400"><dt>Volume discount (10%)</dt><dd className="tabular-nums">−${(subtotal * discount).toFixed(2)}</dd></div>}
                <div className="flex items-baseline justify-between border-t pt-2"><dt className="font-medium">Total{sel.pack.recurring ? " / month" : ""}</dt><dd className="text-2xl font-semibold tracking-tight tabular-nums">${total.toFixed(2)}</dd></div>
              </dl>

              <DialogFooter>
                <Button variant="outline" onClick={() => setBuyFor(null)} disabled={phase === "processing"}>Cancel</Button>
                <Button onClick={purchase} disabled={phase === "processing"}>
                  {phase === "processing" && <Loader2 className="animate-spin" />}
                  {phase === "processing" ? "Processing…" : `Pay $${total.toFixed(2)}`}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

"use client"

import * as React from "react"
import { ArrowRight, CalendarCheck, Check, Play, Sparkles, Star, TrendingUp } from "lucide-react"
import { Avatar, AvatarGroup } from "@/registry/components/core/avatar"
import { Badge } from "@/registry/components/core/badge"
import { Button } from "@/registry/components/core/button"
import { Dialog } from "@/registry/components/core/dialog"
import { Input } from "@/registry/components/core/input"
import { DotGrid } from "@/registry/components/backgrounds/dot-grid"
import { TiltCard, TiltCardLayer } from "@/registry/components/cards/tilt-card"
import { SuccessCheck } from "@/registry/components/feedback/success-check"
import { NumberFlow } from "@/registry/components/numbers/number-flow"
import { cn } from "@/lib/utils"

/* ---------- Demo data ---------- */

const CLIENTS = ["Maya Chen", "Leo Park", "Priya Nair", "Sam Okafor", "Lena Fischer"]
const BARS = [42, 58, 51, 74, 66, 88, 79]
const BARS_LIVE = [48, 66, 60, 82, 74, 96, 91]
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const UPCOMING = [
  { time: "9:30", client: "Grace Kim", service: "Cut & blow-dry", color: "var(--chart-1)" },
  { time: "11:00", client: "Daniel Ortiz", service: "Beard trim", color: "var(--chart-2)" },
  { time: "2:15", client: "Mia Rossi", service: "Balayage", color: "var(--chart-4)" },
]

/* ---------- Product mock ---------- */

function ProductMock({ live }: { live: boolean }) {
  const bars = live ? BARS_LIVE : BARS
  return (
    <div className="flex h-full w-full overflow-hidden rounded-xl border bg-card text-card-foreground shadow-2xl" aria-hidden="true">
      <div className="hidden w-32 shrink-0 flex-col gap-1 border-r bg-muted/40 p-3 sm:flex">
        <div className="mb-3 flex items-center gap-2 px-1">
          <span className="size-5 rounded-md bg-primary" />
          <span className="h-2 w-14 rounded bg-foreground/70" />
        </div>
        {["Calendar", "Clients", "Services", "Reports", "Settings"].map((n, i) => (
          <div key={n} className={cn("flex items-center gap-2 rounded-md px-2 py-1.5", i === 0 && "bg-background shadow-xs")}>
            <span className={cn("size-3 rounded-sm", i === 0 ? "bg-primary" : "bg-muted-foreground/30")} />
            <span className={cn("h-1.5 rounded", i === 0 ? "w-12 bg-foreground/70" : "w-10 bg-muted-foreground/30")} />
          </div>
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] text-muted-foreground">This week</div>
            <div className="text-sm font-semibold">Bookings overview</div>
          </div>
          <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium", live ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-muted text-foreground/80")}>
            <span className={cn("size-1.5 rounded-full", live ? "bg-emerald-500" : "bg-muted-foreground/50")} /> {live ? "Live" : "Paused"}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Bookings", value: live ? 148 : 126, suffix: "" },
            { label: "Revenue", value: live ? 9840 : 8320, prefix: "$" },
            { label: "No-shows", value: live ? 2 : 5, suffix: "%" },
          ].map((k) => (
            <div key={k.label} className="rounded-lg border bg-background p-2">
              <div className="text-[10px] text-muted-foreground">{k.label}</div>
              <div className="text-sm font-semibold tabular-nums">
                <NumberFlow value={k.value} prefix={k.prefix} suffix={k.suffix} />
              </div>
            </div>
          ))}
        </div>
        <div className="flex min-h-24 flex-1 items-end gap-1.5 rounded-lg border bg-background p-2 pt-4">
          {bars.map((h, i) => (
            <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1 self-stretch">
              <div className="w-full rounded-sm bg-primary/70 transition-[height] duration-700 ease-out" style={{ height: `${Math.round(h * 0.8)}px` }} />
              <span className="text-[9px] text-muted-foreground">{DAYS[i]}</span>
            </div>
          ))}
        </div>
        <div className="hidden flex-col gap-1 sm:flex">
          {UPCOMING.map((u) => (
            <div key={u.client} className="flex items-center gap-2 rounded-md border bg-background px-2 py-1">
              <span className="h-5 w-0.5 rounded-full" style={{ background: u.color }} />
              <span className="w-8 text-[10px] tabular-nums text-muted-foreground">{u.time}</span>
              <span className="text-[11px] font-medium">{u.client}</span>
              <span className="ml-auto text-[10px] text-muted-foreground">{u.service}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ---------- Block ---------- */

export default function HeroProductShot() {
  const [live, setLive] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const [email, setEmail] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [sent, setSent] = React.useState(false)

  const submit = () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter a valid work email")
      return
    }
    setError(null)
    setSent(true)
  }

  return (
    <div className="p-4 md:p-6">
      <section className="relative overflow-hidden rounded-3xl border bg-background">
        <DotGrid fade="radial" gap={22} className="absolute inset-0" />
        <div aria-hidden="true" className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[36rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative mx-auto flex max-w-5xl flex-col items-center px-5 pt-14 pb-10 text-center sm:px-8 sm:pt-20">
          <Badge variant="soft" tone="primary" shape="pill" icon={<Sparkles />} animation="shine">
            New: AI receptionist answers your missed calls
          </Badge>
          <h1 className="mt-5 max-w-3xl font-heading text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            The booking page your clients <span className="bg-gradient-to-r from-primary via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">actually use</span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-balance text-muted-foreground sm:text-lg">
            Online booking, reminders, deposits and a calendar your whole team lives in. Set up in an afternoon, no card required.
          </p>
          <div className="mt-7 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
            <Button size="lg" animation="arrow" shadow="glow" iconRight={<ArrowRight />} onClick={() => { setSent(false); setOpen(true) }}>
              Start free trial
            </Button>
            <Button size="lg" variant="outline" tone="neutral" iconLeft={<Play />} aria-pressed={live} onClick={() => setLive((v) => !v)}>
              {live ? "Pause the demo" : "See it live"}
            </Button>
          </div>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
            <AvatarGroup size="sm" max={5}>
              {CLIENTS.map((n) => (
                <Avatar key={n} name={n} size="sm" />
              ))}
            </AvatarGroup>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <span className="flex text-amber-500" role="img" aria-label="4.9 out of 5 stars">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className="size-3.5 fill-current" />
                ))}
              </span>
              <span>
                <strong className="font-semibold text-foreground">4.9</strong> from 2,400+ studios
              </span>
            </div>
          </div>
        </div>
        <div className="relative mx-auto max-w-5xl px-5 pb-0 sm:px-10">
          <TiltCard maxTilt={5} scale={1.01} glare={false} className="rounded-t-2xl border-0 bg-transparent shadow-none" containerClassName="w-full">
            <div className="relative aspect-[16/10] w-full sm:aspect-[16/8.5]">
              <TiltCardLayer depth={10} className="absolute inset-0">
                <ProductMock live={live} />
              </TiltCardLayer>
              <TiltCardLayer depth={50} className="absolute top-12 -right-2 sm:top-14 sm:-right-6">
                <div className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-xs shadow-lg">
                  <span className="flex size-7 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    <CalendarCheck className="size-4" />
                  </span>
                  <div>
                    <div className="font-medium">New booking</div>
                    <div className="text-muted-foreground">Ava T. · Balayage · Fri 2:30</div>
                  </div>
                </div>
              </TiltCardLayer>
              <TiltCardLayer depth={40} className="absolute bottom-6 -left-2 hidden sm:block">
                <div className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-xs shadow-lg">
                  <TrendingUp className="size-4 text-primary" />
                  <span>
                    <strong className="font-semibold">+38%</strong> rebookings
                  </span>
                </div>
              </TiltCardLayer>
            </div>
          </TiltCard>
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </section>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={sent ? "Check your inbox" : "Start your 14-day trial"}
        description={sent ? undefined : "No card needed. Your booking page goes live today."}
        icon={<Sparkles />}
        size="sm"
        animation="scale"
        footer={
          sent ? (
            <Button fullWidth onClick={() => setOpen(false)}>Done</Button>
          ) : (
            <div className="flex w-full justify-end gap-2">
              <Button variant="ghost" tone="neutral" onClick={() => setOpen(false)}>Cancel</Button>
              <Button iconRight={<ArrowRight />} onClick={submit}>Create account</Button>
            </div>
          )
        }
      >
        {sent ? (
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <SuccessCheck size={64} />
            <p className="text-sm text-muted-foreground">
              We sent a sign-in link to <strong className="text-foreground">{email}</strong>.
            </p>
          </div>
        ) : (
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              submit()
            }}
          >
            <Input label="Work email" type="email" placeholder="you@studio.com" value={email} onValueChange={setEmail} state={error ? "error" : "default"} message={error} shakeKey={error ?? undefined} autoFocus />
            <ul className="grid gap-1.5 text-xs text-muted-foreground">
              {["Unlimited bookings during the trial", "Import clients from a spreadsheet", "Cancel any time, keep your data"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" /> {t}
                </li>
              ))}
            </ul>
          </form>
        )}
      </Dialog>
    </div>
  )
}

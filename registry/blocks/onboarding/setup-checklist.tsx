"use client"

import * as React from "react"
import { ArrowRight, CalendarClock, Check, ChevronDown, CreditCard, Globe, Loader2, PartyPopper, RotateCcw, Scissors, Undo2, UserPlus, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type State = "todo" | "done" | "skipped"
type Step = { id: string; title: string; body: string; action: string; minutes: number; icon: React.ComponentType<{ className?: string }>; result: string }

const STEPS: [Step, ...Step[]] = [
  { id: "hours", title: "Set your opening hours", body: "Clients can only book inside these hours. You can add breaks and holidays later.", action: "Use Mon–Sat, 9–6", minutes: 1, icon: CalendarClock, result: "Mon–Sat · 9:00 AM – 6:00 PM" },
  { id: "service", title: "Add your first service", body: "Give it a name, a duration and a price. We prefilled a popular one for salons.", action: "Add “Haircut & style · 45 min · $55”", minutes: 2, icon: Scissors, result: "Haircut & style added" },
  { id: "team", title: "Invite your team", body: "Each staff member gets their own calendar and can manage their bookings from their phone.", action: "Send invite to liam@northside.studio", minutes: 1, icon: UserPlus, result: "Invite sent to Liam" },
  { id: "payments", title: "Turn on deposits", body: "Take a 20% deposit at booking. Studios that do this see 60% fewer no-shows.", action: "Connect payouts", minutes: 3, icon: CreditCard, result: "Deposits on · 20%" },
  { id: "publish", title: "Publish your booking page", body: "Share it on Instagram, Google and your website. You can change the design anytime.", action: "Publish northside.slotwise.app", minutes: 1, icon: Globe, result: "Live at northside.slotwise.app" },
]

const CONFETTI = Array.from({ length: 42 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: ((i * 13) % 20) / 10,
  duration: 2.2 + ((i * 7) % 10) / 8,
  size: 6 + ((i * 5) % 6),
  color: `var(--chart-${(i % 5) + 1})`,
  rotate: (i * 47) % 360,
  round: i % 3 === 0,
}))

export default function SetupChecklist() {
  const [states, setStates] = React.useState<Record<string, State>>({ hours: "done" })
  const [open, setOpen] = React.useState<string | null>("service")
  const [working, setWorking] = React.useState<string | null>(null)
  const [dismissed, setDismissed] = React.useState(false)
  const [celebrate, setCelebrate] = React.useState(false)
  const statesRef = React.useRef(states)
  React.useEffect(() => { statesRef.current = states }, [states])

  const done = STEPS.filter((s) => states[s.id] === "done").length
  const handled = STEPS.filter((s) => states[s.id] && states[s.id] !== "todo").length
  const pct = Math.round((done / STEPS.length) * 100)
  const allHandled = handled === STEPS.length
  const minutesLeft = STEPS.filter((s) => !states[s.id] || states[s.id] === "todo").reduce((t, s) => t + s.minutes, 0)

  React.useEffect(() => {
    if (!allHandled) {
      setCelebrate(false)
      return
    }
    setCelebrate(true)
    const id = setTimeout(() => setCelebrate(false), 4200)
    return () => clearTimeout(id)
  }, [allHandled])

  const nextOpen = (from: string, next: Record<string, State>) => STEPS.find((s, i) => i > STEPS.findIndex((x) => x.id === from) && (!next[s.id] || next[s.id] === "todo"))?.id ?? STEPS.find((s) => !next[s.id] || next[s.id] === "todo")?.id ?? null

  const set = (id: string, st: State) => {
    const next = { ...statesRef.current, [id]: st }
    statesRef.current = next
    setStates(next)
    if (st !== "todo") setOpen(nextOpen(id, next))
  }

  const complete = (id: string) => {
    setWorking(id)
    setTimeout(() => {
      setWorking(null)
      set(id, "done")
    }, 800)
  }

  const R = 34
  const C = 2 * Math.PI * R

  if (dismissed) {
    return (
      <div className="p-4 md:p-6">
        <div className="mx-auto flex max-w-xl items-center gap-3 rounded-xl border border-dashed p-4 text-sm">
          <span className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-semibold">{pct}%</span>
          <div className="flex-1">
            <div className="font-medium">Getting started is hidden</div>
            <div className="text-muted-foreground">{STEPS.length - handled} steps left. You can find it again under Help.</div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setDismissed(false)}>Show checklist</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      <style>{`@keyframes sc-fall{0%{transform:translateY(-20px) rotate(0);opacity:1}100%{transform:translateY(520px) rotate(720deg);opacity:0}}`}</style>
      <div className="relative mx-auto max-w-xl overflow-hidden rounded-2xl border bg-card shadow-sm">
        {celebrate && (
          <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden" aria-hidden>
            {CONFETTI.map((c, i) => (
              <span key={i} className={cn("absolute top-0", c.round ? "rounded-full" : "rounded-[2px]")} style={{ left: `${c.left}%`, width: c.size, height: c.round ? c.size : c.size * 1.6, background: c.color, transform: `rotate(${c.rotate}deg)`, animation: `sc-fall ${c.duration}s cubic-bezier(.25,.6,.4,1) ${c.delay}s both` }} />
            ))}
          </div>
        )}

        {/* Header */}
        <div className="relative flex items-center gap-5 border-b bg-gradient-to-br from-primary/10 via-transparent to-[color-mix(in_oklch,var(--chart-2)_12%,transparent)] p-5 sm:p-6">
          <div className="relative size-20 shrink-0">
            <svg viewBox="0 0 80 80" className="size-20 -rotate-90">
              <circle cx="40" cy="40" r={R} fill="none" strokeWidth="7" className="stroke-muted" />
              <circle cx="40" cy="40" r={R} fill="none" strokeWidth="7" strokeLinecap="round" className={cn("transition-[stroke-dashoffset] duration-700 ease-out", pct === 100 ? "stroke-emerald-500" : "stroke-primary")} strokeDasharray={C} strokeDashoffset={C - (C * pct) / 100} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg leading-none font-bold tabular-nums">{pct}%</span>
              <span className="text-[10px] text-muted-foreground">{done}/{STEPS.length}</span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold">{allHandled ? "You're ready for bookings" : "Get Northside Studio ready"}</h2>
            <p className="text-sm text-muted-foreground">{allHandled ? "Nice work. Your booking page is live." : `About ${minutesLeft} min left · finish setup to take your first booking`}</p>
          </div>
          <Button variant="ghost" size="icon-sm" className="absolute top-3 right-3" aria-label="Dismiss checklist" onClick={() => setDismissed(true)}><X /></Button>
        </div>

        {allHandled ? (
          <div className="flex animate-in flex-col items-center gap-3 px-6 py-10 text-center duration-500 fade-in zoom-in-95">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--chart-1)] to-[var(--chart-3)] text-white shadow-lg"><PartyPopper className="size-7" /></div>
            <h3 className="text-xl font-semibold">Setup complete!</h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              {done === STEPS.length ? "All 5 steps done." : `${done} done, ${STEPS.length - done} skipped. You can finish skipped steps from Settings.`} Share your page to get your first booking today.
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              <Button onClick={() => { setCelebrate(false); setTimeout(() => setCelebrate(true), 30) }}><PartyPopper /> Celebrate again</Button>
              <Button variant="outline" onClick={() => { setStates({}); setOpen(STEPS[0].id) }}><RotateCcw /> Reset demo</Button>
              <Button variant="ghost" onClick={() => setDismissed(true)}>Hide checklist</Button>
            </div>
          </div>
        ) : (
          <ul className="divide-y">
            {STEPS.map((s) => {
              const st = states[s.id] ?? "todo"
              const expanded = open === s.id
              const Icon = s.icon
              return (
                <li key={s.id} className={cn("transition-colors", expanded && "bg-muted/40")}>
                  <button type="button" aria-expanded={expanded} onClick={() => setOpen(expanded ? null : s.id)} className="flex w-full items-center gap-3 px-5 py-3.5 text-left sm:px-6">
                    <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-all", st === "done" && "border-emerald-500 bg-emerald-500 text-white", st === "skipped" && "border-dashed border-muted-foreground/40 text-muted-foreground", st === "todo" && (expanded ? "border-primary text-primary" : "border-border text-muted-foreground"))}>
                      {st === "done" ? <Check className="size-4" /> : st === "skipped" ? <ArrowRight className="size-3.5" /> : <Icon className="size-3.5" />}
                    </span>
                    <span className={cn("flex-1 text-sm font-medium", st === "done" && "text-muted-foreground line-through decoration-muted-foreground/50", st === "skipped" && "text-muted-foreground")}>{s.title}</span>
                    {st === "skipped" && <Badge variant="outline" className="text-muted-foreground">Skipped</Badge>}
                    {st === "todo" && <span className="hidden text-xs text-muted-foreground sm:inline">{s.minutes} min</span>}
                    <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", expanded && "rotate-180")} />
                  </button>
                  {expanded && (
                    <div className="animate-in px-5 pb-4 pl-15 duration-200 fade-in slide-in-from-top-1 sm:px-6 sm:pl-16">
                      {st === "todo" ? (
                        <>
                          <p className="text-sm text-muted-foreground">{s.body}</p>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Button size="sm" disabled={working === s.id} onClick={() => complete(s.id)}>
                              {working === s.id ? <Loader2 className="animate-spin" /> : null} {s.action}
                            </Button>
                            <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => set(s.id, "skipped")}>Skip for now</Button>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-2 text-sm">
                          <span className={st === "done" ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"}>{st === "done" ? s.result : "You skipped this step."}</span>
                          <Button size="xs" variant="outline" onClick={() => setStates((p) => ({ ...p, [s.id]: "todo" }))}><Undo2 /> Undo</Button>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

"use client"

import * as React from "react"
import { ArrowLeft, ArrowRight, Bell, Gift, LayoutList, Megaphone, Rocket, Sparkles, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type Slide = { id: string; tag: string; title: string; body: string; points: string[]; art: React.ReactNode; tint: string }

const SLIDES: Slide[] = [
  {
    id: "recurring",
    tag: "New",
    title: "Recurring bookings",
    body: "Book a client every 2, 4 or 6 weeks in one step. Clashes are flagged before anything is saved.",
    points: ["Repeat by week, month or custom interval", "Skip or move a single visit without breaking the series"],
    art: <RecurringArt />,
    tint: "text-violet-700 bg-violet-500/10 dark:text-violet-300",
  },
  {
    id: "whatsapp",
    tag: "New",
    title: "WhatsApp reminders",
    body: "Clients get a friendly reminder 24 hours before and can confirm or reschedule with one tap.",
    points: ["No-shows dropped 38% in our beta studios", "Replies land straight in your client inbox"],
    art: <ChatArt />,
    tint: "text-emerald-700 bg-emerald-500/10 dark:text-emerald-300",
  },
  {
    id: "waitlist",
    tag: "Improved",
    title: "Smart waitlist",
    body: "When someone cancels, the next best match on the waitlist is offered the slot automatically.",
    points: ["Matches on service, staff and preferred time", "First to accept gets it, the rest are notified"],
    art: <WaitlistArt />,
    tint: "text-amber-700 bg-amber-500/10 dark:text-amber-300",
  },
]

type ChangeKind = "New" | "Improved" | "Fixed"

const CHANGELOG: { version: string; date: string; items: { kind: ChangeKind; text: string }[] }[] = [
  {
    version: "4.2",
    date: "Nov 3, 2026",
    items: [
      { kind: "New", text: "Recurring bookings with clash detection" },
      { kind: "New", text: "WhatsApp reminders with one-tap confirm" },
      { kind: "Improved", text: "Smart waitlist now matches preferred staff" },
      { kind: "Fixed", text: "Deposits showed twice on split payments" },
    ],
  },
  {
    version: "4.1",
    date: "Oct 20, 2026",
    items: [
      { kind: "New", text: "Resource timeline for rooms and chairs" },
      { kind: "Improved", text: "Calendar loads 2× faster on large teams" },
      { kind: "Fixed", text: "Time zone drift on daylight-saving weekends" },
    ],
  },
  {
    version: "4.0",
    date: "Oct 6, 2026",
    items: [
      { kind: "New", text: "Client inbox for SMS, WhatsApp and email" },
      { kind: "Improved", text: "Redesigned booking page with your brand colours" },
    ],
  },
]

const KIND_STYLE: Record<ChangeKind, { cls: string; icon: React.ElementType }> = {
  New: { cls: "bg-violet-500/10 text-violet-700 dark:text-violet-300", icon: Rocket },
  Improved: { cls: "bg-sky-500/10 text-sky-700 dark:text-sky-300", icon: Sparkles },
  Fixed: { cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300", icon: Wrench },
}

export default function WhatsNew() {
  const [open, setOpen] = React.useState(false)
  const [index, setIndex] = React.useState(0)
  const [seen, setSeen] = React.useState<string[]>([])
  const [view, setView] = React.useState<"slides" | "list">("slides")
  const [mute, setMute] = React.useState(false)
  const [release, setRelease] = React.useState(0)

  const unread = SLIDES.length - seen.length
  const slide = SLIDES[index]!

  const go = (i: number) => {
    const next = SLIDES[i]
    if (!next) return
    setIndex(i)
    setSeen((s) => (s.includes(next.id) ? s : [...s, next.id]))
  }
  const launch = () => {
    setView("slides")
    go(0)
    setOpen(true)
  }
  const simulateRelease = () => {
    setRelease((r) => r + 1)
    setSeen([])
    if (!mute) {
      setView("slides")
      setIndex(0)
      setSeen([SLIDES[0]!.id])
      setOpen(true)
    }
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        {/* Mock app header with launcher */}
        <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-xs">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">N</span>
          <span className="hidden font-semibold sm:inline">Northside Studio</span>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={launch}
              className="group relative inline-flex h-9 items-center gap-2 rounded-full border bg-background pr-3 pl-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              <span className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
                <Gift className="size-3.5" />
              </span>
              What&apos;s new
              {unread > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-card">
                  <span className="absolute inset-0 animate-ping rounded-full bg-rose-500 opacity-40" />
                  <span className="relative">{unread}</span>
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Teaser */}
        <button type="button" onClick={launch} className="group relative overflow-hidden rounded-2xl border text-left">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-rose-500" />
          <div className="absolute -top-16 -right-10 size-56 rounded-full bg-white/15 blur-2xl" />
          <div className="relative flex flex-col gap-4 p-6 text-white sm:flex-row sm:items-center">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30 backdrop-blur">
              <Megaphone className="size-6" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold tracking-widest text-white/70 uppercase">Release 4.2{release ? `.${release}` : ""}</div>
              <div className="text-xl font-semibold">Recurring bookings, WhatsApp reminders and a smarter waitlist</div>
            </div>
            <span className="inline-flex items-center gap-1 self-start rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-violet-700 transition-transform group-hover:translate-x-0.5 sm:self-auto">
              See what&apos;s new <ArrowRight className="size-4" />
            </span>
          </div>
        </button>

        <div className="flex flex-col gap-3 rounded-xl border border-dashed p-4 text-sm sm:flex-row sm:items-center">
          <Bell className="size-4 shrink-0 text-muted-foreground" />
          <p className="flex-1 text-muted-foreground">
            {mute ? "Release notes won't pop up. You'll only see the badge." : "Release notes open automatically the next time we ship."}
          </p>
          <Button variant="outline" size="sm" onClick={simulateRelease}>Simulate a new release</Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
          {view === "slides" ? (
            <>
              <div key={slide.id} className="animate-in fade-in-0">{slide.art}</div>
              <div className="flex flex-col gap-3 p-6">
                <div className="flex items-center gap-2">
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", slide.tint)}>{slide.tag}</span>
                  <span className="text-xs text-muted-foreground">Release 4.2 · {index + 1} of {SLIDES.length}</span>
                </div>
                <DialogTitle className="text-xl">{slide.title}</DialogTitle>
                <DialogDescription>{slide.body}</DialogDescription>
                <ul className="flex flex-col gap-1.5 text-sm">
                  {slide.points.map((p) => (
                    <li key={p} className="flex gap-2">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" /> {p}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div className="flex flex-col">
              <div className="border-b p-6 pb-4">
                <DialogTitle className="text-xl">Changelog</DialogTitle>
                <DialogDescription>Everything we shipped in the last month.</DialogDescription>
              </div>
              <div className="max-h-[360px] overflow-y-auto px-6 py-4">
                {CHANGELOG.map((r) => (
                  <div key={r.version} className="relative border-l pb-5 pl-5 last:pb-0">
                    <span className="absolute top-1 -left-[5px] size-2.5 rounded-full bg-primary ring-4 ring-popover" />
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-sm font-semibold">v{r.version}</span>
                      <span className="text-xs text-muted-foreground">{r.date}</span>
                    </div>
                    <ul className="mt-2 flex flex-col gap-1.5">
                      {r.items.map((it) => {
                        const K = KIND_STYLE[it.kind]
                        return (
                          <li key={it.text} className="flex items-start gap-2 text-sm">
                            <span className={cn("mt-0.5 inline-flex shrink-0 items-center gap-1 rounded px-1.5 text-[10px] leading-4 font-semibold uppercase", K.cls)}>
                              <K.icon className="size-2.5" /> {it.kind}
                            </span>
                            {it.text}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 border-t bg-muted/40 px-6 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Checkbox id="wn-mute" checked={mute} onCheckedChange={(v) => setMute(!!v)} />
                <Label htmlFor="wn-mute" className="text-sm font-normal">Don&apos;t show again</Label>
              </div>
              <button
                type="button"
                onClick={() => setView((v) => (v === "slides" ? "list" : "slides"))}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {view === "slides" ? <LayoutList className="size-4" /> : <Sparkles className="size-4" />}
                {view === "slides" ? "Full changelog" : "Highlights"}
              </button>
            </div>
            {view === "slides" && (
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5" role="tablist" aria-label="Slides">
                  {SLIDES.map((s, i) => (
                    <button
                      key={s.id}
                      type="button"
                      role="tab"
                      aria-selected={i === index}
                      aria-label={`Go to ${s.title}`}
                      onClick={() => go(i)}
                      className={cn("h-2 rounded-full transition-all", i === index ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60")}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" disabled={index === 0} onClick={() => go(index - 1)}>
                    <ArrowLeft /> Back
                  </Button>
                  {index < SLIDES.length - 1 ? (
                    <Button size="sm" onClick={() => go(index + 1)}>
                      Next <ArrowRight />
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => setOpen(false)}>Got it</Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ---------- Illustrations: pure divs + SVG so they inherit no assets ---------- */

function RecurringArt() {
  const on = new Set([1, 8, 15, 22, 4, 18])
  return (
    <div className="relative flex h-48 items-center justify-center overflow-hidden bg-gradient-to-br from-violet-600 via-indigo-600 to-fuchsia-500">
      <div className="absolute -top-10 -left-10 size-40 rounded-full bg-white/10 blur-xl" />
      <div className="relative w-56 rotate-[-4deg] rounded-xl bg-white/95 p-3 shadow-2xl dark:bg-white/90">
        <div className="mb-2 flex items-center justify-between">
          <div className="h-2 w-16 rounded-full bg-violet-300" />
          <div className="h-2 w-6 rounded-full bg-zinc-200" />
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 28 }, (_, i) => (
            <div key={i} className={cn("aspect-square rounded-[3px]", on.has(i) ? "bg-violet-500" : "bg-zinc-100")} />
          ))}
        </div>
      </div>
      <svg viewBox="0 0 80 80" className="absolute right-8 bottom-6 size-20 text-white drop-shadow-lg sm:right-16" aria-hidden>
        <path d="M58 26a24 24 0 1 0 4 22" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
        <path d="M60 10v18H42" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

function ChatArt() {
  return (
    <div className="relative flex h-48 items-end justify-center overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600">
      <svg viewBox="0 0 400 200" className="absolute inset-0 size-full opacity-20" preserveAspectRatio="none" aria-hidden>
        <path d="M0 140 C 100 80, 200 200, 400 110 L 400 200 L 0 200 Z" fill="white" />
      </svg>
      <div className="relative h-40 w-44 rounded-t-[28px] border-[6px] border-b-0 border-zinc-900 bg-white p-3 shadow-2xl">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-zinc-200" />
        <div className="flex flex-col gap-2">
          <div className="w-[85%] rounded-xl rounded-bl-sm bg-zinc-100 p-2">
            <div className="h-1.5 w-full rounded-full bg-zinc-300" />
            <div className="mt-1 h-1.5 w-2/3 rounded-full bg-zinc-300" />
          </div>
          <div className="flex gap-1.5">
            <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-semibold text-white">Confirm</span>
            <span className="rounded-full border border-zinc-300 px-2 py-0.5 text-[9px] font-semibold text-zinc-600">Reschedule</span>
          </div>
          <div className="ml-auto w-[60%] rounded-xl rounded-br-sm bg-emerald-100 p-2">
            <div className="h-1.5 w-full rounded-full bg-emerald-400" />
          </div>
        </div>
      </div>
      <div className="absolute top-6 right-6 flex size-11 items-center justify-center rounded-full bg-white text-emerald-600 shadow-lg sm:right-20">
        <Bell className="size-5" />
        <span className="absolute -top-0.5 -right-0.5 size-3 rounded-full bg-rose-500 ring-2 ring-white" />
      </div>
    </div>
  )
}

function WaitlistArt() {
  const people = ["bg-rose-400", "bg-sky-400", "bg-violet-400"]
  return (
    <div className="relative flex h-48 items-center justify-center gap-3 overflow-hidden bg-gradient-to-br from-amber-400 sm:gap-6 via-orange-500 to-rose-500">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,.35),transparent_45%)]" />
      <div className="relative flex flex-col gap-2">
        {people.map((c, i) => (
          <div key={c} className="flex items-center gap-2 rounded-lg bg-white/90 py-1.5 pr-4 pl-1.5 shadow-md" style={{ marginLeft: i * 10, opacity: 1 - i * 0.2 }}>
            <span className={cn("size-6 rounded-full", c)} />
            <span className="h-1.5 w-14 rounded-full bg-zinc-300" />
          </div>
        ))}
      </div>
      <svg viewBox="0 0 60 24" className="relative w-14 text-white" aria-hidden>
        <path d="M2 12h48M40 3l10 9-10 9" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="relative rounded-xl bg-white p-3 shadow-2xl">
        <div className="text-[10px] font-semibold tracking-wide text-zinc-500 uppercase">Thu 3:00 PM</div>
        <div className="mt-1.5 flex items-center gap-2">
          <span className="size-7 rounded-full bg-rose-400 ring-2 ring-emerald-400" />
          <span className="text-xs font-semibold text-emerald-600">Slot filled</span>
        </div>
      </div>
    </div>
  )
}

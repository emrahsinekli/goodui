"use client"

import * as React from "react"
import { ArrowRight, Check, Mail, Sparkles } from "lucide-react"
import { Avatar, AvatarGroup } from "@/registry/components/core/avatar"
import { Button } from "@/registry/components/core/button"
import { Checkbox } from "@/registry/components/core/checkbox"
import { Input } from "@/registry/components/core/input"
import { SuccessCheck } from "@/registry/components/feedback/success-check"
import { CounterUp } from "@/registry/components/numbers/counter-up"
import { cn } from "@/lib/utils"

/* ---------- Demo data ---------- */

const TOPICS = [
  { id: "growth", label: "Growing a studio", hint: "Pricing, retention, reviews" },
  { id: "product", label: "Product updates", hint: "What shipped this month" },
  { id: "playbooks", label: "Playbooks", hint: "No-show, waitlist, deposits" },
]
const READERS = ["Maya Patel", "Leo Park", "Priya Nair", "Sam Okafor", "Lena Fischer"]
const PAST = [
  { title: "The 24-hour reminder is too early", readers: "12.4k" },
  { title: "Deposits without the awkward conversation", readers: "9.8k" },
  { title: "Why your Thursday is empty", readers: "8.1k" },
]

/* ---------- Block ---------- */

export default function NewsletterSignup() {
  const [email, setEmail] = React.useState("")
  const [topics, setTopics] = React.useState<string[]>(["growth", "playbooks"])
  const [error, setError] = React.useState<string | null>(null)
  const [done, setDone] = React.useState(false)
  const [opened, setOpened] = React.useState<string | null>(null)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter a valid email")
    if (!topics.length) return setError("Pick at least one topic")
    setError(null)
    setDone(true)
  }

  return (
    <div className="p-4 md:p-6">
      <section className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border bg-card lg:grid-cols-[1.1fr_1fr]">
        <div className="relative p-6 sm:p-10">
          <div aria-hidden="true" className="absolute -top-16 -left-16 size-56 rounded-full bg-primary/15 blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium">
              <Mail className="size-3.5 text-primary" /> The Front Desk · every other Tuesday
            </div>
            <h2 className="mt-4 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">One idea to fill your calendar, in your inbox</h2>
            <p className="mt-3 text-muted-foreground">Short, practical and written by people who ran studios before they built software. No fluff, unsubscribe in one click.</p>
            {done ? (
              <div className="mt-7 flex flex-col items-center gap-3 rounded-2xl border bg-background p-6 text-center">
                <SuccessCheck size={64} />
                <div className="text-lg font-semibold">You're in</div>
                <p className="text-sm text-muted-foreground">
                  We sent a confirmation to <strong className="text-foreground">{email}</strong>. Topics: {topics.map((t) => TOPICS.find((x) => x.id === t)?.label).join(", ")}.
                </p>
                <Button size="sm" variant="ghost" tone="neutral" onClick={() => { setDone(false); setEmail("") }}>Use a different email</Button>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-7 flex flex-col gap-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                  <Input aria-label="Email address" type="email" placeholder="you@studio.com" value={email} onValueChange={setEmail} state={error && !topics.length === false && error.includes("email") ? "error" : "default"} message={error?.includes("email") ? error : undefined} shakeKey={error ?? undefined} size="lg" fullWidth className="flex-1" />
                  <Button type="submit" size="lg" animation="arrow" iconRight={<ArrowRight />} className="shrink-0">Subscribe</Button>
                </div>
                <fieldset>
                  <legend className="mb-2 text-xs font-medium text-muted-foreground">What should we send?</legend>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {TOPICS.map((t) => (
                      <Checkbox key={t.id} variant="card" size="sm" label={t.label} description={t.hint} checked={topics.includes(t.id)} onCheckedChange={(c) => setTopics((s) => (c ? [...s, t.id] : s.filter((x) => x !== t.id)))} />
                    ))}
                  </div>
                  {error?.includes("topic") && <p className="mt-2 text-xs text-destructive">{error}</p>}
                </fieldset>
              </form>
            )}
            <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
              <AvatarGroup size="xs" max={5}>
                {READERS.map((n) => (
                  <Avatar key={n} name={n} size="xs" />
                ))}
              </AvatarGroup>
              <span>
                Read by <CounterUp value={18240} className="font-semibold text-foreground" format={{ maximumFractionDigits: 0 }} /> owners
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col border-t bg-muted/40 p-6 sm:p-8 lg:border-t-0 lg:border-l">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Recent issues</div>
            <span className="text-xs text-muted-foreground">Open rate 61%</span>
          </div>
          <ul className="mt-4 flex flex-col gap-2">
            {PAST.map((p, i) => (
              <li key={p.title}>
                <button type="button" onClick={() => setOpened(p.title)} aria-pressed={opened === p.title} className={cn("flex w-full items-start gap-3 rounded-xl border bg-card p-3 text-start transition-colors outline-none hover:border-foreground/30 focus-visible:ring-3 focus-visible:ring-ring/40", opened === p.title && "border-foreground/40")}>
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">#{42 - i}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{p.title}</span>
                    <span className="block text-xs text-muted-foreground">{p.readers} readers · 4 min</span>
                  </span>
                  {opened === p.title && <Check className="mt-1 size-4 text-emerald-600 dark:text-emerald-400" />}
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-6">
            <div className="rounded-xl border border-dashed p-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5 font-medium text-foreground"><Sparkles className="size-3.5 text-amber-500" /> From the last issue</div>
              <p className="mt-1">“Moving the reminder from 24 to 3 hours before cut our no-shows by another 9%. Nobody confirms a day early.”</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

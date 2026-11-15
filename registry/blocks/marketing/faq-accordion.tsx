"use client"

import * as React from "react"
import { CalendarClock, CreditCard, LifeBuoy, type LucideIcon, MessageCircleQuestion, Search, ShieldCheck, Users } from "lucide-react"
import { Button } from "@/registry/components/core/button"
import { Input } from "@/registry/components/core/input"
import { AccordionHeight, type AccordionHeightItem } from "@/registry/components/lists/accordion-height"
import { cn } from "@/lib/utils"

/* ---------- Demo data ---------- */

type Topic = { id: string; label: string; icon: LucideIcon }
type Faq = { id: string; topic: string; q: string; a: React.ReactNode; text: string }

const TOPICS: Topic[] = [
  { id: "all", label: "All", icon: MessageCircleQuestion },
  { id: "booking", label: "Booking", icon: CalendarClock },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "team", label: "Team", icon: Users },
  { id: "security", label: "Security", icon: ShieldCheck },
]

const FAQS: Faq[] = [
  { id: "ahead", topic: "booking", q: "How far ahead can clients book?", text: "Up to 60 days ahead by default and no later than 2 hours before the slot. Both limits can be changed per service.", a: <p>Up to 60 days ahead by default and no later than 2 hours before the slot. Both limits can be changed per service, so a 3-hour colour appointment can need a day's notice while a fringe trim can be booked for 20 minutes from now.</p> },
  { id: "cancel", topic: "booking", q: "What happens when a client cancels?", text: "They get a link in every reminder. Free until the cutoff you set; after that the deposit or no-show fee applies and the slot goes to the waitlist.", a: <p>Every reminder includes a reschedule and cancel link. Cancelling is free until the cutoff you set (24 hours by default). After that the deposit or no-show fee applies, and the slot is offered to your waitlist automatically.</p> },
  { id: "deposit", topic: "payments", q: "When is the deposit charged?", text: "At booking, as a percentage or fixed amount per service. The rest is collected at checkout.", a: (
    <div className="space-y-2">
      <p>At booking, as a percentage or a fixed amount per service. The rest is collected at checkout, in the app or on the card reader.</p>
      <ul className="list-disc space-y-1 ps-4">
        <li>Card details are held by the payment provider, never by you.</li>
        <li>Deposits are refunded automatically when you cancel.</li>
      </ul>
    </div>
  ) },
  { id: "fees", topic: "payments", q: "What are the card fees?", text: "2.9% + 30¢ on Solo, 2.5% + 30¢ on Studio and 2.2% + 30¢ on Scale. No monthly minimum, payouts daily.", a: <p>2.9% + 30¢ on Solo, 2.5% + 30¢ on Studio and 2.2% + 30¢ on Scale. There is no monthly minimum and payouts land in your bank account every business day.</p> },
  { id: "staff", topic: "team", q: "Can clients pick a specific stylist?", text: "Yes. Clients choose a team member or Any available, which spreads bookings evenly across the people who can do that service.", a: <p>Yes. Clients choose a team member or “Any available”, which spreads bookings evenly across the people who can do that service. Each person keeps their own hours, breaks and days off.</p> },
  { id: "seats", topic: "team", q: "How are seats counted?", text: "A seat is anyone with their own calendar. Front-desk and admin logins are free.", a: <p>A seat is anyone with their own calendar. Front-desk and admin logins are free, and adding or removing a seat is prorated to the day.</p> },
  { id: "data", topic: "security", q: "Who owns my client data?", text: "You do. Export everything as CSV at any time; we never sell or share client details.", a: <p>You do. Export everything as CSV at any time from Settings. We never sell or share client details, and you can delete a client (and all their history) with one click.</p> },
  { id: "gdpr", topic: "security", q: "Is it GDPR and HIPAA ready?", text: "Yes for GDPR. For clinics we sign a BAA on the Scale plan and store notes with field-level encryption.", a: <p>Yes for GDPR, including data processing agreements and EU hosting. For clinics we sign a BAA on the Scale plan and store notes with field-level encryption.</p> },
]

/* ---------- Block ---------- */

function highlight(text: string, q: string) {
  if (!q) return text
  const i = text.toLowerCase().indexOf(q.toLowerCase())
  if (i < 0) return text
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded bg-amber-200/70 px-0.5 text-foreground dark:bg-amber-400/30">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  )
}

export default function FaqAccordion() {
  const [topic, setTopic] = React.useState("all")
  const [q, setQ] = React.useState("")
  const [value, setValue] = React.useState<string[]>(["ahead"])
  const [asked, setAsked] = React.useState(false)

  const query = q.trim()
  const list = FAQS.filter((f) => (topic === "all" || f.topic === topic) && (!query || `${f.q} ${f.text}`.toLowerCase().includes(query.toLowerCase())))
  const items: AccordionHeightItem[] = list.map((f) => ({ value: f.id, title: highlight(f.q, query), content: <div className="text-sm leading-relaxed text-muted-foreground">{f.a}</div> }))

  return (
    <div className="p-4 md:p-6">
      <section className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[300px_1fr]">
        <div className="lg:sticky lg:top-6 lg:self-start">
          <h2 className="font-heading text-3xl font-semibold tracking-tight">Questions, answered</h2>
          <p className="mt-2 text-muted-foreground">Can't find it? Ask and we reply within a business day.</p>
          <Input className="mt-5" aria-label="Search questions" placeholder="Search, e.g. deposit" leading={<Search />} value={q} onValueChange={setQ} clearable />
          <ul className="mt-4 flex flex-wrap gap-1.5 lg:flex-col" aria-label="Topics">
            {TOPICS.map((t) => {
              const Icon = t.icon
              const count = t.id === "all" ? FAQS.length : FAQS.filter((f) => f.topic === t.id).length
              const on = topic === t.id
              return (
                <li key={t.id}>
                  <button type="button" aria-pressed={on} onClick={() => setTopic(t.id)} className={cn("flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40", on ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
                    <Icon className="size-4" /> {t.label}
                    <span className={cn("ms-auto text-xs tabular-nums", on ? "text-background/70" : "text-muted-foreground/70")}>{count}</span>
                  </button>
                </li>
              )
            })}
          </ul>
          <div className="mt-6 hidden rounded-2xl border bg-card p-4 lg:block">
            <div className="flex items-center gap-2 text-sm font-medium"><LifeBuoy className="size-4 text-primary" /> Still stuck?</div>
            <p className="mt-1 text-xs text-muted-foreground">Chat with a human, Mon to Fri, 9 to 6.</p>
            <Button size="sm" className="mt-3" fullWidth variant={asked ? "soft" : "outline"} tone={asked ? "success" : "neutral"} onClick={() => setAsked(true)}>
              {asked ? "We'll reply by email" : "Ask a question"}
            </Button>
          </div>
        </div>
        <div>
          {items.length ? (
            <AccordionHeight items={items} type="multiple" value={value} onValueChange={setValue} variant="separated" />
          ) : (
            <div className="flex flex-col items-center rounded-2xl border border-dashed p-10 text-center">
              <Search className="size-6 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">Nothing matches “{query}”</p>
              <p className="mt-1 text-xs text-muted-foreground">Try another word, or ask us directly.</p>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="outline" tone="neutral" onClick={() => { setQ(""); setTopic("all") }}>Clear search</Button>
                <Button size="sm" onClick={() => setAsked(true)}>{asked ? "Question sent" : `Ask about “${query}”`}</Button>
              </div>
            </div>
          )}
          {items.length > 0 && (
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>{items.length} of {FAQS.length} questions</span>
              <div className="flex gap-3">
                <button type="button" className="underline-offset-4 hover:underline" onClick={() => setValue(list.map((f) => f.id))}>Expand all</button>
                <button type="button" className="underline-offset-4 hover:underline" onClick={() => setValue([])}>Collapse all</button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

"use client"

import * as React from "react"
import { CalendarPlus, Check, Copy, Crown, Gift, Mail, MessageSquare, Pencil, Phone, Plus, Scissors, Sparkles, Star, Trash2, Undo2 } from "lucide-react"
import { Avatar } from "@/registry/components/core/avatar"
import { Badge } from "@/registry/components/core/badge"
import { Button } from "@/registry/components/core/button"
import { Dialog } from "@/registry/components/core/dialog"
import { Input } from "@/registry/components/core/input"
import { Rating } from "@/registry/components/core/rating"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/components/core/tabs"
import { NumberFlow } from "@/registry/components/numbers/number-flow"
import { cn } from "@/lib/utils"

/* ---------- Demo data ---------- */

type Visit = { id: string; date: string; service: string; staff: string; price: number; rating: number | null; note?: string }
const VISITS: Visit[] = [
  { id: "v1", date: "28 Feb 2026", service: "Balayage + gloss", staff: "Ana Petrova", price: 240, rating: 5, note: "Loved the warmer tone. Keep ends 1cm longer next time." },
  { id: "v2", date: "14 Jan 2026", service: "Cut & blow-dry", staff: "Ana Petrova", price: 85, rating: 5 },
  { id: "v3", date: "2 Dec 2025", service: "Root touch-up", staff: "Mia Okafor", price: 120, rating: 4, note: "Asked for less ash next time." },
  { id: "v4", date: "20 Oct 2025", service: "Balayage", staff: "Ana Petrova", price: 220, rating: 5 },
  { id: "v5", date: "3 Sep 2025", service: "Cut & blow-dry", staff: "Leo Martins", price: 85, rating: 3, note: "Fringe too short." },
  { id: "v6", date: "12 Jul 2025", service: "Olaplex treatment", staff: "Mia Okafor", price: 60, rating: null },
]
const FORMULAS = [
  { label: "Root", value: "6.0 + 6.1 (1:1) · 20 vol · 35 min" },
  { label: "Lengths", value: "Blondme lifting + 7 vol · 45 min" },
  { label: "Gloss", value: "9N + 9V (2:1) · 10 min" },
]
const INITIAL_TAGS = ["VIP", "Prefers Ana", "Sensitive scalp"]
const MONTHS = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb"]
const SPEND = [60, 0, 85, 220, 0, 120, 85, 240]

/* ---------- Block ---------- */

export default function ClientProfile() {
  const [tags, setTags] = React.useState(INITIAL_TAGS)
  const [newTag, setNewTag] = React.useState("")
  const [addingTag, setAddingTag] = React.useState(false)
  const [notes, setNotes] = React.useState<{ id: string; text: string; when: string }[]>([
    { id: "n1", text: "Allergic to PPD, patch test done 12 Jul 2025.", when: "Jul 2025" },
    { id: "n2", text: "Getting married in June, wants a trial up-do in May.", when: "Feb 2026" },
  ])
  const [noteDraft, setNoteDraft] = React.useState("")
  const [removed, setRemoved] = React.useState<{ id: string; text: string; when: string; index: number } | null>(null)
  const [copied, setCopied] = React.useState<string | null>(null)
  const [booked, setBooked] = React.useState(false)
  const [messageOpen, setMessageOpen] = React.useState(false)
  const [message, setMessage] = React.useState("Hi Maya, it's been a few weeks since your balayage. Ready for a gloss refresh? Reply and I'll find you a slot.")
  const [sent, setSent] = React.useState(false)

  const total = VISITS.reduce((s, v) => s + v.price, 0)
  const avg = Math.round(total / VISITS.length)
  const rated = VISITS.filter((v) => v.rating !== null)
  const avgRating = rated.reduce((s, v) => s + (v.rating ?? 0), 0) / rated.length
  const max = Math.max(...SPEND)

  const copy = (what: string, value: string) => {
    void navigator.clipboard?.writeText(value)
    setCopied(what)
    window.setTimeout(() => setCopied(null), 1500)
  }
  const addTag = () => {
    const t = newTag.trim()
    if (!t || tags.includes(t)) return
    setTags([...tags, t])
    setNewTag("")
    setAddingTag(false)
  }
  const addNote = () => {
    const t = noteDraft.trim()
    if (!t) return
    setNotes([{ id: `n${Date.now()}`, text: t, when: "Just now" }, ...notes])
    setNoteDraft("")
  }
  const removeNote = (id: string) => {
    const index = notes.findIndex((n) => n.id === id)
    const n = notes[index]
    if (!n) return
    setRemoved({ ...n, index })
    setNotes(notes.filter((x) => x.id !== id))
    window.setTimeout(() => setRemoved((r) => (r?.id === id ? null : r)), 6000)
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[320px_1fr]">
        {/* Identity card */}
        <aside className="relative overflow-hidden rounded-2xl border bg-card shadow-xs">
          <div className="h-24 bg-[linear-gradient(120deg,var(--chart-1),var(--chart-4))] opacity-80" />
          <div className="-mt-10 px-5 pb-5">
            <Avatar name="Maya Chen" size="2xl" ring="solid" tone="primary" className="bg-card" />
            <div className="mt-3 flex items-start justify-between gap-2">
              <div>
                <h2 className="font-heading text-xl font-semibold tracking-tight">Maya Chen</h2>
                <p className="text-sm text-muted-foreground">Client since Jul 2025 · she/her</p>
              </div>
              <Badge variant="gradient" tone="warning" size="sm" icon={<Crown />}>
                VIP
              </Badge>
            </div>

            <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-muted/60 p-2">
                <dt className="text-[11px] text-muted-foreground">Visits</dt>
                <dd className="text-lg font-semibold tabular-nums">{VISITS.length}</dd>
              </div>
              <div className="rounded-xl bg-muted/60 p-2">
                <dt className="text-[11px] text-muted-foreground">Lifetime</dt>
                <dd className="text-lg font-semibold tabular-nums">
                  <NumberFlow value={total} prefix="$" />
                </dd>
              </div>
              <div className="rounded-xl bg-muted/60 p-2">
                <dt className="text-[11px] text-muted-foreground">Avg. ticket</dt>
                <dd className="text-lg font-semibold tabular-nums">${avg}</dd>
              </div>
            </dl>

            <div className="mt-4 space-y-1.5 text-sm">
              <ContactRow icon={<Phone />} value="+1 (415) 555-0142" onCopy={() => copy("phone", "+14155550142")} copied={copied === "phone"} />
              <ContactRow icon={<Mail />} value="maya.chen@example.com" onCopy={() => copy("email", "maya.chen@example.com")} copied={copied === "email"} />
            </div>

            <div className="mt-4">
              <div className="mb-1.5 text-xs font-medium text-muted-foreground">Tags</div>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <Badge key={t} variant="soft" tone={t === "VIP" ? "warning" : "neutral"} size="sm" removable onRemove={() => setTags(tags.filter((x) => x !== t))}>
                    {t}
                  </Badge>
                ))}
                {addingTag ? (
                  <form
                    className="flex items-center gap-1"
                    onSubmit={(e) => {
                      e.preventDefault()
                      addTag()
                    }}
                  >
                    <Input size="sm" label="New tag" labelMode="none" value={newTag} onValueChange={setNewTag} placeholder="Tag name" autoFocus className="w-32" />
                    <Button size="sm" type="submit" iconOnly aria-label="Add tag">
                      <Check />
                    </Button>
                  </form>
                ) : (
                  <Button size="xs" variant="dashed" tone="neutral" shape="pill" iconLeft={<Plus />} onClick={() => setAddingTag(true)}>
                    Add
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button size="sm" iconLeft={booked ? <Check /> : <CalendarPlus />} tone={booked ? "success" : "primary"} variant={booked ? "soft" : "solid"} onClick={() => setBooked(true)} disabled={booked}>
                {booked ? "Booked Sat" : "Book"}
              </Button>
              <Button size="sm" variant="outline" tone="neutral" iconLeft={<MessageSquare />} onClick={() => setMessageOpen(true)}>
                Message
              </Button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="min-w-0 space-y-4">
          {/* Spend chart + next */}
          <div className="grid gap-4 md:grid-cols-[1fr_240px]">
            <div className="rounded-2xl border bg-card p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Spend by month</div>
                  <div className="text-xs text-muted-foreground">Last 8 months</div>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <Rating value={Math.round(avgRating * 2) / 2} precision={0.5} readOnly size="sm" />
                  <span className="tabular-nums text-muted-foreground">{avgRating.toFixed(1)}</span>
                </div>
              </div>
              <div className="mt-4 flex h-28 items-end gap-2" role="img" aria-label={`Monthly spend, highest $${max}`}>
                {SPEND.map((v, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                    <div className="flex h-20 w-full items-end">
                      <div
                        className={cn("w-full rounded-md transition-[height] duration-700 motion-reduce:transition-none", v === 0 ? "bg-muted" : "bg-[var(--chart-1)]")}
                        style={{ height: v === 0 ? 4 : `${Math.max(8, (v / max) * 100)}%` }}
                        title={`${MONTHS[i]}: $${v}`}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{MONTHS[i]}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
              <div className="flex items-center gap-2 text-xs font-medium text-primary">
                <Sparkles className="size-3.5" /> Next visit
              </div>
              <div className="mt-2 text-lg font-semibold">Sat 14 Mar · 10:30</div>
              <div className="text-sm text-foreground/70">Gloss refresh with Ana</div>
              <div className="mt-3 flex items-center gap-2 text-xs text-foreground/70">
                <Gift className="size-3.5" /> 1,240 points · $12 reward ready
              </div>
            </div>
          </div>

          <Tabs defaultValue="visits" variant="underline" transition="fade">
            <TabsList aria-label="Client details">
              <TabsTrigger value="visits" icon={<Scissors />} count={VISITS.length}>
                Visits
              </TabsTrigger>
              <TabsTrigger value="notes" icon={<Pencil />} count={notes.length}>
                Notes
              </TabsTrigger>
              <TabsTrigger value="formulas" icon={<Star />}>
                Color formulas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="visits">
              <ol className="relative mt-4 space-y-0 border-l pl-6 ml-2">
                {VISITS.map((v, i) => (
                  <li key={v.id} className="relative pb-5 last:pb-0">
                    <span className={cn("absolute -left-[31px] top-1 flex size-4 items-center justify-center rounded-full border-2 border-card", i === 0 ? "bg-primary" : "bg-muted-foreground/40")} aria-hidden="true" />
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-medium">{v.service}</div>
                        <div className="text-xs text-muted-foreground">
                          {v.date} · with {v.staff}
                        </div>
                        {v.note && <div className="mt-1.5 rounded-lg bg-muted/60 px-2.5 py-1.5 text-xs text-foreground/80">“{v.note}”</div>}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold tabular-nums">${v.price}</div>
                        {v.rating !== null ? <Rating value={v.rating} readOnly size="sm" /> : <span className="text-xs text-muted-foreground">Not rated</span>}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </TabsContent>

            <TabsContent value="notes">
              <div className="mt-4 space-y-3">
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault()
                    addNote()
                  }}
                >
                  <Input label="New note" labelMode="none" placeholder="Add a note the whole team should know…" value={noteDraft} onValueChange={setNoteDraft} fullWidth />
                  <Button type="submit" iconLeft={<Plus />} disabled={!noteDraft.trim()}>
                    Add
                  </Button>
                </form>
                <div aria-live="polite">
                  {removed && (
                    <div className="flex items-center justify-between gap-2 rounded-xl border border-dashed px-3 py-2 text-xs">
                      Note deleted.
                      <Button
                        size="xs"
                        variant="soft"
                        tone="neutral"
                        iconLeft={<Undo2 />}
                        onClick={() => {
                          const next = [...notes]
                          next.splice(removed.index, 0, { id: removed.id, text: removed.text, when: removed.when })
                          setNotes(next)
                          setRemoved(null)
                        }}
                      >
                        Undo
                      </Button>
                    </div>
                  )}
                </div>
                <ul className="space-y-2">
                  {notes.map((n) => (
                    <li key={n.id} className="group flex items-start gap-3 rounded-xl border bg-card p-3">
                      <Pencil className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm">{n.text}</p>
                        <p className="text-xs text-muted-foreground">{n.when}</p>
                      </div>
                      <Button size="xs" variant="ghost" tone="danger" iconOnly aria-label="Delete note" onClick={() => removeNote(n.id)}>
                        <Trash2 />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="formulas">
              <div className="mt-4 overflow-hidden rounded-2xl border bg-card">
                {FORMULAS.map((f, i) => (
                  <div key={f.label} className={cn("flex items-center gap-3 px-4 py-3", i > 0 && "border-t")}>
                    <span className="w-16 text-xs font-medium text-muted-foreground">{f.label}</span>
                    <code className="flex-1 font-mono text-sm">{f.value}</code>
                    <Button size="xs" variant="ghost" tone="neutral" iconOnly aria-label={`Copy ${f.label} formula`} onClick={() => copy(f.label, f.value)}>
                      {copied === f.label ? <Check /> : <Copy />}
                    </Button>
                  </div>
                ))}
                <div className="border-t bg-muted/40 px-4 py-2 text-xs text-muted-foreground">Last used 28 Feb 2026 by Ana Petrova</div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog
        open={messageOpen}
        onOpenChange={(o) => {
          setMessageOpen(o)
          if (!o) setSent(false)
        }}
        title="Message Maya"
        description="Sent as SMS to +1 (415) 555-0142."
        icon={<MessageSquare />}
        mobile="sheet"
        onConfirm={async () => {
          await new Promise((r) => setTimeout(r, 600))
          setSent(true)
        }}
        confirmText={sent ? "Sent" : "Send SMS"}
        closeOnConfirm={false}
      >
        <Input multiline rows={4} label="Message" labelMode="none" value={message} onValueChange={setMessage} showCount maxLength={320} fullWidth />
        {sent && (
          <div role="status" className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-300">
            <Check className="size-4" /> Delivered just now.
          </div>
        )}
      </Dialog>
    </div>
  )
}

function ContactRow({ icon, value, onCopy, copied }: { icon: React.ReactNode; value: string; onCopy: () => void; copied: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground [&_svg]:size-4">{icon}</span>
      <span className="min-w-0 flex-1 truncate">{value}</span>
      <Button size="xs" variant="ghost" tone="neutral" iconOnly aria-label={copied ? "Copied" : `Copy ${value}`} onClick={onCopy}>
        {copied ? <Check /> : <Copy />}
      </Button>
    </div>
  )
}

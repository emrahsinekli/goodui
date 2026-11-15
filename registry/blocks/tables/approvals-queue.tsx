"use client"

import * as React from "react"
import { CalendarClock, Check, CircleDollarSign, Inbox, Percent, Undo2, X, type LucideIcon } from "lucide-react"
import { Avatar } from "@/registry/components/core/avatar"
import { Button } from "@/registry/components/core/button"
import { Kbd } from "@/registry/components/core/kbd"
import { cn } from "@/lib/utils"

/* ---------- Demo data ---------- */

type Kind = "timeoff" | "refund" | "discount" | "schedule"
type Request = { id: string; kind: Kind; who: string; title: string; detail: string; amount?: string; when: string; urgent?: boolean; status: "pending" | "approved" | "rejected"; reason?: string }

const KIND: Record<Kind, { label: string; icon: LucideIcon; cls: string }> = {
  timeoff: { label: "Time off", icon: CalendarClock, cls: "bg-sky-500/12 text-sky-700 dark:text-sky-300" },
  refund: { label: "Refund", icon: CircleDollarSign, cls: "bg-rose-500/12 text-rose-700 dark:text-rose-300" },
  discount: { label: "Discount", icon: Percent, cls: "bg-amber-500/12 text-amber-800 dark:text-amber-300" },
  schedule: { label: "Schedule change", icon: CalendarClock, cls: "bg-violet-500/12 text-violet-700 dark:text-violet-300" },
}

const REQUESTS: Request[] = [
  { id: "r1", kind: "refund", who: "Priya Shah", title: "Refund Aisha Khan in full", detail: "Color came out uneven, she's a 5-year client. Offered a redo but she'd rather have the money back.", amount: "$185.00", when: "12 min ago", urgent: true, status: "pending" },
  { id: "r2", kind: "timeoff", who: "Omar Haddad", title: "Nov 14–16 off", detail: "Brother's wedding in Austin. Diego can cover Saturday, Friday needs a walk-in only sign.", when: "1 hour ago", status: "pending" },
  { id: "r3", kind: "discount", who: "Lena Park", title: "20% off for the Pilates Loft team", detail: "They're sending 8 people for gel manicures on Nov 9. Normal group discount is 10%.", amount: "−$96.00", when: "2 hours ago", status: "pending" },
  { id: "r4", kind: "schedule", who: "Jonas Weber", title: "Switch to Tue–Sat from December", detail: "Wants Mondays off to study. Monday is our quietest day, Saturday coverage improves.", when: "Yesterday", status: "pending" },
  { id: "r5", kind: "refund", who: "Diego Ramos", title: "Partial refund for Noah Fischer", detail: "Waited 35 minutes past his slot. Suggesting 30% back as goodwill.", amount: "$13.50", when: "Yesterday", status: "pending" },
  { id: "r6", kind: "timeoff", who: "Maya Okafor", title: "Dec 23–27 off", detail: "Holiday travel. Booked out until the 22nd, no clients affected.", when: "2 days ago", status: "pending" },
]

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background"

/* ---------- Block ---------- */

export default function ApprovalsQueue() {
  const [items, setItems] = React.useState(REQUESTS)
  const [cursor, setCursor] = React.useState(0)
  const [rejecting, setRejecting] = React.useState<string | null>(null)
  const [reason, setReason] = React.useState("")
  const [reasonErr, setReasonErr] = React.useState(false)
  const [tab, setTab] = React.useState<"pending" | "done">("pending")
  const [announce, setAnnounce] = React.useState("")
  const listRef = React.useRef<HTMLUListElement>(null)
  const reasonRef = React.useRef<HTMLTextAreaElement>(null)

  const pending = items.filter((i) => i.status === "pending")
  const done = items.filter((i) => i.status !== "pending")
  const shown = tab === "pending" ? pending : done
  const current = shown[Math.min(cursor, Math.max(0, shown.length - 1))]

  React.useEffect(() => {
    if (cursor > shown.length - 1) setCursor(Math.max(0, shown.length - 1))
  }, [shown.length, cursor])

  const decide = (id: string, status: "approved" | "rejected", why?: string) => {
    const r = items.find((i) => i.id === id)
    setItems((l) => l.map((i) => (i.id === id ? { ...i, status, reason: why } : i)))
    setRejecting(null)
    setReason("")
    setAnnounce(`${status === "approved" ? "Approved" : "Rejected"}: ${r?.title ?? ""}`)
  }
  const undo = (id: string) => {
    setItems((l) => l.map((i) => (i.id === id ? { ...i, status: "pending", reason: undefined } : i)))
    setAnnounce("Moved back to pending.")
  }
  const startReject = (id: string) => {
    setRejecting(id)
    setReason("")
    setReasonErr(false)
    requestAnimationFrame(() => reasonRef.current?.focus())
  }
  const confirmReject = (id: string) => {
    if (reason.trim().length < 3) {
      setReasonErr(true)
      reasonRef.current?.focus()
      return
    }
    decide(id, "rejected", reason.trim())
  }

  // j / k move, a approves, r rejects, Enter opens the focused card, Esc cancels a rejection.
  const onKey = (e: React.KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName
    if (tag === "TEXTAREA" || tag === "INPUT") {
      if (e.key === "Escape") setRejecting(null)
      return
    }
    if (e.key === "j" || e.key === "ArrowDown") {
      e.preventDefault()
      setCursor((c) => Math.min(shown.length - 1, c + 1))
    } else if (e.key === "k" || e.key === "ArrowUp") {
      e.preventDefault()
      setCursor((c) => Math.max(0, c - 1))
    } else if (e.key === "a" && current && tab === "pending") {
      decide(current.id, "approved")
    } else if (e.key === "r" && current && tab === "pending") {
      startReject(current.id)
    } else if (e.key === "Escape") {
      setRejecting(null)
    }
  }
  React.useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${cursor}"]`)
    if (el && listRef.current?.contains(document.activeElement)) el.focus()
  }, [cursor])

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Approvals</h2>
            <p className="text-sm text-muted-foreground">
              {pending.length} waiting for you · {pending.filter((p) => p.urgent).length} urgent
            </p>
          </div>
          <div className="hidden items-center gap-2 text-[11px] text-muted-foreground sm:flex">
            <Kbd keys="j" size="xs" /> <Kbd keys="k" size="xs" /> move
            <Kbd keys="a" size="xs" className="ml-2" /> approve
            <Kbd keys="r" size="xs" className="ml-2" /> reject
          </div>
        </div>

        <div role="tablist" aria-label="Queue" className="flex gap-1 border-b">
          {(
            [
              ["pending", `Pending · ${pending.length}`],
              ["done", `Done · ${done.length}`],
            ] as const
          ).map(([k, label]) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => { setTab(k); setCursor(0) }} className={cn("-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors", tab === k ? "border-foreground text-foreground" : "border-transparent text-foreground/70 hover:text-foreground", ring)}>
              {label}
            </button>
          ))}
        </div>

        <p className="sr-only" aria-live="polite">
          {announce}
        </p>

        {shown.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-14 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-700 dark:text-emerald-300">
              <Inbox className="size-6" aria-hidden="true" />
            </span>
            <p className="text-sm font-medium">{tab === "pending" ? "Inbox zero. Nice." : "Nothing decided yet."}</p>
            <p className="text-xs text-muted-foreground">{tab === "pending" ? "New requests from your team will show up here." : "Approve or reject something and it lands here."}</p>
          </div>
        ) : (
          <ul ref={listRef} onKeyDown={onKey} className="flex flex-col gap-2" aria-label={tab === "pending" ? "Pending requests" : "Decided requests"}>
            {shown.map((r, i) => {
              const k = KIND[r.kind]
              const active = i === cursor
              const isRejecting = rejecting === r.id
              return (
                <li
                  key={r.id}
                  data-idx={i}
                  tabIndex={active ? 0 : -1}
                  onFocus={() => setCursor(i)}
                  onClick={() => setCursor(i)}
                  className={cn("rounded-2xl border bg-card p-4 transition-[box-shadow,border-color]", active && "border-primary/50 shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary)_12%,transparent)]", r.status !== "pending" && "opacity-90", ring)}
                >
                  <div className="flex gap-3">
                    <Avatar name={r.who} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-sm font-semibold">{r.who}</span>
                        <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium", k.cls)}>
                          <k.icon className="size-3" aria-hidden="true" />
                          {k.label}
                        </span>
                        {r.urgent && r.status === "pending" && <span className="rounded-md bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">Urgent</span>}
                        <span className="ml-auto text-[11px] text-muted-foreground">{r.when}</span>
                      </div>
                      <p className="mt-1 text-sm font-medium">
                        {r.title}
                        {r.amount && <span className="ml-2 font-semibold tabular-nums">{r.amount}</span>}
                      </p>
                      <p className="mt-0.5 text-[13px] text-muted-foreground">{r.detail}</p>

                      {r.status === "pending" && !isRejecting && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button size="sm" tone="success" iconLeft={<Check />} onClick={() => decide(r.id, "approved")}>
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" tone="neutral" iconLeft={<X />} onClick={() => startReject(r.id)}>
                            Reject
                          </Button>
                        </div>
                      )}
                      {isRejecting && (
                        <div className="mt-3 rounded-xl border bg-background p-3 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1">
                          <label htmlFor={`reason-${r.id}`} className="text-xs font-medium">
                            Tell {r.who.split(" ")[0]} why
                          </label>
                          <textarea
                            id={`reason-${r.id}`}
                            ref={reasonRef}
                            value={reason}
                            onChange={(e) => {
                              setReason(e.target.value)
                              setReasonErr(false)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) confirmReject(r.id)
                            }}
                            rows={2}
                            aria-invalid={reasonErr}
                            aria-describedby={reasonErr ? `reason-err-${r.id}` : undefined}
                            placeholder="e.g. Let's offer a free redo first"
                            className={cn("mt-1.5 w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm", reasonErr && "border-rose-500", ring)}
                          />
                          {reasonErr && (
                            <p id={`reason-err-${r.id}`} className="text-xs text-rose-700 dark:text-rose-300">
                              A reason is required so the team learns from it.
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Button size="sm" tone="danger" iconLeft={<X />} onClick={() => confirmReject(r.id)}>
                              Reject with reason
                            </Button>
                            <Button size="sm" variant="ghost" tone="neutral" onClick={() => setRejecting(null)}>
                              Cancel
                            </Button>
                            <span className="ml-auto hidden text-[11px] text-muted-foreground sm:inline">
                              <Kbd keys={["mod", "enter"]} size="xs" /> to send
                            </span>
                          </div>
                        </div>
                      )}
                      {r.status !== "pending" && (
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                          <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium", r.status === "approved" ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300" : "bg-rose-500/12 text-rose-700 dark:text-rose-300")}>
                            {r.status === "approved" ? <Check className="size-3" aria-hidden="true" /> : <X className="size-3" aria-hidden="true" />}
                            {r.status === "approved" ? "Approved" : "Rejected"}
                          </span>
                          {r.reason && <span className="text-muted-foreground">“{r.reason}”</span>}
                          <Button size="xs" variant="ghost" tone="neutral" iconLeft={<Undo2 />} onClick={() => undo(r.id)} className="ml-auto">
                            Undo
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

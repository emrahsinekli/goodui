"use client"

import * as React from "react"
import { Check, Copy, Download, Gift, Mail, RotateCcw, Send, Sparkles } from "lucide-react"
import { Button } from "@/registry/components/core/button"
import { Input } from "@/registry/components/core/input"
import { SuccessCheck } from "@/registry/components/feedback/success-check"
import { NumberFlow } from "@/registry/components/numbers/number-flow"
import { cn } from "@/lib/utils"

/* ---------- Demo data ---------- */

const AMOUNTS = [25, 50, 75, 100, 150, 200]
const DESIGNS = [
  { id: "sunset", label: "Sunset", bg: "bg-[linear-gradient(135deg,#f97316,#db2777_60%,#7c3aed)]" },
  { id: "mint", label: "Mint", bg: "bg-[linear-gradient(135deg,#10b981,#06b6d4_60%,#3b82f6)]" },
  { id: "noir", label: "Noir", bg: "bg-[linear-gradient(135deg,#111827,#374151_60%,#6b7280)]" },
  { id: "blush", label: "Blush", bg: "bg-[linear-gradient(135deg,#fda4af,#f472b6_60%,#c084fc)]" },
  { id: "gold", label: "Gold", bg: "bg-[linear-gradient(135deg,#fbbf24,#f59e0b_60%,#b45309)]" },
]
const OCCASIONS = ["Birthday", "Thank you", "Just because", "Congratulations", "Mother's Day"]

type Errors = Partial<Record<"amount" | "to" | "email" | "from", string>>

/* ---------- Block ---------- */

export default function GiftCardIssue() {
  const [amount, setAmount] = React.useState<number | null>(100)
  const [custom, setCustom] = React.useState("")
  const [design, setDesign] = React.useState(DESIGNS[0]!.id)
  const [occasion, setOccasion] = React.useState("Birthday")
  const [to, setTo] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [from, setFrom] = React.useState("")
  const [message, setMessage] = React.useState("")
  const [delivery, setDelivery] = React.useState<"now" | "schedule">("now")
  const [date, setDate] = React.useState("2026-03-20")
  const [errors, setErrors] = React.useState<Errors>({})
  const [flipped, setFlipped] = React.useState(false)
  const [issuing, setIssuing] = React.useState(false)
  const [issued, setIssued] = React.useState<{ code: string } | null>(null)
  const [copied, setCopied] = React.useState(false)
  const [resent, setResent] = React.useState(false)

  const value = amount ?? (Number(custom) || 0)
  const d = DESIGNS.find((x) => x.id === design) ?? DESIGNS[0]!

  const validate = () => {
    const e: Errors = {}
    if (!value || value < 10) e.amount = "Minimum gift card is $10."
    if (value > 1000) e.amount = "Maximum gift card is $1,000."
    if (!to.trim()) e.to = "Who is it for?"
    if (!/^\S+@\S+\.\S+$/.test(email)) e.email = "Enter a valid email."
    if (!from.trim()) e.from = "Add your name so they know who sent it."
    setErrors(e)
    return Object.keys(e).length === 0
  }
  const issue = async () => {
    if (!validate()) return
    setIssuing(true)
    await new Promise((r) => setTimeout(r, 900))
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    let code = ""
    for (let i = 0; i < 12; i++) code += chars[Math.floor(Math.random() * chars.length)]
    setIssued({ code: code.replace(/(.{4})/g, "$1-").slice(0, -1) })
    setIssuing(false)
    setFlipped(true)
  }
  const copy = () => {
    if (!issued) return
    void navigator.clipboard?.writeText(issued.code)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }
  const download = () => {
    if (!issued) return
    const html = `<div style="font-family:system-ui;padding:40px"><h1>Studio Nine gift card</h1><p>For ${to} from ${from}</p><h2>$${value}</h2><p>Code: <b>${issued.code}</b></p><p>${message}</p></div>`
    const url = URL.createObjectURL(new Blob([html], { type: "text/html" }))
    const a = document.createElement("a")
    a.href = url
    a.download = `gift-card-${issued.code}.html`
    a.click()
    URL.revokeObjectURL(url)
  }
  const reset = () => {
    setIssued(null)
    setFlipped(false)
    setResent(false)
    setTo("")
    setEmail("")
    setFrom("")
    setMessage("")
    setErrors({})
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_400px]">
        {/* Form */}
        <div className="space-y-6">
          <div>
            <h2 className="font-heading text-xl font-semibold tracking-tight">Issue a gift card</h2>
            <p className="text-sm text-muted-foreground">Sold at the desk or sent by email. The code works online and in store.</p>
          </div>

          <fieldset>
            <legend className="text-sm font-medium">Amount</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {AMOUNTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  aria-pressed={amount === a}
                  onClick={() => {
                    setAmount(a)
                    setCustom("")
                  }}
                  className={cn("rounded-xl border px-4 py-2 text-sm font-semibold tabular-nums transition-all", amount === a ? "border-primary bg-primary text-primary-foreground shadow-md" : "hover:border-foreground/40")}
                >
                  ${a}
                </button>
              ))}
              <Input
                size="md"
                aria-label="Custom amount"
                placeholder="Custom"
                inputMode="numeric"
                leading={<span className="text-muted-foreground">$</span>}
                value={custom}
                onValueChange={(v) => {
                  setCustom(v.replace(/\D/g, ""))
                  setAmount(null)
                }}
                className="w-32"
                state={errors.amount ? "error" : "default"}
              />
            </div>
            {errors.amount && (
              <p role="alert" className="mt-1.5 text-xs text-rose-800 dark:text-rose-400">
                {errors.amount}
              </p>
            )}
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium">Design</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {DESIGNS.map((x) => (
                <button key={x.id} type="button" aria-label={`${x.label} design`} aria-pressed={design === x.id} onClick={() => setDesign(x.id)} className={cn("h-10 w-16 rounded-lg ring-2 ring-offset-2 ring-offset-background transition-transform hover:scale-105", x.bg, design === x.id ? "ring-foreground" : "ring-transparent")} />
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium">Occasion</legend>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {OCCASIONS.map((o) => (
                <button key={o} type="button" aria-pressed={occasion === o} onClick={() => setOccasion(o)} className={cn("rounded-full border px-3 py-1 text-xs font-medium transition-colors", occasion === o ? "border-foreground bg-foreground text-background" : "text-foreground/70 hover:text-foreground")}>
                  {o}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Recipient name" value={to} onValueChange={setTo} placeholder="Maya Chen" state={errors.to ? "error" : "default"} message={errors.to} fullWidth />
            <Input label="Recipient email" type="email" value={email} onValueChange={setEmail} placeholder="maya@example.com" state={errors.email ? "error" : "default"} message={errors.email} fullWidth />
            <Input label="From" value={from} onValueChange={setFrom} placeholder="Your name" state={errors.from ? "error" : "default"} message={errors.from} fullWidth />
            <div>
              <div className="mb-1.5 text-sm font-medium">Delivery</div>
              <div className="flex rounded-lg bg-muted p-0.5 text-sm">
                {(
                  [
                    ["now", "Send now"],
                    ["schedule", "Schedule"],
                  ] as const
                ).map(([k, l]) => (
                  <button key={k} type="button" aria-pressed={delivery === k} onClick={() => setDelivery(k)} className={cn("flex-1 rounded-md py-1.5 font-medium transition-colors", delivery === k ? "bg-background shadow-xs" : "text-foreground/70")}>
                    {l}
                  </button>
                ))}
              </div>
              {delivery === "schedule" && <Input type="date" label="Delivery date" labelMode="none" value={date} onValueChange={setDate} size="sm" className="mt-2" fullWidth />}
            </div>
          </div>
          <Input label="Message (optional)" multiline rows={2} value={message} onValueChange={setMessage} placeholder="Happy birthday! Treat yourself." showCount maxLength={160} fullWidth />

          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg" iconLeft={<Gift />} animation="lift" shadow="glow" loading={issuing} onClick={issue} disabled={!!issued}>
              Issue ${value || 0} gift card
            </Button>
            {issued && (
              <Button size="lg" variant="ghost" tone="neutral" iconLeft={<RotateCcw />} onClick={reset}>
                Issue another
              </Button>
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="text-xs font-medium text-muted-foreground">Preview · tap the card to flip</div>
          <button type="button" aria-label={flipped ? "Show front of card" : "Show back of card"} onClick={() => setFlipped((f) => !f)} className="mt-2 block w-full [perspective:1200px] outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl">
            <div className={cn("relative aspect-[1.6/1] w-full transition-transform duration-700 [transform-style:preserve-3d] motion-reduce:transition-none", flipped && "[transform:rotateY(180deg)]")}>
              {/* Front */}
              <div className={cn("absolute inset-0 overflow-hidden rounded-2xl p-5 text-left text-white shadow-xl [backface-visibility:hidden]", d.bg)}>
                <div className="absolute -right-10 -top-10 size-40 rounded-full bg-white/15" aria-hidden="true" />
                <div className="absolute -bottom-16 -left-6 size-44 rounded-full bg-black/10" aria-hidden="true" />
                <div className="relative flex h-full flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-sm font-semibold">
                      <Sparkles className="size-4" /> Studio Nine
                    </span>
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-medium backdrop-blur">{occasion}</span>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-widest opacity-80">Gift card</div>
                    <div className="text-4xl font-semibold tabular-nums">
                      <NumberFlow value={value} prefix="$" />
                    </div>
                  </div>
                  <div className="flex items-end justify-between text-xs">
                    <span className="opacity-90">For {to || "someone lovely"}</span>
                    <span className="opacity-90">From {from || "you"}</span>
                  </div>
                </div>
              </div>
              {/* Back */}
              <div className="absolute inset-0 flex flex-col justify-between rounded-2xl border bg-card p-5 text-left shadow-xl [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Redeem code</div>
                  <div className="mt-1 font-mono text-lg font-semibold tracking-wider tabular-nums">{issued ? issued.code : "XXXX-XXXX-XXXX"}</div>
                </div>
                <p className="text-xs text-muted-foreground">{message || "Your message appears here."}</p>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Valid 5 years · no fees</span>
                  <span>studionine.com/gift</span>
                </div>
              </div>
            </div>
          </button>

          <div aria-live="polite" className="mt-4">
            {issued && (
              <div className="rounded-2xl border bg-card p-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <SuccessCheck size={40} burst={false} label="Gift card issued" />
                  <div>
                    <div className="text-sm font-medium">Issued and {delivery === "now" ? "emailed" : `scheduled for ${date}`}</div>
                    <div className="text-xs text-muted-foreground">
                      <Mail className="mr-1 inline size-3" />
                      {email}
                    </div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <Button size="sm" variant="outline" tone="neutral" iconLeft={copied ? <Check /> : <Copy />} onClick={copy}>
                    {copied ? "Copied" : "Copy"}
                  </Button>
                  <Button size="sm" variant="outline" tone="neutral" iconLeft={<Download />} onClick={download}>
                    Save
                  </Button>
                  <Button size="sm" variant="outline" tone={resent ? "success" : "neutral"} iconLeft={resent ? <Check /> : <Send />} onClick={() => setResent(true)} disabled={resent}>
                    {resent ? "Resent" : "Resend"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

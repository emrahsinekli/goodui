"use client"

import * as React from "react"
import { Check, ExternalLink, Hash, Pencil, RefreshCw } from "lucide-react"
import { Button } from "@/registry/components/core/button"
import { Input } from "@/registry/components/core/input"
import { CircularProgress } from "@/registry/components/numbers/circular-progress"
import { OtpInput } from "@/registry/components/inputs/otp-input"
import { cn } from "@/lib/utils"

const RESEND_SECONDS = 45
const EXPIRES_SECONDS = 15 * 60
const DEMO_CODE = "519204"

function Envelope({ opened }: { opened: boolean }) {
  return (
    <svg viewBox="0 0 160 120" className="h-32 w-44" aria-hidden="true">
      <defs>
        <linearGradient id="ml-env" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="var(--chart-1)" />
          <stop offset="1" stopColor="var(--chart-4)" />
        </linearGradient>
      </defs>
      <ellipse cx="80" cy="108" rx="56" ry="6" fill="currentColor" opacity="0.08" />
      <rect x="28" y="40" width="104" height="64" rx="8" fill="url(#ml-env)" />
      {/* letter */}
      <g className="transition-transform duration-700 ease-out motion-reduce:transition-none" style={{ transform: opened ? "translateY(-26px)" : "translateY(0)" }}>
        <rect x="42" y="30" width="76" height="60" rx="6" fill="white" stroke="currentColor" strokeOpacity="0.1" />
        <rect x="52" y="44" width="40" height="4" rx="2" fill="currentColor" opacity="0.25" />
        <rect x="52" y="54" width="56" height="4" rx="2" fill="currentColor" opacity="0.15" />
        <rect x="52" y="64" width="30" height="4" rx="2" fill="currentColor" opacity="0.15" />
        <rect x="52" y="74" width="24" height="8" rx="4" fill="var(--chart-2)" />
      </g>
      <path d="M28 48v48a8 8 0 0 0 8 8h88a8 8 0 0 0 8-8V48L80 84Z" fill="url(#ml-env)" />
      <path d="M28 48 80 84l52-36" fill="none" stroke="white" strokeOpacity="0.35" strokeWidth="2" />
      <path d="M28 100 68 76M132 100 92 76" stroke="white" strokeOpacity="0.25" strokeWidth="2" />
      {/* badge */}
      <g className="motion-safe:animate-[ml-float_3s_ease-in-out_infinite]">
        <circle cx="128" cy="34" r="13" fill="var(--chart-2)" />
        <path d="M121 34l5 5 9-10" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <style>{`@keyframes ml-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}`}</style>
    </svg>
  )
}

const MAIL_APPS = [
  { id: "gmail", label: "Open Gmail", host: "mail.google.com" },
  { id: "outlook", label: "Open Outlook", host: "outlook.live.com" },
  { id: "apple", label: "Open Mail", host: "message://" },
]

export default function MagicLinkSent() {
  const [email, setEmail] = React.useState("mira@novasalon.co")
  const [draft, setDraft] = React.useState(email)
  const [editing, setEditing] = React.useState(false)
  const [editError, setEditError] = React.useState<string | null>(null)
  const [cooldown, setCooldown] = React.useState(RESEND_SECONDS)
  const [expires, setExpires] = React.useState(EXPIRES_SECONDS)
  const [sends, setSends] = React.useState(1)
  const [opening, setOpening] = React.useState<string | null>(null)
  const [codeMode, setCodeMode] = React.useState(false)
  const [otpStatus, setOtpStatus] = React.useState<"idle" | "verifying" | "success" | "error">("idle")
  const [signedIn, setSignedIn] = React.useState(false)

  React.useEffect(() => {
    if (signedIn) return
    const id = setInterval(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0))
      setExpires((e) => (e > 0 ? e - 1 : 0))
    }, 1000)
    return () => clearInterval(id)
  }, [signedIn])

  const resend = () => {
    setCooldown(RESEND_SECONDS)
    setExpires(EXPIRES_SECONDS)
    setSends((n) => n + 1)
  }

  const saveEmail = (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(draft)) return setEditError("Enter a valid email")
    setEditError(null)
    setEmail(draft)
    setEditing(false)
    resend()
  }

  const openApp = (id: string) => {
    setOpening(id)
    setTimeout(() => setOpening(null), 1400)
  }

  const verify = (value: string) =>
    new Promise<boolean>((resolve) => {
      setOtpStatus("verifying")
      setTimeout(() => {
        const ok = value === DEMO_CODE
        setOtpStatus(ok ? "success" : "error")
        if (ok) setTimeout(() => setSignedIn(true), 500)
        resolve(ok)
      }, 800)
    })

  const domain = email.split("@")[1] ?? ""
  const expMm = Math.floor(expires / 60)
  const expSs = String(expires % 60).padStart(2, "0")

  if (signedIn) {
    return (
      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-md rounded-3xl border bg-card p-8 text-center shadow-sm">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500 text-white motion-safe:animate-in motion-safe:zoom-in-50">
            <Check className="size-7" />
          </span>
          <h2 className="mt-4 font-heading text-2xl font-semibold tracking-tight">You are signed in</h2>
          <p className="mt-1 text-sm text-muted-foreground">Welcome back, {email}.</p>
          <Button className="mt-5" variant="outline" tone="neutral" onClick={() => { setSignedIn(false); setCodeMode(false); setOtpStatus("idle"); resend() }}>
            Start over
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-md">
        <div className="relative overflow-hidden rounded-3xl border bg-card p-6 text-center shadow-sm md:p-8">
          <div className="pointer-events-none absolute -top-20 left-1/2 size-64 -translate-x-1/2 rounded-full bg-[var(--chart-4)]/10 blur-3xl" aria-hidden="true" />
          <div className="relative flex justify-center text-foreground">
            <Envelope opened={sends > 1 || cooldown < RESEND_SECONDS - 3} />
          </div>
          <h2 className="relative mt-2 font-heading text-2xl font-semibold tracking-tight">Check your email</h2>
          <p className="relative mt-1 text-sm text-muted-foreground">
            We sent a sign-in link to
            {editing ? null : (
              <>
                {" "}
                <span className="font-medium text-foreground">{email}</span>
              </>
            )}
            . It works once and expires in {expMm}:{expSs}.
          </p>

          {editing ? (
            <form onSubmit={saveEmail} className="relative mt-4 flex items-start gap-2" noValidate>
              <Input id="mls-email" type="email" value={draft} onValueChange={(v) => { setDraft(v); setEditError(null) }} aria-label="Email address" state={editError ? "error" : "default"} message={editError} className="flex-1 text-left" autoFocus />
              <Button type="submit" size="md">
                Resend
              </Button>
              <Button type="button" size="md" variant="ghost" tone="neutral" onClick={() => { setEditing(false); setDraft(email) }}>
                Cancel
              </Button>
            </form>
          ) : (
            <button type="button" onClick={() => setEditing(true)} className="relative mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:underline">
              <Pencil className="size-3" /> Wrong address?
            </button>
          )}

          {/* Open mail apps */}
          <div className="relative mt-6 grid gap-2 sm:grid-cols-3">
            {MAIL_APPS.map((m) => (
              <Button key={m.id} variant="outline" tone="neutral" size="md" iconRight={opening === m.id ? undefined : <ExternalLink />} loading={opening === m.id} onClick={() => openApp(m.id)} className={cn(domain.includes("gmail") && m.id === "gmail" && "border-foreground")}>
                {m.label}
              </Button>
            ))}
          </div>

          {/* Resend ring */}
          <div className="relative mt-6 flex items-center justify-center gap-4 rounded-2xl bg-muted/50 p-3">
            <CircularProgress value={RESEND_SECONDS - cooldown} max={RESEND_SECONDS} size={44} strokeWidth={4} label={<span className="text-[11px] font-semibold tabular-nums">{cooldown > 0 ? cooldown : <Check className="size-3.5" />}</span>} indicatorClassName={cooldown > 0 ? "text-primary" : "text-emerald-500"} aria-label="Time until you can resend" />
            <div className="text-left text-sm">
              <p className="font-medium">{cooldown > 0 ? "Did not arrive?" : "Still nothing?"}</p>
              <p className="text-xs text-muted-foreground">
                {cooldown > 0 ? `Check spam, or resend in ${cooldown}s.` : `Sent ${sends} time${sends > 1 ? "s" : ""}. Resend when you are ready.`}
              </p>
            </div>
            <Button size="sm" variant={cooldown > 0 ? "ghost" : "solid"} tone={cooldown > 0 ? "neutral" : "primary"} disabled={cooldown > 0} onClick={resend} iconLeft={<RefreshCw />} className="ml-auto">
              Resend
            </Button>
          </div>

          {/* Code fallback */}
          <div className="relative mt-5">
            {codeMode ? (
              <div className="grid gap-3 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1">
                <p className="text-sm text-muted-foreground">The email also contains a 6-digit code:</p>
                <div className="flex justify-center">
                  <OtpInput length={6} onComplete={verify} status={otpStatus} clearOnError autoFocus groupSize={3} aria-label="Sign-in code" />
                </div>
                <p role="status" aria-live="polite" className={cn("min-h-5 text-xs", otpStatus === "error" ? "text-rose-600 dark:text-rose-400" : otpStatus === "success" ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground")}>
                  {otpStatus === "error" ? "Wrong code. Check the latest email." : otpStatus === "success" ? "Signing you in…" : otpStatus === "verifying" ? "Checking…" : `Demo code: ${DEMO_CODE}`}
                </p>
              </div>
            ) : (
              <button type="button" onClick={() => setCodeMode(true)} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                <Hash className="size-4" /> Enter the code instead
              </button>
            )}
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">Links are tied to this browser. Opening one on your phone starts a new sign-in there.</p>
      </div>
    </div>
  )
}

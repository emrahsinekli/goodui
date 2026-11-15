"use client"

import * as React from "react"
import { ArrowLeft, CheckCircle2, Loader2, MailCheck, RotateCw, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const CORRECT = "424242"
const COOLDOWN = 30
const MAX_ATTEMPTS = 5

function mask(email: string) {
  const [user = "", domain] = email.split("@")
  if (!domain) return email
  return `${user[0]}${"•".repeat(Math.max(2, Math.min(user.length - 1, 6)))}@${domain}`
}

export default function OtpVerify() {
  const [email, setEmail] = React.useState("emma.clarke@northside.studio")
  const [view, setView] = React.useState<"code" | "email" | "done">("code")
  const [code, setCode] = React.useState("")
  const [status, setStatus] = React.useState<"idle" | "checking" | "error">("idle")
  const [attempts, setAttempts] = React.useState(0)
  const [shake, setShake] = React.useState(0)
  const [seconds, setSeconds] = React.useState(COOLDOWN)
  const [sent, setSent] = React.useState<string | null>(null)
  const [draft, setDraft] = React.useState("")
  const [draftError, setDraftError] = React.useState<string | null>(null)

  // Resend countdown
  React.useEffect(() => {
    if (view !== "code" || seconds <= 0) return
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000)
    return () => clearTimeout(id)
  }, [seconds, view])

  const locked = attempts >= MAX_ATTEMPTS

  const verify = (value: string) => {
    if (locked) return
    setStatus("checking")
    setSent(null)
    setTimeout(() => {
      if (value === CORRECT) {
        setView("done")
        setStatus("idle")
        return
      }
      setAttempts((a) => a + 1)
      setStatus("error")
      setShake((n) => n + 1)
      setCode("")
    }, 800)
  }

  const resend = () => {
    setSeconds(COOLDOWN)
    setAttempts(0)
    setCode("")
    setStatus("idle")
    setSent(`New code sent to ${mask(email)}`)
  }

  const changeEmail = (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(draft)) {
      setDraftError("Enter a valid email address")
      return
    }
    if (draft.toLowerCase() === email.toLowerCase()) {
      setDraftError("That's the email we already sent the code to")
      return
    }
    setEmail(draft)
    setView("code")
    setCode("")
    setAttempts(0)
    setStatus("idle")
    setSeconds(COOLDOWN)
    setSent(`Code sent to ${mask(draft)}`)
  }

  const left = MAX_ATTEMPTS - attempts
  const mm = String(Math.floor(seconds / 60)).padStart(1, "0")
  const ss = String(seconds % 60).padStart(2, "0")

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
      <style>{`@keyframes otp-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-10px)}40%{transform:translateX(9px)}60%{transform:translateX(-6px)}80%{transform:translateX(4px)}}`}</style>
      <div className="w-full max-w-md text-center">
        {/* Illustration */}
        <div className="relative mx-auto mb-8 flex size-36 items-center justify-center">
          <span className="absolute inset-0 rounded-full border border-dashed border-border" />
          <span className="absolute inset-4 rounded-full border border-border bg-muted/40" />
          <span className="absolute inset-9 rounded-full bg-gradient-to-b from-primary/20 to-primary/5" />
          <span className={cn("relative flex size-14 items-center justify-center rounded-2xl shadow-lg transition-colors", view === "done" ? "bg-emerald-500 text-white" : status === "error" ? "bg-destructive text-white" : "bg-primary text-primary-foreground")}>
            {view === "done" ? <ShieldCheck className="size-7" /> : <MailCheck className="size-7" />}
          </span>
          <span className="absolute top-3 right-4 size-2.5 rounded-full bg-[var(--chart-2)]" />
          <span className="absolute bottom-6 left-2 size-2 rounded-full bg-[var(--chart-4)]" />
          <span className="absolute top-10 left-1 size-1.5 rounded-full bg-[var(--chart-1)]" />
        </div>

        {view === "code" && (
          <div className="animate-in duration-300 fade-in">
            <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We sent a 6-digit code to <span className="font-medium text-foreground">{mask(email)}</span>.<br />Enter it below to confirm it's you.
            </p>

            <div key={shake} className="mt-8 flex justify-center" style={shake ? { animation: "otp-shake 0.45s ease-in-out" } : undefined}>
              <InputOTP
                maxLength={6}
                value={code}
                pattern="^[0-9]+$"
                inputMode="numeric"
                autoFocus
                disabled={status === "checking" || locked}
                aria-label="Verification code"
                onChange={(v) => {
                  setCode(v)
                  if (status === "error") setStatus("idle")
                }}
                onComplete={verify}
              >
                <InputOTPGroup>
                  {[0, 1, 2].map((i) => <InputOTPSlot key={i} index={i} aria-invalid={status === "error"} className="size-12 text-xl font-semibold sm:size-14" />)}
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  {[3, 4, 5].map((i) => <InputOTPSlot key={i} index={i} aria-invalid={status === "error"} className="size-12 text-xl font-semibold sm:size-14" />)}
                </InputOTPGroup>
              </InputOTP>
            </div>

            <div className="mt-4 min-h-10 text-sm" aria-live="polite">
              {status === "checking" && <span className="inline-flex items-center gap-2 text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Verifying…</span>}
              {status === "error" && !locked && <span className="text-destructive">That code isn't right. {left} attempt{left === 1 ? "" : "s"} left.</span>}
              {locked && <span className="text-destructive">Too many incorrect codes. Request a new one to continue.</span>}
              {status === "idle" && !locked && sent && <span className="text-emerald-600 dark:text-emerald-400">{sent}</span>}
              {status === "idle" && !locked && !sent && <span className="text-muted-foreground">Demo code: <code className="font-mono font-semibold text-foreground">424242</code></span>}
            </div>

            <div className="mt-4 flex flex-col items-center gap-3 border-t pt-6 text-sm">
              <div className="text-muted-foreground">
                Didn't get it?{" "}
                {seconds > 0 && !locked ? (
                  <span>Resend in <span className="font-mono font-medium text-foreground tabular-nums">{mm}:{ss}</span></span>
                ) : (
                  <button type="button" onClick={resend} className="inline-flex items-center gap-1 font-medium text-primary hover:underline"><RotateCw className="size-3.5" /> Resend code</button>
                )}
              </div>
              <button type="button" onClick={() => { setDraft(""); setDraftError(null); setView("email") }} className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                Wrong address? Change email
              </button>
            </div>
          </div>
        )}

        {view === "email" && (
          <form noValidate onSubmit={changeEmail} className="animate-in text-left duration-300 fade-in slide-in-from-bottom-2">
            <h1 className="text-center text-2xl font-semibold tracking-tight">Use a different email</h1>
            <p className="mt-2 text-center text-sm text-muted-foreground">We'll send a fresh code and forget the old one.</p>
            <div className="mt-6 flex flex-col gap-1.5">
              <Label htmlFor="otp-email">Email address</Label>
              <Input id="otp-email" type="email" autoFocus className="h-10" placeholder="you@yourstudio.com" value={draft} aria-invalid={!!draftError} onChange={(e) => { setDraft(e.target.value); setDraftError(null) }} />
              {draftError && <p className="text-xs text-destructive">{draftError}</p>}
            </div>
            <div className="mt-4 flex gap-2">
              <Button type="button" variant="outline" size="lg" onClick={() => setView("code")}><ArrowLeft /> Back</Button>
              <Button type="submit" size="lg" className="flex-1">Send new code</Button>
            </div>
          </form>
        )}

        {view === "done" && (
          <div className="animate-in duration-300 fade-in zoom-in-95">
            <h1 className="inline-flex items-center gap-2 text-2xl font-semibold tracking-tight"><CheckCircle2 className="size-6 text-emerald-600 dark:text-emerald-400" /> Email verified</h1>
            <p className="mt-2 text-sm text-muted-foreground"><span className="font-medium text-foreground">{email}</span> is confirmed. Booking confirmations and receipts will go here.</p>
            <Button size="lg" variant="outline" className="mt-6" onClick={() => { setView("code"); setCode(""); setAttempts(0); setSent(null); setSeconds(COOLDOWN) }}>
              Run the demo again
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

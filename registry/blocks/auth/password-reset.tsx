"use client"

import * as React from "react"
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, KeyRound, Mail, ShieldCheck } from "lucide-react"
import { Button } from "@/registry/components/core/button"
import { Input } from "@/registry/components/core/input"
import { SuccessCheck } from "@/registry/components/feedback/success-check"
import { OtpInput } from "@/registry/components/inputs/otp-input"
import { cn } from "@/lib/utils"

const DEMO_CODE = "482913"
const RESEND_SECONDS = 30
type Step = "request" | "code" | "password" | "done"
const STEPS: Step[] = ["request", "code", "password"]

const RULES = [
  { id: "len", label: "At least 12 characters", test: (p: string) => p.length >= 12 },
  { id: "case", label: "Upper and lower case", test: (p: string) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { id: "num", label: "A number", test: (p: string) => /\d/.test(p) },
  { id: "sym", label: "A symbol", test: (p: string) => /[^\w\s]/.test(p) },
]

function KeyArt({ step }: { step: Step }) {
  return (
    <svg viewBox="0 0 120 120" className="size-24" aria-hidden="true">
      <defs>
        <linearGradient id="pr-g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="var(--chart-1)" />
          <stop offset="1" stopColor="var(--chart-4)" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="54" fill="url(#pr-g)" opacity="0.12" />
      <circle cx="60" cy="60" r="40" fill="url(#pr-g)" opacity="0.18" />
      <g transform="translate(60 60) rotate(-35)" className="transition-transform duration-700 motion-reduce:transition-none" style={{ transform: step === "done" ? "translate(60px,60px) rotate(0deg)" : undefined }}>
        <circle cx="-16" cy="0" r="14" fill="none" stroke="url(#pr-g)" strokeWidth="7" />
        <path d="M-2 0h36M24 0v10M32 0v8" stroke="url(#pr-g)" strokeWidth="7" strokeLinecap="round" fill="none" />
      </g>
      {step === "done" && <circle cx="60" cy="60" r="54" fill="none" stroke="var(--chart-2)" strokeWidth="3" strokeDasharray="340" strokeDashoffset="0" className="motion-safe:animate-[pr-ring_1s_ease-out]" />}
      <style>{`@keyframes pr-ring{from{stroke-dashoffset:340}to{stroke-dashoffset:0}}`}</style>
    </svg>
  )
}

export default function PasswordReset() {
  const [step, setStep] = React.useState<Step>("request")
  const [email, setEmail] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [cooldown, setCooldown] = React.useState(0)
  const [code, setCode] = React.useState("")
  const [otpStatus, setOtpStatus] = React.useState<"idle" | "verifying" | "success" | "error">("idle")
  const [password, setPassword] = React.useState("")
  const [confirm, setConfirm] = React.useState("")
  const [show, setShow] = React.useState(false)

  React.useEffect(() => {
    if (cooldown <= 0) return
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(id)
  }, [cooldown])

  const request = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter the email you signed up with")
    setError(null)
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setCooldown(RESEND_SECONDS)
      setStep("code")
    }, 900)
  }

  const verify = (value: string) =>
    new Promise<boolean>((resolve) => {
      setOtpStatus("verifying")
      setTimeout(() => {
        const ok = value === DEMO_CODE
        setOtpStatus(ok ? "success" : "error")
        if (ok) setTimeout(() => setStep("password"), 500)
        resolve(ok)
      }, 800)
    })

  const passed = RULES.filter((r) => r.test(password)).length
  const savePassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (passed < RULES.length) return setError("Your password does not meet every rule yet")
    if (password !== confirm) return setError("The two passwords do not match")
    setError(null)
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setStep("done")
    }, 900)
  }

  const restart = () => {
    setStep("request")
    setEmail("")
    setCode("")
    setPassword("")
    setConfirm("")
    setOtpStatus("idle")
    setError(null)
  }

  const index = STEPS.indexOf(step)

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-md">
        <div className="relative overflow-hidden rounded-3xl border bg-card p-6 shadow-sm md:p-8">
          <div className="pointer-events-none absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full bg-[var(--chart-1)]/10 blur-3xl" aria-hidden="true" />

          {/* Stepper */}
          <ol className="relative mb-6 flex items-center justify-center gap-2" aria-label="Progress">
            {STEPS.map((s, i) => (
              <React.Fragment key={s}>
                {i > 0 && <span className={cn("h-0.5 w-8 rounded-full transition-colors", i <= index || step === "done" ? "bg-primary" : "bg-border")} aria-hidden="true" />}
                <li aria-current={s === step ? "step" : undefined} className={cn("flex size-7 items-center justify-center rounded-full text-xs font-semibold transition-colors", i < index || step === "done" ? "bg-primary text-primary-foreground" : s === step ? "bg-foreground text-background" : "bg-muted text-muted-foreground")}>
                  {i < index || step === "done" ? <Check className="size-3.5" /> : i + 1}
                  <span className="sr-only">{s}</span>
                </li>
              </React.Fragment>
            ))}
          </ol>

          <div className="relative flex justify-center">
            <KeyArt step={step} />
          </div>

          {step === "request" && (
            <form onSubmit={request} className="relative mt-4 grid gap-4" noValidate>
              <div className="text-center">
                <h2 className="font-heading text-2xl font-semibold tracking-tight">Forgot your password?</h2>
                <p className="mt-1 text-sm text-muted-foreground">No problem. We will email you a 6-digit code to reset it.</p>
              </div>
              <Input id="pr-email" type="email" label="Email" placeholder="you@salon.com" value={email} onValueChange={(v) => { setEmail(v); setError(null) }} leading={<Mail className="size-4" />} state={error ? "error" : "default"} message={error} shake autoComplete="email" autoFocus />
              <Button type="submit" size="lg" fullWidth loading={loading} iconRight={<ArrowRight />} animation="arrow">
                Send reset code
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Remembered it?{" "}
                <button type="button" className="font-medium text-foreground underline-offset-4 hover:underline" onClick={restart}>
                  Back to sign in
                </button>
              </p>
            </form>
          )}

          {step === "code" && (
            <div className="relative mt-4 grid gap-5">
              <div className="text-center">
                <h2 className="font-heading text-2xl font-semibold tracking-tight">Check your inbox</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  We sent a code to <span className="font-medium text-foreground">{email}</span>.{" "}
                  <button type="button" className="underline underline-offset-2" onClick={() => setStep("request")}>
                    Wrong email?
                  </button>
                </p>
              </div>
              <div className="flex justify-center">
                <OtpInput length={6} value={code} onValueChange={setCode} onComplete={verify} status={otpStatus} clearOnError autoFocus groupSize={3} aria-label="Reset code" />
              </div>
              <p role="status" aria-live="polite" className={cn("min-h-5 text-center text-sm", otpStatus === "error" ? "text-rose-600 dark:text-rose-400" : otpStatus === "success" ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground")}>
                {otpStatus === "error" ? "That code is not right. Try again." : otpStatus === "success" ? "Code accepted" : otpStatus === "verifying" ? "Checking…" : `Demo code: ${DEMO_CODE}`}
              </p>
              <div className="flex items-center justify-between text-sm">
                <button type="button" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground" onClick={() => setStep("request")}>
                  <ArrowLeft className="size-4" /> Back
                </button>
                <Button size="sm" variant="ghost" tone="neutral" disabled={cooldown > 0} onClick={() => { setCooldown(RESEND_SECONDS); setOtpStatus("idle"); setCode("") }}>
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                </Button>
              </div>
            </div>
          )}

          {step === "password" && (
            <form onSubmit={savePassword} className="relative mt-4 grid gap-4" noValidate>
              <div className="text-center">
                <h2 className="font-heading text-2xl font-semibold tracking-tight">Choose a new password</h2>
                <p className="mt-1 text-sm text-muted-foreground">Make it long. A sentence you will remember works well.</p>
              </div>
              <Input
                id="pr-password"
                type={show ? "text" : "password"}
                label="New password"
                value={password}
                onValueChange={(v) => { setPassword(v); setError(null) }}
                leading={<KeyRound className="size-4" />}
                autoComplete="new-password"
                autoFocus
                trailing={
                  <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} aria-pressed={show} className="rounded p-0.5 text-muted-foreground hover:text-foreground">
                    {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                }
              />
              <div className="flex gap-1" aria-hidden="true">
                {RULES.map((_, i) => (
                  <span key={i} className={cn("h-1.5 flex-1 rounded-full transition-colors duration-300", i < passed ? (passed === RULES.length ? "bg-emerald-500" : passed >= 2 ? "bg-amber-500" : "bg-rose-500") : "bg-muted")} />
                ))}
              </div>
              <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs" aria-label="Password rules">
                {RULES.map((r) => {
                  const ok = r.test(password)
                  return (
                    <li key={r.id} className={cn("flex items-center gap-1.5 transition-colors", ok ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground")}>
                      <span className={cn("flex size-4 items-center justify-center rounded-full", ok ? "bg-emerald-500 text-white" : "border")}>{ok && <Check className="size-2.5" />}</span>
                      {r.label}
                    </li>
                  )
                })}
              </ul>
              <Input id="pr-confirm" type={show ? "text" : "password"} label="Confirm password" value={confirm} onValueChange={(v) => { setConfirm(v); setError(null) }} autoComplete="new-password" state={confirm && confirm !== password ? "error" : confirm && confirm === password ? "success" : "default"} message={confirm && confirm !== password ? "Does not match" : undefined} />
              {error && (
                <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">
                  {error}
                </p>
              )}
              <Button type="submit" size="lg" fullWidth loading={loading} iconLeft={<ShieldCheck />}>
                Reset password
              </Button>
            </form>
          )}

          {step === "done" && (
            <div className="relative mt-4 grid gap-4 text-center">
              <div className="flex justify-center">
                <SuccessCheck size={64} />
              </div>
              <div>
                <h2 className="font-heading text-2xl font-semibold tracking-tight">Password updated</h2>
                <p className="mt-1 text-sm text-muted-foreground">You are signed out everywhere else. Use your new password to sign in.</p>
              </div>
              <Button size="lg" fullWidth onClick={restart} iconRight={<ArrowRight />} animation="arrow">
                Continue to sign in
              </Button>
            </div>
          )}
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">Codes expire after 10 minutes. Having trouble? Email support@bookly.com.</p>
      </div>
    </div>
  )
}

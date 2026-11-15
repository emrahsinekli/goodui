"use client"

import * as React from "react"
import { AlertCircle, ArrowRight, CalendarCheck, CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail, Quote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const TESTIMONIALS = [
  { quote: "No-shows dropped by 38% in the first month. The reminders alone paid for the plan.", name: "Priya Nair", role: "Owner, Lumen Skin Clinic", initials: "PN" },
  { quote: "Our front desk used to live on the phone. Now 80% of bookings come in online overnight.", name: "Marcus Bell", role: "Manager, Fade Republic Barbers", initials: "MB" },
  { quote: "Six studios, one calendar. Moving instructors between locations takes two clicks.", name: "Hannah Lindqvist", role: "COO, Northside Pilates", initials: "HL" },
]

const AGENDA = [
  { col: 0, top: 6, h: 22, label: "Balayage", tone: "var(--chart-1)" },
  { col: 1, top: 14, h: 16, label: "Trim", tone: "var(--chart-2)" },
  { col: 2, top: 4, h: 28, label: "Massage", tone: "var(--chart-3)" },
  { col: 0, top: 34, h: 14, label: "Brow tint", tone: "var(--chart-4)" },
  { col: 1, top: 38, h: 26, label: "Full color", tone: "var(--chart-5)" },
  { col: 2, top: 40, h: 18, label: "Facial", tone: "var(--chart-1)" },
  { col: 0, top: 54, h: 20, label: "Gel nails", tone: "var(--chart-3)" },
  { col: 2, top: 64, h: 14, label: "Consult", tone: "var(--chart-2)" },
]

type Status = "idle" | "loading" | "success"
type Provider = "google" | "apple"

export default function SignInSplit() {
  const [mode, setMode] = React.useState<"signin" | "signup">("signin")
  const [form, setForm] = React.useState({ name: "", email: "", password: "" })
  const [remember, setRemember] = React.useState(true)
  const [show, setShow] = React.useState(false)
  const [touched, setTouched] = React.useState(false)
  const [status, setStatus] = React.useState<Status>("idle")
  const [provider, setProvider] = React.useState<Provider | null>(null)
  const [authError, setAuthError] = React.useState<string | null>(null)
  const [attempts, setAttempts] = React.useState(3)
  const [notice, setNotice] = React.useState<string | null>(null)
  const [slide, setSlide] = React.useState(0)
  const [signedInAs, setSignedInAs] = React.useState("")

  React.useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % TESTIMONIALS.length), 6000)
    return () => clearInterval(id)
  }, [slide])

  const errors = {
    name: mode === "signup" && form.name.trim().length < 2 ? "Enter your full name" : null,
    email: !form.email ? "Email is required" : !/^\S+@\S+\.\S+$/.test(form.email) ? "Enter a valid email address" : null,
    password: !form.password ? "Password is required" : mode === "signup" && form.password.length < 8 ? "Use at least 8 characters" : null,
  }
  const show_ = (k: keyof typeof errors) => touched && errors[k]
  const busy = status === "loading" || provider !== null

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    setAuthError(null)
    setNotice(null)
    if (errors.name || errors.email || errors.password) return
    if (attempts === 0) return
    setStatus("loading")
    setTimeout(() => {
      if (mode === "signin" && form.password === "wrong") {
        const left = attempts - 1
        setAttempts(left)
        setAuthError(left === 0 ? "Too many attempts. We've emailed you a link to unlock your account." : `Incorrect email or password. ${left} attempt${left === 1 ? "" : "s"} left.`)
        setStatus("idle")
        return
      }
      setSignedInAs((mode === "signup" ? form.name.split(" ")[0] : form.email.split("@")[0]) ?? "")
      setStatus("success")
    }, 1100)
  }

  const social = (p: Provider) => {
    setProvider(p)
    setAuthError(null)
    setTimeout(() => {
      setProvider(null)
      setSignedInAs(p === "google" ? "Google account" : "Apple ID")
      setStatus("success")
    }, 1300)
  }

  const forgot = () => {
    setTouched(true)
    if (errors.email) {
      setNotice(null)
      return
    }
    setNotice(`Reset link sent to ${form.email}. It expires in 30 minutes.`)
  }

  const reset = () => {
    setStatus("idle")
    setForm({ name: "", email: "", password: "" })
    setTouched(false)
    setAuthError(null)
    setAttempts(3)
    setNotice(null)
  }

  const t = TESTIMONIALS[slide]!

  return (
    <div className="grid min-h-svh bg-background lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-zinc-950 text-white lg:flex lg:flex-col lg:justify-between lg:p-10">
        <div className="pointer-events-none absolute inset-0 opacity-80" style={{ background: "radial-gradient(60% 50% at 20% 10%, color-mix(in oklch, var(--chart-1) 55%, transparent), transparent), radial-gradient(50% 45% at 90% 80%, color-mix(in oklch, var(--chart-3) 45%, transparent), transparent)" }} />
        <svg className="pointer-events-none absolute inset-0 size-full opacity-[0.07]" aria-hidden>
          <defs>
            <pattern id="sis-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M32 0H0V32" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#sis-grid)" />
        </svg>

        <div className="relative flex items-center gap-2 text-lg font-semibold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-white text-zinc-950"><CalendarCheck className="size-4" /></span>
          Slotwise
        </div>

        {/* Product mock */}
        <div className="relative mx-auto w-full max-w-md">
          <div className="rotate-[-2deg] rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-2xl backdrop-blur-md">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-white/50">Thursday</div>
                <div className="text-sm font-semibold">14 bookings · $1,860</div>
              </div>
              <div className="flex gap-1">
                <span className="size-2 rounded-full bg-white/30" />
                <span className="size-2 rounded-full bg-white/30" />
                <span className="size-2 rounded-full bg-white/60" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10px] text-white/60">
              {["Sofia", "Liam", "Amara"].map((n) => <div key={n} className="rounded-md bg-white/5 px-2 py-1">{n}</div>)}
            </div>
            <div className="relative mt-2 h-56">
              {[0, 25, 50, 75].map((y) => <div key={y} className="absolute inset-x-0 border-t border-dashed border-white/10" style={{ top: `${y}%` }} />)}
              {AGENDA.map((a, i) => (
                <div
                  key={i}
                  className="absolute overflow-hidden rounded-md border-l-2 px-1.5 py-1 text-[10px] font-medium"
                  style={{ left: `calc(${a.col} * 33.333% + 2px)`, width: "calc(33.333% - 6px)", top: `${a.top}%`, height: `${a.h}%`, borderColor: a.tone, background: `color-mix(in oklch, ${a.tone} 30%, transparent)` }}
                >
                  {a.label}
                </div>
              ))}
            </div>
          </div>
          <div className="absolute -right-4 -bottom-6 flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-900/90 px-3 py-2 text-xs shadow-xl">
            <span className="flex size-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400"><CheckCircle2 className="size-3.5" /></span>
            New booking · Gel nails 3:30 PM
          </div>
        </div>

        {/* Testimonial */}
        <div className="relative max-w-md">
          <Quote className="mb-3 size-6 text-white/40" />
          <p key={slide} className="animate-in text-lg leading-relaxed font-medium duration-500 fade-in slide-in-from-bottom-2">{t.quote}</p>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">{t.initials}</span>
              <div>
                <div className="text-sm font-medium">{t.name}</div>
                <div className="text-xs text-white/60">{t.role}</div>
              </div>
            </div>
            <div className="flex gap-1.5">
              {TESTIMONIALS.map((x, i) => (
                <button key={x.name} type="button" aria-label={`Show testimonial ${i + 1}`} onClick={() => setSlide(i)} className={cn("h-1.5 rounded-full transition-all", i === slide ? "w-6 bg-white" : "w-1.5 bg-white/30 hover:bg-white/60")} />
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Form */}
      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          {status === "success" ? (
            <div className="flex animate-in flex-col items-center text-center duration-300 fade-in zoom-in-95">
              <div className="flex size-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="size-7" /></div>
              <h1 className="mt-4 text-2xl font-semibold tracking-tight">{mode === "signup" ? "Account created" : "Welcome back"}</h1>
              <p className="mt-1 text-sm text-muted-foreground">Signed in as <span className="font-medium text-foreground">{signedInAs}</span>. Taking you to your calendar…</p>
              <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full w-full origin-left animate-in rounded-full bg-primary duration-[2500ms] ease-out slide-in-from-left-full" />
              </div>
              <Button variant="ghost" className="mt-6" onClick={reset}>Sign out</Button>
            </div>
          ) : (
            <>
              <div className="mb-8 flex items-center gap-2 font-semibold lg:hidden">
                <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground"><CalendarCheck className="size-4" /></span>
                Slotwise
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">{mode === "signin" ? "Sign in to Slotwise" : "Start your free trial"}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{mode === "signin" ? "Manage bookings, staff and payments in one place." : "14 days free. No card required."}</p>

              <div className="mt-6 grid grid-cols-2 gap-2">
                <Button variant="outline" size="lg" disabled={busy} onClick={() => social("google")}>
                  {provider === "google" ? <Loader2 className="animate-spin" /> : <GoogleLogo />} Google
                </Button>
                <Button variant="outline" size="lg" disabled={busy} onClick={() => social("apple")}>
                  {provider === "apple" ? <Loader2 className="animate-spin" /> : <AppleLogo />} Apple
                </Button>
              </div>

              <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" /> or with email <div className="h-px flex-1 bg-border" />
              </div>

              {authError && (
                <div role="alert" className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" /> {authError}
                </div>
              )}
              {notice && (
                <div role="status" className="mb-4 flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-700 dark:text-emerald-400">
                  <Mail className="mt-0.5 size-4 shrink-0" /> {notice}
                </div>
              )}

              <form noValidate onSubmit={submit} className="flex flex-col gap-4">
                {mode === "signup" && (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="sis-name">Full name</Label>
                    <Input id="sis-name" className="h-10" autoComplete="name" placeholder="Emma Clarke" value={form.name} aria-invalid={!!show_("name")} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    {show_("name") && <p className="text-xs text-destructive">{errors.name}</p>}
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="sis-email">Work email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="sis-email" type="email" className="h-10 pl-9" autoComplete="email" placeholder="you@yourstudio.com" value={form.email} aria-invalid={!!show_("email")} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  {show_("email") && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sis-password">Password</Label>
                    {mode === "signin" && <button type="button" onClick={forgot} className="text-xs font-medium text-primary hover:underline">Forgot password?</button>}
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="sis-password" type={show ? "text" : "password"} className="h-10 px-9" autoComplete={mode === "signin" ? "current-password" : "new-password"} placeholder="••••••••" value={form.password} aria-invalid={!!show_("password")} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                    <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
                      {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {show_("password") && <p className="text-xs text-destructive">{errors.password}</p>}
                </div>
                {mode === "signin" && (
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={remember} onCheckedChange={(v) => setRemember(v === true)} />
                    Keep me signed in for 30 days
                  </label>
                )}
                <Button type="submit" size="lg" className="h-10" disabled={busy || attempts === 0}>
                  {status === "loading" ? <><Loader2 className="animate-spin" /> {mode === "signin" ? "Signing in…" : "Creating account…"}</> : <>{mode === "signin" ? "Sign in" : "Create account"} <ArrowRight /></>}
                </Button>
                {attempts === 0 && <Button type="button" variant="link" onClick={reset}>Try again with a different account</Button>}
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                {mode === "signin" ? "New to Slotwise? " : "Already have an account? "}
                <button type="button" className="font-medium text-primary hover:underline" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setTouched(false); setAuthError(null); setNotice(null) }}>
                  {mode === "signin" ? "Start a free trial" : "Sign in"}
                </button>
              </p>
              <p className="mt-8 rounded-lg bg-muted px-3 py-2 text-center text-xs text-muted-foreground">Demo: any password signs you in. Type <code className="font-mono font-semibold text-foreground">wrong</code> to see the error state.</p>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  )
}

function AppleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
      <path d="M16.37 12.6c-.03-2.6 2.12-3.85 2.22-3.91-1.21-1.77-3.09-2.01-3.76-2.04-1.6-.16-3.12.94-3.93.94-.81 0-2.06-.92-3.39-.89-1.74.03-3.35 1.01-4.25 2.57-1.81 3.14-.46 7.79 1.3 10.34.86 1.25 1.89 2.65 3.24 2.6 1.3-.05 1.79-.84 3.36-.84 1.57 0 2.01.84 3.39.81 1.4-.02 2.29-1.27 3.14-2.53.99-1.45 1.4-2.85 1.42-2.93-.03-.01-2.72-1.04-2.74-4.12zM13.79 4.96c.72-.87 1.2-2.07 1.07-3.27-1.03.04-2.28.69-3.02 1.55-.66.77-1.24 1.99-1.09 3.17 1.15.09 2.32-.58 3.04-1.45z" />
    </svg>
  )
}

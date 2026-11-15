"use client"

import * as React from "react"
import { AtSign, Camera, Check, Globe, Loader2, Trash2, X } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/registry/components/core/button"
import { Input } from "@/registry/components/core/input"
import { Select } from "@/registry/components/core/select"
import { cn } from "@/lib/utils"

/* ---------- Demo data ---------- */

const TIMEZONES = [
  { value: "Europe/London", label: "London", description: "GMT+0 · Europe/London", group: "Europe" },
  { value: "Europe/Paris", label: "Paris", description: "GMT+1 · Europe/Paris", group: "Europe" },
  { value: "Europe/Istanbul", label: "Istanbul", description: "GMT+3 · Europe/Istanbul", group: "Europe" },
  { value: "America/New_York", label: "New York", description: "GMT-5 · America/New_York", group: "Americas" },
  { value: "America/Chicago", label: "Chicago", description: "GMT-6 · America/Chicago", group: "Americas" },
  { value: "America/Los_Angeles", label: "Los Angeles", description: "GMT-8 · America/Los_Angeles", group: "Americas" },
  { value: "Asia/Dubai", label: "Dubai", description: "GMT+4 · Asia/Dubai", group: "Asia Pacific" },
  { value: "Asia/Singapore", label: "Singapore", description: "GMT+8 · Asia/Singapore", group: "Asia Pacific" },
  { value: "Australia/Sydney", label: "Sydney", description: "GMT+11 · Australia/Sydney", group: "Asia Pacific" },
]

const LOCALES = [
  { value: "en-US", label: "English (US)", description: "12-hour clock · MM/DD/YYYY" },
  { value: "en-GB", label: "English (UK)", description: "24-hour clock · DD/MM/YYYY" },
  { value: "de-DE", label: "Deutsch", description: "24-Stunden · TT.MM.JJJJ" },
  { value: "fr-FR", label: "Français", description: "24 h · JJ/MM/AAAA" },
  { value: "es-ES", label: "Español", description: "24 h · DD/MM/AAAA" },
  { value: "tr-TR", label: "Türkçe", description: "24 saat · GG.AA.YYYY" },
]

const TAKEN = ["mira", "alex", "studio", "nova", "admin"]

type Profile = { first: string; last: string; handle: string; email: string; tz: string; locale: string; bio: string; photo: string | null }

const INITIAL: Profile = {
  first: "Mira",
  last: "Castellano",
  handle: "mira",
  email: "mira@novasalon.co",
  tz: "Europe/London",
  locale: "en-GB",
  bio: "Owner at Nova Salon. Balayage specialist, 12 years behind the chair.",
  photo: null,
}

type HandleState = "idle" | "checking" | "free" | "taken" | "invalid"

/* ---------- Pieces ---------- */

function CoverArt() {
  return (
    <svg viewBox="0 0 800 200" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden="true">
      <defs>
        <linearGradient id="ps-g1" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="var(--chart-1)" />
          <stop offset="1" stopColor="var(--chart-4)" />
        </linearGradient>
        <radialGradient id="ps-g2" cx="0.8" cy="0.2" r="0.7">
          <stop offset="0" stopColor="var(--chart-2)" stopOpacity="0.9" />
          <stop offset="1" stopColor="var(--chart-2)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ps-g3" cx="0.15" cy="0.9" r="0.6">
          <stop offset="0" stopColor="var(--chart-3)" stopOpacity="0.8" />
          <stop offset="1" stopColor="var(--chart-3)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="800" height="200" fill="url(#ps-g1)" />
      <rect width="800" height="200" fill="url(#ps-g2)" />
      <rect width="800" height="200" fill="url(#ps-g3)" />
      <g stroke="white" strokeOpacity="0.18" fill="none">
        {Array.from({ length: 9 }).map((_, i) => (
          <circle key={i} cx="640" cy="110" r={30 + i * 34} />
        ))}
      </g>
    </svg>
  )
}

function Field({ label, htmlFor, hint, children }: { label: string; htmlFor?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

/* ---------- Block ---------- */

export default function ProfileSettings() {
  const [saved, setSaved] = React.useState<Profile>(INITIAL)
  const [form, setForm] = React.useState<Profile>(INITIAL)
  const [handleState, setHandleState] = React.useState<HandleState>("idle")
  const [saving, setSaving] = React.useState(false)
  const [savedFlash, setSavedFlash] = React.useState(false)
  const [errors, setErrors] = React.useState<Partial<Record<keyof Profile, string>>>({})
  const fileRef = React.useRef<HTMLInputElement>(null)

  const dirty = JSON.stringify(form) !== JSON.stringify(saved)
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setForm((f) => ({ ...f, [k]: v }))

  // Handle availability: debounced fake lookup.
  React.useEffect(() => {
    const h = form.handle
    if (h === saved.handle) return setHandleState("idle")
    if (!/^[a-z0-9_]{3,20}$/.test(h)) return setHandleState("invalid")
    setHandleState("checking")
    const id = setTimeout(() => setHandleState(TAKEN.includes(h) ? "taken" : "free"), 650)
    return () => clearTimeout(id)
  }, [form.handle, saved.handle])

  const pickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    set("photo", URL.createObjectURL(file))
    e.target.value = ""
  }

  const save = () => {
    const next: typeof errors = {}
    if (!form.first.trim()) next.first = "First name is required"
    if (!form.last.trim()) next.last = "Last name is required"
    if (handleState === "invalid") next.handle = "3–20 characters: lowercase letters, numbers and _"
    if (handleState === "taken") next.handle = "That handle is already taken"
    if (handleState === "checking") next.handle = "Still checking availability…"
    if (form.bio.length > 160) next.bio = "Keep the bio under 160 characters"
    setErrors(next)
    if (Object.keys(next).length) return
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setSaved(form)
      setSavedFlash(true)
      setTimeout(() => setSavedFlash(false), 2200)
    }, 900)
  }

  const discard = () => {
    setForm(saved)
    setErrors({})
  }

  const initials = `${form.first[0] ?? ""}${form.last[0] ?? ""}`.toUpperCase()

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-4xl">
        {/* Cover + avatar */}
        <div className="relative overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="relative h-36 md:h-44">
            <CoverArt />
          </div>
          <div className="px-5 pb-5 md:px-8">
            <div className="-mt-12 flex flex-wrap items-end gap-4 md:-mt-14">
              <div className="relative">
                <div className="size-24 overflow-hidden rounded-2xl border-4 border-card bg-muted shadow-md md:size-28">
                  {form.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.photo} alt="" className="size-full object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-gradient-to-br from-[var(--chart-1)] to-[var(--chart-4)] font-heading text-3xl font-semibold text-white">{initials}</div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  aria-label="Upload photo"
                  className="absolute -right-1 -bottom-1 flex size-9 items-center justify-center rounded-full border-2 border-card bg-foreground text-background shadow transition hover:scale-105 focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <Camera className="size-4" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={pickPhoto} aria-label="Choose a profile photo" />
              </div>
              <div className="min-w-0 flex-1 basis-40 pb-1">
                <h2 className="truncate font-heading text-2xl font-semibold tracking-tight">
                  {form.first} {form.last}
                </h2>
                <p className="truncate text-sm text-muted-foreground">
                  @{form.handle} · {form.email}
                </p>
              </div>
              <div className="flex w-full gap-2 pb-1 sm:w-auto">
                <Button size="sm" variant="outline" tone="neutral" onClick={() => fileRef.current?.click()} iconLeft={<Camera />}>
                  Change photo
                </Button>
                {form.photo && (
                  <Button size="sm" variant="ghost" tone="danger" onClick={() => set("photo", null)} iconLeft={<Trash2 />} aria-label="Remove photo">
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="mt-6 grid gap-6 md:grid-cols-[220px_1fr]">
          <div>
            <h3 className="font-heading text-base font-semibold">Personal details</h3>
            <p className="mt-1 text-sm text-muted-foreground">Shown on your public booking page and in emails to clients.</p>
          </div>
          <div className="grid gap-5 rounded-2xl border bg-card p-5 shadow-sm md:p-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <Input id="ps-first" label="First name" value={form.first} onValueChange={(v) => set("first", v)} state={errors.first ? "error" : "default"} message={errors.first} autoComplete="given-name" />
              <Input id="ps-last" label="Last name" value={form.last} onValueChange={(v) => set("last", v)} state={errors.last ? "error" : "default"} message={errors.last} autoComplete="family-name" />
            </div>
            <Input
              id="ps-handle"
              label="Handle"
              value={form.handle}
              onValueChange={(v) => set("handle", v.toLowerCase())}
              leading={<AtSign className="size-4" />}
              addonBefore="book.nova.co/"
              state={errors.handle || handleState === "taken" || handleState === "invalid" ? "error" : handleState === "free" ? "success" : "default"}
              message={errors.handle ?? (handleState === "taken" ? "That handle is already taken" : handleState === "free" ? "Nice, @" + form.handle + " is available" : undefined)}
              description="Lowercase letters, numbers and underscores"
              trailing={
                handleState === "checking" ? (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Checking availability" />
                ) : handleState === "free" ? (
                  <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
                ) : handleState === "taken" || handleState === "invalid" ? (
                  <X className="size-4 text-rose-600 dark:text-rose-400" />
                ) : undefined
              }
              autoComplete="username"
            />
            <Input id="ps-email" label="Email" type="email" value={form.email} onValueChange={(v) => set("email", v)} description="We send a confirmation link when this changes." autoComplete="email" />
            <Field label="Bio" htmlFor="ps-bio" hint={errors.bio}>
              <Textarea id="ps-bio" value={form.bio} onChange={(e) => set("bio", e.target.value)} rows={3} aria-invalid={!!errors.bio} className={cn(errors.bio && "border-destructive")} />
              <div className="flex justify-end text-xs tabular-nums text-muted-foreground">
                <span className={cn(form.bio.length > 160 && "text-rose-600 dark:text-rose-400")}>{form.bio.length}/160</span>
              </div>
            </Field>
          </div>

          <div>
            <h3 className="font-heading text-base font-semibold">Region</h3>
            <p className="mt-1 text-sm text-muted-foreground">Appointment times and dates follow these settings.</p>
          </div>
          <div className="grid gap-5 rounded-2xl border bg-card p-5 shadow-sm md:p-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Time zone" htmlFor="ps-tz">
                <Select id="ps-tz" options={TIMEZONES} value={form.tz} onValueChange={(v) => v && set("tz", v)} searchable searchPlaceholder="Search cities" icon={<Globe className="size-4" />} className="w-full" />
              </Field>
              <Field label="Language & format" htmlFor="ps-locale">
                <Select id="ps-locale" options={LOCALES} value={form.locale} onValueChange={(v) => v && set("locale", v)} className="w-full" />
              </Field>
            </div>
            <div className="rounded-xl bg-muted/60 p-4 text-sm">
              <p className="text-muted-foreground">Preview</p>
              <p className="mt-1 font-medium">
                Next appointment: <span className="tabular-nums">{form.locale === "en-US" ? "Thu, Mar 14 · 2:30 PM" : form.locale === "de-DE" ? "Do., 14.03. · 14:30" : form.locale === "fr-FR" ? "jeu. 14/03 · 14:30" : form.locale === "tr-TR" ? "Per, 14.03 · 14:30" : "Thu 14/03 · 14:30"}</span>{" "}
                <span className="text-muted-foreground">({TIMEZONES.find((t) => t.value === form.tz)?.label})</span>
              </p>
            </div>
          </div>
        </div>

        {/* Unsaved changes bar */}
        <div
          className={cn(
            "sticky bottom-4 z-10 mt-6 flex items-center justify-between gap-3 rounded-2xl border bg-foreground px-4 py-3 text-background shadow-xl transition-all duration-300 motion-reduce:transition-none",
            dirty || saving || savedFlash ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
          )}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-3 text-sm">
            {savedFlash && !dirty ? (
              <>
                <span className="flex size-6 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <Check className="size-3.5" />
                </span>
                Profile saved
              </>
            ) : (
              <>
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-75 motion-reduce:animate-none" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-amber-400" />
                </span>
                You have unsaved changes
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" tone="neutral" className="text-background hover:bg-background/15" onClick={discard} disabled={!dirty || saving}>
              Discard
            </Button>
            <Button size="sm" variant="solid" tone="neutral" className="bg-background text-foreground hover:bg-background/90" onClick={save} loading={saving} disabled={!dirty}>
              Save changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

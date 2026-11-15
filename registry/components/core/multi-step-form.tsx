"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion, type Transition } from "motion/react"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import { Button } from "@/registry/components/core/button"
import { GooduiTokens, spring } from "@/lib/goodui-motion"

/*
 * Multi-step form (wizard), independent layers: every axis combines with every other.
 *   variant     card, outline, plain, glass, neo           tone        accent for steps, bar and buttons
 *   header      numbered, progress, vertical, none          transition  slide (direction-aware), fade, none
 *   navigation  linear (only visited steps are clickable) or free         size, shadow
 * Each step renders your own fields (Core Input, Select, Checkbox…) through `content`, gets the shared values and
 * its errors, and can validate sync or async before Next. Invalid steps block Next, show the messages and focus the
 * first invalid field. Optional steps get a Skip button. `review` adds a summary step with Edit links. onSubmit may
 * be async (loading, error with retry, then success). onPersist receives a snapshot after every change, so drafts
 * can be saved and restored with defaultValues + defaultStep + defaultCompleted.
 * Screen readers hear "Step 2 of 4: Contact" on every step change, and focus moves to the new step's heading.
 */

export type MultiStepFormVariant = "card" | "outline" | "plain" | "glass" | "neo"
export type MultiStepFormTone = "primary" | "neutral" | "success" | "warning" | "danger" | "info"
export type MultiStepFormSize = "sm" | "md" | "lg"
export type MultiStepFormShadow = "none" | "sm" | "md" | "lg"
export type MultiStepFormHeader = "numbered" | "progress" | "vertical" | "none"
export type MultiStepFormTransition = "slide" | "fade" | "none"
export type MultiStepFormNavigation = "linear" | "free"

export type FormValues = Record<string, unknown>
/** Field name → message. Empty or undefined messages count as valid. */
export type StepErrors = Record<string, string | undefined>
/** What a validator returns: nothing when valid, a string for a step-level error, or field errors. */
export type StepValidation = string | StepErrors | null | undefined | void

export type StepContext<V extends FormValues> = {
  values: V
  setValue: <K extends keyof V>(key: K, value: V[K]) => void
  /** Field errors of this step from the last validation; a field's error clears when its value changes. */
  errors: StepErrors
  /** Error message for one field, or undefined. */
  error: (key: keyof V & string) => string | undefined
  /** Index of this step. */
  step: number
  next: () => void
  back: () => void
  goTo: (step: number) => void
}

export type FormStep<V extends FormValues> = {
  /** Stable id, used in the persistence snapshot. */
  id: string
  title: string
  description?: React.ReactNode
  /** Shown in the step header instead of the number while the step is upcoming or current. */
  icon?: React.ReactNode
  /** Adds a Skip button; skipped steps are not validated on submit. */
  optional?: boolean
  /** Fields of this step, in order: used to focus the first invalid one and for the auto review summary. */
  fields?: (keyof V & string)[]
  /** Runs on Next (and again on submit). Return nothing when valid, a string, or { field: "message" }. May be async. */
  validate?: (values: V) => StepValidation | Promise<StepValidation>
  /** The step's fields. A function receives values, setValue and errors. */
  content: React.ReactNode | ((ctx: StepContext<V>) => React.ReactNode)
  /** Rows for the review step. Defaults to `fields` with fieldLabels. */
  summary?: (values: V) => { label: string; value: React.ReactNode }[]
}

export type MultiStepFormSnapshot<V extends FormValues> = { step: number; values: V; completed: string[]; skipped: string[] }

export type MultiStepFormLabels = {
  next: string
  back: string
  skip: string
  submit: string
  backToReview: string
  optional: string
  reviewTitle: string
  reviewDescription: string
  edit: string
  editStep: (stepTitle: string) => string
  stepOf: (step: number, total: number) => string
  announce: (step: number, total: number, title: string) => string
  progress: string
  complete: string
  skipped: string
  hasErrors: string
  current: string
  errorSummary: (count: number) => string
  validating: string
  submitting: string
  submitError: string
  successTitle: string
  successText: string
  startOver: string
  yes: string
  no: string
  empty: string
}
const DEFAULT_LABELS: MultiStepFormLabels = {
  next: "Continue",
  back: "Back",
  skip: "Skip",
  submit: "Submit",
  backToReview: "Back to review",
  optional: "Optional",
  reviewTitle: "Review",
  reviewDescription: "Check your answers before you submit.",
  edit: "Edit",
  editStep: (t) => `Edit ${t}`,
  stepOf: (s, t) => `Step ${s} of ${t}`,
  announce: (s, t, title) => `Step ${s} of ${t}: ${title}`,
  progress: "Progress",
  complete: "completed",
  skipped: "skipped",
  hasErrors: "needs attention",
  current: "current step",
  errorSummary: (n) => (n === 1 ? "1 field needs attention." : `${n} fields need attention.`),
  validating: "Checking…",
  submitting: "Submitting…",
  submitError: "Something went wrong. Please try again.",
  successTitle: "All done",
  successText: "We received your details.",
  startOver: "Start over",
  yes: "Yes",
  no: "No",
  empty: "—",
}

export type MultiStepFormProps<V extends FormValues> = Omit<React.ComponentProps<"form">, "onSubmit" | "children" | "defaultValue"> & {
  steps: FormStep<V>[]
  /** Form values (controlled). */
  values?: V
  /** Initial values when uncontrolled; also what "Start over" resets to. Pass a saved draft here to restore it. */
  defaultValues?: V
  /** Called with all values after every change. */
  onValuesChange?: (values: V) => void
  /** Current step index (controlled). The review step is index steps.length. */
  step?: number
  /** Initial step when uncontrolled, e.g. from a saved draft. */
  defaultStep?: number
  onStepChange?: (step: number) => void
  /** Step ids already completed or skipped, e.g. from a saved draft (marks them done in the header). */
  defaultCompleted?: string[]
  /** Adds a review step that summarizes every step with Edit links. */
  review?: boolean
  /** Labels for the auto review summary: { email: "Email" }. Unlisted names are humanized. */
  fieldLabels?: Partial<Record<keyof V & string, string>>
  /** Called with all values after every step passed. May be async; a thrown Error's message is shown with a retry. */
  onSubmit?: (values: V) => void | Promise<void>
  /** Shown after a successful submit. A function gets the values and a reset(). */
  success?: React.ReactNode | ((ctx: { values: V; reset: () => void }) => React.ReactNode)
  /** Called after every value or step change with a serializable snapshot, for saving drafts. */
  onPersist?: (snapshot: MultiStepFormSnapshot<V>) => void
  /** linear: steps ahead are clickable only once visited. free: any step is clickable (the current one still validates). */
  navigation?: MultiStepFormNavigation
  /** Step header: numbered circles with connecting lines, a progress bar, a vertical list beside the form, or none. */
  header?: MultiStepFormHeader
  /** Panel transition between steps: slide follows the direction (and flips in RTL), fade, or none. */
  transition?: MultiStepFormTransition
  /** Shell: card (default), outline, plain (no box), glass or neo. */
  variant?: MultiStepFormVariant
  /** Accent of the step header, bar and primary button. */
  tone?: MultiStepFormTone
  size?: MultiStepFormSize
  /** Shell shadow. Ignored by neo, which has its own offset shadow. */
  shadow?: MultiStepFormShadow
  /** Heading element for step titles. */
  headingAs?: "h2" | "h3" | "h4"
  /** Text for buttons, header and screen readers; pass translations here. */
  labels?: Partial<MultiStepFormLabels>
}

const tones = (c: string) => `
.${c}{--pc-c:var(--primary);--pc-fg:var(--primary-foreground)}
.${c}[data-tone=neutral]{--pc-c:var(--foreground);--pc-fg:var(--background)}
.${c}[data-tone=success]{--pc-c:oklch(0.53 0.13 155);--pc-fg:#fff}
.${c}[data-tone=warning]{--pc-c:oklch(0.75 0.16 70);--pc-fg:oklch(0.25 0.05 70)}
.${c}[data-tone=danger]{--pc-c:oklch(0.56 0.21 27);--pc-fg:#fff}
.${c}[data-tone=info]{--pc-c:oklch(0.55 0.17 250);--pc-fg:#fff}
.dark .${c}[data-tone=success]{--pc-c:oklch(0.7 0.16 155);--pc-fg:oklch(0.2 0.05 155)}
.dark .${c}[data-tone=danger]{--pc-c:oklch(0.68 0.2 25);--pc-fg:oklch(0.2 0.05 25)}
.dark .${c}[data-tone=info]{--pc-c:oklch(0.7 0.15 245);--pc-fg:oklch(0.2 0.05 245)}
.${c}{--pc-tint:color-mix(in oklab,var(--pc-c) 14%,transparent);--pc-ink:color-mix(in oklab,var(--pc-c) 82%,var(--foreground))}
.${c}[data-tone=warning]{--pc-ink:color-mix(in oklab,var(--pc-c) 62%,var(--foreground))}
`

const R = ".pc-msf"
const D = ".pc-msf-dot"
const CSS = `${tones("pc-msf")}
${R}{--pc-muted:color-mix(in oklab,var(--muted-foreground) 82%,var(--foreground));--pc-bad:oklch(0.56 0.21 27);box-shadow:var(--pc-mv,0 0 #0000),var(--pc-msh,0 0 #0000)}
.dark ${R}{--pc-bad:oklch(0.68 0.2 25)}
${R}[data-variant=card]{background:var(--card);color:var(--card-foreground);border:1px solid color-mix(in oklab,var(--foreground) 8%,transparent);--pc-mv:0 1px 2px rgb(0 0 0/.05),0 4px 14px -6px rgb(0 0 0/.12)}
.dark ${R}[data-variant=card]{--pc-mv:0 1px 2px rgb(0 0 0/.4),0 6px 18px -6px rgb(0 0 0/.6)}
${R}[data-variant=outline]{background:var(--card);color:var(--card-foreground);border:1px solid var(--border)}
${R}[data-variant=glass]{background:color-mix(in oklab,var(--card) 50%,transparent);border:1px solid color-mix(in oklab,var(--foreground) 13%,transparent);-webkit-backdrop-filter:blur(16px) saturate(1.6);backdrop-filter:blur(16px) saturate(1.6);--pc-mv:inset 0 1px 0 color-mix(in oklab,white 35%,transparent)}
${R}[data-variant=neo]{background:var(--card);color:var(--card-foreground);border:2px solid var(--foreground);--pc-mv:6px 6px 0 var(--foreground)}
${R}[data-shadow=sm]{--pc-msh:0 1px 3px rgb(0 0 0/.08),0 1px 2px rgb(0 0 0/.05)}
${R}[data-shadow=md]{--pc-msh:0 8px 20px -8px rgb(0 0 0/.2)}
${R}[data-shadow=lg]{--pc-msh:0 18px 40px -14px rgb(0 0 0/.28)}
.pc-msf-muted{color:var(--pc-muted)}
.pc-msf-sep{border-color:color-mix(in oklab,var(--foreground) 9%,transparent)}
${R}[data-variant=neo] .pc-msf-sep{border-color:var(--foreground)}

${D}{background:var(--background);border:1.5px solid color-mix(in oklab,var(--foreground) 18%,transparent);color:var(--pc-muted);transition:background-color .25s,border-color .25s,color .25s,box-shadow .25s}
${D}[data-status=current]{border-color:var(--pc-c);color:var(--pc-ink);box-shadow:0 0 0 4px var(--pc-tint)}
${D}[data-status=complete]{background:var(--pc-c);border-color:var(--pc-c);color:var(--pc-fg)}
${D}[data-status=error]{border-color:var(--pc-bad);color:var(--pc-bad);background:color-mix(in oklab,var(--pc-bad) 10%,var(--background));box-shadow:0 0 0 4px color-mix(in oklab,var(--pc-bad) 14%,transparent)}
${D}[data-status=skipped]{border-style:dashed}
${R}[data-variant=neo] ${D}{border:2px solid var(--foreground)}
${R}[data-variant=neo] ${D}[data-status=current]{box-shadow:2px 2px 0 var(--foreground)}
.pc-msf-step{-webkit-tap-highlight-color:transparent}
.pc-msf-step:not(:disabled):hover .pc-msf-name{color:var(--pc-ink)}
.pc-msf-step:not(:disabled):hover ${D}:not([data-status=complete]){border-color:var(--pc-c)}
.pc-msf-name{color:var(--pc-muted);transition:color .2s}
.pc-msf-step[aria-current=step] .pc-msf-name{color:var(--foreground)}
.pc-msf-line{background:color-mix(in oklab,var(--foreground) 12%,transparent)}
.pc-msf-line>span{display:block;width:100%;height:100%;background:var(--pc-c);transform:scaleX(0);transform-origin:left center;transition:transform .4s var(--pc-ease-out)}
.pc-msf-line>span:dir(rtl){transform-origin:right center}
.pc-msf-line[data-axis=y]>span{transform:scaleY(0);transform-origin:center top}
.pc-msf-line>span[data-done]{transform:none}
.pc-msf-bar{background:color-mix(in oklab,var(--foreground) 10%,transparent)}
.pc-msf-bar>span{background:var(--pc-c);transform-origin:left center;transition:transform .45s var(--pc-ease-out)}
.pc-msf-bar>span:dir(rtl){transform-origin:right center}
.pc-msf-alert{background:color-mix(in oklab,var(--pc-bad) 9%,transparent);color:color-mix(in oklab,var(--pc-bad) 80%,var(--foreground));border:1px solid color-mix(in oklab,var(--pc-bad) 28%,transparent)}
.pc-msf-tag{background:color-mix(in oklab,var(--foreground) 7%,transparent);color:var(--pc-muted)}
.pc-msf-ok{background:var(--pc-tint);color:var(--pc-ink)}
.pc-msf-ok path{stroke-dasharray:24;stroke-dashoffset:0;animation:pc-msf-draw .5s .12s var(--pc-ease-out) backwards}
@keyframes pc-msf-draw{from{stroke-dashoffset:24}}
.pc-msf-edit{color:var(--pc-ink)}
.pc-msf-edit:hover{text-decoration:underline;text-underline-offset:3px}
@media (prefers-reduced-motion:reduce){
  ${R} *{transition:none!important;animation:none!important}
}
`

const SZ = {
  sm: { pad: "p-4", gap: "gap-4", dot: "size-6 text-[11px] [&_svg]:size-3", dotPx: 24, title: "text-base", text: "text-xs", btn: "sm" },
  md: { pad: "p-5 sm:p-6", gap: "gap-5", dot: "size-8 text-xs [&_svg]:size-3.5", dotPx: 32, title: "text-lg", text: "text-sm", btn: "md" },
  lg: { pad: "p-6 sm:p-8", gap: "gap-6", dot: "size-10 text-sm [&_svg]:size-4", dotPx: 40, title: "text-xl", text: "text-sm", btn: "lg" },
} as const

type Status = "upcoming" | "current" | "complete" | "skipped" | "error"
type Normalized = { ok: boolean; fields: StepErrors; message: string | null }
const OK: Normalized = { ok: true, fields: {}, message: null }

function normalize(r: StepValidation): Normalized {
  if (!r) return OK
  if (typeof r === "string") return { ok: false, fields: {}, message: r }
  const fields: StepErrors = {}
  for (const [k, m] of Object.entries(r)) if (m) fields[k] = m
  return Object.keys(fields).length ? { ok: false, fields, message: null } : OK
}
const isThenable = (x: unknown): x is PromiseLike<StepValidation> => !!x && typeof (x as { then?: unknown }).then === "function"
const humanize = (s: string) => {
  const t = s
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .toLowerCase()
  return t.charAt(0).toUpperCase() + t.slice(1)
}
const FOCUSABLE = 'input:not([type=hidden]):not(:disabled),select:not(:disabled),textarea:not(:disabled),button:not(:disabled),[tabindex]:not([tabindex="-1"])'

const Check = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

/** Runs `run` once when mounted: the new step panel uses it to take focus after the transition. */
function OnMount({ run }: { run: () => void }) {
  const ref = React.useRef(run)
  React.useEffect(() => ref.current(), [])
  return null
}

export function MultiStepForm<V extends FormValues = FormValues>({
  steps,
  values: valuesProp,
  defaultValues,
  onValuesChange,
  step: stepProp,
  defaultStep = 0,
  onStepChange,
  defaultCompleted,
  review = false,
  fieldLabels,
  onSubmit,
  success,
  onPersist,
  navigation = "linear",
  header = "numbered",
  transition = "slide",
  variant = "card",
  tone = "primary",
  size = "md",
  shadow = "none",
  headingAs: Heading = "h3",
  labels,
  className,
  ...props
}: MultiStepFormProps<V>) {
  const l = useLabels("multi-step-form", DEFAULT_LABELS, labels)
  const prefersReduced = useReducedMotion()
  // Gate reduced motion behind mount so server and first client render match.
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  const reduce = mounted && !!prefersReduced
  const uid = React.useId()
  const s = SZ[size]
  const total = steps.length + (review ? 1 : 0)
  const reviewIndex = review ? steps.length : -1

  const [innerValues, setInnerValues] = React.useState<V>(() => defaultValues ?? ({} as V))
  const values = valuesProp ?? innerValues
  const valuesRef = React.useRef(values)
  valuesRef.current = values
  const setValues = (next: V) => {
    valuesRef.current = next
    if (valuesProp === undefined) setInnerValues(next)
    onValuesChange?.(next)
  }

  const clampStep = (i: number) => Math.max(0, Math.min(total - 1, i))
  const [innerStep, setInnerStep] = React.useState(() => clampStep(defaultStep))
  const index = clampStep(stepProp ?? innerStep)
  const setStep = (i: number) => {
    if (stepProp === undefined) setInnerStep(i)
    onStepChange?.(i)
  }

  const initialDone = () => Object.fromEntries((defaultCompleted ?? []).map((id) => [id, "complete" as const])) as Record<string, "complete" | "skipped">
  const [done, setDone] = React.useState<Record<string, "complete" | "skipped">>(initialDone)
  const doneRef = React.useRef(done)
  doneRef.current = done
  const [errorIds, setErrorIds] = React.useState<Record<string, true>>({})
  const [furthest, setFurthest] = React.useState(() => clampStep(defaultStep))
  const [errors, setErrors] = React.useState<StepErrors>({})
  const [stepError, setStepError] = React.useState<string | null>(null)
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState<null | "validating" | "submitting">(null)
  const busyRef = React.useRef(false)
  const [finished, setFinished] = React.useState(false)
  const [dir, setDir] = React.useState<1 | -1>(1)
  const [rtl, setRtl] = React.useState(false)
  const [returnToReview, setReturnToReview] = React.useState(false)
  const [announcement, setAnnouncement] = React.useState("")
  const root = React.useRef<HTMLFormElement>(null)
  const panel = React.useRef<HTMLDivElement>(null)
  const heading = React.useRef<HTMLElement | null>(null)
  const setHeading = (el: HTMLElement | null) => {
    heading.current = el
  }
  const pendingFocus = React.useRef<null | "heading" | { field: string }>(null)

  React.useLayoutEffect(() => {
    if (root.current) setRtl(getComputedStyle(root.current).direction === "rtl")
  }, [])

  // Persistence: a snapshot after every change of values, step or completion (not on mount).
  const persistRef = React.useRef(onPersist)
  persistRef.current = onPersist
  const firstPersist = React.useRef(true)
  React.useEffect(() => {
    if (firstPersist.current) {
      firstPersist.current = false
      return
    }
    const ids = Object.keys(done)
    persistRef.current?.({ step: index, values, completed: ids.filter((id) => done[id] === "complete"), skipped: ids.filter((id) => done[id] === "skipped") })
  }, [values, index, done])

  const focusField = (key: string) => {
    const scope = panel.current
    if (!scope) return
    const esc = window.CSS?.escape ? window.CSS.escape(key) : key
    const el = scope.querySelector<HTMLElement>(`[data-field="${esc}"]`) ?? scope.querySelector<HTMLElement>(`[name="${esc}"]`) ?? scope.querySelector<HTMLElement>(`#${esc}`)
    if (!el) return
    const target = el.matches(FOCUSABLE) ? el : (el.querySelector<HTMLElement>(FOCUSABLE) ?? el.parentElement?.querySelector<HTMLElement>(FOCUSABLE))
    target?.focus()
  }
  const runPendingFocus = () => {
    const p = pendingFocus.current
    pendingFocus.current = null
    if (p === "heading") heading.current?.focus({ preventScroll: true })
    else if (p) focusField(p.field)
  }

  const titleOf = (i: number) => (i === reviewIndex ? l.reviewTitle : (steps[i]?.title ?? ""))

  const move = (i: number, focus: "heading" | { field: string } = "heading") => {
    const target = clampStep(i)
    setDir(target >= index ? 1 : -1)
    setErrors({})
    setStepError(null)
    setSubmitError(null)
    if (target === reviewIndex) setReturnToReview(false)
    setFurthest((f) => Math.max(f, target))
    pendingFocus.current = focus
    setAnnouncement(l.announce(target + 1, total, titleOf(target)))
    if (target === index) {
      requestAnimationFrame(runPendingFocus)
      return
    }
    setStep(target)
  }

  const resolve = async (i: number): Promise<Normalized> => {
    const st = steps[i]
    if (!st?.validate) return OK
    let r: StepValidation | PromiseLike<StepValidation>
    try {
      r = st.validate(valuesRef.current)
    } catch (e) {
      return { ok: false, fields: {}, message: e instanceof Error && e.message ? e.message : l.submitError }
    }
    if (!isThenable(r)) return normalize(r)
    setBusy("validating")
    setAnnouncement(l.validating)
    try {
      return normalize(await r)
    } catch (e) {
      return { ok: false, fields: {}, message: e instanceof Error && e.message ? e.message : l.submitError }
    } finally {
      setBusy(null)
    }
  }

  const showErrors = (i: number, r: Normalized) => {
    const st = steps[i]
    if (!st) return
    const keys = Object.keys(r.fields)
    const ordered = [...(st.fields ?? []).filter((f) => keys.includes(f)), ...keys.filter((k) => !(st.fields ?? []).includes(k as keyof V & string))]
    setErrorIds((e) => ({ ...e, [st.id]: true }))
    const focus = ordered[0] ? { field: ordered[0] } : ("heading" as const)
    if (i !== index) move(i, focus)
    else {
      pendingFocus.current = focus
      requestAnimationFrame(runPendingFocus)
    }
    setErrors(r.fields)
    setStepError(r.message)
    setAnnouncement(r.message ?? l.errorSummary(keys.length))
  }

  const markDone = (i: number, how: "complete" | "skipped") => {
    const id = steps[i]?.id
    if (!id) return
    setDone((d) => ({ ...d, [id]: how }))
    setErrorIds((e) => {
      if (!e[id]) return e
      const rest = { ...e }
      delete rest[id]
      return rest
    })
  }

  const exclusive = async (fn: () => Promise<void>) => {
    if (busyRef.current || finished) return
    busyRef.current = true
    try {
      await fn()
    } finally {
      busyRef.current = false
    }
  }

  const submit = async () => {
    for (let i = 0; i < steps.length; i++) {
      const st = steps[i]!
      if (doneRef.current[st.id] === "skipped") continue
      const r = await resolve(i)
      if (!r.ok) return showErrors(i, r)
      markDone(i, "complete")
    }
    setBusy("submitting")
    setSubmitError(null)
    setAnnouncement(l.submitting)
    try {
      await onSubmit?.(valuesRef.current)
      setDir(1)
      pendingFocus.current = "heading"
      setFinished(true)
      setAnnouncement(l.successTitle)
    } catch (e) {
      const msg = e instanceof Error && e.message ? e.message : l.submitError
      setSubmitError(msg)
      setAnnouncement(msg)
    } finally {
      setBusy(null)
    }
  }

  const next = () =>
    exclusive(async () => {
      if (index === reviewIndex) return submit()
      if (index === steps.length - 1 && !review) return submit()
      const r = await resolve(index)
      if (!r.ok) return showErrors(index, r)
      markDone(index, "complete")
      move(returnToReview && review ? reviewIndex : index + 1)
    })

  const skip = () =>
    exclusive(async () => {
      if (!steps[index]?.optional) return
      markDone(index, "skipped")
      if (index === steps.length - 1 && !review) return submit()
      move(returnToReview && review ? reviewIndex : index + 1)
    })

  const back = () => {
    if (busyRef.current || finished || index === 0) return
    move(index - 1)
  }

  const reachable = (i: number) => !finished && !busy && i !== index && (i < index || navigation === "free" || i <= furthest)
  const jump = (i: number, fromReview = false) =>
    exclusive(async () => {
      if (!reachable(i)) return
      if (fromReview) setReturnToReview(true)
      if (i < index) return move(i)
      if (index !== reviewIndex) {
        const r = await resolve(index)
        if (!r.ok) return showErrors(index, r)
        markDone(index, "complete")
      }
      move(i)
    })

  const reset = () => {
    const v = defaultValues ?? ({} as V)
    setValues(v)
    setDone({})
    setErrorIds({})
    setFurthest(0)
    setErrors({})
    setStepError(null)
    setSubmitError(null)
    setReturnToReview(false)
    setFinished(false)
    setDir(-1)
    pendingFocus.current = "heading"
    setStep(0)
    setAnnouncement(l.announce(1, total, titleOf(0)))
  }

  const setValue = <K extends keyof V>(key: K, v: V[K]) => {
    setValues({ ...valuesRef.current, [key]: v })
    const k = String(key)
    if (errors[k])
      setErrors((e) => {
        const rest = { ...e }
        delete rest[k]
        return rest
      })
  }

  const statusOf = (i: number): Status => {
    const id = i === reviewIndex ? "" : (steps[i]?.id ?? "")
    if (finished) return done[id] === "skipped" ? "skipped" : "complete"
    if (i === index) return errorIds[id] ? "error" : "current"
    if (errorIds[id]) return "error"
    if (done[id]) return done[id]
    return "upcoming"
  }
  const statusText = (st: Status) => (st === "complete" ? l.complete : st === "skipped" ? l.skipped : st === "error" ? l.hasErrors : st === "current" ? l.current : "")

  const dot = (i: number) => {
    const st = statusOf(i)
    const ic = i === reviewIndex ? null : steps[i]?.icon
    return (
      <span data-status={st} className={cn("pc-msf-dot grid shrink-0 place-items-center rounded-full font-semibold tabular-nums", s.dot)} aria-hidden="true">
        {st === "complete" ? <Check /> : st === "error" ? "!" : st === "skipped" ? "–" : (ic ?? i + 1)}
      </span>
    )
  }

  const all = Array.from({ length: total }, (_, i) => ({ i, title: titleOf(i), optional: i === reviewIndex ? false : !!steps[i]?.optional }))
  const vertical = header === "vertical"

  const stepButton = (i: number, title: string, optional: boolean, inline: boolean) => (
    <button
      type="button"
      disabled={!reachable(i)}
      aria-current={i === index && !finished ? "step" : undefined}
      onClick={() => jump(i)}
      className={cn(
        "pc-press pc-msf-step flex min-w-0 items-center gap-2.5 rounded-md text-start outline-none focus-visible:ring-3 focus-visible:ring-[color-mix(in_oklab,var(--pc-c)_40%,transparent)] enabled:cursor-pointer",
        s.text,
      )}
    >
      {dot(i)}
      <span className={cn("min-w-0", inline && "max-sm:sr-only")}>
        <span className={cn("pc-msf-name block font-medium", inline ? "max-w-[10rem] truncate" : "")}>{title}</span>
        {optional && <span className="pc-msf-muted block text-[11px] leading-tight font-normal">{l.optional}</span>}
      </span>
      {statusText(statusOf(i)) && <span className="sr-only">, {statusText(statusOf(i))}</span>}
    </button>
  )

  const headerNode =
    header === "numbered" ? (
      <nav aria-label={l.progress} data-slot="msf-header">
        <ol className="flex items-center gap-2">
          {all.map(({ i, title, optional }) => (
            <li key={i} className={cn("flex min-w-0 items-center gap-2", i < total - 1 ? "flex-1" : "shrink-0")}>
              {stepButton(i, title, optional, true)}
              {i < total - 1 && (
                <span className="pc-msf-line h-0.5 min-w-3 flex-1 overflow-hidden rounded-full" aria-hidden="true">
                  <span data-done={statusOf(i) === "complete" || statusOf(i) === "skipped" ? "" : undefined} />
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    ) : header === "progress" ? (
      <div data-slot="msf-header" className="flex flex-col gap-2">
        <div className={cn("flex items-baseline justify-between gap-3", s.text)}>
          <span className="min-w-0 truncate font-medium">{finished ? l.successTitle : titleOf(index)}</span>
          <span className="pc-msf-muted shrink-0 tabular-nums">{l.stepOf(finished ? total : index + 1, total)}</span>
        </div>
        <div className="pc-msf-bar h-1.5 overflow-hidden rounded-full" aria-hidden="true">
          <span className="block h-full w-full rounded-full" style={{ transform: `scaleX(${finished ? 1 : (index + 1) / total})` }} />
        </div>
      </div>
    ) : vertical ? (
      <nav aria-label={l.progress} data-slot="msf-header" className="pc-msf-sep sm:border-e sm:pe-5">
        <ol className="flex flex-col gap-1">
          {all.map(({ i, title, optional }) => (
            <li key={i} className="relative pb-3 last:pb-0">
              {i < total - 1 && (
                <span
                  className="pc-msf-line absolute w-0.5 overflow-hidden rounded-full"
                  data-axis="y"
                  aria-hidden="true"
                  style={{ insetInlineStart: s.dotPx / 2 - 1, top: s.dotPx + 4, bottom: 0 }}
                >
                  <span data-done={statusOf(i) === "complete" || statusOf(i) === "skipped" ? "" : undefined} />
                </span>
              )}
              {stepButton(i, title, optional, false)}
            </li>
          ))}
        </ol>
      </nav>
    ) : null

  const dirX = (rtl ? -1 : 1) * 28
  const t: Transition = reduce || transition === "none" ? { duration: 0 } : spring.ui
  const variants = {
    enter: (d: 1 | -1) => (transition === "slide" && !reduce ? { opacity: 0, x: d * dirX } : transition === "fade" && !reduce ? { opacity: 0, y: 6 } : { opacity: 1 }),
    center: { opacity: 1, x: 0, y: 0 },
    exit: (d: 1 | -1) =>
      transition === "slide" && !reduce
        ? { opacity: 0, x: -d * dirX, transition: { duration: 0.14 } }
        : transition === "fade" && !reduce
          ? { opacity: 0, transition: { duration: 0.12 } }
          : { opacity: 1, transition: { duration: 0 } },
  }

  const currentStep = index === reviewIndex ? null : steps[index]
  const ctx: StepContext<V> = {
    values,
    setValue,
    errors,
    error: (k) => errors[k],
    step: index,
    next: () => void next(),
    back,
    goTo: (i) => void jump(i),
  }
  const isFinal = index === reviewIndex || (!review && index === steps.length - 1)
  const fmt = (v: unknown): React.ReactNode => {
    if (v == null || v === "" || (Array.isArray(v) && v.length === 0)) return <span className="pc-msf-muted">{l.empty}</span>
    if (typeof v === "boolean") return v ? l.yes : l.no
    if (Array.isArray(v)) return v.join(", ")
    if (typeof v === "object") return React.isValidElement(v) ? v : JSON.stringify(v)
    return String(v)
  }
  const btnVariant = variant === "neo" ? "neo" : "solid"

  const body = finished ? (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      {typeof success === "function" ? (
        <div ref={setHeading} tabIndex={-1} className="w-full outline-none">
          {success({ values, reset })}
        </div>
      ) : success ? (
        <div ref={setHeading} tabIndex={-1} className="w-full outline-none">
          {success}
        </div>
      ) : (
        <>
          <motion.span
            initial={reduce ? false : { scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={reduce ? { duration: 0 } : spring.play}
            className="pc-msf-ok grid size-14 place-items-center rounded-full [&_svg]:size-7"
          >
            <Check />
          </motion.span>
          <Heading ref={setHeading} tabIndex={-1} id={`${uid}-title`} className={cn("font-semibold tracking-tight outline-none", s.title)}>
            {l.successTitle}
          </Heading>
          <p className={cn("pc-msf-muted max-w-sm", s.text)}>{l.successText}</p>
          <Button type="button" variant="outline" tone="neutral" size={s.btn} onClick={reset} className="mt-2">
            {l.startOver}
          </Button>
        </>
      )}
    </div>
  ) : (
    <div className={cn("flex flex-col", s.gap)}>
      <div className="flex flex-col gap-1">
        {header !== "progress" && <p className="pc-msf-muted text-xs font-medium">{l.stepOf(index + 1, total)}</p>}
        <div className="flex flex-wrap items-center gap-2">
          <Heading ref={setHeading} tabIndex={-1} id={`${uid}-title`} className={cn("font-semibold tracking-tight outline-none", s.title)}>
            {titleOf(index)}
          </Heading>
          {currentStep?.optional && <span className="pc-msf-tag rounded-full px-2 py-0.5 text-[11px] font-medium">{l.optional}</span>}
        </div>
        {(currentStep ? currentStep.description : l.reviewDescription) && (
          <p className={cn("pc-msf-muted", s.text)}>{currentStep ? currentStep.description : l.reviewDescription}</p>
        )}
      </div>
      {stepError && (
        <div role="alert" className={cn("pc-msf-alert rounded-lg px-3 py-2 font-medium", s.text)}>
          {stepError}
        </div>
      )}
      {currentStep ? (
        <div data-slot="msf-fields" className="flex flex-col gap-4">
          {typeof currentStep.content === "function" ? currentStep.content(ctx) : currentStep.content}
        </div>
      ) : (
        <div data-slot="msf-review" className="flex flex-col gap-3">
          {steps.map((st, i) => {
            const rows = st.summary
              ? st.summary(values)
              : (st.fields ?? []).map((f) => ({ label: fieldLabels?.[f] ?? humanize(f), value: fmt(values[f]) }))
            return (
              <section key={st.id} aria-labelledby={`${uid}-rv-${i}`} className="pc-msf-sep rounded-lg border p-3 sm:p-4">
                <div className="flex items-center justify-between gap-3">
                  <h4 id={`${uid}-rv-${i}`} className={cn("font-semibold", s.text)}>
                    {st.title}
                    {done[st.id] === "skipped" && <span className="pc-msf-muted ms-2 font-normal">({l.skipped})</span>}
                  </h4>
                  <button
                    type="button"
                    onClick={() => jump(i, true)}
                    aria-label={l.editStep(st.title)}
                    className="pc-press pc-msf-edit shrink-0 cursor-pointer rounded-sm text-xs font-medium outline-none focus-visible:ring-3 focus-visible:ring-[color-mix(in_oklab,var(--pc-c)_40%,transparent)]"
                  >
                    {l.edit}
                  </button>
                </div>
                {rows.length > 0 && done[st.id] !== "skipped" && (
                  <dl className={cn("mt-2 grid grid-cols-[minmax(0,9rem)_1fr] gap-x-4 gap-y-1.5", s.text)}>
                    {rows.map((row) => (
                      <React.Fragment key={row.label}>
                        <dt className="pc-msf-muted truncate">{row.label}</dt>
                        <dd className="min-w-0 break-words">{row.value}</dd>
                      </React.Fragment>
                    ))}
                  </dl>
                )}
              </section>
            )
          })}
        </div>
      )}
      {submitError && (
        <div role="alert" className={cn("pc-msf-alert rounded-lg px-3 py-2 font-medium", s.text)}>
          {submitError}
        </div>
      )}
      <div data-slot="msf-actions" className="pc-msf-sep flex flex-wrap items-center gap-2 border-t pt-4">
        <Button
          type="button"
          variant="ghost"
          tone="neutral"
          size={s.btn}
          onClick={back}
          disabled={!!busy}
          className={cn(index === 0 && "invisible")}
          iconLeft={<ArrowLeft className="rtl:rotate-180" />}
        >
          {l.back}
        </Button>
        <span className="flex-1" />
        {currentStep?.optional && (
          <Button type="button" variant="ghost" tone="neutral" size={s.btn} onClick={() => void skip()} disabled={!!busy}>
            {l.skip}
          </Button>
        )}
        <Button type="submit" variant={btnVariant} tone={tone} size={s.btn} loading={!!busy} animation="press">
          {busy === "validating" ? l.validating : busy === "submitting" ? l.submitting : isFinal ? l.submit : returnToReview && review ? l.backToReview : l.next}
        </Button>
      </div>
    </div>
  )

  return (
    <>
      <GooduiTokens />
      <style href="pc-multi-step-form" precedence="default">
        {CSS}
      </style>
      <form
        {...props}
        ref={root}
        noValidate
        data-slot="multi-step-form"
        data-variant={variant}
        data-tone={tone}
        data-shadow={variant === "neo" ? "none" : shadow}
        data-header={header}
        aria-labelledby={props["aria-label"] ? undefined : (props["aria-labelledby"] ?? `${uid}-title`)}
        onSubmit={(e) => {
          e.preventDefault()
          if (!finished) void next()
        }}
        className={cn(
          "pc-msf grid w-full max-w-2xl min-w-0 rounded-xl",
          variant === "plain" ? "p-0" : s.pad,
          s.gap,
          vertical && "sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] sm:items-start",
          className,
        )}
      >
        {headerNode}
        <div ref={panel} className="min-w-0 overflow-x-clip">
          <AnimatePresence mode="wait" initial={false} custom={dir}>
            <motion.div key={finished ? "done" : index} custom={dir} variants={variants} initial="enter" animate="center" exit="exit" transition={t}>
              <OnMount run={runPendingFocus} />
              {body}
            </motion.div>
          </AnimatePresence>
        </div>
        <div aria-live="polite" className="sr-only">
          {announcement}
        </div>
      </form>
    </>
  )
}

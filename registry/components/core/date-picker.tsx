"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion, useIsPresent, useReducedMotion, type Transition } from "motion/react"
import { cn } from "@/lib/utils"
import { useGooduiLocale, useLabels } from "@/lib/goodui-locale"
import { GooduiTokens, spring } from "@/lib/goodui-motion"

/*
 * Date picker and calendar with no date library, independent layers:
 *   variant    outline, filled, ghost, underline, pill, neo (field and surface)   tone       accent for selection
 *   selection  solid, soft, ring (how picked days are painted)                    shape      circle, rounded, square
 *   size       sm, md, lg                                                          shadow     surface elevation
 *   animation  none, fade, slide, scale (popover open and month change)
 *   mode       single, range (two months side by side), multiple
 * Plus min/max, disabled weekdays and dates, booked days, ISO week numbers, presets, time, month/year quick switch,
 * a text field that parses typed dates in the locale's order (Intl), first day of week from the locale, popover or inline.
 * Keyboard follows the WAI-ARIA date picker dialog: arrows move by day/week, Home/End to week edges,
 * PageUp/PageDown by month (Shift: year), Enter/Space pick, Esc closes and returns focus.
 */

export type DatePickerVariant = "outline" | "filled" | "ghost" | "underline" | "pill" | "neo"
export type DatePickerTone = "primary" | "neutral" | "success" | "warning" | "danger" | "info"
export type DatePickerSize = "sm" | "md" | "lg"
export type DatePickerShadow = "none" | "sm" | "md" | "lg"
export type DatePickerAnimation = "none" | "fade" | "slide" | "scale"
export type DatePickerSelection = "solid" | "soft" | "ring"
export type DatePickerShape = "circle" | "rounded" | "square"
export type DateRange = { from: Date; to: Date | null }
export type DatePickerPreset = {
  label: string
  /** Gets today (local midnight) and returns a date (single) or a range. */
  value: (today: Date) => Date | DateRange
}

export type DatePickerLabels = {
  dialog: string
  openCalendar: string
  prevMonth: string
  nextMonth: string
  prevYear: string
  nextYear: string
  prevYears: string
  nextYears: string
  chooseMonth: string
  chooseYear: string
  /** Week-number column heading (short) and its full name for screen readers. */
  week: string
  weekColumn: string
  weekNumber: (n: number) => string
  today: string
  booked: string
  unavailable: string
  clear: string
  done: string
  time: string
  startTime: string
  endTime: string
  presets: string
  invalid: string
  /** Text for several picked dates in the field. */
  selectedCount: (n: number) => string
  /** Placeholder letters for the typed format. */
  formatDay: string
  formatMonth: string
  formatYear: string
  presetToday: string
  presetTomorrow: string
  presetNextWeek: string
  presetLast7: string
  presetLast30: string
  presetThisMonth: string
  presetLastMonth: string
  presetNext7: string
}
const DEFAULT_LABELS: DatePickerLabels = {
  dialog: "Choose date",
  openCalendar: "Open calendar",
  prevMonth: "Previous month",
  nextMonth: "Next month",
  prevYear: "Previous year",
  nextYear: "Next year",
  prevYears: "Previous 12 years",
  nextYears: "Next 12 years",
  chooseMonth: "Choose month and year",
  chooseYear: "Choose year",
  week: "Wk",
  weekColumn: "Week number",
  weekNumber: (n) => `Week ${n}`,
  today: "Today",
  booked: "Booked",
  unavailable: "Unavailable",
  clear: "Clear",
  done: "Done",
  time: "Time",
  startTime: "Start time",
  endTime: "End time",
  presets: "Presets",
  invalid: "Not a valid date",
  selectedCount: (n) => (n === 1 ? "1 date" : `${n} dates`),
  formatDay: "DD",
  formatMonth: "MM",
  formatYear: "YYYY",
  presetToday: "Today",
  presetTomorrow: "Tomorrow",
  presetNextWeek: "In a week",
  presetLast7: "Last 7 days",
  presetLast30: "Last 30 days",
  presetThisMonth: "This month",
  presetLastMonth: "Last month",
  presetNext7: "Next 7 days",
}

type Base = Omit<React.ComponentProps<"div">, "defaultValue" | "onChange" | "children"> & {
  /** BCP 47 locale for names, digits, the typed format and the first day of the week. Defaults to the GooduiLocaleProvider language, else en-US. */
  locale?: string
  /** 0 = Sunday … 6 = Saturday. Defaults to the locale's first day (Intl.Locale week info), else Monday (Sunday for en-US). */
  weekStartsOn?: number
  /** Earliest selectable day. */
  min?: Date
  /** Latest selectable day. */
  max?: Date
  /** Days that cannot be picked: a list of dates or a test function. */
  disabledDays?: Date[] | ((date: Date) => boolean)
  /** Weekdays that cannot be picked (0 = Sunday), e.g. [0, 6] for weekends. */
  disabledWeekdays?: number[]
  /** Days shown as booked (struck through) and not pickable. A range cannot span a booked or disabled day. */
  booked?: Date[] | ((date: Date) => boolean)
  /** ISO week numbers in a first column. */
  weekNumbers?: boolean
  /** Months shown side by side. Default: 2 for range on wide screens, else 1. */
  months?: 1 | 2
  /** true for the built-in presets of the mode, or your own list. */
  presets?: boolean | DatePickerPreset[]
  /** Adds time inputs (single: one, range: start and end). */
  time?: boolean
  /** Minute step of the time inputs. */
  minuteStep?: number
  /** Render the calendar on the page instead of a field with a popover. */
  inline?: boolean
  /** Field placeholder. Defaults to the locale's format, e.g. MM/DD/YYYY. */
  placeholder?: string
  /** Field style and surface: outline (default), filled, ghost, underline, pill or neo. */
  variant?: DatePickerVariant
  /** Accent for picked days, range band, today dot and focus. */
  tone?: DatePickerTone
  /** How picked days are painted: solid fill, soft tint or ring. */
  selection?: DatePickerSelection
  /** Day cell shape. */
  shape?: DatePickerShape
  size?: DatePickerSize
  /** Surface shadow (popover and inline calendar). */
  shadow?: DatePickerShadow
  /** Popover open and month change: slide (default), fade, scale or none. Reduced motion: fade only. */
  animation?: DatePickerAnimation
  /** × button in the field. */
  clearable?: boolean
  /** Close the popover after a full pick (single day, or range end) when there is no time input. */
  closeOnSelect?: boolean
  disabled?: boolean
  invalid?: boolean
  /** Displayed month (controlled), any day in it. */
  month?: Date
  defaultMonth?: Date
  onMonthChange?: (month: Date) => void
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Hidden input(s) with ISO dates (yyyy-mm-dd, or with time yyyy-mm-ddThh:mm) for form posts. */
  name?: string
  /** Names the field or the inline calendar. */
  "aria-label"?: string
  /** Goes on the text input, so <label htmlFor> works. */
  id?: string
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<DatePickerLabels>
}
export type DatePickerSingleProps = Base & { mode?: "single"; value?: Date | null; defaultValue?: Date | null; onValueChange?: (value: Date | null) => void }
export type DatePickerRangeProps = Base & {
  mode: "range"
  /** to is null while the end is being picked. */
  value?: DateRange | null
  defaultValue?: DateRange | null
  onValueChange?: (value: DateRange | null) => void
}
export type DatePickerMultipleProps = Base & { mode: "multiple"; value?: Date[]; defaultValue?: Date[]; onValueChange?: (value: Date[]) => void }
export type DatePickerProps = DatePickerSingleProps | DatePickerRangeProps | DatePickerMultipleProps

const CSS = `
.pc-dp{--pc-c:var(--primary);--pc-fg:var(--primary-foreground)}
.pc-dp[data-tone=neutral]{--pc-c:var(--foreground);--pc-fg:var(--background)}
.pc-dp[data-tone=success]{--pc-c:oklch(0.53 0.13 155);--pc-fg:#fff}
.pc-dp[data-tone=warning]{--pc-c:oklch(0.75 0.16 70);--pc-fg:oklch(0.25 0.05 70)}
.pc-dp[data-tone=danger]{--pc-c:oklch(0.56 0.21 27);--pc-fg:#fff}
.pc-dp[data-tone=info]{--pc-c:oklch(0.55 0.17 250);--pc-fg:#fff}
.dark .pc-dp[data-tone=success]{--pc-c:oklch(0.7 0.16 155);--pc-fg:oklch(0.2 0.05 155)}
.dark .pc-dp[data-tone=danger]{--pc-c:oklch(0.68 0.2 25);--pc-fg:oklch(0.2 0.05 25)}
.dark .pc-dp[data-tone=info]{--pc-c:oklch(0.7 0.15 245);--pc-fg:oklch(0.2 0.05 245)}
.pc-dp{--pc-tint:color-mix(in oklab,var(--pc-c) 14%,transparent);--pc-ink:color-mix(in oklab,var(--pc-c) 82%,var(--foreground))}
.pc-dp[data-tone=warning]{--pc-ink:color-mix(in oklab,var(--pc-c) 62%,var(--foreground))}
.pc-dp{--pc-ring:color-mix(in oklab,var(--pc-c) 32%,transparent);--pc-edge:color-mix(in oklab,var(--pc-c) 55%,var(--border));--pc-muted:color-mix(in oklab,var(--muted-foreground) 80%,var(--foreground));--pc-band:color-mix(in oklab,var(--pc-c) 13%,transparent)}
.pc-dp[data-tone=neutral],.pc-dp[data-tone=primary]{--pc-ink:var(--foreground)}

.pc-dp-field{position:relative;color:var(--foreground);transition:border-color .15s,background-color .15s,box-shadow .15s,transform .12s}
.pc-dp[data-variant=outline] .pc-dp-field,.pc-dp[data-variant=pill] .pc-dp-field{background:var(--background);border:1px solid var(--input)}
.pc-dp[data-variant=outline] .pc-dp-field:hover,.pc-dp[data-variant=pill] .pc-dp-field:hover{border-color:color-mix(in oklab,var(--pc-c) 30%,var(--input))}
.pc-dp[data-variant=filled] .pc-dp-field{background:var(--muted);border:1px solid transparent}
.pc-dp[data-variant=filled] .pc-dp-field:focus-within{background:var(--background)}
.pc-dp[data-variant=ghost] .pc-dp-field{border:1px solid transparent}
.pc-dp[data-variant=ghost] .pc-dp-field:is(:hover,:focus-within){background:var(--pc-tint)}
.pc-dp[data-variant=underline] .pc-dp-field{border-radius:0;border-bottom:1.5px solid var(--input);padding-inline:.125rem}
.pc-dp[data-variant=underline] .pc-dp-field::after{content:"";position:absolute;inset-inline:0;bottom:-1.5px;height:2px;background:var(--pc-c);transform:scaleX(0);transition:transform .25s var(--pc-ease-out)}
.pc-dp[data-variant=underline] .pc-dp-field:focus-within::after,.pc-dp[data-variant=underline][data-open] .pc-dp-field::after{transform:scaleX(1)}
.pc-dp[data-variant=neo] .pc-dp-field{background:var(--background);border:2px solid var(--foreground);box-shadow:3px 3px 0 var(--foreground)}
.pc-dp[data-variant=neo] .pc-dp-field:focus-within{outline:2px solid var(--pc-c);outline-offset:3px}
.pc-dp:is([data-variant=outline],[data-variant=filled],[data-variant=pill]) .pc-dp-field:focus-within,.pc-dp:is([data-variant=outline],[data-variant=filled],[data-variant=pill])[data-open] .pc-dp-field{border-color:var(--pc-edge);box-shadow:0 0 0 3px var(--pc-ring)}
.pc-dp[data-invalid] .pc-dp-field{border-color:oklch(0.56 0.21 27)}
.pc-dp[data-variant=underline][data-invalid] .pc-dp-field::after{background:oklch(0.56 0.21 27);transform:scaleX(1)}
.pc-dp-input::placeholder{color:var(--pc-muted);opacity:1}
.pc-dp-muted{color:var(--pc-muted)}

.pc-dp-surface{background:var(--popover);color:var(--popover-foreground);border:1px solid var(--border)}
.pc-dp[data-inline] .pc-dp-surface{background:var(--card);color:var(--card-foreground)}
.pc-dp[data-variant=neo] .pc-dp-surface{border:2px solid var(--foreground);box-shadow:4px 4px 0 var(--foreground)!important}
.pc-dp[data-shadow=sm] .pc-dp-surface{box-shadow:0 2px 6px -1px rgb(0 0 0/.12)}
.pc-dp[data-shadow=md] .pc-dp-surface{box-shadow:0 16px 40px -12px rgb(0 0 0/.25),0 4px 10px -4px rgb(0 0 0/.08)}
.pc-dp[data-shadow=lg] .pc-dp-surface{box-shadow:0 28px 60px -16px rgb(0 0 0/.34),0 6px 14px -6px rgb(0 0 0/.12)}
.dark .pc-dp:is([data-shadow=md],[data-shadow=lg]) .pc-dp-surface{box-shadow:0 18px 44px -12px rgb(0 0 0/.65),0 0 0 1px rgb(255 255 255/.04)}
.pc-dp-nav{color:var(--pc-muted)}
.pc-dp-nav:hover:not(:disabled){background:var(--accent);color:var(--foreground)}
.pc-dp-nav:disabled{opacity:.35;cursor:not-allowed}
.pc-dp-cap:hover{background:var(--accent)}
.pc-dp :is(.pc-dp-nav,.pc-dp-cap,.pc-dp-chip,.pc-dp-cell-btn,.pc-dp-foot):focus-visible{outline:2px solid var(--pc-c);outline-offset:1px}
.pc-dp-wd{color:var(--pc-muted)}
.pc-dp-wk{color:var(--pc-muted);font-variant-numeric:tabular-nums}

.pc-dp-day{color:var(--foreground);position:relative;font-variant-numeric:tabular-nums;transition:background-color .12s,color .12s,box-shadow .12s}
.pc-dp-day:hover:not([aria-disabled=true]){background:color-mix(in oklab,var(--pc-c) 10%,var(--accent))}
.pc-dp-day[data-outside]{color:var(--pc-muted);font-weight:400}
.pc-dp-day[data-today]::after{content:"";position:absolute;bottom:14%;inset-inline-start:50%;width:4px;height:4px;margin-inline-start:-2px;border-radius:9999px;background:var(--pc-c)}
.pc-dp-day[aria-disabled=true]{color:var(--pc-muted);opacity:.4;cursor:not-allowed}
.pc-dp-day[data-booked]{opacity:1;color:var(--pc-muted);text-decoration:line-through;text-decoration-thickness:1.5px;text-decoration-color:color-mix(in oklab,oklch(0.6 0.2 27) 70%,transparent);background:repeating-linear-gradient(135deg,transparent 0 5px,color-mix(in oklab,var(--foreground) 6%,transparent) 5px 6px)}
.pc-dp-day:focus-visible{outline:2px solid var(--pc-c);outline-offset:1px;z-index:1}
.pc-dp-cell[data-band]{background:var(--pc-band)}
.pc-dp-cell[data-band=start]{background:linear-gradient(to right,transparent 50%,var(--pc-band) 50%)}
.pc-dp-cell[data-band=end]{background:linear-gradient(to left,transparent 50%,var(--pc-band) 50%)}
.pc-dp-cell[data-band=start]:dir(rtl){background:linear-gradient(to left,transparent 50%,var(--pc-band) 50%)}
.pc-dp-cell[data-band=end]:dir(rtl){background:linear-gradient(to right,transparent 50%,var(--pc-band) 50%)}
.pc-dp-cell[data-band=solo]{background:none}
.pc-dp-cell[data-preview]{--pc-band:color-mix(in oklab,var(--pc-c) 7%,transparent)}
.pc-dp-cell[data-band]>.pc-dp-day{color:var(--pc-ink)}
.pc-dp[data-sel=solid] .pc-dp-day[data-selected]{background:var(--pc-c);color:var(--pc-fg);font-weight:600}
.pc-dp[data-sel=solid] .pc-dp-day[data-selected]::after{background:var(--pc-fg)}
.pc-dp[data-sel=soft] .pc-dp-day[data-selected]{background:color-mix(in oklab,var(--pc-c) 24%,var(--background));color:var(--pc-ink);font-weight:600}
.pc-dp[data-sel=ring] .pc-dp-day[data-selected]{box-shadow:inset 0 0 0 2px var(--pc-c);color:var(--pc-ink);font-weight:600;background:var(--background)}
.pc-dp-chip{color:var(--foreground)}
.pc-dp-chip:hover{background:var(--accent)}
.pc-dp-chip[aria-pressed=true]{background:var(--pc-tint);color:var(--pc-ink);font-weight:500}
.pc-dp-cell-btn{color:var(--foreground)}
.pc-dp-cell-btn:hover:not(:disabled){background:var(--accent)}
.pc-dp-cell-btn[aria-current=true]{box-shadow:inset 0 0 0 1px var(--pc-edge)}
.pc-dp-cell-btn[aria-pressed=true]{background:var(--pc-c);color:var(--pc-fg)}
.pc-dp-cell-btn:disabled{opacity:.35;cursor:not-allowed}
.pc-dp-time{background:var(--background);border:1px solid var(--input);color:var(--foreground);color-scheme:light dark}
.pc-dp-time:focus{outline:none;border-color:var(--pc-edge);box-shadow:0 0 0 3px var(--pc-ring)}
.pc-dp-foot{color:var(--foreground)}
.pc-dp-foot[data-primary]{background:var(--pc-c);color:var(--pc-fg)}
.pc-dp-foot:not([data-primary]):hover{background:var(--accent)}
@media (prefers-reduced-motion:reduce){.pc-dp-field,.pc-dp-field::after,.pc-dp-day{transition:none!important}}
`

const SIZES = {
  sm: { cell: "size-8 text-xs", field: "min-h-8 px-2.5 text-sm gap-1.5", icon: "[&_svg]:size-3.5", pad: "p-2", cap: "text-sm", grid: "gap-y-0.5", mcell: "h-9 text-xs" },
  md: { cell: "size-9 text-sm", field: "min-h-10 px-3 text-sm gap-2", icon: "[&_svg]:size-4", pad: "p-3", cap: "text-sm", grid: "gap-y-1", mcell: "h-10 text-sm" },
  lg: { cell: "size-11 text-base", field: "min-h-12 px-4 text-base gap-2.5", icon: "[&_svg]:size-[18px]", pad: "p-4", cap: "text-base", grid: "gap-y-1", mcell: "h-12 text-base" },
} satisfies Record<DatePickerSize, Record<string, string>>
const SHAPES: Record<DatePickerShape, string> = { circle: "rounded-full", rounded: "rounded-md", square: "rounded-none" }
const RADIUS: Record<DatePickerVariant, string> = { outline: "rounded-lg", filled: "rounded-lg", ghost: "rounded-lg", underline: "rounded-none", pill: "rounded-full", neo: "rounded-md" }
const SURFACE_RADIUS: Record<DatePickerVariant, string> = { outline: "rounded-xl", filled: "rounded-xl", ghost: "rounded-xl", underline: "rounded-lg", pill: "rounded-2xl", neo: "rounded-md" }

/* ---------- date math (local time, no library) ---------- */

const sod = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, d.getHours(), d.getMinutes())
const som = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1)
const daysIn = (y: number, m: number) => new Date(y, m + 1, 0).getDate()
function addMonths(d: Date, n: number) {
  const t = new Date(d.getFullYear(), d.getMonth() + n, 1)
  return new Date(t.getFullYear(), t.getMonth(), Math.min(d.getDate(), daysIn(t.getFullYear(), t.getMonth())), d.getHours(), d.getMinutes())
}
const num = (d: Date) => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
const mIndex = (d: Date) => d.getFullYear() * 12 + d.getMonth()
const same = (a: Date | null | undefined, b: Date | null | undefined) => !!a && !!b && num(a) === num(b)
const pad2 = (n: number) => String(n).padStart(2, "0")
const iso = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
const hhmm = (d: Date) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
const withTime = (d: Date, t: string) => {
  const [h, m] = t.split(":").map(Number)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), h ?? 0, m ?? 0)
}
function isoWeek(d: Date) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const day = t.getUTCDay() || 7
  t.setUTCDate(t.getUTCDate() + 4 - day)
  const y0 = Date.UTC(t.getUTCFullYear(), 0, 1)
  return Math.ceil(((t.getTime() - y0) / 86400000 + 1) / 7)
}

function localeWeekStart(locale: string) {
  try {
    const loc = new Intl.Locale(locale) as Intl.Locale & { getWeekInfo?: () => { firstDay: number }; weekInfo?: { firstDay: number } }
    const info = loc.getWeekInfo?.() ?? loc.weekInfo
    if (info) return info.firstDay % 7
  } catch {
    /* fall through */
  }
  return /-(US|CA|JP|BR|MX|IL|PH|KR|TW|HK|IN|SA|ZA)$/i.test(locale) || locale === "en" ? 0 : 1
}

/* ---------- Intl formatting and typed-date parsing ---------- */

function makeIntl(locale: string) {
  const numeric = new Intl.DateTimeFormat(locale, { year: "numeric", month: "2-digit", day: "2-digit" })
  const parts = numeric.formatToParts(new Date(2026, 10, 23))
  const order = parts.filter((p) => p.type === "day" || p.type === "month" || p.type === "year").map((p) => p.type as "day" | "month" | "year")
  const digits = new Map<string, string>()
  const nf = new Intl.NumberFormat(locale, { useGrouping: false })
  for (let i = 0; i < 10; i++) digits.set(nf.format(i), String(i))
  const toLatin = (s: string) => s.replace(/\p{Nd}/gu, (ch) => digits.get(ch) ?? ch)
  const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\./g, "")
  const monthNames: { name: string; m: number }[] = []
  for (const style of ["long", "short"] as const) {
    const f = new Intl.DateTimeFormat(locale, { month: style })
    for (let m = 0; m < 12; m++) monthNames.push({ name: fold(f.format(new Date(2026, m, 15))), m })
  }
  const time = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" })

  /** Parses "11/23/2026", "23.11.2026", "2026-11-23", "Nov 23 2026", "23 noviembre", optionally followed by a time. */
  const parse = (input: string, today: Date, fallbackTime = "00:00"): Date | null => {
    let s = toLatin(input).trim()
    if (!s) return null
    let hours: number | null = null
    let minutes = 0
    const tm = s.match(/(\d{1,2})[:.h](\d{2})\s*([ap])?\.?\s*m?\.?\s*$/i)
    if (tm && s.length > tm[0].length) {
      hours = Number(tm[1]) % 24
      minutes = Number(tm[2])
      if (tm[3]?.toLowerCase() === "p" && hours < 12) hours += 12
      if (tm[3]?.toLowerCase() === "a" && hours === 12) hours = 0
      s = s.slice(0, tm.index).trim()
    }
    let y: number | undefined
    let m: number | undefined
    let d: number | undefined
    const isoMatch = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
    if (isoMatch) {
      y = Number(isoMatch[1])
      m = Number(isoMatch[2]) - 1
      d = Number(isoMatch[3])
    } else {
      const tokens = s.split(/[^\p{L}\p{N}]+/u).filter(Boolean)
      const words = tokens.filter((t) => /\p{L}/u.test(t))
      const nums = tokens.filter((t) => /^\d+$/.test(t))
      if (words.length) {
        const w = fold(words[0]!)
        const hit = w.length >= 3 ? monthNames.find((x) => x.name.startsWith(w) || (x.name.length >= 3 && w.startsWith(x.name))) : undefined
        if (!hit) return null
        m = hit.m
        const yi = nums.findIndex((n) => n.length >= 3 || Number(n) > 31)
        if (yi >= 0) y = Number(nums[yi])
        d = Number(nums.find((_, i) => i !== yi))
      } else if (nums.length === 1 && (nums[0]!.length === 8 || nums[0]!.length === 6)) {
        const n = nums[0]!
        const yl = n.length === 8 ? 4 : 2
        let at = 0
        for (const k of order) {
          const len = k === "year" ? yl : 2
          const v = Number(n.slice(at, at + len))
          at += len
          if (k === "day") d = v
          else if (k === "month") m = v - 1
          else y = v
        }
      } else if (nums.length >= 2) {
        const keys = nums.length >= 3 ? order : order.filter((k) => k !== "year")
        keys.forEach((k, i) => {
          const v = Number(nums[i])
          if (k === "day") d = v
          else if (k === "month") m = v - 1
          else y = v
        })
      } else return null
    }
    if (y === undefined) y = today.getFullYear()
    else if (y < 100) y += 2000
    if (m === undefined || d === undefined || !Number.isFinite(d) || m < 0 || m > 11 || d < 1 || d > daysIn(y, m)) return null
    if (hours === null) return withTime(new Date(y, m, d), fallbackTime)
    return new Date(y, m, d, hours, minutes)
  }

  return {
    order,
    parts,
    parse,
    format: (d: Date) => numeric.format(d),
    formatTime: (d: Date) => time.format(d),
    caption: new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }),
    full: new Intl.DateTimeFormat(locale, { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
    short: new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }),
    dayNum: new Intl.DateTimeFormat(locale, { day: "numeric" }),
    monthShort: new Intl.DateTimeFormat(locale, { month: "short" }),
    monthLong: new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }),
    year: new Intl.DateTimeFormat(locale, { year: "numeric" }),
    wdShort: new Intl.DateTimeFormat(locale, { weekday: "short" }),
    wdNarrow: new Intl.DateTimeFormat(locale, { weekday: "narrow" }),
    wdLong: new Intl.DateTimeFormat(locale, { weekday: "long" }),
    num: (n: number) => nf.format(n),
  }
}

/* ---------- floating placement (flip + shift, no library) ---------- */

type Rect = { top: number; left: number; right: number; bottom: number; width: number; height: number }
type Placement = { x: number; y: number; side: "top" | "bottom"; maxH: number }

function place(a: Rect, w: number, h: number, rtl: boolean): Placement {
  const pad = 8
  const offset = 6
  const vw = document.documentElement.clientWidth
  const vh = window.innerHeight
  const below = vh - a.bottom - offset - pad
  const above = a.top - offset - pad
  const side = below < h && above > below ? "top" : "bottom"
  const maxH = Math.max(160, side === "bottom" ? below : above)
  const hh = Math.min(h, maxH)
  const x = rtl ? a.right - w : a.left
  return { x: Math.max(pad, Math.min(x, vw - pad - w)), y: side === "bottom" ? a.bottom + offset : a.top - offset - hh, side, maxH }
}

function usePlacement(open: boolean, anchor: React.RefObject<HTMLElement | null>, surface: React.RefObject<HTMLElement | null>, rtl: boolean) {
  const [p, setP] = React.useState<Placement | null>(null)
  React.useLayoutEffect(() => {
    if (!open) return
    const update = () => {
      const el = surface.current
      const a = anchor.current?.getBoundingClientRect()
      if (!el || !a) return
      const next = place(a, el.offsetWidth, el.scrollHeight + (el.offsetHeight - el.clientHeight), rtl)
      setP((prev) => (prev && Math.abs(prev.x - next.x) < 0.5 && Math.abs(prev.y - next.y) < 0.5 && prev.side === next.side && prev.maxH === next.maxH ? prev : next))
    }
    update()
    let raf = 0
    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(update)
    }
    window.addEventListener("scroll", schedule, true)
    window.addEventListener("resize", schedule)
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule)
    if (surface.current) ro?.observe(surface.current)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("scroll", schedule, true)
      window.removeEventListener("resize", schedule)
      ro?.disconnect()
    }
  }, [open, anchor, surface, rtl, !!p])
  return p
}

/* ---------- icons ---------- */

const Chevron = ({ dir, className }: { dir: "start" | "end" | "down"; className?: string }) => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className={cn(dir === "start" && "rtl:rotate-180", dir === "end" && "rotate-180 rtl:rotate-0", className)}>
    <path d={dir === "down" ? "m4 6 4 4 4-4" : "m10 4-4 4 4 4"} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const CalendarIcon = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...p}>
    <rect x="2.25" y="3.25" width="11.5" height="10.5" rx="2" stroke="currentColor" strokeWidth="1.4" />
    <path d="M2.5 6.5h11M5.5 2v2.5M10.5 2v2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
)
const Cross = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...p}>
    <path d="M4.5 4.5 11.5 11.5M11.5 4.5 4.5 11.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
  </svg>
)

/* ---------- a month grid (aware of its exit animation, so focus never lands in a leaving grid) ---------- */

type DayInfo = { date: Date; outside: boolean }
type GridProps = {
  month: Date
  weekStartsOn: number
  render: (info: DayInfo, exiting: boolean) => React.ReactNode
  head: React.ReactNode
  weekNumbers: boolean
  hideOutside: boolean
  labelledBy: string
  fmtWeek: (n: number) => string
  weekLabel: (n: number) => string
  onKeyDown: (e: React.KeyboardEvent<HTMLTableElement>) => void
  onPointerLeave: () => void
  rowClass: string
}
function MonthGrid({ month, weekStartsOn, render, head, weekNumbers, hideOutside, labelledBy, fmtWeek, weekLabel, onKeyDown, onPointerLeave, rowClass }: GridProps) {
  const exiting = !useIsPresent()
  const first = som(month)
  const lead = (first.getDay() - weekStartsOn + 7) % 7
  const start = addDays(first, -lead)
  const rows: DayInfo[][] = []
  for (let r = 0; r < 6; r++) {
    const row: DayInfo[] = []
    for (let c = 0; c < 7; c++) {
      const date = addDays(start, r * 7 + c)
      row.push({ date, outside: date.getMonth() !== month.getMonth() })
    }
    rows.push(row)
  }
  return (
    <table role="grid" aria-labelledby={labelledBy} className="w-full border-collapse" onKeyDown={onKeyDown} onPointerLeave={onPointerLeave} data-exiting={exiting ? "" : undefined} inert={exiting || undefined}>
      <thead>{head}</thead>
      <tbody>
        {rows.map((row, r) => {
          const monday = row[(1 - weekStartsOn + 7) % 7]!.date
          const wn = isoWeek(monday)
          return (
            <tr key={r} className={rowClass}>
              {weekNumbers && (
                <th scope="row" aria-label={weekLabel(wn)} className="pc-dp-wk w-8 text-center text-[11px] font-normal">
                  {fmtWeek(wn)}
                </th>
              )}
              {row.map((info) => (hideOutside && info.outside ? <td key={info.date.getTime()} role="gridcell" className="p-0" /> : <React.Fragment key={info.date.getTime()}>{render(info, exiting)}</React.Fragment>))}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

/* ---------- component ---------- */

export function DatePicker(props: DatePickerProps) {
  const {
    mode = "single",
    locale: localeProp,
    weekStartsOn: weekProp,
    min,
    max,
    disabledDays,
    disabledWeekdays,
    booked,
    weekNumbers = false,
    months: monthsProp,
    presets: presetsProp,
    time = false,
    minuteStep = 15,
    inline = false,
    placeholder,
    variant = "outline",
    tone = "primary",
    selection = "solid",
    shape = "circle",
    size = "md",
    shadow = "md",
    animation = "slide",
    clearable,
    closeOnSelect = true,
    disabled,
    invalid,
    month: monthProp,
    defaultMonth,
    onMonthChange,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    name,
    value: valueProp,
    defaultValue,
    onValueChange,
    "aria-label": ariaLabel,
    id: idProp,
    labels,
    className,
    ...rest
  } = props
  const l = useLabels("date-picker", DEFAULT_LABELS, labels)
  const { lang } = useGooduiLocale()
  const locale = localeProp ?? lang
  const prefersReduced = useReducedMotion()
  const [mounted, setMounted] = React.useState(false)
  const [today, setToday] = React.useState<Date | null>(null)
  const [wide, setWide] = React.useState(true)
  React.useEffect(() => {
    setMounted(true)
    setToday(sod(new Date()))
    const mq = window.matchMedia("(min-width: 640px)")
    setWide(mq.matches)
    const on = () => setWide(mq.matches)
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])
  const reduce = mounted && !!prefersReduced
  const uid = React.useId()
  const inputId = idProp ?? uid + "-input"
  const dialogId = uid + "-dialog"

  const intl = React.useMemo(() => makeIntl(locale), [locale])
  const weekStartsOn = ((weekProp ?? localeWeekStart(locale)) % 7 + 7) % 7
  const shown = monthsProp ?? (mode === "range" && wide ? 2 : 1)

  /* rules */
  const listSet = (v: Date[] | ((d: Date) => boolean) | undefined) => (Array.isArray(v) ? new Set(v.map(num)) : null)
  const disabledSet = React.useMemo(() => listSet(disabledDays), [disabledDays])
  const bookedSet = React.useMemo(() => listSet(booked), [booked])
  const minN = min ? num(min) : -Infinity
  const maxN = max ? num(max) : Infinity
  const outOfRange = (d: Date) => num(d) < minN || num(d) > maxN
  const isDisabled = (d: Date) =>
    outOfRange(d) || !!disabledWeekdays?.includes(d.getDay()) || (disabledSet ? disabledSet.has(num(d)) : typeof disabledDays === "function" && disabledDays(d))
  const isBooked = (d: Date) => (bookedSet ? bookedSet.has(num(d)) : typeof booked === "function" && booked(d))
  const blocked = (d: Date) => isDisabled(d) || isBooked(d)

  /* value */
  type V = Date | DateRange | Date[] | null
  const [inner, setInner] = React.useState<V | undefined>(defaultValue)
  const value: V = valueProp !== undefined ? valueProp : (inner ?? (mode === "multiple" ? [] : null))
  const single = mode === "single" ? (value as Date | null) : null
  const range = mode === "range" ? (value as DateRange | null) : null
  const multi = mode === "multiple" ? ((value as Date[] | null) ?? []) : []
  const commit = (v: V) => {
    if (valueProp === undefined) setInner(v)
    ;(onValueChange as ((v: V) => void) | undefined)?.(v)
  }

  /* open */
  const [openInner, setOpenInner] = React.useState(defaultOpen)
  const open = !inline && (openProp ?? openInner) && !disabled
  const setOpen = (o: boolean) => {
    if (o === open) return
    if (openProp === undefined) setOpenInner(o)
    onOpenChange?.(o)
  }

  /* month */
  const valueAnchor = single ?? range?.from ?? multi[multi.length - 1] ?? null
  const [monthInner, setMonthInner] = React.useState<Date | null>(() => (defaultMonth ? som(defaultMonth) : valueAnchor ? som(valueAnchor) : null))
  const month = monthProp ? som(monthProp) : (monthInner ?? (today ? som(today) : null))
  const [dir, setDir] = React.useState<1 | -1>(1)
  const setMonth = (m: Date) => {
    const next = som(m)
    if (month && mIndex(next) === mIndex(month)) return
    setDir(month && mIndex(next) < mIndex(month) ? -1 : 1)
    if (!monthProp) setMonthInner(next)
    onMonthChange?.(next)
  }
  const minMonth = min ? mIndex(min) : -Infinity
  const maxMonth = max ? mIndex(max) : Infinity

  /* focus, hover, view */
  const [focused, setFocused] = React.useState<Date | null>(null)
  const [hover, setHover] = React.useState<Date | null>(null)
  const [view, setView] = React.useState<"days" | "months" | "years">("days")
  const [viewOffset, setViewOffset] = React.useState(0)
  const kb = React.useRef(false)
  const root = React.useRef<HTMLDivElement>(null)
  const field = React.useRef<HTMLDivElement>(null)
  const input = React.useRef<HTMLInputElement>(null)
  const button = React.useRef<HTMLButtonElement>(null)
  const surface = React.useRef<HTMLDivElement>(null)
  const returnTo = React.useRef<HTMLElement | null>(null)
  const [rtl, setRtl] = React.useState(false)
  React.useEffect(() => {
    if (root.current) setRtl(getComputedStyle(root.current).direction === "rtl")
  }, [open, mounted])

  const clampDay = (d: Date) => (min && num(d) < minN ? sod(min) : max && num(d) > maxN ? sod(max) : d)
  const focusTarget = () => clampDay(sod(valueAnchor ?? today ?? new Date()))

  const moveFocus = (next: Date) => {
    const d = clampDay(next)
    kb.current = true
    setFocused(d)
    if (!month) return
    const first = mIndex(month)
    const last = first + shown - 1
    if (mIndex(d) < first) setMonth(d)
    else if (mIndex(d) > last) setMonth(addMonths(som(d), -(shown - 1)))
  }

  // Move DOM focus to the focused day after keyboard navigation (and when the dialog opens).
  React.useEffect(() => {
    if (!kb.current || !focused) return
    const scope = inline ? root.current : surface.current
    const btn = scope?.querySelector<HTMLElement>(`table:not([data-exiting]) [data-date="${iso(focused)}"]`)
    if (btn) {
      btn.focus({ preventScroll: true })
      // A hidden (not yet placed) popover can't take focus; try again on the next render.
      if (document.activeElement === btn) kb.current = false
    }
  })

  /* text field */
  const formatValue = (): string => {
    const f = (d: Date) => intl.format(d) + (time ? " " + intl.formatTime(d) : "")
    if (mode === "single") return single ? f(single) : ""
    if (mode === "range") return range ? `${f(range.from)} – ${range.to ? f(range.to) : ""}`.trim() : ""
    return multi.length > 3 ? l.selectedCount(multi.length) : multi.map((d) => intl.short.format(d)).join(", ")
  }
  const display = formatValue()
  const [text, setText] = React.useState<string | null>(null)
  const [bad, setBad] = React.useState(false)
  const fieldText = text ?? display
  const fmtPlaceholder =
    placeholder ??
    intl.parts
      .map((p) => (p.type === "day" ? l.formatDay : p.type === "month" ? l.formatMonth : p.type === "year" ? l.formatYear : p.type === "literal" ? p.value : ""))
      .join("")
      .replace(/[‎‏]/g, "") + (mode === "range" ? " – …" : "")

  const commitText = () => {
    if (text === null) return
    const t = text.trim()
    if (!t) {
      setText(null)
      setBad(false)
      if (mode === "multiple") commit([])
      else commit(null)
      return
    }
    const now = today ?? sod(new Date())
    const ok = (d: Date | null): d is Date => !!d && !blocked(sod(d))
    if (mode === "single") {
      const d = intl.parse(t, now, single ? hhmm(single) : singleTime)
      if (!ok(d)) return setBad(true)
      setText(null)
      setBad(false)
      commit(time ? d : sod(d))
      setMonth(d)
    } else if (mode === "range") {
      const [a, b] = t.split(/\s*[–—]\s*|\s+-\s+|\s+(?:to|bis|à|a|al|tot)\s+/i)
      const from = a ? intl.parse(a, now, range ? hhmm(range.from) : rangeTime.from) : null
      const to = b ? intl.parse(b, now, range?.to ? hhmm(range.to) : rangeTime.to) : null
      if (!ok(from) || (b && !ok(to)) || (to && num(to) < num(from))) return setBad(true)
      setText(null)
      setBad(false)
      commit({ from: time ? from : sod(from), to: to ? (time ? to : sod(to)) : null })
      setMonth(from)
    } else {
      const list = t
        .split(/\s*[;,،]\s*/)
        .map((s) => intl.parse(s, now))
        .filter((d): d is Date => ok(d))
      if (!list.length) return setBad(true)
      setText(null)
      setBad(false)
      commit(list.map(sod))
    }
  }

  /* picking */
  const [rangeTime, setRangeTime] = React.useState({ from: "09:00", to: "17:00" })
  const [singleTime, setSingleTime] = React.useState("09:00")
  const close = (focusBack = true) => {
    setOpen(false)
    setView("days")
    setHover(null)
    if (focusBack) (returnTo.current ?? button.current)?.focus({ preventScroll: true })
  }

  const pick = (d: Date) => {
    if (blocked(d)) return
    setFocused(d)
    setBad(false)
    setText(null)
    if (mode === "single") {
      commit(time ? withTime(d, single ? hhmm(single) : singleTime) : d)
      if (closeOnSelect && !time && !inline) close()
    } else if (mode === "multiple") {
      commit(multi.some((x) => same(x, d)) ? multi.filter((x) => !same(x, d)) : [...multi, d].sort((a, b) => a.getTime() - b.getTime()))
    } else {
      const tf = (x: Date, which: "from" | "to") => (time ? withTime(x, which === "from" ? (range ? hhmm(range.from) : rangeTime.from) : range?.to ? hhmm(range.to) : rangeTime.to) : x)
      if (!range || range.to || num(d) < num(range.from)) commit({ from: tf(d, "from"), to: null })
      else {
        // A range may not run across a booked or disabled day: start a new range instead.
        for (let x = addDays(sod(range.from), 1); num(x) < num(d); x = addDays(x, 1))
          if (blocked(x)) {
            commit({ from: tf(d, "from"), to: null })
            return
          }
        commit({ from: range.from, to: tf(d, "to") })
        setHover(null)
        if (closeOnSelect && !time && !inline) close()
      }
    }
  }

  const applyPreset = (pr: DatePickerPreset) => {
    const now = today ?? sod(new Date())
    const v = pr.value(now)
    setText(null)
    setBad(false)
    if (v instanceof Date) {
      if (mode === "range") commit({ from: v, to: v })
      else if (mode === "multiple") commit([v])
      else commit(time ? withTime(v, single ? hhmm(single) : singleTime) : v)
      setMonth(v)
      setFocused(v)
    } else {
      if (mode === "range") commit(v)
      else if (mode === "multiple") {
        const out: Date[] = []
        for (let x = sod(v.from); v.to && num(x) <= num(v.to); x = addDays(x, 1)) if (!blocked(x)) out.push(x)
        commit(out)
      } else commit(v.from)
      setMonth(shown === 2 && v.to && mIndex(v.to) > mIndex(v.from) ? v.from : (v.to ?? v.from))
      setFocused(v.from)
    }
    if (closeOnSelect && !time && !inline && mode !== "multiple") close()
  }

  const presets: DatePickerPreset[] = Array.isArray(presetsProp)
    ? presetsProp
    : presetsProp
      ? mode === "range"
        ? [
            { label: l.presetToday, value: (t) => ({ from: t, to: t }) },
            { label: l.presetLast7, value: (t) => ({ from: addDays(t, -6), to: t }) },
            { label: l.presetLast30, value: (t) => ({ from: addDays(t, -29), to: t }) },
            { label: l.presetThisMonth, value: (t) => ({ from: som(t), to: new Date(t.getFullYear(), t.getMonth() + 1, 0) }) },
            { label: l.presetLastMonth, value: (t) => ({ from: som(addMonths(t, -1)), to: new Date(t.getFullYear(), t.getMonth(), 0) }) },
            { label: l.presetNext7, value: (t) => ({ from: t, to: addDays(t, 6) }) },
          ]
        : [
            { label: l.presetToday, value: (t) => t },
            { label: l.presetTomorrow, value: (t) => addDays(t, 1) },
            { label: l.presetNextWeek, value: (t) => addDays(t, 7) },
          ]
      : []
  const presetActive = (pr: DatePickerPreset) => {
    if (!today) return false
    const v = pr.value(today)
    if (v instanceof Date) return mode === "single" ? same(single, v) : mode === "range" ? !!range && same(range.from, v) && same(range.to, v) : multi.length === 1 && same(multi[0], v)
    return mode === "range" && !!range && same(range.from, v.from) && same(range.to, v.to)
  }

  /* open / close */
  const openDialog = (from: HTMLElement | null) => {
    if (disabled) return
    returnTo.current = from
    const target = focusTarget()
    setView("days")
    if (!month || mIndex(target) < mIndex(month) || mIndex(target) > mIndex(month) + shown - 1) setMonth(target)
    kb.current = true
    setFocused(target)
    setOpen(true)
  }

  // Outside pointer closes the popover.
  React.useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (surface.current?.contains(t) || field.current?.contains(t)) return
      close(false)
    }
    document.addEventListener("pointerdown", onDown, true)
    return () => document.removeEventListener("pointerdown", onDown, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const p = usePlacement(open && mounted, field, surface, rtl)

  /* keyboard on the day grid */
  const onGridKey = (e: React.KeyboardEvent<HTMLTableElement>) => {
    const t = e.target as HTMLElement
    const k = t.dataset.date
    if (!k) return
    const [y, m, d] = k.split("-").map(Number)
    const cur = new Date(y!, m! - 1, d!)
    const back = rtl ? 1 : -1
    let next: Date | null = null
    switch (e.key) {
      case "ArrowLeft":
        next = addDays(cur, back)
        break
      case "ArrowRight":
        next = addDays(cur, -back)
        break
      case "ArrowUp":
        next = addDays(cur, -7)
        break
      case "ArrowDown":
        next = addDays(cur, 7)
        break
      case "Home":
        next = addDays(cur, -((cur.getDay() - weekStartsOn + 7) % 7))
        break
      case "End":
        next = addDays(cur, 6 - ((cur.getDay() - weekStartsOn + 7) % 7))
        break
      case "PageUp":
        next = addMonths(cur, e.shiftKey ? -12 : -1)
        break
      case "PageDown":
        next = addMonths(cur, e.shiftKey ? 12 : 1)
        break
      case "Enter":
      case " ":
        e.preventDefault()
        pick(cur)
        return
      default:
        return
    }
    e.preventDefault()
    moveFocus(sod(next))
    if (mode === "range" && range && !range.to) setHover(sod(next))
  }

  /* rendering helpers */
  const s = SIZES[size]
  const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2026, 0, 4 + ((weekStartsOn + i) % 7)))
  const head = (
    <tr>
      {weekNumbers && (
        <th scope="col" abbr={l.weekColumn} className="pc-dp-wk w-8 pb-1 text-[11px] font-medium">
          {l.week}
        </th>
      )}
      {weekdays.map((w) => (
        <th key={w.getDay()} scope="col" abbr={intl.wdLong.format(w)} className={cn("pc-dp-wd pb-1 text-center font-medium", size === "sm" ? "text-[11px]" : "text-xs")}>
          {size === "sm" ? intl.wdNarrow.format(w) : intl.wdShort.format(w)}
        </th>
      ))}
    </tr>
  )

  const rangeEnd = range ? (range.to ?? (hover && num(hover) >= num(range.from) ? hover : null)) : null
  const preview = !!range && !range.to && !!rangeEnd
  const tabbableKey = (() => {
    if (!month) return ""
    const f = focused ?? focusTarget()
    const first = mIndex(month)
    if (mIndex(f) >= first && mIndex(f) < first + shown) return iso(f)
    return iso(month)
  })()

  const renderDay = ({ date, outside }: DayInfo, exiting: boolean) => {
    const dis = isDisabled(date)
    const isB = isBooked(date)
    const sel = mode === "single" ? same(single, date) : mode === "multiple" ? multi.some((x) => same(x, date)) : !!range && (same(range.from, date) || same(range.to, date))
    let band: string | undefined
    if (range && rangeEnd && !outside) {
      const n = num(date)
      const a = num(range.from)
      const b = num(rangeEnd)
      if (a === b) band = undefined
      else if (n === a) band = "start"
      else if (n === b) band = "end"
      else if (n > a && n < b) band = "mid"
    }
    const isToday = same(today, date)
    const label = intl.full.format(date) + (isToday ? `, ${l.today}` : "") + (isB ? `, ${l.booked}` : dis ? `, ${l.unavailable}` : "")
    return (
      <td role="gridcell" aria-selected={sel || undefined} data-band={band} data-preview={preview && band ? "" : undefined} className="pc-dp-cell p-0 text-center">
        <button
          type="button"
          data-date={iso(date)}
          tabIndex={!exiting && !outside && iso(date) === tabbableKey ? 0 : -1}
          aria-label={label}
          aria-disabled={dis || isB || undefined}
          aria-current={isToday ? "date" : undefined}
          data-selected={sel ? "" : undefined}
          data-today={isToday ? "" : undefined}
          data-outside={outside ? "" : undefined}
          data-booked={isB ? "" : undefined}
          onClick={() => {
            if (outside && month) setMonth(date)
            pick(date)
          }}
          onFocus={() => setFocused(date)}
          onPointerEnter={() => mode === "range" && range && !range.to && setHover(date)}
          className={cn("pc-press pc-dp-day mx-auto grid place-items-center outline-none select-none", s.cell, SHAPES[shape], dis && !isB && "cursor-not-allowed")}
        >
          {intl.dayNum.format(date)}
        </button>
      </td>
    )
  }

  const t: Transition = reduce || animation === "none" ? { duration: 0 } : spring.ui
  const gridVariants = {
    enter: (d: number) => (reduce || animation === "none" ? { opacity: 1 } : animation === "fade" ? { opacity: 0 } : { opacity: 0, x: (rtl ? -d : d) * 36 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => (reduce || animation === "none" ? { opacity: 0 } : animation === "fade" ? { opacity: 0 } : { opacity: 0, x: (rtl ? -d : d) * -36 }),
  }

  const caption = (m: Date, i: number) => {
    const capId = `${uid}-cap-${i}`
    const isFirst = i === 0
    const isLast = i === shown - 1
    return (
      <div className="mb-2 flex items-center gap-1">
        {isFirst ? (
          <button type="button" className={cn("pc-press pc-dp-nav grid size-8 place-items-center rounded-md outline-none", s.icon)} aria-label={l.prevMonth} disabled={mIndex(m) <= minMonth} onClick={() => setMonth(addMonths(m, -1))}>
            <Chevron dir="start" className="size-4" />
          </button>
        ) : (
          <span className="size-8" />
        )}
        <button
          type="button"
          id={capId}
          aria-label={`${intl.caption.format(m)}, ${l.chooseMonth}`}
          onClick={() => {
            setViewOffset(i)
            setView("months")
          }}
          className={cn("pc-press pc-dp-cap mx-auto inline-flex items-center gap-1 rounded-md px-2 py-1 font-semibold outline-none", s.cap)}
        >
          <span aria-hidden="true">{intl.caption.format(m)}</span>
          <Chevron dir="down" className="pc-dp-muted size-3.5" />
        </button>
        {isLast ? (
          <button type="button" className={cn("pc-press pc-dp-nav grid size-8 place-items-center rounded-md outline-none", s.icon)} aria-label={l.nextMonth} disabled={mIndex(m) >= maxMonth} onClick={() => setMonth(addMonths(m, -(shown - 1) + 1))}>
            <Chevron dir="end" className="size-4" />
          </button>
        ) : (
          <span className="size-8" />
        )}
      </div>
    )
  }

  // Month and year quick switch grids share one keyboard handler.
  const onPickerKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const btns = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>("button[data-cell]"))
    const i = btns.indexOf(e.target as HTMLButtonElement)
    if (i < 0) return
    const step = e.key === "ArrowLeft" ? (rtl ? 1 : -1) : e.key === "ArrowRight" ? (rtl ? -1 : 1) : e.key === "ArrowUp" ? -3 : e.key === "ArrowDown" ? 3 : e.key === "Home" ? -i : e.key === "End" ? btns.length - 1 - i : 0
    if (e.key === "Escape") {
      e.preventDefault()
      e.stopPropagation()
      setView("days")
      kb.current = true
      setFocused(focused ?? focusTarget())
      return
    }
    if (!step) return
    e.preventDefault()
    let j = i + step
    while (btns[j]?.disabled) j += Math.sign(step)
    btns[Math.max(0, Math.min(btns.length - 1, j))]?.focus()
  }

  const viewMonth = month ? addMonths(month, viewOffset) : null
  const [yearPage, setYearPage] = React.useState(0)
  React.useEffect(() => {
    if (view === "years" && viewMonth) setYearPage(viewMonth.getFullYear() - 5)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view])
  // Focus the current cell when a quick-switch grid opens.
  React.useEffect(() => {
    if (view === "days") return
    const scope = inline ? root.current : surface.current
    scope?.querySelector<HTMLElement>("button[data-cell][tabindex='0']")?.focus({ preventScroll: true })
  }, [view, inline])

  const picker =
    viewMonth && view !== "days" ? (
      <motion.div
        key={view}
        initial={reduce || animation === "none" ? false : { opacity: 0, scale: animation === "scale" ? 0.94 : 1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={reduce ? { duration: 0.12 } : t}
        className="flex flex-col"
        onKeyDown={onPickerKey}
      >
        <div className="mb-2 flex items-center gap-1">
          <button
            type="button"
            className="pc-press pc-dp-nav grid size-8 place-items-center rounded-md outline-none"
            aria-label={view === "months" ? l.prevYear : l.prevYears}
            onClick={() => (view === "months" ? setMonth(addMonths(viewMonth, -viewOffset - 12)) : setYearPage((y) => y - 12))}
            disabled={view === "months" ? viewMonth.getFullYear() - 1 < (min?.getFullYear() ?? -Infinity) : yearPage - 1 < (min?.getFullYear() ?? -Infinity)}
          >
            <Chevron dir="start" className="size-4" />
          </button>
          <button
            type="button"
            aria-label={view === "months" ? `${intl.year.format(viewMonth)}, ${l.chooseYear}` : undefined}
            disabled={view === "years"}
            onClick={() => setView("years")}
            className={cn("pc-press pc-dp-cap mx-auto rounded-md px-2 py-1 font-semibold outline-none disabled:hover:bg-transparent", s.cap)}
          >
            {view === "months" ? intl.year.format(viewMonth) : `${intl.num(yearPage)} – ${intl.num(yearPage + 11)}`}
          </button>
          <button
            type="button"
            className="pc-press pc-dp-nav grid size-8 place-items-center rounded-md outline-none"
            aria-label={view === "months" ? l.nextYear : l.nextYears}
            onClick={() => (view === "months" ? setMonth(addMonths(viewMonth, -viewOffset + 12)) : setYearPage((y) => y + 12))}
            disabled={view === "months" ? viewMonth.getFullYear() + 1 > (max?.getFullYear() ?? Infinity) : yearPage + 12 > (max?.getFullYear() ?? Infinity)}
          >
            <Chevron dir="end" className="size-4" />
          </button>
        </div>
        <div role="group" aria-label={view === "months" ? l.chooseMonth : l.chooseYear} className="grid grid-cols-3 gap-1.5">
          {view === "months"
            ? Array.from({ length: 12 }, (_, m) => {
                const d = new Date(viewMonth.getFullYear(), m, 1)
                const off = mIndex(d) < minMonth || mIndex(d) > maxMonth
                const cur = m === viewMonth.getMonth()
                return (
                  <button
                    key={m}
                    type="button"
                    data-cell=""
                    tabIndex={cur ? 0 : -1}
                    disabled={off}
                    aria-pressed={cur}
                    aria-label={intl.monthLong.format(d)}
                    aria-current={today && mIndex(today) === mIndex(d) ? true : undefined}
                    onClick={() => {
                      setMonth(addMonths(d, -viewOffset))
                      setView("days")
                      const f = focused ?? focusTarget()
                      kb.current = true
                      setFocused(clampDay(new Date(d.getFullYear(), m, Math.min(f.getDate(), daysIn(d.getFullYear(), m)))))
                    }}
                    className={cn("pc-press pc-dp-cell-btn rounded-md capitalize outline-none", s.mcell)}
                  >
                    {intl.monthShort.format(d)}
                  </button>
                )
              })
            : Array.from({ length: 12 }, (_, k) => {
                const y = yearPage + k
                const off = (min && y < min.getFullYear()) || (max && y > max.getFullYear())
                const cur = y === viewMonth.getFullYear()
                return (
                  <button
                    key={y}
                    type="button"
                    data-cell=""
                    tabIndex={cur || (k === 0 && (viewMonth.getFullYear() < yearPage || viewMonth.getFullYear() > yearPage + 11)) ? 0 : -1}
                    disabled={!!off}
                    aria-pressed={cur}
                    aria-current={today && today.getFullYear() === y ? true : undefined}
                    onClick={() => {
                      setMonth(new Date(y, viewMonth.getMonth() - viewOffset, 1))
                      setView("months")
                    }}
                    className={cn("pc-press pc-dp-cell-btn rounded-md tabular-nums outline-none", s.mcell)}
                  >
                    {intl.num(y)}
                  </button>
                )
              })}
        </div>
      </motion.div>
    ) : null

  const calendar = (
    <div className={cn("relative overflow-hidden", s.pad)}>
      <span aria-live="polite" className="sr-only">
        {month && view === "days" ? Array.from({ length: shown }, (_, i) => intl.caption.format(addMonths(month, i))).join(" – ") : ""}
      </span>
      {view !== "days" ? (
        picker
      ) : month ? (
        <AnimatePresence initial={false} mode="popLayout" custom={dir}>
          <motion.div key={mIndex(month)} custom={dir} variants={gridVariants} initial="enter" animate="center" exit="exit" transition={reduce ? { duration: 0.12 } : t} className="flex gap-6">
            {Array.from({ length: shown }, (_, i) => {
              const m = addMonths(month, i)
              return (
                <div key={i} className="flex min-w-0 flex-col">
                  {caption(m, i)}
                  <MonthGrid
                    month={m}
                    weekStartsOn={weekStartsOn}
                    render={renderDay}
                    head={head}
                    weekNumbers={weekNumbers}
                    hideOutside={shown > 1}
                    labelledBy={`${uid}-cap-${i}`}
                    fmtWeek={intl.num}
                    weekLabel={l.weekNumber}
                    onKeyDown={onGridKey}
                    onPointerLeave={() => setHover(null)}
                    rowClass={s.grid}
                  />
                </div>
              )
            })}
          </motion.div>
        </AnimatePresence>
      ) : (
        // Before mount there is no "today" to show; keep the space so nothing jumps.
        <div aria-hidden="true" className="flex gap-6">
          {Array.from({ length: shown }, (_, i) => (
            <div key={i} className="flex flex-col">
              <div className="mb-2 h-8" />
              <div className={cn("grid", weekNumbers ? "grid-cols-8" : "grid-cols-7")}>
                {Array.from({ length: (weekNumbers ? 8 : 7) * 7 }, (_, k) => (
                  <span key={k} className={cn(s.cell, "m-px")} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const timeRow = time && mode !== "multiple" && (
    <div className={cn("flex flex-wrap items-center gap-3 border-t", s.pad, "py-2.5")}>
      {(mode === "single" ? [["single", l.time]] : [["from", l.startTime], ["to", l.endTime]]).map(([key, label]) => {
        const val =
          key === "single" ? (single ? hhmm(single) : singleTime) : key === "from" ? (range ? hhmm(range.from) : rangeTime.from) : range?.to ? hhmm(range.to) : rangeTime.to
        return (
          <label key={key} className="flex items-center gap-2 text-sm">
            <span className="pc-dp-muted">{label}</span>
            <input
              type="time"
              step={minuteStep * 60}
              value={val}
              onChange={(e) => {
                const v = e.target.value
                if (!v) return
                if (key === "single") {
                  setSingleTime(v)
                  if (single) commit(withTime(single, v))
                } else if (key === "from") {
                  setRangeTime((r) => ({ ...r, from: v }))
                  if (range) commit({ ...range, from: withTime(range.from, v) })
                } else {
                  setRangeTime((r) => ({ ...r, to: v }))
                  if (range?.to) commit({ ...range, to: withTime(range.to, v) })
                }
              }}
              className="pc-dp-time h-8 rounded-md px-2 text-sm tabular-nums"
            />
          </label>
        )
      })}
    </div>
  )

  const presetList = presets.length > 0 && (
    <div role="group" aria-label={l.presets} className={cn("flex gap-1 overflow-x-auto border-b p-2 sm:flex-col sm:overflow-visible sm:border-e sm:border-b-0", size === "lg" ? "sm:w-40" : "sm:w-36")}>
      {presets.map((pr) => (
        <button
          key={pr.label}
          type="button"
          aria-pressed={presetActive(pr)}
          onClick={() => applyPreset(pr)}
          className="pc-press pc-dp-chip shrink-0 rounded-md px-2.5 py-1.5 text-start text-sm whitespace-nowrap outline-none"
        >
          {pr.label}
        </button>
      ))}
    </div>
  )

  const footer = !inline && (time || mode === "multiple") && (
    <div className="flex items-center justify-end gap-2 border-t px-3 py-2">
      <button type="button" onClick={() => commit(mode === "multiple" ? [] : null)} className="pc-press pc-dp-foot rounded-md px-3 py-1.5 text-sm outline-none">
        {l.clear}
      </button>
      <button type="button" data-primary="" onClick={() => close()} className="pc-press pc-dp-foot rounded-md px-3 py-1.5 text-sm font-medium outline-none">
        {l.done}
      </button>
    </div>
  )

  const panelBody = (
    <div className="flex flex-col sm:flex-row">
      {presetList}
      <div className="flex min-w-0 flex-col">
        {calendar}
        {timeRow}
        {footer}
      </div>
    </div>
  )

  // Keep Tab inside the dialog (APG: the date picker dialog is modal).
  const trap = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault()
      e.stopPropagation()
      if (view !== "days") setView("days")
      else close()
      return
    }
    if (e.key !== "Tab" || !surface.current) return
    const items = Array.from(surface.current.querySelectorAll<HTMLElement>("button:not(:disabled), input, [tabindex='0']")).filter((el) => el.tabIndex >= 0 && !el.closest("[inert]"))
    if (!items.length) return
    const first = items[0]!
    const last = items[items.length - 1]!
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  const style = (
    <>
      <GooduiTokens />
      <style href="pc-date-picker" precedence="default">
        {CSS}
      </style>
    </>
  )
  const dataAttrs = {
    "data-variant": variant,
    "data-tone": tone,
    "data-sel": selection,
    "data-shadow": variant === "neo" ? "none" : shadow,
  }
  const hidden =
    name &&
    (() => {
      const f = (d: Date) => (time ? `${iso(d)}T${hhmm(d)}` : iso(d))
      if (mode === "single") return <input type="hidden" name={name} value={single ? f(single) : ""} />
      if (mode === "range")
        return (
          <>
            <input type="hidden" name={`${name}From`} value={range ? f(range.from) : ""} />
            <input type="hidden" name={`${name}To`} value={range?.to ? f(range.to) : ""} />
          </>
        )
      return multi.map((d) => <input key={iso(d)} type="hidden" name={name} value={f(d)} />)
    })()

  if (inline) {
    return (
      <>
        {style}
        <div
          {...rest}
          ref={root}
          role="group"
          aria-label={ariaLabel ?? l.dialog}
          data-slot="date-picker"
          data-inline=""
          {...dataAttrs}
          className={cn("pc-dp inline-block max-w-full", disabled && "pointer-events-none opacity-55", className)}
        >
          <div className={cn("pc-dp-surface max-w-full overflow-hidden", SURFACE_RADIUS[variant])}>{panelBody}</div>
          {hidden}
        </div>
      </>
    )
  }

  const motionIn = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
    : animation === "none"
      ? { initial: false as const, animate: { opacity: 1 } }
      : animation === "fade"
        ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
        : animation === "scale"
          ? { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 } }
          : { initial: { opacity: 0, y: p?.side === "top" ? 8 : -8 }, animate: { opacity: 1, y: 0 } }
  const surfaceClass = cn("pc-dp-surface max-w-[calc(100vw-16px)] overflow-auto overscroll-contain outline-none", SURFACE_RADIUS[variant])
  const surfaceProps = {
    ref: surface,
    id: dialogId,
    role: "dialog",
    "aria-modal": true,
    "aria-label": l.dialog,
    onKeyDown: trap,
    style: { maxHeight: p?.maxH, transformOrigin: `${p?.side === "top" ? "bottom" : "top"} ${rtl ? "right" : "left"}` },
    className: surfaceClass,
  }

  return (
    <>
      {style}
      <div
        {...rest}
        ref={root}
        data-slot="date-picker"
        {...dataAttrs}
        data-open={open ? "" : undefined}
        data-invalid={invalid || bad ? "" : undefined}
        className={cn("pc-dp relative w-72 max-w-full", disabled && "pointer-events-none opacity-55", className)}
      >
        <div ref={field} className={cn("pc-dp-field flex w-full items-center py-1", s.field, s.icon, RADIUS[variant])}>
          <input
            ref={input}
            id={inputId}
            type="text"
            autoComplete="off"
            spellCheck={false}
            aria-label={ariaLabel}
            aria-invalid={invalid || bad || undefined}
            aria-describedby={bad ? uid + "-err" : undefined}
            disabled={disabled}
            placeholder={fmtPlaceholder}
            value={fieldText}
            onChange={(e) => {
              setText(e.target.value)
              setBad(false)
            }}
            onBlur={commitText}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                commitText()
              } else if (e.key === "ArrowDown" && (e.altKey || !text)) {
                e.preventDefault()
                commitText()
                openDialog(input.current)
              } else if (e.key === "Escape" && text !== null) {
                e.preventDefault()
                setText(null)
                setBad(false)
              }
            }}
            className="pc-dp-input h-7 min-w-0 flex-1 bg-transparent tabular-nums outline-none disabled:cursor-not-allowed"
          />
          {bad && (
            <span id={uid + "-err"} role="alert" className="sr-only">
              {l.invalid}
            </span>
          )}
          {clearable && (display || text) && !disabled && (
            <button
              type="button"
              aria-label={l.clear}
              onClick={() => {
                setText(null)
                setBad(false)
                commit(mode === "multiple" ? [] : null)
                input.current?.focus()
              }}
              className="pc-press pc-dp-muted grid size-6 shrink-0 place-items-center rounded-md outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <Cross className="!size-3.5" />
            </button>
          )}
          <button
            ref={button}
            type="button"
            aria-label={l.openCalendar}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls={open ? dialogId : undefined}
            disabled={disabled}
            onClick={() => (open ? close() : openDialog(button.current))}
            className="pc-press pc-dp-muted -me-1 grid size-7 shrink-0 place-items-center rounded-md outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <CalendarIcon className="!size-4" />
          </button>
        </div>
        {hidden}
      </div>
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <div key="dp" {...dataAttrs} className="pc-dp fixed z-50" style={{ left: p?.x ?? 0, top: p?.y ?? 0, visibility: p ? undefined : "hidden" }}>
                {p ? (
                  <motion.div {...surfaceProps} {...motionIn} exit={{ opacity: 0, transition: { duration: reduce || animation === "none" ? 0 : 0.12 } }} transition={reduce ? { duration: 0.12 } : t}>
                    {panelBody}
                  </motion.div>
                ) : (
                  <div {...surfaceProps}>{panelBody}</div>
                )}
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  )
}

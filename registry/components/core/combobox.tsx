"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion, useReducedMotion, type Transition } from "motion/react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import { GooduiTokens, spring } from "@/lib/goodui-motion"

/*
 * Autocomplete combobox (ARIA 1.2 combobox + listbox): the user types, the list narrows. Independent layers:
 *   variant    outline, filled, ghost, underline, pill, neo      tone      accent for focus, active row and chips
 *   size       sm, md, lg                                         shadow    field elevation
 *   animation  none, fade-scale, slide, stagger (popup open)
 *   behaviour  local or async options (debounced, cancelled, cached) with loading / empty / error states,
 *              ranked matching with highlight, groups, single or multiple (chips), "Add “…”" create row,
 *              built-in virtualization for long lists (10k+ rows).
 * Keyboard: ↓ ↑ open and move, Alt+↓ opens, Home/End and PageUp/PageDown move in the open list, Enter picks,
 * Esc closes (then reverts or clears), Backspace on an empty input removes the last chip.
 * Use select when people pick from a short known list; combobox is for typing to search.
 */

export type ComboboxVariant = "outline" | "filled" | "ghost" | "underline" | "pill" | "neo"
export type ComboboxTone = "primary" | "neutral" | "success" | "warning" | "danger" | "info"
export type ComboboxSize = "sm" | "md" | "lg"
export type ComboboxShadow = "none" | "sm" | "md" | "lg"
export type ComboboxAnimation = "none" | "fade-scale" | "slide" | "stagger"

export type ComboboxOption = {
  /** Unique value reported by onValueChange. */
  value: string
  /** Text shown in the list, the input and the chips; matched and highlighted. */
  label: string
  /** Muted second line; also matched. */
  description?: string
  icon?: React.ReactNode
  /** Image URL, or true for colored initials. */
  avatar?: string | true
  /** Section heading; groups keep the order of their best match. */
  group?: string
  disabled?: boolean
  /** Extra search terms (not shown). */
  keywords?: string[]
}
type RawOption = ComboboxOption | string

export type ComboboxLabels = {
  clear: string
  /** Name of the chevron button that opens and closes the list. */
  toggle: string
  remove: (label: string) => string
  /** Text of the create row. */
  create: (text: string) => string
  loading: string
  empty: (query: string) => string
  error: string
  retry: string
  /** Asks for more characters before an async search starts. */
  minChars: (n: number) => string
  /** Announced when the results change. */
  results: (count: number) => string
  /** Screen-reader text listing the chips. */
  selectedHint: (selected: string) => string
}
const DEFAULT_LABELS: ComboboxLabels = {
  clear: "Clear",
  toggle: "Show suggestions",
  remove: (label) => `Remove ${label}`,
  create: (text) => `Add “${text}”`,
  loading: "Searching…",
  empty: (q) => (q ? `No results for “${q}”` : "No options"),
  error: "Couldn’t load results.",
  retry: "Retry",
  minChars: (n) => `Type at least ${n} character${n === 1 ? "" : "s"}`,
  results: (n) => (n === 1 ? "1 result available." : `${n} results available.`),
  selectedHint: (s) => `${s} selected. Backspace removes the last one.`,
}

type ComboboxBase = Omit<React.ComponentProps<"div">, "defaultValue" | "onChange" | "children" | "onSubmit"> & {
  /** Local options (objects or strings). With loadOptions they are shown before typing and used to label values. */
  options?: RawOption[]
  /** Async search. Called after the debounce with the typed text; aborted when the text changes. */
  loadOptions?: (query: string, ctx: { signal: AbortSignal }) => Promise<RawOption[]>
  /** Debounce for loadOptions in ms. */
  debounce?: number
  /** Characters needed before loadOptions runs. */
  minChars?: number
  /** Cache loadOptions results per query for the life of the component. */
  cache?: boolean
  /** Custom local match. false shows options unfiltered (when you filter yourself). */
  filter?: ((option: ComboboxOption, query: string) => boolean) | false
  /** Shows an "Add “text”" row when no option matches the typed text exactly. */
  creatable?: boolean
  /** Called with the typed text when the create row is picked. Return the new option (or nothing to use the text). */
  onCreate?: (text: string) => RawOption | void | Promise<RawOption | void>
  placeholder?: string
  /** Field style: outline (default), filled, ghost, underline, pill or neo. */
  variant?: ComboboxVariant
  /** Accent for the focus ring, active row, checks and chips. */
  tone?: ComboboxTone
  size?: ComboboxSize
  /** Field shadow. Ignored by neo. */
  shadow?: ComboboxShadow
  /** How the list opens: fade-scale (default), slide, stagger (rows one by one; off when virtualized) or none. */
  animation?: ComboboxAnimation
  /** × button that clears the value and the text. */
  clearable?: boolean
  disabled?: boolean
  /** Red border and aria-invalid on the input. */
  invalid?: boolean
  /** Leading icon in the field. */
  icon?: React.ReactNode
  /** Form field name (renders hidden inputs with the value). */
  name?: string
  /** Open the list when the input gets focus (by default it opens on typing, click or ↓). */
  openOnFocus?: boolean
  /** Rows above which the list is virtualized. */
  virtualThreshold?: number
  /** Text in the input (controlled). */
  inputValue?: string
  defaultInputValue?: string
  onInputValueChange?: (text: string) => void
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Class for the popup. */
  menuClassName?: string
  /** Names the input and the list. Pass one unless a visible <label htmlFor={id}> points at the input. */
  "aria-label"?: string
  /** Goes on the input, so <label htmlFor> works. */
  id?: string
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<ComboboxLabels>
}
export type ComboboxSingleProps = ComboboxBase & {
  /** true picks several values shown as chips; value then becomes string[]. */
  multiple?: false
  /** Selected value (controlled): a string or null, or string[] with multiple. */
  value?: string | null
  defaultValue?: string | null
  /** Called with the new value and its option (null after clearing). */
  onValueChange?: (value: string | null, option: ComboboxOption | null) => void
}
export type ComboboxMultipleProps = ComboboxBase & {
  multiple: true
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[], options: ComboboxOption[]) => void
}
export type ComboboxProps = ComboboxSingleProps | ComboboxMultipleProps

const CSS = `
.pc-cbx{--pc-c:var(--primary);--pc-fg:var(--primary-foreground)}
.pc-cbx[data-tone=neutral]{--pc-c:var(--foreground);--pc-fg:var(--background)}
.pc-cbx[data-tone=success]{--pc-c:oklch(0.53 0.13 155);--pc-fg:#fff}
.pc-cbx[data-tone=warning]{--pc-c:oklch(0.75 0.16 70);--pc-fg:oklch(0.25 0.05 70)}
.pc-cbx[data-tone=danger]{--pc-c:oklch(0.56 0.21 27);--pc-fg:#fff}
.pc-cbx[data-tone=info]{--pc-c:oklch(0.55 0.17 250);--pc-fg:#fff}
.dark .pc-cbx[data-tone=success]{--pc-c:oklch(0.7 0.16 155);--pc-fg:oklch(0.2 0.05 155)}
.dark .pc-cbx[data-tone=danger]{--pc-c:oklch(0.68 0.2 25);--pc-fg:oklch(0.2 0.05 25)}
.dark .pc-cbx[data-tone=info]{--pc-c:oklch(0.7 0.15 245);--pc-fg:oklch(0.2 0.05 245)}
.pc-cbx{--pc-tint:color-mix(in oklab,var(--pc-c) 14%,transparent);--pc-ink:color-mix(in oklab,var(--pc-c) 82%,var(--foreground))}
.pc-cbx[data-tone=warning]{--pc-ink:color-mix(in oklab,var(--pc-c) 62%,var(--foreground))}
.pc-cbx{--pc-ring:color-mix(in oklab,var(--pc-c) 32%,transparent);--pc-edge:color-mix(in oklab,var(--pc-c) 55%,var(--border));--pc-muted:color-mix(in oklab,var(--muted-foreground) 80%,var(--foreground))}

.pc-cbx-field{position:relative;color:var(--foreground);transition:border-color .15s,background-color .15s,box-shadow .15s,transform .12s}
.pc-cbx[data-variant=outline] .pc-cbx-field,.pc-cbx[data-variant=pill] .pc-cbx-field{background:var(--background);border:1px solid var(--input)}
.pc-cbx[data-variant=outline] .pc-cbx-field:hover,.pc-cbx[data-variant=pill] .pc-cbx-field:hover{border-color:color-mix(in oklab,var(--pc-c) 30%,var(--input))}
.pc-cbx[data-variant=filled] .pc-cbx-field{background:var(--muted);border:1px solid transparent}
.pc-cbx[data-variant=filled] .pc-cbx-field:hover{background:color-mix(in oklab,var(--foreground) 7%,var(--muted))}
.pc-cbx[data-variant=filled] .pc-cbx-field:focus-within{background:var(--background)}
.pc-cbx[data-variant=ghost] .pc-cbx-field{border:1px solid transparent}
.pc-cbx[data-variant=ghost] .pc-cbx-field:is(:hover,:focus-within){background:var(--pc-tint)}
.pc-cbx[data-variant=underline] .pc-cbx-field{border-radius:0;border-bottom:1.5px solid var(--input);padding-inline:.125rem}
.pc-cbx[data-variant=underline] .pc-cbx-field::after{content:"";position:absolute;inset-inline:0;bottom:-1.5px;height:2px;background:var(--pc-c);transform:scaleX(0);transition:transform .25s var(--pc-ease-out)}
.pc-cbx[data-variant=underline] .pc-cbx-field:focus-within::after{transform:scaleX(1)}
.pc-cbx[data-variant=neo] .pc-cbx-field{background:var(--background);border:2px solid var(--foreground);box-shadow:3px 3px 0 var(--foreground)}
.pc-cbx[data-variant=neo] .pc-cbx-field:focus-within{transform:translate(1px,1px);box-shadow:2px 2px 0 var(--foreground);outline:2px solid var(--pc-c);outline-offset:3px}
.pc-cbx:is([data-variant=outline],[data-variant=filled],[data-variant=pill]) .pc-cbx-field:focus-within{border-color:var(--pc-edge);box-shadow:0 0 0 3px var(--pc-ring)}
.pc-cbx[data-invalid] .pc-cbx-field{border-color:oklch(0.56 0.21 27)}
.pc-cbx[data-variant=underline][data-invalid] .pc-cbx-field::after{background:oklch(0.56 0.21 27);transform:scaleX(1)}
.pc-cbx[data-shadow=sm] .pc-cbx-field{box-shadow:0 1px 2px rgb(0 0 0/.08)}
.pc-cbx[data-shadow=md] .pc-cbx-field{box-shadow:0 4px 12px -4px rgb(0 0 0/.16)}
.pc-cbx[data-shadow=lg] .pc-cbx-field{box-shadow:0 12px 28px -10px rgb(0 0 0/.28)}
.pc-cbx-input::placeholder{color:var(--pc-muted);opacity:1}
.pc-cbx-muted{color:var(--pc-muted)}
.pc-cbx-chev{transition:transform .2s var(--pc-ease-out);color:var(--pc-muted)}
.pc-cbx[data-open] .pc-cbx-chev{transform:rotate(180deg)}
.pc-cbx-chip{background:color-mix(in oklab,var(--pc-c) 10%,var(--muted));color:var(--foreground);border:1px solid color-mix(in oklab,var(--pc-c) 16%,transparent)}
.pc-cbx[data-variant=neo] .pc-cbx-chip{border:1.5px solid var(--foreground);background:color-mix(in oklab,var(--pc-c) 18%,var(--background))}

.pc-cbx-menu{background:var(--popover);color:var(--popover-foreground);border:1px solid var(--border);box-shadow:0 16px 40px -12px rgb(0 0 0/.25),0 4px 10px -4px rgb(0 0 0/.08)}
.dark .pc-cbx-menu{box-shadow:0 16px 40px -12px rgb(0 0 0/.6),0 0 0 1px rgb(255 255 255/.04)}
.pc-cbx[data-variant=neo] .pc-cbx-menu{border:2px solid var(--foreground);box-shadow:4px 4px 0 var(--foreground)}
.pc-cbx-opt{color:var(--foreground)}
.pc-cbx-opt[data-active]{background:color-mix(in oklab,var(--pc-c) 8%,var(--accent))}
.pc-cbx-opt[data-selected]{color:var(--pc-ink)}
.pc-cbx:is([data-tone=neutral],[data-tone=primary]) .pc-cbx-opt[data-selected]{color:var(--foreground)}
.pc-cbx-opt[aria-disabled=true]{cursor:not-allowed}
.pc-cbx-opt[aria-disabled=true]>*{opacity:.45}
.pc-cbx-create{color:var(--pc-ink)}
.pc-cbx-check{color:var(--pc-c)}
.pc-cbx-box{border:1.5px solid color-mix(in oklab,var(--foreground) 25%,transparent);transition:background-color .12s,border-color .12s}
.pc-cbx-opt[data-selected] .pc-cbx-box{background:var(--pc-c);border-color:var(--pc-c);color:var(--pc-fg)}
.pc-cbx-hl{background:color-mix(in oklab,var(--pc-c) 16%,transparent);color:inherit;font-weight:600;border-radius:3px;padding:0 1px;margin:0 -1px}
.pc-cbx-spin{animation:pc-cbx-spin .7s linear infinite}
@keyframes pc-cbx-spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.pc-cbx-field,.pc-cbx-chev,.pc-cbx-field::after{transition:none!important}.pc-cbx-spin{animation-duration:1.6s}}
`

const SIZES = {
  sm: { field: "min-h-8 px-2.5 text-sm gap-1.5", chip: "h-5 text-[11px]", opt: "px-2 text-sm gap-2", icon: "[&_svg]:size-3.5", row: 32, rowDesc: 44, head: 26 },
  md: { field: "min-h-10 px-3 text-sm gap-2", chip: "h-6 text-xs", opt: "px-2 text-sm gap-2.5", icon: "[&_svg]:size-4", row: 36, rowDesc: 50, head: 30 },
  lg: { field: "min-h-12 px-4 text-base gap-2.5", chip: "h-7 text-sm", opt: "px-2.5 text-base gap-3", icon: "[&_svg]:size-[18px]", row: 44, rowDesc: 58, head: 32 },
} satisfies Record<ComboboxSize, Record<string, string | number>>
const RADIUS: Record<ComboboxVariant, string> = { outline: "rounded-lg", filled: "rounded-lg", ghost: "rounded-lg", underline: "rounded-none", pill: "rounded-full", neo: "rounded-md" }
const MENU_RADIUS: Record<ComboboxVariant, string> = { outline: "rounded-xl", filled: "rounded-xl", ghost: "rounded-xl", underline: "rounded-lg", pill: "rounded-2xl", neo: "rounded-md" }

/* ---------- text matching ---------- */

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()

/** Folds text and keeps a map from each folded character back to its index in the original. */
function foldMap(s: string) {
  let out = ""
  const map: number[] = []
  for (let i = 0; i < s.length; i++) {
    const f = fold(s[i]!)
    for (let k = 0; k < f.length; k++) {
      out += f[k]
      map.push(i)
    }
  }
  return { out, map }
}

function Highlight({ text, query }: { text: string; query: string }) {
  const tokens = fold(query).split(/\s+/).filter(Boolean)
  if (!tokens.length) return <>{text}</>
  const { out, map } = foldMap(text)
  const ranges: [number, number][] = []
  for (const t of tokens) {
    let from = 0
    for (let i = out.indexOf(t, from); i >= 0 && ranges.length < 20; i = out.indexOf(t, from)) {
      ranges.push([map[i]!, map[i + t.length - 1]! + 1])
      from = i + t.length
    }
  }
  if (!ranges.length) return <>{text}</>
  ranges.sort((a, b) => a[0] - b[0])
  const merged: [number, number][] = []
  for (const r of ranges) {
    const last = merged[merged.length - 1]
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1])
    else merged.push([r[0], r[1]])
  }
  const parts: React.ReactNode[] = []
  let at = 0
  merged.forEach(([a, b], i) => {
    if (a > at) parts.push(text.slice(at, a))
    parts.push(
      <mark key={i} className="pc-cbx-hl">
        {text.slice(a, b)}
      </mark>,
    )
    at = b
  })
  if (at < text.length) parts.push(text.slice(at))
  return <>{parts}</>
}

const toOption = (o: RawOption): ComboboxOption => (typeof o === "string" ? { value: o, label: o } : o)

type Indexed = { o: ComboboxOption; label: string; hay: string }
const index = (list: ComboboxOption[]): Indexed[] =>
  list.map((o) => ({ o, label: fold(o.label), hay: fold([o.label, o.description ?? "", o.group ?? "", ...(o.keywords ?? [])].join(" ")) }))

/** Ranks matches: label starts with the text, then a word in the label starts with it, then anywhere. Every word must match. */
function rank(list: Indexed[], query: string): ComboboxOption[] {
  const q = fold(query.trim())
  if (!q) return list.map((x) => x.o)
  const tokens = q.split(/\s+/)
  const first = tokens[0]!
  const wordStart = new RegExp(`(^|[^\\p{L}\\p{N}])${first.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "u")
  const scored: { o: ComboboxOption; s: number; i: number }[] = []
  list.forEach((x, i) => {
    for (const t of tokens) if (!x.hay.includes(t)) return
    const s = x.label.startsWith(q) ? 0 : x.label.startsWith(first) ? 1 : wordStart.test(x.label) ? 2 : x.label.includes(first) ? 3 : 4
    scored.push({ o: x.o, s, i })
  })
  return scored.sort((a, b) => a.s - b.s || a.i - b.i).map((x) => x.o)
}

/* ---------- floating placement (flip + shift, no library) ---------- */

type Side = "top" | "bottom"
type Rect = { top: number; left: number; right: number; bottom: number; width: number; height: number }
type Placement = { x: number; y: number; side: Side; maxH: number; width: number }

function place(a: Rect, h: number, preferred: Side, lock: boolean): Placement {
  const pad = 8
  const offset = 6
  const vw = document.documentElement.clientWidth
  const vh = window.innerHeight
  const room = { top: a.top - offset - pad, bottom: vh - a.bottom - offset - pad }
  const side: Side = !lock && room[preferred] < h && room[preferred === "bottom" ? "top" : "bottom"] > room[preferred] ? (preferred === "bottom" ? "top" : "bottom") : preferred
  const maxH = Math.max(120, room[side])
  const hh = Math.min(h, maxH)
  const width = Math.min(a.width, vw - pad * 2)
  return { x: Math.max(pad, Math.min(a.left, vw - pad - width)), y: side === "bottom" ? a.bottom + offset : a.top - offset - hh, side, maxH, width }
}

function usePlacement(open: boolean, anchor: React.RefObject<HTMLElement | null>, surface: React.RefObject<HTMLElement | null>) {
  const [p, setP] = React.useState<Placement | null>(null)
  const side = React.useRef<Side | null>(null)
  React.useLayoutEffect(() => {
    if (!open) {
      // Keep the last placement so the closing animation plays where the list was.
      side.current = null
      return
    }
    const update = () => {
      const el = surface.current
      const a = anchor.current?.getBoundingClientRect()
      if (!el || !a) return
      // The side is chosen once per open, so the list does not jump while results stream in.
      const next = place(a, el.scrollHeight + (el.offsetHeight - el.clientHeight), side.current ?? "bottom", side.current !== null)
      side.current = next.side
      setP((prev) =>
        prev && Math.abs(prev.x - next.x) < 0.5 && Math.abs(prev.y - next.y) < 0.5 && prev.side === next.side && prev.maxH === next.maxH && prev.width === next.width ? prev : next,
      )
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
    if (anchor.current) ro?.observe(anchor.current)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("scroll", schedule, true)
      window.removeEventListener("resize", schedule)
      ro?.disconnect()
    }
  }, [open, anchor, surface, !!p])
  return p
}

/* ---------- small parts ---------- */

function Avatar({ src, label }: { src: string | true; label: string }) {
  if (src !== true) return <img src={src} alt="" className="size-6 shrink-0 rounded-full object-cover" />
  const initials = label
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
  let h = 0
  for (const ch of label) h = (h * 31 + ch.charCodeAt(0)) % 360
  return (
    <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center rounded-full text-[10px] font-semibold text-white" style={{ background: `oklch(0.5 0.13 ${h})` }}>
      {initials}
    </span>
  )
}
const Check = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...p}>
    <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const Cross = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...p}>
    <path d="M4.5 4.5 11.5 11.5M11.5 4.5 4.5 11.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
  </svg>
)
const Plus = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...p}>
    <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
  </svg>
)
const Spinner = ({ className }: { className?: string }) => (
  <svg className={cn("pc-cbx-spin", className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
)

type Entry = { kind: "option"; o: ComboboxOption } | { kind: "create"; text: string }
type Row = { kind: "head"; label: string } | { kind: "entry"; e: Entry; n: number }

/* ---------- component ---------- */

export function Combobox(props: ComboboxProps) {
  const {
    options: rawOptions,
    loadOptions,
    debounce = 250,
    minChars = 0,
    cache = true,
    filter,
    creatable,
    onCreate,
    placeholder = "Type to search…",
    variant = "outline",
    tone = "primary",
    size = "md",
    shadow = "none",
    animation = "fade-scale",
    clearable,
    disabled,
    invalid,
    icon,
    name,
    openOnFocus,
    virtualThreshold = 100,
    inputValue: inputProp,
    defaultInputValue,
    onInputValueChange,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    menuClassName,
    className,
    multiple,
    value: valueProp,
    defaultValue,
    onValueChange,
    "aria-label": ariaLabel,
    labels,
    id: idProp,
    ...rest
  } = props
  const l = useLabels("combobox", DEFAULT_LABELS, labels)
  const prefersReduced = useReducedMotion()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  const reduce = mounted && !!prefersReduced
  const uid = React.useId()
  const inputId = idProp ?? uid + "-input"
  const listId = uid + "-list"
  const optId = (n: number) => `${uid}-opt-${n}`

  /* options and the labels of known values (async results, created ones) */
  const [created, setCreated] = React.useState<ComboboxOption[]>([])
  const local = React.useMemo(() => [...(rawOptions ?? []).map(toOption), ...created], [rawOptions, created])
  const known = React.useRef(new Map<string, ComboboxOption>())
  for (const o of local) known.current.set(o.value, o)

  /* value */
  const [inner, setInner] = React.useState<string | string[] | null | undefined>(defaultValue)
  const current = valueProp !== undefined ? valueProp : inner
  const selected: string[] = Array.isArray(current) ? current : current ? [current] : []
  const optionOf = (v: string): ComboboxOption => known.current.get(v) ?? { value: v, label: v }
  const commit = (next: string[]) => {
    if (valueProp === undefined) setInner(multiple ? next : (next[0] ?? null))
    if (multiple) (onValueChange as ComboboxMultipleProps["onValueChange"])?.(next, next.map(optionOf))
    else (onValueChange as ComboboxSingleProps["onValueChange"])?.(next[0] ?? null, next[0] ? optionOf(next[0]) : null)
  }
  const singleLabel = !multiple && selected[0] ? optionOf(selected[0]).label : ""

  /* input text */
  const [textInner, setTextInner] = React.useState(defaultInputValue ?? (!multiple && selected[0] ? optionOf(selected[0]).label : ""))
  const text = inputProp ?? textInner
  const setText = (t: string) => {
    if (inputProp === undefined) setTextInner(t)
    onInputValueChange?.(t)
  }
  // The text only filters after the user typed; a picked label shows the full list again.
  const [dirty, setDirty] = React.useState(false)
  const query = dirty ? text : ""

  // Follow controlled value changes in single mode (unless the user is typing).
  const lastSingle = React.useRef(singleLabel)
  React.useEffect(() => {
    if (multiple || lastSingle.current === singleLabel) return
    lastSingle.current = singleLabel
    if (!dirty) setText(singleLabel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [singleLabel])

  /* open state */
  const [openInner, setOpenInner] = React.useState(defaultOpen)
  const open = (openProp ?? openInner) && !disabled
  const setOpen = (o: boolean) => {
    if (o === open) return
    if (openProp === undefined) setOpenInner(o)
    onOpenChange?.(o)
  }

  /* async */
  const [remote, setRemote] = React.useState<{ status: "idle" | "loading" | "done" | "error"; query: string; options: ComboboxOption[] }>({ status: "idle", query: "", options: [] })
  const [retry, setRetry] = React.useState(0)
  const cacheRef = React.useRef(new Map<string, ComboboxOption[]>())
  const loader = React.useRef(loadOptions)
  React.useLayoutEffect(() => {
    loader.current = loadOptions
  })
  const asyncMode = !!loadOptions
  const tooShort = asyncMode && query.trim().length < minChars
  React.useEffect(() => {
    if (!asyncMode || !open) return
    const q = query.trim()
    if (q.length < minChars || (!q && rawOptions)) {
      setRemote({ status: "idle", query: q, options: [] })
      return
    }
    const hit = cache ? cacheRef.current.get(q) : undefined
    if (hit) {
      setRemote({ status: "done", query: q, options: hit })
      return
    }
    setRemote((r) => ({ ...r, status: "loading" }))
    const ctrl = new AbortController()
    const t = window.setTimeout(() => {
      Promise.resolve(loader.current?.(q, { signal: ctrl.signal }) ?? [])
        .then((res) => {
          if (ctrl.signal.aborted) return
          const list = res.map(toOption)
          for (const o of list) known.current.set(o.value, o)
          if (cache) cacheRef.current.set(q, list)
          setRemote({ status: "done", query: q, options: list })
        })
        .catch(() => {
          if (!ctrl.signal.aborted) setRemote((r) => ({ ...r, status: "error", query: q }))
        })
    }, debounce)
    return () => {
      window.clearTimeout(t)
      ctrl.abort()
    }
  }, [asyncMode, open, query, minChars, debounce, cache, retry, !!rawOptions])

  /* visible entries */
  const indexed = React.useMemo(() => index(local), [local])
  const matches = React.useMemo(() => {
    if (asyncMode && query.trim() && !tooShort) return remote.options
    if (asyncMode && tooShort && !rawOptions) return []
    if (filter === false) return local
    if (filter) return local.filter((o) => filter(o, query))
    return rank(indexed, query)
  }, [asyncMode, query, tooShort, remote.options, rawOptions, filter, local, indexed])

  const showCreate =
    !!creatable && !!text.trim() && dirty && !tooShort && remote.status !== "loading" && !matches.some((o) => fold(o.label) === fold(text.trim())) && !local.some((o) => fold(o.label) === fold(text.trim()))

  const { rows, entries } = React.useMemo(() => {
    const groups: { name?: string; items: ComboboxOption[] }[] = []
    for (const o of matches) {
      const g = groups.find((x) => x.name === o.group)
      if (g) g.items.push(o)
      else groups.push({ name: o.group, items: [o] })
    }
    const rows: Row[] = []
    const entries: Entry[] = []
    for (const g of groups) {
      if (g.name) rows.push({ kind: "head", label: g.name })
      for (const o of g.items) {
        const e: Entry = { kind: "option", o }
        rows.push({ kind: "entry", e, n: entries.length })
        entries.push(e)
      }
    }
    if (showCreate) {
      const e: Entry = { kind: "create", text: text.trim() }
      rows.push({ kind: "entry", e, n: entries.length })
      entries.push(e)
    }
    return { rows, entries }
  }, [matches, showCreate, text])

  const enabled = (n: number) => {
    const e = entries[n]
    return !!e && (e.kind === "create" || !e.o.disabled)
  }
  const step = (from: number, dir: 1 | -1, wrap = true) => {
    const len = entries.length
    for (let k = 1; k <= len; k++) {
      let i = from + dir * k
      if (wrap) i = ((i % len) + len) % len
      else if (i < 0 || i >= len) break
      if (enabled(i)) return i
    }
    return wrap ? -1 : from
  }

  const [active, setActive] = React.useState(-1)
  const revertLater = React.useRef(false)
  // After a pick in multiple mode the list resets; keep the picked row active.
  const keepActive = React.useRef<string | null>(null)
  // Highlight the first match while typing; on a fresh open, the selected option. Layout effect: Enter right after
  // results arrive must already see the highlight.
  React.useLayoutEffect(() => {
    if (!open) return
    const keep = keepActive.current
    keepActive.current = null
    const kept = keep === null ? -1 : entries.findIndex((e) => e.kind === "option" && e.o.value === keep)
    if (kept >= 0) setActive(kept)
    else if (query.trim()) setActive(step(-1, 1))
    else {
      const sel = entries.findIndex((e) => e.kind === "option" && selected.includes(e.o.value) && !e.o.disabled)
      setActive(sel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, open])

  /* refs */
  const root = React.useRef<HTMLDivElement>(null)
  const field = React.useRef<HTMLDivElement>(null)
  const input = React.useRef<HTMLInputElement>(null)
  const surface = React.useRef<HTMLDivElement>(null)
  const scroller = React.useRef<HTMLDivElement>(null)
  const p = usePlacement(open && mounted, field, surface)

  /* virtualization */
  const s = SIZES[size]
  const hasDesc = matches.some((o) => o.description)
  const rowH = hasDesc ? s.rowDesc : s.row
  const virtual = rows.length > virtualThreshold
  const offsets = React.useMemo(() => {
    if (!virtual) return null
    const out = new Array<number>(rows.length + 1)
    out[0] = 0
    rows.forEach((r, i) => (out[i + 1] = out[i]! + (r.kind === "head" ? s.head : rowH)))
    return out
  }, [virtual, rows, rowH, s.head])
  const rowOfEntry = React.useMemo(() => {
    const m: number[] = []
    rows.forEach((r, i) => r.kind === "entry" && (m[r.n] = i))
    return m
  }, [rows])
  const [scroll, setScroll] = React.useState({ top: 0, h: 288 })
  React.useLayoutEffect(() => {
    if (!open || !scroller.current) return
    scroller.current.scrollTop = 0
    setScroll({ top: 0, h: scroller.current.clientHeight || 288 })
  }, [open, query, virtual, !!p])

  // Keep the active row in view.
  React.useEffect(() => {
    const sc = scroller.current
    if (!open || active < 0 || !sc) return
    if (offsets) {
      const r = rowOfEntry[active] ?? 0
      const top = offsets[r]!
      const bottom = offsets[r + 1]!
      // Show the group heading above the first option of a group.
      const head = r > 0 && rows[r - 1]?.kind === "head" ? offsets[r - 1]! : top
      if (head < sc.scrollTop) sc.scrollTop = head
      else if (bottom > sc.scrollTop + sc.clientHeight) sc.scrollTop = bottom - sc.clientHeight
    } else sc.querySelector<HTMLElement>(`[id="${optId(active)}"]`)?.scrollIntoView({ block: "nearest" })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, open])

  /* actions */
  const openList = () => {
    if (disabled || open) return
    setOpen(true)
  }
  const closeList = () => {
    setOpen(false)
    setActive(-1)
  }
  const revert = () => {
    setDirty(false)
    if (!multiple) setText(singleLabel)
    else setText("")
  }

  const pick = async (e: Entry) => {
    if (e.kind === "option") {
      const o = e.o
      if (o.disabled) return
      known.current.set(o.value, o)
      if (multiple) {
        commit(selected.includes(o.value) ? selected.filter((v) => v !== o.value) : [...selected, o.value])
        keepActive.current = o.value
        setText("")
        setDirty(false)
      } else {
        commit([o.value])
        lastSingle.current = o.label
        setText(o.label)
        setDirty(false)
        closeList()
      }
      return
    }
    const res = await onCreate?.(e.text)
    const o = res ? toOption(res) : { value: e.text, label: e.text }
    known.current.set(o.value, o)
    setCreated((c) => (c.some((x) => x.value === o.value) ? c : [...c, o]))
    if (multiple) {
      if (!selected.includes(o.value)) commit([...selected, o.value])
      setText("")
    } else {
      commit([o.value])
      lastSingle.current = o.label
      setText(o.label)
      closeList()
    }
    setDirty(false)
  }

  const clear = () => {
    commit([])
    lastSingle.current = ""
    setText("")
    setDirty(false)
    input.current?.focus()
  }

  /* outside pointer closes */
  React.useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (root.current?.contains(t) || surface.current?.contains(t)) return
      closeList()
      if (dirty) revertLater.current = true
    }
    document.addEventListener("pointerdown", onDown, true)
    return () => document.removeEventListener("pointerdown", onDown, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, dirty])

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return
    const len = entries.length
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        if (!open) {
          openList()
          if (!e.altKey && active < 0) setActive(step(-1, 1))
        } else if (!e.altKey) setActive((a) => step(a, 1))
        break
      case "ArrowUp":
        e.preventDefault()
        if (e.altKey) {
          closeList()
          break
        }
        if (!open) {
          openList()
          setActive(step(len, -1))
        } else setActive((a) => step(a < 0 ? len : a, -1))
        break
      case "PageDown":
      case "PageUp":
        if (!open || !len) break
        e.preventDefault()
        setActive((a) => {
          const dir = e.key === "PageDown" ? 1 : -1
          let i = Math.max(0, Math.min(len - 1, (a < 0 ? 0 : a) + dir * 10))
          if (!enabled(i)) i = step(i, dir, false)
          return enabled(i) ? i : a
        })
        break
      case "Home":
      case "End":
        if (!open || e.shiftKey || !len) break
        e.preventDefault()
        setActive(e.key === "Home" ? step(-1, 1) : step(len, -1))
        break
      case "Enter": {
        if (!open) break
        const en = entries[active]
        if (en) {
          e.preventDefault()
          void pick(en)
        }
        break
      }
      case "Escape":
        if (open) {
          e.preventDefault()
          e.stopPropagation()
          closeList()
        } else if (dirty || (multiple && text)) {
          e.preventDefault()
          revert()
        } else if (clearable && selected.length) {
          e.preventDefault()
          clear()
        }
        break
      case "Backspace":
        if (multiple && !text && selected.length) {
          e.preventDefault()
          commit(selected.slice(0, -1))
        }
        break
      case "Tab":
        if (open) closeList()
        break
    }
  }

  /* motion */
  const pop = p?.side === "top" ? 1 : -1
  const t: Transition = reduce || animation === "none" ? { duration: 0 } : spring.snap
  const menuMotion = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
    : animation === "fade-scale"
      ? { initial: { opacity: 0, scale: 0.97, y: pop * 4 }, animate: { opacity: 1, scale: 1, y: 0 } }
      : animation === "slide"
        ? { initial: { opacity: 0, y: pop * 10, clipPath: p?.side === "top" ? "inset(100% 0 0 0)" : "inset(0 0 100% 0)" }, animate: { opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)" } }
        : animation === "stagger"
          ? { initial: { opacity: 0, y: pop * 4 }, animate: { opacity: 1, y: 0 } }
          : { initial: false as const, animate: { opacity: 1 } }
  const exitT: Transition = animation === "none" ? { duration: 0 } : { duration: 0.12 }
  const staggerRows = animation === "stagger" && !reduce && !virtual

  /* status line under the list */
  const q = query.trim()
  const status: { kind: "loading" | "empty" | "error" | "short"; text: string } | null =
    asyncMode && tooShort && !rawOptions
      ? { kind: "short", text: l.minChars(minChars) }
      : asyncMode && remote.status === "loading" && (q ? remote.query !== q || !matches.length : !matches.length)
        ? { kind: "loading", text: l.loading }
        : asyncMode && remote.status === "error" && q
          ? { kind: "error", text: l.error }
          : !entries.length
            ? { kind: "empty", text: l.empty(q) }
            : null
  const announce = !open ? "" : status ? status.text : l.results(matches.length)

  /* rows */
  const renderRow = (r: Row, i: number, style?: React.CSSProperties) => {
    if (r.kind === "head")
      return (
        <div
          key={"h" + i + r.label}
          role="presentation"
          style={style}
          className={cn("pc-cbx-muted flex items-end px-2 pb-1 text-[11px] font-medium tracking-wide uppercase", !virtual && "pt-2", i > 0 && !virtual && "mt-1 border-t pt-2.5")}
        >
          <span className="truncate">{r.label}</span>
        </div>
      )
    const { e, n } = r
    const isActive = n === active
    if (e.kind === "create")
      return (
        <div
          key="create"
          id={optId(n)}
          role="option"
          aria-selected={false}
          aria-posinset={n + 1}
          aria-setsize={entries.length}
          data-active={isActive ? "" : undefined}
          style={style ?? { minHeight: s.row }}
          className={cn("pc-cbx-opt pc-cbx-create flex cursor-pointer items-center rounded-md font-medium select-none", s.opt, variant === "pill" && "rounded-xl")}
          onPointerMove={() => !isActive && setActive(n)}
          onPointerDown={(ev) => ev.preventDefault()}
          onClick={() => void pick(e)}
        >
          <Plus className="size-4 shrink-0" />
          <span className="truncate">{l.create(e.text)}</span>
        </div>
      )
    const o = e.o
    const isSel = selected.includes(o.value)
    const anim = staggerRows ? { initial: { opacity: 0, y: -4 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.03 + Math.min(n, 10) * 0.025, duration: 0.2 } } : { initial: false as const }
    return (
      <motion.div
        key={o.value}
        {...anim}
        id={optId(n)}
        role="option"
        aria-selected={isSel}
        aria-disabled={o.disabled || undefined}
        aria-posinset={n + 1}
        aria-setsize={entries.length}
        data-active={isActive ? "" : undefined}
        data-selected={isSel ? "" : undefined}
        style={style ?? { minHeight: s.row }}
        className={cn("pc-cbx-opt flex cursor-pointer items-center rounded-md select-none", virtual ? "py-0" : "py-1.5", s.opt, variant === "pill" && "rounded-xl")}
        onPointerMove={() => !o.disabled && !isActive && setActive(n)}
        onPointerDown={(ev) => ev.preventDefault()}
        onClick={() => void pick(e)}
      >
        {multiple && <span className="pc-cbx-box grid size-4 shrink-0 place-items-center rounded-[5px]">{isSel && <Check className="size-3" />}</span>}
        {o.avatar ? <Avatar src={o.avatar} label={o.label} /> : o.icon ? <span className="pc-cbx-muted inline-flex shrink-0 [&_svg]:size-4">{o.icon}</span> : null}
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate">
            <Highlight text={o.label} query={q} />
          </span>
          {o.description && (
            <span className="pc-cbx-muted truncate text-xs">
              <Highlight text={o.description} query={q} />
            </span>
          )}
        </span>
        {!multiple && isSel && <Check className="pc-cbx-check size-4 shrink-0" />}
      </motion.div>
    )
  }

  let body: React.ReactNode
  if (offsets) {
    const total = offsets[rows.length]!
    const top = scroll.top - 200
    const bottom = scroll.top + scroll.h + 200
    let lo = 0
    let hi = rows.length - 1
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (offsets[mid + 1]! <= top) lo = mid + 1
      else hi = mid
    }
    const vis: React.ReactNode[] = []
    for (let i = lo; i < rows.length && offsets[i]! < bottom; i++) vis.push(renderRow(rows[i]!, i, { position: "absolute", insetInline: 0, top: offsets[i], height: offsets[i + 1]! - offsets[i]! }))
    body = <div style={{ height: total, position: "relative" }}>{vis}</div>
  } else body = rows.map((r, i) => renderRow(r, i))

  const chips = multiple ? selected.map(optionOf) : []

  const listContent = (
    <>
      <div
        ref={scroller}
        id={listId}
        role="listbox"
        aria-multiselectable={multiple || undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabel ? undefined : inputId}
        aria-busy={remote.status === "loading" || undefined}
        className={cn("max-h-72 min-h-0 overflow-y-auto overscroll-contain", !rows.length && "hidden")}
        onScroll={(e) => {
          const el = e.currentTarget
          if (virtual) setScroll({ top: el.scrollTop, h: el.clientHeight })
        }}
      >
        {body}
      </div>
      {status && (
        <div
          onPointerDown={(e) => e.preventDefault()}
          className={cn("pc-cbx-muted flex items-center justify-center gap-2 px-3 text-center text-sm", rows.length ? "border-t py-2" : "py-5")}
        >
          {status.kind === "loading" && <Spinner className="size-4" />}
          <span>{status.text}</span>
          {status.kind === "error" && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setRetry((r) => r + 1)}
              className="pc-press rounded-md px-1.5 py-0.5 font-medium text-foreground underline underline-offset-2 outline-none hover:bg-muted"
            >
              {l.retry}
            </button>
          )}
        </div>
      )}
    </>
  )
  const surfaceClass = cn("pc-cbx-menu flex flex-col overflow-hidden p-1", MENU_RADIUS[variant], menuClassName)
  const surfaceStyle = { maxHeight: p?.maxH, transformOrigin: p?.side === "top" ? "bottom center" : "top center" }
  const popup = (
    <div
      key="popup"
      data-variant={variant}
      data-tone={tone}
      className="pc-cbx fixed z-50"
      style={{ left: p?.x ?? 0, top: p?.y ?? 0, width: p?.width ?? field.current?.offsetWidth, visibility: p ? undefined : "hidden" }}
    >
      {p ? (
        <motion.div ref={surface} {...menuMotion} exit={{ opacity: 0, transition: exitT }} transition={reduce ? { duration: 0.12 } : t} style={surfaceStyle} className={surfaceClass}>
          {listContent}
        </motion.div>
      ) : (
        <div ref={surface} style={surfaceStyle} className={surfaceClass}>
          {listContent}
        </div>
      )}
    </div>
  )

  return (
    <>
      <GooduiTokens />
      <style href="pc-combobox" precedence="default">
        {CSS}
      </style>
      <div
        {...rest}
        ref={root}
        data-slot="combobox"
        data-variant={variant}
        data-tone={tone}
        data-shadow={variant === "neo" ? "none" : shadow}
        data-open={open ? "" : undefined}
        data-invalid={invalid ? "" : undefined}
        className={cn("pc-cbx relative w-72 max-w-full", disabled && "pointer-events-none opacity-55", className)}
      >
        <div
          ref={field}
          className={cn("pc-cbx-field flex w-full cursor-text flex-wrap items-center py-1", s.field, s.icon, RADIUS[variant])}
          onPointerDown={(e) => {
            const t = e.target as HTMLElement
            if (t === input.current || t.closest("button")) return
            e.preventDefault()
            input.current?.focus()
            if (open) closeList()
            else openList()
          }}
        >
          {icon && <span className="pc-cbx-muted inline-flex shrink-0">{icon}</span>}
          {multiple && (
            <AnimatePresence initial={false} mode="popLayout">
              {chips.map((o) => (
                <motion.span
                  key={o.value}
                  layout={!reduce && animation !== "none"}
                  initial={reduce || animation === "none" ? false : { opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={t}
                  className={cn("pc-cbx-chip inline-flex max-w-full items-center gap-1 rounded-md ps-1.5 pe-0.5 font-medium", s.chip, variant === "pill" && "rounded-full ps-2")}
                >
                  <span className="truncate">{o.label}</span>
                  <button
                    type="button"
                    aria-label={l.remove(o.label)}
                    disabled={disabled}
                    onClick={() => {
                      commit(selected.filter((v) => v !== o.value))
                      input.current?.focus()
                    }}
                    className="pc-press grid size-4 shrink-0 cursor-pointer place-items-center rounded-sm opacity-70 outline-none hover:bg-foreground/10 hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring/60"
                  >
                    <Cross className="!size-3" />
                  </button>
                </motion.span>
              ))}
            </AnimatePresence>
          )}
          <input
            ref={input}
            id={inputId}
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls={open ? listId : undefined}
            aria-activedescendant={open && active >= 0 && entries[active] ? optId(active) : undefined}
            aria-label={ariaLabel}
            aria-invalid={invalid || undefined}
            aria-describedby={multiple && chips.length ? uid + "-chips" : undefined}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            disabled={disabled}
            placeholder={multiple && chips.length ? undefined : placeholder}
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              setDirty(true)
              if (!open) openList()
            }}
            onKeyDown={onKeyDown}
            onClick={() => openList()}
            onFocus={() => {
              if (openOnFocus) openList()
            }}
            onBlur={(e) => {
              const to = e.relatedTarget as Node | null
              if (to && surface.current?.contains(to)) return
              closeList()
              if (dirty || revertLater.current) {
                revertLater.current = false
                // Emptying the text and leaving clears a single value; anything else snaps back to the selection.
                if (!multiple && !text.trim() && selected.length) {
                  commit([])
                  lastSingle.current = ""
                  setDirty(false)
                } else revert()
              }
            }}
            className="pc-cbx-input h-7 min-w-16 flex-1 bg-transparent outline-none disabled:cursor-not-allowed"
          />
          {multiple && chips.length > 0 && (
            <span id={uid + "-chips"} className="sr-only">
              {l.selectedHint(chips.map((o) => o.label).join(", "))}
            </span>
          )}
          {asyncMode && remote.status === "loading" && open && <Spinner className="pc-cbx-muted !size-4 shrink-0" />}
          {clearable && (selected.length > 0 || text) && !disabled && (
            <button
              type="button"
              aria-label={l.clear}
              onClick={clear}
              className="pc-press pc-cbx-muted grid size-5 shrink-0 place-items-center rounded-md outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <Cross className="!size-3.5" />
            </button>
          )}
          <button
            type="button"
            tabIndex={-1}
            aria-label={l.toggle}
            aria-expanded={open}
            aria-controls={open ? listId : undefined}
            disabled={disabled}
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => {
              input.current?.focus()
              if (open) closeList()
              else openList()
            }}
            className="pc-press grid size-5 shrink-0 place-items-center rounded-md outline-none"
          >
            <svg className="pc-cbx-chev !size-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <span role="status" aria-live="polite" className="sr-only">
          {announce}
        </span>
        {name && (multiple ? selected.map((v) => <input key={v} type="hidden" name={name} value={v} />) : <input type="hidden" name={name} value={selected[0] ?? ""} />)}
      </div>
      {mounted && createPortal(<AnimatePresence>{open && popup}</AnimatePresence>, document.body)}
    </>
  )
}

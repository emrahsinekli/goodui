"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion, type Transition } from "motion/react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import { GooduiTokens, spring, ease as easing } from "@/lib/goodui-motion"

/*
 * A fully custom select, independent layers: every axis combines with every other.
 *   variant    outline, filled, ghost, underline, pill, neo      tone      accent for focus and selection
 *   size       sm, md, lg                                         shadow    trigger elevation
 *   animation  none, fade-scale, slide, stagger (menu open)
 *   behaviour  single or multiple (chips), searchable, clearable, groups, icons, avatars, descriptions
 * Keyboard: ↑ ↓ Home End, Enter/Space to pick, Esc to close, type to jump, Backspace removes the last chip.
 * The menu lives inside the component (no portal) and flips up when there is no room below.
 * options can be objects, plain strings, or one comma-separated string: "Haircut, Beard trim".
 */

export type SelectVariant = "outline" | "filled" | "ghost" | "underline" | "pill" | "neo"
export type SelectTone = "primary" | "neutral" | "success" | "warning" | "danger" | "info"
export type SelectSize = "sm" | "md" | "lg"
export type SelectShadow = "none" | "sm" | "md" | "lg"
export type SelectAnimation = "none" | "fade-scale" | "slide" | "stagger"

export type SelectOption = {
  /** Unique value reported by onValueChange. */
  value: string
  /** Text shown in the menu and the trigger; used for search and type-ahead. */
  label: string
  /** Muted second line in the menu; also searched. */
  description?: string
  icon?: React.ReactNode
  /** Image URL, or true for colored initials. */
  avatar?: string | true
  /** Section heading; options with the same group are shown together. */
  group?: string
  disabled?: boolean
  /** Extra search terms. */
  keywords?: string[]
}

type SelectBase = Omit<React.ComponentProps<"div">, "defaultValue" | "onChange" | "children"> & {
  /** Option objects, plain strings, or one comma-separated string: "Haircut, Beard trim". */
  options?: (SelectOption | string)[] | string
  /** Trigger text when nothing is selected. */
  placeholder?: string
  /** Trigger style: outline (default), filled, ghost, underline, pill or neo. */
  variant?: SelectVariant
  /** Accent for focus ring, selected option, checkboxes and chips. */
  tone?: SelectTone
  size?: SelectSize
  /** Trigger shadow. Ignored by neo. */
  shadow?: SelectShadow
  /** How the menu opens: fade-scale (default), slide (unrolls), stagger (options one by one) or none. */
  animation?: SelectAnimation
  /** Search box at the top of the menu. */
  searchable?: boolean
  /** Placeholder and accessible name of the search box. */
  searchPlaceholder?: string
  /** × button that resets the value. */
  clearable?: boolean
  disabled?: boolean
  /** Red border and aria-invalid on the trigger. */
  invalid?: boolean
  /** Leading icon in the trigger. */
  icon?: React.ReactNode
  /** Form field name (renders hidden inputs). */
  name?: string
  /** Shown when the search has no matches. */
  emptyText?: string
  /** Multiple: chips shown before "+N". */
  maxChips?: number
  /** Menu open state (controlled). */
  open?: boolean
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean
  /** Called when the menu opens or closes. */
  onOpenChange?: (open: boolean) => void
  /** Class for the dropdown menu. */
  menuClassName?: string
  /** Names the trigger and the listbox. Pass one unless a visible <label htmlFor={id}> points at the select. */
  "aria-label"?: string
  /** Goes on the combobox trigger, so <label htmlFor> works. */
  id?: string
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<SelectLabels>
}
export type SelectSingleProps = SelectBase & {
  /** true picks several values, shown as chips; value then becomes string[]. */
  multiple?: false
  /** Selected value (controlled): a string or null, or string[] with multiple. */
  value?: string | null
  /** Initial value when uncontrolled (string[] with multiple). */
  defaultValue?: string | null
  /** Called with the picked value (null after clearing), or with the full string[] with multiple. */
  onValueChange?: (value: string | null) => void
}
export type SelectMultipleProps = SelectBase & {
  multiple: true
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
}
export type SelectProps = SelectSingleProps | SelectMultipleProps

export type SelectLabels = { clear: string; selectedHint: (selected: string) => string; remove: (label: string) => string }
const DEFAULT_LABELS: SelectLabels = {
  clear: "Clear selection",
  selectedHint: (selected) => `${selected} selected. Backspace removes the last one.`,
  remove: (label) => `Remove ${label}`,
}

const CSS = `
.pc-select{--pc-c:var(--primary);--pc-fg:var(--primary-foreground)}
.pc-select[data-tone=neutral]{--pc-c:var(--foreground);--pc-fg:var(--background)}
.pc-select[data-tone=success]{--pc-c:oklch(0.53 0.13 155);--pc-fg:#fff}
.pc-select[data-tone=warning]{--pc-c:oklch(0.75 0.16 70);--pc-fg:oklch(0.25 0.05 70)}
.pc-select[data-tone=danger]{--pc-c:oklch(0.56 0.21 27);--pc-fg:#fff}
.pc-select[data-tone=info]{--pc-c:oklch(0.55 0.17 250);--pc-fg:#fff}
.dark .pc-select[data-tone=success]{--pc-c:oklch(0.7 0.16 155);--pc-fg:oklch(0.2 0.05 155)}
.dark .pc-select[data-tone=danger]{--pc-c:oklch(0.68 0.2 25);--pc-fg:oklch(0.2 0.05 25)}
.dark .pc-select[data-tone=info]{--pc-c:oklch(0.7 0.15 245);--pc-fg:oklch(0.2 0.05 245)}
.pc-select{--pc-tint:color-mix(in oklab,var(--pc-c) 14%,transparent);--pc-ink:color-mix(in oklab,var(--pc-c) 82%,var(--foreground))}
.pc-select[data-tone=warning]{--pc-ink:color-mix(in oklab,var(--pc-c) 62%,var(--foreground))}
.pc-select{--pc-ring:color-mix(in oklab,var(--pc-c) 32%,transparent);--pc-edge:color-mix(in oklab,var(--pc-c) 55%,var(--border))}
.pc-select{--pc-muted:color-mix(in oklab,var(--muted-foreground) 80%,var(--foreground))}

.pc-select-trigger{position:relative;color:var(--foreground);transition:border-color .15s,background-color .15s,box-shadow .15s,transform .12s}
.pc-select[data-variant=outline] .pc-select-trigger,.pc-select[data-variant=pill] .pc-select-trigger{background:var(--background);border:1px solid var(--input)}
.pc-select[data-variant=outline] .pc-select-trigger:hover,.pc-select[data-variant=pill] .pc-select-trigger:hover{border-color:color-mix(in oklab,var(--pc-c) 30%,var(--input))}
.pc-select[data-variant=filled] .pc-select-trigger{background:var(--muted);border:1px solid transparent}
.pc-select[data-variant=filled] .pc-select-trigger:hover{background:color-mix(in oklab,var(--foreground) 7%,var(--muted))}
.pc-select[data-variant=filled][data-open] .pc-select-trigger{background:var(--background)}
.pc-select[data-variant=ghost] .pc-select-trigger{border:1px solid transparent}
.pc-select[data-variant=ghost] .pc-select-trigger:hover,.pc-select[data-variant=ghost][data-open] .pc-select-trigger{background:var(--pc-tint)}
.pc-select[data-variant=underline] .pc-select-trigger{border-radius:0;border-bottom:1.5px solid var(--input);padding-inline:.125rem}
.pc-select[data-variant=underline] .pc-select-trigger::after{content:"";position:absolute;left:0;right:0;bottom:-1.5px;height:2px;background:var(--pc-c);transform:scaleX(0);transition:transform .25s var(--pc-ease-out)}
.pc-select[data-variant=underline][data-open] .pc-select-trigger::after,.pc-select[data-variant=underline] .pc-select-trigger:focus-within::after{transform:scaleX(1)}
.pc-select[data-variant=neo] .pc-select-trigger{background:var(--background);border:2px solid var(--foreground);box-shadow:3px 3px 0 var(--foreground)}
.pc-select[data-variant=neo][data-open] .pc-select-trigger{transform:translate(1px,1px);box-shadow:2px 2px 0 var(--foreground)}
.pc-select:not([data-variant=underline]):not([data-variant=neo]):not([data-variant=ghost])[data-open] .pc-select-trigger,
.pc-select:not([data-variant=underline]):not([data-variant=neo]) .pc-select-trigger:has(:focus-visible){border-color:var(--pc-edge);box-shadow:0 0 0 3px var(--pc-ring)}
.pc-select[data-variant=neo] .pc-select-trigger:has(:focus-visible){outline:2px solid var(--pc-c);outline-offset:3px}
.pc-select[data-invalid] .pc-select-trigger{border-color:oklch(0.56 0.21 27)}
.pc-select[data-variant=underline][data-invalid] .pc-select-trigger::after{background:oklch(0.56 0.21 27);transform:scaleX(1)}
.pc-select[data-shadow=sm] .pc-select-trigger{box-shadow:var(--pc-e1)}
.pc-select[data-shadow=md] .pc-select-trigger{box-shadow:var(--pc-e2)}
.pc-select[data-shadow=lg] .pc-select-trigger{box-shadow:var(--pc-e3)}
.pc-select-chev{transition:transform .2s var(--pc-ease-out);color:var(--pc-muted)}
.pc-select-muted{color:var(--pc-muted)}
.pc-select[data-open] .pc-select-chev{transform:rotate(180deg)}

.pc-select-menu{background:var(--popover);color:var(--popover-foreground);border:1px solid transparent;box-shadow:var(--pc-e2)}
.pc-select[data-variant=neo] .pc-select-menu{border:2px solid var(--foreground);box-shadow:4px 4px 0 var(--foreground)}
.pc-select-opt{position:relative;z-index:1;color:var(--foreground)}
/* One highlight glides between options instead of each option lighting up on its own. */
.pc-select-list{position:relative;isolation:isolate}
.pc-select-glide{position:absolute;top:0;inset-inline:0;height:var(--pc-gl-h,0);transform:translateY(var(--pc-gl-y,0));opacity:0;z-index:0;pointer-events:none;background:color-mix(in oklab,var(--pc-c) 6%,var(--accent));transition:transform 150ms var(--pc-ease-out),height 150ms var(--pc-ease-out),opacity 100ms ease}
.pc-select-glide[data-on]{opacity:1}
.pc-select-opt[data-selected]{color:var(--pc-ink)}
.pc-select[data-tone=neutral] .pc-select-opt[data-selected],.pc-select[data-tone=primary] .pc-select-opt[data-selected]{color:var(--foreground)}
.pc-select-opt[aria-disabled=true]{cursor:not-allowed}
.pc-select-opt[aria-disabled=true]>*{opacity:.45}
.pc-select-check{color:var(--pc-c)}
.pc-select-box{border:1.5px solid color-mix(in oklab,var(--foreground) 25%,transparent);transition:background-color .12s,border-color .12s}
.pc-select-opt[data-selected] .pc-select-box{background:var(--pc-c);border-color:var(--pc-c);color:var(--pc-fg)}
.pc-select-chip{background:color-mix(in oklab,var(--pc-c) 10%,var(--muted));color:var(--foreground);border:1px solid color-mix(in oklab,var(--pc-c) 16%,transparent)}
.pc-select[data-variant=neo] .pc-select-chip{border:1.5px solid var(--foreground);background:color-mix(in oklab,var(--pc-c) 18%,var(--background))}
.pc-select-hl{background:none;color:inherit;font-weight:600;text-decoration:underline;text-decoration-color:color-mix(in oklab,var(--pc-c) 60%,transparent);text-decoration-thickness:2px;text-underline-offset:2px}
@media (prefers-reduced-motion:reduce){.pc-select-glide,.pc-select-trigger,.pc-select-chev,.pc-select-trigger::after{transition:none!important}}
`

const SIZES = {
  sm: { trigger: "min-h-8 px-2.5 text-sm gap-1.5", chip: "h-5 text-[11px]", opt: "px-2 py-1.5 text-sm", icon: "[&_svg]:size-3.5" },
  md: { trigger: "min-h-10 px-3 text-sm gap-2", chip: "h-6 text-xs", opt: "px-2 py-2 text-sm", icon: "[&_svg]:size-4" },
  lg: { trigger: "min-h-12 px-4 text-base gap-2.5", chip: "h-7 text-sm", opt: "px-2.5 py-2.5 text-base", icon: "[&_svg]:size-[18px]" },
} satisfies Record<SelectSize, Record<string, string>>
const RADIUS: Record<SelectVariant, string> = { outline: "rounded-lg", filled: "rounded-lg", ghost: "rounded-lg", underline: "rounded-none", pill: "rounded-full", neo: "rounded-md" }
const MENU_RADIUS: Record<SelectVariant, string> = { outline: "rounded-xl", filled: "rounded-xl", ghost: "rounded-xl", underline: "rounded-lg", pill: "rounded-2xl", neo: "rounded-md" }

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()

function normalize(options: SelectBase["options"]): SelectOption[] {
  if (!options) return []
  const list = typeof options === "string" ? options.split(",").map((s) => s.trim()).filter(Boolean) : options
  return list.map((o) => (typeof o === "string" ? { value: o, label: o } : o))
}

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
    <span
      aria-hidden="true"
      className="grid size-6 shrink-0 place-items-center rounded-full text-[10px] font-semibold text-white"
      style={{ background: `oklch(0.5 0.13 ${h})` }}
    >
      {initials}
    </span>
  )
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>
  const i = fold(text).indexOf(fold(query))
  if (i < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, i)}
      <mark className="pc-select-hl">{text.slice(i, i + query.length)}</mark>
      {text.slice(i + query.length)}
    </>
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

export function Select(props: SelectProps) {
  const {
    options: rawOptions,
    placeholder = "Select…",
    variant = "outline",
    tone = "primary",
    size = "md",
    shadow = "none",
    animation = "fade-scale",
    searchable,
    searchPlaceholder = "Search…",
    clearable,
    disabled,
    invalid,
    icon,
    name,
    emptyText = "No results",
    maxChips = 3,
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
  const l = useLabels("select", DEFAULT_LABELS, labels)
  const prefersReduced = useReducedMotion()
  // Gate reduced motion behind mount so a defaultOpen menu renders the same on server and first client pass.
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  const reduce = mounted && !!prefersReduced
  const id = React.useId()
  const triggerId = idProp ?? id + "-trigger"
  const listId = id + "-list"
  const optId = (i: number) => `${id}-opt-${i}`

  const options = React.useMemo(() => normalize(rawOptions), [rawOptions])
  const [inner, setInner] = React.useState<string | string[] | null | undefined>(defaultValue)
  const current = valueProp !== undefined ? valueProp : inner
  const selected: string[] = Array.isArray(current) ? current : current ? [current] : []
  const commit = (next: string[]) => {
    const v = multiple ? next : (next[0] ?? null)
    if (valueProp === undefined) setInner(v)
    ;(onValueChange as ((v: string | string[] | null) => void) | undefined)?.(v)
  }

  const [openInner, setOpenInner] = React.useState(defaultOpen)
  const open = openProp ?? openInner
  const setOpen = (o: boolean) => {
    if (openProp === undefined) setOpenInner(o)
    onOpenChange?.(o)
  }

  const [query, setQuery] = React.useState("")
  const [active, setActive] = React.useState(-1)
  const [side, setSide] = React.useState<"bottom" | "top">("bottom")
  const [rtl, setRtl] = React.useState(false)
  const root = React.useRef<HTMLDivElement>(null)
  const trigger = React.useRef<HTMLButtonElement>(null)
  const menu = React.useRef<HTMLDivElement>(null)
  const search = React.useRef<HTMLInputElement>(null)
  const typed = React.useRef({ text: "", at: 0 })

  const visible = React.useMemo(() => {
    const q = fold(query.trim())
    if (!q) return options
    return options.filter((o) => fold([o.label, o.description ?? "", o.group ?? "", ...(o.keywords ?? [])].join(" ")).includes(q))
  }, [options, query])

  // Groups keep the order in which they first appear.
  const groups = React.useMemo(() => {
    const out: { name?: string; items: { o: SelectOption; i: number }[] }[] = []
    visible.forEach((o, i) => {
      const g = out.find((x) => x.name === o.group)
      if (g) g.items.push({ o, i })
      else out.push({ name: o.group, items: [{ o, i }] })
    })
    return out
  }, [visible])

  const enabledIdx = (from: number, dir: 1 | -1) => {
    const n = visible.length
    for (let k = 1; k <= n; k++) {
      const i = (((from + dir * k) % n) + n) % n
      if (!visible[i]!.disabled) return i
    }
    return -1
  }

  const openMenu = () => {
    if (disabled) return
    const sel = visible.findIndex((o) => selected.includes(o.value) && !o.disabled)
    setActive(sel >= 0 ? sel : enabledIdx(-1, 1))
    setOpen(true)
  }
  const closeMenu = (focusTrigger = true) => {
    setOpen(false)
    setQuery("")
    if (focusTrigger) trigger.current?.focus()
  }

  const pick = (o: SelectOption) => {
    if (o.disabled) return
    if (multiple) commit(selected.includes(o.value) ? selected.filter((v) => v !== o.value) : [...selected, o.value])
    else {
      commit([o.value])
      closeMenu()
    }
  }

  // Flip up when the menu would overflow the viewport and there is more room above.
  React.useLayoutEffect(() => {
    if (!open || !root.current) return
    const r = root.current.getBoundingClientRect()
    const h = menu.current?.offsetHeight ?? 280
    const below = window.innerHeight - r.bottom
    setSide(below < h + 12 && r.top > below ? "top" : "bottom")
    setRtl(getComputedStyle(root.current).direction === "rtl")
  }, [open, visible.length])

  React.useEffect(() => {
    if (!open) return
    if (searchable) search.current?.focus()
    const onDown = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) closeMenu(false)
    }
    document.addEventListener("pointerdown", onDown)
    return () => document.removeEventListener("pointerdown", onDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, searchable])

  React.useEffect(() => {
    if (!open || active < 0) return
    menu.current?.querySelector<HTMLElement>(`[id="${optId(active)}"]`)?.scrollIntoView({ block: "nearest" })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, open])

  // Keep the active row valid as the search narrows the list.
  React.useEffect(() => {
    if (open) setActive(visible[0] ? (visible[0].disabled ? enabledIdx(0, 1) : 0) : -1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const typeAhead = (key: string) => {
    const now = Date.now()
    const t = typed.current
    t.text = now - t.at > 600 ? key : t.text + key
    t.at = now
    const q = fold(t.text)
    const start = t.text.length === 1 ? active + 1 : active
    for (let k = 0; k < visible.length; k++) {
      const i = (start + k) % visible.length
      const o = visible[i]!
      if (!o.disabled && fold(o.label).startsWith(q)) {
        if (!open) openMenu()
        setActive(i)
        return true
      }
    }
    return false
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled || (e.target as HTMLElement).closest("[data-clear],[data-chip-x]")) return
    const inSearch = e.target === search.current
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault()
        openMenu()
      } else if (e.key === "Backspace" && multiple && selected.length) {
        e.preventDefault()
        commit(selected.slice(0, -1))
      } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (searchable) {
          openMenu()
          setQuery(e.key)
          e.preventDefault()
        } else typeAhead(e.key)
      }
      return
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setActive((a) => enabledIdx(a, 1))
        break
      case "ArrowUp":
        e.preventDefault()
        setActive((a) => enabledIdx(a < 0 ? 0 : a, -1))
        break
      case "Home":
        if (inSearch) break
        e.preventDefault()
        setActive(enabledIdx(-1, 1))
        break
      case "End":
        if (inSearch) break
        e.preventDefault()
        setActive(enabledIdx(visible.length, -1))
        break
      case "Enter":
        e.preventDefault()
        if (visible[active]) pick(visible[active])
        break
      case " ":
        if (inSearch) break
        e.preventDefault()
        if (visible[active]) pick(visible[active])
        break
      case "Escape":
        e.preventDefault()
        e.stopPropagation()
        closeMenu()
        break
      case "Tab":
        closeMenu(false)
        break
      default:
        if (!inSearch && e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) typeAhead(e.key)
    }
  }

  const byValue = (v: string) => options.find((o) => o.value === v)
  const chosen = selected.map(byValue).filter((o): o is SelectOption => !!o)
  const s = SIZES[size]
  const pop = side === "bottom" ? -1 : 1
  const t: Transition = reduce || animation === "none" ? { duration: 0 } : spring.snap
  const menuMotion =
    animation === "fade-scale"
      ? { initial: { opacity: 0, scale: 0.96, y: pop * 4 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.97, y: pop * 2 } }
      : animation === "slide"
        ? { initial: { opacity: 0, y: pop * 10, clipPath: side === "bottom" ? "inset(0 0 100% 0)" : "inset(100% 0 0 0)" }, animate: { opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)" }, exit: { opacity: 0, y: pop * 6 } }
        : animation === "stagger"
          ? { initial: { opacity: 0, y: pop * 4 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0 } }
          : { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
  const reduced = reduce ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } } : menuMotion
  const exitT: Transition = reduce || animation === "none" ? { duration: 0 } : { duration: 0.1, ease: easing.out }
  // Opened from the keyboard: no entrance at all. Frequent actions stay quiet.
  const byKey = React.useRef(false)
  const wasOpen = React.useRef(false)
  if (open && !wasOpen.current) byKey.current = typeof document !== "undefined" && !!document.activeElement?.matches(":focus-visible")
  wasOpen.current = open
  const menuT: Transition = reduce || animation === "none" || byKey.current ? { duration: 0 } : { duration: 0.15, ease: easing.out }

  const glide = React.useRef<HTMLDivElement>(null)
  React.useLayoutEffect(() => {
    const g = glide.current
    if (!g) return
    const t = active >= 0 ? document.getElementById(optId(active)) : null
    if (!t) {
      delete g.dataset.on
      return
    }
    // From hidden it appears in place; only a move between options slides.
    if (!g.dataset.on) g.style.transition = "none"
    g.style.setProperty("--pc-gl-y", `${t.offsetTop}px`)
    g.style.setProperty("--pc-gl-h", `${t.offsetHeight}px`)
    g.dataset.on = ""
    void g.offsetHeight
    g.style.transition = ""
  })

  const shown = multiple ? chosen.slice(0, maxChips) : []
  const more = multiple ? chosen.length - shown.length : 0

  const trig = (content: React.ReactNode, extra: string) => (
    <button
      ref={trigger}
      id={triggerId}
      type="button"
      role="combobox"
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls={open ? listId : undefined}
      aria-activedescendant={open && !searchable && active >= 0 ? optId(active) : undefined}
      aria-label={ariaLabel}
      aria-invalid={invalid || undefined}
      disabled={disabled}
      className={cn("pc-press pc-press-soft flex min-w-0 flex-1 items-center text-start outline-none", extra)}
    >
      {content}
    </button>
  )

  return (
    <>
      <GooduiTokens />
      <style href="pc-select" precedence="default">
        {CSS}
      </style>
      <div
        {...rest}
        ref={root}
        data-slot="select"
        data-variant={variant}
        data-tone={tone}
        data-shadow={variant === "neo" ? "none" : shadow}
        data-open={open ? "" : undefined}
        data-invalid={invalid ? "" : undefined}
        className={cn("pc-select relative w-72 max-w-full", disabled && "pointer-events-none opacity-55", className)}
        onBlur={(e) => {
          rest.onBlur?.(e)
          if (open && !root.current?.contains(e.relatedTarget as Node | null)) closeMenu(false)
        }}
        onKeyDown={(e) => {
          rest.onKeyDown?.(e)
          if (!e.defaultPrevented) onKeyDown(e)
        }}
      >
        <div
          className={cn("pc-select-trigger flex w-full cursor-pointer items-center py-1", s.trigger, s.icon, RADIUS[variant])}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("[data-clear],[data-chip-x]")) return
            if (open) closeMenu()
            else {
              openMenu()
              trigger.current?.focus()
            }
          }}
        >
          {icon && <span className="pc-select-muted inline-flex shrink-0">{icon}</span>}
          {/* Chips sit beside the combobox (not inside it) so their remove buttons are real, tabbable buttons. The
              combobox keeps the same slot either way, so picking the first value never remounts it (focus stays). */}
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
            {multiple && (
              <AnimatePresence initial={false} mode="popLayout">
                {shown.map((o) => (
                  <motion.span
                    key={o.value}
                    layout={!reduce && animation !== "none"}
                    initial={reduce || animation === "none" ? false : { opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={t}
                    className={cn("pc-select-chip inline-flex max-w-full items-center gap-1 rounded-md ps-1.5 pe-0.5 font-medium", s.chip, variant === "pill" && "rounded-full ps-2")}
                  >
                    {o.avatar ? <span className="-ms-0.5 scale-75">{<Avatar src={o.avatar} label={o.label} />}</span> : null}
                    <span className="truncate">{o.label}</span>
                    <button
                      type="button"
                      data-chip-x=""
                      aria-label={l.remove(o.label)}
                      disabled={disabled}
                      onClick={() => {
                        commit(selected.filter((v) => v !== o.value))
                        trigger.current?.focus()
                      }}
                      className="pc-press grid size-4 shrink-0 cursor-pointer place-items-center rounded-sm opacity-70 outline-none hover:bg-foreground/10 hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring/60"
                    >
                      <Cross className="!size-3" />
                    </button>
                  </motion.span>
                ))}
              </AnimatePresence>
            )}
            {multiple && more > 0 && <span className={cn("pc-select-chip inline-flex items-center rounded-md px-1.5 font-medium", s.chip)}>+{more}</span>}
            {trig(
              multiple && chosen.length > 0 ? (
                <span className="sr-only">{l.selectedHint(chosen.map((o) => o.label).join(", "))}</span>
              ) : chosen[0] && !multiple ? (
                <span className="flex min-w-0 items-center gap-2">
                  {chosen[0].avatar ? (
                    <Avatar src={chosen[0].avatar} label={chosen[0].label} />
                  ) : chosen[0].icon ? (
                    <span className="pc-select-muted inline-flex shrink-0">{chosen[0].icon}</span>
                  ) : null}
                  <span className="truncate">{chosen[0].label}</span>
                </span>
              ) : (
                <span className="pc-select-muted truncate">{placeholder}</span>
              ),
              multiple && chosen.length > 0 ? "min-w-6 self-stretch" : "gap-1",
            )}
          </div>
          {clearable && chosen.length > 0 && !disabled && (
            <button
              type="button"
              data-clear=""
              aria-label={l.clear}
              onClick={() => {
                commit([])
                trigger.current?.focus()
              }}
              className="pc-press pc-select-muted grid size-5 shrink-0 place-items-center rounded-md outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <Cross className="!size-3.5" />
            </button>
          )}
          <svg className="pc-select-chev !size-4 shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {name &&
          (multiple ? selected.map((v) => <input key={v} type="hidden" name={name} value={v} />) : <input type="hidden" name={name} value={selected[0] ?? ""} />)}

        <AnimatePresence>
          {open && (
            <motion.div
              ref={menu}
              key="menu"
              {...reduced}
              transition={menuT}
              exit={{ ...reduced.exit, transition: exitT }}
              style={{ transformOrigin: side === "bottom" ? "top center" : "bottom center" }}
              className={cn(
                "pc-select-menu absolute inset-x-0 z-50 min-w-48 overflow-hidden p-1",
                side === "bottom" ? "top-full mt-1.5" : "bottom-full mb-1.5",
                MENU_RADIUS[variant],
                menuClassName,
              )}
            >
              {searchable && (
                <div className="flex items-center gap-2 border-b px-2 pb-1.5 [&_svg]:size-4">
                  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="pc-select-muted shrink-0">
                    <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <input
                    ref={search}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    aria-label={searchPlaceholder}
                    aria-controls={listId}
                    aria-activedescendant={active >= 0 ? optId(active) : undefined}
                    aria-autocomplete="list"
                    role="combobox"
                    aria-expanded="true"
                    className="h-8 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>
              )}
              <div
                id={listId}
                role="listbox"
                aria-multiselectable={multiple || undefined}
                aria-label={ariaLabel}
                aria-labelledby={ariaLabel ? undefined : triggerId}
                className={cn("pc-select-list max-h-72 overflow-y-auto overscroll-contain", searchable && "pt-1")}>
                <div ref={glide} aria-hidden="true" className={cn("pc-select-glide rounded-md", variant === "pill" && "rounded-xl")} />
                {visible.length === 0 && <div className="px-3 py-6 text-center text-sm text-muted-foreground">{emptyText}</div>}
                {groups.map((g, gi) => (
                  <div key={g.name ?? "_" + gi} role="group" aria-label={g.name}>
                    {g.name && (
                      <div className={cn("pc-select-muted px-2 pt-2 pb-1 text-[11px] font-medium tracking-wide uppercase", gi > 0 && "mt-1 border-t pt-2.5")}>{g.name}</div>
                    )}
                    {g.items.map(({ o, i }) => {
                      const isSel = selected.includes(o.value)
                      return (
                        <motion.div
                          key={o.value}
                          id={optId(i)}
                          role="option"
                          aria-selected={isSel}
                          aria-disabled={o.disabled || undefined}
                          data-active={i === active ? "" : undefined}
                          data-selected={isSel ? "" : undefined}
                          initial={animation === "stagger" && !reduce ? { opacity: 0, x: rtl ? 6 : -6 } : false}
                          animate={{ opacity: 1, x: 0 }}
                          transition={animation === "stagger" && !reduce ? { delay: Math.min(i, 10) * 0.028, duration: 0.22, ease: easing.out } : { duration: 0 }}
                          onPointerMove={() => !o.disabled && active !== i && setActive(i)}
                          onPointerDown={(e) => e.preventDefault()}
                          onClick={() => pick(o)}
                          className={cn("pc-select-opt flex cursor-pointer items-center gap-2.5 rounded-md select-none", s.opt, variant === "pill" && "rounded-xl")}
                        >
                          {multiple && (
                            <span className="pc-select-box grid size-4 shrink-0 place-items-center rounded-[5px]">{isSel && <Check className="size-3" />}</span>
                          )}
                          {o.avatar ? (
                            <Avatar src={o.avatar} label={o.label} />
                          ) : o.icon ? (
                            <span className="pc-select-muted inline-flex shrink-0 [&_svg]:size-4">{o.icon}</span>
                          ) : null}
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate">
                              <Highlight text={o.label} query={query.trim()} />
                            </span>
                            {o.description && <span className="pc-select-muted truncate text-xs">{o.description}</span>}
                          </span>
                          {!multiple && isSel && <Check className="pc-select-check size-4 shrink-0" />}
                        </motion.div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}

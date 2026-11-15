"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion, useIsPresent, useReducedMotion, type Transition } from "motion/react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import { GooduiTokens, ease as easing } from "@/lib/goodui-motion"

/*
 * Menu button and context menu, independent layers: every axis combines with every other.
 *   variant    default, glass, neo, inverted, flat (menu surface)   tone       accent for highlight, checks and bars
 *   highlight  soft, solid, bar, outline (active item)              size       sm, md, lg
 *   shadow     none, sm, md, lg                                    shape      square, rounded, pill
 *   animation  none, fade, scale, slide, stagger (open)            mode       menu (trigger) or context (right-click)
 * Items: actions with icons, descriptions, badges and shortcuts, checkbox items, radio groups, labelled groups,
 * separators, destructive items and nested sub-menus (hover intent with a safe triangle, or arrow keys).
 * Keyboard follows the WAI-ARIA menu button pattern: ↑ ↓ Home End, → opens a sub-menu, ← closes it, Enter/Space
 * activate, Esc closes one level, Tab closes everything, letters jump (type-ahead).
 * Menus render in a portal on document.body and flip/shift to stay inside the viewport.
 */

export type DropdownMenuVariant = "default" | "glass" | "neo" | "inverted" | "flat"
export type DropdownMenuTone = "primary" | "neutral" | "success" | "warning" | "danger" | "info"
export type DropdownMenuSize = "sm" | "md" | "lg"
export type DropdownMenuShadow = "none" | "sm" | "md" | "lg"
export type DropdownMenuAnimation = "none" | "fade" | "scale" | "slide" | "stagger"
export type DropdownMenuShape = "square" | "rounded" | "pill"
export type DropdownMenuHighlight = "soft" | "solid" | "bar" | "outline"
export type DropdownMenuSide = "top" | "bottom" | "left" | "right"
export type DropdownMenuAlign = "start" | "center" | "end"

type ItemBase = {
  label: string
  icon?: React.ReactNode
  /** Second, muted line. */
  description?: string
  /** Shown on the right as keycaps, e.g. "Mod+D" (⌘D on Mac, Ctrl+D elsewhere), "Shift+Mod+E", "Delete". */
  shortcut?: string
  disabled?: boolean
}
export type DropdownMenuAction = ItemBase & {
  type?: "item"
  id?: string
  /** Paints the item in the danger color (delete, cancel booking). */
  destructive?: boolean
  /** Renders the item as a link. */
  href?: string
  target?: string
  /** Small trailing badge, e.g. a count or "New". */
  badge?: React.ReactNode
  onSelect?: () => void
  /** Keep the menu open after selecting. */
  keepOpen?: boolean
}
export type DropdownMenuCheckbox = ItemBase & {
  type: "checkbox"
  id: string
  /** Controlled state. */
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  /** Checkbox items keep the menu open by default; false closes it. */
  keepOpen?: boolean
}
export type DropdownMenuRadioOption = ItemBase & { value: string }
export type DropdownMenuRadioGroup = {
  type: "radio"
  id: string
  /** Visible heading and accessible name of the group. */
  label?: string
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  options: DropdownMenuRadioOption[]
  /** Radio items close the menu by default; true keeps it open. */
  keepOpen?: boolean
}
export type DropdownMenuSub = ItemBase & { type: "sub"; id?: string; items: DropdownMenuItem[] }
export type DropdownMenuGroup = { type: "group"; label?: string; items: DropdownMenuItem[] }
export type DropdownMenuLabel = { type: "label"; label: string }
export type DropdownMenuSeparator = { type: "separator" }
export type DropdownMenuItem =
  | DropdownMenuAction
  | DropdownMenuCheckbox
  | DropdownMenuRadioGroup
  | DropdownMenuSub
  | DropdownMenuGroup
  | DropdownMenuLabel
  | DropdownMenuSeparator

export type DropdownMenuLabels = {
  /** Text of the built-in trigger. */
  trigger: string
  /** Accessible name of a context menu. */
  contextMenu: string
  /** Name of a modifier or special key on non-Mac keyboards ("Ctrl", "Shift", "Alt", "Del", "Esc", "Enter", "Tab", "Space"). */
  keyName: (key: string) => string
}
const DEFAULT_LABELS: DropdownMenuLabels = { trigger: "Options", contextMenu: "Context menu", keyName: (key) => key }

export type DropdownMenuProps = Omit<React.ComponentProps<"div">, "children" | "onSelect"> & {
  items: DropdownMenuItem[]
  /** menu opens from the trigger; context opens at the pointer on right-click (or long-press) inside children. */
  mode?: "menu" | "context"
  /** Your trigger element (usually a button). It gets the ARIA and handlers. Without it a built-in button is shown. */
  trigger?: React.ReactElement
  /** Text of the built-in trigger. */
  label?: React.ReactNode
  /** Context mode: the area that opens the menu on right-click. */
  children?: React.ReactNode
  /** Menu surface: default (popover), glass, neo, inverted or flat. */
  variant?: DropdownMenuVariant
  /** Accent for the highlight, check marks and bars. */
  tone?: DropdownMenuTone
  /** How the active item is painted: soft tint, solid tone fill, a bar at the start edge, or an outline. */
  highlight?: DropdownMenuHighlight
  size?: DropdownMenuSize
  shadow?: DropdownMenuShadow
  shape?: DropdownMenuShape
  /** How menus open. stagger cascades the items in. Reduced motion turns it into a short fade. */
  animation?: DropdownMenuAnimation
  /** Preferred side; flips when there is no room. */
  side?: DropdownMenuSide
  /** Alignment along the side; start follows the reading direction. */
  align?: DropdownMenuAlign
  /** Gap between trigger and menu in px. */
  sideOffset?: number
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Also run items' shortcuts as global hotkeys while the page is focused. */
  bindShortcuts?: boolean
  /** Arrow keys wrap from the last item to the first. */
  loop?: boolean
  disabled?: boolean
  /** Class for every menu panel (root and sub-menus). */
  menuClassName?: string
  /** Names the menu. Defaults to the trigger's text (menu) or labels.contextMenu (context). */
  "aria-label"?: string
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<DropdownMenuLabels>
}

const CSS = `
.pc-ddm{--pc-c:var(--primary);--pc-fg:var(--primary-foreground)}
.pc-ddm[data-tone=neutral]{--pc-c:var(--foreground);--pc-fg:var(--background)}
.pc-ddm[data-tone=success]{--pc-c:oklch(0.53 0.13 155);--pc-fg:#fff}
.pc-ddm[data-tone=warning]{--pc-c:oklch(0.75 0.16 70);--pc-fg:oklch(0.25 0.05 70)}
.pc-ddm[data-tone=danger]{--pc-c:oklch(0.56 0.21 27);--pc-fg:#fff}
.pc-ddm[data-tone=info]{--pc-c:oklch(0.55 0.17 250);--pc-fg:#fff}
.dark .pc-ddm[data-tone=success]{--pc-c:oklch(0.7 0.16 155);--pc-fg:oklch(0.2 0.05 155)}
.dark .pc-ddm[data-tone=danger]{--pc-c:oklch(0.68 0.2 25);--pc-fg:oklch(0.2 0.05 25)}
.dark .pc-ddm[data-tone=info]{--pc-c:oklch(0.7 0.15 245);--pc-fg:oklch(0.2 0.05 245)}
.pc-ddm{--pc-tint:color-mix(in oklab,var(--pc-c) 14%,transparent);--pc-ink:color-mix(in oklab,var(--pc-c) 82%,var(--foreground))}
.pc-ddm[data-tone=warning]{--pc-ink:color-mix(in oklab,var(--pc-c) 62%,var(--foreground))}

.pc-ddm-trigger{background:var(--background);color:var(--foreground);border:1px solid var(--input);transition:border-color .15s,background-color .15s,box-shadow .15s}
.pc-ddm-trigger:hover{background:color-mix(in oklab,var(--pc-c) 5%,var(--background));border-color:color-mix(in oklab,var(--pc-c) 30%,var(--input))}
.pc-ddm-trigger:focus-visible{outline:none;border-color:color-mix(in oklab,var(--pc-c) 55%,var(--border));box-shadow:0 0 0 3px color-mix(in oklab,var(--pc-c) 32%,transparent)}
.pc-ddm-trigger svg{transition:transform .2s var(--pc-ease-out);color:var(--muted-foreground)}
.pc-ddm-trigger[aria-expanded=true] svg{transform:rotate(180deg)}

.pc-ddm-surface{--pc-bg:var(--popover);--pc-text:var(--popover-foreground);--pc-sub:color-mix(in oklab,var(--muted-foreground) 85%,var(--popover-foreground));--pc-line:var(--border);position:relative;isolation:isolate;background:var(--pc-bg);color:var(--pc-text);border:1px solid var(--pc-line);outline:none}
.pc-ddm[data-variant=glass] .pc-ddm-surface{--pc-bg:color-mix(in oklab,var(--popover) 70%,transparent);--pc-line:color-mix(in oklab,var(--foreground) 12%,transparent);-webkit-backdrop-filter:blur(18px) saturate(1.7);backdrop-filter:blur(18px) saturate(1.7)}
.pc-ddm[data-variant=neo] .pc-ddm-surface{--pc-line:var(--foreground);border-width:2px;box-shadow:4px 4px 0 var(--foreground)!important}
.pc-ddm[data-variant=inverted] .pc-ddm-surface{--pc-bg:var(--foreground);--pc-text:var(--background);--pc-sub:color-mix(in oklab,var(--background) 62%,var(--foreground));--pc-line:color-mix(in oklab,var(--background) 16%,var(--foreground))}
.pc-ddm[data-variant=inverted][data-tone=neutral]{--pc-c:var(--background);--pc-fg:var(--foreground)}
.pc-ddm[data-variant=flat] .pc-ddm-surface{--pc-bg:var(--card);--pc-text:var(--card-foreground);box-shadow:none!important}
.pc-ddm[data-shadow=sm] .pc-ddm-surface{box-shadow:var(--pc-e1)}
.pc-ddm[data-shadow=md] .pc-ddm-surface{box-shadow:var(--pc-e2)}
.pc-ddm[data-shadow=lg] .pc-ddm-surface{box-shadow:var(--pc-e3)}
.pc-ddm:is([data-variant=default],[data-variant=inverted]):not([data-shadow=none]) .pc-ddm-surface{border-color:transparent}
/* One highlight glides between rows instead of each row lighting up on its own. */
.pc-ddm-glide{position:absolute;top:0;left:var(--pc-gl-x,4px);right:var(--pc-gl-x,4px);height:var(--pc-gl-h,0);transform:translateY(var(--pc-gl-y,0));opacity:0;z-index:0;pointer-events:none;transition:transform 150ms var(--pc-ease-out),height 150ms var(--pc-ease-out),opacity 100ms ease}
.pc-ddm-glide[data-on]{opacity:1}
.pc-ddm-glide[data-destructive]{--pc-c:oklch(0.56 0.21 27)}
.pc-ddm[data-hl=soft] .pc-ddm-glide{background:color-mix(in oklab,var(--pc-c) 12%,color-mix(in oklab,var(--pc-text) 5%,transparent))}
.pc-ddm[data-hl=solid] .pc-ddm-glide{background:var(--pc-c)}
.pc-ddm[data-hl=bar] .pc-ddm-glide{background:color-mix(in oklab,var(--pc-text) 6%,transparent)}
.pc-ddm[data-hl=outline] .pc-ddm-glide{background:color-mix(in oklab,var(--pc-c) 6%,transparent);box-shadow:inset 0 0 0 1.5px color-mix(in oklab,var(--pc-c) 65%,transparent)}

.pc-ddm-item{z-index:1;color:var(--pc-text);outline:none;cursor:default;text-decoration:none;-webkit-tap-highlight-color:transparent}
.pc-ddm-item[data-disabled]{opacity:.45;cursor:not-allowed}
.pc-ddm-sub,.pc-ddm-kbd{color:var(--pc-sub)}
.pc-ddm-icon{color:var(--pc-sub)}
.pc-ddm-ind{color:var(--pc-c)}
.pc-ddm[data-tone=neutral] .pc-ddm-ind{color:var(--pc-text)}
.pc-ddm[data-hl=solid] .pc-ddm-item:is(:focus,[data-open]){color:var(--pc-fg)}
.pc-ddm[data-hl=solid] .pc-ddm-item:is(:focus,[data-open]) :is(.pc-ddm-sub,.pc-ddm-kbd,.pc-ddm-icon,.pc-ddm-ind){color:inherit}
.pc-ddm[data-hl=solid] .pc-ddm-item:is(:focus,[data-open]) kbd{border-color:color-mix(in oklab,var(--pc-fg) 35%,transparent);background:transparent}
.pc-ddm[data-hl=bar] .pc-ddm-item::before{content:"";position:absolute;inset-block:5px;inset-inline-start:0;width:3px;border-radius:3px;background:var(--pc-c);transform:scaleY(0);transition:transform .16s var(--pc-ease-out)}
.pc-ddm[data-hl=bar] .pc-ddm-item:is(:focus,[data-open])::before{transform:scaleY(1)}
.pc-ddm[data-hl=outline] .pc-ddm-item:is(:focus,[data-open]){background:color-mix(in oklab,var(--pc-c) 6%,transparent);box-shadow:inset 0 0 0 1.5px color-mix(in oklab,var(--pc-c) 65%,transparent)}
.pc-ddm-item[data-destructive]{--pc-c:oklch(0.56 0.21 27);--pc-fg:#fff;color:oklch(0.52 0.2 27)}
.dark .pc-ddm-item[data-destructive]{--pc-c:oklch(0.68 0.2 25);--pc-fg:oklch(0.2 0.05 25);color:oklch(0.72 0.17 25)}
.pc-ddm[data-variant=inverted] .pc-ddm-item[data-destructive]{--pc-c:oklch(0.68 0.2 25);--pc-fg:oklch(0.2 0.05 25);color:oklch(0.74 0.16 25)}
.dark .pc-ddm[data-variant=inverted] .pc-ddm-item[data-destructive]{--pc-c:oklch(0.56 0.21 27);--pc-fg:#fff;color:oklch(0.5 0.2 27)}
.pc-ddm-item[data-destructive] .pc-ddm-icon{color:inherit}
.pc-ddm-sep{background:var(--pc-line)}
.pc-ddm-label{color:var(--pc-sub)}
.pc-ddm-kbd kbd{font:inherit;font-size:.72rem;line-height:1.45;min-width:1.35em;padding:0 .3em;text-align:center;border-radius:4px;border:1px solid var(--pc-line);background:color-mix(in oklab,var(--pc-text) 4%,transparent)}
.pc-ddm-badge{background:var(--pc-tint);color:var(--pc-ink)}
.pc-ddm[data-variant=inverted] .pc-ddm-badge{background:color-mix(in oklab,var(--pc-text) 14%,transparent);color:var(--pc-text)}
.pc-ddm-box{border:1.5px solid color-mix(in oklab,var(--pc-text) 28%,transparent);transition:background-color .12s,border-color .12s}
.pc-ddm-item[aria-checked=true] .pc-ddm-box{background:var(--pc-c);border-color:var(--pc-c);color:var(--pc-fg)}
.pc-ddm[data-hl=solid] .pc-ddm-item:is(:focus,[data-open])[aria-checked=true] .pc-ddm-box{background:var(--pc-fg);border-color:var(--pc-fg);color:var(--pc-c)}
.pc-ddm-mark{transform:scale(.4);opacity:0;transition:transform .18s var(--pc-ease-spring),opacity .12s}
.pc-ddm-item[aria-checked=true] .pc-ddm-mark{transform:scale(1);opacity:1}
@media (prefers-reduced-motion:reduce){.pc-ddm-glide,.pc-ddm-trigger,.pc-ddm-trigger svg,.pc-ddm-item::before,.pc-ddm-mark,.pc-ddm-box{transition:none!important}}
`

const SIZES = {
  sm: { panel: "min-w-44 p-1", item: "min-h-7 gap-2 px-2 py-1 text-xs [&_svg]:size-3.5", label: "px-2 pt-1.5 pb-1 text-[10px]", trigger: "h-8 px-2.5 text-xs gap-1.5", ind: "size-3.5" },
  md: { panel: "min-w-52 p-1", item: "min-h-8 gap-2.5 px-2 py-1.5 text-sm [&_svg]:size-4", label: "px-2 pt-2 pb-1 text-[11px]", trigger: "h-10 px-3 text-sm gap-2", ind: "size-4" },
  lg: { panel: "min-w-60 p-1.5", item: "min-h-10 gap-3 px-3 py-2 text-[15px] [&_svg]:size-[18px]", label: "px-3 pt-2 pb-1 text-xs", trigger: "h-11 px-4 text-base gap-2", ind: "size-[18px]" },
} satisfies Record<DropdownMenuSize, Record<string, string>>
const SHAPES: Record<DropdownMenuShape, { panel: string; item: string; trigger: string }> = {
  square: { panel: "rounded-none", item: "rounded-none", trigger: "rounded-none" },
  rounded: { panel: "rounded-xl", item: "rounded-md", trigger: "rounded-lg" },
  pill: { panel: "rounded-[1.25rem]", item: "rounded-xl", trigger: "rounded-full" },
}

/* ---------- floating placement (flip + shift, no library) ---------- */

type Side = DropdownMenuSide
type Rect = { top: number; left: number; right: number; bottom: number; width: number; height: number }
type Placement = { x: number; y: number; side: Side; maxH: number }
type PlaceOpts = { side: Side; align: DropdownMenuAlign; offset: number; alignOffset: number; rtl: boolean }

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(v, hi))
const FLIP: Record<Side, Side> = { top: "bottom", bottom: "top", left: "right", right: "left" }

function place(a: Rect, w: number, h: number, o: PlaceOpts): Placement {
  const pad = 8
  const vw = document.documentElement.clientWidth
  const vh = window.innerHeight
  const room: Record<Side, number> = { top: a.top - o.offset - pad, bottom: vh - a.bottom - o.offset - pad, left: a.left - o.offset - pad, right: vw - a.right - o.offset - pad }
  const vertical = (s: Side) => s === "top" || s === "bottom"
  let side = o.side
  if (room[side] < (vertical(side) ? h : w) && room[FLIP[side]] > room[side]) side = FLIP[side]
  if (vertical(side)) {
    const align = o.rtl && o.align !== "center" ? (o.align === "start" ? "end" : "start") : o.align
    const maxH = Math.max(96, room[side])
    const hh = Math.min(h, maxH)
    const x = align === "start" ? a.left + o.alignOffset : align === "end" ? a.right - w - o.alignOffset : a.left + a.width / 2 - w / 2
    return { x: clamp(x, pad, vw - pad - w), y: side === "bottom" ? a.bottom + o.offset : a.top - o.offset - hh, side, maxH }
  }
  const maxH = vh - pad * 2
  const hh = Math.min(h, maxH)
  const y = o.align === "start" ? a.top + o.alignOffset : o.align === "end" ? a.bottom - hh - o.alignOffset : a.top + a.height / 2 - hh / 2
  const x = side === "right" ? a.right + o.offset : a.left - o.offset - w
  return { x: clamp(x, pad, vw - pad - w), y: clamp(y, pad, vh - pad - hh), side, maxH }
}

function usePlacement(open: boolean, anchor: () => Rect | null, surface: React.RefObject<HTMLElement | null>, opts: PlaceOpts) {
  const [p, setP] = React.useState<Placement | null>(null)
  const live = React.useRef({ anchor, opts })
  React.useLayoutEffect(() => {
    live.current = { anchor, opts }
  })
  React.useLayoutEffect(() => {
    if (!open) {
      setP(null)
      return
    }
    const update = () => {
      const el = surface.current
      const a = live.current.anchor()
      if (!el || !a) return
      const next = place(a, el.offsetWidth, el.scrollHeight + (el.offsetHeight - el.clientHeight), live.current.opts)
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
    // Re-run once placed: the measured surface is swapped for the animated one, which needs observing too.
  }, [open, surface, !!p])
  return p
}

/* ---------- helpers ---------- */

const isEditable = (t: EventTarget | null) => t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))

const MAC_SYMBOL: Record<string, string> = { mod: "⌘", cmd: "⌘", meta: "⌘", ctrl: "⌃", control: "⌃", shift: "⇧", alt: "⌥", option: "⌥", enter: "↵", backspace: "⌫", delete: "⌦", escape: "Esc", esc: "Esc", tab: "⇥", space: "Space" }
const PC_NAME: Record<string, string> = { mod: "Ctrl", ctrl: "Ctrl", control: "Ctrl", cmd: "Win", meta: "Win", shift: "Shift", alt: "Alt", option: "Alt", enter: "Enter", backspace: "Backspace", delete: "Del", escape: "Esc", esc: "Esc", tab: "Tab", space: "Space" }
const ARROWS: Record<string, string> = { arrowup: "↑", arrowdown: "↓", arrowleft: "←", arrowright: "→", up: "↑", down: "↓", left: "←", right: "→" }
const ARIA_KEY: Record<string, string> = { ctrl: "Control", control: "Control", cmd: "Meta", meta: "Meta", shift: "Shift", alt: "Alt", option: "Alt", esc: "Escape", escape: "Escape", del: "Delete", delete: "Delete", enter: "Enter", backspace: "Backspace", tab: "Tab", space: "Space" }
const EVENT_KEY: Record<string, string> = { esc: "escape", del: "delete", space: " ", up: "arrowup", down: "arrowdown", left: "arrowleft", right: "arrowright" }

const splitKeys = (sc: string) =>
  sc
    .split(/\+(?!$)/)
    .map((k) => k.trim())
    .filter(Boolean)

function keyCaps(sc: string, mac: boolean, keyName: (k: string) => string) {
  return splitKeys(sc).map((k) => {
    const low = k.toLowerCase()
    if (ARROWS[low]) return ARROWS[low]
    if (mac && MAC_SYMBOL[low]) return MAC_SYMBOL[low]
    if (!mac && PC_NAME[low]) return keyName(PC_NAME[low])
    return k.length === 1 ? k.toUpperCase() : k
  })
}

function ariaShortcut(sc: string, mac: boolean) {
  return splitKeys(sc)
    .map((k) => {
      const low = k.toLowerCase()
      if (low === "mod") return mac ? "Meta" : "Control"
      return ARIA_KEY[low] ?? (k.length === 1 ? k.toUpperCase() : k)
    })
    .join("+")
}

function matchesShortcut(e: KeyboardEvent, sc: string, mac: boolean) {
  const want = { meta: false, ctrl: false, shift: false, alt: false }
  let main = ""
  for (const raw of splitKeys(sc)) {
    const k = raw.toLowerCase()
    if (k === "mod") want[mac ? "meta" : "ctrl"] = true
    else if (k === "cmd" || k === "meta") want.meta = true
    else if (k === "ctrl" || k === "control") want.ctrl = true
    else if (k === "shift") want.shift = true
    else if (k === "alt" || k === "option") want.alt = true
    else main = EVENT_KEY[k] ?? k
  }
  if (!main || e.metaKey !== want.meta || e.ctrlKey !== want.ctrl || e.shiftKey !== want.shift || e.altKey !== want.alt) return false
  const code = e.code.toLowerCase()
  return e.key.toLowerCase() === main || (main.length === 1 && (code === "key" + main || code === "digit" + main))
}

type Flat = { checks: Record<string, boolean>; radios: Record<string, string> }
function collectState(items: DropdownMenuItem[], out: Flat = { checks: {}, radios: {} }): Flat {
  for (const it of items) {
    if (it.type === "checkbox") out.checks[it.id] = it.defaultChecked ?? false
    else if (it.type === "radio") out.radios[it.id] = it.defaultValue ?? ""
    else if (it.type === "sub" || it.type === "group") collectState(it.items, out)
  }
  return out
}

function hasIndicator(items: DropdownMenuItem[]): boolean {
  return items.some((it) => it.type === "checkbox" || it.type === "radio" || (it.type === "group" && hasIndicator(it.items)))
}

function inTriangle(px: number, py: number, poly: [number, number][]) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]!
    const [xj, yj] = poly[j]!
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

const Chevron = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...p}>
    <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const ChevronEnd = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...p}>
    <path d="m6 4 4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const Check = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...p}>
    <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

/* ---------- context shared by every panel ---------- */

type Ctx = {
  owner: string
  variant: DropdownMenuVariant
  tone: DropdownMenuTone
  highlight: DropdownMenuHighlight
  size: DropdownMenuSize
  shadow: DropdownMenuShadow
  shape: DropdownMenuShape
  animation: DropdownMenuAnimation
  reduce: boolean
  rtl: boolean
  mac: boolean
  loop: boolean
  menuClassName?: string
  l: DropdownMenuLabels
  isChecked: (it: DropdownMenuCheckbox) => boolean
  radioValue: (g: DropdownMenuRadioGroup) => string
  toggle: (it: DropdownMenuCheckbox) => void
  setRadio: (g: DropdownMenuRadioGroup, value: string) => void
  closeAll: (returnFocus: boolean) => void
  tabOut: (back: boolean) => void
}
const MenuCtx = React.createContext<Ctx | null>(null)

type FocusMode = "first" | "last" | "panel"

type PanelProps = {
  items: DropdownMenuItem[]
  id: string
  level: number
  anchor: () => Rect | null
  side: Side
  align: DropdownMenuAlign
  offset: number
  alignOffset: number
  focus: FocusMode
  focusNonce: number
  /** Called to close this panel (sub-menus) or the whole menu (root). */
  onClose: (returnFocus: boolean) => void
  onPointerEnterPanel?: () => void
  labelledBy?: string
  ariaLabel?: string
  /** Point-anchored context menus grow from the corner instead of the side. */
  fromPoint?: boolean
}

function Panel({ items, id, level, anchor, side, align, offset, alignOffset, focus, focusNonce, onClose, onPointerEnterPanel, labelledBy, ariaLabel, fromPoint }: PanelProps) {
  const maybe = React.useContext(MenuCtx)
  if (!maybe) throw new Error("DropdownMenu panel rendered outside DropdownMenu")
  const ctx = maybe
  const present = useIsPresent()
  const surface = React.useRef<HTMLDivElement>(null)
  const p = usePlacement(true, anchor, surface, { side, align, offset, alignOffset, rtl: ctx.rtl })
  const [sub, setSub] = React.useState<{ key: string; el: HTMLElement; focus: FocusMode; nonce: number } | null>(null)
  const timers = React.useRef<{ open?: number; close?: number }>({})
  const grace = React.useRef<{ poly: [number, number][]; until: number } | null>(null)
  const typed = React.useRef({ text: "", at: 0 })
  const s = SIZES[ctx.size]
  const sh = SHAPES[ctx.shape]
  const inset = hasIndicator(items)

  const list = () => (surface.current ? Array.from(surface.current.querySelectorAll<HTMLElement>("[data-pc-ddm-item]:not([data-disabled])")) : [])

  // Focus once the panel is placed (hidden elements can't take focus) and whenever the parent asks again.
  React.useEffect(() => {
    if (!p) return
    const items = list()
    // A sub-menu opened by hover leaves focus on its parent item, so → and the pointer keep working there.
    const target = focus === "first" ? items[0] : focus === "last" ? items[items.length - 1] : level === 0 ? surface.current : null
    target?.focus({ preventScroll: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!p, focus, focusNonce])

  React.useEffect(
    () => () => {
      window.clearTimeout(timers.current.open)
      window.clearTimeout(timers.current.close)
    },
    [],
  )

  const openSub = (key: string, el: HTMLElement, f: FocusMode) => {
    window.clearTimeout(timers.current.open)
    window.clearTimeout(timers.current.close)
    setSub((cur) => ({ key, el, focus: f, nonce: (cur?.nonce ?? 0) + 1 }))
  }
  const closeSub = (returnFocus: boolean) => {
    window.clearTimeout(timers.current.close)
    setSub((cur) => {
      if (cur && returnFocus) cur.el.focus({ preventScroll: true })
      return null
    })
  }

  const move = (to: "next" | "prev" | "first" | "last") => {
    const items = list()
    if (!items.length) return
    const cur = items.indexOf(document.activeElement as HTMLElement)
    let i = to === "first" ? 0 : to === "last" ? items.length - 1 : cur < 0 ? (to === "next" ? 0 : items.length - 1) : cur + (to === "next" ? 1 : -1)
    if (i >= items.length) i = ctx.loop ? 0 : items.length - 1
    if (i < 0) i = ctx.loop ? items.length - 1 : 0
    items[i]!.focus({ preventScroll: false })
  }

  const typeAhead = (key: string) => {
    const now = Date.now()
    const t = typed.current
    t.text = now - t.at > 500 ? key : t.text + key
    t.at = now
    const q = t.text.toLowerCase()
    const items = list()
    const cur = items.indexOf(document.activeElement as HTMLElement)
    const start = t.text.length === 1 ? cur + 1 : Math.max(cur, 0)
    for (let k = 0; k < items.length; k++) {
      const el = items[(start + k) % items.length]!
      if ((el.dataset.label ?? "").toLowerCase().startsWith(q)) {
        el.focus()
        return
      }
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Key events from a sub-menu bubble here through the React tree; only handle our own DOM.
    if (!surface.current?.contains(e.target as Node)) return
    const target = e.target as HTMLElement
    const forward = ctx.rtl ? "ArrowLeft" : "ArrowRight"
    const back = ctx.rtl ? "ArrowRight" : "ArrowLeft"
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        move("next")
        break
      case "ArrowUp":
        e.preventDefault()
        move("prev")
        break
      case "Home":
      case "PageUp":
        e.preventDefault()
        move("first")
        break
      case "End":
      case "PageDown":
        e.preventDefault()
        move("last")
        break
      case forward:
        if (target.dataset.subKey) {
          e.preventDefault()
          openSub(target.dataset.subKey, target, "first")
        }
        break
      case back:
        if (level > 0) {
          e.preventDefault()
          onClose(true)
        }
        break
      case "Enter":
      case " ":
        if (!target.hasAttribute("data-pc-ddm-item")) {
          e.preventDefault()
          break
        }
        // Links follow on Enter natively; everything else is clicked here.
        if (e.key === "Enter" && target.tagName === "A") break
        e.preventDefault()
        target.click()
        break
      case "Escape":
        e.preventDefault()
        e.stopPropagation()
        if (level > 0) onClose(true)
        else ctx.closeAll(true)
        break
      case "Tab":
        // APG: Tab closes the menu and moves on from the trigger, as if the menu had not been there.
        e.preventDefault()
        ctx.tabOut(e.shiftKey)
        break
      default:
        if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault()
          typeAhead(e.key)
        }
    }
  }

  const hover = (e: React.PointerEvent<HTMLElement>, el: HTMLElement, subKey?: string, disabled?: boolean) => {
    if (e.pointerType !== "mouse" || !surface.current?.contains(el)) return
    const g = grace.current
    if (g && Date.now() < g.until && inTriangle(e.clientX, e.clientY, g.poly)) return
    grace.current = null
    if (disabled) {
      if (document.activeElement !== surface.current) surface.current?.focus({ preventScroll: true })
    } else if (document.activeElement !== el) el.focus({ preventScroll: true })
    window.clearTimeout(timers.current.open)
    if (subKey) {
      if (sub?.key === subKey) {
        window.clearTimeout(timers.current.close)
        return
      }
      timers.current.open = window.setTimeout(() => openSub(subKey, el, "panel"), 110)
    } else if (sub) {
      window.clearTimeout(timers.current.close)
      timers.current.close = window.setTimeout(() => setSub(null), 120)
    }
  }

  const leaveSubTrigger = (e: React.PointerEvent<HTMLElement>, key: string) => {
    window.clearTimeout(timers.current.open)
    if (e.pointerType !== "mouse" || sub?.key !== key) return
    const panel = document.getElementById(`${id}-${key}`)
    if (!panel) return
    const r = panel.getBoundingClientRect()
    const toRight = r.left >= e.clientX
    const edge = toRight ? r.left : r.right
    const x = e.clientX + (toRight ? -4 : 4)
    grace.current = { poly: [[x, e.clientY], [edge, r.top - 4], [edge, r.bottom + 4]], until: Date.now() + 320 }
  }

  let order = 0
  const stagger = ctx.animation === "stagger" && !ctx.reduce
  const itemMotion = () => {
    const i = order++
    return stagger
      ? { initial: { opacity: 0, x: ctx.rtl ? 6 : -6 }, animate: { opacity: 1, x: 0 }, transition: { delay: 0.04 + Math.min(i, 12) * 0.024, duration: 0.2, ease: easing.out } }
      : { initial: false as const }
  }

  const row = (it: ItemBase, extra: React.ReactNode, indicator: React.ReactNode, trailing: React.ReactNode) => (
    <>
      {inset && <span className={cn("pc-ddm-ind inline-flex shrink-0 items-center justify-center", s.ind)}>{indicator}</span>}
      {it.icon && <span className="pc-ddm-icon inline-flex shrink-0">{it.icon}</span>}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate">{it.label}</span>
        {it.description && <span className="pc-ddm-sub truncate text-[0.85em] leading-snug">{it.description}</span>}
      </span>
      {extra}
      {it.shortcut && (
        <span className="pc-ddm-kbd ms-auto inline-flex shrink-0 items-center gap-0.5 ps-3" dir="ltr" aria-hidden="true">
          {keyCaps(it.shortcut, ctx.mac, ctx.l.keyName).map((k, i) => (
            <kbd key={i}>{k}</kbd>
          ))}
        </span>
      )}
      {trailing}
    </>
  )

  const itemClass = cn("pc-press pc-press-soft pc-ddm-item relative flex w-full items-center text-start select-none", s.item, sh.item)

  const render = (list: DropdownMenuItem[], path: string): React.ReactNode =>
    list.map((it, idx) => {
      const key = `${path}${idx}`
      if (it.type === "separator") return <div key={key} role="separator" className="pc-ddm-sep -mx-1 my-1 h-px" />
      if (it.type === "label")
        return (
          <div key={key} role="presentation" className={cn("pc-ddm-label font-medium tracking-wide uppercase", s.label)}>
            {it.label}
          </div>
        )
      if (it.type === "group" || it.type === "radio") {
        const labelId = `${id}-g${key}`
        const inner =
          it.type === "group"
            ? render(it.items, key + ".")
            : it.options.map((o) => {
                const on = ctx.radioValue(it) === o.value
                return (
                  <motion.div
                    key={o.value}
                    {...itemMotion()}
                    role="menuitemradio"
                    aria-checked={on}
                    aria-disabled={o.disabled || undefined}
                    aria-keyshortcuts={o.shortcut ? ariaShortcut(o.shortcut, ctx.mac) : undefined}
                    tabIndex={-1}
                    data-pc-ddm-item=""
                    data-label={o.label}
                    data-disabled={o.disabled ? "" : undefined}
                    className={itemClass}
                    onPointerMove={(e) => hover(e, e.currentTarget, undefined, o.disabled)}
                    onClick={() => {
                      if (o.disabled) return
                      ctx.setRadio(it, o.value)
                      if (!it.keepOpen) ctx.closeAll(true)
                    }}
                  >
                    {row(o, null, <span className="pc-ddm-mark size-[0.45em] min-h-1.5 min-w-1.5 rounded-full bg-current" />, null)}
                  </motion.div>
                )
              })
        return (
          <div key={key} role="group" aria-labelledby={it.label ? labelId : undefined}>
            {it.label && (
              <div id={labelId} role="presentation" className={cn("pc-ddm-label font-medium tracking-wide uppercase", s.label)}>
                {it.label}
              </div>
            )}
            {inner}
          </div>
        )
      }
      if (it.type === "checkbox") {
        const on = ctx.isChecked(it)
        return (
          <motion.div
            key={key}
            {...itemMotion()}
            role="menuitemcheckbox"
            aria-checked={on}
            aria-disabled={it.disabled || undefined}
            aria-keyshortcuts={it.shortcut ? ariaShortcut(it.shortcut, ctx.mac) : undefined}
            tabIndex={-1}
            data-pc-ddm-item=""
            data-label={it.label}
            data-disabled={it.disabled ? "" : undefined}
            className={itemClass}
            onPointerMove={(e) => hover(e, e.currentTarget, undefined, it.disabled)}
            onClick={() => {
              if (it.disabled) return
              ctx.toggle(it)
              if (it.keepOpen === false) ctx.closeAll(true)
            }}
          >
            {row(
              it,
              null,
              <span className="pc-ddm-box grid size-[1em] place-items-center rounded-[4px]">
                <Check className="pc-ddm-mark !size-[0.75em]" />
              </span>,
              null,
            )}
          </motion.div>
        )
      }
      if (it.type === "sub") {
        const subKey = it.id ?? key
        const open = sub?.key === subKey
        return (
          <motion.div
            key={key}
            {...itemMotion()}
            role="menuitem"
            aria-haspopup="menu"
            aria-expanded={open}
            aria-controls={open ? `${id}-${subKey}` : undefined}
            aria-disabled={it.disabled || undefined}
            tabIndex={-1}
            data-pc-ddm-item=""
            data-sub-key={it.disabled ? undefined : subKey}
            data-label={it.label}
            data-open={open ? "" : undefined}
            data-disabled={it.disabled ? "" : undefined}
            className={itemClass}
            onPointerMove={(e) => hover(e, e.currentTarget, it.disabled ? undefined : subKey, it.disabled)}
            onPointerLeave={(e) => leaveSubTrigger(e, subKey)}
            onClick={(e) => !it.disabled && openSub(subKey, e.currentTarget, e.detail === 0 ? "first" : "panel")}
          >
            {row(it, null, null, <ChevronEnd className="pc-ddm-icon ms-auto shrink-0 rtl:rotate-180" />)}
          </motion.div>
        )
      }
      const a = it
      const common = {
        role: "menuitem",
        tabIndex: -1,
        "aria-disabled": a.disabled || undefined,
        "aria-keyshortcuts": a.shortcut ? ariaShortcut(a.shortcut, ctx.mac) : undefined,
        "data-pc-ddm-item": "",
        "data-label": a.label,
        "data-disabled": a.disabled ? "" : undefined,
        "data-destructive": a.destructive ? "" : undefined,
        className: itemClass,
        onPointerMove: (e: React.PointerEvent<HTMLElement>) => hover(e, e.currentTarget, undefined, a.disabled),
        onClick: (e: React.MouseEvent<HTMLElement>) => {
          if (a.disabled) {
            e.preventDefault()
            return
          }
          a.onSelect?.()
          if (!a.keepOpen) ctx.closeAll(true)
        },
      }
      const badge = a.badge != null && <span className="pc-ddm-badge shrink-0 rounded-full px-1.5 text-[0.75em] leading-[1.6] font-medium">{a.badge}</span>
      return a.href ? (
        <motion.a key={key} {...itemMotion()} {...common} href={a.disabled ? undefined : a.href} target={a.target} rel={a.target === "_blank" ? "noreferrer" : undefined}>
          {row(a, badge, null, null)}
        </motion.a>
      ) : (
        <motion.div key={key} {...itemMotion()} {...common}>
          {row(a, badge, null, null)}
        </motion.div>
      )
    })

  const subItem = sub ? findSub(items, sub.key) : null
  const placed = p ?? { x: 0, y: 0, side, maxH: 9999 }
  const origin = fromPoint
    ? `${placed.side === "top" ? "bottom" : "top"} ${ctx.rtl ? "right" : "left"}`
    : placed.side === "bottom"
      ? "top"
      : placed.side === "top"
        ? "bottom"
        : placed.side === "right"
          ? "left"
          : "right"
  const dx = placed.side === "right" ? -8 : placed.side === "left" ? 8 : 0
  const dy = placed.side === "bottom" ? -8 : placed.side === "top" ? 8 : 0
  const anim = ctx.animation
  // Opened from the keyboard: no entrance at all. Frequent actions stay quiet.
  const [byKey] = React.useState(() => typeof document !== "undefined" && !!document.activeElement?.matches(":focus-visible"))
  const glide = React.useRef<HTMLDivElement>(null)
  const moveGlide = (e: React.FocusEvent<HTMLDivElement>) => {
    const g = glide.current
    const t = e.target as HTMLElement
    if (!g) return
    if (!t.matches("[data-pc-ddm-item]")) {
      if (t === surface.current) delete g.dataset.on
      return
    }
    // From hidden it appears in place; only a move between rows slides.
    if (!g.dataset.on) g.style.transition = "none"
    g.style.setProperty("--pc-gl-y", `${t.offsetTop}px`)
    g.style.setProperty("--pc-gl-h", `${t.offsetHeight}px`)
    g.style.setProperty("--pc-gl-x", `${t.offsetLeft}px`)
    if (t.hasAttribute("data-destructive")) g.dataset.destructive = ""
    else delete g.dataset.destructive
    g.dataset.on = ""
    void g.offsetHeight
    g.style.transition = ""
  }
  const motionProps = ctx.reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
    : anim === "none"
      ? { initial: false as const, animate: { opacity: 1 } }
      : anim === "fade"
        ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
        : anim === "slide"
          ? { initial: { opacity: 0, x: dx, y: dy }, animate: { opacity: 1, x: 0, y: 0 } }
          : anim === "stagger"
            ? { initial: { opacity: 0, scale: 0.98 }, animate: { opacity: 1, scale: 1 } }
            : { initial: { opacity: 0, scale: 0.96 }, animate: { opacity: 1, scale: 1 } }
  const t: Transition = ctx.reduce ? { duration: 0.1 } : anim === "none" || byKey ? { duration: 0 } : { duration: 0.15, ease: easing.out }
  const exitT: Transition = anim === "none" ? { duration: 0 } : { duration: 0.1, ease: easing.out }

  const body = render(items, "")
  const surfaceClass = cn("pc-ddm-surface overflow-x-hidden overflow-y-auto overscroll-contain", s.panel, sh.panel, ctx.menuClassName)
  const surfaceProps = {
    id,
    role: "menu",
    tabIndex: -1,
    "aria-orientation": "vertical" as const,
    "aria-labelledby": labelledBy,
    "aria-label": labelledBy ? undefined : ariaLabel,
    onKeyDown,
    onFocus: moveGlide,
    onPointerEnter: onPointerEnterPanel,
    onPointerLeave: (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === "mouse" && !sub && surface.current?.contains(document.activeElement)) surface.current.focus({ preventScroll: true })
    },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    style: { maxHeight: placed.maxH, transformOrigin: origin },
  }

  return (
    <div
      data-pc-ddm-owner={ctx.owner}
      data-variant={ctx.variant}
      data-tone={ctx.tone}
      data-hl={ctx.highlight}
      data-shadow={ctx.variant === "neo" || ctx.variant === "flat" ? "none" : ctx.shadow}
      data-side={placed.side}
      className="pc-ddm fixed z-50"
      style={{ left: placed.x, top: placed.y, visibility: p ? undefined : "hidden" }}
    >
      {p ? (
        <motion.div ref={surface} {...surfaceProps} {...motionProps} exit={{ opacity: 0, transition: exitT }} transition={t} className={surfaceClass}>
          <div ref={glide} aria-hidden="true" className={cn("pc-ddm-glide", sh.item)} />
          {body}
        </motion.div>
      ) : (
        <div ref={surface} {...surfaceProps} className={surfaceClass}>
          {body}
        </div>
      )}
      {createPortal(
        <AnimatePresence>
          {present && sub && subItem && (
            <Panel
              key={sub.key}
              items={subItem.items}
              id={`${id}-${sub.key}`}
              level={level + 1}
              anchor={() => (sub.el.isConnected ? sub.el.getBoundingClientRect() : null)}
              side={ctx.rtl ? "left" : "right"}
              align="start"
              offset={4}
              alignOffset={ctx.size === "lg" ? -7 : -5}
              focus={sub.focus}
              focusNonce={sub.nonce}
              labelledBy={undefined}
              ariaLabel={subItem.label}
              onClose={closeSub}
              onPointerEnterPanel={() => {
                window.clearTimeout(timers.current.close)
                grace.current = null
              }}
            />
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  )
}

function findSub(items: DropdownMenuItem[], key: string, path = ""): DropdownMenuSub | null {
  for (let i = 0; i < items.length; i++) {
    const it = items[i]!
    const k = `${path}${i}`
    if (it.type === "sub" && (it.id ?? k) === key) return it
    if (it.type === "group") {
      const found = findSub(it.items, key, k + ".")
      if (found) return found
    }
  }
  return null
}

function walk(items: DropdownMenuItem[], fn: (it: DropdownMenuItem, group?: DropdownMenuRadioGroup) => void) {
  for (const it of items) {
    fn(it)
    if (it.type === "sub" || it.type === "group") walk(it.items, fn)
    if (it.type === "radio") for (const o of it.options) fn({ ...o, type: "item" }, it)
  }
}

/* ---------- root ---------- */

export function DropdownMenu({
  items,
  mode = "menu",
  trigger,
  label,
  children,
  variant = "default",
  tone = "primary",
  highlight = "soft",
  size = "md",
  shadow = "md",
  shape = "rounded",
  animation = "scale",
  side = "bottom",
  align = "start",
  sideOffset = 6,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  bindShortcuts,
  loop = true,
  disabled,
  menuClassName,
  "aria-label": ariaLabel,
  labels,
  className,
  ...rest
}: DropdownMenuProps) {
  const l = useLabels("dropdown-menu", DEFAULT_LABELS, labels)
  const prefersReduced = useReducedMotion()
  const [mounted, setMounted] = React.useState(false)
  const [mac, setMac] = React.useState(false)
  React.useEffect(() => {
    setMounted(true)
    setMac(/Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent))
  }, [])
  const reduce = mounted && !!prefersReduced
  const uid = React.useId()
  const menuId = uid + "-menu"
  const triggerId = uid + "-trigger"

  const [openInner, setOpenInner] = React.useState(defaultOpen)
  const open = (openProp ?? openInner) && !disabled
  const [focus, setFocus] = React.useState<{ mode: FocusMode; nonce: number }>({ mode: "panel", nonce: 0 })
  const [point, setPoint] = React.useState<{ x: number; y: number } | null>(null)
  const [rtl, setRtl] = React.useState(false)
  const root = React.useRef<HTMLDivElement>(null)
  const triggerEl = React.useRef<HTMLElement | null>(null)
  const prevFocus = React.useRef<HTMLElement | null>(null)
  const press = React.useRef<{ timer: number; x: number; y: number } | null>(null)
  const lastDown = React.useRef(0)

  const [state, setState] = React.useState<Flat>(() => collectState(items))
  const isChecked = (it: DropdownMenuCheckbox) => it.checked ?? state.checks[it.id] ?? false
  const radioValue = (g: DropdownMenuRadioGroup) => g.value ?? state.radios[g.id] ?? ""
  const toggle = (it: DropdownMenuCheckbox) => {
    const next = !isChecked(it)
    if (it.checked === undefined) setState((s) => ({ ...s, checks: { ...s.checks, [it.id]: next } }))
    it.onCheckedChange?.(next)
  }
  const setRadio = (g: DropdownMenuRadioGroup, value: string) => {
    if (g.value === undefined) setState((s) => ({ ...s, radios: { ...s.radios, [g.id]: value } }))
    if (radioValue(g) !== value) g.onValueChange?.(value)
  }

  const setOpen = (o: boolean) => {
    if (openProp === undefined) setOpenInner(o)
    onOpenChange?.(o)
  }
  const readDir = (el: Element | null) => setRtl(!!el && getComputedStyle(el).direction === "rtl")
  const show = (f: FocusMode) => {
    if (disabled) return
    prevFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    readDir(mode === "menu" ? triggerEl.current : root.current)
    setFocus((cur) => ({ mode: f, nonce: cur.nonce + 1 }))
    if (!open) setOpen(true)
  }
  const closeAll = React.useCallback(
    (returnFocus: boolean) => {
      setOpen(false)
      if (!returnFocus) return
      const el = mode === "menu" ? triggerEl.current : prevFocus.current
      el?.focus({ preventScroll: true })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode, openProp, onOpenChange],
  )

  const tabOut = (back: boolean) => {
    const from = mode === "menu" ? triggerEl.current : prevFocus.current
    closeAll(true)
    if (!from) return
    const all = Array.from(document.querySelectorAll<HTMLElement>("a[href],button,input,select,textarea,[tabindex]")).filter(
      (el) => el.tabIndex >= 0 && !(el as HTMLButtonElement).disabled && el.getClientRects().length > 0 && !el.closest(`[data-pc-ddm-owner="${uid}"]`),
    )
    const i = all.indexOf(from)
    if (i >= 0) all[i + (back ? -1 : 1)]?.focus()
  }

  // A controlled or defaultOpen menu still needs the reading direction.
  React.useEffect(() => {
    if (open) readDir(mode === "menu" ? triggerEl.current : root.current)
  }, [open, mode])

  // Click outside closes (every panel of this menu carries the owner id).
  React.useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      const t = e.target as Element | null
      if (t?.closest?.(`[data-pc-ddm-owner="${uid}"]`)) return
      if (mode === "menu" && triggerEl.current?.contains(t)) return
      if (mode === "context" && e.button === 2 && root.current?.contains(t)) return
      closeAll(false)
    }
    document.addEventListener("pointerdown", onDown, true)
    return () => document.removeEventListener("pointerdown", onDown, true)
  }, [open, mode, uid, closeAll])

  // Optional global hotkeys from the items' shortcuts.
  const live = React.useRef({ items, mac, isChecked, toggle, setRadio, open, closeAll })
  React.useLayoutEffect(() => {
    live.current = { items, mac, isChecked, toggle, setRadio, open, closeAll }
  })
  React.useEffect(() => {
    if (!bindShortcuts || disabled) return
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.repeat) return
      if (isEditable(e.target) && !e.metaKey && !e.ctrlKey && !e.altKey) return
      const c = live.current
      let hit = false
      walk(c.items, (it, group) => {
        if (hit || !("shortcut" in it) || !it.shortcut || it.disabled || !matchesShortcut(e, it.shortcut, c.mac)) return
        if (it.type === "sub") return
        hit = true
        e.preventDefault()
        if (group && "value" in it) c.setRadio(group, it.value as string)
        else if (it.type === "checkbox") c.toggle(it)
        else if (it.type === "item" || it.type === undefined) (it as DropdownMenuAction).onSelect?.()
        if (c.open) c.closeAll(false)
      })
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [bindShortcuts, disabled])

  const ctx: Ctx = { owner: uid, variant, tone, highlight, size, shadow, shape, animation, reduce, rtl, mac, loop, menuClassName, l, isChecked, radioValue, toggle, setRadio, closeAll, tabOut }

  const anchor = (): Rect | null => {
    if (mode === "context") {
      if (point) return { left: point.x, right: point.x, top: point.y, bottom: point.y, width: 0, height: 0 }
      return root.current?.getBoundingClientRect() ?? null
    }
    return triggerEl.current?.getBoundingClientRect() ?? null
  }

  const panel =
    mounted &&
    createPortal(
      <MenuCtx.Provider value={ctx}>
        <AnimatePresence>
          {open && (
            <Panel
              key={point ? `${point.x},${point.y}` : "root"}
              items={items}
              id={menuId}
              level={0}
              anchor={anchor}
              side={mode === "context" ? "bottom" : side}
              align={mode === "context" ? "start" : align}
              offset={mode === "context" ? 2 : sideOffset}
              alignOffset={0}
              focus={focus.mode}
              focusNonce={focus.nonce}
              onClose={closeAll}
              labelledBy={mode === "menu" && !ariaLabel ? triggerId : undefined}
              ariaLabel={ariaLabel ?? (mode === "context" ? l.contextMenu : undefined)}
              fromPoint={mode === "context" && !!point}
            />
          )}
        </AnimatePresence>
      </MenuCtx.Provider>,
      document.body,
    )

  const style = (
    <>
      <GooduiTokens />
      <style href="pc-dropdown-menu" precedence="default">
        {CSS}
      </style>
    </>
  )

  if (mode === "context") {
    return (
      <>
        {style}
        <div
          {...rest}
          ref={root}
          data-slot="dropdown-menu"
          data-tone={tone}
          data-state={open ? "open" : "closed"}
          className={cn("pc-ddm", className)}
          onContextMenu={(e) => {
            rest.onContextMenu?.(e)
            // Right-clicks inside the portaled menu bubble here through React; ignore them.
            if (e.defaultPrevented || disabled || !root.current?.contains(e.target as Node)) return
            e.preventDefault()
            if (press.current) window.clearTimeout(press.current.timer)
            press.current = null
            // Shift+F10 / the Menu key fire contextmenu without a pointer press just before it.
            const keyboard = Date.now() - lastDown.current > 1500 || (e.clientX === 0 && e.clientY === 0)
            if (keyboard) {
              const r = (e.target as HTMLElement).getBoundingClientRect()
              setPoint({ x: ctx.rtl ? r.right : r.left, y: r.bottom })
            } else setPoint({ x: e.clientX, y: e.clientY })
            show(keyboard ? "first" : "panel")
          }}
          onPointerDown={(e) => {
            rest.onPointerDown?.(e)
            if (!root.current?.contains(e.target as Node)) return
            lastDown.current = Date.now()
            if (e.pointerType !== "touch" || disabled) return
            const { clientX: x, clientY: y } = e
            press.current = {
              x,
              y,
              timer: window.setTimeout(() => {
                setPoint({ x, y })
                show("panel")
                press.current = null
              }, 550),
            }
          }}
          onPointerMove={(e) => {
            rest.onPointerMove?.(e)
            const pr = press.current
            if (pr && Math.hypot(e.clientX - pr.x, e.clientY - pr.y) > 8) {
              window.clearTimeout(pr.timer)
              press.current = null
            }
          }}
          onPointerUp={(e) => {
            rest.onPointerUp?.(e)
            if (press.current) window.clearTimeout(press.current.timer)
            press.current = null
          }}
        >
          {children}
        </div>
        {panel}
      </>
    )
  }

  const triggerProps = {
    id: triggerId,
    "aria-haspopup": "menu" as const,
    "aria-expanded": open,
    "aria-controls": open ? menuId : undefined,
    "data-state": open ? "open" : "closed",
  }
  const onTriggerClick = (e: React.MouseEvent<HTMLElement>) => {
    if (open) closeAll(false)
    else show(e.detail === 0 ? "first" : "panel")
  }
  const onTriggerKey = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault()
      show(e.key === "ArrowDown" ? "first" : "last")
    }
  }

  let triggerNode: React.ReactNode
  if (trigger && React.isValidElement(trigger)) {
    const tp = trigger.props as {
      ref?: React.Ref<HTMLElement>
      onClick?: (e: React.MouseEvent<HTMLElement>) => void
      onKeyDown?: (e: React.KeyboardEvent<HTMLElement>) => void
      id?: string
    }
    const theirRef = tp.ref
    triggerNode = React.cloneElement(trigger as React.ReactElement<Record<string, unknown>>, {
      ...triggerProps,
      id: tp.id ?? triggerId,
      disabled: disabled || undefined,
      ref: (el: HTMLElement | null) => {
        triggerEl.current = el
        if (typeof theirRef === "function") theirRef(el)
        else if (theirRef && typeof theirRef === "object") (theirRef as React.RefObject<HTMLElement | null>).current = el
      },
      onClick: (e: React.MouseEvent<HTMLElement>) => {
        tp.onClick?.(e)
        if (!e.defaultPrevented) onTriggerClick(e)
      },
      onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
        tp.onKeyDown?.(e)
        if (!e.defaultPrevented) onTriggerKey(e)
      },
    })
  } else {
    triggerNode = (
      <button
        type="button"
        {...triggerProps}
        ref={(el) => {
          triggerEl.current = el
        }}
        disabled={disabled}
        onClick={onTriggerClick}
        onKeyDown={onTriggerKey}
        className={cn("pc-press pc-ddm-trigger inline-flex items-center font-medium whitespace-nowrap select-none disabled:pointer-events-none disabled:opacity-55", SIZES[size].trigger, SHAPES[shape].trigger, "[&_svg]:size-4")}
      >
        {label ?? l.trigger}
        <Chevron className="-me-1" />
      </button>
    )
  }

  return (
    <>
      {style}
      <div {...rest} ref={root} data-slot="dropdown-menu" data-tone={tone} data-state={open ? "open" : "closed"} className={cn("pc-ddm inline-flex", className)}>
        {triggerNode}
      </div>
      {panel}
    </>
  )
}

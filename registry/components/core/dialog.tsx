"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import type { SoundName } from "@/lib/goodui-sounds"
import { Button, type ButtonTone } from "@/registry/components/core/button"
import { GooduiTokens, ease } from "@/lib/goodui-motion"

/*
 * Modal dialog, alert dialog and sheet in one component, independent layers: every axis combines with every other.
 *   variant    default, soft, glass, neo                       tone       icon tile, confirm button, focus ring, soft tint
 *   placement  center, top, start, end, left, right, bottom, fullscreen      mobile     same, fullscreen or bottom sheet under 640px
 *   size       sm → xl, full                                    radius     none → xl (sheets round only their inner edge)
 *   shadow     none → xl                                        overlay    dim, blur, none
 *   animation  none, fade, scale, slide, morph (grows out of the trigger), blur
 *   role       dialog or alertdialog (no outside-click close, focus starts on Cancel)
 *   confirm    onConfirm may return a promise: the button spins, the dialog stays until it resolves and shows the error if it throws
 * Focus is trapped (Tab cycles) and returns to the trigger; the page scroll is locked without the layout jumping;
 * nested dialogs stack, and the one behind steps back. Esc and outside click are configurable.
 */

export type DialogVariant = "default" | "soft" | "glass" | "neo"
export type DialogTone = "primary" | "neutral" | "success" | "warning" | "danger" | "info"
/** center and top are dialogs; start/end/left/right/bottom are sheets; start and end follow the reading direction. */
export type DialogPlacement = "center" | "top" | "start" | "end" | "left" | "right" | "bottom" | "fullscreen"
export type DialogMobile = "same" | "fullscreen" | "sheet"
export type DialogSize = "sm" | "md" | "lg" | "xl" | "full"
export type DialogRadius = "none" | "sm" | "md" | "lg" | "xl"
export type DialogShadow = "none" | "sm" | "md" | "lg" | "xl"
export type DialogAnimation = "none" | "fade" | "scale" | "slide" | "morph" | "blur"
export type DialogOverlay = "dim" | "blur" | "none"
export type DialogApi = { close: () => void }

export type DialogLabels = {
  close: string
  cancel: string
  confirm: string
  /** Label of the type-to-confirm field. */
  typeToConfirm: (phrase: string) => string
  /** Shown when onConfirm throws something that is not an Error with a message. */
  error: string
}
const DEFAULT_LABELS: DialogLabels = {
  close: "Close",
  cancel: "Cancel",
  confirm: "Confirm",
  typeToConfirm: (phrase) => `Type "${phrase}" to confirm`,
  error: "Something went wrong. Please try again.",
}

type TriggerProps = React.HTMLAttributes<HTMLElement> & { ref?: React.Ref<HTMLElement> }

export type DialogProps = Omit<React.ComponentProps<"div">, "title" | "children" | "role"> & {
  /** Element that opens the dialog (a button). It gets aria-haspopup, aria-expanded and aria-controls, and morph grows out of it. */
  trigger?: React.ReactElement<TriggerProps>
  /** Open state (controlled). */
  open?: boolean
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** alertdialog: for confirmations that interrupt. Outside click does not close it, there is no × by default, and focus starts on Cancel. */
  role?: "dialog" | "alertdialog"
  /** Heading; names the dialog for screen readers. Without it, pass aria-label. */
  title?: React.ReactNode
  /** Muted text under the title; describes the dialog for screen readers. */
  description?: React.ReactNode
  /** Icon in a tone-tinted tile above or beside the title. */
  icon?: React.ReactNode
  /** Body. A function receives { close }. */
  children?: React.ReactNode | ((api: DialogApi) => React.ReactNode)
  /** Custom footer; replaces the built-in Cancel / Confirm buttons. A function receives { close }. */
  footer?: React.ReactNode | ((api: DialogApi) => React.ReactNode)
  /** Surface: default, soft (tone tint), glass (frosted) or neo (thick border, hard shadow). */
  variant?: DialogVariant
  /** Accent for the icon tile, confirm button, soft tint and focus ring. */
  tone?: DialogTone
  /** Where it appears. Sheets slide from their edge with any animation except fade, blur and none. */
  placement?: DialogPlacement
  /** Below 640px, a center or top dialog can become fullscreen or a bottom sheet. */
  mobile?: DialogMobile
  /** Width for dialogs and side sheets, max width for the bottom sheet. full fills the screen. */
  size?: DialogSize
  radius?: DialogRadius
  /** Drop shadow. Ignored by neo, which has its own offset shadow. */
  shadow?: DialogShadow
  /** How it enters and leaves. morph grows out of the trigger (falls back to scale without one). Reduced motion uses a short fade. */
  animation?: DialogAnimation
  /** Backdrop: dim (default), blur (frosted page) or none (transparent, still blocks the page). */
  overlay?: DialogOverlay
  /** × button in the corner. Default: true for dialog, false for alertdialog. */
  showClose?: boolean
  /** Esc closes. When false (or while confirming), Esc gives a small bump instead. */
  closeOnEsc?: boolean
  /** Click on the backdrop closes. Default: true for dialog, false for alertdialog. */
  closeOnOutsideClick?: boolean
  /** Bottom sheet: drag the handle down to close. */
  dragToClose?: boolean
  /** While open, the page behind steps back: it scales to .98 and rounds its corners. Skipped for nested dialogs and reduced motion. */
  scaleBackground?: boolean
  /** Shows Cancel and Confirm. May return a promise: the button shows a spinner and the dialog waits; a throw keeps it open and shows the error. */
  onConfirm?: () => unknown
  /** Confirm button text (default labels.confirm). */
  confirmText?: React.ReactNode
  /** Cancel button text (default labels.cancel). */
  cancelText?: React.ReactNode
  /** Confirm button tone; defaults to tone. */
  confirmTone?: DialogTone
  /** Close after onConfirm succeeds. */
  closeOnConfirm?: boolean
  /** The user must type this exact text before Confirm is enabled (deleting a workspace). */
  confirmPhrase?: string
  /** Element to focus on open. Default: an autoFocus element, Cancel for alertdialog, the first field or button, else the panel. */
  initialFocus?: React.RefObject<HTMLElement | null>
  /** Return focus to the element that had it before opening. */
  returnFocus?: boolean
  /** Plays "open" and "close" when the visitor has sounds on (lib/goodui-sounds); a sound name replaces the open sound. Off by default. */
  sound?: boolean | SoundName
  /** Text for built-in controls; pass translations here. */
  labels?: Partial<DialogLabels>
}

/* ---------- shared across every open dialog ---------- */

let locks = 0
let unlock: (() => void) | null = null
/** Locks page scroll. A stable scrollbar gutter (or padding where unsupported) keeps the layout from shifting. */
function lockScroll() {
  if (locks++ > 0) return
  const html = document.documentElement
  const body = document.body
  const bar = window.innerWidth - html.clientWidth
  const prev = { overflow: html.style.overflow, gutter: html.style.scrollbarGutter, pad: body.style.paddingInlineEnd }
  html.style.setProperty("--pc-scrollbar", `${bar}px`)
  if (bar > 0) {
    if (window.CSS?.supports("scrollbar-gutter", "stable")) html.style.scrollbarGutter = "stable"
    else body.style.paddingInlineEnd = `calc(${getComputedStyle(body).paddingInlineEnd} + ${bar}px)`
  }
  html.style.overflow = "hidden"
  unlock = () => {
    html.style.overflow = prev.overflow
    html.style.scrollbarGutter = prev.gutter
    body.style.paddingInlineEnd = prev.pad
    html.style.removeProperty("--pc-scrollbar")
  }
}
function unlockScroll() {
  if (--locks > 0) return
  locks = 0
  unlock?.()
  unlock = null
}
/** Open dialogs, top last; only the top one reacts to Esc when focus is outside every dialog. */
const stack: symbol[] = []

type Nest = { depth: number; setChildOpen: (open: boolean) => void }
const NestContext = React.createContext<Nest | null>(null)

const TABBABLE =
  'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"]),[contenteditable="true"],summary,audio[controls],video[controls]'
function tabbables(root: ParentNode) {
  return Array.from(root.querySelectorAll<HTMLElement>(TABBABLE)).filter((el) => el.tabIndex >= 0 && !el.closest("[inert]") && el.getClientRects().length > 0)
}

function mergeRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  return (el: T | null) => {
    for (const r of refs) {
      if (typeof r === "function") r(el)
      else if (r) (r as React.RefObject<T | null>).current = el
    }
  }
}

const isThenable = (v: unknown): v is PromiseLike<unknown> => !!v && typeof (v as { then?: unknown }).then === "function"

/* ---------- motion: Web Animations, so morph can measure the real panel before the first frame ---------- */

type Phys = "center" | "top" | "fullscreen" | "left" | "right" | "bottom"
const SHEETS: Phys[] = ["left", "right", "bottom"]
// Web Animations cannot read CSS variables, so the curves are spelled out from the shared tokens.
const css = (c: readonly number[]) => `cubic-bezier(${c.join(",")})`
const EASE = css(ease.out)
const EASE_SHEET = css(ease.drawer)

function frames(kind: DialogAnimation, place: Phys, morph: string | null): { k: Keyframe[]; ms: number } {
  const sheet = SHEETS.includes(place)
  if (kind === "fade") return { k: [{ opacity: 0 }, { opacity: 1 }], ms: 180 }
  if (kind === "blur") {
    const shift = place === "left" ? "translateX(-6%)" : place === "right" ? "translateX(6%)" : place === "bottom" ? "translateY(6%)" : "scale(1.04)"
    return { k: [{ opacity: 0, filter: "blur(14px)", transform: shift }, { opacity: 1, filter: "blur(0)", transform: "none" }], ms: 320 }
  }
  if (sheet) {
    const off = place === "left" ? "translateX(-100%)" : place === "right" ? "translateX(100%)" : "translateY(100%)"
    return { k: [{ transform: off }, { transform: "none" }], ms: 420 }
  }
  if (kind === "morph" && morph)
    return {
      k: [
        { transform: morph, opacity: 0 },
        { opacity: 1, offset: 0.35 },
        { transform: "none", opacity: 1 },
      ],
      ms: 420,
    }
  if (kind === "slide" || place === "fullscreen") return { k: [{ opacity: 0, transform: "translateY(24px)" }, { opacity: 1, transform: "none" }], ms: 300 }
  return { k: [{ opacity: 0, transform: "scale(.96)" }, { opacity: 1, transform: "none" }], ms: 240 }
}

/* ---------- look ---------- */

const CSS = `
.pc-dialog{--pc-c:var(--primary);--pc-fg:var(--primary-foreground)}
.pc-dialog[data-tone=neutral]{--pc-c:var(--foreground);--pc-fg:var(--background)}
.pc-dialog[data-tone=success]{--pc-c:oklch(0.53 0.13 155);--pc-fg:#fff}
.pc-dialog[data-tone=warning]{--pc-c:oklch(0.75 0.16 70);--pc-fg:oklch(0.25 0.05 70)}
.pc-dialog[data-tone=danger]{--pc-c:oklch(0.56 0.21 27);--pc-fg:#fff}
.pc-dialog[data-tone=info]{--pc-c:oklch(0.55 0.17 250);--pc-fg:#fff}
.dark .pc-dialog[data-tone=success]{--pc-c:oklch(0.7 0.16 155);--pc-fg:oklch(0.2 0.05 155)}
.dark .pc-dialog[data-tone=danger]{--pc-c:oklch(0.68 0.2 25);--pc-fg:oklch(0.2 0.05 25)}
.dark .pc-dialog[data-tone=info]{--pc-c:oklch(0.7 0.15 245);--pc-fg:oklch(0.2 0.05 245)}
.pc-dialog{--pc-tint:color-mix(in oklab,var(--pc-c) 14%,transparent);--pc-ink:color-mix(in oklab,var(--pc-c) 82%,var(--foreground))}
.pc-dialog[data-tone=warning]{--pc-ink:color-mix(in oklab,var(--pc-c) 62%,var(--foreground))}

.pc-dialog-overlay{background:radial-gradient(120% 120% at 50% 42%,hsl(var(--pc-sh)/.36),hsl(var(--pc-sh)/.58))}
.dark .pc-dialog-overlay{background:radial-gradient(120% 120% at 50% 42%,rgb(0 0 0/.52),rgb(0 0 0/.74))}
.pc-dialog[data-overlay=blur] .pc-dialog-overlay{background:rgb(9 9 11/.28);-webkit-backdrop-filter:blur(6px) saturate(1.2);backdrop-filter:blur(6px) saturate(1.2)}
.dark .pc-dialog[data-overlay=blur] .pc-dialog-overlay{background:rgb(0 0 0/.42)}
.pc-dialog[data-overlay=none] .pc-dialog-overlay{background:transparent}
.pc-dialog[data-nested] .pc-dialog-overlay{background:rgb(9 9 11/.2);-webkit-backdrop-filter:none;backdrop-filter:none}

.pc-dialog-panel{--pc-r:14px;--pc-bd:color-mix(in oklab,var(--foreground) 9%,transparent);position:relative;background:var(--background);color:var(--foreground);border:1px solid var(--pc-bd);border-radius:var(--pc-r);outline:none;transition:transform .32s var(--pc-ease-out),opacity .32s}
.dark .pc-dialog-panel{--pc-bd:color-mix(in oklab,var(--foreground) 13%,transparent)}
.pc-dialog[data-radius=none] .pc-dialog-panel{--pc-r:0px}
.pc-dialog[data-radius=sm] .pc-dialog-panel{--pc-r:6px}
.pc-dialog[data-radius=md] .pc-dialog-panel{--pc-r:10px}
.pc-dialog[data-radius=xl] .pc-dialog-panel{--pc-r:22px}
.pc-dialog[data-place=left] .pc-dialog-panel{border-radius:0 var(--pc-r) var(--pc-r) 0;border-block-width:0;border-left-width:0}
.pc-dialog[data-place=right] .pc-dialog-panel{border-radius:var(--pc-r) 0 0 var(--pc-r);border-block-width:0;border-right-width:0}
.pc-dialog[data-place=bottom] .pc-dialog-panel{border-radius:var(--pc-r) var(--pc-r) 0 0;border-bottom-width:0}
.pc-dialog[data-place=fullscreen] .pc-dialog-panel{border-radius:0;border-width:0}
.pc-dialog[data-variant=soft] .pc-dialog-panel{background:color-mix(in oklab,var(--pc-c) 5%,var(--background));--pc-bd:color-mix(in oklab,var(--pc-c) 22%,transparent)}
.pc-dialog[data-variant=glass] .pc-dialog-panel{background:color-mix(in oklab,var(--background) 62%,transparent);--pc-bd:color-mix(in oklab,var(--foreground) 15%,transparent);-webkit-backdrop-filter:blur(24px) saturate(1.7);backdrop-filter:blur(24px) saturate(1.7)}
.pc-dialog[data-variant=neo] .pc-dialog-panel{--pc-bd:var(--foreground);border-width:2px;box-shadow:7px 7px 0 var(--foreground)}
.pc-dialog[data-variant=neo][data-place=left] .pc-dialog-panel{border-width:0 2px 0 0;box-shadow:6px 0 0 var(--foreground)}
.pc-dialog[data-variant=neo][data-place=right] .pc-dialog-panel{border-width:0 0 0 2px;box-shadow:-6px 0 0 var(--foreground)}
.pc-dialog[data-variant=neo][data-place=bottom] .pc-dialog-panel{border-width:2px 0 0;box-shadow:0 -6px 0 var(--foreground)}
.pc-dialog[data-variant=neo][data-place=fullscreen] .pc-dialog-panel{box-shadow:none}
/* The elevation token already draws the hairline, so the border steps aside and keeps its width (no layout shift). */
.pc-dialog:is([data-variant=default],[data-variant=soft]):not([data-shadow=none]) .pc-dialog-panel{border-color:transparent}
.pc-dialog:not([data-variant=neo])[data-shadow=sm] .pc-dialog-panel{box-shadow:var(--pc-e1)}
.pc-dialog:not([data-variant=neo])[data-shadow=md] .pc-dialog-panel{box-shadow:var(--pc-e2)}
.pc-dialog:not([data-variant=neo])[data-shadow=lg] .pc-dialog-panel{box-shadow:var(--pc-e3)}
.pc-dialog:not([data-variant=neo])[data-shadow=xl] .pc-dialog-panel{box-shadow:var(--pc-e3),0 48px 80px -24px hsl(var(--pc-sh)/.3)}
.pc-dialog[data-variant=glass] .pc-dialog-panel{box-shadow:inset 0 1px 0 color-mix(in oklab,white 40%,transparent),0 24px 60px -16px rgb(0 0 0/.36)}
.pc-dialog-panel[data-behind]{transform:translateY(-14px) scale(.94);opacity:.92}
.pc-dialog:is([data-place=left],[data-place=right],[data-place=bottom]) .pc-dialog-panel[data-behind]{transform:scale(.97);opacity:.9}
.pc-dialog-icon{background:var(--pc-tint);color:var(--pc-ink)}
.pc-dialog[data-variant=neo] .pc-dialog-icon{background:color-mix(in oklab,var(--pc-c) 20%,var(--background));color:var(--foreground);border:2px solid var(--foreground)}
.pc-dialog-muted{color:var(--muted-foreground)}
.pc-dialog-x{color:var(--muted-foreground)}
.pc-dialog-x:hover{background:color-mix(in oklab,var(--foreground) 8%,transparent);color:var(--foreground)}
.pc-dialog-x:focus-visible,.pc-dialog-field:focus-visible{box-shadow:0 0 0 3px color-mix(in oklab,var(--pc-c) 40%,transparent)}
.pc-dialog-field{background:var(--background);border:1px solid var(--input)}
.pc-dialog-field:focus-visible{border-color:color-mix(in oklab,var(--pc-c) 55%,var(--border))}
.pc-dialog-foot{border-top:1px solid color-mix(in oklab,var(--pc-bd) 80%,transparent)}
.pc-dialog[data-variant=neo] .pc-dialog-foot{border-top:2px solid var(--foreground)}
.pc-dialog-handle{background:color-mix(in oklab,var(--foreground) 18%,transparent)}
.pc-dialog-error{color:oklch(0.56 0.21 27);background:color-mix(in oklab,oklch(0.56 0.21 27) 9%,transparent)}
.dark .pc-dialog-error{color:oklch(0.72 0.17 25)}
@media (prefers-reduced-motion:reduce){.pc-dialog-panel{transition:none!important}}
`

const WIDTH: Record<DialogSize, { dialog: string; side: string; bottom: string }> = {
  sm: { dialog: "24rem", side: "20rem", bottom: "32rem" },
  md: { dialog: "32rem", side: "24rem", bottom: "42rem" },
  lg: { dialog: "42rem", side: "30rem", bottom: "56rem" },
  xl: { dialog: "56rem", side: "40rem", bottom: "72rem" },
  full: { dialog: "100%", side: "100vw", bottom: "100%" },
}

// Optional UI sound: the sound module is loaded only when `sound` is on, so silent apps pay nothing.
function useCue(sound: boolean | SoundName | undefined) {
  React.useEffect(() => {
    if (sound) void import("@/lib/goodui-sounds")
  }, [sound])
  return React.useCallback(
    (fallback: SoundName, o?: { rate?: number; exact?: boolean }) => {
      if (!sound) return
      void import("@/lib/goodui-sounds").then((m) => m.play(sound === true || o?.exact ? fallback : sound, { rate: o?.rate }))
    },
    [sound],
  )
}

export function Dialog({
  trigger: triggerNode,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  role = "dialog",
  title,
  description,
  icon,
  children,
  footer,
  variant = "default",
  tone = "primary",
  placement = "center",
  mobile = "same",
  size = "md",
  radius = "lg",
  shadow = "lg",
  animation = "scale",
  overlay = "dim",
  showClose,
  closeOnEsc = true,
  closeOnOutsideClick,
  dragToClose = true,
  scaleBackground = false,
  onConfirm,
  confirmText,
  cancelText,
  confirmTone,
  closeOnConfirm = true,
  confirmPhrase,
  initialFocus,
  returnFocus = true,
  sound,
  labels,
  className,
  style,
  ...props
}: DialogProps) {
  const l = useLabels("dialog", DEFAULT_LABELS, labels)
  const alert = role === "alertdialog"
  const outsideCloses = closeOnOutsideClick ?? !alert
  const withClose = showClose ?? !alert

  const [mounted, setMounted] = React.useState(false)
  const [mobileView, setMobileView] = React.useState(false)
  const [rtl, setRtl] = React.useState(false)
  React.useEffect(() => {
    setMounted(true)
    const mq = window.matchMedia("(max-width: 639px)")
    const on = () => setMobileView(mq.matches)
    on()
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])

  const id = React.useId()
  const panelId = id + "-dialog"
  const titleId = id + "-title"
  const descId = id + "-desc"

  const [inner, setInner] = React.useState(defaultOpen)
  const open = openProp ?? inner
  const [present, setPresent] = React.useState(open)
  if (open && !present) setPresent(true)

  const cue = useCue(sound)
  const prevOpen = React.useRef(open)
  React.useEffect(() => {
    if (prevOpen.current === open) return
    prevOpen.current = open
    cue(open ? "open" : "close", { exact: !open })
  }, [open, cue])

  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [typed, setTyped] = React.useState("")
  const [childOpen, setChildOpen] = React.useState(false)

  const parent = React.useContext(NestContext)
  const nest = React.useMemo<Nest>(() => ({ depth: (parent?.depth ?? 0) + 1, setChildOpen }), [parent])

  const trigger = React.useRef<HTMLElement | null>(null)
  const prevFocus = React.useRef<HTMLElement | null>(null)
  const panel = React.useRef<HTMLDivElement>(null)
  const overlayEl = React.useRef<HTMLDivElement>(null)
  const cancelBtn = React.useRef<HTMLButtonElement>(null)
  const me = React.useRef(Symbol("dialog"))
  const dragOut = React.useRef<Animation | null>(null)
  const live = React.useRef({ open, openProp, onOpenChange, pending })
  React.useLayoutEffect(() => {
    live.current = { open, openProp, onOpenChange, pending }
  })

  const setOpen = React.useCallback((o: boolean) => {
    const c = live.current
    if (c.open === o) return
    if (c.openProp === undefined) setInner(o)
    c.onOpenChange?.(o)
  }, [])
  const close = React.useCallback(() => setOpen(false), [setOpen])
  const api = React.useMemo<DialogApi>(() => ({ close }), [close])

  // Effective placement: mobile override, then logical sides resolved to physical ones.
  const centered = placement === "center" || placement === "top"
  const eff: DialogPlacement = mobileView && centered && mobile !== "same" ? (mobile === "fullscreen" ? "fullscreen" : "bottom") : placement
  const phys: Phys = eff === "start" ? (rtl ? "right" : "left") : eff === "end" ? (rtl ? "left" : "right") : eff
  const sheet = SHEETS.includes(phys)

  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const originEl = () => trigger.current ?? prevFocus.current
  const morphFrom = (el: HTMLElement) => {
    const o = originEl()
    if (!o || !o.isConnected) return null
    const a = o.getBoundingClientRect()
    const b = el.getBoundingClientRect()
    if (!a.width || !b.width) return null
    const dx = a.left + a.width / 2 - (b.left + b.width / 2)
    const dy = a.top + a.height / 2 - (b.top + b.height / 2)
    return `translate(${dx}px,${dy}px) scale(${a.width / b.width},${a.height / b.height})`
  }
  const bump = () => {
    const el = panel.current
    if (!el || animation === "none" || reduced() || typeof el.animate !== "function") return
    el.animate([{ transform: "scale(1)" }, { transform: sheet ? "scale(1.01)" : "scale(1.025)" }, { transform: "scale(1)" }], { duration: 240, easing: EASE })
  }

  // Remember what had focus (and its direction) before the dialog takes it.
  React.useLayoutEffect(() => {
    if (!open) return
    const a = document.activeElement
    prevFocus.current = a instanceof HTMLElement && a !== document.body ? a : null
    const from = trigger.current ?? prevFocus.current ?? document.documentElement
    setRtl(getComputedStyle(from).direction === "rtl")
    setError(null)
    setTyped("")
  }, [open])

  // Enter and exit animations.
  React.useLayoutEffect(() => {
    if (!mounted || !present) return
    const el = panel.current
    const ov = overlayEl.current
    if (!el) return
    const can = typeof el.animate === "function"
    const dragged = !open ? dragOut.current : null
    dragOut.current = null
    for (const a of can ? el.getAnimations() : []) if (a !== dragged) a.cancel()
    for (const a of ov && can ? ov.getAnimations() : []) a.cancel()
    const still = animation === "none" || !can
    const calm = reduced()
    if (open) {
      if (still) return
      if (calm) {
        el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 140 })
        ov?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 140 })
        return
      }
      const f = frames(animation, phys, animation === "morph" ? morphFrom(el) : null)
      el.animate(f.k, { duration: f.ms, easing: sheet ? EASE_SHEET : EASE })
      ov?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: EASE })
      return
    }
    if (still) {
      setPresent(false)
      return
    }
    const f = calm ? { k: [{ opacity: 0 }, { opacity: 1 }], ms: 100 } : frames(animation, phys, animation === "morph" ? morphFrom(el) : null)
    const out = { duration: calm ? 100 : Math.round(f.ms * 0.7), easing: sheet ? EASE_SHEET : EASE, fill: "forwards" as const }
    // After a drag-to-close the panel is already sliding out from under the finger; keep that animation.
    const runs = [dragged ?? el.animate([...f.k].reverse().map((k) => (typeof k.offset === "number" ? { ...k, offset: 1 - k.offset } : k)), out)]
    if (ov) runs.push(ov.animate([{ opacity: 1 }, { opacity: 0 }], { ...out, easing: "ease" }))
    let done = false
    Promise.all(runs.map((r) => r.finished))
      .then(() => {
        if (!done) setPresent(false)
      })
      .catch(() => {})
    return () => {
      done = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, present, mounted])

  // Height morph: when the content changes size (next step, an error appears), the panel eases from the old height.
  React.useLayoutEffect(() => {
    const el = panel.current
    if (!mounted || !present || !el || animation === "none" || typeof ResizeObserver === "undefined" || typeof el.animate !== "function") return
    let h = el.offsetHeight
    let w = el.offsetWidth
    let run: Animation | null = null
    const ro = new ResizeObserver(() => {
      const from = run?.playState === "running" ? parseFloat(getComputedStyle(el).height) : h
      run?.cancel()
      run = null
      const to = el.offsetHeight
      const width = el.offsetWidth
      const same = width === w
      h = to
      w = width
      if (!same || Math.abs(to - from) < 2 || reduced() || !live.current.open) return
      run = el.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: 260, easing: EASE })
    })
    for (const n of el.querySelectorAll("[data-slot=dialog-measure],[data-slot=dialog-header],[data-slot=dialog-footer]")) ro.observe(n)
    return () => {
      ro.disconnect()
      run?.cancel()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, present, animation])

  // The page steps back behind the dialog. Every direct child of <body> moves, except the dialog layers themselves.
  React.useEffect(() => {
    if (!open || !mounted || !scaleBackground || parent || animation === "none" || reduced()) return
    const els = Array.from(document.body.children).filter((n): n is HTMLElement => n instanceof HTMLElement && !n.matches("script,style,link,[data-slot=dialog-root]"))
    const prior = els.map((n) => n.style.cssText)
    const y = window.scrollY + window.innerHeight / 2
    const motion = `transform ${240}ms ${EASE},border-radius ${240}ms ${EASE}`
    for (const n of els) {
      n.style.transition = motion
      n.style.transformOrigin = `50% ${y}px`
      n.style.transform = "scale(.98)"
      n.style.borderRadius = "14px"
      n.style.overflow = "clip"
    }
    return () => {
      for (const n of els) {
        n.style.transform = ""
        n.style.borderRadius = ""
      }
      window.setTimeout(() => els.forEach((n, i) => (n.style.cssText = prior[i] ?? "")), 260)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mounted, scaleBackground])

  // Scroll lock for as long as the dialog is on screen (including its exit).
  React.useEffect(() => {
    if (!mounted || !present) return
    lockScroll()
    return unlockScroll
  }, [mounted, present])

  // Tell the parent dialog to step back while this one is open.
  React.useEffect(() => {
    if (!parent || !open) return
    parent.setChildOpen(true)
    return () => parent.setChildOpen(false)
  }, [parent, open])

  // Focus in on open; focus back on close. Esc fallback when focus is outside every dialog.
  React.useEffect(() => {
    if (!open || !mounted) return
    const p = panel.current
    if (!p) return
    const self = me.current
    stack.push(self)
    if (!p.contains(document.activeElement) || document.activeElement === p) {
      const body = p.querySelector<HTMLElement>("[data-slot=dialog-body]")
      const target =
        initialFocus?.current ??
        p.querySelector<HTMLElement>("[data-autofocus]") ??
        (confirmPhrase ? p.querySelector<HTMLElement>("[data-slot=dialog-phrase]") : null) ??
        (alert ? cancelBtn.current : null) ??
        (body ? tabbables(body)[0] : undefined) ??
        tabbables(p).find((el) => !el.hasAttribute("data-close")) ??
        p
      target.focus({ preventScroll: true })
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || stack[stack.length - 1] !== self || p.closest("[data-slot=dialog-root]")?.contains(document.activeElement)) return
      if (closeOnEsc && !live.current.pending) close()
      else bump()
    }
    document.addEventListener("keydown", onKey)
    const back = prevFocus.current
    return () => {
      document.removeEventListener("keydown", onKey)
      const i = stack.lastIndexOf(self)
      if (i >= 0) stack.splice(i, 1)
      if (returnFocus && back?.isConnected) back.focus({ preventScroll: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mounted])

  const confirm = async () => {
    setError(null)
    try {
      const r = onConfirm?.()
      if (isThenable(r)) {
        setPending(true)
        await r
      }
      if (closeOnConfirm) close()
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : l.error)
    } finally {
      setPending(false)
    }
  }

  const onRootKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation()
      if (closeOnEsc && !pending) close()
      else bump()
      return
    }
    const p = panel.current
    if (e.key !== "Tab" || !p || !p.contains(e.target as Node)) return
    const items = tabbables(p)
    const first = items[0]
    const last = items[items.length - 1]
    const active = document.activeElement
    if (!first || !last) {
      e.preventDefault()
      p.focus()
    } else if (e.shiftKey && (active === first || active === p)) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && active === last) {
      e.preventDefault()
      first.focus()
    }
  }

  // Bottom sheet: drag the handle down to close.
  const drag = React.useRef<{ y: number; t: number; dy: number } | null>(null)
  const canDrag = phys === "bottom" && dragToClose && !pending
  const onDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canDrag) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { y: e.clientY, t: e.timeStamp, dy: 0 }
    if (panel.current) panel.current.style.transition = "none"
  }
  const onDragMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || !panel.current) return
    d.dy = Math.max(0, e.clientY - d.y)
    panel.current.style.transform = d.dy ? `translateY(${d.dy}px)` : ""
  }
  const onDragEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    const el = panel.current
    drag.current = null
    if (!d || !el) return
    const fast = d.dy / Math.max(1, e.timeStamp - d.t) > 0.6
    el.style.transition = ""
    if (d.dy > Math.min(140, el.offsetHeight * 0.35) || (fast && d.dy > 30)) {
      el.style.transform = ""
      if (typeof el.animate === "function" && animation !== "none" && !reduced()) {
        // Finish the slide from where the finger let go; the exit effect reuses this animation.
        dragOut.current = el.animate([{ transform: `translateY(${d.dy}px)` }, { transform: "translateY(100%)" }], { duration: 200, easing: "ease", fill: "forwards" })
      }
      close()
    } else el.style.transform = ""
  }

  /* trigger wiring */
  const triggerEl = triggerNode
    ? React.cloneElement(triggerNode, {
        ref: mergeRefs(triggerNode.props.ref, (el: HTMLElement | null) => {
          trigger.current = el
        }),
        "aria-haspopup": "dialog",
        "aria-expanded": open,
        "aria-controls": open ? panelId : undefined,
        "data-state": open ? "open" : "closed",
        onClick: (e: React.MouseEvent<HTMLElement>) => {
          triggerNode.props.onClick?.(e)
          if (!e.defaultPrevented) setOpen(true)
        },
      } as Partial<TriggerProps>)
    : null

  const hasTitle = title !== undefined && title !== null
  const hasDesc = description !== undefined && description !== null
  const body = typeof children === "function" ? children(api) : children
  const foot = typeof footer === "function" ? footer(api) : footer
  const buttons = onConfirm !== undefined && foot === undefined
  const phraseOk = !confirmPhrase || typed.trim() === confirmPhrase
  const btnVariant = variant === "neo" ? "neo" : "solid"
  const w = WIDTH[size]

  const panelStyle: React.CSSProperties =
    phys === "left" || phys === "right"
      ? { width: size === "full" ? "100vw" : `min(${w.side}, calc(100vw - 2.5rem))` }
      : phys === "bottom"
        ? { width: "100%", maxWidth: w.bottom, maxHeight: size === "full" ? "100dvh" : "min(88dvh, 100dvh - 2rem)" }
        : phys === "fullscreen"
          ? { width: "100%", height: "100%" }
          : size === "full"
            ? { width: "100%", height: "100%" }
            : { width: `min(${w.dialog}, 100%)`, maxHeight: phys === "top" ? "calc(100dvh - 12vh - 1rem)" : "calc(100dvh - 2rem)" }

  const layer = (
    <NestContext.Provider value={nest}>
      <div
        data-slot="dialog-root"
        className="pc-dialog fixed inset-0 z-50"
        data-variant={variant}
        data-tone={tone}
        data-place={phys}
        data-radius={radius}
        data-shadow={shadow}
        data-overlay={overlay}
        data-nested={parent ? "" : undefined}
        data-state={open ? "open" : "closed"}
        dir={rtl ? "rtl" : "ltr"}
        onKeyDown={onRootKey}
        style={{ pointerEvents: open ? undefined : "none" }}
      >
        <div ref={overlayEl} aria-hidden="true" data-slot="dialog-overlay" className="pc-dialog-overlay absolute inset-0" />
        <div
          data-slot="dialog-viewport"
          className={cn(
            "absolute inset-0 flex",
            phys === "center" && "items-center justify-center p-4",
            phys === "top" && "items-start justify-center px-4 pt-[12vh] pb-4",
            phys === "fullscreen" && "items-stretch justify-stretch",
            phys === "left" && "items-stretch justify-start",
            phys === "right" && "items-stretch justify-end",
            phys === "bottom" && "items-end justify-center",
            size === "full" && centered && phys !== "fullscreen" && "items-stretch",
          )}
          // The viewport is laid out left to right so left and right sheets are physical; the panel restores the direction.
          dir="ltr"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) e.preventDefault()
          }}
          onPointerDown={(e) => {
            if (e.target !== e.currentTarget) return
            if (outsideCloses && !pending) close()
            else bump()
          }}
        >
          <div
            {...props}
            ref={panel}
            id={panelId}
            role={role}
            aria-modal="true"
            aria-labelledby={hasTitle ? titleId : props["aria-labelledby"]}
            aria-describedby={hasDesc ? descId : props["aria-describedby"]}
            aria-busy={pending || undefined}
            tabIndex={-1}
            dir={rtl ? "rtl" : "ltr"}
            data-slot="dialog"
            data-behind={childOpen ? "" : undefined}
            style={{ ...panelStyle, ...style }}
            className={cn("pc-dialog-panel flex min-h-0 flex-col overflow-hidden", className)}
          >
            {phys === "bottom" && (
              <div
                aria-hidden="true"
                data-slot="dialog-handle"
                className={cn("flex shrink-0 justify-center pt-2.5 pb-1", canDrag && "cursor-grab touch-none active:cursor-grabbing")}
                onPointerDown={onDragStart}
                onPointerMove={onDragMove}
                onPointerUp={onDragEnd}
                onPointerCancel={onDragEnd}
              >
                <span className="pc-dialog-handle h-1.5 w-10 rounded-full" />
              </div>
            )}
            {(hasTitle || hasDesc || icon) && (
              <div
                data-slot="dialog-header"
                className={cn("flex shrink-0 gap-4 px-5 pt-5 sm:px-6 sm:pt-6", phys === "bottom" && "pt-2 sm:pt-3", alert && icon ? "flex-col items-start sm:flex-row" : "items-start", withClose && "pe-12 sm:pe-14")}
              >
                {icon && <span className="pc-dialog-icon grid size-10 shrink-0 place-items-center rounded-full [&_svg]:size-5">{icon}</span>}
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  {hasTitle && (
                    <h2 id={titleId} className="text-lg leading-tight font-semibold tracking-tight">
                      {title}
                    </h2>
                  )}
                  {hasDesc && (
                    <div id={descId} className="pc-dialog-muted text-sm leading-relaxed">
                      {description}
                    </div>
                  )}
                </div>
              </div>
            )}
            {withClose && (
              <button
                type="button"
                data-close=""
                aria-label={l.close}
                onClick={close}
                className={cn("pc-press pc-dialog-x absolute end-3 z-10 grid size-8 cursor-pointer place-items-center rounded-lg outline-none transition-colors", phys === "bottom" ? "top-4" : "top-3")}
              >
                <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="size-4">
                  <path d="M4.5 4.5 11.5 11.5M11.5 4.5 4.5 11.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            )}
            {(body !== undefined && body !== null && body !== false) || confirmPhrase || error ? (
              <div data-slot="dialog-body" className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 text-sm sm:px-6", !(hasTitle || hasDesc || icon) && "pt-5 sm:pt-6")}>
                <div data-slot="dialog-measure">
                {body}
                {confirmPhrase && (
                  <label className={cn("flex flex-col gap-1.5", body !== undefined && body !== null && "mt-4")}>
                    <span className="text-sm font-medium">{l.typeToConfirm(confirmPhrase)}</span>
                    <input
                      data-slot="dialog-phrase"
                      value={typed}
                      onChange={(e) => setTyped(e.target.value)}
                      autoComplete="off"
                      spellCheck={false}
                      disabled={pending}
                      className="pc-dialog-field h-10 w-full rounded-lg px-3 text-sm outline-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && phraseOk && !pending) {
                          e.preventDefault()
                          void confirm()
                        }
                      }}
                    />
                  </label>
                )}
                {error && (
                  <p role="alert" className="pc-dialog-error mt-3 rounded-lg px-3 py-2 text-sm">
                    {error}
                  </p>
                )}
                </div>
              </div>
            ) : (
              <div className="h-4 shrink-0" />
            )}
            {(buttons || (foot !== undefined && foot !== null && foot !== false)) && (
              <div
                data-slot="dialog-footer"
                className={cn(
                  "flex shrink-0 flex-col-reverse gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6",
                  (sheet || phys === "fullscreen") && "pc-dialog-foot",
                  phys === "bottom" && "pb-[max(1rem,env(safe-area-inset-bottom))]",
                )}
              >
                {buttons ? (
                  <>
                    <Button ref={cancelBtn} type="button" variant="outline" tone="neutral" disabled={pending} onClick={close} className="w-full sm:w-auto">
                      {cancelText ?? l.cancel}
                    </Button>
                    <Button
                      type="button"
                      variant={btnVariant}
                      tone={(confirmTone ?? tone) as ButtonTone}
                      loading={pending}
                      disabled={!phraseOk}
                      animation={animation === "none" ? "none" : "press"}
                      onClick={() => void confirm()}
                      className="w-full sm:w-auto"
                    >
                      {confirmText ?? l.confirm}
                    </Button>
                  </>
                ) : (
                  foot
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </NestContext.Provider>
  )

  return (
    <>
      <GooduiTokens />
      <style href="pc-dialog" precedence="default">
        {CSS}
      </style>
      {triggerEl}
      {mounted && present ? createPortal(layer, document.body) : null}
    </>
  )
}

"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import { GooduiTokens } from "@/lib/goodui-motion"

/*
 * Keyboard keys, independent layers: every axis combines with every other.
 *   variant    flat, raised (3D), outline, glass, neo, solid      tone     accent color
 *   size       xs → lg                                            shape    square, rounded, pill
 *   separator  plus, none, then                                   font     sans or mono
 *   animation  none · press (the keycap depresses when the real key goes down) · glow
 * Give it keys={["Mod", "K"]} or keys="Mod+K". "Mod" is ⌘ on Mac and Ctrl elsewhere.
 * onTrigger turns it into a hotkey: it fires when the whole combo is pressed.
 */

export type KbdVariant = "flat" | "raised" | "outline" | "glass" | "neo" | "solid"
export type KbdTone = "primary" | "neutral" | "success" | "warning" | "danger" | "info"
export type KbdSize = "xs" | "sm" | "md" | "lg"
export type KbdShape = "square" | "rounded" | "pill"
export type KbdSeparator = "plus" | "none" | "then"
export type KbdAnimation = "none" | "press" | "glow"

export type KbdProps = Omit<React.ComponentProps<"kbd">, "children"> & {
  /** Keys of the combo: ["Mod", "Shift", "P"] or "Mod+Shift+P". */
  keys?: string[] | string
  /** Single key content, used when `keys` is not set. */
  children?: React.ReactNode
  /** Keycap style: flat, raised 3D (default), outline, glass, neo or solid. */
  variant?: KbdVariant
  /** Keycap accent color; neutral (default) keeps it gray. */
  tone?: KbdTone
  size?: KbdSize
  shape?: KbdShape
  /** Between keys: plus (a combo), none, or then (a sequence; onTrigger then waits for the keys in order). */
  separator?: KbdSeparator
  /** Keycap font; mono uses --font-mono. */
  font?: "sans" | "mono"
  /** Show ⌘ ⇧ ⌥ ↵ ⌫ arrows instead of words. */
  symbols?: boolean
  /** press depresses a keycap while its real key is held; glow adds a tone glow. none adds no key listeners. */
  animation?: KbdAnimation
  /** Fires when every key of the combo is down (or, with separator="then", when the sequence is typed). */
  onTrigger?: (e: KeyboardEvent) => void
  /** Prevent the browser default when onTrigger fires (e.g. Ctrl+K focusing the address bar). */
  preventDefault?: boolean
  /** Fire in text fields too. By default combos without Mod/Ctrl/Cmd/Alt are ignored while typing. */
  allowInInputs?: boolean
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<KbdLabels>
}

export type KbdLabels = {
  /** Separator text when separator="then". */
  then: string
  /** Screen-reader name of a special key, given its English name ("Command", "Up arrow", "Escape"…). */
  keyName: (name: string) => string
}
const DEFAULT_LABELS: KbdLabels = { then: "then", keyName: (name) => name }

const CSS = `
.pc-kbd{--pc-c:var(--primary);--pc-fg:var(--primary-foreground)}
.pc-kbd[data-tone=neutral]{--pc-c:var(--foreground);--pc-fg:var(--background)}
.pc-kbd[data-tone=success]{--pc-c:oklch(0.53 0.13 155);--pc-fg:#fff}
.pc-kbd[data-tone=warning]{--pc-c:oklch(0.75 0.16 70);--pc-fg:oklch(0.25 0.05 70)}
.pc-kbd[data-tone=danger]{--pc-c:oklch(0.56 0.21 27);--pc-fg:#fff}
.pc-kbd[data-tone=info]{--pc-c:oklch(0.55 0.17 250);--pc-fg:#fff}
.dark .pc-kbd[data-tone=success]{--pc-c:oklch(0.7 0.16 155);--pc-fg:oklch(0.2 0.05 155)}
.dark .pc-kbd[data-tone=danger]{--pc-c:oklch(0.68 0.2 25);--pc-fg:oklch(0.2 0.05 25)}
.dark .pc-kbd[data-tone=info]{--pc-c:oklch(0.7 0.15 245);--pc-fg:oklch(0.2 0.05 245)}
.pc-kbd{--pc-tint:color-mix(in oklab,var(--pc-c) 14%,transparent);--pc-ink:color-mix(in oklab,var(--pc-c) 82%,var(--foreground))}
.pc-kbd[data-tone=warning]{--pc-ink:color-mix(in oklab,var(--pc-c) 62%,var(--foreground))}
.pc-kbd[data-tone=neutral]{--pc-ink:var(--foreground)}

.pc-kbd-key{position:relative;font-family:inherit;color:var(--pc-ink);line-height:1;transition:transform 100ms var(--pc-ease-out),box-shadow 100ms var(--pc-ease-out),background-color 150ms ease,border-color 150ms ease}
.pc-kbd[data-tone=neutral] .pc-kbd-key{color:color-mix(in oklab,var(--foreground) 80%,var(--muted-foreground))}
.pc-kbd[data-font=mono] .pc-kbd-key{font-family:var(--font-mono,ui-monospace,SFMono-Regular,Menlo,Consolas,monospace)}
.pc-kbd[data-variant=flat] .pc-kbd-key{background:color-mix(in oklab,var(--pc-c) 9%,var(--muted))}
.pc-kbd[data-variant=flat][data-tone=neutral] .pc-kbd-key{background:var(--muted)}
.pc-kbd[data-variant=flat] .pc-kbd-key[data-pressed]{background:color-mix(in oklab,var(--pc-c) 22%,var(--muted));transform:scale(.92)}
/* A real keycap: lit from above, a 2px skirt below, and the key travels the full 2px into it. */
.pc-kbd[data-variant=raised] .pc-kbd-key{--pc-rimlit:rgb(255 255 255/.9);--pc-edge:color-mix(in oklab,var(--pc-c) 16%,color-mix(in oklab,var(--foreground) 16%,var(--background)));--pc-skirt:color-mix(in oklab,var(--pc-edge) 86%,var(--foreground));background:linear-gradient(to bottom,var(--background),color-mix(in oklab,var(--pc-c) 4%,var(--muted)));border:1px solid var(--pc-edge);box-shadow:inset 0 1px var(--pc-rimlit),0 2px 0 var(--pc-skirt),0 3px 5px -1px hsl(var(--pc-sh)/.2);transform:translateY(-1px)}
.dark .pc-kbd[data-variant=raised] .pc-kbd-key{--pc-rimlit:rgb(255 255 255/.16);--pc-edge:rgb(0 0 0/.7);--pc-skirt:oklch(0.12 0 0);background:linear-gradient(to bottom,oklch(0.33 0 0),oklch(0.25 0 0));box-shadow:inset 0 1px var(--pc-rimlit),0 2px 0 var(--pc-skirt),0 4px 6px -1px rgb(0 0 0/.5)}
.pc-kbd[data-variant=raised] .pc-kbd-key:is([data-pressed],:active){transform:translateY(1px);box-shadow:inset 0 1px var(--pc-rimlit),0 0 0 var(--pc-skirt),0 0 1px hsl(var(--pc-sh)/.2)}
.dark .pc-kbd[data-variant=raised] .pc-kbd-key:is([data-pressed],:active){box-shadow:inset 0 1px var(--pc-rimlit),0 0 0 var(--pc-skirt),0 0 1px rgb(0 0 0/.5)}
.pc-kbd[data-variant=outline] .pc-kbd-key{border:1px solid color-mix(in oklab,var(--pc-c) 30%,var(--border));background:transparent}
.pc-kbd[data-variant=outline][data-tone=neutral] .pc-kbd-key{border-color:var(--border)}
.pc-kbd[data-variant=outline] .pc-kbd-key[data-pressed]{background:var(--pc-tint);transform:scale(.92)}
.pc-kbd[data-variant=glass] .pc-kbd-key{color:var(--foreground);background:color-mix(in oklab,var(--background) 45%,transparent);border:1px solid color-mix(in oklab,var(--foreground) 14%,transparent);-webkit-backdrop-filter:blur(12px) saturate(1.6);backdrop-filter:blur(12px) saturate(1.6);box-shadow:inset 0 1px 0 color-mix(in oklab,white 45%,transparent),0 2px 6px -2px rgb(0 0 0/.15)}
.pc-kbd[data-variant=glass] .pc-kbd-key[data-pressed]{transform:scale(.92);background:color-mix(in oklab,var(--background) 65%,transparent)}
.pc-kbd[data-variant=neo] .pc-kbd-key{color:var(--foreground);background:color-mix(in oklab,var(--pc-c) 16%,var(--background));border:1.5px solid var(--foreground);box-shadow:2px 2px 0 var(--foreground)}
.pc-kbd[data-variant=neo][data-tone=neutral] .pc-kbd-key{background:var(--background)}
.pc-kbd[data-variant=neo] .pc-kbd-key[data-pressed]{transform:translate(2px,2px);box-shadow:0 0 0 var(--foreground)}
.pc-kbd[data-variant=solid] .pc-kbd-key{color:var(--pc-fg);background-color:var(--pc-c);background-image:var(--pc-sheen);box-shadow:inset 0 1px var(--pc-edge-t),0 2px 0 color-mix(in oklab,var(--pc-c) 55%,black),0 3px 5px -1px hsl(var(--pc-sh)/.25);transform:translateY(-1px)}
.pc-kbd[data-variant=solid] .pc-kbd-key:is([data-pressed],:active){transform:translateY(1px);box-shadow:inset 0 1px var(--pc-edge-t),0 0 0 color-mix(in oklab,var(--pc-c) 55%,black)}
.pc-kbd[data-anim=glow] .pc-kbd-key[data-pressed]{box-shadow:0 0 0 3px color-mix(in oklab,var(--pc-c) 30%,transparent),0 0 18px -2px color-mix(in oklab,var(--pc-c) 70%,transparent)}
.pc-kbd[data-anim=none] .pc-kbd-key{transition:none}
.pc-kbd-sep{color:var(--muted-foreground);font-size:.85em}
@media (prefers-reduced-motion:reduce){
  .pc-kbd-key{transition:background-color .15s!important}
  .pc-kbd .pc-kbd-key:is([data-pressed],:active){transform:none}
}
`

const SIZES: Record<KbdSize, string> = {
  xs: "h-5 min-w-5 px-1 text-[10px] rounded-[4px]",
  sm: "h-6 min-w-6 px-1.5 text-[11px] rounded-[5px]",
  md: "h-7 min-w-7 px-2 text-xs rounded-md",
  lg: "h-9 min-w-9 px-2.5 text-sm rounded-lg",
}
const GAPS: Record<KbdSize, string> = { xs: "gap-0.5", sm: "gap-1", md: "gap-1", lg: "gap-1.5" }

// [symbol, word, aria name]
const NAMED: Record<string, [string, string, string]> = {
  cmd: ["⌘", "Cmd", "Command"],
  command: ["⌘", "Cmd", "Command"],
  meta: ["⌘", "Cmd", "Command"],
  win: ["⊞", "Win", "Windows"],
  ctrl: ["Ctrl", "Ctrl", "Control"],
  control: ["Ctrl", "Ctrl", "Control"],
  shift: ["⇧", "Shift", "Shift"],
  alt: ["⌥", "Alt", "Alt"],
  option: ["⌥", "Option", "Option"],
  opt: ["⌥", "Option", "Option"],
  enter: ["↵", "Enter", "Enter"],
  return: ["↵", "Return", "Return"],
  backspace: ["⌫", "Backspace", "Backspace"],
  delete: ["⌦", "Del", "Delete"],
  del: ["⌦", "Del", "Delete"],
  esc: ["Esc", "Esc", "Escape"],
  escape: ["Esc", "Esc", "Escape"],
  tab: ["⇥", "Tab", "Tab"],
  space: ["Space", "Space", "Space"],
  up: ["↑", "Up", "Up arrow"],
  down: ["↓", "Down", "Down arrow"],
  left: ["←", "Left", "Left arrow"],
  right: ["→", "Right", "Right arrow"],
  arrowup: ["↑", "Up", "Up arrow"],
  arrowdown: ["↓", "Down", "Down arrow"],
  arrowleft: ["←", "Left", "Left arrow"],
  arrowright: ["→", "Right", "Right arrow"],
  pageup: ["PgUp", "PgUp", "Page up"],
  pagedown: ["PgDn", "PgDn", "Page down"],
  capslock: ["⇪", "Caps", "Caps lock"],
}
const EVENT_KEY: Record<string, string> = {
  cmd: "Meta",
  command: "Meta",
  meta: "Meta",
  win: "Meta",
  ctrl: "Control",
  control: "Control",
  shift: "Shift",
  alt: "Alt",
  option: "Alt",
  opt: "Alt",
  enter: "Enter",
  return: "Enter",
  backspace: "Backspace",
  delete: "Delete",
  del: "Delete",
  esc: "Escape",
  escape: "Escape",
  tab: "Tab",
  space: " ",
  up: "ArrowUp",
  down: "ArrowDown",
  left: "ArrowLeft",
  right: "ArrowRight",
  pageup: "PageUp",
  pagedown: "PageDown",
  capslock: "CapsLock",
}
const MODIFIERS = new Set(["Meta", "Control", "Shift", "Alt"])

function toKeys(keys: KbdProps["keys"]): string[] {
  if (!keys) return []
  if (Array.isArray(keys)) return keys
  // "Mod+K", "Mod + K", and "Ctrl++" (the plus key) all work.
  return keys
    .split(/\s*\+\s*(?=.)/)
    .map((k) => k.trim() || "+")
    .filter(Boolean)
}

function label(key: string, mac: boolean, symbols: boolean): [string, string] {
  const k = key.toLowerCase()
  const n = NAMED[k]
  if (k === "mod") return mac ? (symbols ? ["⌘", "Command"] : ["Cmd", "Command"]) : ["Ctrl", "Control"]
  if ((k === "ctrl" || k === "control") && mac && symbols) return ["⌃", "Control"]
  if ((k === "alt" || k === "option" || k === "opt") && !mac) return ["Alt", "Alt"]
  if (n && (k === "shift" || k === "enter" || k === "return" || k === "backspace" || k === "tab") && !symbols) return [n[1], n[2]]
  if (n) return [symbols ? n[0] : n[1], n[2]]
  return [key.length === 1 ? key.toUpperCase() : key, key]
}

function matches(key: string, e: KeyboardEvent, mac: boolean) {
  const k = key.toLowerCase()
  const want = k === "mod" ? (mac ? "Meta" : "Control") : EVENT_KEY[k]
  if (want) return e.key === want
  if (e.key.toLowerCase() === k) return true
  // Shifted / layout-dependent characters: fall back to the physical key.
  return e.code.toLowerCase() === "key" + k || e.code.toLowerCase() === "digit" + k
}

export function Kbd({
  keys,
  children,
  variant = "raised",
  tone = "neutral",
  size = "sm",
  shape = "rounded",
  separator = "plus",
  font = "sans",
  symbols = true,
  animation = "press",
  onTrigger,
  preventDefault = true,
  allowInInputs = false,
  labels,
  className,
  ...props
}: KbdProps) {
  const l = useLabels("kbd", DEFAULT_LABELS, labels)
  const list = React.useMemo(() => toKeys(keys), [keys])
  const items: string[] = list.length ? list : typeof children === "string" ? [children] : []
  const [mac, setMac] = React.useState(false)
  const [pressed, setPressed] = React.useState<boolean[]>([])
  const trigger = React.useRef(onTrigger)
  React.useEffect(() => {
    trigger.current = onTrigger
  })

  React.useEffect(() => {
    const nav = navigator as Navigator & { userAgentData?: { platform?: string } }
    setMac(/mac|iphone|ipad|ipod/i.test(nav.userAgentData?.platform || nav.platform || nav.userAgent))
  }, [])

  const listen = animation !== "none" || !!onTrigger
  const seq = separator === "then"
  const itemsKey = items.join("\u0000")
  React.useEffect(() => {
    if (!listen || !itemsKey) return
    const ks = itemsKey.split("\u0000")
    const down = new Array(ks.length).fill(false)
    const sync = () => setPressed([...down])
    // "then" combos are sequences (G then D): each key must follow the previous within 1.2s.
    let step = 0
    let stepAt = 0
    const sequence = (e: KeyboardEvent) => {
      if (MODIFIERS.has(e.key) || e.repeat) return
      if (e.timeStamp - stepAt > 1200) step = 0
      step = matches(ks[step]!, e, mac) ? step + 1 : matches(ks[0]!, e, mac) ? 1 : 0
      stepAt = e.timeStamp
      if (step === ks.length) {
        step = 0
        if (trigger.current) {
          if (preventDefault) e.preventDefault()
          trigger.current(e)
        }
      }
    }
    const chorded = ks.some((k) => /^(mod|cmd|command|meta|ctrl|control|alt|option|opt|win)$/i.test(k))
    const typing = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      return !!t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))
    }
    const onDown = (e: KeyboardEvent) => {
      if (!allowInInputs && !chorded && typing(e)) return
      if (seq) sequence(e)
      let hit = false
      ks.forEach((k, i) => {
        if (matches(k, e, mac)) {
          down[i] = true
          hit = true
        }
      })
      if (!hit) return
      sync()
      if (!seq && trigger.current && down.every(Boolean) && !e.repeat) {
        if (preventDefault) e.preventDefault()
        trigger.current(e)
      }
    }
    const onUp = (e: KeyboardEvent) => {
      // On macOS, keyup of other keys is swallowed while ⌘ is held, so releasing a modifier releases everything.
      if (MODIFIERS.has(e.key)) down.fill(false)
      else ks.forEach((k, i) => matches(k, e, mac) && (down[i] = false))
      sync()
    }
    const reset = () => {
      down.fill(false)
      sync()
    }
    window.addEventListener("keydown", onDown)
    window.addEventListener("keyup", onUp)
    window.addEventListener("blur", reset)
    return () => {
      window.removeEventListener("keydown", onDown)
      window.removeEventListener("keyup", onUp)
      window.removeEventListener("blur", reset)
    }
  }, [listen, itemsKey, mac, preventDefault, seq, allowInInputs])

  const cap = (content: React.ReactNode, i: number, name?: string) => (
    <kbd
      key={i}
      data-slot="key"
      data-pressed={animation !== "none" && pressed[i] ? "" : undefined}
      className={cn("pc-kbd-key inline-flex select-none items-center justify-center font-medium whitespace-nowrap", SIZES[size], shape === "square" && "rounded-none", shape === "pill" && "rounded-full px-[0.6em]")}
    >
      {name ? (
        <>
          <span aria-hidden="true">{content}</span>
          <span className="sr-only">{name}</span>
        </>
      ) : (
        content
      )}
    </kbd>
  )

  return (
    <>
      <GooduiTokens />
      <style href="pc-kbd" precedence="default">
        {CSS}
      </style>
      <kbd
        data-slot="kbd"
        data-variant={variant}
        data-tone={tone}
        data-font={font}
        data-anim={animation}
        className={cn("pc-kbd inline-flex items-center align-middle font-sans", GAPS[size], className)}
        {...props}
      >
        {items.length
          ? items.map((k, i) => {
              const [text, name] = label(k, mac, symbols)
              return (
                <React.Fragment key={i}>
                  {i > 0 && separator !== "none" && (
                    <span className="pc-kbd-sep px-px" aria-hidden="true">
                      {separator === "then" ? l.then : "+"}
                    </span>
                  )}
                  {cap(/^[⌘⌃⇧⌥↵⌫⌦⇥⇪↑↓←→⊞]$/.test(text) ? <span className="text-[1.25em] leading-none">{text}</span> : text, i, text !== name ? l.keyName(name) : undefined)}
                </React.Fragment>
              )
            })
          : cap(children, 0)}
      </kbd>
    </>
  )
}

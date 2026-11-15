"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import { GooduiTokens, spring } from "@/lib/goodui-motion"

/*
 * Model picker: a trigger showing the current model and a listbox of models grouped by provider, each row with
 * a provider icon slot, speed and quality meters, context window and price per million tokens. Full keyboard
 * support (arrows, Home/End, type-ahead, Enter, Esc) and a highlight that glides between rows.
 */

const CSS = `
.pc-model-tile::before{content:attr(data-letter)}
.pc-model-bar{transform-origin:bottom;animation:pc-model-bar .4s var(--pc-ease-out) both;animation-delay:calc(var(--i) * 40ms)}
@keyframes pc-model-bar{from{transform:scaleY(.2);opacity:0}}
@media (prefers-reduced-motion:reduce){.pc-model-bar{animation:none}}
`

export type ModelOption = {
  id: string
  name: string
  /** Groups rows and picks the icon slot (providerIcons[provider]). */
  provider: string
  description?: string
  /** 1 (slow) to 5 (fastest). */
  speed?: 1 | 2 | 3 | 4 | 5
  /** 1 to 5. */
  quality?: 1 | 2 | 3 | 4 | 5
  /** Context window in tokens, shown compact ("200K"). */
  context?: number
  /** USD per 1M tokens. */
  price?: { input: number; output: number }
  /** Small badge text such as "New" or "Recommended". */
  badge?: string
  /** Overrides the provider icon for this model. */
  icon?: React.ReactNode
  disabled?: boolean
}

export type ModelPickerLabels = {
  chooseModel: string
  speed: string
  quality: string
  context: string
  perMillion: string
  selected: string
}
const DEFAULT_LABELS: ModelPickerLabels = { chooseModel: "Choose a model", speed: "Speed", quality: "Quality", context: "Context", perMillion: "per 1M tokens", selected: "Selected" }

export type ModelPickerProps = Omit<React.ComponentProps<"div">, "onChange" | "defaultValue"> & {
  models: ModelOption[]
  /** Selected model id (controlled). */
  value?: string
  defaultValue?: string
  onValueChange?: (id: string, model: ModelOption) => void
  /** Icon per provider name, e.g. { OpenAI: <OpenAiLogo />, Anthropic: <AnthropicLogo /> }. Missing ones get a lettered tile. */
  providerIcons?: Record<string, React.ReactNode>
  /** Trigger look: a bordered field or a quiet ghost button for toolbars. */
  variant?: "outline" | "ghost"
  size?: "sm" | "md"
  /** Group rows under provider headings. */
  groupByProvider?: boolean
  showMeters?: boolean
  showContext?: boolean
  showPrice?: boolean
  /** Which trigger edge the menu aligns to. */
  align?: "start" | "end"
  /** Locale for the context window and prices. */
  locale?: string
  placeholder?: string
  disabled?: boolean
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<ModelPickerLabels>
}

const HUES = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"]
function hueOf(name: string) {
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 997
  return HUES[h % HUES.length] ?? HUES[0]
}

function ProviderTile({ provider, icon, className }: { provider: string; icon?: React.ReactNode; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("grid shrink-0 place-items-center rounded-md text-[11px] font-bold text-white [&_svg]:size-[70%]", !icon && "pc-model-tile", className)}
      data-letter={icon ? undefined : provider.trim().charAt(0).toUpperCase()}
      style={icon ? undefined : { background: `linear-gradient(135deg, ${hueOf(provider)}, color-mix(in oklab, ${hueOf(provider)} 60%, black))` }}
    >
      {icon}
    </span>
  )
}

function Meter({ value, label, open }: { value: number; label: string; open: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5" title={`${label} ${value}/5`}>
      <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase" aria-hidden="true">
        {label}
      </span>
      <span className="sr-only">{`${label} ${value} of 5`}</span>
      <span className="flex items-end gap-px" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={cn("w-[3px] rounded-[1px]", open && "pc-model-bar", n <= value ? "bg-foreground" : "bg-foreground/15")} style={{ height: 4 + n * 1.5, ["--i" as string]: n }} />
        ))}
      </span>
    </span>
  )
}

/** Dropdown to choose an AI model, with provider icons, speed/quality meters, context size and pricing. */
export function ModelPicker({
  models,
  value: valueProp,
  defaultValue,
  onValueChange,
  providerIcons,
  variant = "outline",
  size = "md",
  groupByProvider = true,
  showMeters = true,
  showContext = true,
  showPrice = true,
  align = "start",
  locale = "en-US",
  placeholder,
  disabled,
  labels,
  className,
  ...props
}: ModelPickerProps) {
  const l = useLabels("model-picker", DEFAULT_LABELS, labels)
  const reduce = useReducedMotion() ?? false
  const uid = React.useId()
  const [inner, setInner] = React.useState(defaultValue ?? models[0]?.id ?? "")
  const value = valueProp ?? inner
  const current = models.find((m) => m.id === value)
  const [open, setOpen] = React.useState(false)
  const [active, setActive] = React.useState(0)
  const [above, setAbove] = React.useState(false)
  const [side, setSide] = React.useState(align)
  const rootRef = React.useRef<HTMLDivElement>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const listRef = React.useRef<HTMLUListElement>(null)
  const typed = React.useRef({ text: "", at: 0 })

  const groups = React.useMemo(() => {
    if (!groupByProvider) return [{ provider: "", items: models }]
    const map = new Map<string, ModelOption[]>()
    for (const m of models) map.set(m.provider, [...(map.get(m.provider) ?? []), m])
    return [...map].map(([provider, items]) => ({ provider, items }))
  }, [models, groupByProvider])
  const flat = React.useMemo(() => groups.flatMap((g) => g.items), [groups])

  const compact = React.useMemo(() => new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }), [locale])
  const money = React.useMemo(() => new Intl.NumberFormat(locale, { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 2 }), [locale])

  const select = (m: ModelOption) => {
    if (m.disabled) return
    if (valueProp === undefined) setInner(m.id)
    onValueChange?.(m.id, m)
    setOpen(false)
    triggerRef.current?.focus()
  }

  const show = () => {
    const idx = Math.max(0, flat.findIndex((m) => m.id === value))
    setActive(idx)
    const r = triggerRef.current?.getBoundingClientRect()
    if (r) {
      setAbove(window.innerHeight - r.bottom < 380 && r.top > 380)
      // Keep the menu on screen: flip to the other edge when the preferred one would overflow.
      const w = Math.min(340, window.innerWidth - 32)
      const fitsStart = r.left + w <= window.innerWidth - 8
      const fitsEnd = r.right - w >= 8
      const rtl = getComputedStyle(triggerRef.current!).direction === "rtl"
      const startFits = rtl ? fitsEnd : fitsStart
      const endFits = rtl ? fitsStart : fitsEnd
      setSide(align === "start" ? (startFits || !endFits ? "start" : "end") : endFits || !startFits ? "end" : "start")
    }
    setOpen(true)
  }

  React.useEffect(() => {
    if (!open) return
    listRef.current?.focus({ preventScroll: true })
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", onDown)
    return () => document.removeEventListener("pointerdown", onDown)
  }, [open])

  React.useEffect(() => {
    if (!open) return
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" })
  }, [active, open])

  const move = (dir: 1 | -1) => {
    if (!flat.length) return
    let i = active
    for (let n = 0; n < flat.length; n++) {
      i = (i + dir + flat.length) % flat.length
      if (!flat[i]?.disabled) break
    }
    setActive(i)
  }

  const onListKey = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        move(1)
        break
      case "ArrowUp":
        e.preventDefault()
        move(-1)
        break
      case "Home":
        e.preventDefault()
        setActive(flat.findIndex((m) => !m.disabled))
        break
      case "End":
        e.preventDefault()
        setActive(flat.length - 1 - [...flat].reverse().findIndex((m) => !m.disabled))
        break
      case "Enter":
      case " ": {
        e.preventDefault()
        const m = flat[active]
        if (m) select(m)
        break
      }
      case "Escape":
        e.preventDefault()
        setOpen(false)
        triggerRef.current?.focus()
        break
      case "Tab":
        setOpen(false)
        break
      default:
        if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
          const now = Date.now()
          typed.current = { text: (now - typed.current.at < 600 ? typed.current.text : "") + e.key.toLowerCase(), at: now }
          const i = flat.findIndex((m) => !m.disabled && m.name.toLowerCase().startsWith(typed.current.text))
          if (i > -1) setActive(i)
        }
    }
  }

  const onTriggerKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      show()
    }
  }

  const sm = size === "sm"
  const price = (m: ModelOption) => (m.price ? `${money.format(m.price.input)} · ${money.format(m.price.output)}` : null)

  return (
    <div ref={rootRef} className={cn("relative inline-block", className)} {...props}>
      <GooduiTokens />
      <style href="pc-model-picker" precedence="default">
        {CSS}
      </style>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${uid}-list` : undefined}
        aria-label={current ? `${l.chooseModel}: ${current.name}` : l.chooseModel}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onTriggerKey}
        className={cn(
          "pc-press pc-press-soft inline-flex max-w-full items-center gap-2 rounded-lg font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50",
          sm ? "h-8 px-2 text-xs" : "h-10 px-3 text-sm",
          variant === "outline" ? "border bg-background hover:bg-muted/60" : "hover:bg-muted",
          open && (variant === "outline" ? "bg-muted/60" : "bg-muted"),
        )}
      >
        {current ? (
          <>
            <ProviderTile provider={current.provider} icon={current.icon ?? providerIcons?.[current.provider]} className={sm ? "size-4 text-[9px]" : "size-5"} />
            <span className="truncate">{current.name}</span>
          </>
        ) : (
          <span className="text-muted-foreground">{placeholder ?? l.chooseModel}</span>
        )}
        <ChevronDown className={cn("shrink-0 text-muted-foreground transition-transform duration-200", sm ? "size-3.5" : "size-4", open && "rotate-180")} aria-hidden="true" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            ref={listRef}
            id={`${uid}-list`}
            role="listbox"
            tabIndex={-1}
            aria-label={l.chooseModel}
            aria-activedescendant={flat[active] ? `${uid}-${flat[active].id}` : undefined}
            onKeyDown={onListKey}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: above ? 6 : -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0, transition: { duration: 0.1 } } : { opacity: 0, scale: 0.97, transition: { duration: 0.12 } }}
            transition={reduce ? { duration: 0 } : spring.snap}
            className={cn(
              "absolute z-50 max-h-[min(380px,70vh)] w-[min(340px,calc(100vw-2rem))] overflow-y-auto rounded-xl border bg-popover p-1 text-popover-foreground shadow-[var(--pc-e3)] shadow-black/10 outline-none dark:shadow-black/40",
              above ? "bottom-full mb-1.5 origin-bottom" : "top-full mt-1.5 origin-top",
              side === "end" ? "end-0" : "start-0",
            )}
          >
            {groups.map((g) => (
              <React.Fragment key={g.provider}>
                {g.provider && <li className="px-2 pt-2 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase" role="presentation">{g.provider}</li>}
                {g.items.map((m) => {
                  const i = flat.indexOf(m)
                  const selected = m.id === value
                  return (
                    <motion.li
                      key={m.id}
                      id={`${uid}-${m.id}`}
                      role="option"
                      aria-selected={selected}
                      aria-disabled={m.disabled || undefined}
                      data-index={i}
                      initial={reduce ? false : { opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={reduce ? { duration: 0 } : { delay: Math.min(i, 8) * 0.025, duration: 0.18 }}
                      onPointerMove={() => !m.disabled && setActive(i)}
                      onClick={() => select(m)}
                      className={cn("relative cursor-pointer rounded-lg px-2 py-2", m.disabled && "cursor-not-allowed opacity-45")}
                    >
                      {i === active && !m.disabled && <motion.span layoutId={`${uid}-hl`} className="absolute inset-0 rounded-lg bg-muted" transition={reduce ? { duration: 0 } : spring.snap} />}
                      <div className="relative flex items-start gap-2.5">
                        <ProviderTile provider={m.provider} icon={m.icon ?? providerIcons?.[m.provider]} className="mt-0.5 size-6" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-sm font-medium">{m.name}</span>
                            {m.badge && <span className="rounded-full bg-foreground px-1.5 py-px text-[10px] font-semibold text-background">{m.badge}</span>}
                            <span className="ms-auto flex shrink-0 items-center gap-2 text-[11px] text-muted-foreground tabular-nums">
                              {showContext && m.context !== undefined && <span title={l.context}>{compact.format(m.context)}</span>}
                              {showPrice && price(m) && <span title={l.perMillion}>{price(m)}</span>}
                            </span>
                          </div>
                          {m.description && <div className="truncate text-xs text-muted-foreground">{m.description}</div>}
                          {showMeters && (m.speed !== undefined || m.quality !== undefined) && (
                            <div className="mt-1.5 flex items-center gap-4">
                              {m.speed !== undefined && <Meter value={m.speed} label={l.speed} open={open} />}
                              {m.quality !== undefined && <Meter value={m.quality} label={l.quality} open={open} />}
                              {selected && (
                                <span className="ms-auto inline-flex items-center gap-1 text-[11px] font-medium text-foreground">
                                  <Check className="size-3.5" aria-hidden="true" />
                                  <span className="sr-only">{l.selected}</span>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.li>
                  )
                })}
              </React.Fragment>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

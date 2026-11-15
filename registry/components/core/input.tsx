"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { CircleAlert, CircleCheck, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import { GooduiTokens, spring } from "@/lib/goodui-motion"

/*
 * One field, independent layers: every axis combines with every other.
 *   variant    how it is painted         tone       focus color
 *   labelMode  top / floating / inline   animation  how focus looks
 *   state      default / error / success (message slides in, error shakes)
 *   shape, size, shadow, leading / trailing (icon or text), addonBefore / addonAfter, clearable, multiline.
 */

export type InputVariant = "outline" | "filled" | "underline" | "ghost" | "neo" | "glass"
export type InputTone = "primary" | "neutral" | "success" | "warning" | "danger" | "info"
export type InputSize = "sm" | "md" | "lg"
export type InputShape = "square" | "rounded" | "pill"
export type InputLabelMode = "top" | "floating" | "inline" | "none"
export type InputState = "default" | "error" | "success"
export type InputAnimation = "none" | "ring" | "glow" | "underline-grow" | "lift"
export type InputShadow = "none" | "sm" | "md" | "inner"

type Native = Omit<React.ComponentProps<"input">, "size" | "prefix" | "value" | "defaultValue" | "onChange">

export type InputLabels = { clear: string }
const DEFAULT_LABELS: InputLabels = { clear: "Clear" }

export type InputProps = Native & {
  /** Field style: outline (default), filled, underline, ghost, neo-brutalist or frosted glass. */
  variant?: InputVariant
  /** Focus color (ring, border, floating label). Overridden by state="error" or "success". */
  tone?: InputTone
  size?: InputSize
  shape?: InputShape
  /** Field shadow; inner draws an inset shadow. Ignored by neo, which has its own offset shadow. */
  shadow?: InputShadow
  /** How the field reacts to focus. */
  animation?: InputAnimation
  /** Field label; placement is set by labelMode. */
  label?: React.ReactNode
  /** top: above the field. floating: inside, floats up on focus. inline: inside, before the value. none: screen-reader only. */
  labelMode?: InputLabelMode
  /** Helper text under the field (hidden while a message shows). */
  description?: React.ReactNode
  /** Validation state: colors the field, adds an icon, sets aria-invalid on error and shows message. */
  state?: InputState
  /** Error or success text; slides in under the field. */
  message?: React.ReactNode
  /** Shake the field when it enters the error state. */
  shake?: boolean
  /** Change it (e.g. a submit counter) to shake again while already in the error state. */
  shakeKey?: React.Key
  /** Icon or short text inside the field, before the value. */
  leading?: React.ReactNode
  /** Icon or short text inside the field, after the value. */
  trailing?: React.ReactNode
  /** Attached segment before the field, e.g. "https://". */
  addonBefore?: React.ReactNode
  /** Attached segment after the field, e.g. ".com". */
  addonAfter?: React.ReactNode
  /** Shows a × button while the field has a value. */
  clearable?: boolean
  /** Shows "12/80" when maxLength is set. */
  showCount?: boolean
  /** Renders a <textarea>. */
  multiline?: boolean
  /** Visible rows of the textarea (multiline only). */
  rows?: number
  /** Textarea grows with its content. */
  autoResize?: boolean
  /** Controlled value. */
  value?: string
  /** Initial value when uncontrolled. */
  defaultValue?: string
  /** Called with the new string on typing and when the clear button empties the field. */
  onValueChange?: (value: string) => void
  /** Native change event. The clear button fires it too (with an empty value), so form libraries see the reset. */
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  /** A small light on the field border follows the pointer. Ignored by underline and neo, and with animation="none". */
  borderLight?: boolean
  /** false shrinks the field to its content width. */
  fullWidth?: boolean
  /** Class for the field box (the root gets className). */
  fieldClassName?: string
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<InputLabels>
}

const CSS = `
.pc-input{--pc-c:var(--primary);--pc-fg:var(--primary-foreground)}
.pc-input[data-tone=neutral]{--pc-c:var(--foreground);--pc-fg:var(--background)}
.pc-input[data-tone=success]{--pc-c:oklch(0.53 0.13 155);--pc-fg:#fff}
.pc-input[data-tone=warning]{--pc-c:oklch(0.75 0.16 70);--pc-fg:oklch(0.25 0.05 70)}
.pc-input[data-tone=danger]{--pc-c:oklch(0.56 0.21 27);--pc-fg:#fff}
.pc-input[data-tone=info]{--pc-c:oklch(0.55 0.17 250);--pc-fg:#fff}
.dark .pc-input[data-tone=success]{--pc-c:oklch(0.7 0.16 155);--pc-fg:oklch(0.2 0.05 155)}
.dark .pc-input[data-tone=danger]{--pc-c:oklch(0.68 0.2 25);--pc-fg:oklch(0.2 0.05 25)}
.dark .pc-input[data-tone=info]{--pc-c:oklch(0.7 0.15 245);--pc-fg:oklch(0.2 0.05 245)}
.pc-input{--pc-tint:color-mix(in oklab,var(--pc-c) 14%,transparent);--pc-ink:color-mix(in oklab,var(--pc-c) 82%,var(--foreground))}
.pc-input[data-tone=warning]{--pc-ink:color-mix(in oklab,var(--pc-c) 62%,var(--foreground))}
.pc-input[data-state=error]{--pc-c:oklch(0.56 0.21 27);--pc-in-s:var(--pc-c)}
.pc-input[data-state=success]{--pc-c:oklch(0.53 0.13 155);--pc-in-s:var(--pc-c)}
.pc-input{--pc-in-muted:color-mix(in oklab,var(--muted-foreground) 80%,var(--foreground))}
.dark .pc-input[data-state=error]{--pc-c:oklch(0.68 0.2 25)}
.dark .pc-input[data-state=success]{--pc-c:oklch(0.7 0.16 155)}

.pc-input-field{--pc-in-mx:50%;--pc-in-my:50%;position:relative;isolation:isolate;border:1px solid transparent;box-shadow:var(--pc-in-v,0 0 #0000),var(--pc-in-sh,0 0 #0000),var(--pc-in-f,0 0 #0000)}
.pc-input[data-variant=outline] .pc-input-field{--pc-in-v:var(--pc-well);background:var(--background);border-color:var(--pc-in-s,var(--input))}
.pc-input[data-variant=outline] .pc-input-field:hover{border-color:var(--pc-in-s,color-mix(in oklab,var(--foreground) 25%,var(--input)))}
.pc-input[data-variant=filled] .pc-input-field{--pc-in-v:var(--pc-well);background:var(--muted);border-color:var(--pc-in-s,transparent)}
.pc-input[data-variant=filled] .pc-input-field:hover{background:color-mix(in oklab,var(--muted) 70%,var(--foreground) 5%)}
.pc-input[data-variant=filled] .pc-input-field:focus-within{background:var(--background)}
.pc-input[data-variant=underline] .pc-input-field{border-width:0 0 1px;border-radius:0!important;border-color:var(--pc-in-s,var(--input));background:transparent}
.pc-input[data-variant=underline] .pc-input-field{padding-inline:2px}
.pc-input[data-variant=ghost] .pc-input-field{background:transparent;border-color:var(--pc-in-s,transparent)}
.pc-input[data-variant=ghost] .pc-input-field:hover{background:color-mix(in oklab,var(--muted) 60%,transparent)}
.pc-input[data-variant=ghost] .pc-input-field:focus-within{background:var(--muted)}
.pc-input[data-variant=neo] .pc-input-field{background:var(--background);border:2px solid var(--foreground);--pc-in-v:3px 3px 0 var(--pc-in-s,var(--foreground))}
.pc-input[data-variant=glass] .pc-input-field{background:color-mix(in oklab,var(--background) 45%,transparent);border-color:var(--pc-in-s,color-mix(in oklab,var(--foreground) 14%,transparent));-webkit-backdrop-filter:blur(14px) saturate(1.6);backdrop-filter:blur(14px) saturate(1.6);--pc-in-v:inset 0 1px 0 color-mix(in oklab,white 40%,transparent)}
.pc-input .pc-input-field:focus-within{border-color:var(--pc-c)}
.pc-input[data-variant=neo] .pc-input-field:focus-within{border-color:var(--foreground)}

.pc-input[data-shadow=sm] .pc-input-field{--pc-in-sh:0 1px 2px hsl(var(--pc-sh)/.08)}
.pc-input[data-shadow=md] .pc-input-field{--pc-in-sh:0 4px 14px -4px hsl(var(--pc-sh)/.16)}
.pc-input[data-shadow=inner] .pc-input-field{--pc-in-sh:inset 0 2px 4px hsl(var(--pc-sh)/.1)}

.pc-input:not([data-anim=none]) .pc-input-field{transition:box-shadow 150ms var(--pc-ease-out),border-color 150ms var(--pc-ease-out),background-color 150ms ease}
.pc-input[data-anim=ring] .pc-input-field:focus-within{--pc-in-f:0 0 0 3px color-mix(in oklab,var(--pc-c) 16%,transparent)}
.pc-input[data-anim=glow] .pc-input-field:focus-within{--pc-in-f:0 0 0 3px color-mix(in oklab,var(--pc-c) 14%,transparent),0 8px 24px -10px color-mix(in oklab,var(--pc-c) 60%,transparent)}
.pc-input[data-anim=lift] .pc-input-field{transition:transform .2s var(--pc-ease-out),box-shadow 150ms var(--pc-ease-out),border-color 150ms var(--pc-ease-out),background-color 150ms ease}
.pc-input[data-anim=lift] .pc-input-field:focus-within{transform:translateY(-2px);--pc-in-f:0 10px 22px -12px color-mix(in oklab,var(--pc-c) 70%,rgb(0 0 0/.4))}
.pc-input[data-variant=neo][data-anim=lift] .pc-input-field:focus-within{transform:translate(-1px,-1px);--pc-in-v:5px 5px 0 var(--pc-in-s,var(--foreground));--pc-in-f:0 0 #0000}
.pc-input-grow{position:absolute;left:0;right:0;bottom:0;height:2px;background:var(--pc-c);transform:scaleX(0);transition:transform .3s var(--pc-ease-out);pointer-events:none;border-radius:2px}
.pc-input .pc-input-field:focus-within .pc-input-grow{transform:scaleX(1)}
.pc-input[data-anim=underline-grow] .pc-input-field:focus-within{border-color:var(--pc-in-s,var(--input))}
.pc-input[data-anim=underline-grow][data-variant=neo] .pc-input-field:focus-within{border-color:var(--foreground)}

/* One pixel of light inside the border, masked to a ring. overflow:hidden on the field clips anything outside it. */
.pc-input-light{position:absolute;inset:0;z-index:2;padding:1px;border-radius:inherit;pointer-events:none;opacity:0;transition:opacity .25s ease;background:radial-gradient(110px circle at var(--pc-in-mx) var(--pc-in-my),color-mix(in oklab,var(--pc-c) 80%,var(--foreground)),transparent 70%);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0)}
.pc-input-field:hover>.pc-input-light{opacity:.9}
.pc-input-field:focus-within>.pc-input-light{opacity:0}
.pc-input-control{background:transparent;outline:none;min-width:0;width:100%;color:inherit}
.pc-input-control::placeholder{color:color-mix(in oklab,var(--muted-foreground) 88%,var(--foreground));opacity:1}
.pc-input-control:disabled{cursor:not-allowed}
textarea.pc-input-control{resize:vertical}
.pc-input[data-autoresize] textarea.pc-input-control{resize:none;overflow:hidden}

.pc-input-float{position:absolute;inset-inline-start:0;top:50%;transform-origin:left center;transform:translateY(-50%);color:var(--pc-in-muted);pointer-events:none;white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis;transition:transform .18s var(--pc-ease-out),color .18s}
.pc-input-float:dir(rtl){transform-origin:right center}
.pc-input[data-multiline] .pc-input-float{top:.8em;transform:none}
.pc-input[data-label=floating] .pc-input-control::placeholder{opacity:0;transition:opacity .15s}
.pc-input[data-label=floating] .pc-input-control:focus::placeholder{opacity:1}
.pc-input-control:focus~.pc-input-float,.pc-input-control:not(:placeholder-shown)~.pc-input-float{transform:translateY(calc(-50% - .78em)) scale(.78)}
.pc-input[data-multiline] .pc-input-control:focus~.pc-input-float,.pc-input[data-multiline] .pc-input-control:not(:placeholder-shown)~.pc-input-float{transform:translateY(-.55em) scale(.78)}
.pc-input .pc-input-control:focus~.pc-input-float{color:var(--pc-ink)}

.pc-input-x{display:inline-flex;align-items:center;justify-content:center;border-radius:9999px;color:var(--pc-in-muted);transition:background-color .15s,color .15s}
.pc-input-x:hover{color:var(--foreground);background:color-mix(in oklab,var(--foreground) 9%,transparent)}
.pc-input-add{background:color-mix(in oklab,var(--muted) 75%,transparent);color:var(--pc-in-muted)}
.pc-input[data-variant=underline] .pc-input-add,.pc-input[data-variant=ghost] .pc-input-add{background:transparent}
.pc-input[data-state=error] .pc-input-msg{color:var(--pc-ink)}
.pc-input[data-state=success] .pc-input-msg{color:var(--pc-ink)}

.pc-input[data-shake] .pc-input-field{animation:pc-input-shake .42s cubic-bezier(.36,.07,.19,.97)}
@keyframes pc-input-shake{10%,90%{translate:-1px 0}20%,80%{translate:2px 0}30%,50%,70%{translate:-4px 0}40%,60%{translate:4px 0}}
@media (prefers-reduced-motion:reduce){
  .pc-input *{transition:none!important;animation:none!important}
  .pc-input-light{display:none}
  .pc-input .pc-input-field:focus-within{transform:none!important}
}
`

const H: Record<InputSize, string> = { sm: "min-h-8 text-sm", md: "min-h-10 text-sm", lg: "min-h-12 text-base" }
const H_FLOAT: Record<InputSize, string> = { sm: "min-h-11 text-sm", md: "min-h-13 text-sm", lg: "min-h-15 text-base" }
const PAD: Record<InputSize, string> = { sm: "px-2.5 gap-2", md: "px-3 gap-2", lg: "px-4 gap-2.5" }
const SVG: Record<InputSize, string> = { sm: "[&_svg]:size-3.5", md: "[&_svg]:size-4", lg: "[&_svg]:size-[18px]" }
const SHAPES: Record<InputShape, string> = { square: "rounded-none", rounded: "rounded-lg", pill: "rounded-full" }
const X_SIZE: Record<InputSize, string> = { sm: "size-5 [&_svg]:size-3", md: "size-6 [&_svg]:size-3.5", lg: "size-7 [&_svg]:size-4" }

export function Input({
  variant = "outline",
  tone = "primary",
  size = "md",
  shape = "rounded",
  shadow = "none",
  animation = "ring",
  label,
  labelMode = "top",
  description,
  state = "default",
  message,
  shake = true,
  shakeKey,
  leading,
  trailing,
  addonBefore,
  addonAfter,
  clearable,
  showCount,
  multiline,
  rows = 3,
  autoResize,
  value,
  defaultValue,
  onValueChange,
  onChange,
  borderLight = true,
  fullWidth = true,
  className,
  fieldClassName,
  id,
  placeholder,
  disabled,
  maxLength,
  labels,
  ref: refProp,
  ...props
}: InputProps) {
  const l = useLabels("input", DEFAULT_LABELS, labels)
  const reduce = useReducedMotion()
  const autoId = React.useId()
  const inputId = id ?? autoId
  const msgId = `${inputId}-msg`
  const ref = React.useRef<HTMLInputElement & HTMLTextAreaElement>(null)
  // Merge the caller's ref (e.g. react-hook-form's register) with the internal one.
  const setRef = React.useCallback(
    (el: (HTMLInputElement & HTMLTextAreaElement) | null) => {
      ref.current = el
      if (typeof refProp === "function") refProp(el)
      else if (refProp) refProp.current = el
    },
    [refProp],
  )
  const [inner, setInner] = React.useState(defaultValue ?? "")
  const val = value ?? inner
  const [shaking, setShaking] = React.useState(false)

  // Shake when entering the error state, or when the error message changes.
  const msgKey = typeof message === "string" ? message : ""
  const prev = React.useRef({ state, msgKey, shakeKey })
  React.useEffect(() => {
    const was = prev.current
    prev.current = { state, msgKey, shakeKey }
    if (!shake || state !== "error" || (was.state === "error" && was.msgKey === msgKey && was.shakeKey === shakeKey)) return
    setShaking(false)
    const raf = requestAnimationFrame(() => setShaking(true))
    const t = setTimeout(() => setShaking(false), 480)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(t)
    }
  }, [state, msgKey, shakeKey, shake])

  React.useLayoutEffect(() => {
    const el = ref.current
    if (!multiline || !autoResize || !el) return
    el.style.height = "auto"
    el.style.height = `${el.scrollHeight}px`
  }, [val, multiline, autoResize])

  // Uncontrolled fields stay native (defaultValue), so libraries that write el.value (react-hook-form defaults,
  // reset) keep working; `inner` only mirrors the DOM for the counter and the clear button.
  React.useEffect(() => {
    if (value === undefined && ref.current) setInner(ref.current.value)
  }, [value])

  const set = (v: string) => {
    if (value === undefined) setInner(v)
    onValueChange?.(v)
  }

  // Clear through a real input event so onChange, onValueChange and form libraries all see the empty value.
  const clear = () => {
    const el = ref.current
    if (!el) return set("")
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(el, "")
    el.dispatchEvent(new Event("input", { bubbles: true }))
    el.focus()
  }

  const floating = labelMode === "floating" && !!label
  const stateIcon = state === "error" ? <CircleAlert className="text-[var(--pc-c)]" /> : state === "success" ? <CircleCheck className="text-[var(--pc-c)]" /> : null
  const hasMsg = !!message && state !== "default"
  const light = borderLight && !disabled && animation !== "none" && variant !== "underline" && variant !== "neo"
  const count = showCount && maxLength ? `${val.length}/${maxLength}` : null

  const control = {
    ref: setRef,
    id: inputId,
    ...(value !== undefined ? { value } : { defaultValue }),
    disabled,
    maxLength,
    placeholder: floating ? (placeholder ?? " ") : placeholder,
    "aria-invalid": state === "error" || undefined,
    "aria-describedby": hasMsg || description ? msgId : undefined,
    "aria-label": props["aria-label"] ?? (labelMode === "none" && typeof label === "string" ? label : undefined),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      set(e.target.value)
      onChange?.(e)
    },
    className: cn(
      "pc-input-control",
      multiline ? (floating ? "pt-6 pb-2" : "py-2") : floating ? "self-stretch pt-4" : "self-stretch",
      multiline && "leading-relaxed",
    ),
  }

  const side = (node: React.ReactNode, slot: string) =>
    node ? (
      <span data-slot={slot} className={cn("inline-flex shrink-0 items-center text-[var(--pc-in-muted)]", multiline && "self-start pt-2.5")}>
        {node}
      </span>
    ) : null

  const addon = (node: React.ReactNode, slot: string, before: boolean) =>
    node ? (
      <span
        data-slot={slot}
        className={cn(
          "pc-input-add -my-px flex shrink-0 items-center self-stretch whitespace-nowrap",
          size === "lg" ? "px-4" : "px-3",
          before ? "border-e" : "border-s",
          before ? (size === "lg" ? "-ms-4" : size === "sm" ? "-ms-2.5" : "-ms-3") : size === "lg" ? "-me-4" : size === "sm" ? "-me-2.5" : "-me-3",
        )}
      >
        {node}
      </span>
    ) : null

  return (
    <>
      <GooduiTokens />
      <style href="pc-input" precedence="default">
        {CSS}
      </style>
      <div
        data-slot="input"
        data-variant={variant}
        data-tone={tone}
        data-state={state}
        data-anim={animation}
        data-shadow={variant === "neo" ? "none" : shadow}
        data-label={floating ? "floating" : labelMode}
        data-multiline={multiline ? "" : undefined}
        data-autoresize={multiline && autoResize ? "" : undefined}
        data-shake={shaking ? "" : undefined}
        className={cn("pc-input flex flex-col gap-1.5", fullWidth ? "w-full" : "w-fit", disabled && "opacity-60", className)}
      >
        {label && labelMode === "top" && (
          <label htmlFor={inputId} className="text-sm leading-none font-medium">
            {label}
          </label>
        )}
        {label && labelMode === "none" && typeof label !== "string" && (
          <label htmlFor={inputId} className="sr-only">
            {label}
          </label>
        )}
        <div
          data-slot="field"
          // Written straight to the element: the light must not re-render the form on every pointer move.
          onPointerMove={
            light
              ? (e) => {
                  const r = e.currentTarget.getBoundingClientRect()
                  e.currentTarget.style.setProperty("--pc-in-mx", `${e.clientX - r.left}px`)
                  e.currentTarget.style.setProperty("--pc-in-my", `${e.clientY - r.top}px`)
                }
              : undefined
          }
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault()
              ref.current?.focus()
            }
          }}
          className={cn(
            "pc-input-field flex cursor-text overflow-hidden",
            multiline ? "items-stretch" : "items-center",
            multiline ? (floating ? "min-h-20" : "") : floating ? H_FLOAT[size] : H[size],
            multiline && (size === "lg" ? "text-base" : "text-sm"),
            PAD[size],
            SVG[size],
            "[&_svg]:shrink-0",
            multiline && shape === "pill" ? "rounded-2xl" : SHAPES[shape],
            fieldClassName,
          )}
        >
          {addon(addonBefore, "addon-before", true)}
          {side(leading, "leading")}
          {label && labelMode === "inline" && (
            <label htmlFor={inputId} className={cn("shrink-0 font-medium whitespace-nowrap text-[var(--pc-in-muted)]", multiline && "self-start pt-2")}>
              {label}
            </label>
          )}
          <div className="relative flex min-w-0 flex-1 self-stretch">
            {multiline ? (
              <textarea rows={rows} {...(props as React.ComponentProps<"textarea">)} {...control} />
            ) : (
              <input {...props} {...control} />
            )}
            {floating && (
              <label htmlFor={inputId} className="pc-input-float">
                {label}
              </label>
            )}
          </div>
          {clearable && val && !disabled && (
            <button
              type="button"
              aria-label={l.clear}
              onClick={clear}
              className={cn("pc-press pc-input-x shrink-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/50", X_SIZE[size], multiline && "self-start mt-2")}
            >
              <X />
            </button>
          )}
          {side(stateIcon, "state-icon")}
          {side(trailing, "trailing")}
          {addon(addonAfter, "addon-after", false)}
          {light && <span className="pc-input-light" aria-hidden="true" />}
          {animation === "underline-grow" && <span className="pc-input-grow" aria-hidden="true" />}
        </div>
        {(hasMsg || description || count) && (
          <div className="flex items-start gap-3 text-xs">
            <div id={msgId} className="min-w-0 flex-1" aria-live="polite">
              <AnimatePresence mode="wait" initial={false}>
                {hasMsg ? (
                  <motion.p
                    key={`${state}:${msgKey}`}
                    className="pc-input-msg overflow-hidden font-medium"
                    initial={{ opacity: 0, height: 0, y: -6 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -4 }}
                    transition={reduce ? { duration: 0 } : spring.snap}
                  >
                    {message}
                  </motion.p>
                ) : description ? (
                  <motion.p
                    key="desc"
                    className="overflow-hidden text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={reduce ? { duration: 0 } : { duration: 0.15 }}
                  >
                    {description}
                  </motion.p>
                ) : null}
              </AnimatePresence>
            </div>
            {count && <span className="shrink-0 text-muted-foreground tabular-nums">{count}</span>}
          </div>
        )}
      </div>
    </>
  )
}

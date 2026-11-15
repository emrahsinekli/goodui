"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import type { SoundName } from "@/lib/goodui-sounds"
import { GooduiTokens } from "@/lib/goodui-motion"

/*
 * Checkbox and RadioGroup/Radio sharing the same independent layers:
 *   variant    default, filled, outline, circle, neo, card (the whole card is the hit area)
 *   tone       which color when checked     animation  none, draw (stroke), pop, bounce
 *   shadow     none, sm, glow               size       sm, md, lg
 * plus indeterminate, label + description on either side, invalid and extra card content.
 * Both render real <input> elements, so forms, labels and keyboard (Space, arrows in a group) just work.
 */

export type CheckboxVariant = "default" | "filled" | "outline" | "circle" | "neo" | "card"
export type CheckboxTone = "primary" | "neutral" | "success" | "warning" | "danger" | "info"
export type CheckboxAnimation = "none" | "draw" | "pop" | "bounce"
export type CheckboxShadow = "none" | "sm" | "glow"
export type CheckboxSize = "sm" | "md" | "lg"

type Layers = {
  /** Box style: default, filled, outline (tinted when checked), circle, neo, or card (the whole card is the hit area). */
  variant?: CheckboxVariant
  /** Color when checked. */
  tone?: CheckboxTone
  /** How the mark appears: draw (stroke, default), pop, bounce or none. */
  animation?: CheckboxAnimation
  /** Box shadow; glow only shows when checked. */
  shadow?: CheckboxShadow
  size?: CheckboxSize
}

type Text = {
  /** Visible label, linked with aria-labelledby. */
  label?: React.ReactNode
  /** Muted helper text under the label, linked with aria-describedby. */
  description?: React.ReactNode
  /** Which side of the box the text sits on. "left" spreads the row (text start, box end). */
  labelPosition?: "left" | "right"
  /** Shows the danger state, e.g. an unaccepted required checkbox. */
  invalid?: boolean
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

const R = ".pc-checkbox"
const B = ".pc-checkbox-box"
const ON = `${R}:is([data-state=checked],[data-state=indeterminate])`
const CSS = `${tones("pc-checkbox")}
${R}{--pc-edge:color-mix(in oklab,var(--foreground) 28%,transparent);-webkit-tap-highlight-color:transparent}
${R}[data-invalid]{--pc-edge:oklch(0.56 0.21 27)}
${B}{background:var(--background);border:1.5px solid var(--pc-edge);color:var(--pc-fg)}
.pc-checkbox-desc{color:color-mix(in oklab,var(--muted-foreground) 85%,var(--foreground))}
${R}[data-state=unchecked]:not([data-disabled]):hover ${B}{border-color:color-mix(in oklab,var(--pc-c) 55%,var(--pc-edge))}
${ON} ${B}{background:var(--pc-c);border-color:var(--pc-c)}
${R}:has(input:focus-visible) ${B}{box-shadow:0 0 0 3px color-mix(in oklab,var(--pc-c) 35%,transparent)}

${R}[data-variant=filled] ${B}{background:color-mix(in oklab,var(--foreground) 9%,transparent);border-color:transparent}
${R}[data-variant=filled]${ON.slice(R.length)} ${B}{background:var(--pc-c)}
${R}[data-variant=outline]${ON.slice(R.length)} ${B}{background:var(--pc-tint);border-color:var(--pc-c);color:var(--pc-ink)}
${R}[data-variant=neo] ${B}{border:2px solid var(--foreground);box-shadow:2px 2px 0 var(--foreground)}
${R}[data-variant=neo]:not([data-disabled]):hover ${B}{border-color:var(--foreground)}
${R}[data-variant=neo]${ON.slice(R.length)} ${B}{border-color:var(--foreground)}
${R}[data-variant=neo]:not([data-disabled]):active ${B}{transform:translate(2px,2px);box-shadow:0 0 0 var(--foreground)}

${R}[data-variant=card]{background:var(--card);border:1px solid var(--border);box-shadow:0 1px 2px rgb(0 0 0/.04)}
${R}[data-variant=card]:not([data-disabled]):hover{border-color:color-mix(in oklab,var(--pc-c) 35%,var(--border))}
${R}[data-variant=card]${ON.slice(R.length)}{border-color:var(--pc-c);box-shadow:0 0 0 1px var(--pc-c);background:color-mix(in oklab,var(--pc-c) 5%,var(--card))}
${R}[data-variant=card]:has(input:focus-visible){box-shadow:0 0 0 1px var(--pc-c),0 0 0 4px color-mix(in oklab,var(--pc-c) 30%,transparent)}
${R}[data-variant=card][data-invalid]{border-color:oklch(0.56 0.21 27)}

${R}[data-shadow=sm] ${B},${R}[data-variant=card][data-shadow=sm]{box-shadow:0 1px 3px rgb(0 0 0/.14),0 1px 1px rgb(0 0 0/.06)}
${R}[data-shadow=glow]${ON.slice(R.length)} ${B}{box-shadow:0 0 0 3px var(--pc-tint),0 2px 10px -1px color-mix(in oklab,var(--pc-c) 65%,transparent)}
${R}[data-variant=card][data-shadow=glow]${ON.slice(R.length)}{box-shadow:0 0 0 1px var(--pc-c),0 8px 24px -8px color-mix(in oklab,var(--pc-c) 55%,transparent)}
${R}[data-variant=card][data-shadow=glow]${ON.slice(R.length)} ${B}{box-shadow:none}

/* Radio: classic ring + dot by default; filled and circle fill the disc. */
${R}[data-kind=radio] ${B}{color:var(--pc-c)}
${R}[data-kind=radio]${ON.slice(R.length)}:is([data-variant=default],[data-variant=card],[data-variant=outline]) ${B}{background:var(--background)}
${R}[data-kind=radio][data-variant=outline]${ON.slice(R.length)} ${B}{border-width:5px;background:var(--background)}
${R}[data-kind=radio]:is([data-variant=filled],[data-variant=circle],[data-variant=neo])${ON.slice(R.length)} ${B}{color:var(--pc-fg)}

/* Marks */
.pc-checkbox-mark{fill:none;stroke:currentColor;stroke-linecap:round;stroke-linejoin:round;opacity:0;transform-box:fill-box;transform-origin:center}
.pc-checkbox-dot{fill:currentColor;stroke:none}
${R}[data-state=checked] .pc-checkbox-check,${R}[data-state=checked] .pc-checkbox-dot,${R}[data-state=indeterminate] .pc-checkbox-dash{opacity:1}
${R}[data-anim]:not([data-anim=none]) ${B}{transition:background-color .16s,border-color .16s,box-shadow .2s,color .16s,transform .12s}
${R}[data-anim]:not([data-anim=none]):not([data-variant=neo]):not([data-disabled]):active ${B}{transform:scale(.9)}
${R}[data-variant=card][data-anim]:not([data-anim=none]){transition:border-color .18s,box-shadow .2s,background-color .18s}

${R}[data-anim=draw] .pc-checkbox-mark:not(.pc-checkbox-dot){stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset .26s var(--pc-ease-in-out),opacity 0s .26s}
${R}[data-anim=draw][data-state=checked] .pc-checkbox-check,${R}[data-anim=draw][data-state=indeterminate] .pc-checkbox-dash{stroke-dashoffset:0;transition:stroke-dashoffset .3s var(--pc-ease-in-out) .05s,opacity 0s}
${R}[data-anim=draw] .pc-checkbox-dot{transform:scale(0);transition:transform .2s var(--pc-ease-out),opacity .15s}
${R}[data-anim=draw][data-state=checked] .pc-checkbox-dot{transform:scale(1)}

${R}[data-anim=pop] .pc-checkbox-mark{transition:opacity .12s}
${R}[data-anim=pop][data-touched]${ON.slice(R.length)} ${B}{animation:pc-checkbox-pop .34s var(--pc-ease-spring)}
@keyframes pc-checkbox-pop{0%{transform:scale(.72)}55%{transform:scale(1.14)}100%{transform:scale(1)}}

${R}[data-anim=bounce] .pc-checkbox-mark{transform:scale(0);transition:transform .38s var(--pc-ease-spring),opacity .1s}
${R}[data-anim=bounce][data-state=checked] .pc-checkbox-check,${R}[data-anim=bounce][data-state=checked] .pc-checkbox-dot,${R}[data-anim=bounce][data-state=indeterminate] .pc-checkbox-dash{transform:scale(1)}
${R}[data-anim=bounce][data-touched]${ON.slice(R.length)} ${B}{animation:pc-checkbox-squish .4s var(--pc-ease-spring)}
@keyframes pc-checkbox-squish{0%{transform:scale(1.18,.82)}50%{transform:scale(.92,1.08)}100%{transform:scale(1)}}

@media (prefers-reduced-motion:reduce){
  ${R},${R} *{transition:none!important;animation:none!important}
  ${R} .pc-checkbox-mark{stroke-dashoffset:0!important;transform:none!important}
}
`

const BOX: Record<CheckboxSize, string> = { sm: "size-3.5 rounded-[4px]", md: "size-4 rounded-[5px]", lg: "size-5 rounded-[6px]" }
const TEXT: Record<CheckboxSize, { label: string; line: string; card: string }> = {
  sm: { label: "text-[13px]", line: "h-[18px]", card: "p-3 gap-2.5 rounded-lg" },
  md: { label: "text-sm", line: "h-5", card: "p-4 gap-3 rounded-xl" },
  lg: { label: "text-[15px]", line: "h-[22px]", card: "p-5 gap-3.5 rounded-xl" },
}

type ChoiceProps = Required<Layers> &
  Text & {
    kind: "checkbox" | "radio"
    state: "checked" | "unchecked" | "indeterminate"
    touched: boolean
    disabled?: boolean
    className?: string
    children?: React.ReactNode
    input: React.ReactElement
    id: string
  }

function Choice({ kind, state, touched, variant, tone, animation, shadow, size, label, description, labelPosition = "right", invalid, disabled, className, children, input, id }: ChoiceProps) {
  const round = kind === "radio" || variant === "circle"
  const text = (label || description || children) && (
    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
      {label && (
        <span id={`${id}-label`} className={cn("leading-snug font-medium", TEXT[size].label)}>
          {label}
        </span>
      )}
      {description && (
        <span id={`${id}-desc`} className="pc-checkbox-desc text-[13px] leading-snug">
          {description}
        </span>
      )}
      {children}
    </span>
  )
  const box = (
    <span className={cn("flex shrink-0 items-center", (label || description) && TEXT[size].line)}>
      <span data-slot="checkbox-box" className={cn("pc-checkbox-box relative grid place-items-center", BOX[size], round && "rounded-full", variant === "neo" && !round && "rounded-[3px]")}>
        {input}
        <svg viewBox="0 0 24 24" aria-hidden="true" className="pointer-events-none size-full">
          {kind === "radio" && variant !== "circle" ? (
            <circle className="pc-checkbox-mark pc-checkbox-dot" cx="12" cy="12" r={variant === "outline" ? 0 : 5.5} />
          ) : (
            <>
              <path className="pc-checkbox-mark pc-checkbox-check" d="M6 12.5l4 4L18 8" pathLength={1} strokeWidth={3} />
              <path className="pc-checkbox-mark pc-checkbox-dash" d="M7 12h10" pathLength={1} strokeWidth={3} />
            </>
          )}
        </svg>
      </span>
    </span>
  )
  return (
    <>
      <style href="pc-checkbox" precedence="default">
        {CSS}
      </style>
      <label
        htmlFor={id}
        data-slot={kind}
        data-kind={kind}
        data-variant={variant}
        data-tone={tone}
        data-anim={animation}
        data-shadow={shadow}
        data-state={state}
        data-touched={touched || undefined}
        data-invalid={invalid || undefined}
        data-disabled={disabled || undefined}
        className={cn(
          "pc-checkbox relative items-start select-none",
          variant === "card" ? cn("flex", TEXT[size].card) : cn("inline-flex", size === "sm" ? "gap-2" : "gap-2.5"),
          labelPosition === "left" && "flex justify-between",
          disabled ? "cursor-not-allowed opacity-55" : "cursor-pointer",
          className,
        )}
      >
        {labelPosition === "left" ? (
          <>
            {text}
            {box}
          </>
        ) : (
          <>
            {box}
            {text}
          </>
        )}
      </label>
    </>
  )
}

const INPUT = "absolute inset-0 m-0 size-full cursor-[inherit] appearance-none rounded-[inherit] opacity-0 outline-none"

export type CheckboxProps = Omit<React.ComponentProps<"input">, "type" | "size" | "checked" | "defaultChecked" | "onChange"> &
  Layers &
  Text & {
    /** Checked state (controlled). */
    checked?: boolean
    /** Initial state when uncontrolled. */
    defaultChecked?: boolean
    /** Called with the new checked state. */
    onCheckedChange?: (checked: boolean) => void
    /** Native change event of the hidden input. */
    onChange?: React.ChangeEventHandler<HTMLInputElement>
    /** Shows a dash, e.g. a "select all" with some rows selected. Clicking it checks the box. */
    indeterminate?: boolean
    /** Extra content under the description (prices, badges), handy with the card variant. */
    children?: React.ReactNode
    /** Plays "pop" when checked and "tick" when unchecked, when the visitor has sounds on (lib/goodui-sounds); pass a sound name to use one sound for both. Off by default. */
    sound?: boolean | SoundName
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

export function Checkbox({
  checked: checkedProp,
  defaultChecked = false,
  onCheckedChange,
  onChange,
  indeterminate = false,
  variant = "default",
  tone = "primary",
  animation = "draw",
  shadow = "none",
  size = "md",
  label,
  description,
  labelPosition,
  invalid,
  disabled,
  className,
  children,
  sound,
  id: idProp,
  ref: refProp,
  ...props
}: CheckboxProps) {
  const uid = React.useId()
  const id = idProp ?? uid
  const cue = useCue(sound)
  const ref = React.useRef<HTMLInputElement>(null)
  // Merge the caller's ref (e.g. react-hook-form's register) with the internal one.
  const setRef = React.useCallback(
    (el: HTMLInputElement | null) => {
      ref.current = el
      if (typeof refProp === "function") refProp(el)
      else if (refProp) refProp.current = el
    },
    [refProp],
  )
  const [inner, setInner] = React.useState(defaultChecked)
  const [touched, setTouched] = React.useState(false)
  const controlled = checkedProp !== undefined
  const checked = checkedProp ?? inner
  // Uncontrolled boxes stay native (defaultChecked) so libraries that set el.checked keep working; read it back once.
  React.useEffect(() => {
    if (!controlled && ref.current) setInner(ref.current.checked)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // A click clears el.indeterminate natively; re-apply the prop after every render so a parent that keeps
  // indeterminate=true stays in sync.
  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate
  })
  const state = indeterminate ? "indeterminate" : checked ? "checked" : "unchecked"

  return (
    <Choice
      kind="checkbox"
      id={id}
      state={state}
      touched={touched}
      {...{ variant, tone, animation, shadow, size, label, description, labelPosition, invalid, disabled, className, children }}
      input={
        <input
          ref={setRef}
          type="checkbox"
          id={id}
          {...(controlled ? { checked } : { defaultChecked })}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-labelledby={label ? `${id}-label` : undefined}
          aria-describedby={description ? `${id}-desc` : undefined}
          onChange={(e) => {
            onChange?.(e)
            setTouched(true)
            if (!controlled) setInner(e.target.checked)
            onCheckedChange?.(e.target.checked)
            cue(e.target.checked ? "pop" : "tick")
            e.target.indeterminate = indeterminate
          }}
          className={INPUT}
          {...props}
        />
      }
    />
  )
}

type GroupCtx = Required<Layers> & {
  name: string
  value: string | undefined
  select: (v: string) => void
  touched: boolean
  disabled?: boolean
  labelPosition?: "left" | "right"
}
const RadioContext = React.createContext<GroupCtx | null>(null)

export type RadioGroupProps = Omit<React.ComponentProps<"div">, "defaultValue" | "onChange" | "dir"> &
  Layers & {
    /** Selected radio value (controlled). */
    value?: string
    /** Initially selected value when uncontrolled. */
    defaultValue?: string
    /** Called with the value of the newly selected radio. */
    onValueChange?: (value: string) => void
    /** Form field name. Generated when omitted. */
    name?: string
    /** Disables every radio in the group. */
    disabled?: boolean
    /** horizontal lays the radios out in equal columns. */
    orientation?: "vertical" | "horizontal"
    /** Default text side for every radio. */
    labelPosition?: "left" | "right"
  }

export function RadioGroup({
  value: valueProp,
  defaultValue,
  onValueChange,
  name,
  disabled,
  orientation = "vertical",
  variant = "default",
  tone = "primary",
  animation = "draw",
  shadow = "none",
  size = "md",
  labelPosition,
  className,
  children,
  ...props
}: RadioGroupProps) {
  const uid = React.useId()
  const [inner, setInner] = React.useState(defaultValue)
  const [touched, setTouched] = React.useState(false)
  const value = valueProp ?? inner
  const select = React.useCallback(
    (v: string) => {
      setTouched(true)
      if (valueProp === undefined) setInner(v)
      onValueChange?.(v)
    },
    [valueProp, onValueChange],
  )
  return (
    <RadioContext.Provider value={{ name: name ?? uid, value, select, touched, disabled, variant, tone, animation, shadow, size, labelPosition }}>
      <GooduiTokens />
      <div
        role="radiogroup"
        aria-orientation={orientation}
        aria-disabled={disabled || undefined}
        data-slot="radio-group"
        className={cn("grid", orientation === "horizontal" ? "grid-flow-col auto-cols-fr gap-3" : variant === "card" ? "gap-2.5" : "gap-3", className)}
        {...props}
      >
        {children}
      </div>
    </RadioContext.Provider>
  )
}

export type RadioProps = Omit<React.ComponentProps<"input">, "type" | "size" | "value" | "checked" | "defaultChecked"> &
  Layers &
  Text & {
    /** Value reported to RadioGroup and submitted with the form. */
    value: string
    /** Extra content under the description (prices, badges), handy with the card variant. */
    children?: React.ReactNode
  }

export function Radio({ value, label, description, labelPosition, invalid, disabled, className, children, id: idProp, onChange, variant, tone, animation, shadow, size, ...props }: RadioProps) {
  const ctx = React.useContext(RadioContext)
  if (!ctx) throw new Error("<Radio> must be used inside <RadioGroup>")
  const uid = React.useId()
  const id = idProp ?? uid
  const checked = ctx.value === value
  const off = disabled || ctx.disabled
  return (
    <Choice
      kind="radio"
      id={id}
      state={checked ? "checked" : "unchecked"}
      touched={ctx.touched}
      variant={variant ?? ctx.variant}
      tone={tone ?? ctx.tone}
      animation={animation ?? ctx.animation}
      shadow={shadow ?? ctx.shadow}
      size={size ?? ctx.size}
      labelPosition={labelPosition ?? ctx.labelPosition}
      {...{ label, description, invalid, className, children }}
      disabled={off}
      input={
        <input
          type="radio"
          id={id}
          name={ctx.name}
          value={value}
          checked={checked}
          disabled={off}
          aria-labelledby={label ? `${id}-label` : undefined}
          aria-describedby={description ? `${id}-desc` : undefined}
          onChange={(e) => {
            onChange?.(e)
            if (e.target.checked) ctx.select(value)
          }}
          className={INPUT}
          {...props}
        />
      }
    />
  )
}

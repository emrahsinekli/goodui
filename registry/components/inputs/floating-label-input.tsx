"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { AlertCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import { GooduiTokens, spring, ease as easing } from "@/lib/goodui-motion"

// Chrome/Safari autofill fills inputs without a change event; this no-op animation tells us it happened.
const CSS = `
@keyframes pc-floating-label-input-autofill { from { opacity: 1 } to { opacity: 1 } }
.pc-floating-label-input-field:-webkit-autofill { animation: pc-floating-label-input-autofill 1ms }
.pc-floating-label-input-field::placeholder { color: transparent; transition: color .15s }
.pc-floating-label-input-root[data-floating] .pc-floating-label-input-field:focus::placeholder { color: var(--muted-foreground) }
`

const SPRING = spring.snap

export type FloatingLabelInputLabels = {
  /** aria-label of the clear button; gets the field's label text. */
  clear: (label: string) => string
  /** Used as the label text in `clear` when `label` is not a string. */
  field: string
}
const DEFAULT_LABELS: FloatingLabelInputLabels = {
  clear: (label) => `Clear ${label}`,
  field: "field",
}

/** Empties a native field through its value setter and fires a real input event, so React's onChange runs. */
function clearNative(el: HTMLInputElement | HTMLTextAreaElement | null) {
  if (!el) return false
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set
  if (!setter) return false
  setter.call(el, "")
  el.dispatchEvent(new Event("input", { bubbles: true }))
  return true
}

type FieldBase = {
  /** Text that sits inside the field and floats up on focus or when there is a value. */
  label: React.ReactNode
  /** Error message; slides in under the field and turns it red. */
  error?: React.ReactNode
  /** Helper text shown when there is no error. */
  description?: React.ReactNode
  /** Show a clear (×) button when the field has a value. */
  clearable?: boolean
  /** Called with the new string on typing and on clear. The clear button also fires `onChange` with a real change event. */
  onValueChange?: (value: string) => void
  /** Called after the clear button empties the field. */
  onClear?: () => void
  /** Classes for the native input/textarea; `className` styles the root. */
  inputClassName?: string
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<FloatingLabelInputLabels>
}

function useField(
  value: React.ComponentProps<"input">["value"],
  defaultValue: React.ComponentProps<"input">["defaultValue"],
  onValueChange?: (v: string) => void,
) {
  const [inner, setInner] = React.useState(defaultValue != null ? String(defaultValue) : "")
  const val = value != null ? String(value) : inner
  const set = (v: string) => {
    if (value == null) setInner(v)
    onValueChange?.(v)
  }
  return [val, set] as const
}

function Message({ id, error, description, reduce }: { id: string; error?: React.ReactNode; description?: React.ReactNode; reduce: boolean }) {
  return (
    <AnimatePresence initial={false} mode="wait">
      {error ? (
        <motion.p
          key="error"
          id={id}
          role="alert"
          initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0, y: -4 }}
          animate={{ opacity: 1, height: "auto", y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0, y: -4 }}
          transition={reduce ? { duration: 0.1 } : { duration: 0.2, ease: easing.out }}
          className="overflow-hidden"
        >
          <span className="flex items-center gap-1.5 pt-1.5 text-xs font-medium text-destructive">
            <AlertCircle className="size-3.5 shrink-0" /> {error}
          </span>
        </motion.p>
      ) : description ? (
        <motion.p
          key="description"
          id={id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.08 } }}
          className="pt-1.5 text-xs text-muted-foreground"
        >
          {description}
        </motion.p>
      ) : null}
    </AnimatePresence>
  )
}

function ClearButton({ show, label, onClear, reduce }: { show: boolean; label: string; onClear: () => void; reduce: boolean }) {
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.button
          type="button"
          aria-label={label}
          onMouseDown={(e) => e.preventDefault()}
          onClick={onClear}
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.5, rotate: -90 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.5, rotate: 90 }}
          transition={reduce ? { duration: 0.1 } : SPRING}
          className="pc-press grid size-6 shrink-0 place-items-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <X className="size-3.5" />
        </motion.button>
      )}
    </AnimatePresence>
  )
}

const shell =
  "relative flex w-full rounded-lg border border-input bg-background shadow-xs transition-[border-color,box-shadow] dark:bg-input/30 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 data-invalid:border-destructive data-invalid:focus-within:ring-destructive/20 data-disabled:cursor-not-allowed data-disabled:opacity-50"

const labelTone = (floating: boolean, focused: boolean, invalid: boolean) =>
  cn(
    "pointer-events-none absolute start-0 origin-top-left truncate rtl:origin-top-right text-sm whitespace-nowrap transition-colors",
    invalid ? "text-destructive" : focused ? "text-foreground" : "text-muted-foreground",
    floating && !invalid && !focused && "text-muted-foreground",
  )

export type FloatingLabelInputProps = Omit<React.ComponentProps<"input">, "prefix"> &
  FieldBase & {
    /** Shown before the value once the label floats, e.g. "$" or "https://". */
    prefix?: React.ReactNode
    /** Shown after the value once the label floats, e.g. "/hr" or ".com". */
    suffix?: React.ReactNode
  }

/** Input whose label floats up on focus or value, with prefix/suffix slots, a clear button and an animated error. */
export function FloatingLabelInput({
  label,
  error,
  description,
  clearable,
  onValueChange,
  onClear,
  prefix,
  suffix,
  className,
  inputClassName,
  labels,
  value,
  defaultValue,
  onChange,
  onFocus,
  onBlur,
  onAnimationStart,
  disabled,
  id: idProp,
  ref,
  ...props
}: FloatingLabelInputProps) {
  const l = useLabels("floating-label-input", DEFAULT_LABELS, labels)
  const reduce = useReducedMotion() ?? false
  const uid = React.useId()
  const id = idProp ?? uid
  const msgId = `${id}-msg`
  const [val, setVal] = useField(value, defaultValue, onValueChange)
  const [focused, setFocused] = React.useState(false)
  const [autofilled, setAutofilled] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const floating = focused || val.length > 0 || autofilled
  const invalid = Boolean(error)

  const setRefs = (el: HTMLInputElement | null) => {
    inputRef.current = el
    if (typeof ref === "function") ref(el)
    else if (ref) (ref as React.RefObject<HTMLInputElement | null>).current = el
  }

  const labelText = typeof label === "string" ? label : l.field

  return (
    <div className={cn("pc-floating-label-input-root w-full", className)} data-floating={floating || undefined}>
      <GooduiTokens />
      <style href="pc-floating-label-input" precedence="default">
        {CSS}
      </style>
      <div className={cn(shell, "h-14 items-center gap-1 px-3")} data-invalid={invalid || undefined} data-disabled={disabled || undefined}>
        {prefix != null && (
          <motion.span
            aria-hidden="true"
            className="shrink-0 self-end pb-2.5 text-sm text-muted-foreground"
            initial={false}
            animate={{ opacity: floating ? 1 : 0 }}
            transition={{ duration: 0.15 }}
          >
            {prefix}
          </motion.span>
        )}
        {/* The label sits on the shell, so it lines up with the field edge even when a prefix is set. */}
        <motion.label
          htmlFor={id}
          className={cn(labelTone(floating, focused, invalid), "top-[1.125rem] start-3 max-w-[calc(100%-1.5rem)]")}
          initial={false}
          animate={{ y: floating ? -10 : 0, scale: floating ? 0.78 : 1 }}
          transition={reduce ? { duration: 0 } : SPRING}
        >
          {label}
        </motion.label>
        <div className="relative h-full min-w-0 flex-1">
          <input
            ref={setRefs}
            id={id}
            value={val}
            disabled={disabled}
            aria-invalid={invalid || undefined}
            aria-describedby={error || description ? msgId : undefined}
            onChange={(e) => {
              setVal(e.target.value)
              setAutofilled(false)
              onChange?.(e)
            }}
            onFocus={(e) => {
              setFocused(true)
              onFocus?.(e)
            }}
            onBlur={(e) => {
              setFocused(false)
              onBlur?.(e)
            }}
            onAnimationStart={(e) => {
              if (e.animationName === "pc-floating-label-input-autofill") setAutofilled(true)
              onAnimationStart?.(e)
            }}
            className={cn(
              "pc-floating-label-input-field h-full w-full bg-transparent pt-5 pb-1.5 text-sm text-foreground outline-none disabled:cursor-not-allowed",
              inputClassName,
            )}
            {...props}
          />
        </div>
        {suffix != null && (
          <motion.span
            aria-hidden="true"
            className="shrink-0 self-end pb-2.5 text-sm text-muted-foreground"
            initial={false}
            animate={{ opacity: floating ? 1 : 0 }}
            transition={{ duration: 0.15 }}
          >
            {suffix}
          </motion.span>
        )}
        {clearable && (
          <ClearButton
            show={val.length > 0 && !disabled}
            label={l.clear(labelText)}
            reduce={reduce}
            onClear={() => {
              // A real input event runs our onChange (setVal + the user's onChange); fall back to setVal if that fails.
              if (!clearNative(inputRef.current)) setVal("")
              onClear?.()
              inputRef.current?.focus()
            }}
          />
        )}
      </div>
      <Message id={msgId} error={error} description={description} reduce={reduce} />
    </div>
  )
}

export type FloatingLabelTextareaProps = React.ComponentProps<"textarea"> & FieldBase

/** Textarea with the same floating label; grows with content where `field-sizing` is supported and counts characters. */
export function FloatingLabelTextarea({
  label,
  error,
  description,
  clearable,
  onValueChange,
  onClear,
  className,
  inputClassName,
  labels,
  value,
  defaultValue,
  onChange,
  onFocus,
  onBlur,
  disabled,
  maxLength,
  id: idProp,
  ref,
  ...props
}: FloatingLabelTextareaProps) {
  const l = useLabels("floating-label-input", DEFAULT_LABELS, labels)
  const reduce = useReducedMotion() ?? false
  const uid = React.useId()
  const id = idProp ?? uid
  const msgId = `${id}-msg`
  const [val, setVal] = useField(value as React.ComponentProps<"input">["value"], defaultValue as React.ComponentProps<"input">["defaultValue"], onValueChange)
  const [focused, setFocused] = React.useState(false)
  const areaRef = React.useRef<HTMLTextAreaElement | null>(null)
  const floating = focused || val.length > 0
  const invalid = Boolean(error)
  const near = maxLength ? val.length / maxLength : 0

  const setRefs = (el: HTMLTextAreaElement | null) => {
    areaRef.current = el
    if (typeof ref === "function") ref(el)
    else if (ref) (ref as React.RefObject<HTMLTextAreaElement | null>).current = el
  }

  return (
    <div className={cn("pc-floating-label-input-root w-full", className)} data-floating={floating || undefined}>
      <style href="pc-floating-label-input" precedence="default">
        {CSS}
      </style>
      <div className={cn(shell, "flex-col px-3 pt-6 pb-2")} data-invalid={invalid || undefined} data-disabled={disabled || undefined}>
        <motion.label
          htmlFor={id}
          className={cn(labelTone(floating, focused, invalid), "top-4 start-3 max-w-[calc(100%-1.5rem)]")}
          initial={false}
          animate={{ y: floating ? -8 : 0, scale: floating ? 0.78 : 1 }}
          transition={reduce ? { duration: 0 } : SPRING}
        >
          {label}
        </motion.label>
        <textarea
          ref={setRefs}
          id={id}
          value={val}
          disabled={disabled}
          maxLength={maxLength}
          aria-invalid={invalid || undefined}
          aria-describedby={error || description ? msgId : undefined}
          onChange={(e) => {
            setVal(e.target.value)
            onChange?.(e)
          }}
          onFocus={(e) => {
            setFocused(true)
            onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocused(false)
            onBlur?.(e)
          }}
          className={cn(
            "pc-floating-label-input-field min-h-20 w-full resize-none bg-transparent text-sm leading-6 text-foreground outline-none [field-sizing:content] max-h-48 disabled:cursor-not-allowed",
            inputClassName,
          )}
          {...props}
        />
        {(clearable || maxLength) && (
          <div className="flex items-center justify-end gap-2 pt-1">
            {maxLength ? (
              <span
                aria-live={near > 0.9 ? "polite" : "off"}
                className={cn(
                  "text-xs tabular-nums text-muted-foreground transition-colors",
                  near > 0.9 && "text-amber-700 dark:text-amber-400",
                  near >= 1 && "text-destructive",
                )}
              >
                {val.length}/{maxLength}
              </span>
            ) : null}
            {clearable && (
              <ClearButton
                show={val.length > 0 && !disabled}
                label={l.clear(typeof label === "string" ? label : l.field)}
                reduce={reduce}
                onClear={() => {
                  if (!clearNative(areaRef.current)) setVal("")
                  onClear?.()
                  areaRef.current?.focus()
                }}
              />
            )}
          </div>
        )}
      </div>
      <Message id={msgId} error={error} description={description} reduce={reduce} />
    </div>
  )
}

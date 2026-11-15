"use client"

import * as React from "react"
import { motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { GooduiTokens, spring, ease as easing } from "@/lib/goodui-motion"

export type CheckboxDrawState = boolean | "indeterminate"

const SIZES = {
  sm: { box: "size-4 rounded-[4px]", stroke: 2.6 },
  md: { box: "size-5 rounded-[5px]", stroke: 2.3 },
  lg: { box: "size-6 rounded-md", stroke: 2.1 },
} as const

export type CheckboxDrawProps = Omit<React.ComponentProps<"button">, "onChange" | "value" | "defaultChecked"> & {
  /** Controlled state: true, false or "indeterminate" (draws a dash, aria-checked="mixed"). */
  checked?: CheckboxDrawState
  /** Initial state when uncontrolled; also accepts "indeterminate". */
  defaultChecked?: CheckboxDrawState
  /** Clicking an indeterminate box checks it. */
  onCheckedChange?: (checked: boolean) => void
  /** Box size: "sm" 16px, "md" 20px, "lg" 24px. */
  size?: keyof typeof SIZES
  /** Clickable label next to the box; also its accessible name. */
  label?: React.ReactNode
  /** Muted helper text under the label, linked with aria-describedby. */
  description?: React.ReactNode
  /** Draw a line through the label when checked (to-do lists). */
  strikethrough?: boolean
  /** Form field name; renders a hidden input that submits `value` when checked and "" when not. */
  name?: string
  /** Value submitted with `name` when checked. */
  value?: string
}

/** Checkbox whose check mark draws itself in, with an indeterminate dash and an optional strike-through label. */
export function CheckboxDraw({
  checked: checkedProp,
  defaultChecked = false,
  onCheckedChange,
  size = "md",
  label,
  description,
  strikethrough,
  name,
  value = "on",
  disabled,
  className,
  id: idProp,
  onClick,
  ...props
}: CheckboxDrawProps) {
  const reduce = useReducedMotion() ?? false
  const [inner, setInner] = React.useState<CheckboxDrawState>(defaultChecked)
  const state = checkedProp ?? inner
  const on = state === true
  const mixed = state === "indeterminate"
  const filled = on || mixed
  const uid = React.useId()
  const id = idProp ?? uid
  const s = SIZES[size]

  const draw = (show: boolean, delay = 0) =>
    reduce
      ? { duration: 0 }
      : show
        ? { pathLength: { duration: 0.24, delay, ease: easing.inOut }, opacity: { duration: 0.01, delay } }
        : { pathLength: { duration: 0.12 }, opacity: { duration: 0.1, delay: 0.08 } }

  const box = (
    <button
      type="button"
      role="checkbox"
      id={id}
      aria-checked={mixed ? "mixed" : on}
      aria-describedby={description ? `${id}-desc` : undefined}
      data-state={mixed ? "indeterminate" : on ? "checked" : "unchecked"}
      disabled={disabled}
      onClick={(e) => {
        const next = !on
        if (checkedProp === undefined) setInner(next)
        onCheckedChange?.(next)
        onClick?.(e)
      }}
      className={cn(
        "pc-press group/cb relative inline-grid shrink-0 cursor-pointer place-items-center border border-input bg-background shadow-xs transition-[border-color,box-shadow] outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
        filled && "border-primary",
        s.box,
        className,
      )}
      {...props}
    >
      <motion.span
        aria-hidden="true"
        className="absolute inset-[-1px] rounded-[inherit] bg-primary"
        initial={false}
        animate={{ scale: filled ? 1 : reduce ? 1 : 0.4, opacity: filled ? 1 : 0 }}
        transition={reduce ? { duration: 0 } : spring.play}
      />
      {/* Press squash in CSS: motion's whileTap would make this aria-hidden span focusable (tabindex=0). */}
      <span
        aria-hidden="true"
        className="relative grid size-full place-items-center transition-transform duration-200 ease-[var(--pc-ease-spring)] group-enabled/cb:group-active/cb:scale-[0.82] motion-reduce:transition-none motion-reduce:group-active/cb:scale-100"
      >
        <svg viewBox="0 0 20 20" fill="none" className="size-full text-primary-foreground">
          <motion.path
            d="M5 10.4 8.6 14 15.2 6.6"
            stroke="currentColor"
            strokeWidth={s.stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={false}
            animate={{ pathLength: on ? 1 : 0, opacity: on ? 1 : 0 }}
            transition={draw(on, 0.06)}
          />
          <motion.path
            d="M5.5 10h9"
            stroke="currentColor"
            strokeWidth={s.stroke}
            strokeLinecap="round"
            initial={false}
            animate={{ pathLength: mixed ? 1 : 0, opacity: mixed ? 1 : 0 }}
            transition={draw(mixed, 0.04)}
          />
        </svg>
      </span>
      {name && <input type="hidden" name={name} value={on ? value : ""} />}
    </button>
  )

  if (!label && !description) return box

  return (
    <div className="flex items-start gap-3">
      <GooduiTokens />
      <span className={cn("flex items-center", size === "lg" ? "h-6" : "h-5")}>{box}</span>
      <div className="grid min-w-0 gap-0.5">
        {label && (
          <label
            htmlFor={id}
            className={cn(
              "relative w-fit text-sm leading-5 font-medium transition-colors duration-200 select-none",
              // Disabled text is muted rather than faded with opacity, so it keeps 4.5:1 contrast.
              disabled ? "cursor-not-allowed text-muted-foreground" : "cursor-pointer",
              strikethrough && on && "text-muted-foreground",
            )}
          >
            {label}
            {strikethrough && (
              <motion.span
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 -inset-x-0.5 h-[1.5px] origin-left rounded-full rtl:origin-right bg-current"
                initial={false}
                animate={{ scaleX: on ? 1 : 0 }}
                transition={reduce ? { duration: 0 } : { duration: on ? 0.32 : 0.18, delay: on ? 0.12 : 0, ease: easing.inOut }}
              />
            )}
          </label>
        )}
        {description && (
          <p id={`${id}-desc`} className="text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}

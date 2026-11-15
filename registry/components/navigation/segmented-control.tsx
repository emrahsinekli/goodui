"use client"

import * as React from "react"
import { motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { GooduiTokens, spring as springs } from "@/lib/goodui-motion"

export type SegmentedControlOption = {
  /** Unique key of the option; this is what value and onValueChange use. */
  value: string
  /** Visible text. Leave it out for an icon-only segment (then set ariaLabel). */
  label?: React.ReactNode
  /** Icon component (e.g. a lucide icon), sized by the control's size. */
  icon?: React.ComponentType<{ className?: string }>
  /** Accessible name, required when the option shows only an icon. */
  ariaLabel?: string
  disabled?: boolean
}

export type SegmentedControlProps = Omit<React.ComponentProps<"div">, "defaultValue" | "onChange"> & {
  options: SegmentedControlOption[]
  /** Selected option value (controlled). */
  value?: string
  /** Initially selected option when uncontrolled; defaults to the first enabled option. */
  defaultValue?: string
  /** Called with the new value on click or arrow-key selection. */
  onValueChange?: (value: string) => void
  /** Height: sm 32px, md 36px, lg 44px. */
  size?: "sm" | "md" | "lg"
  /** Stretch to the container width with equal segments. */
  fullWidth?: boolean
  /** Disables the whole control. */
  disabled?: boolean
}

function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (v: T) => void) {
  const [inner, setInner] = React.useState(defaultValue)
  const controlled = value !== undefined
  const current = controlled ? value : inner
  const set = React.useCallback(
    (next: T) => {
      if (!controlled) setInner(next)
      onChange?.(next)
    },
    [controlled, onChange],
  )
  return [current, set] as const
}

const SIZE = {
  sm: { root: "h-8 rounded-lg p-0.5 text-xs", item: "px-2.5 gap-1.5 [&_svg]:size-3.5", radius: 6 },
  md: { root: "h-9 rounded-[9px] p-0.5 text-sm", item: "px-3 gap-2 [&_svg]:size-4", radius: 7 },
  lg: { root: "h-11 rounded-xl p-1 text-sm", item: "px-4 gap-2 [&_svg]:size-4", radius: 8 },
}

/**
 * iOS-style segmented control: a springy thumb slides to the chosen segment and squeezes while pressed.
 * Behaves as a radio group: arrow keys, Home and End move the selection.
 */
export function SegmentedControl({
  options,
  value,
  defaultValue,
  onValueChange,
  size = "md",
  fullWidth = false,
  disabled = false,
  className,
  ...props
}: SegmentedControlProps) {
  const uid = React.useId()
  const reduce = useReducedMotion() ?? false
  const [current, setCurrent] = useControllable(value, defaultValue ?? options.find((o) => !o.disabled)?.value ?? "", onValueChange)
  const [pressed, setPressed] = React.useState<string | null>(null)
  const refs = React.useRef<(HTMLButtonElement | null)[]>([])
  const s = SIZE[size]
  const selectedIndex = options.findIndex((o) => o.value === current)

  const enabled = options.map((o, i) => ({ o, i })).filter((x) => !x.o.disabled && !disabled)
  const move = (e: React.KeyboardEvent, i: number) => {
    const pos = enabled.findIndex((x) => x.i === i)
    let next: (typeof enabled)[number] | undefined
    // In right-to-left layouts the visual order is mirrored, so Left moves forward.
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl"
    const forward = e.key === "ArrowDown" || e.key === (rtl ? "ArrowLeft" : "ArrowRight")
    const back = e.key === "ArrowUp" || e.key === (rtl ? "ArrowRight" : "ArrowLeft")
    if (forward) next = enabled[(pos + 1) % enabled.length]
    else if (back) next = enabled[(pos - 1 + enabled.length) % enabled.length]
    else if (e.key === "Home") next = enabled[0]
    else if (e.key === "End") next = enabled[enabled.length - 1]
    if (!next) return
    e.preventDefault()
    setCurrent(next.o.value)
    refs.current[next.i]?.focus()
  }

  const spring = reduce ? { duration: 0 } : springs.snap

  return (
    <div
      role="radiogroup"
      aria-disabled={disabled || undefined}
      data-slot="segmented-control"
      className={cn(
        "relative isolate inline-flex max-w-full items-stretch bg-muted shadow-[var(--pc-well)] select-none",
        s.root,
        fullWidth && "flex w-full",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
      onPointerUp={() => setPressed(null)}
      onPointerLeave={() => setPressed(null)}
      {...props}
    >
      <GooduiTokens />
      {options.map((o, i) => {
        const selected = i === selectedIndex
        const Icon = o.icon
        // Hairline dividers between unselected neighbours, hidden next to the thumb like iOS.
        const showDivider = i > 0 && i !== selectedIndex && i - 1 !== selectedIndex
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={o.ariaLabel}
            tabIndex={selected || (selectedIndex === -1 && i === enabled[0]?.i) ? 0 : -1}
            disabled={o.disabled || disabled}
            onClick={() => setCurrent(o.value)}
            onKeyDown={(e) => move(e, i)}
            onPointerDown={() => setPressed(o.value)}
            className={cn(
              "pc-press pc-press-soft relative inline-flex min-w-0 cursor-pointer items-center justify-center font-medium whitespace-nowrap text-foreground/65 transition-colors outline-none hover:text-foreground focus-visible:z-20 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40 aria-checked:text-foreground",
              s.item,
              fullWidth && "flex-1",
            )}
            style={{ borderRadius: s.radius }}
          >
            <span
              aria-hidden="true"
              className={cn("absolute top-1/4 bottom-1/4 start-0 w-px bg-foreground/15 transition-opacity duration-200", showDivider ? "opacity-100" : "opacity-0")}
            />
            {selected && (
              <motion.span
                layoutId={`${uid}-thumb`}
                aria-hidden="true"
                className="absolute inset-0 -z-10 bg-background shadow-[var(--pc-e1)] dark:bg-input"
                style={{ borderRadius: s.radius }}
                initial={false}
                animate={{ scale: pressed === o.value && !reduce ? 0.95 : 1 }}
                transition={spring}
              />
            )}
            <motion.span
              className="relative inline-flex min-w-0 items-center gap-[inherit]"
              animate={{ scale: pressed === o.value && !selected && !reduce ? 0.96 : 1 }}
              transition={spring}
            >
              {Icon && <Icon className="shrink-0" />}
              {o.label !== undefined && <span className="truncate">{o.label}</span>}
            </motion.span>
          </button>
        )
      })}
    </div>
  )
}

"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { GooduiTokens, spring as springs } from "@/lib/goodui-motion"

const SIZES = {
  sm: { track: "h-5 w-9", thumb: 16, travel: 16, icon: "[&_svg]:size-2.5" },
  md: { track: "h-6 w-11", thumb: 20, travel: 20, icon: "[&_svg]:size-3" },
  lg: { track: "h-8 w-14", thumb: 28, travel: 24, icon: "[&_svg]:size-4" },
} as const

export type SwitchSpringProps = Omit<React.ComponentProps<"button">, "onChange" | "value" | "defaultChecked"> & {
  /** Controlled on/off state; pair with onCheckedChange. */
  checked?: boolean
  /** Initial state when uncontrolled. */
  defaultChecked?: boolean
  /** Called with the new state on every toggle (click, Space or Enter). */
  onCheckedChange?: (checked: boolean) => void
  /** "sm" 20×36px, "md" 24×44px, "lg" 32×56px track. */
  size?: keyof typeof SIZES
  /** Icons drawn inside the thumb, e.g. { on: <Moon />, off: <Sun /> }. */
  icons?: { on: React.ReactNode; off: React.ReactNode }
  /** Clickable label next to the switch; also its accessible name. */
  label?: React.ReactNode
  /** Muted helper text under the label, linked with aria-describedby. */
  description?: React.ReactNode
  /** Put the label before the switch instead of after it. */
  labelPosition?: "start" | "end"
  /** Form field name; a hidden input submits "on" when checked and "off" when not. */
  name?: string
}

/** Switch with a springy thumb that squashes while pressed, optional icons in the thumb, label and description. */
export function SwitchSpring({
  checked: checkedProp,
  defaultChecked = false,
  onCheckedChange,
  size = "md",
  icons,
  label,
  description,
  labelPosition = "end",
  name,
  disabled,
  className,
  id: idProp,
  onClick,
  onPointerDown,
  onKeyDown,
  onKeyUp,
  ref,
  ...props
}: SwitchSpringProps) {
  const reduce = useReducedMotion() ?? false
  const [inner, setInner] = React.useState(defaultChecked)
  const checked = checkedProp ?? inner
  const [pressed, setPressed] = React.useState(false)
  const uid = React.useId()
  const id = idProp ?? uid
  const s = SIZES[size]
  const btnRef = React.useRef<HTMLButtonElement | null>(null)
  // In a right-to-left context the thumb starts on the right, so it travels the other way.
  const [rtl, setRtl] = React.useState(false)
  React.useLayoutEffect(() => {
    if (btnRef.current) setRtl(getComputedStyle(btnRef.current).direction === "rtl")
  }, [])
  const setRefs = (el: HTMLButtonElement | null) => {
    btnRef.current = el
    if (typeof ref === "function") ref(el)
    else if (ref) (ref as React.RefObject<HTMLButtonElement | null>).current = el
  }

  React.useEffect(() => {
    if (!pressed) return
    const up = () => setPressed(false)
    window.addEventListener("pointerup", up)
    window.addEventListener("pointercancel", up)
    return () => {
      window.removeEventListener("pointerup", up)
      window.removeEventListener("pointercancel", up)
    }
  }, [pressed])

  const toggle = () => {
    const next = !checked
    if (checkedProp === undefined) setInner(next)
    onCheckedChange?.(next)
  }

  const spring = reduce ? { duration: 0 } : springs.snap

  const control = (
    <button
      ref={setRefs}
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-describedby={description ? `${id}-desc` : undefined}
      data-state={checked ? "checked" : "unchecked"}
      disabled={disabled}
      onClick={(e) => {
        toggle()
        onClick?.(e)
      }}
      onPointerDown={(e) => {
        if (e.button === 0) setPressed(true)
        onPointerDown?.(e)
      }}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") setPressed(true)
        onKeyDown?.(e)
      }}
      onKeyUp={(e) => {
        setPressed(false)
        onKeyUp?.(e)
      }}
      onBlur={() => setPressed(false)}
      className={cn(
        "pc-press relative inline-flex shrink-0 cursor-pointer items-center rounded-full p-0.5 shadow-[inset_0_1px_2px_hsl(var(--pc-sh)/.18),inset_0_0_0_.5px_hsl(var(--pc-sh)/.06)] transition-colors duration-200 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
        "bg-input data-[state=checked]:bg-primary data-[state=checked]:bg-[image:var(--pc-sheen)] dark:data-[state=unchecked]:bg-input/80",
        s.track,
        className,
      )}
      {...props}
    >
      <motion.span
        aria-hidden="true"
        className={cn(
          "pointer-events-none relative grid place-items-center rounded-full bg-white shadow-[0_0_0_.5px_rgb(0_0_0/.06),0_1px_2px_hsl(var(--pc-sh)/.2),0_3px_6px_-1px_hsl(var(--pc-sh)/.22)]",
          s.icon,
        )}
        style={{ width: s.thumb, height: s.thumb, originX: checked !== rtl ? 1 : 0 }}
        initial={false}
        animate={{
          x: checked ? (rtl ? -s.travel : s.travel) : 0,
          scaleX: pressed && !reduce ? 1.18 : 1,
          scaleY: pressed && !reduce ? 0.93 : 1,
        }}
        transition={spring}
      >
        {icons && (
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              key={checked ? "on" : "off"}
              className={cn("grid place-items-center", checked ? "text-primary dark:text-neutral-900" : "text-neutral-500")}
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.3, rotate: checked ? -120 : 120 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.3, rotate: checked ? 120 : -120 }}
              transition={reduce ? { duration: 0.1 } : springs.ui}
            >
              {checked ? icons.on : icons.off}
            </motion.span>
          </AnimatePresence>
        )}
      </motion.span>
    </button>
  )

  const hidden = name ? <input type="hidden" name={name} value={checked ? "on" : "off"} /> : null

  if (!label && !description) {
    return (
      <>
        <GooduiTokens />
        {control}
        {hidden}
      </>
    )
  }

  return (
    <div className={cn("flex items-start gap-3", labelPosition === "start" && "flex-row-reverse justify-between")}>
      <GooduiTokens />
      {control}
      {/* Disabled text is muted rather than faded with opacity, so it keeps 4.5:1 contrast. */}
      <div className="grid gap-0.5">
        {label && (
          <label htmlFor={id} className={cn("text-sm leading-6 font-medium select-none", disabled ? "cursor-not-allowed text-muted-foreground" : "cursor-pointer")}>
            {label}
          </label>
        )}
        {description && (
          <p id={`${id}-desc`} className="text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {hidden}
    </div>
  )
}

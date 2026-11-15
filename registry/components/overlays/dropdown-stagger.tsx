"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion, type Variants } from "motion/react"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { GooduiTokens, ease, spring } from "@/lib/goodui-motion"

function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (v: T) => void) {
  const [inner, setInner] = React.useState(defaultValue)
  const controlled = value !== undefined
  const current = controlled ? value : inner
  const set = React.useCallback(
    (v: T) => {
      if (!controlled) setInner(v)
      onChange?.(v)
    },
    [controlled, onChange],
  )
  return [current, set] as const
}

type RootContextValue = { close: (returnFocus?: boolean) => void; reduce: boolean; rtl: boolean; stagger: boolean; instant: boolean }
type MenuContextValue = {
  menuId: string
  highlighted: string | null
  setHighlighted: (id: string | null) => void
  openSub: string | null
  subFocusFirst: boolean
  openSubMenu: (id: string, focusFirst: boolean) => void
  closeSub: (id?: string) => void
  scheduleCloseSub: () => void
  cancelCloseSub: () => void
}
type RadioContextValue = {
  /** Value of the selected radio item. */
  value: string
  /** Called with the chosen item's value. */
  onValueChange: (value: string) => void
}

const RootContext = React.createContext<RootContextValue | null>(null)
const MenuContext = React.createContext<MenuContextValue | null>(null)
const RadioContext = React.createContext<RadioContextValue | null>(null)

function useRoot() {
  const ctx = React.useContext(RootContext)
  if (!ctx) throw new Error("DropdownStagger parts must be used inside <DropdownStagger>")
  return ctx
}
function useMenu() {
  return React.useContext(MenuContext)!
}

const panelVariants = (reduce: boolean, sub: boolean, rtl = false, stagger = false): Variants =>
  reduce
    ? { closed: { opacity: 0 }, open: { opacity: 1, transition: { duration: 0 } }, exit: { opacity: 0, transition: { duration: 0 } } }
    : {
        closed: { opacity: 0, scale: 0.96, y: sub ? 0 : -4, x: sub ? (rtl ? 4 : -4) : 0 },
        open: {
          opacity: 1,
          scale: 1,
          y: 0,
          x: 0,
          transition: { duration: 0.15, ease: ease.out, ...(stagger ? { staggerChildren: 0.028, delayChildren: 0.03 } : {}) },
        },
        exit: { opacity: 0, scale: 0.98, transition: { duration: 0.1, ease: ease.out } },
      }

const itemVariants = (reduce: boolean, rtl = false): Variants =>
  reduce
    ? { closed: { opacity: 0 }, open: { opacity: 1, transition: { duration: 0 } } }
    : { closed: { opacity: 0, x: rtl ? 8 : -8 }, open: { opacity: 1, x: 0, transition: spring.ui } }

const ITEM =
  "relative flex w-full cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-start text-sm outline-none select-none aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0"

type MenuPanelProps = {
  id?: string
  menuId: string
  labelledBy: string
  sub?: boolean
  focusOnMount: "first" | "last" | "panel" | null
  onEscape: () => void
  className?: string
  children: React.ReactNode
}

function MenuPanel({ id, menuId, labelledBy, sub = false, focusOnMount, onEscape, className, children }: MenuPanelProps) {
  const { close, reduce, rtl, stagger, instant } = useRoot()
  const ref = React.useRef<HTMLDivElement>(null)
  const [highlighted, setHighlighted] = React.useState<string | null>(null)
  const [openSub, setOpenSub] = React.useState<string | null>(null)
  const [subFocusFirst, setSubFocusFirst] = React.useState(false)
  const subTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const typeahead = React.useRef({ text: "", at: 0 })

  const items = React.useCallback(
    () =>
      Array.from(ref.current?.querySelectorAll<HTMLElement>(`[data-pc-item="${menuId}"]`) ?? []).filter(
        (el) => el.getAttribute("aria-disabled") !== "true",
      ),
    [menuId],
  )

  React.useLayoutEffect(() => {
    if (focusOnMount === "panel") ref.current?.focus({ preventScroll: true })
    else if (focusOnMount) {
      const list = items()
      ;(focusOnMount === "first" ? list[0] : list[list.length - 1])?.focus({ preventScroll: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => () => void (subTimer.current && clearTimeout(subTimer.current)), [])

  const menu = React.useMemo<MenuContextValue>(
    () => ({
      menuId,
      highlighted,
      setHighlighted,
      openSub,
      subFocusFirst,
      openSubMenu: (id, focusFirst) => {
        if (subTimer.current) clearTimeout(subTimer.current)
        setSubFocusFirst(focusFirst)
        setOpenSub(id)
      },
      closeSub: (id) => setOpenSub((cur) => (id === undefined || cur === id ? null : cur)),
      scheduleCloseSub: () => {
        if (subTimer.current) clearTimeout(subTimer.current)
        subTimer.current = setTimeout(() => setOpenSub(null), 160)
      },
      cancelCloseSub: () => {
        if (subTimer.current) clearTimeout(subTimer.current)
      },
    }),
    [menuId, highlighted, openSub, subFocusFirst],
  )

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('[role="menu"]') !== ref.current) return
    const list = items()
    const idx = list.indexOf(document.activeElement as HTMLElement)
    const focus = (i: number) => list[(i + list.length) % list.length]?.focus({ preventScroll: true })
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        return focus(idx + 1)
      case "ArrowUp":
        e.preventDefault()
        return focus(idx < 0 ? -1 : idx - 1)
      case "Home":
        e.preventDefault()
        return focus(0)
      case "End":
        e.preventDefault()
        return focus(-1)
      case "Escape":
        e.preventDefault()
        e.stopPropagation()
        return onEscape()
      case rtl ? "ArrowRight" : "ArrowLeft":
        if (sub) {
          e.preventDefault()
          onEscape()
        }
        return
      case "Tab":
        e.preventDefault()
        return close(true)
    }
    if (e.key.length === 1 && /\S/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const t = typeahead.current
      t.text = e.timeStamp - t.at > 600 ? e.key.toLowerCase() : t.text + e.key.toLowerCase()
      t.at = e.timeStamp
      const ordered = [...list.slice(idx + 1), ...list.slice(0, idx + 1)]
      ordered.find((el) => el.textContent?.trim().toLowerCase().startsWith(t.text))?.focus({ preventScroll: true })
    }
  }

  return (
    <MenuContext.Provider value={menu}>
      <motion.div
        ref={ref}
        id={id}
        role="menu"
        aria-labelledby={labelledBy}
        aria-orientation="vertical"
        tabIndex={-1}
        variants={panelVariants(reduce || instant, sub, rtl, stagger)}
        initial="closed"
        animate="open"
        exit="exit"
        onKeyDown={onKeyDown}
        onPointerLeave={() => {
          if (!openSub) setHighlighted(null)
        }}
        className={cn(
          "absolute z-50 flex min-w-52 flex-col rounded-xl bg-popover p-1 text-popover-foreground shadow-[var(--pc-e2)] outline-none",
          className,
        )}
      >
        {children}
      </motion.div>
    </MenuContext.Provider>
  )
}

function Highlight({ active, destructive }: { active: boolean; destructive?: boolean }) {
  const { reduce } = useRoot()
  const { menuId } = useMenu()
  if (!active) return null
  return (
    <motion.span
      aria-hidden="true"
      layoutId={`${menuId}-highlight`}
      className={cn("absolute inset-0 rounded-md", destructive ? "bg-destructive/10 dark:bg-destructive/20" : "bg-muted")}
      style={{ borderRadius: 6 }}
      transition={reduce ? { duration: 0 } : spring.snap}
    />
  )
}

export type DropdownStaggerProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** Content of the trigger button. */
  trigger: React.ReactNode
  /** Accessible name when the trigger is icon-only. Rendered as sr-only text after the trigger content, so any visible text stays the start of the name. */
  triggerLabel?: string
  /** Classes for the trigger button. */
  triggerClassName?: string
  /** Classes for the menu panel. */
  contentClassName?: string
  /** Which edge of the trigger the menu lines up with (logical: start is the left edge in LTR, the right edge in RTL). It does not flip near the viewport edge. */
  align?: "start" | "end"
  /** Controlled open state. Pair with onOpenChange. */
  open?: boolean
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean
  /** Called with the next state on trigger use, item selection, Esc, Tab or an outside click. */
  onOpenChange?: (open: boolean) => void
  /** Cascade the items in. Off by default: menus are frequent, so they stay quiet. Keep it for rare, showcase menus. */
  stagger?: boolean
  /** Items, labels, separators, radio groups and submenus. */
  children: React.ReactNode
}

/**
 * Dropdown menu whose panel springs open while its items stagger in. Arrow keys, Home/End, typeahead,
 * submenus (hover or ArrowRight), checkbox and radio items, and a highlight that glides between items.
 */
export function DropdownStagger({
  trigger,
  triggerLabel,
  triggerClassName,
  contentClassName,
  align = "start",
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  stagger = false,
  className,
  children,
  ...props
}: DropdownStaggerProps) {
  const reduce = useReducedMotion() ?? false
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange)
  const uid = React.useId()
  const rootRef = React.useRef<HTMLDivElement>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const [focusMode, setFocusMode] = React.useState<"first" | "last" | "panel">("panel")
  // Right-to-left mirrors submenu keys, placement and the slide-in direction; read after mount so SSR output is unchanged.
  const [rtl, setRtl] = React.useState(false)
  React.useEffect(() => {
    if (triggerRef.current) setRtl(getComputedStyle(triggerRef.current).direction === "rtl")
  }, [])

  const close = React.useCallback(
    (returnFocus = true) => {
      setOpen(false)
      if (returnFocus) triggerRef.current?.focus({ preventScroll: true })
    },
    [setOpen],
  )

  React.useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close(false)
    }
    document.addEventListener("pointerdown", onDown)
    return () => document.removeEventListener("pointerdown", onDown)
  }, [open, close])

  const instant = focusMode !== "panel"
  const root = React.useMemo(() => ({ close, reduce, rtl, stagger, instant }), [close, reduce, rtl, stagger, instant])

  return (
    <RootContext.Provider value={root}>
      <GooduiTokens />
      <div ref={rootRef} className={cn("relative inline-block", className)} {...props}>
        <button
          ref={triggerRef}
          id={`${uid}-trigger`}
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? `${uid}-menu` : undefined}
          onClick={() => {
            setFocusMode("panel")
            setOpen(!open)
          }}
          onKeyDown={(e) => {
            if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
              e.preventDefault()
              setFocusMode(e.key === "ArrowUp" ? "last" : "first")
              setOpen(true)
            }
          }}
          className={cn(
            "pc-press inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-background px-3 text-sm font-medium shadow-[var(--pc-e1)] transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 aria-expanded:bg-muted [&_svg]:size-4 [&_svg]:shrink-0",
            triggerClassName,
          )}
        >
          {trigger}
          {triggerLabel && <span className="sr-only">{triggerLabel}</span>}
        </button>
        <AnimatePresence>
          {open && (
            <MenuPanel
              key="menu"
              id={`${uid}-menu`}
              menuId={`${uid}-root`}
              labelledBy={`${uid}-trigger`}
              focusOnMount={focusMode}
              onEscape={() => close(true)}
              className={cn("top-full mt-1.5", align === "start" ? "start-0 origin-top-left rtl:origin-top-right" : "end-0 origin-top-right rtl:origin-top-left", contentClassName)}
            >
              {children}
            </MenuPanel>
          )}
        </AnimatePresence>
      </div>
    </RootContext.Provider>
  )
}

export type DropdownStaggerItemProps = {
  /** Leading icon, tinted muted unless the item is destructive. */
  icon?: React.ReactNode
  /** Hint shown on the right, e.g. "⌘E". It is display text only; it does not bind the shortcut. */
  shortcut?: string
  /** "destructive" colors the text and highlight with the destructive token. */
  variant?: "default" | "destructive"
  /** Grays the item out; arrow keys and typeahead skip it and clicks do nothing. */
  disabled?: boolean
  /** Call event.preventDefault() to keep the menu open. */
  onSelect?: (event: React.MouseEvent<HTMLButtonElement>) => void
  /** Close the menu and return focus to the trigger after selecting. Defaults to true for items, false for checkbox and radio items. */
  closeOnSelect?: boolean
  className?: string
  children: React.ReactNode
}

export function DropdownStaggerItem({
  icon,
  shortcut,
  variant = "default",
  disabled,
  onSelect,
  closeOnSelect = true,
  className,
  children,
}: DropdownStaggerItemProps) {
  const id = React.useId()
  const root = useRoot()
  const menu = useMenu()
  const destructive = variant === "destructive"
  return (
    <motion.button
      type="button"
      role="menuitem"
      tabIndex={-1}
      data-pc-item={menu.menuId}
      aria-disabled={disabled || undefined}
      variants={itemVariants(root.reduce || !root.stagger, root.rtl)}
      onFocus={() => menu.setHighlighted(id)}
      onPointerEnter={menu.scheduleCloseSub}
      onPointerMove={(e) => {
        if (!disabled && document.activeElement !== e.currentTarget) e.currentTarget.focus({ preventScroll: true })
      }}
      onClick={(e) => {
        if (disabled) return
        onSelect?.(e)
        if (closeOnSelect && !e.defaultPrevented) root.close(true)
      }}
      // Destructive text is darkened in light mode so it keeps 4.5:1 on the red highlight.
      className={cn("pc-press", ITEM, destructive && "text-[color-mix(in_oklab,var(--destructive),black_18%)] dark:text-destructive", className)}
    >
      <Highlight active={menu.highlighted === id} destructive={destructive} />
      <span className={cn("relative flex min-w-0 flex-1 items-center gap-2", !destructive && "[&_svg]:text-muted-foreground")}>
        {icon}
        <span className="truncate">{children}</span>
      </span>
      {shortcut && <span className="relative ms-auto ps-4 text-xs tracking-widest text-foreground/60">{shortcut}</span>}
    </motion.button>
  )
}

export type DropdownStaggerCheckboxItemProps = Omit<DropdownStaggerItemProps, "variant" | "icon"> & {
  /** Whether the check is drawn. The item is always controlled. */
  checked: boolean
  /** Called with the toggled value on click, Enter or Space. */
  onCheckedChange: (checked: boolean) => void
}

/** Toggle item with a check that draws itself. Stays open by default so several can be toggled. */
export function DropdownStaggerCheckboxItem({
  checked,
  onCheckedChange,
  shortcut,
  disabled,
  onSelect,
  closeOnSelect = false,
  className,
  children,
}: DropdownStaggerCheckboxItemProps) {
  const id = React.useId()
  const root = useRoot()
  const menu = useMenu()
  return (
    <motion.button
      type="button"
      role="menuitemcheckbox"
      aria-checked={checked}
      tabIndex={-1}
      data-pc-item={menu.menuId}
      aria-disabled={disabled || undefined}
      variants={itemVariants(root.reduce || !root.stagger, root.rtl)}
      onFocus={() => menu.setHighlighted(id)}
      onPointerEnter={menu.scheduleCloseSub}
      onPointerMove={(e) => {
        if (!disabled && document.activeElement !== e.currentTarget) e.currentTarget.focus({ preventScroll: true })
      }}
      onClick={(e) => {
        if (disabled) return
        onSelect?.(e)
        onCheckedChange(!checked)
        if (closeOnSelect && !e.defaultPrevented) root.close(true)
      }}
      className={cn("pc-press", ITEM, className)}
    >
      <Highlight active={menu.highlighted === id} />
      <span className="relative grid size-4 place-items-center">
        <svg viewBox="0 0 16 16" fill="none" className="size-4" aria-hidden="true">
          <motion.path
            d="M3.5 8.5l3 3 6-7"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={false}
            animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
            transition={root.reduce ? { duration: 0 } : { pathLength: spring.ui, opacity: { duration: 0.1 } }}
          />
        </svg>
      </span>
      <span className="relative min-w-0 flex-1 truncate">{children}</span>
      {shortcut && <span className="relative ms-auto ps-4 text-xs tracking-widest text-foreground/60">{shortcut}</span>}
    </motion.button>
  )
}

export type DropdownStaggerRadioGroupProps = RadioContextValue & {
  /** Accessible name of the group. Without it, a DropdownStaggerLabel right before (or inside) the group names it. */
  label?: string
  /** Id of an element that names the group; overrides the automatic DropdownStaggerLabel link. */
  "aria-labelledby"?: string
  children: React.ReactNode
}

export function DropdownStaggerRadioGroup({ value, onValueChange, label, "aria-labelledby": labelledByProp, children }: DropdownStaggerRadioGroupProps) {
  const ctx = React.useMemo(() => ({ value, onValueChange }), [value, onValueChange])
  const ref = React.useRef<HTMLDivElement>(null)
  const [labelId, setLabelId] = React.useState<string | undefined>(undefined)
  // Find the DropdownStaggerLabel that heads this group: the first one inside it, else the element right before it.
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el || label || labelledByProp) return
    const inner = el.querySelector<HTMLElement>(":scope > [data-pc-menu-label]")
    const prev = el.previousElementSibling
    const found = inner ?? (prev instanceof HTMLElement && prev.hasAttribute("data-pc-menu-label") ? prev : null)
    setLabelId(found?.id || undefined)
  }, [label, labelledByProp])
  return (
    <RadioContext.Provider value={ctx}>
      <div ref={ref} role="group" aria-label={label} aria-labelledby={label ? undefined : (labelledByProp ?? labelId)} className="contents">
        {children}
      </div>
    </RadioContext.Provider>
  )
}

export type DropdownStaggerRadioItemProps = Omit<DropdownStaggerItemProps, "variant" | "icon"> & {
  /** Value reported to the surrounding DropdownStaggerRadioGroup; checked when it equals the group's value. */
  value: string
}

export function DropdownStaggerRadioItem({
  value,
  shortcut,
  disabled,
  onSelect,
  closeOnSelect = false,
  className,
  children,
}: DropdownStaggerRadioItemProps) {
  const id = React.useId()
  const root = useRoot()
  const menu = useMenu()
  const group = React.useContext(RadioContext)
  const checked = group?.value === value
  return (
    <motion.button
      type="button"
      role="menuitemradio"
      aria-checked={checked}
      tabIndex={-1}
      data-pc-item={menu.menuId}
      aria-disabled={disabled || undefined}
      variants={itemVariants(root.reduce || !root.stagger, root.rtl)}
      onFocus={() => menu.setHighlighted(id)}
      onPointerEnter={menu.scheduleCloseSub}
      onPointerMove={(e) => {
        if (!disabled && document.activeElement !== e.currentTarget) e.currentTarget.focus({ preventScroll: true })
      }}
      onClick={(e) => {
        if (disabled) return
        onSelect?.(e)
        group?.onValueChange(value)
        if (closeOnSelect && !e.defaultPrevented) root.close(true)
      }}
      className={cn("pc-press", ITEM, className)}
    >
      <Highlight active={menu.highlighted === id} />
      <span className="relative grid size-4 place-items-center">
        <motion.span
          className="size-2 rounded-full bg-current"
          initial={false}
          animate={{ scale: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
          transition={root.reduce ? { duration: 0 } : spring.play}
        />
      </span>
      <span className="relative min-w-0 flex-1 truncate">{children}</span>
      {shortcut && <span className="relative ms-auto ps-4 text-xs tracking-widest text-foreground/60">{shortcut}</span>}
    </motion.button>
  )
}

export type DropdownStaggerSubProps = {
  /** Text of the item that opens the submenu; it also names the submenu. */
  label: React.ReactNode
  /** Leading icon for the submenu item. */
  icon?: React.ReactNode
  /** Grays the item out; the submenu cannot open. */
  disabled?: boolean
  className?: string
  children: React.ReactNode
}

/** Item that opens a nested menu on hover, click, Enter or ArrowRight. It flips left or below near the edge. */
export function DropdownStaggerSub({ label, icon, disabled, className, children }: DropdownStaggerSubProps) {
  const id = React.useId()
  const subId = React.useId()
  const root = useRoot()
  const menu = useMenu()
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const hoverTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const [placement, setPlacement] = React.useState<"right" | "left" | "below">(root.rtl ? "left" : "right")
  const open = menu.openSub === id

  React.useEffect(() => () => void (hoverTimer.current && clearTimeout(hoverTimer.current)), [])

  const show = (focusFirst: boolean) => {
    if (disabled) return
    const r = triggerRef.current?.getBoundingClientRect()
    if (r) {
      const w = 208
      const vw = window.innerWidth
      const fitsRight = r.right + w + 8 <= vw - 4
      const fitsLeft = r.left - w - 8 >= 4
      // Open toward the inline end first: right in LTR, left in RTL.
      if (root.rtl) setPlacement(fitsLeft ? "left" : fitsRight ? "right" : "below")
      else setPlacement(fitsRight ? "right" : fitsLeft ? "left" : "below")
    }
    menu.openSubMenu(id, focusFirst)
  }

  return (
    <div
      className="relative"
      onPointerEnter={menu.cancelCloseSub}
      onPointerLeave={() => {
        if (hoverTimer.current) clearTimeout(hoverTimer.current)
        if (open) menu.scheduleCloseSub()
      }}
    >
      <motion.button
        ref={triggerRef}
        id={`${subId}-trigger`}
        type="button"
        role="menuitem"
        tabIndex={-1}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-disabled={disabled || undefined}
        data-pc-item={menu.menuId}
        variants={itemVariants(root.reduce || !root.stagger, root.rtl)}
        onFocus={() => menu.setHighlighted(id)}
        onPointerEnter={() => {
          menu.cancelCloseSub()
          if (hoverTimer.current) clearTimeout(hoverTimer.current)
          hoverTimer.current = setTimeout(() => show(false), 90)
        }}
        onPointerMove={(e) => {
          if (!disabled && document.activeElement !== e.currentTarget) e.currentTarget.focus({ preventScroll: true })
        }}
        onClick={() => show(true)}
        onKeyDown={(e) => {
          if (e.key === (root.rtl ? "ArrowLeft" : "ArrowRight") || e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            e.stopPropagation()
            show(true)
          }
        }}
        className={cn("pc-press", ITEM, open && menu.highlighted !== id && "bg-muted/60", className)}
      >
        <Highlight active={menu.highlighted === id} />
        <span className="relative flex min-w-0 flex-1 items-center gap-2 [&_svg]:text-muted-foreground">
          {icon}
          <span className="truncate">{label}</span>
        </span>
        <ChevronRight className="relative ms-auto text-muted-foreground rtl:rotate-180" />
      </motion.button>
      <AnimatePresence>
        {open && (
          <MenuPanel
            key="sub"
            sub
            menuId={subId}
            labelledBy={`${subId}-trigger`}
            focusOnMount={menu.subFocusFirst ? "first" : null}
            onEscape={() => {
              menu.closeSub(id)
              triggerRef.current?.focus({ preventScroll: true })
            }}
            className={cn(
              "w-52 min-w-0",
              placement === "right" && "top-[-5px] left-full ml-1.5 origin-top-left",
              placement === "left" && "top-[-5px] right-full mr-1.5 origin-top-right",
              placement === "below" && "top-full start-6 mt-1 origin-top-left rtl:origin-top-right",
            )}
          >
            {children}
          </MenuPanel>
        )}
      </AnimatePresence>
    </div>
  )
}

export function DropdownStaggerLabel({ id, className, children }: { id?: string; className?: string; children: React.ReactNode }) {
  const root = useRoot()
  const autoId = React.useId()
  return (
    <motion.div id={id ?? autoId} data-pc-menu-label="" variants={itemVariants(root.reduce || !root.stagger, root.rtl)} className={cn("px-2 pt-1.5 pb-1 text-xs font-medium text-muted-foreground", className)}>
      {children}
    </motion.div>
  )
}

export function DropdownStaggerSeparator({ className }: { className?: string }) {
  const root = useRoot()
  return <motion.div role="separator" variants={itemVariants(root.reduce || !root.stagger, root.rtl)} className={cn("-mx-1 my-1 h-px bg-border", className)} />
}

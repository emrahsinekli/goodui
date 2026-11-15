"use client"

import * as React from "react"
import { AnimatePresence, motion, useAnimate, useReducedMotion } from "motion/react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import { GooduiTokens, spring } from "@/lib/goodui-motion"

const SHAKE = { x: [0, -6, 6, -4, 4, -2, 0] }

export type TagInputLabels = {
  remove: (tag: string) => string
  duplicate: (tag: string) => string
  limit: (max: number) => string
  added: (tag: string) => string
  addedMany: (count: number) => string
  removed: (tag: string) => string
  /** Accessible name of the text input when no aria-label is passed. */
  input: string
}
const DEFAULT_LABELS: TagInputLabels = {
  remove: (tag) => `Remove ${tag}`,
  duplicate: (tag) => `“${tag}” is already added`,
  limit: (max) => `You can add up to ${max}`,
  added: (tag) => `Added ${tag}`,
  addedMany: (count) => `Added ${count} tags`,
  removed: (tag) => `Removed ${tag}`,
  input: "Add tags",
}

export type TagInputProps = Omit<React.ComponentProps<"div">, "onChange" | "defaultValue"> & {
  /** Controlled list of tags. Pair with `onValueChange`. */
  value?: string[]
  /** Initial tags when uncontrolled. */
  defaultValue?: string[]
  /** Called with the full new list whenever a tag is added or removed. */
  onValueChange?: (tags: string[]) => void
  /** Offered in a dropdown while typing. Already-added tags are hidden. */
  suggestions?: string[]
  /** Maximum number of tags; shows an "n/max" counter and makes the input read-only when full. */
  maxTags?: number
  /** Shown only while there are no tags. */
  placeholder?: string
  /** Return `true` to accept, or an error message to reject the tag. */
  validate?: (tag: string) => true | string
  /** Treat "Design" and "design" as different tags. */
  caseSensitive?: boolean
  /** Form field name; tags are submitted comma-separated in a hidden input. */
  name?: string
  disabled?: boolean
  /** id of the text input, for an external `<label htmlFor>`. */
  inputId?: string
  /** Optional visual for each chip (an icon, an avatar…). */
  renderTag?: (tag: string) => React.ReactNode
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<TagInputLabels>
}

type ChipProps = {
  tag: string
  removeLabel: string
  armed: boolean
  shakeNonce: number
  disabled?: boolean
  reduce: boolean
  onRemove: () => void
  children?: React.ReactNode
  /** Forwarded so AnimatePresence "popLayout" can measure the leaving chip. */
  ref?: React.Ref<HTMLSpanElement>
}

function Chip({ tag, removeLabel, armed, shakeNonce, disabled, reduce, onRemove, children, ref }: ChipProps) {
  const [scope, animate] = useAnimate<HTMLSpanElement>()
  React.useEffect(() => {
    if (!shakeNonce || !scope.current) return
    if (reduce) return
    animate(scope.current, SHAKE, { duration: 0.4, ease: "easeInOut" })
  }, [shakeNonce, animate, scope, reduce])

  return (
    <motion.span
      ref={ref}
      layout={!reduce}
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6, filter: "blur(4px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={reduce ? { opacity: 0, transition: { duration: 0.1 } } : { opacity: 0, scale: 0.6, filter: "blur(4px)", transition: { duration: 0.15 } }}
      transition={reduce ? { duration: 0.12 } : spring.ui}
      className="inline-flex"
    >
      <span
        ref={scope}
        data-armed={armed || undefined}
        data-shake={shakeNonce > 0 || undefined}
        className={cn(
          "inline-flex h-7 max-w-[16rem] items-center gap-1 rounded-md border bg-muted/70 ps-2 pe-1 text-sm font-medium text-foreground transition-colors",
          "data-armed:border-primary data-armed:bg-primary/10 data-armed:ring-2 data-armed:ring-primary/30",
        )}
      >
        {children}
        <span className="truncate">{tag}</span>
        <button
          type="button"
          disabled={disabled}
          aria-label={removeLabel}
          onClick={onRemove}
          className="pc-press grid size-5 place-items-center rounded-sm text-muted-foreground transition-colors outline-none hover:bg-foreground/10 hover:text-foreground focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none"
        >
          <X className="size-3.5" />
        </button>
      </span>
    </motion.span>
  )
}

/** Chips input: Enter or comma adds, Backspace removes, paste splits, duplicates shake, suggestions dropdown. */
export function TagInput({
  value,
  defaultValue,
  onValueChange,
  suggestions = [],
  maxTags,
  placeholder = "Add a tag…",
  validate,
  caseSensitive = false,
  name,
  disabled,
  inputId,
  renderTag,
  labels,
  className,
  "aria-label": ariaLabel,
  ...props
}: TagInputProps) {
  const l = useLabels("tag-input", DEFAULT_LABELS, labels)
  const reduce = useReducedMotion() ?? false
  const [inner, setInner] = React.useState<string[]>(defaultValue ?? [])
  const tags = value ?? inner
  const [text, setText] = React.useState("")
  const [open, setOpen] = React.useState(false)
  const [active, setActive] = React.useState(-1)
  const [armed, setArmed] = React.useState(false)
  const [shake, setShake] = React.useState<{ tag: string; n: number } | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [announce, setAnnounce] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [fieldScope, animateField] = useAnimate<HTMLDivElement>()
  const uid = React.useId()
  const listId = `${uid}-list`
  const errorId = `${uid}-error`

  const norm = React.useCallback((t: string) => (caseSensitive ? t : t.toLowerCase()), [caseSensitive])
  const full = maxTags !== undefined && tags.length >= maxTags

  const commit = (next: string[]) => {
    if (value === undefined) setInner(next)
    onValueChange?.(next)
  }

  const shakeField = () => {
    if (!reduce && fieldScope.current) animateField(fieldScope.current, SHAKE, { duration: 0.4 })
  }

  /** Adds the given raw strings, returns how many were added. */
  const add = (raw: string[]) => {
    const next = [...tags]
    let lastError: string | null = null
    for (const r of raw) {
      const t = r.trim()
      if (!t) continue
      const dup = next.find((x) => norm(x) === norm(t))
      if (dup) {
        setShake((s) => ({ tag: dup, n: (s?.n ?? 0) + 1 }))
        lastError = l.duplicate(dup)
        continue
      }
      if (maxTags !== undefined && next.length >= maxTags) {
        lastError = l.limit(maxTags)
        shakeField()
        break
      }
      const ok = validate ? validate(t) : true
      if (ok !== true) {
        lastError = ok
        shakeField()
        continue
      }
      next.push(t)
    }
    const added = next.length - tags.length
    if (added > 0) {
      commit(next)
      setAnnounce(added === 1 ? l.added(next[next.length - 1]!) : l.addedMany(added))
    }
    setError(lastError)
    if (lastError) setAnnounce(lastError)
    return added
  }

  const remove = (tag: string) => {
    commit(tags.filter((t) => t !== tag))
    // Forget a pending shake so the tag doesn't shake on mount if it is added again later.
    setShake((s) => (s && s.tag === tag ? null : s))
    setAnnounce(l.removed(tag))
    setArmed(false)
    setError(null)
    inputRef.current?.focus()
  }

  const filtered = React.useMemo(() => {
    const q = norm(text.trim())
    const taken = new Set(tags.map(norm))
    return suggestions.filter((s) => !taken.has(norm(s)) && (!q || norm(s).includes(q))).slice(0, 6)
  }, [suggestions, tags, text, norm])

  const showList = open && !full && filtered.length > 0 && !disabled

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return
    if (e.key === "Enter" || e.key === ",") {
      const pick = (showList && active >= 0 ? filtered[active] : text) ?? text
      if (!pick.trim()) {
        if (e.key === ",") e.preventDefault()
        return
      }
      e.preventDefault()
      const taken = tags.some((t) => norm(t) === norm(pick.trim()))
      // Keep rejected text so it can be fixed; clear it when it was added or is a duplicate.
      if (add([pick]) > 0 || taken) setText("")
      setActive(-1)
      return
    }
    if (e.key === "Backspace" && text === "" && tags.length > 0) {
      e.preventDefault()
      if (armed) remove(tags[tags.length - 1]!)
      else setArmed(true)
      return
    }
    if (e.key === "ArrowDown" && filtered.length) {
      e.preventDefault()
      setOpen(true)
      setActive((a) => (a + 1) % filtered.length)
      return
    }
    if (e.key === "ArrowUp" && filtered.length) {
      e.preventDefault()
      setOpen(true)
      setActive((a) => (a <= 0 ? filtered.length - 1 : a - 1))
      return
    }
    if (e.key === "Escape") {
      if (showList) {
        e.preventDefault()
        setOpen(false)
        setActive(-1)
      }
      return
    }
    setArmed(false)
  }

  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const data = e.clipboardData.getData("text")
    if (!/[,\n\t;]/.test(data)) return
    e.preventDefault()
    add(data.split(/[,\n\t;]+/))
    setText("")
  }

  return (
    <div className={cn("relative w-full", className)} {...props}>
      <GooduiTokens />
      <div
        ref={fieldScope}
        onClick={() => inputRef.current?.focus()}
        data-invalid={error ? true : undefined}
        data-disabled={disabled || undefined}
        className={cn(
          "flex min-h-10 w-full cursor-text flex-wrap items-center gap-1.5 rounded-lg border border-input bg-background px-1.5 py-1.5 text-sm shadow-xs transition-[border-color,box-shadow] dark:bg-input/30",
          "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
          "data-invalid:border-destructive data-invalid:focus-within:ring-destructive/20",
          "data-disabled:cursor-not-allowed data-disabled:opacity-50",
        )}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {tags.map((tag, i) => (
            <Chip
              key={tag}
              tag={tag}
              removeLabel={l.remove(tag)}
              armed={armed && i === tags.length - 1}
              shakeNonce={shake && shake.tag === tag ? shake.n : 0}
              disabled={disabled}
              reduce={reduce}
              onRemove={() => remove(tag)}
            >
              {renderTag?.(tag)}
            </Chip>
          ))}
        </AnimatePresence>
        <motion.input
          layout={!reduce ? "position" : false}
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-label={ariaLabel ?? l.input}
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          disabled={disabled}
          readOnly={full}
          value={text}
          placeholder={full ? "" : tags.length ? "" : placeholder}
          onChange={(e) => {
            const v = e.target.value
            if (v.includes(",")) {
              const parts = v.split(",")
              add(parts.slice(0, -1))
              setText(parts[parts.length - 1] ?? "")
            } else setText(v)
            setArmed(false)
            setError(null)
            setOpen(true)
            setActive(-1)
          }}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            setOpen(false)
            setArmed(false)
            setActive(-1)
          }}
          className="h-7 min-w-24 flex-1 bg-transparent px-1.5 outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        />
        {maxTags !== undefined && (
          <span
            aria-hidden="true"
            className={cn("ms-auto shrink-0 px-1.5 text-xs tabular-nums text-muted-foreground", full && "text-foreground")}
          >
            {tags.length}/{maxTags}
          </span>
        )}
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            id={errorId}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="mt-1.5 text-xs font-medium text-destructive"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showList && (
          <motion.ul
            id={listId}
            role="listbox"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.12 } }}
            transition={spring.snap}
            className="absolute inset-x-0 top-full z-20 mt-1.5 origin-top overflow-hidden rounded-lg border bg-popover p-1 text-popover-foreground shadow-[var(--pc-e2)]"
          >
            {filtered.map((s, i) => (
              <li
                key={s}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(i)}
                onClick={() => {
                  add([s])
                  setText("")
                  setActive(-1)
                  inputRef.current?.focus()
                }}
                className="relative flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm"
              >
                {i === active && (
                  <motion.span
                    layoutId={`${uid}-hl`}
                    transition={reduce ? { duration: 0 } : spring.snap}
                    className="absolute inset-0 rounded-md bg-muted"
                  />
                )}
                <span className="relative">{renderTag?.(s)}</span>
                <span className="relative truncate">{s}</span>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {name && <input type="hidden" name={name} value={tags.join(",")} />}
      <span className="sr-only" aria-live="polite" role="status">
        {announce}
      </span>
    </div>
  )
}

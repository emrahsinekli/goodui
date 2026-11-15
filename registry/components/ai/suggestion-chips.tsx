"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import { GooduiTokens, spring } from "@/lib/goodui-motion"

/*
 * Prompt suggestions for an empty chat: chips (or cards) that stagger in, lift on hover and hand their prompt
 * to the composer on click. Swapping the list replays the stagger; a selected chip can clear the rest.
 */

export type Suggestion =
  | string
  | {
      label: string
      /** Text sent to the composer; defaults to the label. */
      prompt?: string
      icon?: React.ReactNode
      /** Second line in the card variant. */
      hint?: string
    }

export type SuggestionChipsLabels = { suggestions: string }
const DEFAULT_LABELS: SuggestionChipsLabels = { suggestions: "Suggested prompts" }

export type SuggestionChipsProps = Omit<React.ComponentProps<"div">, "onSelect"> & {
  suggestions: Suggestion[]
  onSelect?: (prompt: string, suggestion: Exclude<Suggestion, string>) => void
  /** chip: pills in a wrapping row. card: icon, label and hint in a grid. scroll: one horizontal row that scrolls. */
  variant?: "chip" | "card" | "scroll"
  /** Seconds between each chip's entrance. */
  stagger?: number
  /** Hide the other chips once one is picked. */
  clearOnSelect?: boolean
  /** Change it to replay the entrance. */
  playKey?: React.Key
  /** Text for screen readers; pass translations here. */
  labels?: Partial<SuggestionChipsLabels>
}

const norm = (s: Suggestion) => (typeof s === "string" ? { label: s } : s)

/** Staggered prompt suggestions that fill the composer. */
export function SuggestionChips({ suggestions, onSelect, variant = "chip", stagger = 0.05, clearOnSelect = false, playKey, labels, className, ...props }: SuggestionChipsProps) {
  const l = useLabels("suggestion-chips", DEFAULT_LABELS, labels)
  const reduce = useReducedMotion() ?? false
  const [picked, setPicked] = React.useState<string | null>(null)
  const items = React.useMemo(() => suggestions.map(norm), [suggestions])
  React.useEffect(() => setPicked(null), [suggestions, playKey])

  const shown = clearOnSelect && picked !== null ? items.filter((s) => s.label === picked) : items
  const card = variant === "card"

  return (
    <div
      role="group"
      aria-label={l.suggestions}
      className={cn(
        "pc-suggestions",
        variant === "chip" && "flex flex-wrap gap-2",
        card && "grid gap-2 sm:grid-cols-2",
        variant === "scroll" && "flex gap-2 overflow-x-auto px-1 py-1 [-ms-overflow-style:none] [scrollbar-width:none] [mask-image:linear-gradient(90deg,transparent,#000_12px,#000_calc(100%-12px),transparent)] [&::-webkit-scrollbar]:hidden",
        className,
      )}
      {...props}
    >
      <GooduiTokens />
      <AnimatePresence initial mode="popLayout">
        {shown.map((s, i) => (
          <motion.button
            key={`${String(playKey ?? "")}-${s.label}`}
            type="button"
            layout
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0, transition: { duration: 0.1 } } : { opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
            transition={reduce ? { duration: 0 } : { ...spring.ui, delay: Math.min(i, 12) * stagger }}
            whileHover={reduce ? undefined : { y: -2 }}
            whileTap={reduce ? undefined : { scale: 0.97 }}
            onClick={() => {
              setPicked(s.label)
              onSelect?.(s.prompt ?? s.label, s)
            }}
            className={cn(
              "group/chip cursor-pointer border bg-card text-start text-card-foreground outline-none transition-[border-color,box-shadow,background-color] hover:border-foreground/30 hover:bg-muted/60 hover:shadow-[var(--pc-e1)] focus-visible:ring-3 focus-visible:ring-ring/50",
              card ? "flex flex-col gap-1.5 rounded-xl p-3" : "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full ps-3 pe-2.5 text-sm whitespace-nowrap",
              picked === s.label && "border-foreground/40 bg-muted",
            )}
          >
            {card ? (
              <>
                <span className="flex items-center gap-2">
                  {s.icon && <span className="grid size-7 place-items-center rounded-lg bg-muted text-muted-foreground [&_svg]:size-4">{s.icon}</span>}
                  <span className="text-sm font-medium">{s.label}</span>
                  <ArrowUpRight className="ms-auto size-4 text-muted-foreground opacity-0 transition-[opacity,transform] group-hover/chip:opacity-100 group-focus-visible/chip:opacity-100 rtl:-scale-x-100" aria-hidden="true" />
                </span>
                {s.hint && <span className="text-xs leading-5 text-muted-foreground">{s.hint}</span>}
              </>
            ) : (
              <>
                {s.icon && <span className="text-muted-foreground [&_svg]:size-4">{s.icon}</span>}
                <span>{s.label}</span>
                <ArrowUpRight className="size-3.5 text-muted-foreground transition-transform group-hover/chip:translate-x-0.5 group-hover/chip:-translate-y-0.5 rtl:-scale-x-100 rtl:group-hover/chip:-translate-x-0.5" aria-hidden="true" />
              </>
            )}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  )
}

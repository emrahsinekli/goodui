"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { ChevronRight, CircleAlert, Wrench } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import { GooduiTokens, spring as springs } from "@/lib/goodui-motion"

/*
 * A tool call made by an agent: name and arguments in the header, a status that goes spinner → drawn check or
 * error, a live duration while running, and a collapsible body with the arguments and the output pane.
 */

const CSS = `
@keyframes pc-tool-spin{to{transform:rotate(360deg)}}
.pc-tool-spin{animation:pc-tool-spin .8s linear infinite}
@keyframes pc-tool-sweep{from{transform:translateX(-100%)}to{transform:translateX(250%)}}
.pc-tool-sweep{animation:pc-tool-sweep 1.4s ease-in-out infinite}
[dir=rtl] .pc-tool-sweep{animation-direction:reverse}
@media (prefers-reduced-motion:reduce){.pc-tool-spin{animation-duration:2s}.pc-tool-sweep{animation:none;display:none}}
`

export type ToolCallStatus = "pending" | "running" | "success" | "error"

export type ToolCallLabels = {
  arguments: string
  output: string
  error: string
  pending: string
  running: string
  success: string
  failed: string
  toggle: string
}
const DEFAULT_LABELS: ToolCallLabels = { arguments: "Arguments", output: "Output", error: "Error", pending: "Waiting", running: "Running", success: "Done", failed: "Failed", toggle: "Toggle details" }

export type ToolCallProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** Tool name, shown in monospace. */
  name: string
  /** Friendlier text shown instead of the name. */
  title?: React.ReactNode
  /** Arguments as an object (rendered as a key/value grid) or a preformatted string. */
  args?: Record<string, unknown> | string
  status?: ToolCallStatus
  /** Result; strings render in a scrollable monospace pane, nodes as-is. */
  output?: React.ReactNode
  /** Error message shown in the body when status is "error". */
  error?: string
  /** Duration in ms. When omitted it is measured from the moment status becomes "running". */
  duration?: number
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Replaces the wrench icon. */
  icon?: React.ReactNode
  /** card: bordered; inline: a quiet row for inside a message. */
  variant?: "card" | "inline"
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<ToolCallLabels>
}

export function formatDuration(ms: number) {
  return ms < 1000 ? `${Math.round(ms)}ms` : ms < 60000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`
}

function preview(args: ToolCallProps["args"]) {
  if (!args) return ""
  if (typeof args === "string") return args
  return Object.entries(args)
    .slice(0, 3)
    .map(([k, v]) => `${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`)
    .join(", ")
}

function StatusIcon({ status, reduce }: { status: ToolCallStatus; reduce: boolean }) {
  const spring = reduce ? { duration: 0 } : springs.play
  return (
    <span className="relative grid size-5 shrink-0 place-items-center">
      <AnimatePresence mode="popLayout" initial={false}>
        {status === "pending" && (
          <motion.span key="pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={spring} className="size-3.5 rounded-full border-2 border-dashed border-muted-foreground/50" />
        )}
        {status === "running" && (
          <motion.svg key="running" viewBox="0 0 24 24" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={spring} className="pc-tool-spin size-4 text-foreground" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".2" strokeWidth="3" />
            <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </motion.svg>
        )}
        {status === "success" && (
          <motion.svg key="success" viewBox="0 0 24 24" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={spring} className="size-5 text-emerald-600 dark:text-emerald-400" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity=".15" />
            <motion.path d="M7.5 12.5l3 3 6-7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: reduce ? 1 : 0 }} animate={{ pathLength: 1 }} transition={reduce ? { duration: 0 } : { duration: 0.3, delay: 0.1, ease: "easeOut" }} />
          </motion.svg>
        )}
        {status === "error" && (
          <motion.span key="error" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={spring} className="grid size-5 place-items-center rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400">
            <svg viewBox="0 0 24 24" className="size-3.5" fill="none" aria-hidden="true">
              <path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
            </svg>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}

/** Collapsible card for an agent's tool call: name, args, live status and duration, output and error panes. */
export function ToolCall({
  name,
  title,
  args,
  status = "pending",
  output,
  error,
  duration,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  icon,
  variant = "card",
  labels,
  className,
  ...props
}: ToolCallProps) {
  const l = useLabels("tool-call", DEFAULT_LABELS, labels)
  const reduce = useReducedMotion() ?? false
  const uid = React.useId()
  const [openInner, setOpenInner] = React.useState(defaultOpen)
  const open = openProp ?? openInner
  const [elapsed, setElapsed] = React.useState(0)
  const started = React.useRef<number | null>(null)

  // Live timer while running; the final value stays once the call settles.
  React.useEffect(() => {
    if (status !== "running") return
    started.current = performance.now()
    setElapsed(0)
    const id = window.setInterval(() => setElapsed(performance.now() - (started.current ?? 0)), 100)
    return () => {
      window.clearInterval(id)
      if (started.current !== null) setElapsed(performance.now() - started.current)
    }
  }, [status])

  const toggle = () => {
    if (openProp === undefined) setOpenInner(!open)
    onOpenChange?.(!open)
  }

  const shownMs = duration ?? (status === "pending" ? undefined : elapsed)
  const statusText = status === "pending" ? l.pending : status === "running" ? l.running : status === "success" ? l.success : l.failed
  const argEntries = args && typeof args === "object" ? Object.entries(args) : []
  const hasBody = argEntries.length > 0 || (typeof args === "string" && args.length > 0) || output !== undefined || (status === "error" && !!error)

  return (
    <div
      data-status={status}
      className={cn("pc-tool text-sm", variant === "card" && "overflow-hidden rounded-xl border bg-card text-card-foreground", className)}
      {...props}
    >
      <GooduiTokens />
      <style href="pc-tool-call" precedence="default">
        {CSS}
      </style>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`${uid}-body`}
        onClick={toggle}
        disabled={!hasBody}
        className={cn(
          "pc-press pc-press-soft relative flex w-full items-center gap-2.5 overflow-hidden text-start outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset disabled:cursor-default",
          variant === "card" ? "px-3 py-2.5 hover:bg-muted/50 disabled:hover:bg-transparent" : "rounded-lg px-2 py-1.5 hover:bg-muted/60 disabled:hover:bg-transparent",
        )}
      >
        <span className="grid size-6 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground [&_svg]:size-3.5">{icon ?? <Wrench aria-hidden="true" />}</span>
        <span className="flex min-w-0 flex-1 items-baseline gap-2">
          <span className={cn("min-w-[8ch] truncate font-medium", !title && "font-mono text-[13px]")}>{title ?? name}</span>
          {args !== undefined && <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">{preview(args)}</span>}
        </span>
        <span className="sr-only">{statusText}</span>
        <AnimatePresence initial={false}>
          {shownMs !== undefined && (
            <motion.span
              key="dur"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={reduce ? { duration: 0 } : { duration: 0.2 }}
              className={cn("shrink-0 overflow-hidden text-xs whitespace-nowrap tabular-nums", status === "error" ? "text-rose-700 dark:text-rose-400" : "text-muted-foreground")}
              aria-hidden="true"
            >
              {formatDuration(shownMs)}
            </motion.span>
          )}
        </AnimatePresence>
        <StatusIcon status={status} reduce={reduce} />
        {hasBody && <ChevronRight className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-200 rtl:rotate-180", open && "rotate-90 rtl:rotate-90")} aria-hidden="true" />}
        {status === "running" && (
          <span className="absolute inset-x-0 bottom-0 h-px overflow-hidden" aria-hidden="true">
            <span className="pc-tool-sweep block h-full w-1/3 bg-[linear-gradient(90deg,transparent,var(--foreground),transparent)] opacity-40" />
          </span>
        )}
      </button>
      <AnimatePresence initial={false}>
        {open && hasBody && (
          <motion.div
            key="body"
            id={`${uid}-body`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={reduce ? { duration: 0 } : springs.ui}
            className="overflow-hidden"
          >
            <div className={cn("flex flex-col gap-3", variant === "card" ? "border-t px-3 py-3" : "px-2 pt-1 pb-2")}>
              {(argEntries.length > 0 || typeof args === "string") && (
                <section>
                  <h4 className="mb-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{l.arguments}</h4>
                  {typeof args === "string" ? (
                    <pre className="overflow-x-auto rounded-lg bg-muted/60 p-3 font-mono text-xs leading-5 whitespace-pre-wrap">{args}</pre>
                  ) : (
                    <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 font-mono text-xs leading-5">
                      {argEntries.map(([k, v]) => (
                        <React.Fragment key={k}>
                          <dt className="text-muted-foreground">{k}</dt>
                          <dd className="break-all">{typeof v === "string" ? v : JSON.stringify(v)}</dd>
                        </React.Fragment>
                      ))}
                    </dl>
                  )}
                </section>
              )}
              {output !== undefined && (
                <section>
                  <h4 className="mb-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{l.output}</h4>
                  {typeof output === "string" ? (
                    <pre tabIndex={0} className="max-h-56 overflow-auto rounded-lg bg-muted/60 p-3 font-mono text-xs leading-5 whitespace-pre-wrap outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                      {output}
                    </pre>
                  ) : (
                    output
                  )}
                </section>
              )}
              {status === "error" && error && (
                <section className="flex items-start gap-2 rounded-lg bg-rose-500/10 p-3 text-xs leading-5 text-rose-700 dark:text-rose-300">
                  <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  <span>
                    <span className="sr-only">{l.error}: </span>
                    {error}
                  </span>
                </section>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

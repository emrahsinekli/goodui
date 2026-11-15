"use client"

import * as React from "react"
import { motion, useReducedMotion } from "motion/react"
import { Check, CircleAlert, Copy, Pencil, RefreshCw, Sparkles, ThumbsDown, ThumbsUp, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { CodeBlock, type CodeLanguage } from "@/registry/components/ai/code-block"
import { useLabels } from "@/lib/goodui-locale"
import { GooduiTokens, spring } from "@/lib/goodui-motion"

/*
 * One chat message: user, assistant or system. Assistant text is rendered from a markdown-ish string
 * (paragraphs, headings, lists, quotes, inline code, bold, links and fenced code blocks that become
 * CodeBlocks) and gets a streaming caret while the answer is still arriving. Hover or focus reveals the actions
 * row (copy, good/bad, retry, edit). `grouped` hides the avatar and name for a follow-up message from the same
 * author.
 */

const CSS = `
@keyframes pc-chat-blink{0%,45%{opacity:1}50%,95%{opacity:0}100%{opacity:1}}
.pc-chat-caret{display:inline-block;width:2px;height:1.05em;margin-inline-start:.15em;vertical-align:text-bottom;border-radius:9999px;background:currentColor;animation:pc-chat-blink 1s step-end infinite}
.pc-chat-actions{opacity:0;transition:opacity .15s}
.pc-chat:hover .pc-chat-actions,.pc-chat:focus-within .pc-chat-actions,.pc-chat-actions[data-pinned]{opacity:1}
@media (hover:none){.pc-chat-actions{opacity:1}}
@media (prefers-reduced-motion:reduce){.pc-chat-caret{animation:none}}
`

/* ------------------------------------------------------------ markdown-ish */

export type MarkdownBlock =
  | { type: "p"; text: string }
  | { type: "h"; level: number; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[]; start: number }
  | { type: "code"; lang: string; code: string }
  | { type: "quote"; text: string }
  | { type: "hr" }

const UL = /^\s*[-*+]\s+/
const OL = /^\s*(\d+)[.)]\s+/
const HEADING = /^(#{1,4})\s+(.*)$/
const FENCE_OPEN = /^\s*```\s*([\w+#-]*)\s*$/
const FENCE_CLOSE = /^\s*```\s*$/

/** Splits a markdown-ish string into blocks. Unterminated fences (while streaming) render as code. */
export function parseMarkdown(src: string): MarkdownBlock[] {
  const lines = src.replace(/\r\n?/g, "\n").split("\n")
  const blocks: MarkdownBlock[] = []
  let i = 0
  const special = (s: string) => !s.trim() || FENCE_OPEN.test(s) || HEADING.test(s) || UL.test(s) || OL.test(s) || /^\s*>/.test(s)
  while (i < lines.length) {
    const line = lines[i] ?? ""
    const fence = FENCE_OPEN.exec(line)
    if (fence) {
      const buf: string[] = []
      i++
      while (i < lines.length && !FENCE_CLOSE.test(lines[i] ?? "")) buf.push(lines[i++] ?? "")
      i++
      blocks.push({ type: "code", lang: fence[1] ?? "", code: buf.join("\n") })
      continue
    }
    if (!line.trim()) {
      i++
      continue
    }
    const h = HEADING.exec(line)
    if (h) {
      blocks.push({ type: "h", level: h[1]?.length ?? 1, text: h[2] ?? "" })
      i++
      continue
    }
    if (/^\s*([-*_])\1{2,}\s*$/.test(line)) {
      blocks.push({ type: "hr" })
      i++
      continue
    }
    if (/^\s*>/.test(line)) {
      const buf: string[] = []
      while (i < lines.length && /^\s*>/.test(lines[i] ?? "")) buf.push((lines[i++] ?? "").replace(/^\s*>\s?/, ""))
      blocks.push({ type: "quote", text: buf.join("\n") })
      continue
    }
    if (UL.test(line) || OL.test(line)) {
      const ordered = OL.test(line)
      const start = ordered ? Number(OL.exec(line)?.[1] ?? 1) : 1
      const items: string[] = []
      while (i < lines.length) {
        const s = lines[i] ?? ""
        if (ordered ? OL.test(s) : UL.test(s)) items.push(s.replace(ordered ? OL : UL, ""))
        else if (s.trim() && /^\s{2,}/.test(s) && items.length) items[items.length - 1] += " " + s.trim()
        else break
        i++
      }
      blocks.push(ordered ? { type: "ol", items, start } : { type: "ul", items })
      continue
    }
    const buf = [line]
    i++
    while (i < lines.length && !special(lines[i] ?? "")) buf.push(lines[i++] ?? "")
    blocks.push({ type: "p", text: buf.join("\n") })
  }
  return blocks
}

const INLINE = /(`[^`\n]+`|\*\*[^*\n]+\*\*|\*[^*\n]+\*|\[[^\]\n]+\]\([^)\s]+\)|https?:\/\/[^\s)<]+)/g

/** Renders inline code, bold, italic, links and bare URLs. */
export function renderInline(text: string): React.ReactNode[] {
  return text.split(INLINE).map((part, i) => {
    if (!part) return null
    if (i % 2 === 0) return <React.Fragment key={i}>{part}</React.Fragment>
    if (part.startsWith("`")) {
      return (
        <code key={i} className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.86em]">
          {part.slice(1, -1)}
        </code>
      )
    }
    if (part.startsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>
    if (part.startsWith("*")) return <em key={i}>{part.slice(1, -1)}</em>
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part)
    const href = link ? (link[2] ?? "") : part
    const label = link ? (link[1] ?? "") : part.replace(/^https?:\/\//, "")
    return (
      <a key={i} href={href} target="_blank" rel="noreferrer" className="font-medium underline decoration-foreground/30 underline-offset-[3px] transition-colors hover:decoration-foreground">
        {label}
      </a>
    )
  })
}

const LANGS = new Set(["ts", "tsx", "js", "jsx", "json", "bash", "sh", "python", "py", "css", "html", "sql", "yaml", "yml"])
const toLanguage = (lang: string): CodeLanguage => {
  const k = lang.toLowerCase()
  if (k === "typescript") return "ts"
  if (k === "javascript") return "js"
  if (k === "shell" || k === "zsh") return "bash"
  return LANGS.has(k) ? (k as CodeLanguage) : "text"
}

export type MessageMarkdownProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** Markdown-ish text. */
  text: string
  /** Appends a blinking caret to the last block. */
  streaming?: boolean
}

/** The markdown-ish renderer used by ChatMessage, usable on its own. */
export function MessageMarkdown({ text, streaming = false, className, ...props }: MessageMarkdownProps) {
  const blocks = React.useMemo(() => parseMarkdown(text), [text])
  const caret = <span className="pc-chat-caret" aria-hidden="true" />
  return (
    <div className={cn("pc-chat-md flex flex-col gap-3 text-[15px] leading-7 [&_ol]:list-decimal [&_ul]:list-disc", className)} {...props}>
      <style href="pc-chat-message" precedence="default">
        {CSS}
      </style>
      {blocks.map((b, i) => {
        const last = streaming && i === blocks.length - 1
        switch (b.type) {
          case "h": {
            const Tag = (`h${Math.min(6, b.level + 2)}`) as "h3" | "h4" | "h5" | "h6"
            return (
              <Tag key={i} className={cn("font-semibold leading-snug", b.level === 1 ? "text-lg" : "text-base")}>
                {renderInline(b.text)}
                {last && caret}
              </Tag>
            )
          }
          case "ul":
          case "ol":
            return React.createElement(
              b.type,
              { key: i, className: "flex flex-col gap-1 ps-6", start: b.type === "ol" ? b.start : undefined },
              b.items.map((it, j) => (
                <li key={j} className="ps-1">
                  {renderInline(it)}
                  {last && j === b.items.length - 1 && caret}
                </li>
              )),
            )
          case "code":
            return (
              <React.Fragment key={i}>
                <CodeBlock code={b.code} language={toLanguage(b.lang)} title={b.lang || undefined} className="text-[13px]" />
                {last && <span className="-mt-2 leading-none">{caret}</span>}
              </React.Fragment>
            )
          case "quote":
            return (
              <blockquote key={i} className="border-s-2 ps-4 whitespace-pre-wrap text-muted-foreground">
                {renderInline(b.text)}
                {last && caret}
              </blockquote>
            )
          case "hr":
            return <hr key={i} className="my-1" />
          default:
            return (
              <p key={i} className="whitespace-pre-wrap">
                {renderInline(b.text)}
                {last && caret}
              </p>
            )
        }
      })}
      {blocks.length === 0 && streaming && <p>{caret}</p>}
    </div>
  )
}

/* ------------------------------------------------------------ message */

export type ChatRole = "user" | "assistant" | "system"
export type ChatFeedback = "up" | "down" | null

export type ChatMessageLabels = {
  copy: string
  copied: string
  good: string
  bad: string
  retry: string
  edit: string
  sending: string
  sent: string
  failed: string
  assistant: string
  you: string
  system: string
}
const DEFAULT_LABELS: ChatMessageLabels = {
  copy: "Copy",
  copied: "Copied",
  good: "Good response",
  bad: "Bad response",
  retry: "Retry",
  edit: "Edit message",
  sending: "Sending…",
  sent: "Sent",
  failed: "Not sent",
  assistant: "Assistant",
  you: "You",
  system: "System",
}

export type ChatMessageProps = Omit<React.ComponentProps<"div">, "content" | "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart"> & {
  role: ChatRole
  /** Message text, rendered markdown-ish. Children render under it (tool calls, cards, custom content). */
  content?: string
  /** Author shown above assistant messages; also the fallback for the avatar initials. */
  name?: string
  /** Image URL or any node (icon, initials). Defaults to a sparkle for assistants and the user's initial. */
  avatar?: React.ReactNode
  /** Short time or date text, e.g. "14:32". */
  time?: string
  /** Delivery state for user messages. */
  status?: "sending" | "sent" | "error"
  /** The answer is still arriving: shows a caret and hides the actions row. */
  streaming?: boolean
  /** A follow-up message from the same author: no avatar or name, tighter spacing. */
  grouped?: boolean
  /** flat: assistant text sits on the page, user text in a bubble. bubble: both in bubbles. */
  variant?: "flat" | "bubble"
  /** User bubble color. */
  tone?: "neutral" | "primary"
  /** Show the actions row (copy and the handlers you pass). */
  actions?: boolean
  /** Text copied by the copy action; defaults to content. */
  copyText?: string
  onCopy?: (text: string) => void
  /** Thumbs up/down; clicking the active one clears it. */
  onFeedback?: (value: ChatFeedback) => void
  /** Controlled feedback state. */
  feedback?: ChatFeedback
  /** Shown as a retry button on assistant messages and on failed user messages. */
  onRetry?: () => void
  /** Shown as an edit button on user messages. */
  onEdit?: () => void
  /** Fade and rise in on mount. */
  animate?: boolean
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<ChatMessageLabels>
}

async function writeClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

function ActionButton({ label, pressed, className, children, ...props }: React.ComponentProps<"button"> & { label: string; pressed?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      className={cn(
        "pc-press grid size-7 place-items-center rounded-md text-muted-foreground transition-[background-color,color,transform] outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-90",
        pressed && "bg-muted text-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

/** A chat bubble for user, assistant or system messages with markdown-ish content, streaming caret and actions. */
export function ChatMessage({
  role,
  content,
  name,
  avatar,
  time,
  status,
  streaming = false,
  grouped = false,
  variant = "flat",
  tone = "neutral",
  actions = true,
  copyText,
  onCopy,
  onFeedback,
  feedback: feedbackProp,
  onRetry,
  onEdit,
  animate = true,
  labels,
  className,
  children,
  ...props
}: ChatMessageProps) {
  const l = useLabels("chat-message", DEFAULT_LABELS, labels)
  const reduce = useReducedMotion() ?? false
  const [copied, setCopied] = React.useState(false)
  const [fbInner, setFbInner] = React.useState<ChatFeedback>(null)
  const feedback = feedbackProp === undefined ? fbInner : feedbackProp
  const user = role === "user"
  const system = role === "system"
  const author = name ?? (user ? l.you : system ? l.system : l.assistant)

  React.useEffect(() => {
    if (!copied) return
    const id = window.setTimeout(() => setCopied(false), 1600)
    return () => window.clearTimeout(id)
  }, [copied])

  const copy = async () => {
    const text = copyText ?? content ?? ""
    if (await writeClipboard(text)) setCopied(true)
    onCopy?.(text)
  }
  const rate = (v: Exclude<ChatFeedback, null>) => {
    const next = feedback === v ? null : v
    if (feedbackProp === undefined) setFbInner(next)
    onFeedback?.(next)
  }

  const avatarNode =
    typeof avatar === "string" ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={avatar} alt="" className="size-full object-cover" />
    ) : avatar !== undefined ? (
      avatar
    ) : user ? (
      name ? (
        <span className="text-xs font-semibold">{name.trim().charAt(0).toUpperCase()}</span>
      ) : (
        <User className="size-4" aria-hidden="true" />
      )
    ) : (
      <Sparkles className="size-4" aria-hidden="true" />
    )

  if (system) {
    return (
      <motion.div
        role="note"
        className={cn("pc-chat flex justify-center", className)}
        initial={animate ? { opacity: 0, y: 6 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={reduce ? { duration: 0 } : spring.ui}
        {...props}
      >
        <GooduiTokens />
        <style href="pc-chat-message" precedence="default">
          {CSS}
        </style>
        <div className="max-w-[80%] rounded-full border bg-muted/60 px-3 py-1 text-center text-xs text-muted-foreground">{content}</div>
      </motion.div>
    )
  }

  const hasCopy = content !== undefined || !!copyText
  const showActions = actions && !streaming && (hasCopy || (!user && (onFeedback !== undefined || !!onRetry)) || (user && !!onEdit))
  const bubble = user || variant === "bubble"

  return (
    <motion.div
      data-role={role}
      data-grouped={grouped || undefined}
      className={cn("pc-chat group/msg flex gap-3", user && "flex-row-reverse", grouped ? "mt-1" : "mt-4 first:mt-0", className)}
      initial={animate ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={reduce ? { duration: 0 } : spring.ui}
      {...props}
    >
      <style href="pc-chat-message" precedence="default">
        {CSS}
      </style>
      <div className="w-7 shrink-0">
        {!grouped && (
          <div
            className={cn(
              "grid size-7 place-items-center overflow-hidden rounded-full",
              user ? "bg-muted text-foreground" : "bg-[linear-gradient(135deg,var(--chart-1),var(--chart-4))] text-white",
            )}
            aria-hidden="true"
          >
            {avatarNode}
          </div>
        )}
      </div>
      <div className={cn("flex min-w-0 max-w-[85%] flex-col", user ? "items-end" : "flex-1 items-start")}>
        {!grouped && !user && (
          <div className="mb-1 flex items-baseline gap-2 text-xs">
            <span className="font-medium">{author}</span>
            {time && <span className="text-muted-foreground">{time}</span>}
          </div>
        )}
        {user && <span className="sr-only">{author}</span>}
        <div
          className={cn(
            "min-w-0",
            bubble && "rounded-2xl px-4 py-2.5",
            bubble && user && (tone === "primary" ? "bg-primary text-primary-foreground [&_code]:bg-primary-foreground/15" : "bg-muted"),
            bubble && !user && "border bg-card",
            bubble && user && !grouped && "rounded-se-md",
            bubble && !user && !grouped && "rounded-ss-md",
            status === "error" && "opacity-70",
          )}
        >
          {content !== undefined && <MessageMarkdown text={content} streaming={streaming} className={cn(user && "text-[15px] leading-6")} />}
          {children}
        </div>
        {(user ? time || status : false) && (
          <div className={cn("mt-1 flex items-center gap-1 text-[11px] text-muted-foreground", status === "error" && "text-rose-700 dark:text-rose-400")}>
            {status === "error" && <CircleAlert className="size-3" aria-hidden="true" />}
            {status === "sending" ? l.sending : status === "error" ? l.failed : time}
            {status === "error" && onRetry && (
              <button type="button" onClick={onRetry} className="pc-press ms-1 font-medium underline underline-offset-2 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
                {l.retry}
              </button>
            )}
          </div>
        )}
        {showActions && (
          <div className={cn("pc-chat-actions -ms-1 mt-1 flex items-center gap-0.5", user && "-me-1 ms-0 flex-row-reverse")} data-pinned={feedback ? "" : undefined}>
            {hasCopy && (
              <ActionButton label={copied ? l.copied : l.copy} onClick={copy}>
                <span className="relative grid size-4 place-items-center">
                  <Copy className={cn("absolute size-4 transition-[opacity,transform] duration-200", copied && "scale-50 opacity-0")} aria-hidden="true" />
                  <Check className={cn("absolute size-4 text-emerald-600 transition-[opacity,transform] duration-200 dark:text-emerald-400", copied ? "scale-100 opacity-100" : "scale-50 opacity-0")} aria-hidden="true" />
                </span>
                <span className="sr-only" aria-live="polite">
                  {copied ? l.copied : ""}
                </span>
              </ActionButton>
            )}
            {!user && onFeedback !== undefined && (
              <>
                <ActionButton label={l.good} pressed={feedback === "up"} onClick={() => rate("up")} className={cn(feedback === "up" && "text-emerald-600 dark:text-emerald-400")}>
                  <motion.span key={feedback === "up" ? "on" : "off"} initial={reduce ? false : { scale: 0.6 }} animate={{ scale: 1 }} transition={spring.play} className="grid">
                    <ThumbsUp className="size-4" fill={feedback === "up" ? "currentColor" : "none"} aria-hidden="true" />
                  </motion.span>
                </ActionButton>
                <ActionButton label={l.bad} pressed={feedback === "down"} onClick={() => rate("down")} className={cn(feedback === "down" && "text-rose-600 dark:text-rose-400")}>
                  <motion.span key={feedback === "down" ? "on" : "off"} initial={reduce ? false : { scale: 0.6 }} animate={{ scale: 1 }} transition={spring.play} className="grid">
                    <ThumbsDown className="size-4" fill={feedback === "down" ? "currentColor" : "none"} aria-hidden="true" />
                  </motion.span>
                </ActionButton>
              </>
            )}
            {!user && onRetry && (
              <ActionButton label={l.retry} onClick={onRetry} className="group/retry">
                <RefreshCw className="size-4 transition-transform duration-300 group-hover/retry:rotate-180" aria-hidden="true" />
              </ActionButton>
            )}
            {user && onEdit && (
              <ActionButton label={l.edit} onClick={onEdit}>
                <Pencil className="size-4" aria-hidden="true" />
              </ActionButton>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

"use client"

import * as React from "react"
import { AnimatePresence, animate, motion, useReducedMotion } from "motion/react"
import { File, FileText, Image as ImageIcon, Paperclip, Slash, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SoundName } from "@/lib/goodui-sounds"
import { ModelPicker, type ModelOption } from "@/registry/components/ai/model-picker"
import { useLabels } from "@/lib/goodui-locale"
import { GooduiTokens, spring } from "@/lib/goodui-motion"

/*
 * Prompt composer for AI chat: an auto-growing textarea with attachment chips (button, paste or drop),
 * a slash-command menu, model and mode selectors, a token counter against the context limit, Enter or
 * Cmd/Ctrl+Enter to send and a Stop button while the answer streams.
 */

/* The halo: a thin spinning light on the edge plus a blurred copy under it. Focus shows it, streaming speeds it up. */
const CSS = `
@property --pc-composer-a{syntax:"<angle>";inherits:true;initial-value:0deg}
@keyframes pc-composer-spin{to{--pc-composer-a:360deg}}
.pc-composer{--pc-composer-glow:conic-gradient(from var(--pc-composer-a),var(--chart-1),var(--chart-4),var(--chart-5),var(--chart-2),var(--chart-1))}
.pc-composer[data-halo]::before,.pc-composer[data-halo]::after{content:"";position:absolute;inset:-1px;border-radius:inherit;background:var(--pc-composer-glow);opacity:0;pointer-events:none;transition:opacity 240ms var(--pc-ease-out)}
.pc-composer[data-halo]::before{padding:1.5px;-webkit-mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0);mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0)}
.pc-composer[data-halo]::after{z-index:-2;inset:2px;filter:blur(14px)}
.pc-composer-bg{position:absolute;inset:0;z-index:-1;border-radius:inherit;background:var(--card);pointer-events:none}
.pc-composer[data-halo]:is(:focus-within,[data-dragging],[data-streaming])::before{opacity:1}
.pc-composer[data-halo]:is(:focus-within,[data-dragging],[data-streaming])::after{opacity:.38}
.dark .pc-composer[data-halo]:is(:focus-within,[data-dragging],[data-streaming])::after{opacity:.3}
.pc-composer[data-halo]:is(:focus-within,[data-dragging],[data-streaming]){animation:pc-composer-spin 6s linear infinite}
.pc-composer[data-halo][data-streaming]{animation-duration:1.8s}
@media (prefers-reduced-motion:reduce){.pc-composer[data-halo]{animation:none!important}.pc-composer[data-halo]::before,.pc-composer[data-halo]::after{transition:none}}
.pc-composer-ring{transition:stroke-dashoffset .35s var(--pc-ease-out),stroke .2s}
@media (prefers-reduced-motion:reduce){.pc-composer-ring{transition:none}}
`

export type ComposerAttachment = {
  id: string
  name: string
  /** Bytes, shown as KB/MB. */
  size?: number
  /** MIME type; images get a thumbnail when `url` is set. */
  type?: string
  /** Preview URL for images (object URL or remote). */
  url?: string
  file?: File
}

export type SlashCommand = { name: string; description?: string; icon?: React.ReactNode }
export type ComposerMode = { id: string; label: string; icon?: React.ReactNode }

export type ChatComposerLabels = {
  placeholder: string
  send: string
  stop: string
  attach: string
  remove: (name: string) => string
  commands: string
  noCommands: string
  modes: string
  tokens: (used: string, max: string) => string
  overLimit: string
  hint: string
}
const DEFAULT_LABELS: ChatComposerLabels = {
  placeholder: "Message…",
  send: "Send message",
  stop: "Stop generating",
  attach: "Attach files",
  remove: (name) => `Remove ${name}`,
  commands: "Commands",
  noCommands: "No matching command",
  modes: "Mode",
  tokens: (used, max) => `${used} of ${max} tokens`,
  overLimit: "Over the token limit",
  hint: "Enter to send, Shift+Enter for a new line",
}

export type ChatComposerProps = Omit<React.ComponentProps<"form">, "onSubmit" | "defaultValue" | "onDrop" | "onDragOver" | "onDragLeave" | "onKeyDown" | "onPaste"> & {
  /** Key handler on the textarea; call preventDefault to override the Enter behavior. */
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  /** Paste handler on the textarea; pasted files become attachments when `accept` is set. */
  onPaste?: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** Called with the trimmed text and the attachments, model and mode in effect. Clears the field when uncontrolled. */
  onSubmit?: (text: string, meta: { attachments: ComposerAttachment[]; model?: string; mode?: string }) => void
  /** The answer is streaming: the send button becomes Stop and calls onStop. */
  streaming?: boolean
  onStop?: () => void
  attachments?: ComposerAttachment[]
  defaultAttachments?: ComposerAttachment[]
  onAttachmentsChange?: (attachments: ComposerAttachment[]) => void
  /** Accept attribute for the file picker, e.g. "image/*,.pdf". Omit to hide the attach button. */
  accept?: string
  maxAttachments?: number
  /** Typing "/" at the start opens this list. */
  commands?: SlashCommand[]
  /** Runs when a command is picked; by default the command is inserted as "/name ". */
  onCommand?: (command: SlashCommand) => void
  /** Models for a built-in ModelPicker in the footer. */
  models?: ModelOption[]
  model?: string
  defaultModel?: string
  onModelChange?: (id: string) => void
  /** Modes shown as a segmented control, e.g. Chat / Research / Code. */
  modes?: ComposerMode[]
  mode?: string
  defaultMode?: string
  onModeChange?: (id: string) => void
  /** Context limit; shows the counter and blocks sending above it. */
  maxTokens?: number
  /** Your tokenizer; defaults to about one token per four characters. */
  countTokens?: (text: string) => number
  /** Textarea placeholder; also its accessible name. */
  placeholder?: string
  minRows?: number
  maxRows?: number
  /** Enter sends (Shift+Enter adds a line). false: only Cmd/Ctrl+Enter sends. */
  submitOnEnter?: boolean
  disabled?: boolean
  autoFocus?: boolean
  /** Extra controls at the start of the footer. */
  footer?: React.ReactNode
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<ChatComposerLabels>
  /** Spinning colored light on the edge while focused, faster while streaming. false keeps a plain focus ring. */
  halo?: boolean
  /** Plays "send" on submit when the visitor has sounds on (lib/goodui-sounds); a sound name picks another. Off by default. */
  sound?: boolean | SoundName
}

// Optional UI sound: the sound module is loaded only when `sound` is on, so silent apps pay nothing.
function useCue(sound: boolean | SoundName | undefined) {
  React.useEffect(() => {
    if (sound) void import("@/lib/goodui-sounds")
  }, [sound])
  return React.useCallback(
    (fallback: SoundName) => {
      if (!sound) return
      void import("@/lib/goodui-sounds").then((m) => m.play(sound === true ? fallback : sound))
    },
    [sound],
  )
}

const fmtSize = (n: number) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : n >= 1024 ? `${Math.round(n / 1024)} KB` : `${n} B`)
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 })
let seq = 0

function toAttachment(file: File): ComposerAttachment {
  return { id: `a${++seq}-${file.name}`, name: file.name, size: file.size, type: file.type, file, url: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined }
}

function FileIcon({ type }: { type?: string }) {
  const Icon = type?.startsWith("image/") ? ImageIcon : type?.includes("pdf") || type?.startsWith("text/") ? FileText : File
  return <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
}

/** Auto-growing prompt input with attachments, slash commands, model and mode pickers, token counter and stop. */
export function ChatComposer({
  value: valueProp,
  defaultValue = "",
  onValueChange,
  onSubmit,
  streaming = false,
  onStop,
  attachments: attachmentsProp,
  defaultAttachments = [],
  onAttachmentsChange,
  accept,
  maxAttachments = 10,
  commands,
  onCommand,
  models,
  model: modelProp,
  defaultModel,
  onModelChange,
  modes,
  mode: modeProp,
  defaultMode,
  onModeChange,
  maxTokens,
  countTokens,
  placeholder,
  minRows = 1,
  maxRows = 8,
  submitOnEnter = true,
  disabled,
  autoFocus,
  footer,
  labels,
  halo = true,
  sound,
  className,
  onKeyDown,
  onPaste,
  ...props
}: ChatComposerProps) {
  const l = { ...useLabels("chat-composer", DEFAULT_LABELS, labels), ...(placeholder !== undefined ? { placeholder } : {}) }
  const reduce = useReducedMotion() ?? false
  const cue = useCue(sound)
  const uid = React.useId()
  const [innerValue, setInnerValue] = React.useState(defaultValue)
  const value = valueProp ?? innerValue
  const [innerFiles, setInnerFiles] = React.useState(defaultAttachments)
  const attachments = attachmentsProp ?? innerFiles
  const [innerModel, setInnerModel] = React.useState(defaultModel ?? models?.[0]?.id)
  const model = modelProp ?? innerModel
  const [innerMode, setInnerMode] = React.useState(defaultMode ?? modes?.[0]?.id)
  const mode = modeProp ?? innerMode
  const [active, setActive] = React.useState(0)
  const [dragging, setDragging] = React.useState(false)
  const taRef = React.useRef<HTMLTextAreaElement>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)
  const grown = React.useRef(false)

  const setValue = (v: string) => {
    if (valueProp === undefined) setInnerValue(v)
    onValueChange?.(v)
  }
  const setFiles = (next: ComposerAttachment[]) => {
    if (attachmentsProp === undefined) setInnerFiles(next)
    onAttachmentsChange?.(next)
  }
  const addFiles = (files: FileList | File[]) => {
    const room = Math.max(0, maxAttachments - attachments.length)
    const added = Array.from(files).slice(0, room).map(toAttachment)
    if (added.length) setFiles([...attachments, ...added])
  }
  const removeFile = (id: string) => setFiles(attachments.filter((a) => a.id !== id))

  // Auto-grow between minRows and maxRows.
  React.useLayoutEffect(() => {
    const ta = taRef.current
    if (!ta) return
    const line = parseFloat(getComputedStyle(ta).lineHeight) || 24
    const from = ta.offsetHeight
    ta.style.height = "0px"
    const pad = ta.offsetHeight - ta.clientHeight
    const to = Math.min(Math.max(ta.scrollHeight, line * minRows + pad), line * maxRows + pad)
    // First layout and reduced motion set the height directly; after that it springs.
    if (reduce || !grown.current || from === to) {
      grown.current = true
      ta.style.height = `${to}px`
      return
    }
    ta.style.height = `${from}px`
    const controls = animate(ta, { height: to }, spring.ui)
    return () => controls.stop()
  }, [value, minRows, maxRows, reduce])

  // Slash commands: "/" at the start, filtered by what follows until the first space.
  const query = commands && /^\/[^\s]*$/.test(value) ? value.slice(1).toLowerCase() : null
  const matches = React.useMemo(() => (query === null ? [] : (commands ?? []).filter((c) => c.name.toLowerCase().startsWith(query))), [commands, query])
  const menuOpen = query !== null
  React.useEffect(() => setActive(0), [query])

  const pick = (c: SlashCommand) => {
    if (onCommand) onCommand(c)
    setValue(`/${c.name} `)
    taRef.current?.focus()
  }

  const used = React.useMemo(() => (countTokens ? countTokens(value) : Math.ceil(value.trim().length / 4)), [countTokens, value])
  const ratio = maxTokens ? used / maxTokens : 0
  const over = !!maxTokens && used > maxTokens
  const canSend = !disabled && !over && (value.trim().length > 0 || attachments.length > 0)

  const submit = () => {
    if (streaming) return onStop?.()
    if (!canSend) return
    onSubmit?.(value.trim(), { attachments, model, mode })
    cue("send")
    if (valueProp === undefined) setInnerValue("")
    if (attachmentsProp === undefined) setInnerFiles([])
    onValueChange?.("")
  }

  const keyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented) return
    if (menuOpen && matches.length) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault()
        setActive((a) => (a + (e.key === "ArrowDown" ? 1 : -1) + matches.length) % matches.length)
        return
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault()
        const c = matches[active]
        if (c) pick(c)
        return
      }
      if (e.key === "Escape") {
        e.preventDefault()
        setValue(value + " ")
        return
      }
    }
    if (e.key === "Enter" && ((e.metaKey || e.ctrlKey) || (submitOnEnter && !e.shiftKey && !e.nativeEvent.isComposing))) {
      e.preventDefault()
      submit()
    }
  }

  const paste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    onPaste?.(e)
    if (e.clipboardData.files.length && accept) {
      e.preventDefault()
      addFiles(e.clipboardData.files)
    }
  }

  const ringR = 7
  const ringC = 2 * Math.PI * ringR
  const tokenTone = over ? "text-rose-700 dark:text-rose-400" : ratio >= 0.85 ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground"

  return (
    <form
      className={cn(
        "pc-composer relative isolate flex w-full flex-col rounded-2xl text-card-foreground shadow-[var(--pc-e2)]",
        !halo && "transition-shadow focus-within:ring-3 focus-within:ring-ring/40",
        !halo && dragging && "ring-3 ring-ring/40",
        disabled && "opacity-60",
        className,
      )}
      data-dragging={dragging || undefined}
      data-streaming={streaming || undefined}
      data-halo={halo || undefined}
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      onDragOver={(e) => {
        if (!accept) return
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        if (!accept) return
        e.preventDefault()
        setDragging(false)
        addFiles(e.dataTransfer.files)
      }}
      {...props}
    >
      <GooduiTokens />
      <style href="pc-chat-composer" precedence="default">
        {CSS}
      </style>
      <span className="pc-composer-bg" aria-hidden="true" />

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="commands"
            role="listbox"
            id={`${uid}-commands`}
            aria-label={l.commands}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0, transition: { duration: 0.1 } } : { opacity: 0, y: 4, transition: { duration: 0.12 } }}
            transition={reduce ? { duration: 0 } : spring.snap}
            className="absolute inset-x-2 bottom-full z-30 mb-2 max-h-60 origin-bottom overflow-y-auto rounded-xl border bg-popover p-1 text-popover-foreground shadow-[var(--pc-e3)]"
          >
            <div role="presentation" className="px-2 pt-1.5 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              {l.commands}
            </div>
            {matches.length === 0 && (
              <div role="presentation" className="px-2 py-2 text-sm text-muted-foreground">
                {l.noCommands}
              </div>
            )}
            {matches.map((c, i) => (
              <div
                key={c.name}
                role="option"
                aria-selected={i === active}
                onPointerMove={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(c)}
                className="relative flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5"
              >
                {i === active && <motion.span layoutId={`${uid}-cmd`} className="absolute inset-0 rounded-lg bg-muted" transition={reduce ? { duration: 0 } : spring.snap} />}
                <span className="relative grid size-6 shrink-0 place-items-center rounded-md border bg-background text-muted-foreground [&_svg]:size-3.5">{c.icon ?? <Slash />}</span>
                <span className="relative min-w-0 flex-1">
                  <span className="font-mono text-sm font-medium">/{c.name}</span>
                  {c.description && <span className="ms-2 truncate text-xs text-muted-foreground">{c.description}</span>}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {attachments.length > 0 && (
          <motion.ul
            key="files"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={reduce ? { duration: 0 } : spring.ui}
            className="flex flex-wrap gap-1.5 overflow-hidden px-2 pt-2"
          >
            <AnimatePresence initial={false}>
              {attachments.map((a) => (
                <motion.li
                  key={a.id}
                  layout
                  initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 8, filter: "blur(4px)" }}
                  animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                  exit={reduce ? { opacity: 0, transition: { duration: 0.1 } } : { opacity: 0, scale: 0.95, filter: "blur(4px)", transition: { duration: 0.14 } }}
                  transition={reduce ? { duration: 0 } : spring.morph}
                  className="flex h-9 max-w-full items-center gap-2 rounded-lg bg-background ps-1.5 pe-1 text-xs shadow-[var(--pc-e1)]"
                >
                  {a.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.url} alt="" className="size-6 rounded-md object-cover" />
                  ) : (
                    <span className="grid size-6 place-items-center rounded-md bg-muted">
                      <FileIcon type={a.type} />
                    </span>
                  )}
                  <span className="flex min-w-0 flex-col leading-tight">
                    <span className="max-w-40 truncate font-medium">{a.name}</span>
                    {a.size !== undefined && <span className="text-[10px] text-muted-foreground">{fmtSize(a.size)}</span>}
                  </span>
                  <button
                    type="button"
                    aria-label={l.remove(a.name)}
                    onClick={() => removeFile(a.id)}
                    className="pc-press grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        )}
      </AnimatePresence>

      <textarea
        ref={taRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={keyDown}
        onPaste={paste}
        rows={minRows}
        placeholder={l.placeholder}
        aria-label={l.placeholder}
        aria-describedby={`${uid}-hint`}
        disabled={disabled}
        autoFocus={autoFocus}
        className="w-full resize-none bg-transparent px-4 pt-3 pb-1 text-[15px] leading-6 outline-none placeholder:text-muted-foreground"
      />
      <span id={`${uid}-hint`} className="sr-only">
        {l.hint}
      </span>

      <div className="flex items-end gap-1 px-2 pb-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
          {accept && (
            <>
              <input ref={fileRef} type="file" accept={accept} multiple hidden tabIndex={-1} onChange={(e) => e.target.files && addFiles(e.target.files)} />
              <button
                type="button"
                aria-label={l.attach}
                title={l.attach}
                disabled={disabled}
                onClick={() => fileRef.current?.click()}
                className="pc-press grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <Paperclip className="size-4" aria-hidden="true" />
              </button>
            </>
          )}
          {footer}
          {models && models.length > 0 && (
            <ModelPicker
              models={models}
              value={model}
              onValueChange={(id) => {
                if (modelProp === undefined) setInnerModel(id)
                onModelChange?.(id)
              }}
              variant="ghost"
              size="sm"
              align="start"
              disabled={disabled}
            />
          )}
          {modes && modes.length > 0 && (
            <div role="radiogroup" aria-label={l.modes} className="flex items-center rounded-lg bg-muted/70 p-0.5">
              {modes.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={mode === m.id}
                  disabled={disabled}
                  onClick={() => {
                    if (modeProp === undefined) setInnerMode(m.id)
                    onModeChange?.(m.id)
                  }}
                  className={cn(
                    "pc-press relative inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium whitespace-nowrap outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:size-3.5",
                    mode === m.id ? "text-foreground" : "text-foreground/65 hover:text-foreground",
                  )}
                >
                  {mode === m.id && <motion.span layoutId={`${uid}-mode`} className="absolute inset-0 rounded-md bg-background shadow-[var(--pc-e1)]" transition={reduce ? { duration: 0 } : spring.snap} />}
                  <span className="relative inline-flex items-center gap-1">
                    {m.icon}
                    {m.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {maxTokens !== undefined && (
            <span className={cn("inline-flex items-center gap-1.5 text-[11px] tabular-nums", tokenTone)} title={over ? l.overLimit : undefined}>
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" className="-rotate-90">
                <circle cx="9" cy="9" r={ringR} fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" />
                <circle cx="9" cy="9" r={ringR} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray={ringC} strokeDashoffset={ringC * (1 - Math.min(1, ratio))} className="pc-composer-ring" />
              </svg>
              <span aria-hidden="true" dir="ltr">
                {compact.format(used)} / {compact.format(maxTokens)}
              </span>
              <span className="sr-only">{over ? l.overLimit : l.tokens(compact.format(used), compact.format(maxTokens))}</span>
            </span>
          )}
          <button
            type={streaming ? "button" : "submit"}
            aria-label={streaming ? l.stop : l.send}
            title={streaming ? l.stop : l.send}
            disabled={streaming ? disabled : !canSend}
            onClick={streaming ? onStop : undefined}
            className={cn(
              "pc-press relative grid size-8 shrink-0 place-items-center rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              streaming ? "bg-foreground text-background" : "bg-primary text-primary-foreground disabled:opacity-35",
            )}
          >
            {/* One shape: the arrow's stem widens into the stop square while its head draws away. */}
            <span className="relative grid size-4 place-items-center" aria-hidden="true">
              <motion.span
                className="block bg-current"
                initial={false}
                animate={streaming ? { width: 11, height: 11, borderRadius: 2.5 } : { width: 2.25, height: 13, borderRadius: 1.2 }}
                transition={reduce ? { duration: 0 } : spring.ui}
              />
              <svg viewBox="0 0 16 16" className="absolute inset-0 size-4" fill="none">
                <motion.path
                  d="M3.2 7.4 8 2.6l4.8 4.8"
                  stroke="currentColor"
                  strokeWidth="2.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={false}
                  animate={streaming ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 1 }}
                  transition={reduce ? { duration: 0 } : spring.snap}
                />
              </svg>
            </span>
          </button>
        </div>
      </div>
    </form>
  )
}

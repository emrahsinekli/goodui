"use client"

import * as React from "react"
import {
  ArrowUp,
  Check,
  ChevronDown,
  Copy,
  CornerDownLeft,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Languages,
  ListCollapse,
  Megaphone,
  MessageSquareReply,
  Paperclip,
  RotateCcw,
  Slash,
  Sparkles,
  Wand2,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

type Attachment = { id: string; name: string; size: number; type: string }
type Entry = { id: number; text: string; files: Attachment[]; model: string; tokens: number; at: number }
type Command = { cmd: string; label: string; hint: string; icon: React.ElementType; insert?: string; attach?: Attachment }

const LIMIT = 4000

const MODELS = [
  { id: "atlas-pro", name: "Atlas Pro", context: "200k context" },
  { id: "atlas-mini", name: "Atlas Mini", context: "128k context · fastest" },
  { id: "atlas-vision", name: "Atlas Vision", context: "Reads images and PDFs" },
]

const COMMANDS: Command[] = [
  { cmd: "summarize", label: "Summarize", hint: "Condense notes or a thread", icon: ListCollapse, insert: "Summarize the following in 3 short bullet points:\n" },
  { cmd: "reply", label: "Draft reply", hint: "Answer a client message", icon: MessageSquareReply, insert: "Draft a warm, short reply to this client message:\n" },
  { cmd: "promo", label: "Promo campaign", hint: "SMS + email to fill quiet slots", icon: Megaphone, insert: "Write an SMS and an email that fill our quiet Tuesday mornings with 15% off. Keep the SMS under 160 characters.\n" },
  { cmd: "translate", label: "Translate", hint: "Keep tone, change language", icon: Languages, insert: "Translate into Spanish and keep the friendly tone:\n" },
  { cmd: "tone", label: "Change tone", hint: "Friendlier, shorter or formal", icon: Wand2, insert: "Rewrite this so it sounds friendlier and half as long:\n" },
  { cmd: "attach", label: "Attach sample data", hint: "bookings-october.csv", icon: FileSpreadsheet, attach: { id: "sample", name: "bookings-october.csv", size: 48_312, type: "text/csv" } },
]

const fmtSize = (b: number) => (b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${(b / 1024).toFixed(b < 10_240 ? 1 : 0)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`)
const tokensOf = (text: string, files: Attachment[]) => Math.ceil(text.length / 4) + files.reduce((n, f) => n + Math.min(2000, Math.ceil(f.size / 40)), 0)

function FileIcon({ type, className }: { type: string; className?: string }) {
  if (type.startsWith("image/")) return <ImageIcon className={className} />
  if (type.includes("csv") || type.includes("sheet") || type.includes("excel")) return <FileSpreadsheet className={className} />
  return <FileText className={className} />
}

export default function PromptComposer() {
  const [value, setValue] = React.useState("")
  const [files, setFiles] = React.useState<Attachment[]>([])
  const [model, setModel] = React.useState(MODELS[0]!)
  const [history, setHistory] = React.useState<Entry[]>([])
  const [menu, setMenu] = React.useState<{ start: number; query: string } | null>(null)
  const [highlight, setHighlight] = React.useState(0)
  const [copied, setCopied] = React.useState<number | null>(null)
  const area = React.useRef<HTMLTextAreaElement>(null)
  const fileInput = React.useRef<HTMLInputElement>(null)
  const caret = React.useRef<number | null>(null)
  const nextId = React.useRef(1)
  const listBox = React.useRef<HTMLDivElement>(null)

  // Auto-grow the textarea and restore the caret after a command was inserted.
  React.useLayoutEffect(() => {
    const el = area.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`
    if (caret.current !== null) {
      el.focus()
      el.setSelectionRange(caret.current, caret.current)
      caret.current = null
    }
  }, [value])

  React.useEffect(() => {
    const el = listBox.current
    if (el && history.length) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
  }, [history.length])

  const matches = menu ? COMMANDS.filter((c) => c.cmd.startsWith(menu.query.toLowerCase()) || c.label.toLowerCase().includes(menu.query.toLowerCase())) : []
  const tokens = tokensOf(value, files)
  const over = value.length > LIMIT
  const canSend = (value.trim().length > 0 || files.length > 0) && !over

  const detect = (text: string, pos: number) => {
    const m = /(?:^|\s)\/(\w*)$/.exec(text.slice(0, pos))
    if (m) {
      const query = m[1] ?? ""
      setMenu({ start: pos - query.length - 1, query })
      setHighlight(0)
    } else setMenu(null)
  }

  const pick = (c: Command) => {
    if (!menu) return
    const end = menu.start + 1 + menu.query.length
    const before = value.slice(0, menu.start)
    const after = value.slice(end)
    if (c.attach) {
      const att = c.attach
      setFiles((f) => (f.some((x) => x.id === att.id) ? f : [...f, att]))
      caret.current = before.length
      setValue(before + after)
    } else {
      const ins = c.insert ?? ""
      caret.current = before.length + ins.length
      setValue(before + ins + after)
    }
    setMenu(null)
  }

  const addFiles = (list: FileList | null) => {
    if (!list) return
    const added = Array.from(list).map((f, i) => ({ id: `${f.name}-${f.size}-${f.lastModified}-${i}`, name: f.name, size: f.size, type: f.type || "application/octet-stream" }))
    setFiles((cur) => [...cur, ...added.filter((a) => !cur.some((c) => c.id === a.id))])
    if (fileInput.current) fileInput.current.value = ""
    area.current?.focus()
  }

  const submit = () => {
    if (!canSend) return
    setHistory((h) => [...h, { id: nextId.current++, text: value.trim(), files, model: model.name, tokens, at: Date.now() }])
    setValue("")
    setFiles([])
    setMenu(null)
  }

  const reuse = (e: Entry) => {
    setFiles(e.files)
    caret.current = e.text.length
    setValue(e.text)
  }

  const copy = (e: Entry) => {
    navigator.clipboard?.writeText(e.text).catch(() => {})
    setCopied(e.id)
    setTimeout(() => setCopied((c) => (c === e.id ? null : c)), 1500)
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        {/* History */}
        <div ref={listBox} className="flex max-h-[300px] min-h-[180px] flex-col gap-3 overflow-y-auto rounded-2xl border border-dashed bg-muted/30 p-3">
          {history.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-6 text-center">
              <div className="flex -space-x-2">
                {[ListCollapse, Megaphone, Languages].map((I, i) => (
                  <span key={i} className="flex size-9 items-center justify-center rounded-full border-2 border-background bg-card shadow-xs">
                    <I className="size-4 text-muted-foreground" />
                  </span>
                ))}
              </div>
              <p className="text-sm font-medium">Prompts you send show up here</p>
              <p className="text-xs text-muted-foreground">Type <kbd className="rounded border bg-background px-1 font-mono">/</kbd> for commands or attach a file to start.</p>
            </div>
          ) : (
            history.map((e) => (
              <div key={e.id} className="group rounded-xl border bg-card p-3 shadow-xs animate-in fade-in-0 slide-in-from-bottom-2">
                <p className="line-clamp-4 text-sm whitespace-pre-wrap">{e.text || <span className="text-muted-foreground italic">Attachments only</span>}</p>
                {e.files.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {e.files.map((f) => (
                      <span key={f.id} className="inline-flex max-w-full items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                        <FileIcon type={f.type} className="size-3 shrink-0" /> <span className="truncate">{f.name}</span>
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span>{e.model}</span>·<span className="tabular-nums">{e.tokens.toLocaleString("en-US")} tokens</span>·
                  <span>{new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(e.at)}</span>
                  <span className="ml-auto flex gap-0.5">
                    <Button variant="ghost" size="icon-xs" aria-label="Copy prompt" onClick={() => copy(e)}>
                      {copied === e.id ? <Check className="text-emerald-600 dark:text-emerald-400" /> : <Copy />}
                    </Button>
                    <Button variant="ghost" size="xs" onClick={() => reuse(e)}>
                      <RotateCcw /> Reuse
                    </Button>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Composer */}
        <div className="relative rounded-[22px] bg-gradient-to-br from-[var(--chart-1)] via-[var(--chart-3)] to-[var(--chart-5)] p-px shadow-lg shadow-primary/5">
          {/* Slash menu */}
          {menu && (
            <div className="absolute inset-x-3 bottom-full z-20 mb-2 overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-xl animate-in fade-in-0 slide-in-from-bottom-1" role="listbox" aria-label="Commands">
              <div className="flex items-center gap-1.5 border-b px-3 py-2 text-xs text-muted-foreground">
                <Slash className="size-3" /> Commands {menu.query && <span>matching “{menu.query}”</span>}
              </div>
              {matches.length === 0 ? (
                <p className="px-3 py-3 text-sm text-muted-foreground">No command found. Keep typing or press Esc.</p>
              ) : (
                <div className="max-h-64 overflow-y-auto p-1">
                  {matches.map((c, i) => (
                    <button
                      key={c.cmd}
                      type="button"
                      role="option"
                      aria-selected={i === highlight}
                      onMouseDown={(ev) => ev.preventDefault()}
                      onMouseEnter={() => setHighlight(i)}
                      onClick={() => pick(c)}
                      className={cn("flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left", i === highlight && "bg-accent text-accent-foreground")}
                    >
                      <span className="flex size-8 items-center justify-center rounded-md border bg-background"><c.icon className="size-4" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">{c.label}</span>
                        <span className="block truncate text-xs text-muted-foreground">{c.hint}</span>
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">/{c.cmd}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="rounded-[21px] bg-card">
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 px-3 pt-3">
                {files.map((f) => (
                  <span key={f.id} className="group/chip inline-flex max-w-[220px] items-center gap-2 rounded-lg border bg-background py-1 pr-1 pl-1.5 animate-in fade-in-0 zoom-in-95">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"><FileIcon type={f.type} className="size-3.5" /></span>
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-medium">{f.name}</span>
                      <span className="block text-[10px] text-muted-foreground">{fmtSize(f.size)}</span>
                    </span>
                    <button type="button" aria-label={`Remove ${f.name}`} onClick={() => setFiles((l) => l.filter((x) => x.id !== f.id))} className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                      <X className="size-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <label htmlFor="pc-input" className="sr-only">Prompt</label>
            <textarea
              id="pc-input"
              ref={area}
              rows={2}
              value={value}
              placeholder="Ask anything about your bookings, or type / for commands…"
              onChange={(e) => {
                setValue(e.target.value)
                detect(e.target.value, e.target.selectionStart)
              }}
              onClick={(e) => detect(e.currentTarget.value, e.currentTarget.selectionStart)}
              onBlur={() => setMenu(null)}
              onKeyDown={(e) => {
                if (menu && matches.length) {
                  if (e.key === "ArrowDown") { e.preventDefault(); setHighlight((h) => (h + 1) % matches.length); return }
                  if (e.key === "ArrowUp") { e.preventDefault(); setHighlight((h) => (h - 1 + matches.length) % matches.length); return }
                  if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); pick(matches[Math.min(highlight, matches.length - 1)]!); return }
                }
                if (menu && e.key === "Escape") { e.preventDefault(); setMenu(null); return }
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault()
                  submit()
                }
              }}
              className="block w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground"
            />

            <div className="flex flex-wrap items-center gap-1.5 px-2.5 pb-2.5">
              <input ref={fileInput} type="file" multiple className="hidden" aria-hidden tabIndex={-1} onChange={(e) => addFiles(e.target.files)} />
              <Button variant="ghost" size="icon-sm" aria-label="Attach files" onClick={() => fileInput.current?.click()}>
                <Paperclip />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Open command menu"
                onClick={() => {
                  const el = area.current
                  const pos = el ? el.selectionStart : value.length
                  const needsSpace = pos > 0 && !/\s/.test(value.charAt(pos - 1))
                  const next = value.slice(0, pos) + (needsSpace ? " /" : "/") + value.slice(pos)
                  caret.current = pos + (needsSpace ? 2 : 1)
                  setValue(next)
                  setMenu({ start: pos + (needsSpace ? 1 : 0), query: "" })
                  setHighlight(0)
                }}
              >
                <Slash />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
                  <Sparkles className="size-3.5 text-primary" /> {model.name} <ChevronDown className="size-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-60">
                  <DropdownMenuLabel>Model</DropdownMenuLabel>
                  {MODELS.map((m) => (
                    <DropdownMenuItem key={m.id} onClick={() => setModel(m)}>
                      <div className="flex-1">
                        <div className="text-sm">{m.name}</div>
                        <div className="text-xs text-muted-foreground">{m.context}</div>
                      </div>
                      {m.id === model.id && <Check className="text-primary" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="ml-auto flex items-center gap-3">
                <span className={cn("hidden text-[11px] tabular-nums sm:inline", over ? "font-medium text-destructive" : "text-muted-foreground")} aria-live="polite">
                  {value.length.toLocaleString("en-US")}/{LIMIT.toLocaleString("en-US")} · ~{tokens.toLocaleString("en-US")} tokens
                </span>
                <CharRing used={value.length} />
                <Button size="icon" className="rounded-xl" disabled={!canSend} onClick={submit} aria-label="Send prompt">
                  <ArrowUp />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1"><kbd className="inline-flex items-center rounded border bg-muted px-1 py-px"><CornerDownLeft className="size-3" /></kbd> Send</span>
          <span className="inline-flex items-center gap-1"><kbd className="rounded border bg-muted px-1 py-px font-mono">Shift</kbd>+<kbd className="inline-flex items-center rounded border bg-muted px-1 py-px"><CornerDownLeft className="size-3" /></kbd> New line</span>
          <span className="inline-flex items-center gap-1"><kbd className="rounded border bg-muted px-1 py-px font-mono">/</kbd> Commands</span>
          <span className="sm:hidden">{value.length}/{LIMIT} · ~{tokens} tokens</span>
        </div>
      </div>
    </div>
  )
}

function CharRing({ used }: { used: number }) {
  const pct = Math.min(1, used / LIMIT)
  const r = 9
  const c = 2 * Math.PI * r
  const color = used > LIMIT ? "var(--destructive)" : pct > 0.8 ? "#f59e0b" : "var(--primary)"
  return (
    <svg viewBox="0 0 24 24" className="size-6 -rotate-90" role="img" aria-label={`${Math.round(pct * 100)}% of character limit used`}>
      <circle cx="12" cy="12" r={r} fill="none" stroke="var(--border)" strokeWidth="3" />
      <circle cx="12" cy="12" r={r} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} className="transition-all duration-300" />
    </svg>
  )
}

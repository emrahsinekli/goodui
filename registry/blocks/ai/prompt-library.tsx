"use client"

import * as React from "react"
import { Braces, Check, Copy, FolderOpen, Plus, Search, Send, Star, Tag, Trash2, Undo2 } from "lucide-react"
import { Badge } from "@/registry/components/core/badge"
import { Button } from "@/registry/components/core/button"
import { Dialog } from "@/registry/components/core/dialog"
import { Input } from "@/registry/components/core/input"
import { cn } from "@/lib/utils"

/* ---------- Demo data ---------- */

type Prompt = { id: string; title: string; folder: string; tags: string[]; body: string; uses: number; starred: boolean; version: number; updated: string }
const FOLDERS = ["Client messages", "Marketing", "Internal", "Support"]
const INITIAL: Prompt[] = [
  { id: "p1", title: "Rebooking nudge", folder: "Client messages", tags: ["sms", "retention"], body: "Write a warm, 2-sentence SMS to {{client_name}} who last visited {{weeks_since}} weeks ago for a {{service}}. Mention that {{stylist}} has openings this week. No emojis, no discount.", uses: 412, starred: true, version: 3, updated: "2 days ago" },
  { id: "p2", title: "Review reply (negative)", folder: "Support", tags: ["reviews", "tone"], body: "Reply to this {{rating}}-star review from {{client_name}} in a calm, accountable tone. Acknowledge the specific issue, avoid excuses, invite them to contact {{owner_name}} directly. Max 80 words.\n\nReview: {{review_text}}", uses: 188, starred: true, version: 5, updated: "Yesterday" },
  { id: "p3", title: "Instagram caption", folder: "Marketing", tags: ["social"], body: "Write 3 Instagram caption options for a photo of a {{service}} by {{stylist}}. Playful but not cringe, one line each, include 5 niche hashtags for a salon in {{city}}.", uses: 96, starred: false, version: 2, updated: "1 week ago" },
  { id: "p4", title: "Aftercare email", folder: "Client messages", tags: ["email"], body: "Draft a short aftercare email for {{client_name}} after a {{service}}. Include 3 bullet tips, the recommended products {{products}}, and when to book the next visit.", uses: 240, starred: false, version: 1, updated: "3 weeks ago" },
  { id: "p5", title: "Shift swap announcement", folder: "Internal", tags: ["team"], body: "Write a friendly team message announcing that {{stylist}} is off on {{date}} and asking who can cover the {{shift}} shift. Keep it under 50 words.", uses: 31, starred: false, version: 1, updated: "1 month ago" },
  { id: "p6", title: "Google Business post", folder: "Marketing", tags: ["social", "seo"], body: "Write a 60-word Google Business Profile post promoting {{offer}} valid until {{date}}. End with a clear call to book at {{url}}.", uses: 58, starred: false, version: 2, updated: "5 days ago" },
]
const VARS = (body: string) => Array.from(new Set(Array.from(body.matchAll(/{{(\w+)}}/g), (m) => m[1]!)))

/* ---------- Block ---------- */

export default function PromptLibrary() {
  const [prompts, setPrompts] = React.useState<Prompt[]>(INITIAL)
  const [folder, setFolder] = React.useState<string>("All")
  const [query, setQuery] = React.useState("")
  const [onlyStarred, setOnlyStarred] = React.useState(false)
  const [openId, setOpenId] = React.useState<string | null>(null)
  const [values, setValues] = React.useState<Record<string, string>>({})
  const [copied, setCopied] = React.useState(false)
  const [sent, setSent] = React.useState(false)
  const [creating, setCreating] = React.useState(false)
  const [draft, setDraft] = React.useState({ title: "", body: "", folder: FOLDERS[0]! })
  const [removed, setRemoved] = React.useState<{ p: Prompt; index: number } | null>(null)

  const visible = prompts.filter((p) => (folder === "All" || p.folder === folder) && (!onlyStarred || p.starred) && (p.title + p.body + p.tags.join(" ")).toLowerCase().includes(query.toLowerCase()))
  const current = prompts.find((p) => p.id === openId) ?? null
  const vars = current ? VARS(current.body) : []
  const filled = current ? current.body.replace(/{{(\w+)}}/g, (_, k: string) => values[k] || `{{${k}}}`) : ""
  const missing = vars.filter((v) => !values[v])

  const open = (p: Prompt) => {
    setOpenId(p.id)
    setValues({})
    setCopied(false)
    setSent(false)
  }
  const copy = () => {
    void navigator.clipboard?.writeText(filled)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }
  const use = () => {
    if (!current) return
    setPrompts((all) => all.map((p) => (p.id === current.id ? { ...p, uses: p.uses + 1 } : p)))
    setSent(true)
  }
  const toggleStar = (id: string) => setPrompts((all) => all.map((p) => (p.id === id ? { ...p, starred: !p.starred } : p)))
  const remove = (p: Prompt) => {
    const index = prompts.findIndex((x) => x.id === p.id)
    setRemoved({ p, index })
    setPrompts(prompts.filter((x) => x.id !== p.id))
    setOpenId(null)
    window.setTimeout(() => setRemoved((r) => (r?.p.id === p.id ? null : r)), 6000)
  }
  const create = () => {
    if (!draft.title.trim() || !draft.body.trim()) return
    setPrompts([{ id: `n${prompts.length + 1}-${draft.title.length}`, title: draft.title.trim(), folder: draft.folder, tags: [], body: draft.body, uses: 0, starred: false, version: 1, updated: "Just now" }, ...prompts])
    setDraft({ title: "", body: "", folder: FOLDERS[0]! })
    setCreating(false)
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-[220px_1fr]">
        {/* Folders */}
        <aside className="space-y-1">
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="font-heading text-lg font-semibold tracking-tight">Prompts</h2>
            <Button size="xs" iconOnly aria-label="New prompt" onClick={() => setCreating(true)}>
              <Plus />
            </Button>
          </div>
          {["All", ...FOLDERS].map((f) => {
            const n = f === "All" ? prompts.length : prompts.filter((p) => p.folder === f).length
            return (
              <button key={f} type="button" aria-pressed={folder === f} onClick={() => setFolder(f)} className={cn("flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors", folder === f ? "bg-muted font-medium" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground")}>
                <FolderOpen className="size-4" />
                <span className="flex-1 text-left">{f}</span>
                <span className="text-xs tabular-nums opacity-60">{n}</span>
              </button>
            )
          })}
          <button type="button" aria-pressed={onlyStarred} onClick={() => setOnlyStarred((s) => !s)} className={cn("mt-2 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors", onlyStarred ? "bg-amber-500/15 font-medium text-amber-800 dark:text-amber-300" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground")}>
            <Star className={cn("size-4", onlyStarred && "fill-current")} />
            <span className="flex-1 text-left">Starred</span>
            <span className="text-xs tabular-nums opacity-60">{prompts.filter((p) => p.starred).length}</span>
          </button>
          <div aria-live="polite" className="pt-2">
            {removed && (
              <div className="rounded-lg border border-dashed p-2 text-xs">
                Deleted “{removed.p.title}”.
                <Button
                  size="xs"
                  variant="link"
                  iconLeft={<Undo2 />}
                  className="ml-1"
                  onClick={() => {
                    const next = [...prompts]
                    next.splice(removed.index, 0, removed.p)
                    setPrompts(next)
                    setRemoved(null)
                  }}
                >
                  Undo
                </Button>
              </div>
            )}
          </div>
        </aside>

        {/* Grid */}
        <div className="min-w-0">
          <Input label="Search prompts" labelMode="none" leading={<Search />} placeholder="Search titles, text or tags…" value={query} onValueChange={setQuery} clearable fullWidth />
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((p) => (
              <article key={p.id} className="group relative flex flex-col rounded-2xl border bg-card p-4 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0">
                <div className="flex items-start justify-between gap-2">
                  <button type="button" onClick={() => open(p)} className="text-left font-medium hover:underline">
                    {p.title}
                  </button>
                  <button type="button" aria-label={p.starred ? "Unstar" : "Star"} aria-pressed={p.starred} onClick={() => toggleStar(p.id)} className={cn("rounded p-0.5 transition-colors", p.starred ? "text-amber-500" : "text-muted-foreground/50 hover:text-amber-500")}>
                    <Star className={cn("size-4", p.starred && "fill-current")} />
                  </button>
                </div>
                <p className="mt-2 line-clamp-3 font-mono text-xs leading-relaxed text-muted-foreground">
                  {p.body.split(/({{\w+}})/g).map((part, i) => (part.startsWith("{{") ? <span key={i} className="rounded bg-primary/10 px-1 text-primary">{part.slice(2, -2)}</span> : part))}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {p.tags.map((t) => (
                    <Badge key={t} variant="soft" tone="neutral" size="xs" icon={<Tag />}>
                      {t}
                    </Badge>
                  ))}
                  <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Braces className="size-3" /> {VARS(p.body).length}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t pt-3 text-[11px] text-muted-foreground">
                  <span>
                    v{p.version} · {p.updated}
                  </span>
                  <span className="tabular-nums">{p.uses} uses</span>
                </div>
                <button type="button" onClick={() => open(p)} className="absolute inset-0 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Open ${p.title}`} tabIndex={-1} />
              </article>
            ))}
            {visible.length === 0 && <div className="col-span-full rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">No prompts here yet.</div>}
          </div>
        </div>
      </div>

      {/* Use dialog */}
      <Dialog
        open={!!current}
        onOpenChange={(o) => !o && setOpenId(null)}
        title={current?.title}
        description={current ? `${current.folder} · v${current.version} · ${current.uses} uses` : undefined}
        icon={<Braces />}
        size="lg"
        mobile="sheet"
        footer={({ close }) => (
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <Button size="sm" variant="ghost" tone="danger" iconLeft={<Trash2 />} onClick={() => current && remove(current)}>
              Delete
            </Button>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" tone="neutral" iconLeft={copied ? <Check /> : <Copy />} onClick={copy}>
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button size="sm" iconLeft={sent ? <Check /> : <Send />} tone={sent ? "success" : "primary"} onClick={sent ? close : use} disabled={missing.length > 0}>
                {sent ? "Sent to chat" : "Use prompt"}
              </Button>
            </div>
          </div>
        )}
      >
        {current && (
          <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
            <div className="space-y-3">
              <div className="text-xs font-medium text-muted-foreground">Fill in {vars.length} variables</div>
              {vars.map((v) => (
                <Input key={v} size="sm" label={v.replace(/_/g, " ")} value={values[v] ?? ""} onValueChange={(val) => setValues({ ...values, [v]: val })} placeholder={`{{${v}}}`} fullWidth />
              ))}
              {vars.length === 0 && <p className="text-xs text-muted-foreground">No variables in this prompt.</p>}
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground">Preview</div>
              <pre className="mt-1 max-h-72 overflow-auto whitespace-pre-wrap rounded-xl border bg-muted/40 p-3 font-mono text-xs leading-relaxed">
                {filled.split(/({{\w+}})/g).map((part, i) => (part.startsWith("{{") ? <mark key={i} className="rounded bg-amber-500/20 px-1 text-amber-900 dark:text-amber-200">{part}</mark> : part))}
              </pre>
              {missing.length > 0 && <p className="mt-2 text-xs text-muted-foreground">{missing.length} to fill before sending.</p>}
            </div>
          </div>
        )}
      </Dialog>

      {/* New prompt */}
      <Dialog open={creating} onOpenChange={setCreating} title="New prompt" description="Use {{variable}} for anything that changes per use." icon={<Plus />} mobile="sheet" onConfirm={create} closeOnConfirm={false} confirmText="Save prompt">
        <div className="grid gap-3">
          <Input label="Title" value={draft.title} onValueChange={(v) => setDraft({ ...draft, title: v })} placeholder="e.g. Waitlist opening SMS" fullWidth autoFocus />
          <div className="flex flex-wrap gap-1.5">
            {FOLDERS.map((f) => (
              <button key={f} type="button" aria-pressed={draft.folder === f} onClick={() => setDraft({ ...draft, folder: f })} className={cn("rounded-full border px-2.5 py-1 text-xs font-medium", draft.folder === f ? "border-foreground bg-foreground text-background" : "text-foreground/70")}>
                {f}
              </button>
            ))}
          </div>
          <Input label="Prompt" multiline rows={5} value={draft.body} onValueChange={(v) => setDraft({ ...draft, body: v })} placeholder="Write a short SMS to {{client_name}}…" fullWidth className="font-mono text-xs" />
          <p className="text-xs text-muted-foreground">
            Variables detected: {VARS(draft.body).length ? VARS(draft.body).join(", ") : "none"}
          </p>
        </div>
      </Dialog>
    </div>
  )
}

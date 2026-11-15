"use client"

import * as React from "react"
import { AlertTriangle, Check, Download, FileSpreadsheet, Loader2, Pause, Play, RotateCcw, Users, X } from "lucide-react"
import { Badge } from "@/registry/components/core/badge"
import { Button } from "@/registry/components/core/button"
import { Dialog } from "@/registry/components/core/dialog"
import { NumberFlow } from "@/registry/components/numbers/number-flow"
import { Progress } from "@/registry/components/numbers/progress"
import { SuccessCheck } from "@/registry/components/feedback/success-check"
import { cn } from "@/lib/utils"

/* ---------- Demo data ---------- */

const TOTAL = 1240
const STAGES = [
  { id: "read", label: "Reading clients.csv", at: 0 },
  { id: "validate", label: "Validating rows", at: 0.12 },
  { id: "dedupe", label: "Merging duplicates", at: 0.35 },
  { id: "import", label: "Importing clients", at: 0.5 },
  { id: "history", label: "Attaching visit history", at: 0.82 },
  { id: "index", label: "Rebuilding search", at: 0.95 },
]
const WARNINGS = [
  { row: 118, issue: "Phone number missing a country code", fix: "Assumed +1" },
  { row: 342, issue: "Email “maya@@lumen.co” is invalid", fix: "Left empty" },
  { row: 507, issue: "Duplicate of row 211 (same phone)", fix: "Merged" },
  { row: 913, issue: "Last visit date in the future", fix: "Cleared" },
]
const NAMES = ["Grace Kim", "Daniel Ortiz", "Mia Rossi", "Noah Fischer", "Aisha Rahman", "Leo Park", "Priya Nair", "Sam Okafor", "Lena Weber", "Omar Haddad", "Chloé Bernard", "Ethan Brooks"]

/* ---------- Block ---------- */

export default function ImportProgress() {
  const [count, setCount] = React.useState(0)
  const [running, setRunning] = React.useState(true)
  const [cancelAsk, setCancelAsk] = React.useState(false)
  const [cancelled, setCancelled] = React.useState(false)
  const [run, setRun] = React.useState(0)

  const pct = Math.min(100, Math.round((count / TOTAL) * 100))
  const done = count >= TOTAL
  const stageIdx = STAGES.reduce((acc, s, i) => (count / TOTAL >= s.at ? i : acc), 0)
  const warnings = WARNINGS.filter((w) => w.row <= count)
  const merged = count > 507 ? 18 : count > 211 ? 6 : 0
  const recent = NAMES.slice(0, Math.min(NAMES.length, Math.floor(count / 100) + 1)).slice(-4).reverse()

  React.useEffect(() => {
    if (!running || done || cancelled) return
    const id = window.setInterval(() => setCount((c) => Math.min(TOTAL, c + 7 + ((c * 13) % 9))), 60)
    return () => window.clearInterval(id)
  }, [running, done, cancelled])

  const restart = () => {
    setCount(0)
    setCancelled(false)
    setRunning(true)
    setRun((r) => r + 1)
  }
  const downloadReport = () => {
    const csv = ["row,issue,fix", ...WARNINGS.map((w) => `${w.row},"${w.issue}","${w.fix}"`)].join("\n")
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
    const a = document.createElement("a")
    a.href = url
    a.download = "import-warnings.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 md:p-6">
      <section className="mx-auto max-w-4xl overflow-hidden rounded-3xl border bg-card">
        <div className="flex items-center gap-3 border-b px-5 py-4">
          <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"><FileSpreadsheet className="size-5" /></span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-sm font-semibold">clients.csv <Badge size="xs" variant="soft" tone="neutral">{TOTAL.toLocaleString("en-US")} rows · 212 KB</Badge></div>
            <div className="text-xs text-muted-foreground">{cancelled ? "Import cancelled. Nothing was changed." : done ? "Import finished" : running ? `${STAGES[stageIdx]?.label}…` : "Paused"}</div>
          </div>
          {!done && !cancelled && (
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" tone="neutral" iconLeft={running ? <Pause /> : <Play />} onClick={() => setRunning((r) => !r)}>{running ? "Pause" : "Resume"}</Button>
              <Button size="sm" variant="ghost" tone="danger" iconLeft={<X />} onClick={() => setCancelAsk(true)}>Cancel</Button>
            </div>
          )}
          {(done || cancelled) && <Button size="sm" variant="outline" tone="neutral" iconLeft={<RotateCcw />} onClick={restart}>Run again</Button>}
        </div>

        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_280px]">
          <div className="flex flex-col gap-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-xs text-muted-foreground">Imported</div>
                <div className="flex items-baseline gap-1 text-4xl font-semibold tracking-tight tabular-nums">
                  <NumberFlow value={count} /> <span className="text-base text-muted-foreground">/ {TOTAL.toLocaleString("en-US")}</span>
                </div>
              </div>
              <div className="text-end">
                <div className="text-xs text-muted-foreground">{done ? "Took" : "Time left"}</div>
                <div className="text-lg font-medium tabular-nums">{done ? "1m 12s" : cancelled ? "—" : `${Math.max(1, Math.round(((TOTAL - count) / TOTAL) * 72))}s`}</div>
              </div>
            </div>
            <Progress value={pct} variant={done || cancelled ? "determinate" : "striped"} showValue size="lg" label="Overall progress" indicatorClassName={cn(done && "bg-emerald-500", cancelled && "bg-muted-foreground")} />
            <ol className="grid gap-2 sm:grid-cols-2">
              {STAGES.map((s, i) => {
                const state = cancelled && i > stageIdx ? "skipped" : done || i < stageIdx ? "done" : i === stageIdx ? (running && !cancelled ? "active" : "paused") : "todo"
                return (
                  <li key={s.id} className={cn("flex items-center gap-2.5 rounded-xl border px-3 py-2 text-sm transition-colors", state === "active" && "border-primary/40 bg-primary/5", state === "done" && "text-muted-foreground")}>
                    <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full", state === "done" ? "bg-emerald-500 text-white" : state === "active" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                      {state === "done" ? <Check className="size-3.5" /> : state === "active" ? <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" /> : <span className="text-[11px]">{i + 1}</span>}
                    </span>
                    <span className={cn(state === "done" && "line-through decoration-muted-foreground/40")}>{s.label}</span>
                  </li>
                )
              })}
            </ol>
            {done && (
              <div className="flex animate-in items-center gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 fade-in slide-in-from-bottom-2">
                <SuccessCheck size={44} />
                <div className="text-sm">
                  <div className="font-semibold">{(TOTAL - merged).toLocaleString("en-US")} clients imported</div>
                  <div className="text-muted-foreground">{merged} duplicates merged, {WARNINGS.length} rows fixed automatically.</div>
                </div>
                <Button size="sm" className="ms-auto" iconLeft={<Users />} onClick={restart}>Open clients</Button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border bg-muted/30 p-3">
              <div className="flex items-center justify-between text-xs font-medium"><span>Just imported</span><span className="text-muted-foreground tabular-nums">{merged} merged</span></div>
              <ul className="mt-2 flex min-h-[7.5rem] flex-col gap-1.5" aria-live="polite" key={run}>
                {recent.map((n) => (
                  <li key={n} className="flex animate-in items-center gap-2 rounded-lg bg-card px-2 py-1.5 text-xs shadow-xs fade-in slide-in-from-top-1">
                    <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">{n.split(" ").map((p) => p[0]).join("")}</span>
                    {n}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border p-3">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="flex items-center gap-1.5"><AlertTriangle className="size-3.5 text-amber-500" /> Fixed on the way</span>
                <Badge size="xs" variant="soft" tone="warning">{warnings.length}</Badge>
              </div>
              <ul className="mt-2 flex flex-col gap-1.5 text-xs">
                {warnings.length ? warnings.map((w) => (
                  <li key={w.row} className="animate-in rounded-lg bg-muted/50 px-2 py-1.5 fade-in">
                    <span className="font-mono text-muted-foreground">Row {w.row}</span> · {w.issue} <span className="text-emerald-700 dark:text-emerald-300">→ {w.fix}</span>
                  </li>
                )) : <li className="text-muted-foreground">Nothing so far.</li>}
              </ul>
              {warnings.length > 0 && <Button size="xs" variant="ghost" tone="neutral" className="mt-2" iconLeft={<Download />} onClick={downloadReport}>Download report</Button>}
            </div>
          </div>
        </div>
      </section>

      <Dialog
        open={cancelAsk}
        onOpenChange={setCancelAsk}
        role="alertdialog"
        tone="danger"
        title="Cancel the import?"
        description={`${count.toLocaleString("en-US")} rows have been read. Nothing is saved until the import finishes, so cancelling leaves your clients exactly as they were.`}
        confirmText="Cancel import"
        cancelText="Keep going"
        confirmTone="danger"
        size="sm"
        onConfirm={() => { setCancelled(true); setRunning(false) }}
      />
    </div>
  )
}

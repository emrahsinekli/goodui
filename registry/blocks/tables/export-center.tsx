"use client"

import * as React from "react"
import { CalendarClock, Check, Download, FileJson, FileSpreadsheet, FileText, Plus, RefreshCw, Trash2, Undo2, X } from "lucide-react"
import { Badge } from "@/registry/components/core/badge"
import { Button } from "@/registry/components/core/button"
import { Checkbox } from "@/registry/components/core/checkbox"
import { Dialog } from "@/registry/components/core/dialog"
import { Select } from "@/registry/components/core/select"
import { Switch } from "@/registry/components/core/switch"
import { Progress } from "@/registry/components/numbers/progress"
import { cn } from "@/lib/utils"

/* ---------- Demo data ---------- */

type Format = "csv" | "xlsx" | "json" | "pdf"
type Job = { id: string; name: string; source: string; format: Format; rows: number; size: string; status: "queued" | "running" | "ready" | "failed" | "expired"; progress: number; created: string; expires: string; columns: string[] }
type Schedule = { id: string; name: string; source: string; format: Format; cadence: string; to: string; enabled: boolean; next: string }
const FMT: Record<Format, { label: string; icon: React.ReactNode }> = {
  csv: { label: "CSV", icon: <FileText /> },
  xlsx: { label: "Excel", icon: <FileSpreadsheet /> },
  json: { label: "JSON", icon: <FileJson /> },
  pdf: { label: "PDF", icon: <FileText /> },
}
const SOURCES = [
  { value: "bookings", label: "Bookings" },
  { value: "clients", label: "Clients" },
  { value: "payments", label: "Payments" },
  { value: "reviews", label: "Reviews" },
]
const COLUMNS: Record<string, string[]> = {
  bookings: ["id", "client", "stylist", "service", "starts_at", "status", "total", "tip", "rating"],
  clients: ["id", "name", "email", "phone", "tags", "lifetime_value", "last_visit", "consent_marketing"],
  payments: ["id", "booking_id", "method", "amount", "fee", "net", "paid_at"],
  reviews: ["id", "client", "rating", "source", "text", "reply", "created_at"],
}
const INITIAL_JOBS: Job[] = [
  { id: "e1", name: "Bookings · Feb 2026", source: "bookings", format: "xlsx", rows: 2140, size: "412 kB", status: "ready", progress: 100, created: "Today 09:12", expires: "in 6 days", columns: COLUMNS.bookings! },
  { id: "e2", name: "Clients · marketing consent", source: "clients", format: "csv", rows: 4810, size: "—", status: "running", progress: 46, created: "Just now", expires: "—", columns: ["name", "email", "consent_marketing"] },
  { id: "e3", name: "Payments · Q4 2025", source: "payments", format: "csv", rows: 7980, size: "1.1 MB", status: "ready", progress: 100, created: "Yesterday", expires: "in 5 days", columns: COLUMNS.payments! },
  { id: "e4", name: "Reviews · all time", source: "reviews", format: "json", rows: 0, size: "—", status: "failed", progress: 12, created: "2 days ago", expires: "—", columns: COLUMNS.reviews! },
  { id: "e5", name: "Bookings · Jan 2026", source: "bookings", format: "pdf", rows: 1980, size: "2.4 MB", status: "expired", progress: 100, created: "3 weeks ago", expires: "expired", columns: COLUMNS.bookings! },
]
const INITIAL_SCHEDULES: Schedule[] = [
  { id: "s1", name: "Weekly bookings to accountant", source: "bookings", format: "xlsx", cadence: "Every Monday 07:00", to: "books@studionine.com", enabled: true, next: "Mon 16 Mar" },
  { id: "s2", name: "Monthly client list to Mailchimp", source: "clients", format: "csv", cadence: "1st of month", to: "SFTP · mailchimp-sync", enabled: false, next: "1 Apr" },
]

/* ---------- Block ---------- */

export default function ExportCenter() {
  const [jobs, setJobs] = React.useState(INITIAL_JOBS)
  const [schedules, setSchedules] = React.useState(INITIAL_SCHEDULES)
  const [newOpen, setNewOpen] = React.useState(false)
  const [source, setSource] = React.useState("bookings")
  const [format, setFormat] = React.useState<Format>("csv")
  const [cols, setCols] = React.useState<string[]>(COLUMNS.bookings!)
  const [range, setRange] = React.useState("30d")
  const [removed, setRemoved] = React.useState<{ job: Job; index: number } | null>(null)
  const timers = React.useRef<number[]>([])
  React.useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  // Advance running exports.
  React.useEffect(() => {
    if (!jobs.some((j) => j.status === "running")) return
    const t = window.setTimeout(() => {
      setJobs((all) =>
        all.map((j) => {
          if (j.status !== "running") return j
          const p = Math.min(100, j.progress + 9)
          return p >= 100 ? { ...j, status: "ready", progress: 100, size: `${Math.round(j.rows * 0.09)} kB`, expires: "in 7 days" } : { ...j, progress: p }
        }),
      )
    }, 450)
    return () => window.clearTimeout(t)
  }, [jobs])

  const download = (j: Job) => {
    const body = j.format === "json" ? JSON.stringify([{ id: "demo", note: "sample export" }], null, 2) : `${j.columns.join(",")}\n${j.columns.map(() => "sample").join(",")}`
    const url = URL.createObjectURL(new Blob([body], { type: j.format === "json" ? "application/json" : "text/csv" }))
    const a = document.createElement("a")
    a.href = url
    a.download = `${j.name.replace(/[^\w]+/g, "-").toLowerCase()}.${j.format === "xlsx" ? "csv" : j.format}`
    a.click()
    URL.revokeObjectURL(url)
  }
  const retry = (id: string) => setJobs((all) => all.map((j) => (j.id === id ? { ...j, status: "running", progress: 5, rows: 1120 } : j)))
  const remove = (j: Job) => {
    const index = jobs.findIndex((x) => x.id === j.id)
    setRemoved({ job: j, index })
    setJobs(jobs.filter((x) => x.id !== j.id))
    timers.current.push(window.setTimeout(() => setRemoved((r) => (r?.job.id === j.id ? null : r)), 6000))
  }
  const create = () => {
    const src = SOURCES.find((s) => s.value === source)!
    setJobs([{ id: `n${jobs.length}-${cols.length}`, name: `${src.label} · ${range === "30d" ? "last 30 days" : range === "90d" ? "last 90 days" : "all time"}`, source, format, rows: range === "all" ? 18420 : range === "90d" ? 5410 : 1860, size: "—", status: "running", progress: 3, created: "Just now", expires: "—", columns: cols }, ...jobs])
    setNewOpen(false)
  }
  const changeSource = (v: string | null) => {
    if (!v) return
    setSource(v)
    setCols(COLUMNS[v] ?? [])
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-xl font-semibold tracking-tight">Export center</h2>
            <p className="text-sm text-muted-foreground">Files are ready in under a minute and kept for 7 days.</p>
          </div>
          <Button size="sm" iconLeft={<Plus />} onClick={() => setNewOpen(true)}>
            New export
          </Button>
        </div>

        <div aria-live="polite" className="mt-3">
          {removed && (
            <div className="flex items-center justify-between rounded-xl border border-dashed px-3 py-2 text-sm">
              Deleted “{removed.job.name}”.
              <Button
                size="xs"
                variant="soft"
                tone="neutral"
                iconLeft={<Undo2 />}
                onClick={() => {
                  const next = [...jobs]
                  next.splice(removed.index, 0, removed.job)
                  setJobs(next)
                  setRemoved(null)
                }}
              >
                Undo
              </Button>
            </div>
          )}
        </div>

        {/* Jobs */}
        <ul className="mt-3 space-y-2">
          {jobs.map((j) => (
            <li key={j.id} className={cn("flex flex-wrap items-center gap-3 rounded-2xl border bg-card px-4 py-3 shadow-xs", j.status === "expired" && "saturate-50 bg-muted/40 [&_.text-muted-foreground]:text-foreground/70")}>
              <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl [&_svg]:size-5", j.format === "xlsx" ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300" : j.format === "json" ? "bg-amber-500/15 text-amber-800 dark:text-amber-300" : j.format === "pdf" ? "bg-rose-500/15 text-rose-800 dark:text-rose-300" : "bg-sky-500/15 text-sky-800 dark:text-sky-300")}>{FMT[j.format].icon}</span>
              <div className="min-w-0 flex-1 basis-56">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-medium">{j.name}</span>
                  <Badge variant="outline" tone="neutral" size="xs">
                    {FMT[j.format].label}
                  </Badge>
                  {j.status === "failed" && (
                    <Badge variant="soft" tone="danger" size="xs">
                      Failed
                    </Badge>
                  )}
                  {j.status === "expired" && (
                    <Badge variant="soft" tone="neutral" size="xs">
                      Expired
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {j.rows ? `${j.rows.toLocaleString("en-US")} rows · ` : ""}
                  {j.columns.length} columns · {j.created}
                  {j.status === "ready" && ` · ${j.size} · expires ${j.expires}`}
                </div>
                {j.status === "running" && <Progress value={j.progress} size="sm" className="mt-2 max-w-xs" label="Exporting" showValue />}
                {j.status === "failed" && <p className="mt-1 text-xs text-rose-800 dark:text-rose-400">Timed out reading reviews.text — try a smaller date range.</p>}
              </div>
              <div className="flex items-center gap-1.5">
                {j.status === "ready" && (
                  <Button size="sm" variant="soft" tone="primary" iconLeft={<Download />} onClick={() => download(j)}>
                    Download
                  </Button>
                )}
                {(j.status === "failed" || j.status === "expired") && (
                  <Button size="sm" variant="outline" tone="neutral" iconLeft={<RefreshCw />} onClick={() => retry(j.id)}>
                    {j.status === "failed" ? "Retry" : "Regenerate"}
                  </Button>
                )}
                {j.status === "running" && (
                  <Button size="sm" variant="ghost" tone="neutral" iconLeft={<X />} onClick={() => setJobs(jobs.filter((x) => x.id !== j.id))}>
                    Cancel
                  </Button>
                )}
                <Button size="xs" variant="ghost" tone="danger" iconOnly aria-label={`Delete ${j.name}`} onClick={() => remove(j)}>
                  <Trash2 />
                </Button>
              </div>
            </li>
          ))}
        </ul>

        {/* Schedules */}
        <h3 className="mt-6 flex items-center gap-2 text-sm font-medium">
          <CalendarClock className="size-4" /> Scheduled exports
        </h3>
        <ul className="mt-2 space-y-2">
          {schedules.map((s) => (
            <li key={s.id} className={cn("flex flex-wrap items-center gap-3 rounded-2xl border bg-card px-4 py-3 shadow-xs transition-opacity", !s.enabled && "saturate-50 bg-muted/40 [&_.text-muted-foreground]:text-foreground/70")}>
              <Switch size="sm" checked={s.enabled} onCheckedChange={(v) => setSchedules(schedules.map((x) => (x.id === s.id ? { ...x, enabled: v } : x)))} aria-label={`${s.name} enabled`} />
              <div className="min-w-0 flex-1 basis-56">
                <div className="truncate font-medium">{s.name}</div>
                <div className="text-xs text-muted-foreground">
                  {s.cadence} · {FMT[s.format].label} · to {s.to}
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{s.enabled ? `Next ${s.next}` : "Paused"}</span>
            </li>
          ))}
        </ul>
      </div>

      <Dialog open={newOpen} onOpenChange={setNewOpen} title="New export" description="Pick the data, columns and format." icon={<Download />} size="lg" mobile="sheet" onConfirm={create} confirmText="Start export">
        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="exp-source" className="mb-1.5 block text-sm font-medium">
                Data
              </label>
              <Select id="exp-source" options={SOURCES} value={source} onValueChange={changeSource} />
            </div>
            <div>
              <label htmlFor="exp-range" className="mb-1.5 block text-sm font-medium">
                Range
              </label>
              <Select id="exp-range" options={[{ value: "30d", label: "Last 30 days" }, { value: "90d", label: "Last 90 days" }, { value: "all", label: "All time" }]} value={range} onValueChange={(v) => v && setRange(v)} />
            </div>
          </div>
          <div>
            <div className="mb-1.5 text-sm font-medium">Format</div>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(FMT) as Format[]).map((f) => (
                <button key={f} type="button" aria-pressed={format === f} onClick={() => setFormat(f)} className={cn("flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-medium transition-colors [&_svg]:size-5", format === f ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted")}>
                  {FMT[f].icon}
                  {FMT[f].label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium">
                Columns <span className="text-muted-foreground">({cols.length})</span>
              </span>
              <button type="button" onClick={() => setCols(cols.length === (COLUMNS[source]?.length ?? 0) ? [] : (COLUMNS[source] ?? []))} className="text-xs text-primary hover:underline">
                {cols.length === (COLUMNS[source]?.length ?? 0) ? "Clear all" : "Select all"}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
              {(COLUMNS[source] ?? []).map((c) => (
                <Checkbox key={c} size="sm" checked={cols.includes(c)} onCheckedChange={(v) => setCols(v ? [...cols, c] : cols.filter((x) => x !== c))} label={<code className="font-mono text-xs">{c}</code>} />
              ))}
            </div>
          </div>
          <p className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            <Check className="size-3.5" /> PII columns are masked unless you have the Owner role.
          </p>
        </div>
      </Dialog>
    </div>
  )
}

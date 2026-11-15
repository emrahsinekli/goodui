"use client"

import * as React from "react"
import { Check, ChevronRight, CircleDot, Clock, Database, FlaskConical, Plus, Rocket, Terminal, X, XCircle } from "lucide-react"
import { Badge } from "@/registry/components/core/badge"
import { Button } from "@/registry/components/core/button"
import { Dialog } from "@/registry/components/core/dialog"
import { Input } from "@/registry/components/core/input"
import { NumberInput } from "@/registry/components/core/number-input"
import { Select } from "@/registry/components/core/select"
import { Progress } from "@/registry/components/numbers/progress"
import { SparklineDraw } from "@/registry/components/numbers/sparkline-draw"
import { cn } from "@/lib/utils"

/* ---------- Demo data ---------- */

type Status = "queued" | "running" | "succeeded" | "failed" | "cancelled"
type Job = { id: string; name: string; base: string; dataset: string; examples: number; status: Status; progress: number; loss: number[]; started: string; duration?: string; cost: number; epochs: number; deployed?: boolean; error?: string }
const curve = (n: number, start: number, end: number, noise: number) => Array.from({ length: n }, (_, i) => Math.round((end + (start - end) * Math.exp(-i / (n / 3)) + Math.sin(i * 1.7) * noise) * 1000) / 1000)
const INITIAL: Job[] = [
  { id: "ft-0142", name: "receptionist-tone-v4", base: "Atlas Fast", dataset: "conversations-rated-4plus.jsonl", examples: 2140, status: "running", progress: 62, loss: curve(31, 1.92, 0.41, 0.04), started: "24 min ago", cost: 4.1, epochs: 3 },
  { id: "ft-0141", name: "receptionist-tone-v3", base: "Atlas Fast", dataset: "conversations-rated-4plus.jsonl", examples: 1860, status: "succeeded", progress: 100, loss: curve(50, 1.88, 0.47, 0.03), started: "Yesterday", duration: "41 min", cost: 6.8, epochs: 3, deployed: true },
  { id: "ft-0140", name: "review-replies-v2", base: "Nova 2", dataset: "review-replies-approved.jsonl", examples: 640, status: "failed", progress: 18, loss: curve(9, 2.1, 1.6, 0.08), started: "2 days ago", duration: "6 min", cost: 0.9, epochs: 2, error: "Validation failed on line 311: 'assistant' turn missing." },
  { id: "ft-0139", name: "upsell-suggestions-v1", base: "Atlas Fast", dataset: "checkout-addons.jsonl", examples: 980, status: "succeeded", progress: 100, loss: curve(50, 2.05, 0.62, 0.05), started: "5 days ago", duration: "28 min", cost: 3.3, epochs: 2 },
  { id: "ft-0138", name: "receptionist-tone-v2", base: "Atlas Fast", dataset: "conversations-rated-4plus.jsonl", examples: 1210, status: "cancelled", progress: 44, loss: curve(22, 1.9, 0.7, 0.05), started: "1 week ago", duration: "12 min", cost: 1.4, epochs: 3 },
]
const DATASETS = [
  { value: "conversations-rated-4plus.jsonl", label: "conversations-rated-4plus.jsonl · 2,140 rows" },
  { value: "review-replies-approved.jsonl", label: "review-replies-approved.jsonl · 640 rows" },
  { value: "checkout-addons.jsonl", label: "checkout-addons.jsonl · 980 rows" },
]
const STATUS: Record<Status, { label: string; tone: "info" | "success" | "danger" | "neutral" | "warning"; icon: React.ReactNode }> = {
  queued: { label: "Queued", tone: "neutral", icon: <Clock /> },
  running: { label: "Running", tone: "info", icon: <CircleDot /> },
  succeeded: { label: "Succeeded", tone: "success", icon: <Check /> },
  failed: { label: "Failed", tone: "danger", icon: <XCircle /> },
  cancelled: { label: "Cancelled", tone: "warning", icon: <X /> },
}
const LOGS = ["[00:00] Validating 2,140 examples… ok", "[00:04] Tokenizing (avg 412 tokens/example)", "[00:09] Epoch 1/3 started · lr 1.2e-5", "[13:40] Epoch 1 done · train loss 0.81 · val loss 0.86", "[13:41] Epoch 2/3 started", "[24:02] step 1300 · loss 0.44 · ETA 15 min"]

/* ---------- Block ---------- */

export default function FineTuneJobs() {
  const [jobs, setJobs] = React.useState<Job[]>(INITIAL)
  const [selected, setSelected] = React.useState<string>("ft-0142")
  const [filter, setFilter] = React.useState<"all" | "running" | "succeeded" | "failed">("all")
  const [createOpen, setCreateOpen] = React.useState(false)
  const [cancelId, setCancelId] = React.useState<string | null>(null)
  const [draft, setDraft] = React.useState({ name: "", base: "Atlas Fast", dataset: DATASETS[0]!.value, epochs: 3 as number | null })
  const [draftError, setDraftError] = React.useState<string | null>(null)

  // Simulated training progress for the running job.
  React.useEffect(() => {
    const t = window.setInterval(() => {
      setJobs((all) =>
        all.map((j) => {
          if (j.status !== "running") return j
          const progress = Math.min(100, j.progress + 1)
          const last = j.loss[j.loss.length - 1] ?? 0.5
          const loss = [...j.loss, Math.max(0.3, Math.round((last - 0.004 + Math.sin(j.loss.length) * 0.01) * 1000) / 1000)]
          return progress === 100 ? { ...j, progress, loss, status: "succeeded", duration: "39 min" } : { ...j, progress, loss }
        }),
      )
    }, 1500)
    return () => window.clearInterval(t)
  }, [])

  const visible = jobs.filter((j) => filter === "all" || j.status === filter)
  const job = jobs.find((j) => j.id === selected) ?? jobs[0]!
  const deploy = (id: string) => setJobs((all) => all.map((j) => ({ ...j, deployed: j.id === id })))
  const cancel = (id: string) => {
    setJobs((all) => all.map((j) => (j.id === id ? { ...j, status: "cancelled", duration: "25 min" } : j)))
    setCancelId(null)
  }
  const create = () => {
    if (!draft.name.trim()) return setDraftError("Name the job.")
    const ds = DATASETS.find((d) => d.value === draft.dataset)!
    const id = `ft-0${143 + jobs.filter((j) => j.id.startsWith("ft-0")).length - 5}`
    setJobs([{ id, name: draft.name.trim(), base: draft.base, dataset: ds.value, examples: Number(ds.label.match(/([\d,]+) rows/)?.[1]?.replace(",", "") ?? 0), status: "queued", progress: 0, loss: [], started: "Just now", cost: 0, epochs: draft.epochs ?? 3 }, ...jobs])
    setSelected(id)
    setCreateOpen(false)
    setDraft({ name: "", base: "Atlas Fast", dataset: DATASETS[0]!.value, epochs: 3 })
    setDraftError(null)
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-xl font-semibold tracking-tight">Fine-tuning jobs</h2>
            <p className="text-sm text-muted-foreground">Train on your own rated conversations. Deploy a model to any assistant in one click.</p>
          </div>
          <Button size="sm" iconLeft={<Plus />} onClick={() => setCreateOpen(true)}>
            New job
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* List */}
          <div>
            <div role="tablist" aria-label="Filter jobs" className="mb-3 flex w-fit rounded-lg bg-muted p-0.5 text-xs">
              {(["all", "running", "succeeded", "failed"] as const).map((k) => (
                <button key={k} role="tab" type="button" aria-selected={filter === k} onClick={() => setFilter(k)} className={cn("rounded-md px-3 py-1.5 font-medium capitalize transition-colors", filter === k ? "bg-background shadow-xs" : "text-foreground/70")}>
                  {k} {k !== "all" && <span className="tabular-nums opacity-60">{jobs.filter((j) => j.status === k).length}</span>}
                </button>
              ))}
            </div>
            <ul className="space-y-2">
              {visible.map((j) => {
                const st = STATUS[j.status]
                const active = selected === j.id
                return (
                  <li key={j.id}>
                    <button type="button" aria-pressed={active} onClick={() => setSelected(j.id)} className={cn("flex w-full items-center gap-3 rounded-2xl border bg-card p-4 text-left shadow-xs transition-all hover:border-foreground/30", active && "border-primary ring-1 ring-primary")}>
                      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl [&_svg]:size-4", j.status === "running" ? "bg-sky-500/15 text-sky-800 dark:text-sky-300" : j.status === "succeeded" ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300" : j.status === "failed" ? "bg-rose-500/15 text-rose-800 dark:text-rose-300" : "bg-muted text-muted-foreground")}>{st.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{j.name}</span>
                          <Badge variant="soft" tone={st.tone} size="xs" animation={j.status === "running" ? "pulse" : "none"}>
                            {st.label}
                          </Badge>
                          {j.deployed && (
                            <Badge variant="solid" tone="primary" size="xs" icon={<Rocket />}>
                              Live
                            </Badge>
                          )}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {j.id} · {j.base} · {j.examples.toLocaleString("en-US")} examples · {j.started}
                        </span>
                        {j.status === "running" && <Progress value={j.progress} size="sm" className="mt-2 max-w-sm" label="Training" showValue />}
                      </span>
                      <span className="hidden w-24 sm:block">
                        <SparklineDraw data={j.loss.length ? j.loss : [1, 1]} height={28} color={j.status === "failed" ? "oklch(0.6 0.2 25)" : "var(--chart-1)"} aria-label={`${j.name} loss curve`} />
                      </span>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    </button>
                  </li>
                )
              })}
              {visible.length === 0 && <li className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">No {filter} jobs.</li>}
            </ul>
          </div>

          {/* Detail */}
          <aside className="space-y-3 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border bg-card p-4 shadow-xs">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium">{job.name}</div>
                  <div className="text-xs text-muted-foreground">{job.id}</div>
                </div>
                <Badge variant="soft" tone={STATUS[job.status].tone} size="sm">
                  {STATUS[job.status].label}
                </Badge>
              </div>
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium">Training loss</span>
                  <span className="tabular-nums text-muted-foreground">{job.loss.length ? job.loss[job.loss.length - 1]?.toFixed(3) : "—"}</span>
                </div>
                <SparklineDraw data={job.loss.length > 1 ? job.loss : [1, 1]} height={72} area tooltip endDot color="var(--chart-1)" formatValue={(v) => v.toFixed(3)} aria-label="Training loss over steps" />
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <Meta k="Base model" v={job.base} />
                <Meta k="Epochs" v={`${job.epochs}`} />
                <Meta k="Dataset" v={job.dataset} />
                <Meta k="Cost so far" v={`$${job.cost.toFixed(2)}`} />
                {job.duration && <Meta k="Duration" v={job.duration} />}
              </dl>
              {job.error && (
                <div role="alert" className="mt-3 rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-800 dark:text-rose-300">
                  {job.error}
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {job.status === "succeeded" && (
                  <Button size="sm" iconLeft={job.deployed ? <Check /> : <Rocket />} tone={job.deployed ? "success" : "primary"} variant={job.deployed ? "soft" : "solid"} onClick={() => deploy(job.id)} disabled={job.deployed}>
                    {job.deployed ? "Deployed to receptionist" : "Deploy"}
                  </Button>
                )}
                {(job.status === "running" || job.status === "queued") && (
                  <Button size="sm" variant="outline" tone="danger" iconLeft={<X />} onClick={() => setCancelId(job.id)}>
                    Cancel job
                  </Button>
                )}
                {job.status === "failed" && (
                  <Button size="sm" variant="outline" tone="neutral" iconLeft={<FlaskConical />} onClick={() => setJobs((all) => all.map((j) => (j.id === job.id ? { ...j, status: "running", progress: 5, error: undefined, loss: [2.0], started: "Just now" } : j)))}>
                    Retry with fixed dataset
                  </Button>
                )}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border bg-foreground text-background shadow-xs dark:bg-card dark:text-foreground dark:ring-1 dark:ring-border">
              <div className="flex items-center gap-2 border-b border-current/10 px-4 py-2 text-xs font-medium">
                <Terminal className="size-3.5" /> Logs
              </div>
              <pre className="max-h-40 overflow-auto p-4 font-mono text-[11px] leading-relaxed opacity-90">
                {(job.status === "queued" ? ["[00:00] Waiting for a training slot…"] : job.status === "failed" ? LOGS.slice(0, 2).concat([`[00:06] ERROR ${job.error}`]) : LOGS.slice(0, job.status === "running" ? 6 : 6)).join("\n")}
              </pre>
            </div>
          </aside>
        </div>
      </div>

      <Dialog open={!!cancelId} onOpenChange={(o) => !o && setCancelId(null)} role="alertdialog" tone="danger" icon={<X />} title="Cancel this job?" description="Progress is lost and you're billed for compute used so far." onConfirm={() => cancelId && cancel(cancelId)} confirmText="Cancel job" cancelText="Keep training" />

      <Dialog
        open={createOpen}
        onOpenChange={(o) => {
          setCreateOpen(o)
          setDraftError(null)
        }}
        title="New fine-tuning job"
        description="Estimated cost is shown before training starts."
        icon={<Database />}
        mobile="sheet"
        onConfirm={create}
        closeOnConfirm={false}
        confirmText="Start training"
      >
        <div className="grid gap-3">
          <Input label="Job name" value={draft.name} onValueChange={(v) => setDraft({ ...draft, name: v })} placeholder="receptionist-tone-v5" className="font-mono" fullWidth autoFocus />
          <div>
            <label htmlFor="base" className="mb-1.5 block text-sm font-medium">
              Base model
            </label>
            <Select id="base" options={["Atlas Fast", "Atlas Pro", "Nova 2"]} value={draft.base} onValueChange={(v) => v && setDraft({ ...draft, base: v })} />
          </div>
          <div>
            <label htmlFor="dataset" className="mb-1.5 block text-sm font-medium">
              Dataset
            </label>
            <Select id="dataset" options={DATASETS} value={draft.dataset} onValueChange={(v) => v && setDraft({ ...draft, dataset: v })} />
          </div>
          <NumberInput label="Epochs" min={1} max={10} value={draft.epochs} onValueChange={(v) => setDraft({ ...draft, epochs: v })} description="2–3 is enough for tone; more risks overfitting." className="w-40" />
          <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">Estimated: ~{Math.round(28 * ((draft.epochs ?? 3) / 3))} min · ${(2.3 * (draft.epochs ?? 3)).toFixed(2)}</p>
          {draftError && (
            <p role="alert" className="text-sm text-rose-800 dark:text-rose-400">
              {draftError}
            </p>
          )}
        </div>
      </Dialog>
    </div>
  )
}

function Meta({ k, v }: { k: string; v: string }) {
  return (
    <div className="min-w-0 rounded-lg bg-muted/50 px-2.5 py-1.5">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="truncate font-medium tabular-nums">{v}</dd>
    </div>
  )
}

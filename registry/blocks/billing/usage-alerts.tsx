"use client"

import * as React from "react"
import { Bell, BellRing, Database, Hash, Mail, MessageSquare, Plus, Trash2, TrendingUp, Zap } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Alert } from "@/registry/components/core/alert"
import { Badge } from "@/registry/components/core/badge"
import { Button } from "@/registry/components/core/button"
import { Dialog } from "@/registry/components/core/dialog"
import { NumberInput } from "@/registry/components/core/number-input"
import { Select } from "@/registry/components/core/select"
import { Switch } from "@/registry/components/core/switch"
import { ToggleGroup, ToggleGroupItem } from "@/registry/components/core/toggle-group"
import { NumberFlow } from "@/registry/components/numbers/number-flow"
import { cn } from "@/lib/utils"

/* ---------- Demo data ---------- */

type MetricId = "sms" | "bookings" | "storage" | "api"
type Metric = { id: MetricId; label: string; unit: string; used: number; limit: number; perDay: number; icon: React.ComponentType<{ className?: string }>; format?: (n: number) => string }
type Channel = "email" | "slack" | "sms"
type Rule = { id: string; metric: MetricId; threshold: number; channels: Channel[]; enabled: boolean; fired?: boolean }

const METRICS: Metric[] = [
  { id: "sms", label: "SMS reminders", unit: "messages", used: 1_640, limit: 2_000, perDay: 95, icon: MessageSquare },
  { id: "bookings", label: "Bookings", unit: "this month", used: 412, limit: 1_000, perDay: 18, icon: Zap },
  { id: "storage", label: "Storage", unit: "GB", used: 7.2, limit: 10, perDay: 0.12, icon: Database, format: (n) => `${n.toFixed(1)} GB` },
  { id: "api", label: "API calls", unit: "requests", used: 38_900, limit: 100_000, perDay: 2_400, icon: TrendingUp },
]

const INITIAL_RULES: Rule[] = [
  { id: "r1", metric: "sms", threshold: 80, channels: ["email", "slack"], enabled: true, fired: true },
  { id: "r2", metric: "sms", threshold: 95, channels: ["email", "sms"], enabled: true },
  { id: "r3", metric: "storage", threshold: 90, channels: ["email"], enabled: true },
  { id: "r4", metric: "api", threshold: 75, channels: ["slack"], enabled: false },
]

const CHANNEL_META: Record<Channel, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  email: { label: "Email", icon: Mail },
  slack: { label: "Slack", icon: Hash },
  sms: { label: "SMS", icon: MessageSquare },
}
const DAY_IN_MONTH = 19
const DAYS_IN_MONTH = 30

const fmt = (m: Metric, n: number) => (m.format ? m.format(n) : Math.round(n).toLocaleString("en-US"))

/* ---------- Pieces ---------- */

function UsageBar({ m, rules, day }: { m: Metric; rules: Rule[]; day: number }) {
  const pct = Math.min(100, (m.used / m.limit) * 100)
  const forecast = Math.min(100, ((m.used + m.perDay * (DAYS_IN_MONTH - day)) / m.limit) * 100)
  const tone = pct >= 95 ? "danger" : pct >= 80 ? "warning" : "ok"
  const willExceed = forecast >= 100
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className={cn("flex size-9 items-center justify-center rounded-xl", tone === "danger" ? "bg-rose-500/10 text-rose-600 dark:text-rose-400" : tone === "warning" ? "bg-amber-500/10 text-amber-700 dark:text-amber-300" : "bg-muted text-muted-foreground")}>
            <m.icon className="size-4" />
          </span>
          <div>
            <p className="text-sm font-medium">{m.label}</p>
            <p className="text-xs text-muted-foreground">
              {fmt(m, m.used)} of {fmt(m, m.limit)} {m.format ? "" : m.unit}
            </p>
          </div>
        </div>
        <p className={cn("font-heading text-xl font-semibold tabular-nums", tone === "danger" ? "text-rose-600 dark:text-rose-400" : tone === "warning" ? "text-amber-700 dark:text-amber-300" : "")}>
          <NumberFlow value={Math.round(pct)} suffix="%" />
        </p>
      </div>
      <div className="relative mt-4 h-3 rounded-full bg-muted" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={`${m.label} usage`}>
        {/* forecast */}
        <div className="absolute inset-y-0 left-0 rounded-full bg-[repeating-linear-gradient(90deg,transparent_0_4px,color-mix(in_oklab,var(--foreground)_18%,transparent)_4px_8px)] transition-all duration-700" style={{ width: `${forecast}%` }} aria-hidden="true" />
        {/* used */}
        <div className={cn("absolute inset-y-0 left-0 rounded-full transition-all duration-700", tone === "danger" ? "bg-rose-500" : tone === "warning" ? "bg-amber-500" : "bg-primary")} style={{ width: `${pct}%` }} />
        {/* thresholds */}
        {rules
          .filter((r) => r.metric === m.id && r.enabled)
          .map((r) => (
            <span key={r.id} className="absolute -top-1 -bottom-1 w-0.5 bg-foreground/70" style={{ left: `${r.threshold}%` }} title={`Alert at ${r.threshold}%`} aria-hidden="true">
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-medium tabular-nums text-muted-foreground">{r.threshold}</span>
            </span>
          ))}
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <TrendingUp className="size-3.5" />
        {willExceed ? (
          <span className="text-rose-600 dark:text-rose-400">On pace to run out around day {Math.max(day + 1, Math.ceil(day + (m.limit - m.used) / m.perDay))}. Dotted bar shows the forecast.</span>
        ) : (
          <>
            Forecast {Math.round(forecast)}% by month end at {fmt(m, m.perDay)}/day.
          </>
        )}
      </p>
    </div>
  )
}

/* ---------- Block ---------- */

export default function UsageAlerts() {
  const [metrics, setMetrics] = React.useState(METRICS)
  const [rules, setRules] = React.useState(INITIAL_RULES)
  const [day, setDay] = React.useState(DAY_IN_MONTH)
  const [events, setEvents] = React.useState<{ id: string; text: string }[]>([{ id: "e0", text: "SMS reminders crossed 80% · emailed billing@novasalon.co and posted to #ops" }])
  const [addOpen, setAddOpen] = React.useState(false)
  const [draft, setDraft] = React.useState<{ metric: string | null; threshold: number | null; channels: string[] }>({ metric: "bookings", threshold: 80, channels: ["email"] })
  const [autoTopUp, setAutoTopUp] = React.useState(false)

  const simulateDay = () => {
    const nextDay = Math.min(DAYS_IN_MONTH, day + 1)
    setDay(nextDay)
    const next = metrics.map((m) => ({ ...m, used: Math.min(m.limit, m.used + m.perDay * (0.8 + Math.random() * 0.5)) }))
    setMetrics(next)
    const fired: string[] = []
    setRules((rs) =>
      rs.map((r) => {
        const m = next.find((x) => x.id === r.metric)!
        const pct = (m.used / m.limit) * 100
        if (r.enabled && !r.fired && pct >= r.threshold) {
          fired.push(`${m.label} crossed ${r.threshold}% · sent by ${r.channels.map((c) => CHANNEL_META[c].label).join(", ")}`)
          return { ...r, fired: true }
        }
        return r
      }),
    )
    if (fired.length) setEvents((e) => [...fired.map((text, i) => ({ id: `e${Date.now()}${i}`, text })), ...e].slice(0, 4))
  }

  const addRule = () => {
    if (!draft.metric || !draft.threshold) throw new Error("Pick a metric and a threshold")
    if (draft.channels.length === 0) throw new Error("Choose at least one channel")
    setRules((rs) => [...rs, { id: `r${Date.now()}`, metric: draft.metric as MetricId, threshold: draft.threshold ?? 80, channels: draft.channels as Channel[], enabled: true }])
  }

  const metricOptions = METRICS.map((m) => ({ value: m.id, label: m.label }))

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-xl font-semibold tracking-tight">Usage & alerts</h2>
            <p className="text-sm text-muted-foreground">
              Day {day} of {DAYS_IN_MONTH} · Studio plan · resets 1 April.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" tone="neutral" iconLeft={<TrendingUp />} onClick={simulateDay} disabled={day >= DAYS_IN_MONTH}>
              Simulate a day
            </Button>
            <Button iconLeft={<Plus />} onClick={() => setAddOpen(true)}>
              New alert
            </Button>
          </div>
        </div>

        {/* Fired alerts */}
        <div className="mt-4 grid gap-2" aria-live="polite">
          {events.map((e, i) => (
            <Alert key={e.id} tone={i === 0 ? "warning" : "neutral"} variant="left-accent" size="sm" icon={<BellRing className="size-4" />} dismissible onDismiss={() => setEvents((list) => list.filter((x) => x.id !== e.id))} animation={i === 0 ? "slide-down" : "none"}>
              {e.text}
            </Alert>
          ))}
        </div>

        {/* Meters */}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {metrics.map((m) => (
            <UsageBar key={m.id} m={m} rules={rules} day={day} />
          ))}
        </div>

        {/* Rules */}
        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_300px]">
          <section aria-labelledby="ua-rules" className="min-w-0 rounded-2xl border bg-card shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b px-5 py-3">
              <h3 id="ua-rules" className="flex items-center gap-2 font-heading text-base font-semibold">
                <Bell className="size-4" /> Alert rules
              </h3>
              <span className="text-xs text-muted-foreground">{rules.filter((r) => r.enabled).length} active</span>
            </div>
            <ul className="divide-y">
              {rules.map((r) => {
                const m = METRICS.find((x) => x.id === r.metric)!
                return (
                  <li key={r.id} className={cn("flex items-center gap-3 px-5 py-3", !r.enabled && "text-muted-foreground")}>
                    <Switch size="sm" checked={r.enabled} onCheckedChange={(v) => setRules((rs) => rs.map((x) => (x.id === r.id ? { ...x, enabled: v, fired: v ? x.fired : false } : x)))} aria-label={`${m.label} at ${r.threshold}%`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{m.label}</span> <span className="text-foreground/70">reaches</span> <span className="font-medium tabular-nums">{r.threshold}%</span>
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        {r.channels.map((c) => {
                          const C = CHANNEL_META[c]
                          return (
                            <Badge key={c} tone="neutral" variant="outline" size="xs" icon={<C.icon className="size-3" />}>
                              {C.label}
                            </Badge>
                          )
                        })}
                        {r.fired && (
                          <Badge tone="warning" variant="dot" size="xs">
                            Fired this month
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" tone="danger" iconOnly aria-label={`Delete rule for ${m.label} at ${r.threshold}%`} onClick={() => setRules((rs) => rs.filter((x) => x.id !== r.id))}>
                      <Trash2 />
                    </Button>
                  </li>
                )
              })}
              {rules.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">No rules. You will only hear from us when something runs out.</li>}
            </ul>
          </section>

          <div className="grid content-start gap-3">
            <Switch label="Auto top-up SMS" description="Buy 500 messages for $10 whenever you hit 95%." labelPosition="left" checked={autoTopUp} onCheckedChange={setAutoTopUp} className="rounded-2xl border bg-card p-4 shadow-sm" tone="success" />
            <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">How alerts work</p>
              <p className="mt-1">Each rule fires once per billing month when usage crosses its line. The dotted bar is a forecast from your last 7 days.</p>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen} title="New alert rule" description="We notify you the moment usage crosses the threshold." icon={<Bell />} confirmText="Create rule" onConfirm={addRule}>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="ua-metric">Metric</Label>
            <Select id="ua-metric" options={metricOptions} value={draft.metric} onValueChange={(v) => setDraft((d) => ({ ...d, metric: v }))} className="w-full" />
          </div>
          <NumberInput id="ua-threshold" label="Threshold" value={draft.threshold} onValueChange={(v) => setDraft((d) => ({ ...d, threshold: v }))} min={10} max={100} step={5} trailing="%" fullWidth />
          <div className="grid gap-1.5">
            <span className="text-sm font-medium">Notify by</span>
            <ToggleGroup type="multiple" value={draft.channels} onValueChange={(v) => setDraft((d) => ({ ...d, channels: v }))} variant="outline" size="sm" aria-label="Channels">
              {(Object.keys(CHANNEL_META) as Channel[]).map((c) => {
                const C = CHANNEL_META[c]
                return (
                  <ToggleGroupItem key={c} value={c} icon={<C.icon />}>
                    {C.label}
                  </ToggleGroupItem>
                )
              })}
            </ToggleGroup>
          </div>
        </div>
      </Dialog>
    </div>
  )
}

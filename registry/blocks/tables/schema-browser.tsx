"use client"

import * as React from "react"
import { Check, Copy, Database, Hash, Key, Link2, Search, Table2, Type } from "lucide-react"
import { Badge } from "@/registry/components/core/badge"
import { Button } from "@/registry/components/core/button"
import { Input } from "@/registry/components/core/input"
import { TreeExpand, type TreeExpandNode } from "@/registry/components/lists/tree-expand"
import { cn } from "@/lib/utils"

/* ---------- Demo data ---------- */

type Column = { name: string; type: string; nullable?: boolean; pk?: boolean; fk?: string; description?: string }
type Table = { schema: string; name: string; rows: number; size: string; description: string; columns: Column[]; sample: (string | number | boolean | null)[][] }
const TABLES: Table[] = [
  {
    schema: "public",
    name: "bookings",
    rows: 184_220,
    size: "96 MB",
    description: "One row per appointment. Status moves pending → confirmed → completed / cancelled / no_show.",
    columns: [
      { name: "id", type: "uuid", pk: true, description: "Primary key" },
      { name: "client_id", type: "uuid", fk: "clients.id" },
      { name: "staff_id", type: "uuid", fk: "staff.id" },
      { name: "service_id", type: "uuid", fk: "services.id" },
      { name: "starts_at", type: "timestamptz", description: "Local time of the location, stored in UTC" },
      { name: "status", type: "booking_status", description: "enum: pending, confirmed, completed, cancelled, no_show" },
      { name: "total_cents", type: "integer", description: "Final charged amount including tip" },
      { name: "rating", type: "smallint", nullable: true, description: "1–5, set after the visit" },
      { name: "created_at", type: "timestamptz" },
    ],
    sample: [
      ["8f2a…", "c_41…", "s_02…", "sv_9…", "2026-03-14 09:30", "confirmed", 24000, null],
      ["7b1c…", "c_18…", "s_03…", "sv_4…", "2026-03-13 14:00", "completed", 8500, 5],
      ["6d0e…", "c_77…", "s_01…", "sv_1…", "2026-03-13 11:15", "no_show", 0, null],
    ],
  },
  {
    schema: "public",
    name: "clients",
    rows: 6_210,
    size: "4 MB",
    description: "Everyone who has booked or been added at the desk.",
    columns: [
      { name: "id", type: "uuid", pk: true },
      { name: "name", type: "text" },
      { name: "email", type: "citext", nullable: true },
      { name: "phone", type: "text", nullable: true },
      { name: "tags", type: "text[]", description: "VIP, sensitive scalp, …" },
      { name: "created_at", type: "timestamptz" },
    ],
    sample: [
      ["c_41…", "Maya Chen", "maya@example.com", "+1415…", "{VIP}"],
      ["c_18…", "Tom Becker", "tom.b@example.com", null, "{}"],
    ],
  },
  {
    schema: "public",
    name: "staff",
    rows: 14,
    size: "48 kB",
    description: "Stylists, techs and front desk.",
    columns: [
      { name: "id", type: "uuid", pk: true },
      { name: "name", type: "text" },
      { name: "role", type: "text" },
      { name: "hourly_rate", type: "numeric(8,2)" },
      { name: "active", type: "boolean" },
    ],
    sample: [
      ["s_01…", "Ana Petrova", "Senior stylist", 34, true],
      ["s_02…", "Leo Martins", "Barber", 28, true],
    ],
  },
  {
    schema: "public",
    name: "services",
    rows: 42,
    size: "64 kB",
    description: "Menu items with duration and price.",
    columns: [
      { name: "id", type: "uuid", pk: true },
      { name: "name", type: "text" },
      { name: "category", type: "text" },
      { name: "duration_min", type: "integer" },
      { name: "price_cents", type: "integer" },
    ],
    sample: [
      ["sv_9…", "Balayage", "Color", 150, 22000],
      ["sv_4…", "Women's cut & blow-dry", "Hair", 60, 8500],
    ],
  },
  {
    schema: "analytics",
    name: "fact_bookings",
    rows: 182_906,
    size: "71 MB",
    description: "Warehouse table built nightly by bookings_to_warehouse.",
    columns: [
      { name: "booking_id", type: "uuid", pk: true },
      { name: "date_key", type: "integer", fk: "dim_date.date_key" },
      { name: "stylist", type: "text" },
      { name: "service_category", type: "text" },
      { name: "revenue", type: "numeric(10,2)" },
      { name: "is_no_show", type: "boolean" },
    ],
    sample: [[ "8f2a…", 20260314, "Ana Petrova", "Color", 240.0, false ]],
  },
]
const TYPE_ICON = (t: string) => (/int|numeric|small|big/.test(t) ? <Hash /> : /time|date/.test(t) ? <Type /> : <Type />)

/* ---------- Block ---------- */

export default function SchemaBrowser() {
  const [query, setQuery] = React.useState("")
  const [selected, setSelected] = React.useState<string>("public.bookings")
  const [tab, setTab] = React.useState<"columns" | "sample" | "ddl">("columns")
  const [copied, setCopied] = React.useState(false)

  const q = query.toLowerCase()
  const nodes: TreeExpandNode[] = ["public", "analytics"].map((schema) => ({
    id: schema,
    label: schema,
    icon: <Database className="size-4" />,
    meta: <span className="text-[11px] text-foreground/70">{TABLES.filter((t) => t.schema === schema).length}</span>,
    children: TABLES.filter((t) => t.schema === schema && (!q || t.name.includes(q) || t.columns.some((c) => c.name.includes(q)))).map((t) => ({
      id: `${t.schema}.${t.name}`,
      label: t.name,
      icon: <Table2 className="size-4" />,
      meta: <span className="text-[11px] tabular-nums text-foreground/70">{t.rows.toLocaleString("en-US")}</span>,
    })),
  }))
  const table = TABLES.find((t) => `${t.schema}.${t.name}` === selected) ?? TABLES[0]!
  const ddl = `CREATE TABLE ${table.schema}.${table.name} (\n${table.columns.map((c) => `  ${c.name.padEnd(14)} ${c.type}${c.pk ? " PRIMARY KEY" : c.nullable ? "" : " NOT NULL"}${c.fk ? ` REFERENCES ${c.fk.split(".")[0]}(${c.fk.split(".")[1]})` : ""}`).join(",\n")}\n);`
  const copy = (text: string) => {
    void navigator.clipboard?.writeText(text)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }
  const related = TABLES.filter((t) => t.columns.some((c) => c.fk?.startsWith(table.name + ".")) || table.columns.some((c) => c.fk?.startsWith(t.name + "."))).filter((t) => t.name !== table.name)

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-[260px_1fr]">
        {/* Tree */}
        <aside className="rounded-2xl border bg-card p-3 shadow-xs">
          <Input size="sm" label="Search tables and columns" labelMode="none" leading={<Search />} placeholder="Search tables, columns…" value={query} onValueChange={setQuery} clearable fullWidth />
          <div className="mt-2 max-h-[460px] overflow-y-auto">
            <TreeExpand nodes={nodes} defaultExpanded={["public", "analytics"]} selected={selected} onSelectedChange={(id, node) => id && node?.children === undefined && setSelected(id)} label="Schemas" />
          </div>
        </aside>

        {/* Detail */}
        <section className="min-w-0 rounded-2xl border bg-card shadow-xs">
          <div className="border-b p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                  <Database className="size-3.5" /> {table.schema}
                </div>
                <h2 className="mt-0.5 font-heading text-xl font-semibold tracking-tight">{table.name}</h2>
                <p className="mt-1 max-w-xl text-sm text-muted-foreground">{table.description}</p>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" tone="neutral" size="sm">
                  {table.rows.toLocaleString("en-US")} rows
                </Badge>
                <Badge variant="outline" tone="neutral" size="sm">
                  {table.size}
                </Badge>
              </div>
            </div>
            {related.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <Link2 className="size-3.5" /> Related:
                {related.map((r) => (
                  <button key={r.name} type="button" onClick={() => setSelected(`${r.schema}.${r.name}`)} className="rounded-full border px-2 py-0.5 font-mono text-[11px] hover:bg-muted">
                    {r.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
            <div role="tablist" aria-label="Table views" className="flex rounded-lg bg-muted p-0.5 text-xs">
              {(
                [
                  ["columns", `Columns (${table.columns.length})`],
                  ["sample", "Sample rows"],
                  ["ddl", "DDL"],
                ] as const
              ).map(([k, l]) => (
                <button key={k} role="tab" type="button" aria-selected={tab === k} onClick={() => setTab(k)} className={cn("rounded-md px-3 py-1.5 font-medium transition-colors", tab === k ? "bg-background shadow-xs" : "text-foreground/70")}>
                  {l}
                </button>
              ))}
            </div>
            <Button size="xs" variant="ghost" tone="neutral" iconLeft={copied ? <Check /> : <Copy />} onClick={() => copy(tab === "ddl" ? ddl : `SELECT ${table.columns.map((c) => c.name).join(", ")}\nFROM ${table.schema}.${table.name}\nLIMIT 100;`)}>
              {copied ? "Copied" : tab === "ddl" ? "Copy DDL" : "Copy SELECT"}
            </Button>
          </div>

          {tab === "columns" && (
            <ul className="divide-y">
              {table.columns.map((c) => (
                <li key={c.name} className="flex flex-wrap items-center gap-3 px-5 py-2.5">
                  <span className="flex size-7 items-center justify-center rounded-md bg-muted text-muted-foreground [&_svg]:size-3.5">{c.pk ? <Key /> : c.fk ? <Link2 /> : TYPE_ICON(c.type)}</span>
                  <code className="min-w-32 font-mono text-sm font-medium">{c.name}</code>
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground/70">{c.type}</code>
                  {c.pk && (
                    <Badge variant="soft" tone="warning" size="xs">
                      PK
                    </Badge>
                  )}
                  {c.fk && (
                    <button type="button" onClick={() => setSelected(`${c.fk!.split(".")[0] === "dim_date" ? "analytics" : "public"}.${c.fk!.split(".")[0]}`)} className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium text-sky-800 hover:bg-sky-500/20 dark:text-sky-300">
                      <Link2 className="size-3" /> {c.fk}
                    </button>
                  )}
                  {c.nullable && <span className="text-[11px] text-muted-foreground">nullable</span>}
                  {c.description && <span className="basis-full text-xs text-muted-foreground sm:basis-auto sm:ml-auto sm:text-right">{c.description}</span>}
                </li>
              ))}
            </ul>
          )}
          {tab === "sample" && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/50 text-left text-muted-foreground">
                    {table.columns.slice(0, table.sample[0]?.length ?? 0).map((c) => (
                      <th key={c.name} className="px-3 py-2 font-mono font-medium">
                        {c.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.sample.map((r, i) => (
                    <tr key={i} className="border-t">
                      {r.map((v, j) => (
                        <td key={j} className={cn("px-3 py-1.5 font-mono", v === null && "text-muted-foreground/60 italic", typeof v === "number" && "tabular-nums")}>
                          {v === null ? "null" : String(v)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="border-t px-3 py-2 text-[11px] text-muted-foreground">Sampled from the read replica · PII columns masked</p>
            </div>
          )}
          {tab === "ddl" && <pre className="overflow-x-auto p-5 font-mono text-xs leading-relaxed">{ddl}</pre>}
        </section>
      </div>
    </div>
  )
}

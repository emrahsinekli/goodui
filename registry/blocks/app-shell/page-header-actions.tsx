"use client"

import * as React from "react"
import { Archive, Check, Copy, Download, Filter, MoreHorizontal, Pencil, Plus, Share2, Trash2, X } from "lucide-react"
import { Avatar, AvatarGroup } from "@/registry/components/core/avatar"
import { Breadcrumb } from "@/registry/components/core/breadcrumb"
import { Button } from "@/registry/components/core/button"
import { DropdownMenu } from "@/registry/components/core/dropdown-menu"
import { Tabs } from "@/registry/components/core/tabs"
import { cn } from "@/lib/utils"

/* ---------- Demo data ---------- */

type TabKey = "overview" | "bookings" | "notes" | "files"
const TABS: { value: TabKey; label: string; count?: number }[] = [
  { value: "overview", label: "Overview" },
  { value: "bookings", label: "Bookings", count: 42 },
  { value: "notes", label: "Notes", count: 7 },
  { value: "files", label: "Files", count: 3 },
]
const FILTERS = ["Last 90 days", "Balayage", "Maya Okafor"]
const BOOKINGS = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  date: `${["Oct", "Sep", "Aug", "Jul"][Math.floor(i / 5)]} ${28 - (i % 5) * 6}`,
  service: ["Balayage", "Gloss & tone", "Cut & style", "Olaplex treatment", "Root touch-up"][i % 5]!,
  staff: ["Maya Okafor", "Priya Shah"][i % 2]!,
  price: [195, 85, 70, 60, 120][i % 5]!,
  status: i === 0 ? "Upcoming" : i % 7 === 3 ? "No-show" : "Completed",
}))

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background"

/* ---------- Block ---------- */

export default function PageHeaderActions() {
  const [tab, setTab] = React.useState<TabKey>("bookings")
  const [filters, setFilters] = React.useState<string[]>(FILTERS)
  const [stuck, setStuck] = React.useState(false)
  const [status, setStatus] = React.useState<"active" | "archived">("active")
  const [editing, setEditing] = React.useState(false)
  const [name, setName] = React.useState("Maya Chen")
  const [draft, setDraft] = React.useState(name)
  const [toast, setToast] = React.useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = React.useState(false)
  const scroller = React.useRef<HTMLDivElement>(null)
  const sentinel = React.useRef<HTMLDivElement>(null)

  // The sticky header compacts once the hero scrolls out of view.
  React.useEffect(() => {
    const root = scroller.current
    const el = sentinel.current
    if (!root || !el) return
    const io = new IntersectionObserver(([e]) => setStuck(!(e?.isIntersecting ?? true)), { root, threshold: 0 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const say = (t: string) => {
    setToast(t)
    setTimeout(() => setToast(null), 1800)
  }
  const saveName = () => {
    if (draft.trim()) setName(draft.trim())
    setEditing(false)
  }
  const exportCsv = () => {
    const rows = [["date", "service", "staff", "price", "status"], ...BOOKINGS.map((b) => [b.date, b.service, b.staff, b.price, b.status])]
    const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${name.toLowerCase().replace(/\s+/g, "-")}-bookings.csv`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    say("Export started")
  }
  const shown = filters.includes("Balayage") ? BOOKINGS.filter((b) => b.service === "Balayage" || b.service === "Gloss & tone") : BOOKINGS

  return (
    <div className="p-4 md:p-6">
      <div className="relative mx-auto h-[640px] max-w-5xl overflow-hidden rounded-2xl border bg-background shadow-sm">
        <div ref={scroller} className="h-full overflow-y-auto">
          {/* Breadcrumb row scrolls away; the header below sticks */}
          <div className="px-4 pt-4 sm:px-6">
            <Breadcrumb size="sm" variant="slash" items={[{ label: "Clients", onClick: () => say("Back to clients") }, { label: "VIP", onClick: () => say("VIP segment") }, { label: name }]} />
          </div>
          <div ref={sentinel} className="h-px" aria-hidden="true" />

          <header className={cn("sticky top-0 z-10 border-b bg-background/90 backdrop-blur transition-[padding,box-shadow]", stuck ? "shadow-sm" : "")}>
            <div className={cn("flex items-start gap-4 px-4 transition-[padding] sm:px-6", stuck ? "py-2" : "py-4")}>
              <Avatar name={name} size={stuck ? "md" : "xl"} ring="gradient" className="transition-all" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {editing ? (
                    <form
                      className="flex items-center gap-1.5"
                      onSubmit={(e) => {
                        e.preventDefault()
                        saveName()
                      }}
                    >
                      <label htmlFor="ph-name" className="sr-only">
                        Client name
                      </label>
                      <input id="ph-name" autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Escape" && setEditing(false)} className={cn("h-8 rounded-lg border bg-background px-2 text-lg font-semibold", ring)} />
                      <Button size="xs" type="submit" iconOnly aria-label="Save name">
                        <Check />
                      </Button>
                      <Button size="xs" variant="ghost" tone="neutral" type="button" iconOnly aria-label="Cancel" onClick={() => setEditing(false)}>
                        <X />
                      </Button>
                    </form>
                  ) : (
                    <h1 className={cn("font-semibold tracking-tight transition-[font-size]", stuck ? "text-lg" : "text-2xl")}>{name}</h1>
                  )}
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", status === "active" ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300" : "bg-muted text-foreground/70")}>{status === "active" ? "Active · VIP" : "Archived"}</span>
                  {!editing && (
                    <button type="button" aria-label="Rename client" onClick={() => { setDraft(name); setEditing(true) }} className={cn("rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground", ring)}>
                      <Pencil className="size-3.5" />
                    </button>
                  )}
                </div>
                {!stuck && (
                  <p className="mt-0.5 text-sm text-muted-foreground motion-safe:animate-in motion-safe:fade-in-0">
                    Client since Jan 2024 · 42 visits · $4,180 lifetime · prefers Maya
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <AvatarGroup size="sm" max={2} className="hidden sm:flex">
                  <Avatar name="Maya Okafor" size="sm" />
                  <Avatar name="Priya Shah" size="sm" />
                  <Avatar name="Lena Park" size="sm" />
                </AvatarGroup>
                <Button variant="outline" tone="neutral" size="sm" iconLeft={<Share2 />} className="hidden sm:inline-flex" onClick={() => { navigator.clipboard?.writeText("https://app.fadeco.com/clients/maya-chen").catch(() => {}); say("Profile link copied") }}>
                  Share
                </Button>
                <Button size="sm" iconLeft={<Plus />} onClick={() => say("New booking for " + name)}>
                  Book
                </Button>
                <DropdownMenu
                  align="end"
                  items={[
                    { label: "Export bookings", icon: <Download />, shortcut: "Mod+E", onSelect: exportCsv },
                    { label: "Copy profile link", icon: <Copy />, onSelect: () => { navigator.clipboard?.writeText("https://app.fadeco.com/clients/maya-chen").catch(() => {}); say("Profile link copied") } },
                    { label: status === "active" ? "Archive client" : "Restore client", icon: <Archive />, onSelect: () => { setStatus((s) => (s === "active" ? "archived" : "active")); say(status === "active" ? "Client archived" : "Client restored") } },
                    { type: "separator" },
                    { label: "Delete client", icon: <Trash2 />, destructive: true, onSelect: () => setConfirmDelete(true) },
                  ]}
                  trigger={
                    <Button variant="ghost" tone="neutral" size="sm" iconOnly aria-label="More actions">
                      <MoreHorizontal />
                    </Button>
                  }
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 px-4 pb-0 sm:flex-row sm:items-end sm:justify-between sm:px-6">
              <Tabs variant="underline" size="sm" value={tab} onValueChange={(v) => setTab(v as TabKey)} listLabel="Client sections" items={TABS.map((t) => ({ value: t.value, label: t.label, count: t.count }))} className="-mb-px" />
              <div className="flex flex-wrap items-center gap-1.5 pb-2">
                <Filter className="size-3.5 text-muted-foreground" aria-hidden="true" />
                {filters.map((f) => (
                  <span key={f} className="inline-flex h-6 items-center gap-1 rounded-full border bg-card pr-1 pl-2 text-[11px] font-medium">
                    {f}
                    <button type="button" aria-label={`Remove filter ${f}`} onClick={() => setFilters((l) => l.filter((x) => x !== f))} className={cn("rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground", ring)}>
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
                {filters.length < FILTERS.length && (
                  <button type="button" onClick={() => setFilters(FILTERS)} className={cn("h-6 rounded-full border border-dashed px-2 text-[11px] text-muted-foreground hover:border-foreground hover:text-foreground", ring)}>
                    Reset filters
                  </button>
                )}
              </div>
            </div>
          </header>

          {/* Confirm delete */}
          {confirmDelete && (
            <div role="alertdialog" aria-label="Delete client?" className="mx-4 mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-rose-500/40 bg-rose-500/8 p-3 text-sm sm:mx-6">
              <Trash2 className="size-4 text-rose-700 dark:text-rose-300" aria-hidden="true" />
              <span className="flex-1">Delete {name} and all 42 bookings? This cannot be undone.</span>
              <Button size="xs" variant="ghost" tone="neutral" onClick={() => setConfirmDelete(false)}>
                Keep
              </Button>
              <Button size="xs" tone="danger" onClick={() => { setConfirmDelete(false); say("Client deleted (demo)") }}>
                Delete
              </Button>
            </div>
          )}

          {/* Content */}
          <div className="p-4 sm:p-6">
            {tab === "bookings" && (
              <div className="overflow-hidden rounded-xl border bg-card">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs text-muted-foreground">
                    <tr>
                      <th scope="col" className="px-4 py-2 text-left font-medium">Date</th>
                      <th scope="col" className="px-3 py-2 text-left font-medium">Service</th>
                      <th scope="col" className="hidden px-3 py-2 text-left font-medium sm:table-cell">With</th>
                      <th scope="col" className="px-3 py-2 text-right font-medium">Price</th>
                      <th scope="col" className="px-4 py-2 text-right font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((b) => (
                      <tr key={b.id} className="border-t hover:bg-muted/40">
                        <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{b.date}</td>
                        <td className="px-3 py-2.5 font-medium">{b.service}</td>
                        <td className="hidden px-3 py-2.5 sm:table-cell">{b.staff}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">${b.price}</td>
                        <td className="px-4 py-2.5 text-right">
                          <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", b.status === "Upcoming" ? "bg-primary/10 text-primary" : b.status === "No-show" ? "bg-rose-500/12 text-rose-700 dark:text-rose-300" : "bg-muted text-foreground/70")}>{b.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {tab === "overview" && (
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["Visits", "42"],
                  ["Lifetime value", "$4,180"],
                  ["Average ticket", "$99"],
                  ["Rebook rate", "81%"],
                  ["No-shows", "1"],
                  ["Next visit", "Nov 12"],
                ].map(([l, v]) => (
                  <div key={l} className="rounded-xl border bg-card p-4">
                    <p className="text-xs text-muted-foreground">{l}</p>
                    <p className="text-2xl font-semibold tracking-tight tabular-nums">{v}</p>
                  </div>
                ))}
              </div>
            )}
            {tab === "notes" && (
              <ul className="flex flex-col gap-2">
                {["Allergic to PPD: use ammonia-free color only.", "Likes her coffee black, no sugar.", "Referred Sofia Rossi and Jonas Weber.", "Prefers appointments before 11:00.", "Ask about her sister's wedding in May.", "Uses Olaplex at home.", "Parks in the back lot."].map((n) => (
                  <li key={n} className="rounded-xl border bg-card px-4 py-3 text-sm">
                    {n}
                  </li>
                ))}
              </ul>
            )}
            {tab === "files" && (
              <ul className="grid gap-3 sm:grid-cols-3">
                {["Color formula.pdf", "Before-after Oct.jpg", "Consent form.pdf"].map((f) => (
                  <li key={f} className="rounded-xl border bg-card p-4 text-sm font-medium">
                    {f}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-6 text-center text-xs text-muted-foreground">Scroll up and down: the header compacts and stays put.</p>
          </div>
        </div>

        <div aria-live="polite" className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
          {toast && <div className="rounded-full bg-foreground px-4 py-2 text-sm text-background shadow-lg motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2">{toast}</div>}
        </div>
      </div>
    </div>
  )
}

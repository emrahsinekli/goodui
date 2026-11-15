"use client"

import * as React from "react"
import { Bell, Check, Copy, Download, FastForward, MapPin, Package, PackageCheck, PackageOpen, RotateCcw, Truck } from "lucide-react"
import { Badge } from "@/registry/components/core/badge"
import { Button } from "@/registry/components/core/button"
import { Dialog } from "@/registry/components/core/dialog"
import { Input } from "@/registry/components/core/input"
import { cn } from "@/lib/utils"

/* ---------- Demo data ---------- */

const STAGES = [
  { id: "placed", label: "Order placed", detail: "Thu, Nov 6 · 2:14 PM", icon: PackageOpen },
  { id: "packed", label: "Packed at Lumen Studio", detail: "Fri, Nov 7 · 9:40 AM", icon: Package },
  { id: "shipped", label: "Handed to courier", detail: "Fri, Nov 7 · 4:05 PM", icon: Truck },
  { id: "out", label: "Out for delivery", detail: "Mon, Nov 10 · 7:30 AM", icon: MapPin },
  { id: "delivered", label: "Delivered", detail: "Mon, Nov 10 · 1:12 PM · left with neighbour", icon: PackageCheck },
]
const ITEMS = [
  { name: "Repair Shampoo", variant: "500 ml · Fig & cedar", price: 46, qty: 1, hue: 280 },
  { name: "Silk Mask", variant: "200 ml", price: 34, qty: 2, hue: 330 },
]
const TRACKING = "1Z 999 AA1 01 2345 6784"
// Courier route as a simple path: the parcel dot moves along it as the stage advances.
const ROUTE = "M 30 150 C 90 110, 150 160, 210 120 S 330 70, 400 95 S 500 60, 560 40"
const ROUTE_POINTS = [0, 0.18, 0.42, 0.75, 1]

/* ---------- Block ---------- */

export default function OrderTracking() {
  const [stage, setStage] = React.useState(2)
  const [copied, setCopied] = React.useState(false)
  const [notify, setNotify] = React.useState(false)
  const [notifyOpen, setNotifyOpen] = React.useState(false)
  const [phone, setPhone] = React.useState("+1 415 555 0142")
  const [pts, setPts] = React.useState<{ x: number; y: number }[]>([])
  const pathRef = React.useRef<SVGPathElement>(null)
  const delivered = stage === STAGES.length - 1
  const current = STAGES[stage] ?? STAGES[0]!

  React.useEffect(() => {
    const p = pathRef.current
    if (!p) return
    const len = p.getTotalLength()
    setPts(ROUTE_POINTS.map((t) => { const pt = p.getPointAtLength(len * t); return { x: pt.x, y: pt.y } }))
  }, [])
  const pos = pts[stage]

  const copy = () => {
    void navigator.clipboard?.writeText(TRACKING.replace(/\s/g, ""))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }
  const receipt = () => {
    const lines = ["Lumen Studio — Receipt #LS-2041", "", ...ITEMS.map((i) => `${i.qty} × ${i.name} (${i.variant})  $${(i.price * i.qty).toFixed(2)}`), "", `Total  $${ITEMS.reduce((a, i) => a + i.price * i.qty, 0).toFixed(2)}`]
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/plain" }))
    const a = document.createElement("a")
    a.href = url
    a.download = "receipt-LS-2041.txt"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 md:p-6">
      <section className="mx-auto max-w-5xl overflow-hidden rounded-3xl border bg-card">
        <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold">Order #LS-2041</span>
              <Badge size="xs" variant="soft" tone={delivered ? "success" : "info"} animation={delivered ? "none" : "pulse"}>{delivered ? "Delivered" : current.label}</Badge>
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">{delivered ? "Delivered Mon, Nov 10" : stage >= 3 ? "Arriving today by 6 PM" : "Arriving Monday, Nov 10"}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" tone="neutral" iconLeft={copied ? <Check /> : <Copy />} onClick={copy}>{copied ? "Copied" : TRACKING}</Button>
            <Button size="sm" variant={notify ? "soft" : "outline"} tone={notify ? "success" : "neutral"} iconLeft={notify ? <Check /> : <Bell />} onClick={() => (notify ? setNotify(false) : setNotifyOpen(true))}>{notify ? "Texts on" : "Text me updates"}</Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px]">
          <div className="p-5 sm:p-6">
            {/* Route map */}
            <div className="relative overflow-hidden rounded-2xl border bg-muted/30">
              <div aria-hidden="true" className="absolute inset-0 opacity-60" style={{ backgroundImage: "linear-gradient(to right, color-mix(in oklab, var(--foreground) 6%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--foreground) 6%, transparent) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
              <svg viewBox="0 0 600 190" className="relative h-44 w-full" role="img" aria-label={`Parcel route, currently: ${current.label}`}>
                <path d={ROUTE} fill="none" className="stroke-foreground/15" strokeWidth="6" strokeLinecap="round" />
                <path ref={pathRef} d={ROUTE} fill="none" className="stroke-primary transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none" strokeWidth="6" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - (ROUTE_POINTS[stage] ?? 0)} />
                {pts.map((pt, i) => (
                  <circle key={STAGES[i]?.id ?? i} cx={pt.x} cy={pt.y} r="5" className={cn(i <= stage ? "fill-primary" : "fill-background stroke-foreground/30")} strokeWidth="2" />
                ))}
                {pos && (
                  <g className="transition-transform duration-700 ease-out motion-reduce:transition-none" style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}>
                    <circle r="14" className="fill-primary/20 animate-ping motion-reduce:animate-none" />
                    <circle r="11" className="fill-primary" />
                    <foreignObject x="-7" y="-7" width="14" height="14"><Truck className="size-3.5 text-primary-foreground" /></foreignObject>
                  </g>
                )}
                <text x="30" y="178" fontSize="11" className="fill-muted-foreground">Austin</text>
                <text x="520" y="28" fontSize="11" className="fill-muted-foreground">Your door</text>
              </svg>
            </div>

            {/* Timeline */}
            <ol className="mt-5 flex flex-col">
              {STAGES.map((s, i) => {
                const Icon = s.icon
                const state = i < stage ? "done" : i === stage ? "now" : "todo"
                return (
                  <li key={s.id} className="relative flex gap-3 pb-5 last:pb-0">
                    {i < STAGES.length - 1 && <span aria-hidden="true" className={cn("absolute top-8 bottom-0 left-4 w-px", i < stage ? "bg-primary" : "bg-border")} />}
                    <span className={cn("relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2", state === "done" ? "border-primary bg-primary text-primary-foreground" : state === "now" ? "border-primary bg-background text-primary shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_18%,transparent)]" : "border-border bg-background text-muted-foreground")}>
                      {state === "done" ? <Check className="size-4" /> : <Icon className="size-4" />}
                    </span>
                    <div className={cn("pt-1", state === "todo" && "text-muted-foreground")}>
                      <div className={cn("text-sm", state !== "todo" && "font-medium")}>{s.label}</div>
                      <div className="text-xs text-muted-foreground">{state === "todo" ? "Pending" : s.detail}</div>
                    </div>
                  </li>
                )
              })}
            </ol>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" tone="neutral" iconLeft={<FastForward />} disabled={delivered} onClick={() => setStage((s) => Math.min(STAGES.length - 1, s + 1))}>Simulate next scan</Button>
              <Button size="sm" variant="ghost" tone="neutral" iconLeft={<RotateCcw />} onClick={() => setStage(0)}>Reset</Button>
            </div>
          </div>

          <aside className="border-t bg-muted/30 p-5 lg:border-t-0 lg:border-l">
            <div className="text-sm font-semibold">In this parcel</div>
            <ul className="mt-3 flex flex-col gap-3">
              {ITEMS.map((i) => (
                <li key={i.name} className="flex items-center gap-3">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-xl" style={{ background: `oklch(0.92 0.05 ${i.hue})` }} aria-hidden="true">
                    <svg viewBox="0 0 100 140" className="h-8"><rect x="30" y="34" width="40" height="96" rx="10" fill={`oklch(0.72 0.12 ${i.hue})`} /><rect x="40" y="14" width="20" height="24" rx="4" fill={`oklch(0.5 0.14 ${i.hue})`} /></svg>
                  </span>
                  <span className="min-w-0 flex-1 text-sm"><span className="block truncate font-medium">{i.name}</span><span className="text-xs text-muted-foreground">{i.variant} · ×{i.qty}</span></span>
                  <span className="text-sm tabular-nums">${(i.price * i.qty).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-xl border bg-card p-3 text-xs">
              <div className="font-medium">Delivering to</div>
              <div className="mt-0.5 text-muted-foreground">Maya Chen<br />482 Harbor Ave, Apt 3<br />Austin, TX 78702</div>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              <Button size="sm" variant="outline" tone="neutral" iconLeft={<Download />} onClick={receipt}>Download receipt</Button>
              {delivered && <Button size="sm" variant="ghost" tone="neutral" onClick={() => setStage(0)}>Report a problem</Button>}
            </div>
          </aside>
        </div>
      </section>

      <Dialog open={notifyOpen} onOpenChange={setNotifyOpen} title="Text me delivery updates" description="One message per scan, and one when it's at your door." size="sm" animation="scale" confirmText="Turn on" onConfirm={() => { setNotify(true); setNotifyOpen(false) }}>
        <Input label="Mobile number" type="tel" value={phone} onValueChange={setPhone} autoFocus />
      </Dialog>
    </div>
  )
}

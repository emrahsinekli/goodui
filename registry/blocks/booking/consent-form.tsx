"use client"

import * as React from "react"
import { Check, Download, Eraser, FileSignature, Lock, PenLine, ShieldCheck } from "lucide-react"
import { Button } from "@/registry/components/core/button"
import { Checkbox } from "@/registry/components/core/checkbox"
import { Input } from "@/registry/components/core/input"
import { SuccessCheck } from "@/registry/components/feedback/success-check"
import { cn } from "@/lib/utils"

/* ---------- Demo data ---------- */

const SECTIONS = [
  { title: "What the treatment involves", body: "Chemical color services use oxidative dyes and developers that lift and deposit pigment. Results depend on hair history, porosity and previous products, so the final shade can vary from the inspiration photo. A strand test may be recommended for lightening services." },
  { title: "Risks and side effects", body: "Scalp irritation, redness, itching or, rarely, an allergic reaction can occur. Lightening can cause dryness or breakage, especially on previously treated hair. Tell your stylist about any reaction you have ever had to hair products or henna." },
  { title: "Patch testing", body: "A patch test 48 hours before any color service is required for new clients and after any change in health or medication. Declining a patch test means the service may be refused on the day." },
  { title: "Aftercare and results", body: "Use the recommended sulfate-free products and avoid washing for 48 hours. Color may fade faster with heat styling, swimming or sun exposure. Corrections requested within 7 days are complimentary when aftercare was followed." },
  { title: "Photos and privacy", body: "With your permission we may photograph your hair for your client file and our portfolio. Your health details are stored securely, never shared, and deleted on request." },
]
const CLAUSES = [
  { id: "read", label: "I have read and understood the information above", required: true },
  { id: "health", label: "I have disclosed all allergies, medications and previous reactions", required: true },
  { id: "risks", label: "I accept the risks described and consent to the treatment", required: true },
  { id: "photos", label: "You may use photos of my hair in your portfolio (optional)", required: false },
]

/* ---------- Block ---------- */

export default function ConsentForm() {
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const drawing = React.useRef(false)
  const [progress, setProgress] = React.useState(0)
  const [agreed, setAgreed] = React.useState<string[]>([])
  const [name, setName] = React.useState("")
  const [hasInk, setHasInk] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [signed, setSigned] = React.useState<{ at: string } | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

  const readAll = progress >= 0.98
  const requiredOk = CLAUSES.filter((c) => c.required).every((c) => agreed.includes(c.id))

  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const max = el.scrollHeight - el.clientHeight
    setProgress(max <= 0 ? 1 : Math.min(1, el.scrollTop / max))
  }
  React.useEffect(onScroll, [])

  // Signature pad
  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current!
    const r = c.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height }
  }
  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (signed) return
    drawing.current = true
    const ctx = canvasRef.current!.getContext("2d")!
    const p = pos(e)
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    const ctx = canvasRef.current!.getContext("2d")!
    const p = pos(e)
    ctx.lineWidth = 2.4
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.strokeStyle = getComputedStyle(canvasRef.current!).color
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    setHasInk(true)
  }
  const end = () => {
    drawing.current = false
  }
  const clear = () => {
    const c = canvasRef.current
    c?.getContext("2d")?.clearRect(0, 0, c.width, c.height)
    setHasInk(false)
  }
  const sign = async () => {
    if (!readAll) return setError("Please scroll through the whole document first.")
    if (!requiredOk) return setError("Tick the three required statements.")
    if (name.trim().length < 3) return setError("Type your full name.")
    if (!hasInk) return setError("Draw your signature in the box.")
    setError(null)
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 900))
    setSubmitting(false)
    setSigned({ at: new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) })
  }
  const download = () => {
    const sig = canvasRef.current?.toDataURL("image/png") ?? ""
    const html = `<div style="font-family:system-ui;max-width:640px;margin:40px auto"><h1>Color service consent</h1>${SECTIONS.map((s) => `<h3>${s.title}</h3><p>${s.body}</p>`).join("")}<ul>${CLAUSES.filter((c) => agreed.includes(c.id))
      .map((c) => `<li>☑ ${c.label}</li>`)
      .join("")}</ul><p>Signed by <b>${name}</b> on ${signed?.at}</p><img src="${sig}" width="240" alt="signature"/></div>`
    const url = URL.createObjectURL(new Blob([html], { type: "text/html" }))
    const a = document.createElement("a")
    a.href = url
    a.download = "consent-signed.html"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[1fr_360px]">
        {/* Document */}
        <section className="overflow-hidden rounded-2xl border bg-card shadow-xs">
          <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileSignature className="size-4" />
              </span>
              <div>
                <h2 className="font-heading text-base font-semibold">Color service consent</h2>
                <div className="text-xs text-muted-foreground">Studio Nine · v3 · 5 min read</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={cn("transition-colors", readAll && "font-medium text-emerald-800 dark:text-emerald-400")}>{readAll ? "Read" : `${Math.round(progress * 100)}% read`}</span>
              <span className="h-1.5 w-20 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Reading progress" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
                <span className={cn("block h-full rounded-full transition-[width]", readAll ? "bg-emerald-500" : "bg-primary")} style={{ width: `${progress * 100}%` }} />
              </span>
            </div>
          </div>
          <div ref={scrollRef} onScroll={onScroll} className="max-h-[420px] overflow-y-auto px-5 py-4 text-sm leading-relaxed" tabIndex={0} aria-label="Consent document">
            {SECTIONS.map((s, i) => (
              <div key={s.title} className={cn(i > 0 && "mt-5")}>
                <h3 className="font-medium">
                  {i + 1}. {s.title}
                </h3>
                <p className="mt-1 text-foreground/80">{s.body}</p>
              </div>
            ))}
            <div className="mt-6 rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">End of document. You can now confirm the statements on the right.</div>
          </div>
        </section>

        {/* Sign panel */}
        <section className="space-y-4 rounded-2xl border bg-card p-5 shadow-xs">
          {signed ? (
            <div className="flex flex-col items-center text-center">
              <SuccessCheck size={72} label="Consent signed" />
              <div className="mt-3 font-medium">Signed and stored</div>
              <div className="text-xs text-muted-foreground">
                {name} · {signed.at}
              </div>
              <div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
                <Lock className="size-3" /> SHA-256 sealed · IP and time recorded
              </div>
              <Button className="mt-4" size="sm" variant="outline" tone="neutral" iconLeft={<Download />} onClick={download}>
                Download signed copy
              </Button>
            </div>
          ) : (
            <>
              <fieldset className={cn("space-y-2 transition-opacity", !readAll && "saturate-50 bg-muted/40 [&_.text-muted-foreground]:text-foreground/70")}>
                <legend className="mb-1 text-sm font-medium">Confirm</legend>
                {CLAUSES.map((c) => (
                  <Checkbox key={c.id} size="sm" disabled={!readAll} checked={agreed.includes(c.id)} onCheckedChange={(v) => setAgreed(v ? [...agreed, c.id] : agreed.filter((x) => x !== c.id))} label={c.label} />
                ))}
              </fieldset>
              <Input label="Full legal name" value={name} onValueChange={setName} placeholder="Maya Chen" fullWidth />
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-sm font-medium">Signature</span>
                  <Button size="xs" variant="ghost" tone="neutral" iconLeft={<Eraser />} onClick={clear} disabled={!hasInk}>
                    Clear
                  </Button>
                </div>
                <div className="relative">
                  <canvas
                    ref={canvasRef}
                    width={640}
                    height={200}
                    role="img"
                    aria-label="Signature pad. Draw your signature with your mouse or finger."
                    onPointerDown={start}
                    onPointerMove={move}
                    onPointerUp={end}
                    onPointerLeave={end}
                    className="h-[120px] w-full touch-none rounded-xl border-2 border-dashed bg-muted/40 text-foreground"
                  />
                  {!hasInk && (
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                      <PenLine className="size-3.5" /> Sign here
                    </span>
                  )}
                  <span className="pointer-events-none absolute inset-x-6 bottom-6 border-b border-muted-foreground/30" aria-hidden="true" />
                </div>
              </div>
              {error && (
                <p role="alert" className="text-xs text-rose-800 dark:text-rose-400">
                  {error}
                </p>
              )}
              <Button fullWidth size="lg" iconLeft={<Check />} loading={submitting} onClick={sign} animation="lift">
                Sign and submit
              </Button>
              <p className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                <ShieldCheck className="size-3" /> Legally binding e-signature · stored for 7 years
              </p>
            </>
          )}
        </section>
      </div>
    </div>
  )
}

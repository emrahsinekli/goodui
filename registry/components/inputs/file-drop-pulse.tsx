"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { AlertCircle, Check, File, FileArchive, FileImage, FileSpreadsheet, FileText, FileVideo, UploadCloud, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import { GooduiTokens, spring } from "@/lib/goodui-motion"

const CSS = `
@keyframes pc-file-drop-pulse-ring { 0% { opacity: .9; transform: scale(1) } 100% { opacity: 0; transform: scale(1.035, 1.09) } }
.pc-file-drop-pulse-zone[data-dragging]::before, .pc-file-drop-pulse-zone[data-dragging]::after {
  content: ""; position: absolute; inset: -1px; border-radius: inherit; pointer-events: none;
  border: 2px solid var(--pc-file-drop-pulse-color, var(--primary));
  animation: pc-file-drop-pulse-ring 1.3s var(--pc-ease-out) infinite;
}
.pc-file-drop-pulse-zone[data-dragging]::after { animation-delay: .65s }
@media (prefers-reduced-motion: reduce) {
  .pc-file-drop-pulse-zone[data-dragging]::before { animation: none; opacity: 1 }
  .pc-file-drop-pulse-zone[data-dragging]::after { display: none }
}
`

export type UploadStatus = "uploading" | "done" | "error"

export type UploadItem = {
  id: string
  file: File
  progress: number
  status: UploadStatus
  error?: string
}

export type FileDropPulseHandle = {
  /** Add files as if they were dropped (validation included). */
  addFiles: (files: File[]) => void
  clear: () => void
}

export type FileDropPulseLabels = {
  files: string
  uploaded: string
  uploadFailed: string
  uploading: (name: string) => string
  cancel: (name: string) => string
  remove: (name: string) => string
  /** Default main line of the drop zone (the title prop overrides it). */
  title: string
  /** Main line while files hover the zone. */
  release: string
  typeNotAllowed: string
  /** Gets the formatted max size, e.g. "10 MB". */
  tooLarge: (max: string) => string
  skipped: (count: number, limit: number) => string
  /** Default hint part for maxSize; gets the formatted size. */
  upTo: (size: string) => string
  /** Default hint part for maxFiles. */
  maxFiles: (count: number) => string
  /** Undo bar text after a removal. */
  removed: (name: string) => string
  undo: string
}
const DEFAULT_LABELS: FileDropPulseLabels = {
  files: "Files",
  uploaded: "Uploaded",
  uploadFailed: "Upload failed",
  uploading: (name) => `Uploading ${name}`,
  cancel: (name) => `Cancel ${name}`,
  remove: (name) => `Remove ${name}`,
  title: "Drop files here or browse",
  release: "Release to upload",
  typeNotAllowed: "File type not allowed",
  tooLarge: (max) => `Too large · max ${max}`,
  skipped: (count, limit) => `${count} file${count > 1 ? "s" : ""} skipped · limit is ${limit}`,
  upTo: (size) => `up to ${size}`,
  maxFiles: (count) => `${count} files max`,
  removed: (name) => `Removed ${name}`,
  undo: "Undo",
}

export type FileDropPulseProps = Omit<React.ComponentProps<"div">, "onChange" | "ref"> & {
  /** Imperative handle with addFiles(files) and clear(). */
  ref?: React.Ref<FileDropPulseHandle>
  /** Same format as the input `accept` attribute: "image/*,.pdf,.csv". */
  accept?: string
  /** Max size per file in bytes. */
  maxSize?: number
  /** Max files kept in the list; failed files do not count, extra files are skipped with a notice. */
  maxFiles?: number
  /** Allow several files at once; when false a new file replaces the list (and cancels the replaced upload). */
  multiple?: boolean
  disabled?: boolean
  /**
   * Upload one file and report progress 0–100. Defaults to a simulated upload.
   * Reject (throw) to mark the file as failed.
   */
  upload?: (file: File, onProgress: (percent: number) => void, signal: AbortSignal) => Promise<void>
  /** Called with the whole list whenever a file is added, progresses, finishes, fails or is removed (not on mount). */
  onFilesChange?: (items: UploadItem[]) => void
  /** Main line in the drop zone; defaults to labels.title. */
  title?: React.ReactNode
  /** Second line in the drop zone; defaults to accept, max size and max files. */
  hint?: React.ReactNode
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<FileDropPulseLabels>
}

export const formatBytes = (n: number) =>
  n < 1024 ? `${n} B` : n < 1024 ** 2 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1024 ** 2).toFixed(n < 10 * 1024 ** 2 ? 1 : 0)} MB`

function iconFor(file: File) {
  const t = file.type
  const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
  if (t.startsWith("image/")) return { Icon: FileImage, tone: "text-sky-600 bg-sky-500/10 dark:text-sky-400" }
  if (t.startsWith("video/")) return { Icon: FileVideo, tone: "text-violet-600 bg-violet-500/10 dark:text-violet-400" }
  if (t === "application/pdf" || ext === "pdf") return { Icon: FileText, tone: "text-rose-600 bg-rose-500/10 dark:text-rose-400" }
  if (["csv", "xls", "xlsx", "numbers"].includes(ext)) return { Icon: FileSpreadsheet, tone: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400" }
  if (["zip", "rar", "7z", "gz"].includes(ext)) return { Icon: FileArchive, tone: "text-amber-600 bg-amber-500/10 dark:text-amber-400" }
  if (["doc", "docx", "txt", "md", "rtf"].includes(ext)) return { Icon: FileText, tone: "text-blue-600 bg-blue-500/10 dark:text-blue-400" }
  return { Icon: File, tone: "text-muted-foreground bg-muted" }
}

function matches(file: File, accept?: string) {
  if (!accept) return true
  const name = file.name.toLowerCase()
  return accept
    .split(",")
    .map((a) => a.trim().toLowerCase())
    .some((a) => (a.startsWith(".") ? name.endsWith(a) : a.endsWith("/*") ? file.type.startsWith(a.slice(0, -1)) : file.type === a))
}

/** Simulated upload: random-sized steps, roughly 1–2.5 s per file. */
const simulate: NonNullable<FileDropPulseProps["upload"]> = (_file, onProgress, signal) =>
  new Promise((resolve, reject) => {
    let p = 0
    const t = window.setInterval(() => {
      p = Math.min(100, p + 4 + Math.random() * 11)
      onProgress(p)
      if (p >= 100) {
        window.clearInterval(t)
        resolve()
      }
    }, 140)
    signal.addEventListener("abort", () => {
      window.clearInterval(t)
      reject(new DOMException("Aborted", "AbortError"))
    })
  })

let seq = 0

/** Drag-and-drop zone that pulses while files hover it, then lists files with animated progress, errors and undo. */
export function FileDropPulse({
  ref,
  accept,
  maxSize,
  maxFiles,
  multiple = true,
  disabled,
  upload = simulate,
  onFilesChange,
  title,
  hint,
  className,
  labels,
  ...props
}: FileDropPulseProps) {
  const l = useLabels("file-drop-pulse", DEFAULT_LABELS, labels)
  const reduce = useReducedMotion() ?? false
  const [items, setItems] = React.useState<UploadItem[]>([])
  const [dragging, setDragging] = React.useState(false)
  const [notice, setNotice] = React.useState<string | null>(null)
  const [removed, setRemoved] = React.useState<{ item: UploadItem; index: number } | null>(null)
  const depth = React.useRef(0)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const controllers = React.useRef(new Map<string, AbortController>())
  const itemsRef = React.useRef(items)
  const reported = React.useRef(items)
  const rootRef = React.useRef<HTMLDivElement>(null)
  const [rtl, setRtl] = React.useState(false)
  const uid = React.useId()

  React.useLayoutEffect(() => {
    if (rootRef.current) setRtl(getComputedStyle(rootRef.current).direction === "rtl")
  }, [])

  React.useEffect(() => {
    itemsRef.current = items
    // Skip the initial empty list (and StrictMode's re-run): report real changes only.
    if (reported.current === items) return
    reported.current = items
    onFilesChange?.(items)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  React.useEffect(() => {
    const map = controllers.current
    return () => map.forEach((c) => c.abort())
  }, [])

  React.useEffect(() => {
    if (!removed) return
    const t = window.setTimeout(() => setRemoved(null), 5000)
    return () => window.clearTimeout(t)
  }, [removed])

  const patch = (id: string, p: Partial<UploadItem>) => setItems((list) => list.map((it) => (it.id === id ? { ...it, ...p } : it)))

  const start = (item: UploadItem) => {
    const ctrl = new AbortController()
    controllers.current.set(item.id, ctrl)
    upload(item.file, (pct) => patch(item.id, { progress: Math.round(pct) }), ctrl.signal).then(
      () => {
        controllers.current.delete(item.id)
        patch(item.id, { progress: 100, status: "done" })
      },
      (err: unknown) => {
        controllers.current.delete(item.id)
        if (ctrl.signal.aborted) return
        patch(item.id, { status: "error", error: err instanceof Error ? err.message : l.uploadFailed })
      },
    )
  }

  const addFiles = (files: File[]) => {
    if (disabled || files.length === 0) return
    // In single mode the new file replaces the list, so the files already there don't use up room.
    const current = multiple ? itemsRef.current.filter((i) => i.status !== "error").length : 0
    const room = maxFiles ? Math.max(0, maxFiles - current) : Infinity
    const list = multiple ? files : files.slice(0, 1)
    const accepted = list.slice(0, room)
    const skipped = list.length - accepted.length
    const fresh: UploadItem[] = accepted.map((file) => {
      const id = `${uid}-${++seq}`
      if (!matches(file, accept)) return { id, file, progress: 0, status: "error", error: l.typeNotAllowed }
      if (maxSize && file.size > maxSize) return { id, file, progress: 0, status: "error", error: l.tooLarge(formatBytes(maxSize)) }
      return { id, file, progress: 0, status: "uploading" }
    })
    if (!multiple && fresh.length > 0) {
      // Cancel the uploads being replaced.
      controllers.current.forEach((c) => c.abort())
      controllers.current.clear()
      setRemoved(null)
    }
    setItems((prev) => (multiple ? [...prev, ...fresh] : fresh.length > 0 ? fresh : prev))
    fresh.filter((f) => f.status === "uploading").forEach(start)
    setNotice(skipped > 0 && maxFiles ? l.skipped(skipped, maxFiles) : null)
  }

  React.useImperativeHandle(ref, () => ({
    addFiles,
    clear: () => {
      controllers.current.forEach((c) => c.abort())
      controllers.current.clear()
      setItems([])
      setRemoved(null)
      setNotice(null)
    },
  }))

  const remove = (item: UploadItem) => {
    controllers.current.get(item.id)?.abort()
    controllers.current.delete(item.id)
    const index = items.findIndex((i) => i.id === item.id)
    setItems((l) => l.filter((i) => i.id !== item.id))
    if (item.status !== "error") setRemoved({ item, index })
  }

  const undo = () => {
    if (!removed) return
    const { item, index } = removed
    // An unfinished upload restarts from zero.
    const back: UploadItem = item.status === "done" ? item : { ...item, progress: 0, status: "uploading" }
    if (!multiple) {
      // Single mode keeps one file: the restored one replaces whatever is there now.
      controllers.current.forEach((c) => c.abort())
      controllers.current.clear()
    }
    setItems((prev) => (multiple ? [...prev.slice(0, index), back, ...prev.slice(index)] : [back]))
    if (back.status === "uploading") start(back)
    setRemoved(null)
  }

  const hasFiles = (e: React.DragEvent) => Array.from(e.dataTransfer.types).includes("Files")

  return (
    <div ref={rootRef} className={cn("grid w-full gap-3", className)} {...props}>
      <GooduiTokens />
      <style href="pc-file-drop-pulse" precedence="default">
        {CSS}
      </style>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        aria-describedby={`${uid}-hint`}
        data-dragging={dragging || undefined}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !disabled) {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragEnter={(e) => {
          if (!hasFiles(e) || disabled) return
          e.preventDefault()
          depth.current++
          setDragging(true)
        }}
        onDragOver={(e) => {
          if (!hasFiles(e) || disabled) return
          e.preventDefault()
          e.dataTransfer.dropEffect = "copy"
        }}
        onDragLeave={() => {
          depth.current = Math.max(0, depth.current - 1)
          if (depth.current === 0) setDragging(false)
        }}
        onDrop={(e) => {
          e.preventDefault()
          depth.current = 0
          setDragging(false)
          addFiles(Array.from(e.dataTransfer.files))
        }}
        className={cn(
          "pc-file-drop-pulse-zone relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 px-4 py-8 text-center transition-[border-color,background-color,box-shadow] duration-200 outline-none",
          "hover:border-foreground/25 hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50",
          "data-dragging:border-solid data-dragging:border-primary data-dragging:bg-primary/5 data-dragging:shadow-[0_0_0_6px_color-mix(in_oklab,var(--primary)_12%,transparent),0_0_32px_-4px_color-mix(in_oklab,var(--primary)_35%,transparent)]",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        <motion.div
          className="grid size-11 place-items-center rounded-full border bg-background shadow-[var(--pc-e1)]"
          animate={dragging && !reduce ? { y: -6, scale: 1.08 } : { y: 0, scale: 1 }}
          transition={spring.play}
        >
          <motion.span
            className="grid place-items-center"
            animate={dragging && !reduce ? { y: [0, -3, 0] } : { y: 0 }}
            transition={dragging ? { duration: 0.9, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
          >
            <UploadCloud className={cn("size-5 transition-colors", dragging ? "text-primary" : "text-muted-foreground")} />
          </motion.span>
        </motion.div>
        <div className="text-sm font-medium">{dragging ? l.release : (title ?? l.title)}</div>
        <div id={`${uid}-hint`} className="text-xs text-muted-foreground">
          {hint ?? [accept, maxSize && l.upTo(formatBytes(maxSize)), maxFiles && l.maxFiles(maxFiles)].filter(Boolean).join(" · ")}
        </div>
      </div>
      {/* The native input sits outside the role="button" zone, so the zone has no nested interactive content. */}
      <input
          ref={inputRef}
          type="file"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={(e) => {
            addFiles(Array.from(e.target.files ?? []))
            e.target.value = ""
          }}
        />

      <AnimatePresence initial={false}>
        {notice && (
          <motion.p
            role="alert"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden text-xs font-medium text-amber-700 dark:text-amber-400"
          >
            {notice}
          </motion.p>
        )}
      </AnimatePresence>

      <ul className="grid gap-2" aria-label={l.files}>
        <AnimatePresence initial={false} mode="popLayout">
          {items.map((it) => {
            const { Icon, tone } = iconFor(it.file)
            return (
              <motion.li
                key={it.id}
                layout={!reduce}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.97 }}
                animate={it.status === "error" && !reduce ? { opacity: 1, y: 0, scale: 1, x: [0, -6, 6, -4, 4, 0] } : { opacity: 1, y: 0, scale: 1, x: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95, x: rtl ? -24 : 24, transition: { duration: 0.18 } }}
                transition={{ ...spring.ui, x: { duration: 0.4 } }}
                className={cn(
                  "flex items-center gap-3 rounded-lg border bg-card p-2.5 pe-2 shadow-xs",
                  it.status === "error" && "border-destructive/40 bg-destructive/5",
                )}
              >
                <span className={cn("grid size-9 shrink-0 place-items-center rounded-md", it.status === "error" ? "bg-destructive/10 text-destructive" : tone)}>
                  {it.status === "error" ? <AlertCircle className="size-4" /> : <Icon className="size-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-medium">{it.file.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {it.status === "uploading" ? `${it.progress}%` : formatBytes(it.file.size)}
                    </span>
                  </div>
                  {it.status === "error" ? (
                    <p className="mt-0.5 text-xs text-destructive">{it.error}</p>
                  ) : (
                    <div className="mt-1.5 flex items-center gap-2">
                      <div
                        className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
                        role="progressbar"
                        aria-label={l.uploading(it.file.name)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={it.progress}
                      >
                        <motion.div
                          className={cn("h-full origin-left rounded-full rtl:origin-right", it.status === "done" ? "bg-emerald-500" : "bg-primary")}
                          initial={false}
                          animate={{ scaleX: it.progress / 100 }}
                          transition={reduce ? { duration: 0 } : spring.morph}
                        />
                      </div>
                      <AnimatePresence initial={false}>
                        {it.status === "done" && (
                          <motion.span
                            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.3 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={spring.play}
                            className="grid size-4 place-items-center rounded-full bg-emerald-500 text-white"
                          >
                            <Check className="size-2.5" strokeWidth={3.5} />
                            <span className="sr-only">{l.uploaded}</span>
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  aria-label={it.status === "uploading" ? l.cancel(it.file.name) : l.remove(it.file.name)}
                  onClick={() => remove(it)}
                  className="pc-press grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <X className="size-4" />
                </button>
              </motion.li>
            )
          })}
        </AnimatePresence>
      </ul>

      <AnimatePresence>
        {removed && (
          <motion.div
            role="status"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
            className="flex items-center justify-between gap-3 rounded-lg bg-foreground px-3 py-2 text-sm text-background shadow-[var(--pc-e2)]"
          >
            <span className="truncate">{l.removed(removed.item.file.name)}</span>
            <button
              type="button"
              onClick={undo}
              className="pc-press shrink-0 rounded px-1.5 py-0.5 font-medium underline-offset-2 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {l.undo}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

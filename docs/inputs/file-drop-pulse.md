# File drop zone

> Drag-and-drop zone whose border pulses while files hover, then lists files with type icons, springy progress bars, size and type errors, and undo on remove.

Drag and drop file upload for React and shadcn with progress bars, validation and undo

Page: https://goodui.dev/components/inputs/file-drop-pulse

## Install

```bash
npx shadcn@latest add @goodui/file-drop-pulse
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/file-drop-pulse.json`. The file lands in `components/goodui/file-drop-pulse.tsx`.

## When to use

- Uploading documents to a record: receipts to an expense, contracts to a client, photos to a job.
- Imports where file type and size must be checked before anything is sent: CSV client lists, PDF invoices.
- Forms where users add several files and need to see each one's progress and remove mistakes.

## When not to use

- A single avatar or logo picker with a crop step: use an avatar with a plain file input instead.
- Pasting text or links: use input or tag-input.

## Pick by what matters

| Need | Use |
| --- | --- |
| Several files with a cap | multiple (default) with maxFiles |
| Exactly one file that a new drop replaces | multiple={false} |
| Restrict types | accept="image/*,.pdf,.csv" (MIME types, wildcards or extensions) |
| Restrict size | maxSize in bytes, e.g. 10 * 1024 * 1024 |

## Usage

```tsx
import { FileDropPulse } from "@/components/goodui/file-drop-pulse"

export function ReceiptUpload({ expenseId }: { expenseId: string }) {
  return (
    <FileDropPulse
      accept="image/*,.pdf"
      maxSize={10 * 1024 * 1024}
      maxFiles={5}
      title="Drop receipts here or browse"
      upload={(file, onProgress, signal) =>
        new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.open("POST", "/api/expenses/" + expenseId + "/receipts")
          xhr.upload.onprogress = (e) => e.lengthComputable && onProgress((e.loaded / e.total) * 100)
          xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error("Server rejected " + file.name)))
          xhr.onerror = () => reject(new Error("Network error"))
          signal.addEventListener("abort", () => xhr.abort())
          const body = new FormData()
          body.append("file", file)
          xhr.send(body)
        })
      }
      onFilesChange={(items) => console.log(items.filter((i) => i.status === "done").length, "receipts uploaded")}
    />
  )
}
```

### Add files from elsewhere (paste, another button)

```tsx
import { FileDropPulse, type FileDropPulseHandle } from "@/components/goodui/file-drop-pulse"

const drop = React.useRef<FileDropPulseHandle>(null)

<FileDropPulse ref={drop} accept=".csv" multiple={false} hint="CSV export from your old booking tool" />
<button onClick={() => drop.current?.clear()}>Start over</button>
// drop.current?.addFiles(files) runs the same validation as a drop
```

## API

### FileDropPulse

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| title | `React.ReactNode` | — | Main line in the drop zone; defaults to labels.title. |
| ref | `React.Ref<FileDropPulseHandle>` | — | Imperative handle with addFiles(files) and clear(). |
| accept | `string` | — | Same format as the input `accept` attribute: "image/*,.pdf,.csv". |
| maxSize | `number` | — | Max size per file in bytes. |
| maxFiles | `number` | — | Max files kept in the list; failed files do not count, extra files are skipped with a notice. |
| multiple | `boolean` | `true` | Allow several files at once; when false a new file replaces the list (and cancels the replaced upload). |
| disabled | `boolean` | — |  |
| upload | `(file: File, onProgress: (percent: number) => void, signal: AbortSignal) => Promise<void>` | `simulate` | Upload one file and report progress 0–100. Defaults to a simulated upload. Reject (throw) to mark the file as failed. |
| onFilesChange | `(items: UploadItem[]) => void` | — | Called with the whole list whenever a file is added, progresses, finishes, fails or is removed (not on mount). |
| hint | `React.ReactNode` | — | Second line in the drop zone; defaults to accept, max size and max files. |
| labels | `Partial<FileDropPulseLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <div> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Enter / Space | Opens the system file picker when the drop zone is focused. |
| Tab | Moves from the drop zone to each file's cancel/remove button and the Undo button. |

## Accessibility

- The drop zone is a focusable role="button" that opens a hidden native file input (kept outside the zone, so there is no nested interactive content), with the hint linked through aria-describedby.
- Each uploading or finished file has a role="progressbar" with aria-valuenow; every row has a cancel or remove button named with the file name ("Cancel receipt.pdf").
- A finished file gets sr-only "Uploaded" text; the skipped-files notice is role="alert" and the undo bar is role="status".
- disabled sets aria-disabled, removes the zone from the tab order and ignores drops.
- labels translates every built-in string: progress, cancel, remove and uploaded, the default title, "Release to upload", the validation errors, the default hint parts, the skipped notice and the Undo bar.

## Motion

- While files hover the zone, two rings pulse outward from its border every 1.3 s (CSS, offset by 0.65 s), the border turns solid primary, and the cloud icon lifts and bobs.
- New files rise in from 12px below on a spring (stiffness 420, damping 32); the list reflows with layout animation and removed files slide out sideways in 180 ms.
- Progress bars fill on a soft spring (stiffness 120, damping 22) and turn emerald with a popping check when done.
- Rejected files shake sideways for 400 ms.
- Reduced motion: one static ring instead of the pulse, no icon lift, no shake or layout animation; items fade in and out and progress bars jump.

## Notes for AI

- Without upload the component only simulates progress with random steps. Always pass upload in real apps and call onProgress with 0 to 100.
- Honor the AbortSignal in upload: it fires when the user cancels a file and on unmount. Throw (reject) to mark a file as failed; the error message is shown under the file.
- Validation happens before upload: wrong type or oversize files appear as failed rows and never call upload. Failed rows do not count toward maxFiles.
- onFilesChange receives the full list of UploadItem objects (file, progress, status, error). Read status === "done" to know what finished; it is not called with File[] and not on mount.
- With multiple={false} a new file replaces the current one even when maxFiles is set, and the replaced upload's AbortSignal fires.
- All built-in text comes from the labels prop (title, release, typeNotAllowed, tooLarge, skipped, upTo, maxFiles, removed, undo, plus the progress/cancel/remove strings); pass translations there.
- Removing a file that did not fail shows Undo for 5 seconds. Undo re-adds finished files as they were and restarts unfinished ones from zero, so upload may run twice for the same file.

## FAQ

**Does it upload files itself?**

No. You pass an upload function (fetch, XHR, S3 presigned URL, UploadThing…) that reports progress. Without it the progress is simulated, for demos.

**Can I show the uploaded files after a reload?**

Not through this component: it only lists files added in the current session. Render saved files in your own list next to it.

## Related

- input: https://goodui.dev/components/core/input
- progress: https://goodui.dev/components/numbers/progress
- toast-stack: https://goodui.dev/components/feedback/toast-stack
- input-shake: https://goodui.dev/components/inputs/input-shake

Last updated: 2026-11-02

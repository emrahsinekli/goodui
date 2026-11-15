# Copy button

> Copy-to-clipboard button whose icon blurs from copy into a drawn check with a popping Copied! tooltip, plus a fallback when the Clipboard API is blocked.

Copy to clipboard button for React and shadcn with Copied! tooltip

Page: https://goodui.dev/components/buttons/copy-button

## Install

```bash
npx shadcn@latest add @goodui/copy-button
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/copy-button.json`. The file lands in `components/goodui/copy-button.tsx`.

## When to use

- Next to API keys, webhook URLs, invite links and booking links that people paste elsewhere.
- In code blocks and docs, as a small icon-only button in the corner.
- Sharing panels ("Copy link") where a visible label and a Copied! confirmation help.

## When not to use

- Sharing to other apps on mobile: use the Web Share API (navigator.share) with a button; copy is the fallback.
- Actions that do more than copy (create a link on the server first, then copy): use stateful-button, or pass an async value function here if the server call is quick.

## Pick by what matters

| Need | Use |
| --- | --- |
| Corner of a code block | defaults (variant="ghost", size icon-sm) |
| Visible "Copy link" text | label="Copy link" (size becomes sm) |
| Inside a form row next to an input | variant="outline" size="icon" |
| Text produced on demand | value={async () => …} |
| No floating tooltip | tooltip={false} |

## Usage

```tsx
import { CopyButton } from "@/components/goodui/copy-button"

export function BookingLink({ url }: { url: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-muted/40 py-1.5 ps-3 pe-1.5">
      <span className="truncate font-mono text-sm">{url}</span>
      <CopyButton value={url} label="Copy link" variant="outline" className="ms-auto" />
    </div>
  )
}
```

### Icon-only, for a code block

```tsx
<div className="relative rounded-lg bg-muted p-4 font-mono text-sm">
  <CopyButton value="npx shadcn@latest add copy-button" hint="Copy command" className="absolute end-2 top-2" />
  npx shadcn@latest add copy-button
</div>
```

### Copy a value created on demand

```tsx
<CopyButton
  label="Copy invite link"
  value={async () => (await createInvite(teamId)).url}
  onCopied={() => track("invite_copied")}
/>
```

## API

### CopyButton

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| value (required) | `string \| (() => string \| Promise<string>)` | — | Text to copy, or a function that returns it (can be async). |
| timeout | `number` | `1600` | Milliseconds the "copied" state stays. |
| onCopied | `(text: string) => void` | — | Called with the copied text after a successful copy. |
| onCopyError | `(text: string) => void` | — | Called with the text when both the Clipboard API and the fallback fail, or with "" when the value function throws or rejects. |
| label | `React.ReactNode` | — | Visible text beside the icon; leave empty for an icon-only button. |
| copiedLabel | `string` | — | Text shown in the tooltip (and the label) after copying. |
| failedLabel | `string` | — | Tooltip text when copying is blocked; defaults to a ⌘C / Ctrl+C hint. |
| hint | `string` | — | Hint shown in the tooltip on hover for icon-only buttons. |
| variant | `"outline" \| "default" \| "ghost" \| "secondary"` | `"ghost"` | "ghost" \| "outline" \| "secondary" \| "default". Ghost also turns the icon emerald after copying. |
| size | `"sm" \| "md" \| "icon" \| "icon-sm"` | — | "icon-sm" \| "icon" \| "sm" \| "md". Defaults to "icon-sm" without a label and "sm" with one. |
| tooltip | `boolean` | `true` | Show the floating tooltip. |
| labels | `Partial<CopyButtonLabels>` | — | Text for built-in controls and screen readers; pass translations here. |
| sound | `boolean \| SoundName` | — | Plays "pop" after a copy (and "error" when it fails) when the visitor has sounds on (lib/goodui-sounds); a sound name replaces the pop. Off by default. |

Also accepts every <button> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Enter / Space | Copies (native <button>). |
| Tab | Focus shows the hint tooltip on keyboard focus (focus-visible) for icon-only buttons. |

## Accessibility

- Icon-only buttons get aria-label from hint ("Copy") unless you pass aria-label.
- A polite live region announces "Copied to clipboard" or a failure message; the tooltip itself is aria-hidden.
- If the Clipboard API is blocked, it falls back to a hidden textarea with execCommand("copy") and returns focus to where it was.
- If both fail, the tooltip tells the user to press ⌘C on Apple devices or Ctrl+C elsewhere.

## Motion

- The copy icon blurs and scales out while a check scales in and draws itself in 0.25 s; the tooltip pops on a spring (stiffness 600, damping 26).
- Press scales to 0.95. The copied state lasts `timeout` ms (1600); a failure lasts 1.2 s longer.
- Reduced motion: icon and tooltip cross-fade in 0.1 s and the check appears already drawn.

## Notes for AI

- value is required: a string, or a function returning a string or a promise of one. Do not pass children; use label for visible text.
- The button calls your onClick first; call event.preventDefault() there to cancel the copy.
- Variants are ghost (default), outline, secondary, default; sizes icon-sm, icon, sm, md.
- Built-in text comes from the labels prop (hint, copied, blocked(mac), copiedAnnouncement, failedAnnouncement); the hint, copiedLabel and failedLabel props still override the visible texts.
- If value is an async function that throws or rejects, the button shows the failed state and onCopyError is called with "".

## FAQ

**Does it work on http:// or inside iframes?**

When the Clipboard API is not available (insecure context) or throws, it falls back to a hidden textarea and execCommand("copy"). If that also fails, it shows a ⌘C / Ctrl+C hint.

**Can I copy rich text or images?**

No. It copies plain text only.

## Related

- button: https://goodui.dev/components/core/button
- tooltip-animated: https://goodui.dev/components/overlays/tooltip-animated
- input: https://goodui.dev/components/core/input
- kbd: https://goodui.dev/components/core/kbd

Last updated: 2026-11-02

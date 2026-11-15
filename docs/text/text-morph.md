# Text morph

> Morphs between strings letter by letter: shared characters spring to their new positions while the rest blur in and out.

Text morph animation for React and shadcn: smooth label change letter by letter

Page: https://goodui.dev/components/text/text-morph

## Install

```bash
npx shadcn@latest add @goodui/text-morph
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/text-morph.json`. The file lands in `components/goodui/text-morph.tsx`.

## When to use

- Button and status labels that change in place: "Save" → "Saving" → "Saved", "Follow" → "Following".
- Toggle labels such as "Monthly" / "Yearly" on a pricing switch.
- Short headings that swap with app state ("3 bookings today" → "4 bookings today").

## When not to use

- Changing numbers that should roll like an odometer: use number-flow.
- Rotating through a list of words on a timer: use word-rotate.
- A button that needs full loading, success and error states: use stateful-button.

## Usage

```tsx
import * as React from "react"
import { TextMorph } from "@/components/goodui/text-morph"

export function FollowButton() {
  const [following, setFollowing] = React.useState(false)
  return (
    <button
      type="button"
      onClick={() => setFollowing((f) => !f)}
      className="inline-flex h-9 items-center rounded-lg border px-4 text-sm font-medium"
    >
      <TextMorph text={following ? "Following" : "Follow"} />
    </button>
  )
}
```

### Billing period toggle label

```tsx
<TextMorph text={yearly ? "Billed yearly · save 20%" : "Billed monthly"} className="text-sm text-muted-foreground" />
```

## API

### TextMorph

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| text (required) | `string` | — | The current string; change it to morph. Characters both strings share slide into place. |

Also accepts every <span> attribute.

## Accessibility

- An sr-only span holds the current string; the animated letters are aria-hidden.
- Inside a button, the button's accessible name follows the current text. It is not a live region; add one yourself if a status change must be announced.

## Motion

- Each character is keyed by itself and its occurrence, so letters both strings share slide to their new position with a layout spring (stiffness 420, damping 34, mass 0.6).
- Letters that leave fade out, blur 4px and shrink to 0.9; new letters do the reverse, over 0.22 s.
- Reduced motion: letters swap instantly, with no slide, blur or fade.

## Notes for AI

- The only prop besides HTML attributes is text (a string); children are not supported.
- Keep strings short (labels, not paragraphs): every character is its own animated span.
- It renders an inline-flex span with white-space: pre, so it never wraps; do not use it for multi-line text.
- Matching is case-sensitive: "Save" and "save" share only "ave".

## FAQ

**Why do some letters slide and others fade?**

Characters present in both strings keep their identity and slide; characters that exist in only one string fade and blur in or out.

## Related

- number-flow: https://goodui.dev/components/numbers/number-flow
- word-rotate: https://goodui.dev/components/text/word-rotate
- stateful-button: https://goodui.dev/components/buttons/stateful-button
- scramble-text: https://goodui.dev/components/text/scramble-text

Last updated: 2026-11-02

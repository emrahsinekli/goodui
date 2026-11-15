# Success check

> Check or X in a circle that draws its stroke, fills, then pops with a ray-and-ring burst, for payment and booking result screens.

Animated success checkmark for React and shadcn: drawn check or error X with a burst

Page: https://goodui.dev/components/feedback/success-check

## Install

```bash
npx shadcn@latest add @goodui/success-check
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/success-check.json`. The file lands in `components/goodui/success-check.tsx`.

## When to use

- Result screens: payment received, booking confirmed, form submitted.
- The error counterpart on the same screen (variant="error"), so success and failure share one layout.
- Small inline ticks in a checklist that fills in, using burst={false}, a small size and a staggered delay.

## When not to use

- A checkbox the user toggles: use checkbox-draw.
- Confirming routine actions without changing the screen: use a toast-stack success toast.
- Showing progress through several stages before the result: use multi-step-loader, which ends on this check.

## Pick by what matters

| Need | Use |
| --- | --- |
| Check that grows out of the button | SuccessButton with status from your request |
| Mark on a filled surface | plain, which draws no circle |
| Big result icon | size={72} (default) with burst |
| Failure | variant="error" |
| Inline list ticks | size={20} burst={false} delay={i * 0.15} |
| Brand color | className="text-primary" (everything uses currentColor) |
| Replay on retry | playKey={attempt} |

## Usage

```tsx
import { SuccessCheck } from "@/components/goodui/success-check"
import { Button } from "@/components/ui/button"

export function PaymentResult({ ok, attempt, onRetry }: { ok: boolean; attempt: number; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <SuccessCheck variant={ok ? "success" : "error"} playKey={attempt} size={76} />
      <h2 className="text-lg font-semibold">{ok ? "Deposit paid" : "Card declined"}</h2>
      <p className="text-sm text-muted-foreground">
        {ok ? "$40 deposit for Thu, Nov 6 · 2:30 PM" : "Visa ending 4242 was declined. Try another card."}
      </p>
      {!ok && <Button onClick={onRetry}>Try again</Button>}
    </div>
  )
}
```

### Checklist ticks that land one after another

```tsx
{["Deposit received", "Slot reserved", "Confirmation sent"].map((item, i) => (
  <div key={item} className="flex items-center gap-2 text-sm">
    <SuccessCheck size={20} burst={false} delay={i * 0.15} aria-hidden />
    {item}
  </div>
))}
```

## API

### SuccessCheck

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| variant | `"success" \| "error"` | `"success"` | "success" draws a check, "error" draws an X. |
| size | `number` | `72` | Diameter in px. The burst reaches about 15% beyond it. |
| burst | `boolean` | `true` | Rays and a ring that shoot outward once the mark lands. |
| delay | `number` | `0` | Seconds before the drawing starts. |
| playKey | `React.Key` | — | Change it to play the animation again. |
| label | `string` | — | Accessible name. Defaults to "Success" or "Error". |
| plain | `boolean` | `false` | Draws only the mark and burst, with no circle, and sooner: for a mark on a filled surface such as a button. |

Also accepts every <span> attribute.

### SuccessButton

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| status | `"idle" \| "loading" \| "success" \| "error"` | `"idle"` | Drive it from your request: idle, then loading, then success or error, then idle again. |
| size | `number` | `40` | Height in px; the button collapses into a circle of this size. |
| children | `React.ReactNode` | — | Content. |
| labels | `Partial<SuccessButtonLabels>` | — | Announced to screen readers; pass translations here. |

Also accepts every <motion.button> attribute.

## Accessibility

- The root is role="img" with aria-label "Success" or "Error"; pass label for a specific or translated name ("Payment received").
- It is not a live region. If the result appears without navigation, put the message in a role="status" element so it is announced.
- Color is not the only signal: success draws a check and error draws an X.

## Motion

- The circle outline draws in 0.5 s, the tinted fill springs in from 0.6 scale at 0.28 s (stiffness 260, damping 18), then the check draws in 0.32 s from 0.42 s (the X draws its two strokes at 0.42 s and 0.58 s).
- At about 0.6 s the icon pops to 1.08x and back in 0.35 s, while a ring expands to 1.4x and fades over 0.7 s and eight rays shoot out over 0.5 s. All times shift by delay.
- Strokes stay transparent until their own draw starts, so round caps never show a dot early.
- Reduced motion: the finished icon is shown at once, with no pop and no burst. The setting is read after mount, so server and client render the same markup.

## Notes for AI

- Replay by changing playKey (or variant); do not remount the parent just to replay it.
- size is a number in px; color comes from className text-* (defaults emerald for success, rose for error).
- Use burst={false} at small sizes; the burst reaches about 15% beyond the circle and can clip in tight rows.
- Pass label when the meaning is more specific than "Success" or "Error", or when your UI is not in English.

## FAQ

**How do I show it after a request finishes?**

Render it when the result arrives (or change playKey); it plays on mount. Add confetti for big moments.

**Can I change the timing?**

delay shifts the whole sequence. The durations are fixed in the component; edit the t() calls in the installed file to change them.

## Related

- multi-step-loader: https://goodui.dev/components/feedback/multi-step-loader
- confetti: https://goodui.dev/components/feedback/confetti
- checkbox-draw: https://goodui.dev/components/inputs/checkbox-draw
- toast-stack: https://goodui.dev/components/feedback/toast-stack

Last updated: 2026-11-02

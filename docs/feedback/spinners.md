# Spinners

> Six CSS-only loaders (ring, dots, bars, pulse, orbit, typing) sized in px or presets and painted with currentColor.

CSS loading spinners for React and shadcn: ring, dots, bars, pulse, orbit and typing

Page: https://goodui.dev/components/feedback/spinners

## Install

```bash
npx shadcn@latest add @goodui/spinners
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/spinners.json`. The file lands in `components/goodui/spinners.tsx`.

## When to use

- Inside a button or input while a request runs ("Saving…").
- Short waits where the layout of the result is unknown or small.
- A chat or assistant reply in progress: the typing variant.

## When not to use

- Loading a card, list or page whose shape you know: use skeleton-auto, which avoids layout shift.
- Work with known progress (uploads, imports): use progress.
- Multi-stage operations the user should follow: use multi-step-loader.

## Pick by what matters

| Need | Use |
| --- | --- |
| Default in buttons and fields | variant="ring" size="sm" |
| Softer, friendly loading | variant="dots" or "pulse" |
| Audio or data processing feel | variant="bars" |
| Someone is typing / AI is replying | variant="typing" |
| Larger standalone loader | variant="orbit" size="xl" |

## Usage

```tsx
import { Spinner } from "@/components/goodui/spinners"
import { Button } from "@/components/ui/button"

export function SaveButton({ saving }: { saving: boolean }) {
  return (
    <Button disabled={saving} aria-busy={saving}>
      {saving && <Spinner variant="ring" size="sm" label={null} />}
      {saving ? "Saving…" : "Save changes"}
    </Button>
  )
}
```

### Assistant typing indicator

```tsx
<div className="flex items-center gap-2 text-muted-foreground">
  <SpinnerTyping size={20} label="Assistant is typing" />
</div>
```

### Colored with text classes

```tsx
<Spinner variant="orbit" size="xl" className="text-primary" label="Loading calendar" />
<SpinnerBars size="lg" className="text-emerald-500" />
```

## API

### Spinner

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| variant | `"ring" \| "dots" \| "bars" \| "pulse" \| "orbit" \| "typing"` | `"ring"` | Loader style: ring, dots, bars, pulse, orbit or typing. |
| size | `"xs" \| "sm" \| "md" \| "lg" \| "xl" \| number` | `"md"` | Preset or a size in px. |
| label | `string \| null` | `"Loading"` | Read by screen readers. Pass null when a parent already announces the busy state. |

Also accepts every <span> attribute.

### SpinnerRing

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| label | `string \| null` | — | Read by screen readers. Pass null when a parent already announces the busy state. |
| size | `"xs" \| "sm" \| "md" \| "lg" \| "xl" \| number` | — | Preset or a size in px. |

Also accepts every <span> attribute.

### SpinnerDots

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| label | `string \| null` | — | Read by screen readers. Pass null when a parent already announces the busy state. |
| size | `"xs" \| "sm" \| "md" \| "lg" \| "xl" \| number` | — | Preset or a size in px. |

Also accepts every <span> attribute.

### SpinnerBars

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| label | `string \| null` | — | Read by screen readers. Pass null when a parent already announces the busy state. |
| size | `"xs" \| "sm" \| "md" \| "lg" \| "xl" \| number` | — | Preset or a size in px. |

Also accepts every <span> attribute.

### SpinnerPulse

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| label | `string \| null` | — | Read by screen readers. Pass null when a parent already announces the busy state. |
| size | `"xs" \| "sm" \| "md" \| "lg" \| "xl" \| number` | — | Preset or a size in px. |

Also accepts every <span> attribute.

### SpinnerOrbit

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| label | `string \| null` | — | Read by screen readers. Pass null when a parent already announces the busy state. |
| size | `"xs" \| "sm" \| "md" \| "lg" \| "xl" \| number` | — | Preset or a size in px. |

Also accepts every <span> attribute.

### SpinnerTyping

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| label | `string \| null` | — | Read by screen readers. Pass null when a parent already announces the busy state. |
| size | `"xs" \| "sm" \| "md" \| "lg" \| "xl" \| number` | — | Preset or a size in px. |

Also accepts every <span> attribute.

## Accessibility

- By default the root is role="status" with an sr-only "Loading" text, so screen readers announce it.
- label replaces that text (translate it here); label={null} drops the role and hides the spinner from assistive tech, for when a parent already says it is busy.

## Motion

- ring turns every 0.75 s; dots scale and fade over 1.1 s, staggered 0.15 s; bars stretch over 0.9 s, staggered 0.12 s; pulse sends two rings 0.7 s apart on a 1.4 s loop; orbit's outer dot circles in 1.2 s and the inner one reverses in 0.8 s; typing dots hop over 1 s.
- Reduced motion: nothing rotates, scales or hops. Every variant becomes a slow 1.6 s opacity fade, so it still reads as busy.

## Performance

- Pure CSS keyframes on transform and opacity; no JavaScript, no timers. The stylesheet is shared by every spinner on the page.

## Notes for AI

- Size with the size prop (xs 12, sm 16, md 24, lg 32, xl 48, or a number in px); the parts are sized in em from it, so Tailwind size-* classes alone will not scale the inside.
- Color with a text-* class or by inheriting currentColor; there is no color prop.
- Inside a button that already says "Saving…", pass label={null} so it is not announced twice.
- SpinnerRing, SpinnerDots, SpinnerBars, SpinnerPulse, SpinnerOrbit and SpinnerTyping are shortcuts for Spinner with that variant.

## FAQ

**Why is the spinner still moving with reduced motion on?**

It switches to a gentle opacity fade instead of stopping, so people can still tell something is loading.

**Does it line up with text?**

Yes. Each spinner is an inline-flex box of 1em (its font-size is the size in px) with vertical-align: middle, so it sits on the text line next to a label.

## Related

- skeleton-auto: https://goodui.dev/components/feedback/skeleton-auto
- progress: https://goodui.dev/components/numbers/progress
- multi-step-loader: https://goodui.dev/components/feedback/multi-step-loader
- button: https://goodui.dev/components/core/button

Last updated: 2026-11-02

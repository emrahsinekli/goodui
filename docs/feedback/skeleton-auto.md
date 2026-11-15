# Skeleton auto

> SkeletonSwap traces its children's text lines, controls and avatars (<img> or data-skeleton elements) into shimmer blocks with one shared sweep, then cross-fades to the real content; includes line, circle and block primitives.

Auto skeleton loader for React and shadcn: shimmer placeholders traced from your real layout

Page: https://goodui.dev/components/feedback/skeleton-auto

## Install

```bash
npx shadcn@latest add @goodui/skeleton-auto
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/skeleton-auto.json`. The file lands in `components/goodui/skeleton-auto.tsx`.

## When to use

- Cards, lists and profiles that load data, where you want a skeleton shaped exactly like the result without drawing one by hand.
- Layouts that change often: the skeleton follows the markup, so it never drifts out of date.
- Hand-made skeletons too: Skeleton, SkeletonLine and SkeletonCircle share the same shimmer.

## When not to use

- Short waits in a button or input: use spinners.
- Operations with known progress: use progress.
- Multi-stage tasks the user should follow step by step: use multi-step-loader.

## Pick by what matters

| Need | Use |
| --- | --- |
| Skeleton shaped like the real content | <SkeletonSwap loading> with placeholder data as children |
| Full control over the shapes | fallback={…} built from SkeletonLine / SkeletonCircle / Skeleton |
| Avatar or chart as one solid block | data-skeleton on that element |
| Leave a part out (badges, decorations) | data-skeleton-ignore on that element |
| Standalone placeholder block | <Skeleton className="h-24 w-full rounded-xl" /> |

## Usage

```tsx
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { SkeletonSwap } from "@/components/goodui/skeleton-auto"

const placeholder = { name: "Maya Chen", email: "maya.chen@hey.com", notes: "Prefers Priya for color. Patch test before every appointment." }

export function ClientCard({ client, loading }: { client?: typeof placeholder; loading: boolean }) {
  const c = client ?? placeholder
  return (
    <SkeletonSwap loading={loading} className="rounded-xl border bg-card p-5">
      <div className="flex items-center gap-3">
        <Avatar className="size-12" data-skeleton>
          <AvatarFallback>{c.name.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="font-semibold">{c.name}</div>
          <div className="text-sm text-muted-foreground">{c.email}</div>
        </div>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{c.notes}</p>
    </SkeletonSwap>
  )
}
```

### Hand-made fallback

```tsx
<SkeletonSwap
  loading={loading}
  className="rounded-xl border bg-card p-4"
  fallback={
    <div className="flex items-center gap-3">
      <SkeletonCircle size={36} />
      <div className="flex flex-1 flex-col gap-2">
        <SkeletonLine width="45%" />
        <SkeletonLine width="70%" className="h-2.5" />
      </div>
    </div>
  }
>
  <LocationSummary location={location} />
</SkeletonSwap>
```

### Primitives on their own

```tsx
<div className="flex flex-col gap-2">
  <Skeleton className="h-32 w-full rounded-xl" />
  <SkeletonLine width="60%" />
  <SkeletonLine width={120} />
</div>
```

## API

### Skeleton

Also accepts every <div> attribute.

### SkeletonLine

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| width | `number \| string` | `"100%"` | CSS width, e.g. "60%" or 120. |

Also accepts every <div> attribute.

### SkeletonCircle

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| size | `number` | `40` | Diameter in px. |

Also accepts every <div> attribute.

### SkeletonSwap

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| loading (required) | `boolean` | — | While true, the children are hidden and the skeleton shows; set it to false to cross-fade to the content. |
| children (required) | `React.ReactNode` | — | The real content. While loading, render it with placeholder data: it stays invisible and its layout is traced into skeleton blocks. Mark parts with data-skeleton (one solid block) or data-skeleton-ignore (skip). |
| fallback | `React.ReactNode` | — | Hand-made skeleton instead of the traced one. |
| loadingLabel | `string` | `"Loading…"` | Announced to screen readers while loading. |

Also accepts every <div> attribute.

## Accessibility

- While loading, the root has aria-busy and an sr-only role="status" says loadingLabel (default "Loading…"; pass a translation).
- The placeholder content is inert and aria-hidden while loading, so nobody can focus or read the fake data; the skeleton layer is aria-hidden too.

## Motion

- One highlight band sweeps across every block every 1.7 s; each block offsets it by its own x position, so it reads as a single sweep over the whole layout.
- Switching loading cross-fades the skeleton and the content over 350 ms (ease [0.4, 0, 0.2, 1]).
- Reduced motion: the sweep is hidden, blocks stay static and the cross-fade shortens to 150 ms.

## Performance

- Tracing walks the content's DOM once per change: one block per wrapped text line (via Range rects) and one per image, svg, video, canvas, input, textarea, select, button, picture, iframe, progress, meter or data-skeleton element.
- It re-traces on resize (ResizeObserver) and DOM mutations (MutationObserver), batched to one animation frame, and only while loading is true.

## Notes for AI

- Render the real component with realistic placeholder data while loading; empty strings produce no text lines and therefore no skeleton.
- Mark avatars, charts and thumbnails with data-skeleton so they become one block; a text-only avatar fallback would otherwise trace as a short text line.
- className goes on the root (it keeps your padding and border); the skeleton is positioned against its padding box.
- With fallback, nothing is traced; the fallback sits in the same grid cell as the content.
- Elements with display: none or visibility: hidden are skipped automatically.

## FAQ

**Does it work on the server?**

Blocks are measured in the browser in a layout effect, so the server HTML has the invisible content (keeping the right size) and the blocks appear before the first paint after hydration.

**Why are my text bars shorter than the line?**

Each bar is 62% of the line height (at least 6px) and centered on it, like real glyphs, and is clipped to its parent's box.

## Related

- spinners: https://goodui.dev/components/feedback/spinners
- progress: https://goodui.dev/components/numbers/progress
- multi-step-loader: https://goodui.dev/components/feedback/multi-step-loader
- card: https://goodui.dev/components/core/card

Last updated: 2026-11-02

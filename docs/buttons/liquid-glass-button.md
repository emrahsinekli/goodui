# Liquid glass button

> Frosted glass button and pill toolbar with backdrop blur, rim light and a specular highlight that follows the pointer, falling back to a solid tint without backdrop-filter.

Liquid glass button and toolbar for React and shadcn: frosted glassmorphism UI

Page: https://goodui.dev/components/buttons/liquid-glass-button

## Install

```bash
npx shadcn@latest add @goodui/liquid-glass-button
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/liquid-glass-button.json`. The file lands in `components/goodui/liquid-glass-button.tsx`.

## When to use

- Controls floating over photos, maps, video or colorful gradients, where a solid button would cover the content.
- A floating view switcher (List / Calendar / Map) over a busy screen: LiquidGlassToolbar with a gliding lens.
- Hero sections with an aurora or image background that call for an iOS-style glass look.

## When not to use

- On a plain white or dark page: glass has nothing to blur and looks washed out. Use button (variant="glass" if you still want the look on a tinted card).
- Switching views in a normal app header: use segmented-control or tabs-indicator, which have proper tab semantics.
- Long-lived app navigation on mobile: use bottom-nav.

## Pick by what matters

| Need | Use |
| --- | --- |
| Over bright or colorful backdrops | tone="light" (default) |
| Over dark photos or night scenes | tone="dark" |
| Single action | LiquidGlassButton |
| Pick one view of several | LiquidGlassToolbar + LiquidGlassToolbarItem |
| Text labels hidden on phones | compact on each item, with the text wrapped in a <span> |
| Preview the no-blur fallback | fallback |

## Usage

```tsx
import { CalendarDays, LayoutList, Map } from "lucide-react"
import { LiquidGlassToolbar, LiquidGlassToolbarItem } from "@/components/goodui/liquid-glass-button"

export function ViewSwitcher({ view, onViewChange }: { view: string; onViewChange: (v: string) => void }) {
  return (
    <LiquidGlassToolbar value={view} onValueChange={onViewChange} aria-label="Bookings view">
      <LiquidGlassToolbarItem value="list" compact>
        <LayoutList />
        <span>List</span>
      </LiquidGlassToolbarItem>
      <LiquidGlassToolbarItem value="calendar" compact>
        <CalendarDays />
        <span>Calendar</span>
      </LiquidGlassToolbarItem>
      <LiquidGlassToolbarItem value="map" compact>
        <Map />
        <span>Map</span>
      </LiquidGlassToolbarItem>
    </LiquidGlassToolbar>
  )
}
```

### Single glass button over a photo

```tsx
<div className="relative h-64 overflow-hidden rounded-2xl bg-[url(/salon.jpg)] bg-cover">
  <LiquidGlassButton size="lg" className="absolute start-4 bottom-4">
    Book this stylist
  </LiquidGlassButton>
</div>
```

### Dark tone icon button

```tsx
<LiquidGlassButton tone="dark" size="icon" aria-label="Share">
  <Share2 />
</LiquidGlassButton>
```

## API

### LiquidGlassButton

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| tone | `"light" \| "dark"` | `"light"` | "light" is a white tint for colorful or bright backdrops; "dark" a smoky tint. |
| blur | `number` | `14` | Backdrop blur in px. |
| fallback | `boolean` | — | Force the no-backdrop-filter look (to preview the fallback). |
| size | `"sm" \| "md" \| "lg" \| "icon"` | `"md"` | "sm" \| "md" \| "lg" \| "icon"; "icon" is a round 44px button. |

Also accepts every <button> attribute.

### LiquidGlassToolbar

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| tone | `"light" \| "dark"` | `"light"` | "light" is a white tint for colorful or bright backdrops; "dark" a smoky tint. |
| blur | `number` | `16` | Backdrop blur in px. |
| fallback | `boolean` | — | Force the no-backdrop-filter look (to preview the fallback). |
| value | `string` | — | Controlled selected item (the item's value). |
| defaultValue | `string` | — | Initially selected item when uncontrolled. |
| onValueChange | `(value: string) => void` | — | Called with the item's value when an item is clicked. |

Also accepts every <div> attribute.

### LiquidGlassToolbarItem

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| value (required) | `string` | — | Identifies the item; when it matches the toolbar's value the item is selected (aria-pressed). |
| compact | `boolean` | — | Hide the text label on small screens and keep only the icon. |

Also accepts every <button> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Enter / Space | Activates a button or selects a toolbar item (native <button>). |
| Arrow Left / Arrow Right | Toolbar: moves focus to the previous or next enabled item, wrapping at the ends (swapped under dir="rtl"). |
| Home / End | Toolbar: moves focus to the first or last enabled item. |
| Tab | Toolbar: only the selected item is in the tab order (all items when nothing is selected). |

## Accessibility

- LiquidGlassToolbar has role="toolbar" and aria-orientation="horizontal"; give it an aria-label.
- Toolbar items are <button>s with aria-pressed showing the selected one.
- Text is white with a soft shadow; on very light backdrops check legibility, or use fallback, which (in the light tone) puts dark text on a near-opaque white tint.
- Browsers without backdrop-filter automatically get the solid fallback tint.

## Motion

- Button: hover scales to 1.03, press to 0.95, on a spring (stiffness 500, damping 26).
- A specular highlight follows the pointer through CSS variables and brightens on hover over 0.35 s.
- Toolbar: the selected lens glides between items with a shared layout animation (spring, stiffness 420, damping 32).
- Reduced motion: no hover or press scale, the lens jumps instead of gliding, and the highlight changes without a transition.

## Performance

- The highlight writes CSS variables on pointer move, so it never re-renders React. backdrop-filter costs GPU time; avoid dozens of glass elements over video.

## Notes for AI

- Place it over something worth blurring (image, gradient, aurora); on a flat background it looks like a washed-out button.
- Toolbar items need a unique value; control the toolbar with value/onValueChange or set defaultValue.
- compact hides a <span> child of the item below the sm breakpoint, so wrap the text label in <span> and keep the icon outside it.
- Sizes are sm, md, lg, icon; tone is light or dark. The glass button is always fully rounded.
- Icon-only items and buttons need an aria-label.

## FAQ

**What happens in browsers without backdrop-filter?**

An @supports rule switches to a near-opaque white (light tone) or smoky (dark tone) tint with readable text. Pass fallback to preview it anywhere.

**Is the toolbar a tab list?**

No. It is a toolbar of toggle buttons (aria-pressed). For tab panels, use tabs or tabs-indicator.

## Related

- segmented-control: https://goodui.dev/components/navigation/segmented-control
- button: https://goodui.dev/components/core/button
- aurora: https://goodui.dev/components/backgrounds/aurora
- dock: https://goodui.dev/components/navigation/dock

Last updated: 2026-11-02

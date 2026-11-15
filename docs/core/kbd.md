# Kbd

> Keyboard keys and combos in flat, raised 3D, outline, glass, neo and solid styles. Keycaps depress when the real keys are pressed, Mod maps to ⌘ or Ctrl, and onTrigger turns any combo or G-then-T sequence into a working hotkey.

Keyboard shortcut (kbd) component for React and shadcn: ⌘/Ctrl aware keycaps and working hotkeys

Page: https://goodui.dev/components/core/kbd

## Install

```bash
npx shadcn@latest add @goodui/kbd
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/kbd.json`. The file lands in `components/goodui/kbd.tsx`.

## When to use

- Showing a shortcut next to a menu item, button or search box: ⌘K, Ctrl+S, Esc.
- Shortcut cheat sheets and onboarding tips, with keycaps that press down when the real keys do.
- Wiring the shortcut you display at the same time: onTrigger turns the same combo into a working hotkey, including G-then-T sequences.

## When not to use

- A full command menu: use command-palette-morph and show its shortcut with Kbd.
- Inline code or identifiers (API keys, file names): use text with variant="code".
- Status or count labels: use badge.

## Pick by what matters

| Need | Use |
| --- | --- |
| Hints inside menus and inputs | variant="flat" or "outline", size="xs", animation="none" |
| Docs and cheat sheets | variant="raised" (default) with animation="press" |
| Branded or highlighted shortcut | variant="solid" with a tone, or animation="glow" |
| On images or gradients | variant="glass" |
| Playful or retro brands | variant="neo" |
| Two-key sequences like G then D | separator="then" with onTrigger |
| Words instead of symbols (Shift, Enter, Cmd) | symbols={false} |

## Usage

```tsx
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { Kbd } from "@/components/goodui/kbd"

export function SearchTrigger({ onOpen }: { onOpen: () => void }) {
  const router = useRouter()

  return (
    <div className="flex items-center gap-4">
      <button type="button" onClick={onOpen} className="flex w-64 items-center gap-2 rounded-lg border px-3 py-2 text-sm text-muted-foreground">
        <Search className="size-4" />
        Search clients and bookings
        <Kbd keys="Mod+K" size="xs" variant="flat" className="ms-auto" onTrigger={onOpen} />
      </button>
      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        Go to calendar <Kbd keys={["G", "C"]} separator="then" onTrigger={() => router.push("/calendar")} />
      </span>
    </div>
  )
}
```

### Cheat sheet row

```tsx
<div className="flex items-center justify-between text-sm">
  <span>New booking</span>
  <Kbd keys="Mod+Shift+B" size="md" />
</div>
```

### Single key

```tsx
<Kbd variant="outline" size="xs" animation="none">Esc</Kbd>
```

### Translated screen-reader names

```tsx
<Kbd
  keys={["G", "T"]}
  separator="then"
  labels={{ then: "dann", keyName: (name) => (name === "Command" ? "Befehl" : name === "Control" ? "Steuerung" : name) }}
/>
```

## API

### Kbd

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| keys | `string[] \| string` | — | Keys of the combo: ["Mod", "Shift", "P"] or "Mod+Shift+P". |
| children | `React.ReactNode` | — | Single key content, used when `keys` is not set. |
| variant | `"flat" \| "raised" \| "outline" \| "glass" \| "neo" \| "solid"` | `"raised"` | Keycap style: flat, raised 3D (default), outline, glass, neo or solid. |
| tone | `"primary" \| "neutral" \| "success" \| "warning" \| "danger" \| "info"` | `"neutral"` | Keycap accent color; neutral (default) keeps it gray. |
| size | `"xs" \| "sm" \| "md" \| "lg"` | `"sm"` |  |
| shape | `"square" \| "rounded" \| "pill"` | `"rounded"` |  |
| separator | `"plus" \| "none" \| "then"` | `"plus"` | Between keys: plus (a combo), none, or then (a sequence; onTrigger then waits for the keys in order). |
| font | `"sans" \| "mono"` | `"sans"` | Keycap font; mono uses --font-mono. |
| symbols | `boolean` | `true` | Show ⌘ ⇧ ⌥ ↵ ⌫ arrows instead of words. |
| animation | `"none" \| "press" \| "glow"` | `"press"` | press depresses a keycap while its real key is held; glow adds a tone glow. none adds no key listeners. |
| onTrigger | `(e: KeyboardEvent) => void` | — | Fires when every key of the combo is down (or, with separator="then", when the sequence is typed). |
| preventDefault | `boolean` | `true` | Prevent the browser default when onTrigger fires (e.g. Ctrl+K focusing the address bar). |
| allowInInputs | `boolean` | `false` | Fire in text fields too. By default combos without Mod/Ctrl/Cmd/Alt are ignored while typing. |
| labels | `Partial<KbdLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <kbd> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| The keys you pass | With animation="press" or "glow" (or onTrigger), each keycap reacts while its real key is held. Listeners are on window, so focus can be anywhere. |
| The full combo (e.g. Mod+K) | Calls onTrigger once when every key is down (not on auto-repeat) and prevents the browser default unless preventDefault={false}. |
| Sequences (separator="then") | Calls onTrigger when the keys are typed in order with less than 1.2 s between them; modifier presses are ignored. |

## Accessibility

- Renders a <kbd> wrapping one <kbd> per key, the HTML pattern for key combinations.
- Symbols (⌘ ⇧ ⌥ ↵ ↑…) are aria-hidden and paired with visually hidden names ("Command", "Shift", "Up arrow"). Translate them with labels.keyName; labels.then translates the visible "then".
- The + and "then" separators are aria-hidden.
- Single-key and Shift-only hotkeys are ignored while typing in inputs, textareas, selects and contenteditable, so they do not steal text input. Combos with Mod, Ctrl, Cmd or Alt still fire; allowInInputs makes all of them fire.

## Motion

- press (default): a keycap depresses for as long as its key is held, in 90 ms. raised and solid move down 2px and lose their bottom edge, neo slides into its shadow, flat, outline and glass shrink to 0.92 and tint.
- glow: the held keycap also gets a tone-colored ring and glow.
- Reduced motion: keycaps do not move; only the background color changes while a key is held.

## Performance

- Every Kbd with animation other than "none", or with onTrigger, adds keydown, keyup and blur listeners on window. In long static lists (menus with 20 shortcuts), use animation="none" and keep onTrigger to the ones you need.

## Notes for AI

- Write "Mod" for the platform modifier: it shows ⌘ on Mac and Ctrl elsewhere and matches Meta or Control. keys accepts "Mod+Shift+P" or ["Mod", "Shift", "P"]; "Ctrl++" means the plus key.
- Use children only for a single key without keys. Do not render your own + between Kbd elements; pass all keys to one Kbd.
- onTrigger replaces a separate hotkey hook for that shortcut; do not register the same combo twice. Set preventDefault={false} if the browser action should still happen.
- The platform is detected after mount, so the first server render shows Ctrl; that is expected.
- Default is variant="raised" tone="neutral" size="sm" symbols animation="press".

## FAQ

**Can it replace a hotkeys library?**

For shortcuts that are also shown on screen, yes: onTrigger handles combos, Mac/Windows modifiers, auto-repeat, inputs and G-then-T sequences. It only listens while the Kbd is mounted.

**Does it work on Mac and Windows?**

Yes. Mod shows ⌘ on Mac (detected from the platform after mount) and Ctrl elsewhere, and Alt shows ⌥ on Mac. Releasing any modifier or leaving the window releases every keycap, so none get stuck after ⌘+Tab.

## Related

- command-palette-morph: https://goodui.dev/components/navigation/command-palette-morph
- text: https://goodui.dev/components/core/text
- badge: https://goodui.dev/components/core/badge
- button: https://goodui.dev/components/core/button

Last updated: 2026-11-02

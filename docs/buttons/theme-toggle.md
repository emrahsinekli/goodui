# Theme toggle

> Light/dark toggle that reveals the new theme as a circle from the click point with the View Transitions API while the sun morphs into a moon.

Dark mode toggle for React and shadcn: circular reveal with View Transitions

Page: https://goodui.dev/components/buttons/theme-toggle

## Install

```bash
npx shadcn@latest add @goodui/theme-toggle
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/theme-toggle.json`. The file lands in `components/goodui/theme-toggle.tsx`.

## When to use

- The light/dark switch in an app header, settings menu or marketing navbar.
- Sites that toggle the `dark` class on <html> (the shadcn default) and want a polished switch without extra libraries.
- A settings row where a labeled switch is clearer: variant="pill".

## When not to use

- You need a third "System" option: use segmented-control with Light / Dark / System and set the class yourself.
- Your app is already wired to next-themes: call its setTheme from a button (or segmented-control); this component flips the <html> class directly and does not talk to next-themes.
- Toggling an ordinary setting: use switch.

## Pick by what matters

| Need | Use |
| --- | --- |
| Compact icon in a header | variant="icon" (default) |
| Two-icon switch in a settings panel | variant="pill" (role="switch") |
| No circular reveal | transition="none" |
| Remember the choice | storageKey="theme" plus a small script that applies it before paint |

## Usage

```tsx
import { ThemeToggle } from "@/components/goodui/theme-toggle"

export function AppHeader() {
  return (
    <header className="flex h-14 items-center justify-between border-b px-4">
      <span className="font-semibold">Brightside Cleaning</span>
      <ThemeToggle storageKey="theme" />
    </header>
  )
}
```

### Apply the saved theme before first paint (Next.js app/layout.tsx)

```tsx
<html lang="en" suppressHydrationWarning>
  <head>
    <script
      dangerouslySetInnerHTML={{
        __html: "try{if(localStorage.getItem('theme')==='dark'){document.documentElement.classList.add('dark')}}catch(e){}",
      }}
    />
  </head>
  <body>{children}</body>
</html>
```

### Pill switch with translated labels

```tsx
<ThemeToggle
  variant="pill"
  labels={{ darkTheme: "Modo oscuro", toLight: "Cambiar a tema claro", toDark: "Cambiar a tema oscuro" }}
  onThemeChange={(theme) => saveUserPreference({ theme })}
/>
```

## API

### ThemeToggle

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| onThemeChange | `(theme: Theme) => void` | — | Called after the `dark` class on <html> changes. |
| duration | `number` | `550` | Milliseconds for the circular reveal. |
| transition | `"circle" \| "none"` | `"circle"` | "circle" uses the View Transitions API when available; "none" switches instantly. |
| storageKey | `string` | — | Save the choice in localStorage under this key and apply the saved choice on mount (off by default). Add a head script to avoid a flash before hydration. |
| variant | `"icon" \| "pill"` | `"icon"` | "icon" is a round icon button; "pill" a two-icon switch. |
| labels | `Partial<ThemeToggleLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <button> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Enter / Space | Toggles the theme (native <button>); keyboard toggles start the reveal from the button center. |
| Tab | Moves focus; a focus ring shows on keyboard focus only. |

## Accessibility

- variant="icon": a <button> whose aria-label says what will happen ("Switch to dark theme" / "Switch to light theme").
- variant="pill": role="switch" with aria-checked for dark and aria-label "Dark theme".
- All three strings come from labels, so they can be translated.
- It also sets color-scheme on <html>, so native scrollbars and form controls follow the theme.

## Motion

- With the View Transitions API, the new theme spreads as a circle from the click point (or the button center for keyboard) over `duration` ms (550) on cubic-bezier(0.4, 0, 0.2, 1).
- The icon morphs on a spring (stiffness 260, damping 22): the sun's core grows into a moon as a mask circle slides in and the rays spin away; the icon variant also turns once (stiffness 120, damping 16). The pill thumb slides on a spring (500, 32).
- The theme found on mount is shown without animation; only real changes animate.
- transition="none" or no View Transitions support: the theme switches instantly while the icon still morphs.
- Reduced motion: the theme switches instantly, the icon and pill thumb change without animation, and there is no tap scale.

## Notes for AI

- It toggles the `dark` class and color-scheme on document.documentElement; it does not render children and has no value prop. It mirrors outside class changes through a MutationObserver.
- storageKey saves the choice and applies the saved choice when the toggle mounts. That happens after hydration, so also add the small <head> script that applies it before paint, or the page can flash.
- If you use next-themes, do not combine it with this component; both would write the <html> class.
- The button is invisible (opacity 0) until mounted, to avoid showing the wrong icon during hydration.
- Translate through labels: toLight, toDark, darkTheme.

## FAQ

**Why does my page flash light on reload?**

With storageKey the toggle saves the choice and re-applies it on mount, but it cannot run before the first paint. Add a tiny inline script in <head> that reads the key and adds the dark class.

**Which browsers show the circular reveal?**

Browsers that support document.startViewTransition. Others switch instantly, with the icon still animating.

## Related

- switch: https://goodui.dev/components/core/switch
- segmented-control: https://goodui.dev/components/navigation/segmented-control
- switch-spring: https://goodui.dev/components/inputs/switch-spring
- button: https://goodui.dev/components/core/button

Last updated: 2026-11-02

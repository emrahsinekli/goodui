# Code block

> Syntax-colored code from a built-in tokenizer or your own tokens, with theme-derived colors, line numbers, highlighted lines, a file tab, copy with a drawn check, a wrap toggle and a staggered line entrance.

Code block component for React: syntax colors from the theme, line numbers, copy button, wrap toggle and file tab

Page: https://goodui.dev/components/ai/code-block

## Install

```bash
npx shadcn@latest add @goodui/code-block
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/code-block.json`. The file lands in `components/goodui/code-block.tsx`.

## When to use

- Code in assistant answers, docs and settings pages, with copy and wrap built in.
- Short snippets in a dozen common languages without shipping a highlighter.
- Pre-highlighted tokens from shiki or prism when you already run one: pass tokens and keep the colors consistent.

## When not to use

- Editable code: use an editor component.
- Highlighting for rare languages with exact grammar needs: run shiki and pass tokens.

## Pick by what matters

| Need | Use |
| --- | --- |
| Snippet in a message | code + language (chat-message does this for fences) |
| File context | fileName="lib/pricing.ts" |
| Draw attention to lines | highlightLines={[9, 10]} |
| Your own highlighter | tokens={lines} with CodeToken types |
| Answer that appears progressively | appear="lines" |

## Usage

```tsx
import { CodeBlock } from "@/components/goodui/code-block"

<CodeBlock
  fileName="app/api/bookings/route.ts"
  language="ts"
  highlightLines={[9, 10]}
  maxHeight={380}
  code={source}
/>
```

### Tokens from shiki

```tsx
const { tokens } = await highlighter.codeToTokens(code, { lang: "tsx", theme: "github-light" })
const lines = tokens.map((line) => line.map((t) => ({ content: t.content, type: typeOf(t) })))
<CodeBlock code={code} tokens={lines} />
```

### Minimal: no header controls

```tsx
<CodeBlock code={cmd} language="bash" showLineNumbers={false} wrapToggle={false} />
```

### Reuse the tokenizer

```tsx
import { tokenizeCode, CodeTokens } from "@/components/goodui/code-block"
const lines = tokenizeCode(src, "json")
```

## API

### CodeBlock

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| code (required) | `string` | — | Source text. Tokenized with the built-in tokenizer unless `tokens` is passed. |
| title | `string` | — | Replaces the language label next to the file tab. |
| onCopy | `(code: string) => void` | — |  |
| language | `"ts" \| "tsx" \| "js" \| "jsx" \| "json" \| "bash" \| "sh" \| "python" \| "py" \| "css" \| "html" \| "sql" \| "yaml" \| "yml" \| "text"` | `"text"` |  |
| tokens | `CodeToken[][]` | — | Pre-tokenized lines from your own highlighter; each token's type picks the color. Overrides the built-in tokenizer. |
| fileName | `string` | — | Shown as a tab in the header, e.g. "lib/booking.ts". |
| showLineNumbers | `boolean` | `true` |  |
| startLine | `number` | `1` | Number of the first line. |
| highlightLines | `number[]` | — | 1-based line numbers (counted from startLine) to highlight. |
| wrap | `boolean` | — | Controlled wrap state. |
| defaultWrap | `boolean` | `false` |  |
| onWrapChange | `(wrap: boolean) => void` | — |  |
| wrapToggle | `boolean` | `true` | Show the wrap toggle. |
| copy | `boolean` | `true` | Show the copy button. |
| maxHeight | `number` | — | Scroll inside the block beyond this height (px). |
| appear | `"none" \| "fade" \| "lines"` | `"none"` | Entrance: lines fade up one after another, the whole block fades, or nothing. |
| labels | `Partial<CodeBlockLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <div> attribute.

### CodeTokens

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| tokens (required) | `CodeToken[]` | — |  |

## Keyboard

| Keys | Action |
| --- | --- |
| Tab | Moves between the wrap toggle and the copy button; Enter or Space activates them. |

## Accessibility

- The copy button is labelled Copy code and announces Copied through a polite live region; the wrap toggle uses aria-pressed.
- Line numbers are aria-hidden and not selectable, so copying a selection gives clean code.
- Token colors are mixed from --chart-1..5 toward the foreground in light mode and toward white in dark mode to keep 4.5:1 contrast on the card background.
- Built-in strings go through the labels prop for translation.

## Motion

- appear="lines" fades each line up 4px with a 28 ms stagger (capped at 24 lines); appear="fade" fades the whole block; the default is static.
- The copy icon scales out as a green check scales in (200 ms) and reverts after 1.6 s.
- Reduced motion: no entrance animation; the icon swap is instant.

## Performance

- The tokenizer is a sticky-regex scanner, one pass per line with a small carry-over state for block comments and template strings; results are memoised on code and language.

## Notes for AI

- Supported languages: ts, tsx, js, jsx, json, bash/sh, python/py, css, html, sql, yaml/yml, text. Unknown languages render plain.
- highlightLines are 1-based and count from startLine.
- Pass tokens (CodeToken[][]) to skip the built-in tokenizer; types are keyword, string, number, comment, function, type, property, punctuation, operator, tag, attr, variable, constant, plain.
- maxHeight makes the body scroll; wrap turns off horizontal scrolling by wrapping lines.

## FAQ

**Is the built-in tokenizer accurate?**

It is a lightweight scanner tuned for readable colors, not a parser. JSX attributes and regex literals are not special-cased. For exact grammars, pass tokens from shiki.

**Can I theme the colors?**

Yes. They derive from --chart-1..5; override the --pc-code-* variables on .pc-code for finer control.

## Related

- diff-view: https://goodui.dev/components/ai/diff-view
- chat-message: https://goodui.dev/components/ai/chat-message
- copy-button: https://goodui.dev/components/buttons/copy-button

Last updated: 2026-11-03

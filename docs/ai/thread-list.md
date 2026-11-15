# Thread list

> Conversation sidebar with search highlighting, pinned and date groups, a selection that glides between rows, hover actions on desktop and swipe-to-reveal on touch, inline rename, delete and arrow-key navigation.

Chat thread sidebar for React: conversation list with search, pin, rename, delete, date groups, hover and swipe actions

Page: https://goodui.dev/components/ai/thread-list

## Install

```bash
npx shadcn@latest add @goodui/thread-list
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/thread-list.json`. The file lands in `components/goodui/thread-list.tsx`.

## When to use

- The left rail of an assistant app: past conversations grouped by Pinned, Today, Yesterday, Previous 7 days, Previous 30 days and Older.
- Any list of named sessions where people pin, rename and delete inline.
- Mobile sheets: swipe a row to reveal actions.

## When not to use

- File or folder trees: use tree-expand.
- Inbox-style lists with avatars, unread counts and multi-select: build a table or list with checkboxes.

## Pick by what matters

| Need | Use |
| --- | --- |
| Hover actions on desktop, swipe on touch | swipe="auto" (default) |
| Always swipe | swipe |
| Flat list without date headings | groupByDate={false} |
| No search field | search={false} |
| Stable server rendering | now={fixedDate} |

## Usage

```tsx
import { ThreadList, type Thread } from "@/components/goodui/thread-list"

<ThreadList
  threads={threads}
  value={activeId}
  onValueChange={open}
  onNew={createThread}
  onPin={(id, pinned) => update(id, { pinned })}
  onRename={(id, title) => update(id, { title })}
  onDelete={remove}
  className="w-72"
/>
```

### Fixed reference time

```tsx
<ThreadList threads={threads} now={new Date("2026-11-03T15:30:00")} />
```

### Translated labels

```tsx
<ThreadList threads={threads} labels={{ search: "Chats durchsuchen", today: "Heute", yesterday: "Gestern", week: "Letzte 7 Tage", newChat: "Neuer Chat" }} />
```

## API

### ThreadList

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| threads (required) | `Thread[]` | — |  |
| defaultValue | `string` | — |  |
| value | `string` | — | Selected thread id (controlled). |
| onValueChange | `(id: string) => void` | — |  |
| onNew | `() => void` | — |  |
| onPin | `(id: string, pinned: boolean) => void` | — |  |
| onRename | `(id: string, title: string) => void` | — |  |
| onDelete | `(id: string) => void` | — |  |
| now | `number \| Date` | — | Reference time for the date groups and relative times. Pass a fixed value for stable server rendering. |
| search | `boolean` | `true` |  |
| groupByDate | `boolean` | `true` | Group under Pinned / Today / Yesterday / … headings. |
| swipe | `boolean \| "auto"` | `"auto"` | Swipe rows to reveal actions: on, off, or only on touch screens (auto). |
| labels | `Partial<ThreadListLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <nav> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| ArrowUp / ArrowDown | Moves focus between rows (wraps). Home / End jump to the first or last row. |
| Enter / Space | Opens the focused thread. |
| F2 | Renames the focused thread inline; Enter saves, Escape cancels. |
| Delete | Deletes the focused thread (when onDelete is set). |
| Tab | Reaches the row's Pin, Rename and Delete buttons, which also appear on hover. |

## Accessibility

- The list is a <nav>; the selected row's button has aria-current="true" and is the only row in the tab order (roving tabindex).
- Row actions are labelled buttons (Pin / Unpin, Rename, Delete) inside a group named "Chat actions"; in swipe mode the hidden tray is inert until revealed.
- Search matches are wrapped in <mark>; unread threads add a hidden "(Unread)" after the title.
- Built-in strings go through the labels prop for translation.

## Motion

- The selection highlight glides between rows as a shared-layout spring (stiffness 520, damping 40); rows spring into new positions when pinned or renamed and collapse on delete.
- Hover actions fade in over a gradient at the row's end; in swipe mode the row follows the finger and snaps open (136px) past 40% of the tray or a 400 px/s flick.
- Reduced motion: no glide, fades only, instant snap.

## Notes for AI

- threads need id, title and updatedAt (ISO string, timestamp or Date); preview, pinned and unread are optional.
- Grouping and relative times use `now`. Without it the component reads the clock after mount, so pass it for static or server rendering.
- Pin, rename and delete only change your data through the callbacks; the component does not keep its own copy of the threads.
- Rows are sorted newest first within each group.

## FAQ

**How do I confirm before deleting?**

Open a dialog in onDelete and remove the thread only after confirmation.

**Can I render it as a plain list without a nav?**

Not through a prop; the root is a <nav> because it is site navigation. Wrap or override with CSS if needed.

## Related

- chat-message: https://goodui.dev/components/ai/chat-message
- chat-composer: https://goodui.dev/components/ai/chat-composer
- list-reorder: https://goodui.dev/components/lists/list-reorder
- tree-expand: https://goodui.dev/components/lists/tree-expand

Last updated: 2026-11-03

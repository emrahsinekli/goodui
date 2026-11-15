# Multi-step Form

> Wizard with numbered, progress-bar or vertical step headers, sync and async per-step validation that blocks Continue and focuses the first invalid field, optional steps with Skip, an auto review step with Edit links, async submit with loading, error retry and success, draft persistence, direction-aware slide or fade transitions and screen-reader step announcements, in card, outline, plain, glass and neo shells with tones and sizes.

Multi-step form (wizard) for React and shadcn: per-step validation, async checks, review step and drafts

Page: https://goodui.dev/components/core/multi-step-form

## Install

```bash
npx shadcn@latest add @goodui/multi-step-form
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/multi-step-form.json`. The file lands in `components/goodui/multi-step-form.tsx`.

## When to use

- Long forms that read better in chapters: booking signups, onboarding, checkout, applications.
- Forms where later questions depend on earlier answers, or where one step needs a server check (email taken, address valid) before going on.
- Flows people leave and come back to: onPersist hands you a snapshot to save as a draft.

## When not to use

- Short forms (under about six fields): one page is faster; use input, select and checkbox directly.
- Showing progress of something the system does (saving, uploading): use multi-step-loader.
- A purely visual progress indicator without a form: use stepper.
- Settings people edit in any order: use tabs with a form per tab.

## Pick by what matters

| Need | Use |
| --- | --- |
| 3–6 short steps | header="numbered" (default) |
| Many steps or narrow cards | header="progress" |
| Long flows on desktop (checkout, applications) | header="vertical" |
| Confirm before sending | review, with fieldLabels or a summary per step |
| Steps people may skip | optional: true on the step |
| Jump around freely | navigation="free" (the current step still validates) |
| Calm transitions | transition="fade" or "none" |

## Usage

```tsx
import { MultiStepForm, type FormStep } from "@/components/goodui/multi-step-form"
import { Input } from "@/components/goodui/input"

type Signup = { name: string; email: string; company: string }

const isEmailFree = async (email: string) => (await fetch("/api/email-free?email=" + encodeURIComponent(email))).ok

const steps: FormStep<Signup>[] = [
  {
    id: "you",
    title: "About you",
    fields: ["name", "email"],
    validate: async (v) => ({
      name: v.name.trim() ? undefined : "Enter your name.",
      email: (await isEmailFree(v.email)) ? undefined : "That email already has an account.",
    }),
    content: ({ values, setValue, error }) => (
      <>
        <Input label="Name" name="name" value={values.name} onValueChange={(s) => setValue("name", s)}
          state={error("name") ? "error" : "default"} message={error("name")} />
        <Input label="Email" name="email" type="email" value={values.email} onValueChange={(s) => setValue("email", s)}
          state={error("email") ? "error" : "default"} message={error("email")} />
      </>
    ),
  },
  {
    id: "company",
    title: "Company",
    optional: true,
    fields: ["company"],
    content: ({ values, setValue }) => <Input label="Company" value={values.company} onValueChange={(s) => setValue("company", s)} />,
  },
]

export function SignupWizard() {
  return (
    <MultiStepForm<Signup>
      steps={steps}
      review
      defaultValues={{ name: "", email: "", company: "" }}
      onSubmit={async (values) => {
        await fetch("/api/signup", { method: "POST", body: JSON.stringify(values) })
      }}
    />
  )
}
```

### Save and restore drafts

```tsx
const [draft, setDraft] = React.useState<MultiStepFormSnapshot<Signup> | null>(null)
React.useEffect(() => {
  const raw = localStorage.getItem("signup-draft")
  if (raw) setDraft(JSON.parse(raw))
}, [])

<MultiStepForm<Signup>
  key={draft ? "draft" : "new"}
  steps={steps}
  defaultValues={draft?.values ?? empty}
  defaultStep={draft?.step}
  defaultCompleted={draft?.completed}
  onPersist={(snap) => localStorage.setItem("signup-draft", JSON.stringify(snap))}
/>
```

### Focus a custom control on error

```tsx
// Select, ToggleGroup and other composite controls: wrap them with data-field so the first
// invalid one gets focus.
<div data-field="plan">
  <ToggleGroup aria-label="Plan" value={values.plan} onValueChange={(p) => setValue("plan", p)} items={plans} />
  {error("plan") && <p className="text-xs text-red-600">{error("plan")}</p>}
</div>
```

### Custom success

```tsx
<MultiStepForm steps={steps} onSubmit={save}
  success={({ values, reset }) => (
    <div className="text-center">
      <p className="font-semibold">Welcome, {values.name}!</p>
      <button onClick={reset}>Add another</button>
    </div>
  )} />
```

## API

### MultiStepForm

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| steps (required) | `FormStep<V>[]` | — |  |
| values | `V` | — | Form values (controlled). |
| defaultValues | `V` | — | Initial values when uncontrolled; also what "Start over" resets to. Pass a saved draft here to restore it. |
| onValuesChange | `(values: V) => void` | — | Called with all values after every change. |
| step | `number` | — | Current step index (controlled). The review step is index steps.length. |
| defaultStep | `number` | `0` | Initial step when uncontrolled, e.g. from a saved draft. |
| onStepChange | `(step: number) => void` | — |  |
| defaultCompleted | `string[]` | — | Step ids already completed or skipped, e.g. from a saved draft (marks them done in the header). |
| review | `boolean` | `false` | Adds a review step that summarizes every step with Edit links. |
| fieldLabels | `Partial<Record<keyof V & string, string>>` | — | Labels for the auto review summary: { email: "Email" }. Unlisted names are humanized. |
| onSubmit | `(values: V) => void \| Promise<void>` | — | Called with all values after every step passed. May be async; a thrown Error's message is shown with a retry. |
| success | `React.ReactNode \| ((ctx: { values: V; reset: () => void }) => React.ReactNode)` | — | Shown after a successful submit. A function gets the values and a reset(). |
| onPersist | `(snapshot: MultiStepFormSnapshot<V>) => void` | — | Called after every value or step change with a serializable snapshot, for saving drafts. |
| navigation | `"linear" \| "free"` | `"linear"` | linear: steps ahead are clickable only once visited. free: any step is clickable (the current one still validates). |
| header | `"numbered" \| "progress" \| "vertical" \| "none"` | `"numbered"` | Step header: numbered circles with connecting lines, a progress bar, a vertical list beside the form, or none. |
| transition | `"slide" \| "fade" \| "none"` | `"slide"` | Panel transition between steps: slide follows the direction (and flips in RTL), fade, or none. |
| variant | `"card" \| "outline" \| "plain" \| "glass" \| "neo"` | `"card"` | Shell: card (default), outline, plain (no box), glass or neo. |
| tone | `"primary" \| "neutral" \| "success" \| "warning" \| "danger" \| "info"` | `"primary"` | Accent of the step header, bar and primary button. |
| size | `"sm" \| "md" \| "lg"` | `"md"` |  |
| shadow | `"none" \| "sm" \| "md" \| "lg"` | `"none"` | Shell shadow. Ignored by neo, which has its own offset shadow. |
| headingAs | `"h2" \| "h3" \| "h4"` | `"h3"` | Heading element for step titles. |
| labels | `Partial<MultiStepFormLabels>` | — | Text for buttons, header and screen readers; pass translations here. |

Also accepts every <form> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Enter (in a text field) | Submits the step: validates and moves on, like the primary button. |
| Tab | Through the step header (visited steps), the fields, then Back, Skip and Continue / Submit. |
| Enter / Space on a step in the header | Jumps to that step (back freely; forward only after the current step validates). |

## Accessibility

- Renders a native <form noValidate>; the primary button is type="submit", Back and Skip are type="button".
- The header is a <nav> with an ordered list; the current step has aria-current="step" and each step has a hidden status ("completed", "skipped", "needs attention").
- On every step change a polite live region announces "Step 2 of 4: Contact" and focus moves to the new step's heading, so keyboard and screen-reader users start at the top of the step.
- When validation fails, the live region announces how many fields need attention and focus moves to the first invalid field (found by data-field, then name, then id). Step-level errors and submit errors render with role="alert".
- While an async validator or onSubmit runs, the primary button shows a spinner with aria-busy and the live region says "Checking…" or "Submitting…".
- Every built-in string (buttons, announcements, status words, review texts) goes through labels.

## Motion

- slide: the outgoing step leaves 28px against the direction in 140 ms and the new one enters with a spring (stiffness 420, damping 38); directions flip under dir="rtl".
- fade: opacity with a 6px rise. none: instant.
- Header lines fill over 400 ms as steps complete; the progress bar eases over 450 ms. The default success check pops in with a spring and draws its stroke over 500 ms.
- Reduced motion: step changes are instant and all CSS transitions and animations inside the form are off.

## Performance

- Only the current step is mounted. Validators run on Continue, on header jumps and once more for every non-skipped step on submit, never on keystrokes.
- onPersist runs after every value change; debounce it yourself if it writes to a server.

## Notes for AI

- Type the form: MultiStepForm<Values> with FormStep<Values>[]; setValue is typed per key.
- validate returns nothing when valid, a string for a step-level error, or { field: "message" }. It may be async. Do not throw for validation errors (a thrown Error is shown as a step error).
- Pass errors to fields yourself (Input state="error" message={error("email")}); the wizard does not reach into your inputs.
- List each step's fields in order: they decide which invalid field gets focus and what the auto review shows.
- Any extra <button> inside step content must be type="button", or it submits the step.
- Do not nest another <form> inside a step.
- The review step index is steps.length; controlled step values must account for it.

## FAQ

**Can I use react-hook-form or zod?**

Yes. Keep your values in the wizard (or control them with values + onValuesChange) and call your schema inside validate, returning its field messages as an object.

**What happens if a user jumps ahead with navigation="free" and skips a required step?**

Submit validates every step that was not skipped as optional, jumps back to the first invalid one and focuses its first invalid field.

**Can a step be async on submit only?**

Validators run on Continue and again on submit. If a check is expensive, cache its result in your validator.

## Related

- stepper: https://goodui.dev/components/navigation/stepper
- input: https://goodui.dev/components/core/input
- select: https://goodui.dev/components/core/select
- checkbox: https://goodui.dev/components/core/checkbox
- number-input: https://goodui.dev/components/core/number-input
- toggle-group: https://goodui.dev/components/core/toggle-group
- multi-step-loader: https://goodui.dev/components/feedback/multi-step-loader

Last updated: 2026-11-03

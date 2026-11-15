# Agent plan

> Live checklist of an agent's plan: pending, active with a pulsing halo, drawn check, error and skipped states, nested substeps that fold away when done, and a spring progress bar with a step count.

Agent plan checklist for React: steps with live status, nested substeps, drawn checkmarks and overall progress

Page: https://goodui.dev/components/ai/agent-plan

## Install

```bash
npx shadcn@latest add @goodui/agent-plan
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/agent-plan.json`. The file lands in `components/goodui/agent-plan.tsx`.

## When to use

- Coding or workflow agents that announce a plan and then execute it step by step.
- Long tasks where the user wants to see what is done, what is running and what failed.
- Plans with sub-tasks: migrations under a feature, files under a refactor.

## When not to use

- A single tool invocation with arguments and output: use tool-call.
- A wizard the user walks through: use stepper or multi-step-form.
- Static feature checklists on marketing pages: a plain list with icons.

## Pick by what matters

| Need | Use |
| --- | --- |
| Steps with substeps | steps on a PlanStep; the parent's status is yours to set |
| Keep finished substeps visible | autoCollapse={false} |
| No header bar | showProgress={false} and no title |
| Inside a message without a border | variant="plain" |
| Clickable steps (open a file, show a log) | onStepClick |

## Usage

```tsx
import { AgentPlan, type PlanStep } from "@/components/goodui/agent-plan"

const steps: PlanStep[] = [
  { id: "read", title: "Read the current booking rules", status: "done" },
  { id: "deposit", title: "Add a deposit for Instagram bookings", status: "active", steps: [
    { id: "schema", title: "Add source to the bookings table", status: "done" },
    { id: "rule", title: "Charge 20% for new Instagram clients", status: "active" },
  ] },
  { id: "tests", title: "Run the pricing tests", status: "pending" },
]

<AgentPlan title="Deposit for Instagram bookings" steps={steps} />
```

### Failed step, rest skipped

```tsx
steps={[{ id: "tests", title: "Run tests", status: "error", detail: "2 failing in pricing.test.ts" }, { id: "deploy", title: "Deploy", status: "skipped" }]}
```

### Open the file on click

```tsx
<AgentPlan steps={steps} onStepClick={(s) => openFile(s.detail)} />
```

## API

### AgentPlan

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| steps (required) | `PlanStep[]` | — |  |
| title | `React.ReactNode` | — |  |
| showProgress | `boolean` | `true` | Progress bar and count in the header. |
| autoCollapse | `boolean` | `true` | Substeps fold away once their parent is done (they can be reopened). |
| variant | `"card" \| "plain"` | `"card"` | card: bordered; plain: just the list. |
| onStepClick | `(step: PlanStep) => void` | — |  |
| labels | `Partial<AgentPlanLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <section> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Enter / Space | Toggles substeps on the chevron button; activates a step when onStepClick is set. |

## Accessibility

- The plan is a <section> labelled by its title; the header bar is a progressbar with aria-valuenow and text like "3 of 7 steps".
- Each step's status is read as text (Pending, In progress, Done, Failed, Skipped) before its title; icons are decorative.
- Substep toggles are buttons with aria-expanded and aria-controls. Steps become buttons only when onStepClick is passed.
- Built-in strings go through the labels prop for translation.

## Motion

- Status icons swap on a spring (stiffness 520, damping 26); the done check draws its stroke over 0.28 s; the active step spins with a halo pulsing outward every 1.6 s.
- Steps spring in 6px from below; substeps open to their height on a spring (stiffness 420, damping 36) and fold away when the parent is done (autoCollapse).
- The progress bar scales to the completed share on a spring (stiffness 260, damping 30) and turns green at 100% or rose on an error.
- Reduced motion: no halo, no stroke drawing, instant height changes and plain fades.

## Notes for AI

- Statuses: pending, active, done, error, skipped. Progress counts leaf steps only; done and skipped count as complete.
- Give every step a stable id; it is the React key and the collapse state key.
- Set the parent's status yourself (active while any child runs, done when all are done); the component does not infer it.
- autoCollapse folds substeps of a done parent; the chevron reopens them.

## FAQ

**Can steps be removed or reordered live?**

Yes. Rows animate their position and exit with a fade; keep ids stable.

## Related

- tool-call: https://goodui.dev/components/ai/tool-call
- reasoning-block: https://goodui.dev/components/ai/reasoning-block
- stepper: https://goodui.dev/components/navigation/stepper
- multi-step-loader: https://goodui.dev/components/feedback/multi-step-loader

Last updated: 2026-11-03

# Voice orb

> Breathing voice-assistant orb that swells with a level prop through a spring: idle breathing, listening rings, speaking light that churns faster, and a spinning thinking arc, all in CSS on theme colors.

Voice assistant orb for React: breathing sphere that reacts to audio level with idle, listening, speaking and thinking states

Page: https://goodui.dev/components/ai/voice-orb

## Install

```bash
npx shadcn@latest add @goodui/voice-orb
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/voice-orb.json`. The file lands in `components/goodui/voice-orb.tsx`.

## When to use

- Voice assistants and call agents: one object that shows whether the assistant is idle, listening, thinking or speaking.
- Visualising a microphone or playback level without a waveform.
- Hero or empty-state art for an AI product, kept alive by the slow breathing loop.

## When not to use

- Text chat loading states: use typing-indicator.
- Precise audio visualisation (bars, waveforms) for recording tools: draw a canvas waveform.

## Pick by what matters

| Need | Use |
| --- | --- |
| Microphone input | state="listening" with level from an AnalyserNode |
| Assistant audio playing | state="speaking" with the output level |
| Waiting for the model | state="thinking" |
| Brand colors | color and accent (any CSS color); defaults are --chart-1 and --chart-4 |
| Exact pixel size | size={120} |

## Usage

```tsx
import { VoiceOrb } from "@/components/goodui/voice-orb"

<VoiceOrb state={call.state} level={micLevel} size="lg" />

// level from the Web Audio API
const analyser = audioContext.createAnalyser()
source.connect(analyser)
const data = new Uint8Array(analyser.frequencyBinCount)
function tick() {
  analyser.getByteTimeDomainData(data)
  let sum = 0
  for (const v of data) sum += ((v - 128) / 128) ** 2
  setMicLevel(Math.min(1, Math.sqrt(sum / data.length) * 6))
  requestAnimationFrame(tick)
}
```

### Small orbs in brand colors

```tsx
<VoiceOrb state="idle" size="sm" color="var(--chart-2)" accent="var(--chart-3)" labels={{ idle: "Support bot idle" }} />
```

### Translated state names

```tsx
<VoiceOrb state="listening" labels={{ idle: "Bereit", listening: "Hört zu", speaking: "Spricht", thinking: "Denkt nach" }} />
```

## API

### VoiceOrb

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| color | `string` | — | Main color (any CSS color); defaults to --chart-1. |
| state | `"idle" \| "listening" \| "speaking" \| "thinking"` | `"idle"` |  |
| level | `number` | `0` | Audio level 0..1 (microphone while listening, output while speaking). |
| size | `number \| "sm" \| "md" \| "lg"` | `"md"` | Diameter in px, or a preset. |
| accent | `string` | — | Second color for the inner light; defaults to --chart-4. |
| labels | `Partial<VoiceOrbLabels>` | — | Text for screen readers per state; pass translations here. |

Also accepts every <div> attribute.

## Accessibility

- The visual is role="img" labelled with the current state (Assistant idle, Listening, Speaking, Thinking); a visually hidden role="status" region announces state changes.
- Nothing inside is interactive; wrap it in a button if tapping should start listening.
- Reduced motion stops the breathing, spinning blobs, rings and arc; the state is still shown by a static ring (listening), a dashed ring (thinking) and the level by the orb's size.

## Motion

- Idle: the orb breathes between 1 and 1.045 scale every 4.2 s; two blob layers with conic gradients rotate slowly (11 s and 15 s) under soft-light blending.
- Listening: three rings expand from 0.86 to 1.55 scale every 1.9 s, staggered 0.65 s; the orb scales up to 1.22 with the level. Speaking: the blobs spin fast (2.6 s and 3.4 s) and the glow grows with the level. Thinking: a thin arc spins once per 1.3 s.
- The level goes through a spring (stiffness 220, damping 20, mass 0.6) so bursts feel physical; under reduced motion it jumps.
- Everything loops in CSS on transform and opacity; the glow is one blurred layer.

## Performance

- No canvas or WebGL: three gradient layers, one blur filter and CSS keyframes. Expect well under 1% CPU at rest on a laptop; the blur radius scales with the orb size.

## Notes for AI

- level is 0..1 and only matters in listening and speaking states; feed it 30–60 times a second for a live feel.
- state is one of idle, listening, speaking, thinking. Change it as the call progresses; the orb has no internal state machine.
- Pass color and accent as CSS colors (var(--chart-2), oklch(...)); they drive gradients and glows through CSS variables.

## FAQ

**Why does the level feel delayed?**

It is smoothed through a spring so single noisy frames do not twitch the orb. Lower the stiffness in the source if you want it snappier.

## Related

- typing-indicator: https://goodui.dev/components/ai/typing-indicator
- chat-composer: https://goodui.dev/components/ai/chat-composer
- aurora: https://goodui.dev/components/backgrounds/aurora
- spinners: https://goodui.dev/components/feedback/spinners

Last updated: 2026-11-03

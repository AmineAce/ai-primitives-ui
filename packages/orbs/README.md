# @ai-primitives/ui

Framework-agnostic Canvas 2D loading orbs for React. Monochrome, dependency-free, honors reduced motion.

## Install

```bash
npm install @ai-primitives/ui
# pnpm
pnpm add @ai-primitives/ui
```

Peer dependencies: React 18 or 19. Zero runtime dependencies.

## Usage

```tsx
import { CloningOrb, SyncOrb, orbSizes } from "@ai-primitives/ui";

export function CloningIndicator() {
  return (
    <CloningOrb size={orbSizes.xl} speed={1} aria-label="Cloning repository" />
  );
}
```

## Components — 8 orbs

| Component     | Represents                              |
| ------------- | --------------------------------------- |
| `CloningOrb`  | Cloning a repository                    |
| `SyncOrb`     | Bidirectional sync — square 8×8 → globe |
| `FetchingOrb` | Fetching remote changes                 |
| `PullingOrb`  | Pulling from a remote                   |
| `PushingOrb`  | Pushing local changes                   |
| `MergingOrb`  | Merging branches                        |
| `RebasingOrb` | Rebasing onto a branch                  |
| `StashingOrb` | Stashing working changes                |

Every component accepts the same props (`orbSizes xs 16 → 2xl 96`).

## Props

| Prop         | Type      | Default     | Description                                                             |
| ------------ | --------- | ----------- | ----------------------------------------------------------------------- |
| `size`       | `number`  | `64`        | Width and height of the canvas, in pixels.                              |
| `speed`      | `number`  | `1`         | Animation speed multiplier. Lower is slower.                            |
| `paused`     | `boolean` | `false`     | Freezes the animation at its current phase.                             |
| `color`      | `string`  | inherited   | Overrides `--orb-fg` for this instance.                                 |
| `aria-label` | `string`  | `undefined` | Accessible label describing the operation. Omit to render decoratively. |

## Theming

Orbs render in a neutral monochrome default. Set `--orb-fg` on any ancestor to theme every orb at once, or pass `color` to a single instance — the prop wins. The `color` prop accepts any CSS color; its alpha channel is ignored.

```css
:root {
  --orb-fg: #f0f6fc;
}
```

```tsx
<CloningOrb color="#e6edf3" />
```

## Accessibility

Canvas output is invisible to assistive technology by default. Pass `aria-label` when the indicator communicates something important. `prefers-reduced-motion: reduce` renders a static representation instead of looping.

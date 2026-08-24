# AI Primitives — UI primitives for AI-native interfaces

A dependency-free library of monochrome UI primitives for AI-native interfaces — loading states, thinking traces, streaming text, approval cards, tool chips, and more. Motion is drawn with the plain HTML5 Canvas 2D API: no WebGL, no SVG filters, no blur. Every primitive ships as a small, typed React component.

![AI Primitives](public/og-image.png)

## Primitives — 18 ready, More coming soon

- **Loading State — 8 orbs:** `CloningOrb`, `SyncOrb` (square 8×8 → diagonal shimmer → supernova → globe with 3-ring flash), `FetchingOrb`, `PullingOrb`, `PushingOrb`, `MergingOrb`, `RebasingOrb`, `StashingOrb`
- **Thinking — 2:** `CubeOrb` (Thinking), `ScanOrb`
- **Streaming & Cards — 8:** `StreamingText`, `ApprovalCard`, `ToolChips`, `TaskRows`, `Chat`, `RecommendationCard`, `ContextCards`, `DiffTable`

Live showcase + playground at `/#playground` — 18 pills, `orbSizes xs 16 → 2xl 96`, `size / speed / paused`, Chat one-shot test.

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

export function SyncIndicator() {
  return <SyncOrb size={64} aria-label="Sync" />;
}
```

Every orb accepts `size?: number | OrbSizePreset` (`orbSizes xs 16, sm 24, md 32, lg 48, xl 64, 2xl 96`), `speed?: number` (default `1`), `paused?: boolean`, `color?: string`, `aria-label?: string`.

## Theming

1. **System** — `matchMedia("(prefers-color-scheme: light)")` + inline `THEME_INIT_SCRIPT` in `app/layout.tsx:8` sets `data-theme` before hydration (no FOUC), follows OS when no stored choice.
2. **Global** — `--orb-fg` on any ancestor themes every orb: `:root { --orb-fg: var(--fg-default); }`
3. **Per instance** — `color` prop wins, alpha ignored via `ink()`:

```tsx
<CloningOrb color="#e6edf3" />
```

## Playground

Try every ready primitive live at `http://localhost:3000/#playground` — orbs expose `size / speed / paused`, streaming/approval/tool-chips/task-rows/chat are testable (Chat is one-shot: _Nice, you tried it. This is only a test_).

## Docs

Full docs at `/docs` — grouped primitives (Loading State 8, Thinking 2, Streaming & Cards 8), `orbSizes`, playground link, theming 3 steps, a11y `prefers-reduced-motion`, API tables for `orbs` + `StreamingText` + `DiffTable`.

```bash
pnpm dev      # .next-dev on :3000, Next 14
pnpm check    # format → lint → typecheck → test → gates → build
```

## Links

- Docs: https://ai-primitives.example.com/docs
- GitHub: https://github.com/AmineAce/ai-primitives-ui
- Playground: https://ai-primitives.example.com/#playground

## License

MIT — Built by [AmineAce](https://github.com/AmineAce)

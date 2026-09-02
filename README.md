<div align="center">

<img src="https://ai-primitives-ui.vercel.app/og-image.png" alt="AI Primitives · UI primitives for AI-native interfaces" width="720" />

[![npm version](https://img.shields.io/npm/v/@ai-primitives-ui/ui?label=npm%20package)](https://www.npmjs.com/package/@ai-primitives-ui/ui)
[![npm downloads](https://img.shields.io/npm/dm/@ai-primitives-ui/ui)](https://www.npmjs.com/package/@ai-primitives-ui/ui)
[![Live](https://img.shields.io/badge/Live-ai--primitives--ui.vercel.app-1f2328)](https://ai-primitives-ui.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-6e7781)](https://github.com/AmineAce/ai-primitives-ui)

**UI primitives for AI-native interfaces · monochrome, Canvas 2D only.**

</div>

---

## Why

Most AI interfaces still rely on generic spinners and plain text. These primitives are purpose-built for the states that actually happen when working with models: thinking, streaming tokens, tool use, diffs, approvals, and long-running operations. Monochrome, Canvas 2D, zero dependencies.

## Preview

<p align="center">
  <img src="https://ai-primitives-ui.vercel.app/readme/preview.gif" width="720" alt="AI Primitives: 24 components preview" />
</p>

## Features

- **24 ready primitives**: Loading State (11), Thinking (5), Streaming & Cards (8) + 1 coming soon
- **Zero runtime deps**: peer `react 18/19` only, `sideEffects: false`
- **Canvas 2D only**: no WebGL, SVG filters, or `ctx.filter`
- **Monochrome**: GitHub Primer grayscale via CSS variables (`--orb-fg`)
- **Accessible**: `aria-label`, `prefers-reduced-motion` static frame
- **Typed**: `publint` + `attw` gates, full `d.ts`
- **Theme-aware**: system `matchMedia`, global `--orb-fg`, or per-instance `color`
- **Performance-tuned**: pooled `Dot/Halo`, `IntersectionObserver` pause, DPR-aware

> [!TIP]
> **Try it live → [Playground](https://ai-primitives-ui.vercel.app/#playground) · [Docs](https://ai-primitives-ui.vercel.app/docs)**: every ready primitive, with `size / speed / paused` controls.

## Install

```bash
npm install @ai-primitives-ui/ui
# pnpm
pnpm add @ai-primitives-ui/ui
```

> [!NOTE]
> Peer dependencies: `react ^18 || ^19` and `react-dom`. Zero runtime dependencies.

## Usage

```tsx
import { CloningOrb, SyncOrb, orbSizes } from "@ai-primitives-ui/ui";

export function CloningIndicator() {
  return (
    <CloningOrb size={orbSizes.xl} speed={1} aria-label="Cloning repository" />
  );
}

export function SyncIndicator() {
  return <SyncOrb size={64} aria-label="Sync" />;
}
```

Every orb accepts `size` (`number` or `orbSizes` `xs 16` `sm 24` `md 32` `lg 48` `xl 64` `2xl 96`), `speed` (`1`), `paused`, `color`, `aria-label`. `ProgressOrb` also accepts `value` `0–1` for controlled progress.

> [!TIP]
> `size` is the canvas logical size. Backing store uses `Math.min(devicePixelRatio, 2)` and `fitRadius(size)` so the orb always fits as a full circle: never use raw `R`.

## Primitives

### Loading State · 11 orbs

| Component | What it shows |
$1
| `DownloadOrb` | A file assembles dot by dot, seals with a folded corner, and steadies for handoff |
| `ErrorOrb` | Digital glitch tears, then a `!` holds: honest failure |
| `ProgressOrb` | Ring sweeps around a still globe: 0→100% at a glance |
| `CloningOrb` | Dots spiral onto a sphere, filling layer by layer |
| `SyncOrb` | Square 8×8 → waves → supernova into globe + flash |
| `FetchingOrb` | Packets pulse, snap, peel back |
| `PullingOrb` | Fetch + merge: remote dots integrate |
| `PushingOrb` | Local commits detach and launch |
| `MergingOrb` | Two branches converge at a junction |
| `RebasingOrb` | Orbs replay onto three rings |
| `StashingOrb` | Dots converge, flash, reapply |

### Thinking · 5

| Component | What it shows |
$1
| `DnaOrb` | A double helix assembles base by base: curious, methodical, alive |
| `VerifyOrb` | A vigilant scan sweeps and reinforces: protective, thorough, wary |
| `GraphOrb` | Nodes find each other and link: a living network revealed |
| `CubeOrb` | Cube twists a few turns, then blooms into orb |
| `ScanOrb` | Wavefront sweeps the surface, brightening dots |

### Streaming & Cards · 8

| Component            | What it shows                                     |
| -------------------- | ------------------------------------------------- |
| `StreamingText`      | Tokens appear in sequence as text streams         |
| `ApprovalCard`       | Compact card to confirm or dismiss an action      |
| `ToolChips`          | Chips surfacing which tools the model invoked     |
| `TaskRows`           | Progress rows for multi-step agentic runs         |
| `Chat`               | Message layout for streaming, multi-turn chat     |
| `RecommendationCard` | Inline suggestions and follow-ups after an answer |
| `ContextCards`       | Sources and references the model drew on          |
| `DiffTable`          | Line-by-line code changes in a diff view          |

## Theming

1. **System**: `matchMedia("(prefers-color-scheme: light)")` + inline `THEME_INIT_SCRIPT` in `app/layout.tsx` sets `data-theme` before hydration (no FOUC)
2. **Global**: `--orb-fg` on any ancestor themes every orb:
   ```css
   :root {
     --orb-fg: var(--fg-default);
   }
   ```
3. **Per instance**: `color` wins, alpha is orb-controlled:
   ```tsx
   <CloningOrb color="#e6edf3" />
   ```

> [!NOTE]
> Orbs resolve color as `color prop → --orb-fg → --fg-default → DEFAULT_DOT_RGB`. An explicit `color` is static and does not follow theme flips.

## Performance

> [!TIP]
> Tuned for 60 fps with ~20 concurrent canvases. See `plans/perf-optimization-phases.md` and `audit/baseline.json`.

- **Frame GC**: `Dot/Halo` pools + 64-bucket `ink` LUT (`880 → 64` `toFixed`/frame), `projectWithTrig` hoists `cos/sin`
- **Offscreen**: `IntersectionObserver` (`100px`) + `document.hidden` pauses `rAF`; `paused` skips `clearRect/project/sort`
- **DPR**: `ResizeObserver`/`matchMedia` watches `devicePixelRatio` (cap 2)
- **Heavy hitters**: `StreamingText` final-lines cache, `Rebasing` `pointOnRail` alloc-free, `Merging` trail `6→4`
- **Bundle**: `optimizePackageImports`, `dynamic(ssr:false)` showcase, `preconnect` + `lazy` for `picsum`

Baseline (moto g power, Lighthouse 13.4): `FCP 1.06s · LCP 2.57s · TBT 116ms · GC 36ms` → `First Load 128→131 kB`.

## Playground

Try every ready primitive live: orbs expose `size / speed / paused`.

**→ https://ai-primitives-ui.vercel.app/#playground**

## Docs

Full docs at **https://ai-primitives-ui.vercel.app/docs**: primitives, `orbSizes`, playground, theming, accessibility, API tables.

## Development

```bash
pnpm install
pnpm dev      # .next-dev on :3000, Next 14
pnpm check    # format → lint → typecheck → test → gates → build
```

## License

MIT © AmineAce: see [LICENSE](./LICENSE).

## Contributing

Issues and PRs welcome. Run `pnpm check` before pushing: it covers format, lint, typecheck, tests, gates, and build.

## Links

- **Live** · https://ai-primitives-ui.vercel.app
- **Docs** · https://ai-primitives-ui.vercel.app/docs
- **npm** · https://www.npmjs.com/package/@ai-primitives-ui/ui

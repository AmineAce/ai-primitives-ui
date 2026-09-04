# Changelog

All notable changes to **AI Primitives** are documented here. We follow [Keep a Changelog](https://keepachangelog.com/) and [SemVer](https://semver.org/) — but written for humans, not just git.

> **How to read:** `Added` = new things you can use · `Fixed` = bugs you might have hit · `Changed` = docs/perf wording, no breaking API.

## [2.2.0] — 2026-09-04

Backward-compatible: new props and helpers, slimmer docs. No breaking changes — just `pnpm add @ai-primitives-ui/ui@latest`.

### Added — what you can do now

- **`className`/`style` on all 16 orbs** — forwarded to `CanvasContainer` as `style={{width,height,...style}}`, so `size-4 shrink-0` and friends work inside shadcn layouts.
- **Companions:** `MiniOrb` (16px, collapses when `done`), `drawGlobe` + `GLOBE_POINTS` for dense UI.
- **`orbSizes` / `resolveOrbSize`** (`xs 16 → 2xl 96`), `src/styles.css` theme bridge, `tailwind-preset` for shadcn hosts.
- **Playground deep-links** — every orb links to `/?orb=<id>#playground`; showcase cards live at `/#orb-<id>`.
- **Real docs:** `/docs` is now 4 file-based MDX pages (fumadocs) with sidebar, per-page TOC, Shiki code blocks with copy buttons, and **Cmd+K search that works on the static export**.

### Changed

- Docs rebuilt from product truth: 14 pages → `index`, `installation`, `orbs`, `api-reference`. Counts agree everywhere (16 orbs + `StreamingText`).
- npm README slimmed to a pointer — full docs live on the site, not in the package.
- Next.js `14 → 16` (Turbopack builds), ESLint `9` with flat config; React 19 + Tailwind 4 were already in.
- Docs UI tokens (`fd-*`) remapped onto the monochrome `git-*` palette; site and docs theme toggles share one storage key.

### Removed

- **AI Elements adapters are gone.** `examples/ai-elements/` (vendored, never verified at runtime) is deleted — shadcn is the only integration story. Archived under `archive/docs-2026-09-04/`.
- **Demo-only DOM components are gone.** `ApprovalCard`, `ToolChips`, `TaskRows`, `Chat`, `RecommendationCard`, `ContextCards`, `DiffTable` (plus the orphaned `StageLock` and the unused `useInView` hook) were showcase-only code that never shipped in the package. This library ships 2D canvas orbs **only**: 17 ready primitives (16 orbs + `StreamingText`, plus `OrbitOrb` legacy and `MiniOrb`/`drawGlobe` companions) + 1 coming soon. For DOM needs, pair orbs with shadcn.

### Fixed

- `DownloadOrb`: missing `useMemo` dependency (`unit`) — no visible change at a fixed `size`, correct re-layout when `size` changes.

## [2.1.0] — 2026-09-02

**6 new orbs → 24 ready primitives.** You can now show the full lifecycle of a file or an AI thought, not just generic spinning.

_If you are upgrading from `2.0.4`, no breaking changes — just `pnpm add @ai-primitives-ui/ui@latest`._

### Added — what you can do now

- **File lifecycle, finally honest:**
  - `DownloadOrb` — _Generating File_ — dots become a document, fold the corner, seal it. Use for `Generating report…` or `Exporting`.
  - `ErrorOrb` — _Failed_ — glitch tears the orb, then a crisp `!` holds. Use instead of a red toast for agent failures.
  - `ProgressOrb` — ring + live `0–100%` inside the globe. Pass `value={0.42}` to drive it from your upload / generation, or let it auto-loop. `size/speed/paused` like every orb.
- **Thinking that feels alive:**
  - `DnaOrb` — double helix zips base-by-base. Great for `Sequencing`, `Analyzing genome`.
  - `VerifyOrb` — a calm scan sweeps top→bottom and back, lighting points. Great for `Verifying…`, `Checking sources`.
  - `GraphOrb` — icosphere network lights up wave by wave. Great for `Mapping knowledge`, `Linking nodes`.
- **Playground & docs catch up:** `/` showcase and `/#playground` now show all 24 orbs with `size` / `speed` / `paused` controls. `ProgressOrb` accepts `value={0..1}` as a prop for controlled progress.

```tsx
import { ProgressOrb, DnaOrb, VerifyOrb, GraphOrb, DownloadOrb, ErrorOrb } from "@ai-primitives-ui/ui"

// controlled progress
<ProgressOrb size={64} value={0.72} aria-label="Uploading" />
// thinking
<DnaOrb size={32} aria-label="Sequencing" />
```

### Fixed

- `ProgressOrb` followed `speed` twice as fast as other orbs (now `t % DURATION` — `speed` is only applied once via the hook). Slider feels consistent.
- Docs said `8` orbs and `14` canvases — now `16 orbs (11 Loading + 5 Thinking)` and `~20 canvases`, `23 → 24 ready` in `README`/`public/llms.txt`. No code break, just truth.

### Changed

- `README` / `packages/orbs/README` / `llms.txt` tables now read `25 listed (24 ready + 1 coming soon)` — `Loading 11 · Thinking 5 · Streaming & Cards 8`.
- Performance tip updated to `~20 concurrent canvases` — same optimizations, just honest count for 24 orbs.

_Migration:_ none. `size/speed/paused/color/aria-label` unchanged; only `ProgressOrb` gains optional `value`. `OrbitOrb` stays exported but undocumented (legacy).

## [2.0.4] — 2026-08-28

- **Docs:** preview, why, expanded tables, license, badges.
- Chore: sync `README` ↔ npm to `2.0.4`.

## [2.0.3] — 2026-08-27

- Fix: sync `packages/orbs/README.md` → root `README.md` and bump `2.0.2 → 2.0.3`.

## [2.0.2] — 2026-08-27

- Fix: `0.2.0 → 2.0.2` to clear bad `latest` `2.0.1` on npm.

## [0.2.0] — 2026-08-27

- **Perf — 6 phases:** `useMemo` geometry, `projectWithTrig` hoist (80→2 trig/frame), pooled `Dot/Halo` + 64-bucket `ink` LUT (880→64 `toFixed`/frame), `IntersectionObserver` + `document.hidden` pause, DPR-aware `ResizeObserver`, sentinel canvas reuse. Offscreen CPU ~80→15%. `First Load 128→131 kB`.

## [0.1.0] — 2026-08-24

- **Initial:** `18 ready` (Loading 8, Thinking 2, Streaming & Cards 8) — `SyncOrb` square 8×8 → supernova 3-ring, `a11y 100`, `perf 100/97`.

---

[2.2.0]: https://github.com/AmineAce/ai-primitives-ui/compare/2.1.0...2.2.0
[2.1.0]: https://github.com/AmineAce/ai-primitives-ui/compare/2.0.4...2.1.0
[2.0.4]: https://github.com/AmineAce/ai-primitives-ui/compare/2.0.3...2.0.4
[2.0.3]: https://github.com/AmineAce/ai-primitives-ui/compare/2.0.2...2.0.3
[2.0.2]: https://github.com/AmineAce/ai-primitives-ui/compare/0.2.0...2.0.2
[0.2.0]: https://github.com/AmineAce/ai-primitives-ui/compare/0.1.0...0.2.0
[0.1.0]: https://github.com/AmineAce/ai-primitives-ui/releases/tag/0.1.0

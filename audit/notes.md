# Baseline Notes — 2026-08-27

## Canvas counts (app/(demo)/page.tsx:8-18)

- `HeroOrb` 1× `128 (96 mobile)` `components/sections/hero-orb.tsx:7`
- `DemoShowcase` grid `components/sections/demo-showcase.tsx:177-215` maps `lib/primitives.ts` 19 entries (18 ready):
  - 10 Loading/Thinking canvas orbs at default 64: `CloningOrb, SyncOrb, FetchingOrb, PullingOrb, PushingOrb, MergingOrb, RebasingOrb, StashingOrb, CubeOrb, ScanOrb`
  - 1 `StreamingText` 320×96 (`StreamingText.tsx:66`)
  - 1 `ComingSoonOrb` 64 (custom rAF, not via `useOrbAnimation`)
  - - tiny canvases: `ApprovalCard 28`, `MiniOrb 16` (ToolChips), `TaskRowItem 20` (4×), `ChatOrb 20` (2×), `SourceNode 14` (2×)
- `DemoPlayground` 1× `64` default `components/sections/demo-playground.tsx:333,403`
- **Total: ~14 concurrent rAF loops on load (13 hero+showcase, 14 with playground). No virtualization.**

## Missing guard

- `hooks/useInView.ts:1-46` exists but never imported for orbs — all loops run offscreen.
- `useReducedMotion.ts:8` initial `false` flashes motion; `useOrbAnimation.ts:58-62` uses `useSyncExternalStore` correctly for orbs, but `hero-orb`/`demo-showcase` custom canvases duplicate logic.

## Per-frame cost (all orbs)

- `dots:Dot[]=[]`, `halos:Halo[]=[]`, `busy=new Set` per frame, each `Dot`/`ProjectedPoint` new object, `ink(alpha).toFixed(3)` + string concat per dot (~80/frame/orb ×12 ≈ 880/frame → 52k strings/s), `dots.sort` per frame, `project()` recomputes trig per dot.

## Bundle

- `next.config.js:1-13` `output:export`, `transpilePackages:["@ai-primitives-ui/ui"]`, `webpack dev cache=false`.
- `tsup.config.ts:1-14` single chunk, no splitting; `publint`+`attw` gates only.
- `package.json:16` `preview: serve out -l 4173` (static export, trailingSlash true).

## Fresh lighthouse status

- Reuse `performanc.json` snapshot (13.4.0, moto g power, `http://localhost:4173/`). Build is fresh (27 Aug) and sizes identical to snapshot, so snapshot remains valid baseline.
- To refresh: `pnpm preview` in background + `npx lighthouse http://localhost:4173 --preset=desktop --throttling.cpuSlowdownMultiplier=4 --output=json` (or mobile preset). Not run in this phase to keep it read-only.

## Hypotheses priority

See `audit/baseline.json:hypotheses_Ranked` — P0 is GC + offscreen, P1 is measureText + bundle, P2 is DPR/theme.

## Next

- Phase 1: memoize geometry + hoist trig + fix SyncOrb double speed — zero API change, lowest risk.

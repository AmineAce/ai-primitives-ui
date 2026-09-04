# Performance Optimization: Phased Atomic Plan

**Status:** Phase 0 active (Baseline Lock)
**Source of truth:** `packages/orbs/src/canvas/` + `app/(demo)/page.tsx` + `performanc.json` (2026-08-24 snapshot)
**Quality gate every phase:** `pnpm check` → format:check → lint → orb typecheck → orb test → gates (publint + attw) → build. No `@/` in `packages/`, no `any`, no `ctx.filter`, DPR cap 2, monochrome only, `role="img"` + `aria-label` preserved, `requestAnimationFrame` cleanup on unmount.

---

## Overview

Demo page mounts ~14 concurrent `requestAnimationFrame` loops (`HeroOrb 1 + Showcase 12 + Playground 1: app/(demo)/page.tsx:8-18`, `components/sections/demo-showcase.tsx:177-215`). Baseline (moto g power, Lighthouse 13.4): `FCP 1.06s (1.0) / LCP 2.57s (0.88) / CLS 0 (1.0) / TBT 116ms (0.97) / TTI 2.69s (0.97) / ScriptEval 2704ms / GC 36ms / totalByteWeight 316KB` (`performanc.json:17-500`). The lag + snap comes from per-frame heap + offscreen work + single-chunk bundle.

Phases are ordered by impact/risk: low-risk, no-API changes first so the coding agent never touches more than 3–4 files per atomic step.

---

## Phase 0: Baseline Lock

**Goal:** Freeze before-metrics so every later phase is diffable. No product code changes.

**Non-goals:** Fixing anything, adding dependencies.

### Atomic Steps

#### 0.1 Plan artifact

- **What:** Materialize this file to `plans/perf-optimization-phases.md` (this file) with full phase breakdown.
- **Files:** `plans/perf-optimization-phases.md` (this file)
- **Risk:** None
- **Verify:** File exists, no lint errors.

#### 0.2 Baseline capture

- **What:** Run fresh production build and capture:
  - `pnpm build` (uses `transpilePackages` + `output:export` → `out/`; `next.config.js:1-13`). Record `du -sh .next`, `du -sh out/_next`, `ls -lh .next/static/chunks/*.js`, `ls -lh out/_next/static/chunks/*.js`.
  - Lighthouse on `out/` via `pnpm preview` (`serve out -l 4173: package.json:16`): 3× mobile (moto g power) if `lighthouse` available, otherwise reuse `performanc.json` snapshot and flag `needs-fresh-lighthouse`.
  - Bundle manifest: chunk transfer/resource sizes from `performanc.json:518-829` cross-checked with on-disk sizes.
  - Orb registry: `lib/primitives.ts` count (19, 18 ready) + canvas count audit (`Showcase 12 + Hero 1 + Playground 1`).
- **Files (output):** `audit/baseline.json`, `audit/baseline-chunks.txt` (on-disk sizes), `audit/notes.md` (canvas count + hypotheses)
- **Risk:** Low: read-only
- **Verify:** `audit/baseline.json` contains `fetchTime`, `lighthouseVersion`, `FCP/LCP/CLS/TBT/TTI/ScriptEval/GC/totalByteWeight/numRequests/numTasks` matching `performanc.json`, plus `onDisk` sizes under `chunks`. `pnpm check` still green.

### Exit Criteria: Phase 0

- [ ] `plans/perf-optimization-phases.md` exists
- [ ] `audit/baseline.json` + `audit/baseline-chunks.txt` committed (or staged)
- [ ] `pnpm check` green (no code changed, so must pass)
- [ ] Baseline table posted in PR/notes for diff

---

## Phase 1: Zero-Risk Memoization + Trig Hoist (no API change)

**Goal:** Eliminate per-React-render allocations. No per-frame optimization yet. Pure `useMemo` + hoisting.

### 1.1 Memoize geometry on component body

- **What:** Wrap `makeSphereDots`, `entries/targets`, `order` shuffle, `packets`, `rings`, `square/sphereSorted` in `useMemo([size,radius])` so theme toggle / playground controls don’t recreate arrays.
- **Files:**
  - `packages/orbs/src/loading/CloningOrb.tsx:62-78` (`targets=makeSphereDots(count,radius)`, `entries`)
  - `packages/orbs/src/loading/FetchingOrb.tsx:50-74` (`sphereDots`, `order` Fisher-Yates, `packets`)
  - `packages/orbs/src/loading/PullingOrb.tsx:50-74` (same)
  - `packages/orbs/src/loading/PushingOrb.tsx:57-73` (`picked`)
  - `packages/orbs/src/loading/MergingOrb.tsx:52-88` (`sphereDots`, `spiralPos`)
  - `packages/orbs/src/loading/RebasingOrb.tsx:68-88` (`rings` 3×12, `tip`), `commitPos:90-112`, `pointOnRail:117-138`
  - `packages/orbs/src/loading/StashingOrb.tsx:73-102` (`sphereDots`, `wip`)
  - `packages/orbs/src/loading/SyncOrb.tsx:39-67` (`square`, `sqOrder`, `sphereSorted`)
  - `packages/orbs/src/loading/CubeOrb.tsx:88-139` (`base` 56, `turns`, `events`, `finalPos`, `sphereDots`)
  - `packages/orbs/src/loading/ScanOrb.tsx:37-44` (`sphereDots`)
  - `packages/orbs/src/loading/OrbitOrb.tsx:64-71` (`sphereDots`)
  - `packages/orbs/src/streaming/StreamingText.tsx:66-73` (`orbShape`, `height/font/textW`)
- **Risk:** Low: deps must be `[size,radius]` only, not `speed`/`paused`.
- **Verify:** React Profiler: parent re-render (theme flip) shows 0 re-allocation of `makeSphereDots`. `pnpm check` green. Visual parity at `size 16/32/64/96`.

### 1.2 Hoist trig in `sphere.ts:20-40`

- **What:** Compute `cosX/sinX/cosY/sinY` once per `render()` call, pass into `project` or inline projection. Replace `paths.ts:3-13` `lerp3/quad` (allocates `Point3D` per call) with inline math in hot loops (`CloningOrb:138`, `Fetching:125`, etc.).
- **Files:** `packages/orbs/src/canvas/sphere.ts:20-40`, `packages/orbs/src/canvas/paths.ts:3-13`, all `loading/*.tsx` (call sites)
- **Risk:** Low: math must stay identical.
- **Verify:** No visual drift, FPS micro-bench `+2–3 fps` on single orb.

### 1.3 Fix `SyncOrb.tsx:76` double-speed bug

- **What:** `cycle = (t * speed) % DURATION` → `cycle = t % DURATION` because `useOrbAnimation.ts:136` already does `elapsedRef+=dt*speed`.
- **Files:** `packages/orbs/src/loading/SyncOrb.tsx:76`
- **Risk:** Low: changes timing by 2× if `speed=2`.
- **Verify:** Playground `speed=2` spins Sync identically to other orbs.

### Exit Criteria: Phase 1

- [ ] All geometry `useMemo`’d, no `makeSphereDots` on parent re-render
- [ ] Trig hoisted, `lerp3` inlined where hot
- [ ] `SyncOrb` speed correct
- [ ] `pnpm check` green, no `any`, bundle size delta `<2KB`

---

## Phase 2: Frame GC Surgery (highest snap reduction)

**Goal:** Kill per-frame heap that drives GC snaps.

### 2.1 Array pooling

- **What:** Preallocate `dots: Dot[]` / `halos: Halo[]` and reuse (`dots.length=0` each frame) instead of `dots=[]` (`CloningOrb:130`, `Fetching:103-105`, etc.). Reuse `busy` as `Uint8Array`/cleared `Set`. Hoist comparator `const cmp=(a,b)=>a.z-b.z` outside `render`.
- **Files:** Every `loading/*.tsx` `render` where `dots:Dot[]=[]`, `halos:Halo[]=[]`, `busy=new Set`, `dots.sort`
- **Risk:** Medium: must clear correctly, not leak previous frame state.
- **Verify:** Chrome Performance → Allocations/frame `~150 → ~20` objects, GC `36ms → <10ms`.

### 2.2 Ink string cache

- **What:** Replace `colorPrefix+ink(alpha).toFixed(3)+")"` (~880 strings/frame across 14 orbs) with quantized LUT. Quantize alpha `q=Math.round(alpha*20)/20`, cache `fillStyle = cache.get(q) ?? (cache.set(q, prefix+ink(q).toFixed(3)+")"), cache.get(q))`. Alternative: integer alpha bucket.
- **Files:** `packages/orbs/src/canvas/colors.ts:31-33`, `makeInk:12-17`, every `render` `toFixed` call site
- **Risk:** Medium: quantization must be invisible (≤0.025 step).
- **Verify:** String allocations/frame `880 → <40`, GC spikes gone, visual alpha diff indistinguishable.

### 2.3 Path inline

- **What:** `quad:paths.ts:11-13` double `lerp3` → single inline Bézier for `StashingOrb:91-102` `pathOf`; same for `MergingOrb` `spiralPos` intermediate `spherePoint`.
- **Files:** `packages/orbs/src/canvas/paths.ts`, `StashingOrb.tsx:91-102`
- **Risk:** Low
- **Verify:** Same path, fewer allocations.

### Exit Criteria: Phase 2

- [ ] Allocations/frame down ≥70%, GC <10ms
- [ ] FPS 60 sustained with 14 orbs on moto g emulation
- [ ] `TBT` unchanged or improved

---

## Phase 3: Concurrency Governance (offscreen CPU → near 0)

**Goal:** Don’t animate what isn’t visible. Biggest battery / main-thread win.

### 3.1 IntersectionObserver pause

- **What:** Wire existing `hooks/useInView.ts:1-46` into `useOrbAnimation.ts:118-143` via new option `pauseWhenHidden` (default true for showcase, false for hero if above fold). Wrap each `DemoShowcase.tsx:177-215` grid card + `hero-orb.tsx:125-230` + `ComingSoonOrb:demo-showcase.tsx:39-48` in `useInView` observer (`threshold 0`, `rootMargin 100px`).
- **Files:** `hooks/useInView.ts`, `packages/orbs/src/canvas/useOrbAnimation.ts`, `components/sections/demo-showcase.tsx`, `components/sections/hero-orb.tsx`
- **Risk:** Medium: must handle `useSyncExternalStore` for reduced-motion + `useInView` together.

### 3.2 Fix `paused` to actually skip work

- **What:** Current `useOrbAnimation.ts:136` does `if(!paused) elapsed+=...` but still `render()` every frame (clearRect + project + sort). Change to early return: if `paused||!inView` → if `!hasDrawnPausedFrame` render static frame once, then `requestAnimationFrame(loop)` with no canvas work.
- **Files:** `packages/orbs/src/canvas/useOrbAnimation.ts:129-143`
- **Risk:** Medium: must still call `render` once for theme sync.

### 3.3 Document visibility

- **What:** Add `document.addEventListener("visibilitychange")` to pause all loops when `document.hidden`. Resume with `last=performance.now()` to avoid `dt` jump (`dt capped 0.1:133` already).
- **Files:** `packages/orbs/src/canvas/useOrbAnimation.ts`
- **Risk:** Low
- **Verify:** Scroll below fold → CPU `~80% → ~15%` in perf trace, 14 loops → ~3 active (hero + 2 rows). Re-enter: no snap (elapsed preserved).

### Exit Criteria: Phase 3

- [ ] Offscreen orbs 0 `clearRect/project/sort` per frame
- [ ] `paused` prop truly idle
- [ ] `document.hidden` pauses, `visibilitychange` resumes without snap

---

## Phase 4: Heavy Subsystem Surgery (isolated hot orbs)

### 4.1 StreamingText `measureText` elimination

- **What:** `StreamingText.tsx:115,117,119-126` calls `wrapLines(text,ctx,textW)` + `measureText` per word per line **every frame** (1200 calls/s). Memoize `wrapLines` on `[text,size,font,textW]` via `useMemo`, compute `revealed/lines` from cached breaks, move `ctx.font=` out of `render` (set once in sizing effect).
- **Files:** `packages/orbs/src/streaming/StreamingText.tsx:66-133`
- **Risk:** Medium: must handle `ctx` not available in memo, cache word splits only.
- **Verify:** `measureText` calls/frame `20 → 0` (only on text/size change), isolated FPS `45 → 60`.

### 4.2 Rebasing `pointOnRail` lens cache

- **What:** `RebasingOrb.tsx:117-138` allocates `lens:number[]` + `Math.hypot` loop per `pointOnRail` call, invoked 3× per frame during pulse `L332-349`. Precompute `lens` + `total` per ring once in `useMemo` alongside `rings:68-88`, pass cached.
- **Files:** `packages/orbs/src/loading/RebasingOrb.tsx`
- **Risk:** Low
- **Verify:** Pulse phase allocations down, no visual change.

### 4.3 Trail/foam throttling

- **What:** `MergingOrb.tsx:109-128` `TRAIL_STEPS 6 → 4`, `StashingOrb.tsx:128-147` skip `drawFoam` when `pouchAlpha<0.1` or throttle foam to 30Hz.
- **Files:** `MergingOrb.tsx`, `StashingOrb.tsx`
- **Risk:** Low
- **Verify:** No visual regression at 60fps, fewer strokes/frame.

### Exit Criteria: Phase 4

- [ ] `StreamingText` 0 per-frame `measureText`
- [ ] `RebasingOrb` pulse 0 per-frame `lens` alloc
- [ ] Overall `TTI 2.69s → ~2.3s` on showcase page

---

## Phase 5: Bundle & Load

### 5.1 Code-split showcase orbs

- **What:** `DemoShowcase.tsx:10-22` + `DemoPlayground.tsx:8-20` eagerly import all 10 orbs → single `page-e17d54ec*.js 100KB (28KB transfer, 1992ms scripting: performanc.json:390)`. Replace with `next/dynamic(() => import('@ai-primitives-ui/ui').then(m=>m.CloningOrb), {ssr:false, loading: ()=><CanvasSkeleton/>})` per card, keep `HeroOrb` eager. Alternatively `experimental.optimizePackageImports: ["@ai-primitives-ui/ui"]` in `next.config.js:1-13`.
- **Files:** `components/sections/demo-showcase.tsx`, `components/sections/demo-playground.tsx`, `next.config.js`
- **Risk:** Medium: `useOrbAnimation` is client-only; `ssr:false` required.
- **Verify:** `page-*.js 100KB → ~45KB` initial, `ScriptEval 1992ms → ~1100ms`, `totalByteWeight 316KB → ~240KB`.

### 5.2 Fonts / images

- **What:** Add `size-adjust` fallback for `Inter` (`app/layout.tsx:11-23`), `preconnect` to `picsum.photos` (currently `rtt 0.145ms: performanc.json:934`), `loading="lazy"` + `width/height` for `context-cards.tsx:299` `picsum 600/300` (currently `priority Low` but blocking due to 302).
- **Files:** `app/layout.tsx`, `components/ui/context-cards.tsx`, `app/globals.css`
- **Risk:** Low
- **Verify:** `FCP 1.06s` flat, `LCP 2.57s → <2.0s`, font swap CLS still 0.

### Exit Criteria: Phase 5

- [ ] Initial chunk <60KB, `ScriptEval` down ≥30%
- [ ] `publint` + `attw --pack` still green (`packages/orbs/package.json:gates`)
- [ ] Lighthouse `LCP <2.0s`

---

## Phase 6: Resilience & Polish

### 6.1 DPR / resize observer

- **What:** `useOrbAnimation.ts:69-84` only reads `devicePixelRatio` once (`size` deps). Add `matchMedia("(resolution: 2dppx)")` listener + `ResizeObserver` on canvas to update `canvas.width=w` + `ctx.scale(dpr)` without remount. Same for `hero-orb.tsx:77-83` + `ComingSoonOrb:demo-showcase.tsx:54-61` (currently `isMobile` fixed on mount `hero-orb.tsx:73-76`).
- **Files:** `packages/orbs/src/canvas/useOrbAnimation.ts`, `components/sections/hero-orb.tsx`, `components/sections/demo-showcase.tsx`
- **Risk:** Medium: must debounce.

### 6.2 Theme observer debounce + scratch canvas reuse

- **What:** `useOrbAnimation.ts:110-114` `MutationObserver` calls `getComputedStyle(canvas)` + `colors.ts:55` `document.createElement("canvas")` per flip. Reuse single sentinel canvas, cache `parseColor` per CSS var, debounce 16ms.
- **Files:** `packages/orbs/src/canvas/colors.ts:55-60`, `useOrbAnimation.ts:86-116`
- **Risk:** Low

### 6.3 Elapsed snap

- **What:** `useOrbAnimation.ts:55` `elapsedRef` never resets on `size` change → phase jump when `demo-playground.tsx:404` does `key={state-size}` forced remount. Make `size` reactive without teardown (`last=performance.now()` reset only on `reduceMotion` flip), remove `key` hack.
- **Files:** `useOrbAnimation.ts:55,143`, `components/sections/demo-playground.tsx:404`
- **Risk:** Low
- **Verify:** Zoom `100→150%`, drag across displays, rapid theme toggle ×10, slider `16→96` → no blurry frame, no blank `clearRect` flash.

### Exit Criteria: Phase 6

- [ ] DPR change updates backing store at correct `MAX_DPR 2` without snap
- [ ] Theme flip no extra canvas alloc
- [ ] Size slider smooth, no remount flash

---

## Final Gate (after Phase 6)

- Fresh Lighthouse ×3 on `out/` (`pnpm build && pnpm preview`), `web-vitals` beacon `LCP<2.0s / CLS 0 / INP<100ms / TBT<100ms`, FPS 60 with 3 visible orbs + ~15% CPU offscreen, `pnpm check` green, manual 320/768/1440 + dark/light + `prefers-reduced-motion` pass, visual diff no regression.

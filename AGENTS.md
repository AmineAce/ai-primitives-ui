# AGENTS.md — AI Primitives

This file provides guidance to AI agents when working with code in this repository.

## Development Commands

### Setup

- `pnpm install` — Install dependencies
- `pnpm dev` — Start Next.js dev server on :3000 (clears `.next` for a clean manifest; no orb lib build)
- `pnpm build` — Build for production. ALWAYS run this after finishing work.
- `pnpm lint` — Check linting and type-checking
- `pnpm format` — Reformat the repo with Prettier (Tailwind-aware)
- `pnpm format:check` — Verify formatting without rewriting
- `pnpm test` — Run the orb library unit tests (vitest)
- `pnpm check` — The full quality umbrella, via `scripts/check.mjs`. Runs
  format → lint → orb typecheck → orb test → orb gates → build, then prints a
  per-step pass/fail summary. Fails fast on the first red step.
- `pnpm --filter @ai-primitives/ui typecheck` — Type-check the orb library against its own tsconfig
- `pnpm --filter @ai-primitives/ui build` — Build the published artifact with tsup (ESM + CJS + d.ts) into `dist/`
- `pnpm --filter @ai-primitives/ui test` — Orb library tests (vitest, jsdom env; canvas stubbed in `src/test/setup.ts`)
- `pnpm --filter @ai-primitives/ui gates` — Run publish gates. Rebuilds `dist/` from current source first, then validates with `publint` + `@arethetypeswrong/cli --pack`, so it can never pass against a stale artifact.

### Code Quality

- ALWAYS run `pnpm check` before declaring work complete — it covers formatting, lint, orb typecheck + tests, publish gates, and the production build in one fast-fail pass.
- Dev/prod split on the package `exports` map: `next dev` resolves `src/` via the `development` condition (instant HMR — the app never reads stale dist while iterating). `pnpm build` and consumers resolve `dist/`, and the package `gates` script rebuilds `dist/` from source before validating — so a stale `dist/` can never pass a gate in production. In the worst case a direct `next build` would type-check against a stale artifact, so stick to `pnpm build`.
- Dev workflow: `predev` runs `scripts/guard-dev.mjs` (aborts if anything is on :3000, then clears `.next-dev`) and the webpack dev cache is disabled in `next.config.js`, so HMR and hard reloads are safe — stale chunk 404s are impossible.

## Next.js Dev / Build Isolation (mandatory)

- `pnpm dev` always uses `.next-dev` (via NEXT_DIST_DIR). Never read or write the default `.next` while developing.
- `pnpm build` and `pnpm check` use the default `.next` + `out/`.
- A live `next dev` (or anything on port 3000) blocks both a second `pnpm dev` and `pnpm check`.
- Preview runs on port 4173 (`pnpm preview`) so it can never collide with the dev server.
- Never run `next build` or `pnpm exec next build` while a dev server is alive — the documented paths already prevent this.
- NEVER use `@/` aliases inside `packages/`. The library must resolve on its own; the app tsconfig `paths` only masks stray aliases.
- NEVER use `any` or `as any`. Use `unknown` if necessary.
- This repository always uses 2 spaces for indentation.
- Keep everything short and concise — comments, docs, commit messages. Say a thing once, at the level of detail a reader needs to act on it.

## Technology Stack

| Layer           | Technology                        |
| --------------- | --------------------------------- |
| Framework       | Next.js 14 (App Router)           |
| Language        | TypeScript (strict)               |
| Styling         | Tailwind CSS                      |
| Rendering       | HTML5 Canvas 2D API               |
| Icons           | Lucide React                      |
| Fonts           | Inter (UI), JetBrains Mono (code) |
| Package Manager | pnpm                              |

**No external animation libraries.** No Framer Motion, no GSAP, no Lottie.

## Folder Structure

```
packages/
  orbs/                   # @ai-primitives/ui — publishable orb library
    src/
      index.ts            # 'use client' entry barrel — named exports only, no `export *`
      lib/
        math.ts           # clamp()
      canvas/             # Shared canvas core (internal)
        CanvasContainer.tsx
        useOrbAnimation.ts
        sphere.ts
        easing.ts
        paths.ts
        types.ts
        colors.ts
        random.ts
      loading/            # Loading State orbs
        CloningOrb.tsx
        FetchingOrb.tsx
        PullingOrb.tsx
        PushingOrb.tsx
        MergingOrb.tsx
        RebasingOrb.tsx
        StashingOrb.tsx
        index.ts
    dist/                 # tsup build output (ESM + CJS + d.ts) — app consumes this
    tsup.config.ts        # dual ESM/CJS build, react external, per-file 'use client' preserved
    package.json
    tsconfig.json

app/
  (demo)/
    page.tsx              # Landing page
    layout.tsx            # Demo layout
  docs/
    page.tsx              # Documentation
    layout.tsx            # Docs layout (sidebar)
  loading.tsx
  layout.tsx              # Root layout (fonts, metadata, theme)
  globals.css             # CSS variables, Tailwind directives

components/
  ui/                     # Button, Card, Text, Container, Divider, orb-mark
  sections/               # Page sections (demo-hero, demo-showcase, etc.)
  docs/                   # Docs sidebar nav

lib/
  primitives.ts           # Single source of truth: primitive registry
  theme.ts                # useTheme hook
  utils.ts                # cn(), helpers

public/
  og-image.png
  manifest.json

scripts/
  check.mjs             # pnpm check orchestrator — sequential steps, final summary
```

## Design System

### Colors

Monochrome only. NEVER add colors.

| Token              | Tailwind                  | Dark      | Light     |
| ------------------ | ------------------------- | --------- | --------- |
| `--bg-base`        | `bg-git-base`             | `#0d1117` | `#ffffff` |
| `--bg-elevated`    | `bg-git-elevated`         | `#161b22` | `#f6f8fa` |
| `--bg-inset`       | `bg-git-inset`            | `#010409` | `#ffffff` |
| `--border-default` | `border-git-border`       | `#30363d` | `#d0d7de` |
| `--border-muted`   | `border-git-border-muted` | `#21262d` | `#e6edf3` |
| `--fg-default`     | `text-git-fg`             | `#f0f6fc` | `#1f2328` |
| `--fg-muted`       | `text-git-fg-muted`       | `#8b949e` | `#656d76` |
| `--fg-subtle`      | `text-git-fg-subtle`      | `#7d8790` | `#6e7781` |

**Rules:**

- NEVER use raw hex values in component code.
- NEVER use `opacity` on text for dimming — use the correct token.
- Gradients are limited to the dot-grid background in `globals.css`.

### Typography

| Element      | Size                   | Weight          | Tracking         |
| ------------ | ---------------------- | --------------- | ---------------- |
| H1 (Hero)    | `text-5xl md:text-7xl` | `font-semibold` | `tracking-tight` |
| H2 (Section) | `text-3xl`             | `font-semibold` | `tracking-tight` |
| Body         | `text-sm`              | `font-normal`   | default          |
| Code         | `text-sm`              | `font-normal`   | default          |
| Labels       | `text-xs`              | `font-medium`   | default          |

Fonts: Inter for UI, JetBrains Mono for code.

## Canvas 2D Conventions

### Shared Utilities

Canvas primitives use shared math from `packages/orbs/src/canvas/`:

- `sphere.ts` — 3D sphere projection (`project()`, `spherePoint()`, `R`, `fitRadius()`), golden-angle distribution
- `easing.ts` — `easeOutCubic`, `easeInOutSine`, `easeOutBack`, `easeOutExpo`
- `CanvasContainer.tsx` — presentational canvas wrapper; sizing lives in the hook
- `useOrbAnimation.ts` — the loop hook: DPR-cap-2 sizing, rAF + elapsed, `paused`/`speed` via refs, reduced-motion static frame, cleanup
- `types.ts` — `Dot`, `Halo`, `Point2D`; `paths.ts` — `lerp3`, `quad`; `colors.ts` — `DEFAULT_DOT_RGB`, `ORB_FG_VAR`, `FG_FALLBACK_VAR`, `toColorPrefix`, `parseColor`, `makeInk`, `inkFromColor`, `Ink`; `random.ts` — `mulberry32`; `lib/math.ts` — `clamp`

### Animation Rules

- ALWAYS use `fitRadius(size)` from `sphere.ts` (`min(R * size/64, size * 0.42)`) for the sphere radius so the orb always fits the canvas as a full circle. NEVER use the raw `R`.
- Dots behind the sphere (`z > 0`) render at `alpha * 0.35`.
- ALWAYS sort dots by `z` before rendering (back-to-front).
- NEVER draw dots outside the sphere boundary.
- Loop seamlessly with `cycle = t % duration`.
- Use easing for all motion — linear motion feels mechanical.
- Monochrome only: `rgba(201, 209, 217, alpha)` for dots. NEVER add colors.
- NEVER use `ctx.filter`, SVG filters, or WebGL.

### Component Pattern

Every Canvas primitive:

- Is a `'use client'` React component in `packages/orbs/src/loading/`.
- Accepts `size`, `speed`, `paused`, and `aria-label` props.
- Computes geometry on the component body, defines `render(ctx, elapsed, reduced, colorPrefix, ink)`, then calls `useOrbAnimation({ size, speed, paused, render })` for the loop.
- Passes the returned `canvasRef` to `CanvasContainer` — never a raw `<canvas>`.
- Never touches the loop, DPR, or reduced-motion handling itself — the hook owns all of it.
- Exports from `packages/orbs/src/loading/index.ts` and the root barrel.

### Theming

- Orbs resolve color at mount and on every theme flip, in priority order: `color` prop → `--orb-fg` → `--fg-default` on any ancestor → `DEFAULT_DOT_RGB`.
- The `useOrbAnimation` hook observes `data-theme`/`class` on `<html>`; app code may also use `useOrbInk()` (`hooks/use-orb-ink.ts`) which returns `{ color, ink }` derived from `--fg-default` and its luminance.
- The hook passes `colorPrefix` and `ink` to `render(ctx, elapsed, reduced, colorPrefix, ink)`; orbs build `colorPrefix + ink(alpha).toFixed(3) + ")"`. `ink` lifts dim layers in light themes so near-black stays visible on white.
- Alpha is always orb-controlled — a `color` prop's own alpha is ignored.
- An explicit `color` prop is static by design and does not follow theme flips.
- The demo app wires `--orb-fg: var(--fg-default)` in `app/globals.css` (both root and dark blocks); showcase orbs follow the toggle live.

## Primitive Registry

`lib/primitives.ts` is the single source of truth.

```ts
export interface Primitive {
  id: string; // kebab-case, unique
  name: string; // Title Case
  description: string; // one line
  status: "ready" | "placeholder";
  category: string;
  span?: number; // optional grid span (e.g., chat spans 2)
}
```

**Rules:**

- NEVER hardcode primitive lists in components. ALWAYS import from `lib/primitives.ts`.
- When a primitive's animation is complete, flip `status` to `'ready'`.

## How to Add a Primitive

1. Add entry to `lib/primitives.ts` with `status: 'placeholder'`.
2. Create component in `packages/orbs/src/loading/<Name>Orb.tsx` following the Canvas conventions above.
3. Export the component and its props type from `packages/orbs/src/loading/index.ts` and the root barrel `packages/orbs/src/index.ts`.
4. Wire into `components/sections/demo-showcase.tsx`, importing from `@ai-primitives/ui`.
5. Flip `status` to `'ready'` in `lib/primitives.ts`.
6. Run `pnpm check`.

## How to Add a Landing Page Section

1. Create `components/sections/demo-<section>.tsx`.
2. Use `Container`, `Text`, `Card` from `components/ui/`.
3. Import primitive data from `lib/primitives.ts` if needed.
4. Add section to `app/(demo)/page.tsx` in the correct order.
5. Run `pnpm build`.

## Prohibited Patterns

NEVER:

- Add colors. The palette is monochrome forever.
- Use `!important` in CSS.
- Use inline styles (`style={{ ... }}`).
- Use `any` type.
- Add new dependencies without explicit approval.
- Use `setInterval` for animation — always `requestAnimationFrame`.
- Access `window` or `document` in server components. ALWAYS `'use client'` for browser APIs.
- Leave dead code, commented experiments, or unused files.
- Use `console.log` in production code.
- Modify the monochrome color system, Tailwind tokens, or theme logic without explicit approval.

## Quality Gates

Before declaring work complete:

- [ ] `pnpm check` exits with code 0 (format:check → lint → orb typecheck → orb test → orb gates → build, all green).
- [ ] No `@/` aliases inside `packages/`.
- [ ] No TypeScript errors.
- [ ] No ESLint warnings.
- [ ] No unused imports or variables.
- [ ] Component renders correctly in dark mode.
- [ ] Component renders correctly in light mode (if toggle exists).
- [ ] Responsive at 320px, 768px, and 1440px.
- [ ] All canvas elements have `role="img"` and `aria-label`.
- [ ] `prefers-reduced-motion: reduce` renders a static frame.
- [ ] `requestAnimationFrame` is cleaned up on unmount.
- [ ] No WebGL, no SVG filters, no `ctx.filter`.
- [ ] DPR is capped at 2.

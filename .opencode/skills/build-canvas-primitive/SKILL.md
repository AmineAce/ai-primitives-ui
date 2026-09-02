---
name: Build Canvas Primitive
description: Build a hand-tuned Canvas 2D primitive component for the AI Primitives library.
---

# SKILL: build-canvas-primitive

Build a Canvas 2D primitive component for the AI Primitives library.

## Context

Primitives are hand-tuned Canvas 2D animations representing discrete AI or Git operations. Each primitive is a standalone React component that renders inside a `<canvas>` element. No WebGL, no SVG filters, no `ctx.filter`. Monochrome only.

## Prerequisites

- `lib/primitives.ts` has an entry for this primitive with `status: 'placeholder'`.
- `components/canvas/CanvasContainer.tsx` exists and handles DPR scaling.
- `components/canvas/sphere.ts` exists with shared projection math.
- `components/canvas/easing.ts` exists with shared easing functions.

## Steps

### 1. Create the component file

Create `components/primitives/<category>/<Name>Orb.tsx`.

Follow the pattern established in existing orb components (e.g. `components/primitives/loading-state/CloningOrb.tsx` once it exists, or the prototype in the project history). The pattern is:

- `'use client'` directive at the top.
- Accept props: `size?: number` (default 64), `speed?: number` (default 1), `paused?: boolean` (default false), `aria-label?: string`.
- Use `useRef<HTMLCanvasElement>` and `useEffect` for the animation loop.
- Get the canvas context with `canvas.getContext('2d')`.
- Handle DPR: read `window.devicePixelRatio`, cap at 2, set `canvas.width/height` to logical size × DPR, then `ctx.scale(dpr, dpr)`.
- Use `requestAnimationFrame` for the loop. Store the raf ID. Cancel it in the cleanup function.
- Render dots with `ctx.arc()` and `ctx.fill()`. Render lines with `ctx.stroke()`.
- Return a `<CanvasContainer>` with `ref`, `width`, `height`, `role="img"`, and `aria-label`.

### 2. Implement the animation

Design the animation to communicate the primitive's verb visually. Use the shared utilities:

- `project()` from `components/canvas/sphere.ts`: 3D sphere projection with depth scaling.
- `spherePoint()` from `components/canvas/sphere.ts`: golden-angle sphere distribution.
- `fitRadius(size)` from `components/canvas/sphere.ts`: ALWAYS use for the sphere radius so the orb fits the canvas as a full circle.
- Easing functions from `components/canvas/easing.ts`: `easeOutCubic`, `easeInOutSine`, `easeOutBack`, `easeOutExpo`.

Rules for the animation:

- Stay inside the sphere boundary. All dots must be within `radius` distance from center. Clamp or discard anything that escapes.
- Call `project()` for every dot. Sort by `z` (back-to-front) before rendering.
- Dots with `z > 0` (behind the sphere plane) render at `alpha * 0.35`.
- Loop seamlessly with `cycle = t % duration`.
- Use easing for all motion: linear motion feels mechanical.
- Monochrome only: `rgba(201, 209, 217, alpha)` for dots, similar grayscale for strokes. NEVER add colors.
- No `ctx.filter`, no SVG filters, no WebGL.

### 3. Export from the category barrel

Open `components/primitives/<category>/index.ts` and export the new component.

### 4. Wire into the showcase

Open `components/sections/demo-showcase.tsx`. Find the card for this primitive and replace the placeholder with the live component. Import from the category barrel.

### 5. Flip the status

Open `lib/primitives.ts` and change the primitive's `status` from `'placeholder'` to `'ready'`.

### 6. Verify

Run `pnpm build`. Fix any TypeScript or lint errors.

Open the landing page. The primitive card should show the live animation. Scroll it off-screen and back on: it should resume smoothly. Toggle the browser's `prefers-reduced-motion` setting: the component should render a static representative frame and skip the animation loop.

## Constraints

- NEVER use `any`.
- NEVER use inline styles (`style={{ ... }}`).
- NEVER add colors.
- NEVER use `setInterval` for animation: always `requestAnimationFrame`.
- NEVER forget to cancel `requestAnimationFrame` on unmount.
- NEVER draw dots outside the sphere boundary.
- NEVER use `ctx.filter`, SVG filters, or WebGL.
- ALWAYS sort dots by `z` before rendering.
- ALWAYS accept `size`, `speed`, `paused`, and `aria-label` props.
- ALWAYS use `CanvasContainer`: do not create raw `<canvas>` elements.
- ALWAYS handle `prefers-reduced-motion` by rendering a static frame when the media query matches.

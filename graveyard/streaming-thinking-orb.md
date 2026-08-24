# Thinking Orb — the scattered-dots animation

Archived 2026-08-19. Removed from `StreamingText` (now text-only) because the bulb
avatar pulled attention from the streamed text. Saved because the user loves it.

**Concept:** a swarm of ~30 dots swirls, gathers into a dense orb, breathes while
"thinking", then scatters back out and re-gathers — the loop is seamless.

To restore: place as `packages/orbs/src/loading/ThinkingOrb.tsx`, add to
`packages/orbs/src/loading/index.ts` and the root barrel, then `pnpm check`.
Reuses the standard shared canvas utilities; side-effect-free standalone square canvas.

```tsx
"use client";

import { CanvasContainer } from "../canvas/CanvasContainer";
import { useOrbAnimation } from "../canvas/useOrbAnimation";
import { easeInOutSine } from "../canvas/easing";
import { lerp3 } from "../canvas/paths";
import { makeSphereDots, project, type Point3D } from "../canvas/sphere";
import { clamp } from "../lib/math";
import type { Dot } from "../canvas/types";

export interface ThinkingOrbProps {
  size?: number;
  speed?: number;
  paused?: boolean;
  color?: string;
  "aria-label"?: string;
}

const CONVERGE = 1.0;
const BREATHE = 2.4;
const FADE = 0.7;
const TOTAL = CONVERGE + BREATHE + FADE;
const DOT_COUNT = 30;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

export function ThinkingOrb({
  size = 64,
  speed = 1,
  paused = false,
  color,
  "aria-label": ariaLabel = "Thinking",
}: ThinkingOrbProps) {
  const orbR = Math.max(10, size * 0.24);
  const cx = size / 2;
  const cy = size / 2;
  const sphereDots = makeSphereDots(DOT_COUNT, orbR);

  const render = (
    ctx: CanvasRenderingContext2D,
    elapsed: number,
    reduced: boolean,
    colorPrefix: string,
  ) => {
    ctx.clearRect(0, 0, size, size);
    const t = reduced ? CONVERGE : elapsed % TOTAL;

    let gathered =
      reduced || t >= CONVERGE ? 1 : easeInOutSine(clamp(t / CONVERGE, 0, 1));
    if (t >= CONVERGE + BREATHE) {
      const fp = clamp((t - (CONVERGE + BREATHE)) / FADE, 0, 1);
      gathered = 1 - easeInOutSine(fp);
    }
    const breath =
      gathered > 0 ? 1 + 0.05 * Math.sin(elapsed * ((2 * Math.PI) / 3)) : 1;

    const dots: Dot[] = [];
    for (let i = 0; i < sphereDots.length; i++) {
      const dot = sphereDots[i];
      const angle = i * GOLDEN + (reduced ? 0 : t * 2.2);
      const rs = orbR * 3.4;
      const scatter: Point3D = {
        x: Math.cos(angle) * rs * (0.75 + 0.35 * Math.sin(i * 7.3)),
        y: Math.sin(angle) * rs * 0.5,
        z: 0,
      };
      const gatheredPoint: Point3D = {
        x: dot.x * breath,
        y: dot.y * breath,
        z: dot.z * breath,
      };
      const pos = lerp3(scatter, gatheredPoint, gathered);
      const p = project(pos, cx, cy, 0, 0.25);
      dots.push({
        x: p.x,
        y: p.y,
        z: p.z,
        r: Math.max(1.2, orbR * 0.14) * p.scale,
        alpha: 0.9 * (pos.z > 0 ? 0.35 : 1),
      });
    }

    dots.sort((a, b) => a.z - b.z);
    for (const d of dots) {
      if (d.alpha <= 0.004) continue;
      ctx.fillStyle = colorPrefix + d.alpha.toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  const { canvasRef } = useOrbAnimation({ size, speed, paused, color, render });

  return (
    <CanvasContainer
      ref={canvasRef}
      width={size}
      height={size}
      ariaLabel={ariaLabel}
    />
  );
}
```

**Tuning knobs:** `CONVERGE` (gather pace, easeOutSine), `BREATHE` (settled dwell),
`FADE` (scatter-out), `* 2.2` spin on the angle, `rs = orbR * 3.4` (scatter reach),
`0.5` Y-squish on the scatter ellipse, `breath` amplitude `0.05` at `2π/3` rad/s.

"use client";

import { CanvasContainer } from "../canvas/CanvasContainer";
import { easeOutCubic, easeOutExpo } from "../canvas/easing";
import {
  fitRadius,
  makeSphereDots,
  project,
  type Point3D,
} from "../canvas/sphere";
import { clamp } from "../lib/math";
import { useOrbAnimation } from "../canvas/useOrbAnimation";
import { lerp3 } from "../canvas/paths";
import type { Dot } from "../canvas/types";

export interface CloningOrbProps {
  size?: number;
  speed?: number;
  paused?: boolean;
  color?: string;
  "aria-label"?: string;
}

const FILL = 3.5;
const HOLD = 0.5;
const RESET = 0.5;
const DURATION = FILL + HOLD + RESET;
const TRAVEL = 0.6;
const BASE_COUNT = 80;
const ENTRY_FACTOR = 1.25;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

function goldenDir(indexF: number, count: number): Point3D {
  const lo = Math.max(0, Math.floor(indexF));
  const hi = Math.min(count - 1, lo + 1);
  const f = clamp(indexF - lo, 0, 1);
  const step = count > 1 ? 1 / (count - 1) : 0;

  const at = (i: number): Point3D => {
    const y = 1 - i * step * 2;
    const radiusY = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = GOLDEN * i;
    return { x: radiusY * Math.cos(theta), y, z: radiusY * Math.sin(theta) };
  };

  const dLo = at(lo);
  const dHi = at(hi);
  return {
    x: dLo.x + (dHi.x - dLo.x) * f,
    y: dLo.y + (dHi.y - dLo.y) * f,
    z: dLo.z + (dHi.z - dLo.z) * f,
  };
}

export function CloningOrb({
  size = 64,
  speed = 1,
  paused = false,
  color,
  "aria-label": ariaLabel = "Cloning",
}: CloningOrbProps) {
  const count = Math.max(8, Math.round((BASE_COUNT * size) / 64));
  const radius = fitRadius(size);
  const cx = size / 2;
  const cy = size / 2;
  const dotSize = (2.2 * size) / 64;
  const entrance = radius * ENTRY_FACTOR;

  const targets = makeSphereDots(count, radius);
  const entries: Point3D[] = [];
  for (let i = 0; i < count; i++) {
    const dir = goldenDir(i, count);
    entries.push({
      x: dir.x * entrance,
      y: dir.y * entrance,
      z: dir.z * entrance,
    });
  }

  const render = (
    ctx: CanvasRenderingContext2D,
    t: number,
    reduced: boolean,
    colorPrefix: string,
    ink: (a: number) => number,
  ) => {
    const tiltX = 0.3;
    const tiltY = reduced ? 0.2 : t * 0.12;
    ctx.clearRect(0, 0, size, size);

    const lats = [-55, -30, 0, 30, 55];
    ctx.strokeStyle = colorPrefix + ink(0.05).toFixed(3) + ")";
    ctx.lineWidth = 1;
    lats.forEach((deg) => {
      const lat = (deg * Math.PI) / 180;
      const rr = radius * Math.cos(lat);
      const yy = radius * Math.sin(lat);
      const samples = 48;
      ctx.beginPath();
      for (let s = 0; s <= samples; s++) {
        const a = (s / samples) * 2 * Math.PI;
        const p = project(
          { x: rr * Math.cos(a), y: yy, z: rr * Math.sin(a) },
          cx,
          cy,
          tiltX,
          tiltY,
        );
        if (s === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    });

    if (reduced) {
      for (const target of targets) {
        const p = project(target, cx, cy, tiltX, tiltY);
        ctx.fillStyle = colorPrefix + ink(p.z > 0 ? 0.35 : 1).toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(p.x, p.y, dotSize * p.scale, 0, 2 * Math.PI);
        ctx.fill();
      }
      return;
    }

    const cycle = t % DURATION;
    const resetP = cycle >= FILL + HOLD ? (cycle - (FILL + HOLD)) / RESET : 0;
    const fade = 1 - easeOutCubic(clamp(resetP, 0, 1));

    const dots: Dot[] = [];
    for (let i = 0; i < count; i++) {
      const start = (i / count) * FILL;
      const sinceStart = cycle - start;
      if (sinceStart <= 0) continue;

      const travelP = clamp(sinceStart / TRAVEL, 0, 1);
      const eased = easeOutExpo(travelP);
      const pos3d =
        eased >= 1 ? targets[i] : lerp3(entries[i], targets[i], eased);
      const p = project(pos3d, cx, cy, tiltX, tiltY);

      dots.push({
        x: p.x,
        y: p.y,
        r: dotSize * p.scale,
        z: p.z,
        alpha: eased * fade,
      });
    }

    dots.sort((a, b) => a.z - b.z);
    for (const d of dots) {
      if (d.alpha <= 0) continue;
      ctx.fillStyle =
        colorPrefix + ink(d.alpha * (d.z > 0 ? 0.35 : 1)).toFixed(3) + ")";
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

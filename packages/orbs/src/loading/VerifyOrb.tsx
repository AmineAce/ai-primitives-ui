"use client";

import { useMemo } from "react";
import { CanvasContainer } from "../canvas/CanvasContainer";
import {
  fitRadius,
  makeSphereDots,
  projectWithTrig,
  type ProjectedPoint,
} from "../canvas/sphere";
import { clamp } from "../lib/math";
import { useOrbAnimation } from "../canvas/useOrbAnimation";
import type { Dot, Halo } from "../canvas/types";

export interface VerifyOrbProps {
  size?: number;
  speed?: number;
  paused?: boolean;
  color?: string;
  "aria-label"?: string;
}

const DURATION = 4.4; // one full up-down scan bounce
const SCAN_RATE = (Math.PI * 2) / DURATION;
const BASE_SPHERE = 65;

export function VerifyOrb({
  size = 64,
  speed = 1,
  paused = false,
  color,
  "aria-label": ariaLabel = "Verifying",
}: VerifyOrbProps) {
  const count = Math.max(8, Math.round((BASE_SPHERE * size) / 64));
  const radius = fitRadius(size);
  const cx = size / 2;
  const cy = size / 2;
  const unit = size / 64;
  const dotSize = 1.7 * unit;

  const sphereDots = useMemo(
    () => makeSphereDots(count, radius),
    [count, radius],
  );
  const dotsPool = useMemo<Dot[]>(() => [], []);
  const halosPool = useMemo<Halo[]>(() => [], []);
  const projPool = useMemo<ProjectedPoint[]>(() => [], []);
  const cmp = useMemo(() => (a: Dot, b: Dot) => a.z - b.z, []);

  const render = (
    ctx: CanvasRenderingContext2D,
    t: number,
    reduced: boolean,
    colorPrefix: string,
    ink: (a: number) => number,
  ) => {
    const tiltX = 0.24;
    const tiltY = reduced ? 0.1 : 0.14 + Math.sin(t * 0.18) * 0.04;
    const cosX = Math.cos(tiltX);
    const sinX = Math.sin(tiltX);
    const cosY = Math.cos(tiltY);
    const sinY = Math.sin(tiltY);
    ctx.clearRect(0, 0, size, size);

    // Continuous closed loop: the scan line bounces up and down, forever.
    const cycle = t % DURATION;
    const scanP = Math.sin(cycle * SCAN_RATE) * 0.5 + 0.5;
    const scanY = radius * 0.62 - scanP * radius * 1.24;
    const glowR = radius * 0.22;
    const glowR2 = glowR * glowR;

    // Project every dot once per frame.
    const proj = projPool;
    for (let i = 0; i < count; i++)
      proj[i] = projectWithTrig(sphereDots[i], cx, cy, cosX, sinX, cosY, sinY);

    const fills: string[] = [];
    for (let i = 0; i <= 64; i++)
      fills[i] = colorPrefix + ink(i / 64).toFixed(3) + ")";
    const fillFor = (a: number) => fills[Math.round(clamp(a, 0, 1) * 64)];

    if (reduced) {
      for (let i = 0; i < count; i++) {
        const q = proj[i];
        ctx.fillStyle =
          colorPrefix + ink(0.12 * (q.z > 0 ? 0.35 : 1)).toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(q.x, q.y, dotSize * q.scale, 0, 2 * Math.PI);
        ctx.fill();
      }
      ctx.strokeStyle = colorPrefix + ink(0.18).toFixed(3) + ")";
      ctx.lineWidth = 1.15;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.96, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.strokeStyle = colorPrefix + ink(0.11).toFixed(3) + ")";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.68, 0, 2 * Math.PI);
      ctx.stroke();
      return;
    }

    const dots = dotsPool;
    dots.length = 0;
    const halos = halosPool;
    halos.length = 0;

    for (let i = 0; i < count; i++) {
      const d = sphereDots[i];
      const q = proj[i];
      const dy = d.y - scanY;
      const lit = Math.exp(-(dy * dy) / glowR2);
      const a = (0.1 + lit * 0.3) * (q.z > 0 ? 0.4 : 1);
      dots.push({
        x: q.x,
        y: q.y,
        r: dotSize * (1 + lit * 0.25) * q.scale,
        z: q.z,
        alpha: a,
      });
      if (lit > 0.5)
        halos.push({
          x: q.x,
          y: q.y,
          z: q.z,
          r: dotSize * 2.1 * q.scale,
          alpha: 0.14 * lit * (q.z > 0 ? 0.4 : 1),
        });
    }

    // faint frame ring
    ctx.strokeStyle = colorPrefix + ink(0.12).toFixed(3) + ")";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.96, 0, 2 * Math.PI);
    ctx.stroke();
    // inner guide ring
    ctx.strokeStyle = colorPrefix + ink(0.09).toFixed(3) + ")";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.68, 0, 2 * Math.PI);
    ctx.stroke();

    // scanning line: soft under-glow plus a crisp core
    const scanProj = projectWithTrig(
      { x: 0, y: scanY, z: radius * 0.22 },
      cx,
      cy,
      cosX,
      sinX,
      cosY,
      sinY,
    );
    ctx.strokeStyle = colorPrefix + ink(0.1).toFixed(3) + ")";
    ctx.lineWidth = 3 * unit;
    ctx.beginPath();
    ctx.moveTo(cx - radius * 0.8, scanProj.y);
    ctx.lineTo(cx + radius * 0.8, scanProj.y);
    ctx.stroke();
    ctx.strokeStyle = colorPrefix + ink(0.3).toFixed(3) + ")";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(cx - radius * 0.8, scanProj.y);
    ctx.lineTo(cx + radius * 0.8, scanProj.y);
    ctx.stroke();

    dots.sort(cmp);
    for (let i = 0; i < dots.length; i++) {
      const d = dots[i];
      if (d.alpha <= 0.003) continue;
      ctx.fillStyle = fillFor(d.alpha);
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, 2 * Math.PI);
      ctx.fill();
    }
    for (let i = 0; i < halos.length; i++) {
      const h = halos[i];
      ctx.fillStyle = fillFor(h.alpha);
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.r, 0, 2 * Math.PI);
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

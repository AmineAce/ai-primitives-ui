"use client";

import { useMemo } from "react";
import { CanvasContainer } from "../canvas/CanvasContainer";
import {
  fitRadius,
  makeSphereDots,
  projectWithTrig,
  spherePoint,
} from "../canvas/sphere";
import { clamp } from "../lib/math";
import { useOrbAnimation } from "../canvas/useOrbAnimation";
import type { Dot, Halo } from "../canvas/types";

export interface OrbitOrbProps {
  size?: number;
  speed?: number;
  paused?: boolean;
  color?: string;
  "aria-label"?: string;
}

interface Comet {
  phi: number;
  omega: number;
  phase: number;
  headR: number;
  headA: number;
  trailA: number;
  guideA: number;
}

const BASE_SPHERE = 80;
const TILT_X = 0.3;
const TRAIL_STEPS = 10;
const TRAIL_DT = 0.045;

const COMETS: Comet[] = [
  {
    phi: 1.15,
    omega: Math.PI / 2,
    phase: 0.6,
    headR: 2.6,
    headA: 0.95,
    trailA: 0.4,
    guideA: 0.05,
  },
  {
    phi: Math.PI - 1.15,
    omega: -(2 * Math.PI) / 5.2,
    phase: 2.4,
    headR: 2,
    headA: 0.6,
    trailA: 0.22,
    guideA: 0.035,
  },
];

export function OrbitOrb({
  size = 64,
  speed = 1,
  paused = false,
  color,
  "aria-label": ariaLabel = "Thinking",
}: OrbitOrbProps) {
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
  const cmp = useMemo(() => (a: Dot, b: Dot) => a.z - b.z, []);

  const render = (
    ctx: CanvasRenderingContext2D,
    t: number,
    reduced: boolean,
    colorPrefix: string,
    ink: (a: number) => number,
  ) => {
    const tiltY = reduced ? 0.15 : t * 0.1;
    const cosX = Math.cos(TILT_X);
    const sinX = Math.sin(TILT_X);
    const cosY = Math.cos(tiltY);
    const sinY = Math.sin(tiltY);
    ctx.clearRect(0, 0, size, size);
    const fills: string[] = [];
    for (let i = 0; i <= 20; i++)
      fills[i] = colorPrefix + ink(i / 20).toFixed(3) + ")";
    const fillFor = (alpha: number) =>
      fills[Math.round(clamp(alpha, 0, 1) * 20)];

    const dots = dotsPool;
    dots.length = 0;
    const halos = halosPool;
    halos.length = 0;

    for (const dot of sphereDots) {
      const p = projectWithTrig(dot, cx, cy, cosX, sinX, cosY, sinY);
      dots.push({
        x: p.x,
        y: p.y,
        r: dotSize * p.scale,
        z: p.z,
        alpha: 0.13 * (p.z > 0 ? 0.35 : 1),
      });
    }

    for (const comet of COMETS) {
      ctx.strokeStyle = colorPrefix + ink(comet.guideA).toFixed(3) + ")";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let s = 0; s <= 64; s++) {
        const th = (s / 64) * 2 * Math.PI;
        const p = projectWithTrig(
          spherePoint(th, comet.phi, radius),
          cx,
          cy,
          cosX,
          sinX,
          cosY,
          sinY,
        );
        if (s === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();

      const tt = reduced ? 0 : t;
      const steps = reduced ? 3 : TRAIL_STEPS;

      for (let k = steps; k >= 1; k--) {
        const ths = comet.phase + (tt - k * TRAIL_DT) * comet.omega;
        const the = comet.phase + (tt - (k - 1) * TRAIL_DT) * comet.omega;
        const ps = projectWithTrig(
          spherePoint(ths, comet.phi, radius),
          cx,
          cy,
          cosX,
          sinX,
          cosY,
          sinY,
        );
        const pe = projectWithTrig(
          spherePoint(the, comet.phi, radius),
          cx,
          cy,
          cosX,
          sinX,
          cosY,
          sinY,
        );
        const f = reduced ? 1 : 1 - k / (TRAIL_STEPS + 1);
        const alpha = comet.trailA * f * f;
        if (alpha <= 0.004) continue;
        ctx.strokeStyle = colorPrefix + ink(alpha).toFixed(3) + ")";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ps.x, ps.y);
        ctx.lineTo(pe.x, pe.y);
        ctx.stroke();
      }

      const head = projectWithTrig(
        spherePoint(comet.phase + tt * comet.omega, comet.phi, radius),
        cx,
        cy,
        cosX,
        sinX,
        cosY,
        sinY,
      );
      dots.push({
        x: head.x,
        y: head.y,
        r: comet.headR * unit * head.scale,
        z: head.z,
        alpha: comet.headA * (head.z > 0 ? 0.35 : 1),
      });
      halos.push({
        x: head.x,
        y: head.y,
        z: head.z,
        r: comet.headR * 2.2 * unit * head.scale,
        alpha: comet.headA * 0.22,
      });
    }

    dots.sort(cmp);
    for (const d of dots) {
      ctx.fillStyle = fillFor(d.alpha);
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, 2 * Math.PI);
      ctx.fill();
    }

    for (const h of halos) {
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

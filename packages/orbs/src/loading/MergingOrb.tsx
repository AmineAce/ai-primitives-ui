"use client";

import { useMemo } from "react";
import { CanvasContainer } from "../canvas/CanvasContainer";
import { easeInOutSine, easeOutCubic } from "../canvas/easing";
import {
  fitRadius,
  makeSphereDots,
  projectWithTrig,
  spherePoint,
  type Point3D,
} from "../canvas/sphere";
import { clamp } from "../lib/math";
import { useOrbAnimation } from "../canvas/useOrbAnimation";
import { lerp3 } from "../canvas/paths";
import type { Dot } from "../canvas/types";

export interface MergingOrbProps {
  size?: number;
  speed?: number;
  paused?: boolean;
  color?: string;
  "aria-label"?: string;
}

const SPIRAL_DUR = 2.4;
const ZOOM_DUR = 0.5;
const EXPLODE_START = SPIRAL_DUR + ZOOM_DUR;
const EXPLODE_DUR = 0.5;
const PAUSE_DUR = 0.2;
const DURATION = EXPLODE_START + EXPLODE_DUR + PAUSE_DUR;
const BASE_SPHERE = 80;
const TILT_X = 0.3;
const PHI_N = 0.5;
const PHI_S = Math.PI - 0.5;
const HALF_PI = Math.PI / 2;
const SPIN = Math.PI * 4;
const THETA0_A = 0;
const THETA0_B = Math.PI;
const SPARKS = 10;
const SPARK_EXT = 0.42;
const TRAIL_STEPS = 4;

const ORIGIN: Point3D = { x: 0, y: 0, z: 0 };

export function MergingOrb({
  size = 64,
  speed = 1,
  paused = false,
  color,
  "aria-label": ariaLabel = "Merging",
}: MergingOrbProps) {
  const count = Math.max(8, Math.round((BASE_SPHERE * size) / 64));
  const radius = fitRadius(size);
  const cx = size / 2;
  const cy = size / 2;
  const unit = size / 64;
  const dotSize = 2.2 * unit;
  const orbSize = 2.2 * unit;

  const sphereDots = useMemo(
    () => makeSphereDots(count, radius),
    [count, radius],
  );
  const dotsPool = useMemo<Dot[]>(() => [], []);
  const cmp = useMemo(() => (a: Dot, b: Dot) => a.z - b.z, []);

  const spiralPos = (isB: boolean, tt: number): Point3D => {
    if (tt <= 0) return ORIGIN;
    const s1t = clamp(tt / SPIRAL_DUR, 0, 1);
    const e1t = easeInOutSine(s1t);
    const base = isB ? PHI_S : PHI_N;
    const phi = base + (HALF_PI - base) * e1t;
    const th = (isB ? THETA0_B : THETA0_A) + (isB ? -SPIN : SPIN) * e1t;
    if (tt < SPIRAL_DUR) return spherePoint(th, phi, radius);
    const tz = clamp((tt - SPIRAL_DUR) / ZOOM_DUR, 0, 1);
    const eq = spherePoint(th, HALF_PI, radius);
    return lerp3(eq, ORIGIN, easeInOutSine(tz));
  };

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
    const projectP = (p: Point3D) =>
      projectWithTrig(p, cx, cy, cosX, sinX, cosY, sinY);
    ctx.clearRect(0, 0, size, size);

    if (reduced) {
      for (const dot of sphereDots) {
        const p = projectP(dot);
        ctx.fillStyle =
          colorPrefix + ink(0.5 * (p.z > 0 ? 0.35 : 1)).toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(p.x, p.y, dotSize * p.scale, 0, 2 * Math.PI);
        ctx.fill();
      }
      const pa = projectP(spherePoint(THETA0_A, PHI_N, radius));
      const pb = projectP(spherePoint(THETA0_B, PHI_S, radius));
      ctx.fillStyle = colorPrefix + ink(0.8).toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(pa.x, pa.y, orbSize * pa.scale, 0, 2 * Math.PI);
      ctx.arc(pb.x, pb.y, orbSize * pb.scale, 0, 2 * Math.PI);
      ctx.fill();
      return;
    }

    const cycle = t % DURATION;
    const fills: string[] = [];
    for (let i = 0; i <= 20; i++)
      fills[i] = colorPrefix + ink(i / 20).toFixed(3) + ")";
    const fillFor = (alpha: number) =>
      fills[Math.round(clamp(alpha, 0, 1) * 20)];

    const drawTrail = (isB: boolean) => {
      let prev: { x: number; y: number } | null = null;
      for (let k = 1; k <= TRAIL_STEPS; k++) {
        const tt = cycle - k * 0.045;
        if (tt <= 0 || tt >= EXPLODE_START) break;
        const p = projectP(spiralPos(isB, tt));
        if (prev) {
          ctx.strokeStyle =
            colorPrefix +
            ink(0.14 * (1 - k / (TRAIL_STEPS + 1))).toFixed(3) +
            ")";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }
        prev = { x: p.x, y: p.y };
      }
    };

    drawTrail(false);
    drawTrail(true);

    const dots = dotsPool;
    dots.length = 0;

    for (const dot of sphereDots) {
      const p = projectP(dot);
      const flashEnv =
        cycle >= EXPLODE_START
          ? easeOutCubic(clamp((cycle - EXPLODE_START) / EXPLODE_DUR, 0, 1)) *
            (1 - clamp((cycle - EXPLODE_START) / EXPLODE_DUR, 0, 1))
          : 0;
      dots.push({
        x: p.x,
        y: p.y,
        r: dotSize * p.scale,
        z: p.z,
        alpha: (0.15 + 0.15 * flashEnv) * (p.z > 0 ? 0.35 : 1),
      });
    }

    if (cycle < EXPLODE_START) {
      const fadeIn = clamp(cycle / 0.25, 0, 1);
      const pa = projectP(spiralPos(false, cycle));
      const pb = projectP(spiralPos(true, cycle));
      dots.push({
        x: pa.x,
        y: pa.y,
        r: orbSize * pa.scale,
        z: pa.z,
        alpha: 0.9 * fadeIn,
      });
      dots.push({
        x: pb.x,
        y: pb.y,
        r: orbSize * pb.scale,
        z: pb.z,
        alpha: 0.9 * fadeIn,
      });
    }

    if (cycle >= EXPLODE_START) {
      const t3 = clamp((cycle - EXPLODE_START) / EXPLODE_DUR, 0, 1);
      const e3 = easeOutCubic(t3);
      const decay = 1 - t3;
      const core = projectP(ORIGIN);
      if (t3 > 0 && t3 < 1) {
        ctx.fillStyle = colorPrefix + ink(0.22 * decay).toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.8 * e3, 0, 2 * Math.PI);
        ctx.fill();
      }
      dots.push({
        x: core.x,
        y: core.y,
        r: 3.2 * unit * (1 + 0.3 * e3) * core.scale,
        z: core.z,
        alpha: 1 * e3 * decay,
      });
      for (let i = 0; i < 5; i++) {
        const theta = (i / 5) * 2 * Math.PI;
        const spark = projectP(spherePoint(theta, HALF_PI, radius * 0.45 * e3));
        dots.push({
          x: spark.x,
          y: spark.y,
          r: 1.9 * unit * spark.scale,
          z: spark.z,
          alpha: 0.75 * e3 * decay * (spark.z > 0 ? 0.35 : 1),
        });
      }
      for (let i = 0; i < SPARKS; i++) {
        const theta = (((i + 1) * Math.PI) / SPARKS) * 2 + 0.3;
        const spark = projectP(spherePoint(theta, HALF_PI, radius * 0.85 * e3));
        dots.push({
          x: spark.x,
          y: spark.y,
          r: 1.7 * unit * spark.scale,
          z: spark.z,
          alpha: 0.5 * e3 * decay * (spark.z > 0 ? 0.35 : 1),
        });
      }
      if (t3 > 0 && t3 < 1) {
        ctx.strokeStyle = colorPrefix + ink(0.25 * decay).toFixed(3) + ")";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.8 * e3, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.strokeStyle = colorPrefix + ink(0.65 * decay).toFixed(3) + ")";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.98 * e3, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }

    dots.sort(cmp);
    for (const d of dots) {
      ctx.fillStyle = fillFor(d.alpha);
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

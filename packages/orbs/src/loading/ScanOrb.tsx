"use client";

import { useMemo } from "react";
import { CanvasContainer } from "../canvas/CanvasContainer";
import { easeInOutSine } from "../canvas/easing";
import { fitRadius, makeSphereDots, projectWithTrig } from "../canvas/sphere";
import { clamp } from "../lib/math";
import { useOrbAnimation } from "../canvas/useOrbAnimation";
import type { Dot } from "../canvas/types";

export interface ScanOrbProps {
  size?: number;
  speed?: number;
  paused?: boolean;
  color?: string;
  "aria-label"?: string;
}

const BASE_SPHERE = 80;
const TILT_X = 0.3;
const TILT_Y = 0.25;
const H_DUR = 2.6;
const V_DUR = 2.2;
const FADE = 0.4;
const DURATION = H_DUR + V_DUR;
const PHI_TOP = 0.35;
const WIDTH = 0.55;
const FLOOR = 0.3;
const PEAK = 0.95;

export function ScanOrb({
  size = 64,
  speed = 1,
  paused = false,
  color,
  "aria-label": ariaLabel = "Scan",
}: ScanOrbProps) {
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
  const cmp = useMemo(() => (a: Dot, b: Dot) => a.z - b.z, []);

  const envelope = (
    phaseStart: number,
    phaseDur: number,
    cyc: number,
  ): number => {
    const x = cyc - phaseStart;
    const rise = clamp(x / FADE, 0, 1);
    const fall = clamp((phaseDur - x) / FADE, 0, 1);
    return easeInOutSine(rise) * easeInOutSine(fall);
  };

  const render = (
    ctx: CanvasRenderingContext2D,
    t: number,
    reduced: boolean,
    colorPrefix: string,
    ink: (a: number) => number,
  ) => {
    const tiltY = reduced ? 0.15 : TILT_Y;
    const cyc = t % DURATION;
    const fills: string[] = [];
    for (let i = 0; i <= 20; i++)
      fills[i] = colorPrefix + ink(i / 20).toFixed(3) + ")";
    const fillFor = (alpha: number) =>
      fills[Math.round(clamp(alpha, 0, 1) * 20)];
    const cosX = Math.cos(TILT_X);
    const sinX = Math.sin(TILT_X);
    const cosY = Math.cos(tiltY);
    const sinY = Math.sin(tiltY);
    ctx.clearRect(0, 0, size, size);
    const dots = dotsPool;
    dots.length = 0;

    for (const dot of sphereDots) {
      const theta = Math.atan2(dot.z, dot.x);
      let intensity: number;

      if (reduced) {
        const d = Math.atan2(Math.sin(theta), Math.cos(theta));
        intensity = Math.exp(-(d * d) / (WIDTH * WIDTH));
      } else if (cyc < H_DUR) {
        const front = cyc * ((2 * Math.PI) / H_DUR);
        const d = Math.atan2(Math.sin(theta - front), Math.cos(theta - front));
        const g = Math.exp(-(d * d) / (WIDTH * WIDTH));
        intensity = g * envelope(0, H_DUR, cyc);
      } else {
        const x = cyc - H_DUR;
        const frontPhi = PHI_TOP + x * ((Math.PI - 2 * PHI_TOP) / V_DUR);
        const phi = Math.acos(clamp(dot.y / radius, -1, 1));
        const dPhi = phi - frontPhi;
        const g = Math.exp(-(dPhi * dPhi) / (WIDTH * WIDTH));
        intensity = g * envelope(H_DUR, V_DUR, cyc);
      }

      const b = FLOOR + (PEAK - FLOOR) * intensity;
      const p = projectWithTrig(dot, cx, cy, cosX, sinX, cosY, sinY);
      dots.push({
        x: p.x,
        y: p.y,
        r: dotSize * (1 + 0.2 * intensity) * p.scale,
        z: p.z,
        alpha: b * (p.z > 0 ? 0.35 : 1),
      });
    }

    dots.sort(cmp);
    for (const d of dots) {
      if (d.alpha <= 0.004) continue;
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

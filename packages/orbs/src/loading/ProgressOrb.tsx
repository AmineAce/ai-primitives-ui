"use client";

import { useMemo } from "react";
import { CanvasContainer } from "../canvas/CanvasContainer";
import { fitRadius, makeSphereDots, projectWithTrig } from "../canvas/sphere";
import { easeOutBack, easeOutCubic } from "../canvas/easing";
import { clamp } from "../lib/math";
import { useOrbAnimation } from "../canvas/useOrbAnimation";
import type { Dot } from "../canvas/types";

export interface ProgressOrbProps {
  size?: number;
  speed?: number;
  paused?: boolean;
  color?: string;
  value?: number;
  className?: string;
  style?: React.CSSProperties;
  "aria-label"?: string;
}

const BASE_SPHERE = 80;

export function ProgressOrb({
  size = 64,
  speed = 1,
  paused = false,
  color,
  value,
  className,
  style,
  "aria-label": ariaLabel = "Progress",
}: ProgressOrbProps) {
  const count = Math.max(8, Math.round((BASE_SPHERE * size) / 64));
  const radius = fitRadius(size);
  const cx = size / 2;
  const cy = size / 2;
  const unit = size / 64;
  const dotSize = 1.9 * unit;

  const sphereDots = useMemo(
    () => makeSphereDots(count, radius),
    [count, radius],
  );
  const dotsPool = useMemo<Dot[]>(() => [], []);
  const cmp = useMemo(() => (a: Dot, b: Dot) => a.z - b.z, []);

  const render = (
    ctx: CanvasRenderingContext2D,
    t: number,
    reduced: boolean,
    colorPrefix: string,
    ink: (a: number) => number,
  ) => {
    const tiltX = 0.3;
    const tiltY = 0.12;
    const cosX = Math.cos(tiltX);
    const sinX = Math.sin(tiltX);
    const cosY = Math.cos(tiltY);
    const sinY = Math.sin(tiltY);
    ctx.clearRect(0, 0, size, size);

    const fills: string[] = [];
    for (let i = 0; i <= 64; i++)
      fills[i] = colorPrefix + ink(i / 64).toFixed(3) + ")";
    const fillFor = (a: number) => fills[Math.round(clamp(a, 0, 1) * 64)];

    const trackR = radius * 1.08;
    const SWEEP = 4.2;
    const HOLD = 0.7;
    const RESET = 0.35;
    const DURATION = SWEEP + HOLD + RESET;
    let progress: number;
    let holdP = 0;
    let isHolding = false;
    let isResetting = false;
    if (value !== undefined) {
      progress = clamp(value, 0, 1);
      isHolding = progress >= 0.997;
      holdP = isHolding ? 1 : 0;
    } else if (reduced) {
      progress = 0.72;
    } else {
      const cycle = t % DURATION;
      if (cycle < SWEEP) {
        progress = cycle / SWEEP;
      } else if (cycle < SWEEP + HOLD) {
        progress = 1;
        isHolding = true;
        holdP = easeOutCubic(clamp((cycle - SWEEP) / HOLD, 0, 1));
      } else {
        progress =
          1 - easeOutCubic(clamp((cycle - SWEEP - HOLD) / RESET, 0, 1));
        isResetting = true;
        holdP = 1 - easeOutCubic(clamp((cycle - SWEEP - HOLD) / RESET, 0, 1));
      }
    }
    const startAng = -Math.PI / 2;
    const endAng = startAng + progress * 2 * Math.PI;

    if (reduced) {
      for (const dot of sphereDots) {
        const p = projectWithTrig(dot, cx, cy, cosX, sinX, cosY, sinY);
        ctx.fillStyle =
          colorPrefix + ink(0.09 * (p.z > 0 ? 0.35 : 1)).toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(p.x, p.y, dotSize * p.scale, 0, 2 * Math.PI);
        ctx.fill();
      }
      ctx.strokeStyle = colorPrefix + ink(0.08).toFixed(3) + ")";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, trackR, 0, 2 * Math.PI);
      ctx.stroke();
      for (let i = 0; i < 4; i++) {
        const ang = startAng + (i / 4) * 2 * Math.PI;
        const covered =
          progress > 0.004 && ang >= startAng - 1e-6 && ang <= endAng + 1e-6;
        const a = covered ? 0.85 : 0.14;
        const r = covered ? 1.6 * unit * 1.18 : 1.6 * unit;
        const hx = cx + Math.cos(ang) * trackR;
        const hy = cy + Math.sin(ang) * trackR;
        ctx.fillStyle = colorPrefix + ink(a).toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(hx, hy, r, 0, 2 * Math.PI);
        ctx.fill();
      }
      if (progress > 0.004) {
        ctx.strokeStyle = colorPrefix + ink(0.85).toFixed(3) + ")";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(cx, cy, trackR, startAng, endAng);
        ctx.stroke();
        const hx = cx + Math.cos(endAng) * trackR;
        const hy = cy + Math.sin(endAng) * trackR;
        ctx.fillStyle = colorPrefix + ink(0.88).toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(hx, hy, 2.0 * unit, 0, 2 * Math.PI);
        ctx.fill();
      }
      return;
    }

    const dots = dotsPool;
    dots.length = 0;
    for (const dot of sphereDots) {
      const p = projectWithTrig(dot, cx, cy, cosX, sinX, cosY, sinY);
      dots.push({
        x: p.x,
        y: p.y,
        r: dotSize * p.scale,
        z: p.z,
        alpha: 0.09 * (p.z > 0 ? 0.35 : 1),
      });
    }

    // percentage: center readout: a soft darker disc lifts the glyph off the
    // dot noise, and the number is the brightest thing in the component.
    // When the progress reaches 100% and holds, the "100" gives a gentle,
    // smooth settle: it swells slightly near the start of the hold, then eases
    // fully back to baseline well before the reset, so there is no snap at the
    // boundary.
    const pct = Math.round(progress * 100);
    const env =
      isHolding && holdP > 0
        ? easeOutCubic(clamp(holdP * 3, 0, 1)) *
          (1 - easeOutCubic(clamp((holdP - 0.2) / 0.6, 0, 1)))
        : 0;
    const pulseS = 1 + 0.07 * env;
    ctx.fillStyle = colorPrefix + ink(0.08).toFixed(3) + ")";
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.42 * pulseS, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = colorPrefix + ink(0.9).toFixed(3) + ")";
    ctx.font = `600 ${13 * (size / 64) * pulseS}px JetBrains Mono, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${pct}%`, cx, cy);

    ctx.strokeStyle = colorPrefix + ink(0.08).toFixed(3) + ")";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, trackR, 0, 2 * Math.PI);
    ctx.stroke();

    for (let i = 0; i < 4; i++) {
      const ang = startAng + (i / 4) * 2 * Math.PI;
      const covered =
        progress > 0.004 && ang >= startAng - 1e-6 && ang <= endAng + 1e-6;
      const dotProg = i / 4;
      const delta = (progress - dotProg + 1) % 1;
      const isPulse = !reduced && covered && delta < 0.09 && delta >= 0;
      let a = covered ? 0.85 : 0.14;
      let r = covered ? 1.6 * unit * 1.18 : 1.6 * unit;
      let haloA = 0;
      let haloR = 0;
      if (isPulse) {
        const p = 1 - delta / 0.09;
        const e = easeOutBack(p);
        r = 1.6 * unit * (1.18 + 0.32 * e);
        a = 0.85 + 0.1 * e;
        haloA = 0.12 * (1 - p);
        haloR = r * 2.0;
      }
      if (isHolding) {
        const hp = holdP < 0.5 ? holdP / 0.5 : 1 - (holdP - 0.5) / 0.5;
        if (covered) {
          r = 1.6 * unit * (1.18 + 0.14 * hp);
          a = 0.85 + 0.07 * hp;
          haloA = Math.max(haloA, 0.08 * hp);
          haloR = Math.max(haloR, r * 1.9);
        }
      }
      const hx = cx + Math.cos(ang) * trackR;
      const hy = cy + Math.sin(ang) * trackR;
      if (haloA > 0.004) {
        ctx.fillStyle = colorPrefix + ink(haloA).toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(hx, hy, haloR, 0, 2 * Math.PI);
        ctx.fill();
      }
      ctx.fillStyle = colorPrefix + ink(a).toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(hx, hy, r, 0, 2 * Math.PI);
      ctx.fill();
    }

    if (progress > 0.004) {
      ctx.strokeStyle =
        colorPrefix +
        ink(isHolding ? 0.85 + holdP * 0.07 : 0.85).toFixed(3) +
        ")";
      ctx.lineWidth = isHolding ? 1.4 + holdP * 0.3 : 1.4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(cx, cy, trackR, startAng, endAng);
      ctx.stroke();
      ctx.lineCap = "butt";
      const hx = cx + Math.cos(endAng) * trackR;
      const hy = cy + Math.sin(endAng) * trackR;
      const holdPulse = isHolding ? 1 + holdP * 0.12 : 1;
      ctx.fillStyle =
        colorPrefix +
        ink(0.11 + (isHolding ? holdP * 0.04 : 0)).toFixed(3) +
        ")";
      ctx.beginPath();
      ctx.arc(hx, hy, 2.0 * unit * 2.2 * holdPulse, 0, 2 * Math.PI);
      ctx.fill();
      dots.push({
        x: hx,
        y: hy,
        r: 2.0 * unit * holdPulse,
        z: -10,
        alpha: 0.88 + (isHolding ? holdP * 0.04 : 0),
      });
    }

    dots.sort(cmp);
    for (const d of dots) {
      if (d.alpha <= 0.003) continue;
      ctx.fillStyle = fillFor(d.alpha * (d.z > 0 && d.z !== -10 ? 0.35 : 1));
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
      className={className}
      style={style}
    />
  );
}

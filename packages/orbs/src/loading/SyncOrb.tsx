"use client";

import { CanvasContainer } from "../canvas/CanvasContainer";
import {
  easeInOutSine,
  easeOutBack,
  easeOutCubic,
  easeOutExpo,
} from "../canvas/easing";
import {
  fitRadius,
  makeSphereDots,
  project,
  type Point3D,
} from "../canvas/sphere";
import { clamp } from "../lib/math";
import { useOrbAnimation } from "../canvas/useOrbAnimation";
import { lerp3 } from "../canvas/paths";

export interface SyncOrbProps {
  size?: number;
  speed?: number;
  paused?: boolean;
  color?: string;
  "aria-label"?: string;
}

const DURATION = 3.6;
const GRID = 8;
const COUNT = GRID * GRID;

export function SyncOrb({
  size = 64,
  speed = 1,
  paused = false,
  color,
  "aria-label": ariaLabel = "Sync",
}: SyncOrbProps) {
  const radius = fitRadius(size);
  const cx = size / 2;
  const cy = size / 2;
  const unit = size / 64;
  const dotR = 1.6 * unit;

  const sphereDots = makeSphereDots(COUNT, radius);

  const square: Point3D[] = [];
  const half = radius * 0.68;
  const step = (half * 2) / (GRID - 1);
  const start = -half;
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      square.push({
        x: start + x * step,
        y: start + y * step,
        z: 0,
      });
    }
  }
  const sqOrder = square
    .map((p, i) => ({ p, i, d: Math.hypot(p.x, p.y) }))
    .sort((a, b) => b.d - a.d)
    .map((o) => o.i);
  const squareSorted = sqOrder.map((i) => square[i]);
  const sphereSorted = [...sphereDots].sort(
    (a, b) => Math.hypot(a.x, a.y) - Math.hypot(b.x, b.y),
  );

  const render = (
    ctx: CanvasRenderingContext2D,
    t: number,
    reduced: boolean,
    colorPrefix: string,
    ink: (a: number) => number,
  ) => {
    const cycle = (t * speed) % DURATION;

    const tiltBaseX = 0.42;
    const tiltBaseY = 0.32 + Math.sin(t * 0.35) * 0.12;
    let tiltX = tiltBaseX;
    let tiltY = tiltBaseY;
    if (cycle >= 1.45 && cycle < 2.35) {
      const p = clamp((cycle - 1.45) / 0.9, 0, 1);
      const e = easeInOutSine(p);
      tiltX = tiltBaseX * (1 - e) + 0.18 * e;
      tiltY = tiltBaseY * (1 - e) + 0.14 * e;
    } else if (cycle >= 2.35 && cycle < 3.0) {
      tiltX = 0.18;
      tiltY = 0.14 + Math.sin(t * 0.45) * 0.04;
    } else if (cycle >= 3.0) {
      const p = clamp((cycle - 3.0) / 0.6, 0, 1);
      const e = easeInOutSine(p);
      tiltX = 0.18 * (1 - e) + tiltBaseX * e;
      tiltY = (0.14 + Math.sin(t * 0.45) * 0.04) * (1 - e) + tiltBaseY * e;
    }
    const rtX = reduced ? 0.12 : tiltX;
    const rtY = reduced ? 0.1 : tiltY;
    ctx.clearRect(0, 0, size, size);

    if (reduced) {
      for (const p of square) {
        const pr = project(p, cx, cy, rtX, rtY);
        ctx.fillStyle = colorPrefix + ink(0.65).toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(pr.x, pr.y, dotR * pr.scale, 0, 2 * Math.PI);
        ctx.fill();
      }
      return;
    }

    const morphToSphereStart = 1.45;
    const morphToSphereEnd = 2.35;
    const flashStart = 2.35;
    const flashEnd = 3.0;
    const morphBackStart = 3.0;
    const morphBackEnd = DURATION;

    // diagonal orbital shimmer — 2x 45° wavefronts through panel
    const waveActive = cycle >= 0.4 && cycle < 1.5;
    let waveA = 0;
    let waveB = 0;
    if (waveActive) {
      const wp = clamp((cycle - 0.4) / 1.1, 0, 1);
      const eased = easeInOutSine(wp);
      const diag = half * Math.SQRT2;
      waveA = -diag + eased * diag * 2;
      waveB = diag - eased * diag * 2;
    }

    const dots: { x: number; y: number; r: number; z: number; a: number }[] =
      [];
    const halos: { x: number; y: number; r: number; a: number }[] = [];

    // supernova suck-in before morph
    const suckT = clamp((cycle - 1.38) / 0.12, 0, 1);
    const suckE = easeOutBack(suckT);
    const suck = cycle >= 1.38 && cycle < 1.5 ? 1 - 0.08 * suckE : 1;

    for (let i = 0; i < COUNT; i++) {
      const sqOrig = squareSorted[i];
      const sq: Point3D = {
        x: sqOrig.x * suck,
        y: sqOrig.y * suck,
        z: sqOrig.z,
      };
      const sp = sphereSorted[i];

      let pos: Point3D;
      if (cycle < morphToSphereStart) {
        pos = sq;
      } else if (cycle < morphToSphereEnd) {
        const stagger = (i / COUNT) * 0.16;
        const cp = clamp(
          (cycle - morphToSphereStart - stagger) /
            (morphToSphereEnd - morphToSphereStart - stagger),
          0,
          1,
        );
        const e = easeInOutSine(cp);
        pos = lerp3(sq, sp, e);
      } else if (cycle < flashEnd) {
        pos = sp;
      } else {
        const stagger = ((COUNT - 1 - i) / COUNT) * 0.14;
        const cp = clamp(
          (cycle - morphBackStart - stagger) /
            (morphBackEnd - morphBackStart - stagger),
          0,
          1,
        );
        const e = easeInOutSine(cp);
        pos = lerp3(sp, sq, e);
      }

      const pr = project(pos, cx, cy, rtX, rtY);

      let a = 0.68;
      let doHalo = false;
      let haloA = 0;
      if (cycle < morphToSphereStart) {
        if (waveActive) {
          const diag = (pos.x + pos.y) / Math.SQRT2;
          const dA = Math.abs(diag - waveA);
          const dB = Math.abs(diag - waveB);
          const nearA = dA < 3.8 * unit;
          const nearB = dB < 3.8 * unit;
          if (nearA || nearB) {
            const d = Math.min(dA, dB);
            const w = 1 - d / (3.8 * unit);
            a = 0.68 + 0.26 * w;
            if (w > 0.62) {
              doHalo = true;
              haloA = 0.1 * w;
            }
          }
        }
        a *= 0.95 + 0.05 * Math.sin(t * 0.9 + i * 0.07);
        a *= pr.z > 0 ? 0.92 : 1;
        dots.push({ x: pr.x, y: pr.y, r: dotR * pr.scale, z: pr.z, a });
        if (doHalo)
          halos.push({ x: pr.x, y: pr.y, r: dotR * pr.scale * 1.9, a: haloA });
      } else if (cycle < morphToSphereEnd) {
        const mp = clamp(
          (cycle - morphToSphereStart) /
            (morphToSphereEnd - morphToSphereStart),
          0,
          1,
        );
        const base = 0.68 - 0.22 * mp;
        a = base * (pr.z > 0 ? 0.88 : 1);
        dots.push({ x: pr.x, y: pr.y, r: dotR * pr.scale, z: pr.z, a });
      } else if (cycle < flashEnd) {
        a = 0.48 * (pr.z > 0 ? 0.35 : 1);
        dots.push({ x: pr.x, y: pr.y, r: dotR * pr.scale, z: pr.z, a });
      } else {
        const mp = clamp(
          (cycle - morphBackStart) / (morphBackEnd - morphBackStart),
          0,
          1,
        );
        const base = 0.48 + 0.2 * mp;
        a = base * (pr.z > 0 ? 0.88 : 1);
        dots.push({ x: pr.x, y: pr.y, r: dotR * pr.scale, z: pr.z, a });
      }
    }

    dots.sort((a, b) => a.z - b.z);
    for (const h of halos) {
      ctx.fillStyle = colorPrefix + ink(h.a).toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.r, 0, 2 * Math.PI);
      ctx.fill();
    }
    for (const d of dots) {
      ctx.fillStyle = colorPrefix + ink(d.a).toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, 2 * Math.PI);
      ctx.fill();
    }

    if (cycle >= flashStart && cycle < flashEnd) {
      const fp = clamp((cycle - flashStart) / (flashEnd - flashStart), 0, 1);
      const fe = easeOutCubic(fp);
      const fe2 = easeOutCubic(clamp((fp - 0.12) / 0.88, 0, 1));
      const fe3 = easeOutCubic(clamp((fp - 0.24) / 0.76, 0, 1));
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.98, 0, 2 * Math.PI);
      ctx.clip();
      const c45 = Math.cos(Math.PI / 4);
      const s45 = Math.sin(Math.PI / 4);
      // ring1 equator
      const er1 = radius * (0.4 + fe * 0.52);
      ctx.strokeStyle =
        colorPrefix + ink(0.36 * (1 - fe * 0.25)).toFixed(3) + ")";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let s = 0; s <= 48; s++) {
        const a = (s / 48) * 2 * Math.PI;
        const p = project(
          { x: er1 * Math.cos(a), y: 0, z: er1 * Math.sin(a) },
          cx,
          cy,
          0.18,
          0.14,
        );
        if (s === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      // ring2 diagonal west-north 45° around X
      const er2 = radius * (0.32 + fe2 * 0.46);
      if (fe2 > 0) {
        ctx.strokeStyle =
          colorPrefix + ink(0.22 * (1 - fe2 * 0.3)).toFixed(3) + ")";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let s = 0; s <= 48; s++) {
          const a = (s / 48) * 2 * Math.PI;
          const p = project(
            {
              x: er2 * Math.cos(a),
              y: er2 * Math.sin(a) * c45,
              z: er2 * Math.sin(a) * s45,
            },
            cx,
            cy,
            0.18,
            0.14,
          );
          if (s === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      }
      // ring3 diagonal other 45° around Z
      const er3 = radius * (0.24 + fe3 * 0.4);
      if (fe3 > 0) {
        ctx.strokeStyle =
          colorPrefix + ink(0.14 * (1 - fe3 * 0.3)).toFixed(3) + ")";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let s = 0; s <= 48; s++) {
          const a = (s / 48) * 2 * Math.PI;
          const p = project(
            {
              x: er3 * Math.sin(a) * s45,
              y: er3 * Math.sin(a) * c45,
              z: er3 * Math.cos(a),
            },
            cx,
            cy,
            0.18,
            0.14,
          );
          if (s === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      }
      ctx.fillStyle = colorPrefix + ink(0.13 * (1 - fe)).toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(cx, cy, er1, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = colorPrefix + ink(0.08 * (1 - fe2)).toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(cx, cy, er2 * 0.62, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
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

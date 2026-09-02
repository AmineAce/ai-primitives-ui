"use client";

import { useMemo } from "react";
import { CanvasContainer } from "../canvas/CanvasContainer";
import { easeInOutSine } from "../canvas/easing";
import {
  fitRadius,
  makeSphereDots,
  projectWithTrig,
  type Point3D,
} from "../canvas/sphere";
import { clamp } from "../lib/math";
import { useOrbAnimation } from "../canvas/useOrbAnimation";
import type { Dot, Halo, Point2D } from "../canvas/types";

export interface StashingOrbProps {
  size?: number;
  speed?: number;
  paused?: boolean;
  color?: string;
  "aria-label"?: string;
}

const DURATION = 6.4;
const N = 12;
const V_START = 1;
const V_STAGGER = 0.13;
const FLIGHT = 0.45;
const SEAL_START = 3;
const SEAL_DUR = 0.35;
const FLASH_START = SEAL_START + SEAL_DUR;
const HOLD_END = 4.2;
const OUT_START = 4.2;
const OUT_STAGGER = 0.13;
const OUT_FLIGHT = 0.45;
const BASE_SPHERE = 80;
const TILT_X = 0.3;

const BUBBLES: { dx: number; dy: number; r: number; core?: boolean }[] = [
  { dx: 0, dy: 0, r: 0.55, core: true },
  { dx: 0.44, dy: 0.0, r: 0.31 },
  { dx: 0.109, dy: 0.406, r: 0.32 },
  { dx: -0.314, dy: 0.264, r: 0.3 },
  { dx: -0.332, dy: -0.289, r: 0.33 },
  { dx: 0.101, dy: -0.377, r: 0.31 },
  { dx: 0.459, dy: 0.265, r: 0.27 },
  { dx: 0.035, dy: 0.499, r: 0.28 },
  { dx: -0.49, dy: 0.25, r: 0.26 },
  { dx: -0.462, dy: -0.216, r: 0.29 },
  { dx: 0.038, dy: -0.539, r: 0.27 },
  { dx: 0.411, dy: -0.267, r: 0.28 },
  { dx: 0.695, dy: 0.186, r: 0.21 },
  { dx: 0.509, dy: 0.509, r: 0.2 },
  { dx: 0.186, dy: 0.695, r: 0.22 },
  { dx: -0.19, dy: 0.7, r: 0.2 },
  { dx: -0.503, dy: 0.515, r: 0.21 },
  { dx: -0.688, dy: 0.183, r: 0.2 },
  { dx: -0.7, dy: -0.19, r: 0.21 },
  { dx: -0.509, dy: -0.509, r: 0.2 },
  { dx: -0.183, dy: -0.688, r: 0.22 },
  { dx: 0.19, dy: -0.7, r: 0.2 },
  { dx: 0.515, dy: -0.503, r: 0.21 },
  { dx: 0.688, dy: -0.183, r: 0.2 },
];

export function StashingOrb({
  size = 64,
  speed = 1,
  paused = false,
  color,
  "aria-label": ariaLabel = "Stashing",
}: StashingOrbProps) {
  const count = Math.max(8, Math.round((BASE_SPHERE * size) / 64));
  const radius = fitRadius(size);
  const cx = size / 2;
  const cy = size / 2;
  const unit = size / 64;
  const dotSize = 2.2 * unit;
  const commSize = 2.3 * unit;

  const { sphereDots, wip } = useMemo(
    () => ({
      sphereDots: makeSphereDots(count, radius),
      wip: makeSphereDots(N, radius),
    }),
    [count, radius],
  );
  const dotsPool = useMemo<Dot[]>(() => [], []);
  const halosPool = useMemo<Halo[]>(() => [], []);
  const cmp = useMemo(() => (a: Dot, b: Dot) => a.z - b.z, []);
  const order = (i: number) => (i * 5) % N;

  const container = { x: 0, y: 0, z: radius * 0.2 };
  const pc = { x: cx, y: cy };

  const arrive = (i: number) => V_START + order(i) * V_STAGGER + FLIGHT;
  const leave = (i: number) => OUT_START + (N - 1 - order(i)) * OUT_STAGGER;

  const pathOf = (i: number, f: number, dir: 1 | -1): Point3D => {
    const a = wip[i];
    const b = container;
    const mid = dir === 1 ? a : b;
    const end = dir === 1 ? b : a;
    const cx0 = (a.x + b.x) / 2 + a.x * 0.15;
    const cy0 = (a.y + b.y) / 2 + a.y * 0.15;
    const cz0 = (a.z + b.z) / 2 - 0.3 * radius;
    const acx = mid.x + (cx0 - mid.x) * f;
    const acy = mid.y + (cy0 - mid.y) * f;
    const acz = mid.z + (cz0 - mid.z) * f;
    const cbx = cx0 + (end.x - cx0) * f;
    const cby = cy0 + (end.y - cy0) * f;
    const cbz = cz0 + (end.z - cz0) * f;
    return {
      x: acx + (cbx - acx) * f,
      y: acy + (cby - acy) * f,
      z: acz + (cbz - acz) * f,
    };
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

    const drawThread = (spot: Point3D, alpha: number) => {
      if (alpha <= 0.004) return;
      const p = projectP(spot);
      ctx.strokeStyle = colorPrefix + ink(alpha).toFixed(3) + ")";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pc.x, pc.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    };

    const drawFoam = (
      r: number,
      grow: number,
      tight: number,
      alpha: number,
      phase: number,
    ) => {
      const pulse = 1 + 0.02 * Math.sin(phase * 3);
      for (const b of BUBBLES) {
        const bx = pc.x + b.dx * r * grow * tight;
        const by = pc.y + b.dy * r * grow * tight;
        const br = Math.max(0.6 * unit, b.r * r * grow * pulse);
        const ba = b.core ? alpha : alpha * 0.8;
        if (ba <= 0.004) continue;
        ctx.fillStyle = colorPrefix + ink(ba).toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(bx, by, br, 0, 2 * Math.PI);
        ctx.fill();
      }
    };

    if (reduced) {
      for (const dot of sphereDots) {
        const p = projectP(dot);
        ctx.fillStyle =
          colorPrefix + ink(0.5 * (p.z > 0 ? 0.35 : 1)).toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(p.x, p.y, dotSize * p.scale, 0, 2 * Math.PI);
        ctx.fill();
      }
      for (const spot of wip) drawThread(spot, 0.12);
      for (const spot of wip) {
        const p = projectP(spot);
        ctx.fillStyle =
          colorPrefix + ink(0.9 * (p.z > 0 ? 0.35 : 1)).toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(p.x, p.y, commSize * p.scale, 0, 2 * Math.PI);
        ctx.fill();
      }
      drawFoam((3 + 5.5) * unit, 1, 1, 0.55, 0);
      return;
    }

    const cycle = t % DURATION;
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
      const p = projectP(dot);
      dots.push({
        x: p.x,
        y: p.y,
        r: dotSize * p.scale,
        z: p.z,
        alpha: 0.15 * (p.z > 0 ? 0.35 : 1),
      });
    }

    let inPouch = 0;
    for (let i = 0; i < N; i++) {
      if (arrive(i) <= cycle && cycle < leave(i)) inPouch++;
    }
    const fill = inPouch / N;
    const pouchR = (3 + 5.5 * fill) * unit;

    const sealQ = clamp((cycle - SEAL_START) / SEAL_DUR, 0, 1);
    const sealed = cycle >= SEAL_START && cycle < HOLD_END;

    let pouchAlpha = 0.12 + 0.58 * fill;
    if (sealed) pouchAlpha += 0.1 * sealQ;
    pouchAlpha = Math.min(pouchAlpha, 0.85);

    if (pouchAlpha > 0.08) {
      const grow = 0.45 + 0.55 * fill;
      const tight = sealed ? 1 - sealQ * 0.12 : 1;
      drawFoam(pouchR, grow, tight, pouchAlpha, cycle);
    }

    for (let i = 0; i < N; i++) {
      const v = clamp(
        (cycle - (V_START + order(i) * V_STAGGER)) / FLIGHT,
        0,
        1,
      );
      const o = clamp((cycle - leave(i)) / OUT_FLIGHT, 0, 1);

      if (v <= 0) {
        drawThread(wip[i], 0.09);
        const spot = projectP(wip[i]);
        const bob = Math.sin(cycle * 5 + i * 1.7) * 0.01 * radius;
        dots.push({
          x: spot.x,
          y: spot.y + bob,
          r: commSize * spot.scale,
          z: spot.z,
          alpha: 0.9 * (spot.z > 0 ? 0.35 : 1),
        });
      } else if (v < 1) {
        const fp = projectP(pathOf(i, easeInOutSine(v), 1));
        let prev: Point2D | null = null;
        for (let k = 1; k <= 3; k++) {
          const vk = clamp(
            (cycle - k * 0.03 - (V_START + order(i) * V_STAGGER)) / FLIGHT,
            0,
            1,
          );
          if (vk <= 0 || vk >= 1) break;
          const tp = projectP(pathOf(i, easeInOutSine(vk), 1));
          if (prev) {
            ctx.strokeStyle =
              colorPrefix + ink(0.16 * (1 - k / 4)).toFixed(3) + ")";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(prev.x, prev.y);
            ctx.lineTo(tp.x, tp.y);
            ctx.stroke();
          }
          prev = { x: tp.x, y: tp.y };
        }
        dots.push({
          x: fp.x,
          y: fp.y,
          r: commSize * fp.scale,
          z: fp.z,
          alpha: 0.95 * (fp.z > 0 ? 0.35 : 1),
        });
      } else if (cycle >= leave(i)) {
        if (o < 1) {
          const fp = projectP(pathOf(i, easeInOutSine(o), -1));
          let prev: Point2D | null = null;
          for (let k = 1; k <= 3; k++) {
            const ok = clamp((cycle - k * 0.03 - leave(i)) / OUT_FLIGHT, 0, 1);
            if (ok <= 0 || ok >= 1) break;
            const tp = projectP(pathOf(i, easeInOutSine(ok), -1));
            if (prev) {
              ctx.strokeStyle =
                colorPrefix + ink(0.16 * (1 - k / 4)).toFixed(3) + ")";
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(prev.x, prev.y);
              ctx.lineTo(tp.x, tp.y);
              ctx.stroke();
            }
            prev = { x: tp.x, y: tp.y };
          }
          dots.push({
            x: fp.x,
            y: fp.y,
            r: commSize * fp.scale,
            z: fp.z,
            alpha: 0.95 * (fp.z > 0 ? 0.35 : 1),
          });
        } else {
          drawThread(wip[i], 0.09);
          const spot = projectP(wip[i]);
          const bob = Math.sin(cycle * 5 + i * 1.7) * 0.01 * radius;
          dots.push({
            x: spot.x,
            y: spot.y + bob,
            r: commSize * spot.scale,
            z: spot.z,
            alpha: 0.9 * (spot.z > 0 ? 0.35 : 1),
          });
        }
      }
    }

    if (cycle >= FLASH_START) {
      const q = clamp((cycle - FLASH_START) / 0.6, 0, 1);
      if (q < 1) {
        const blastR = pouchR * (1 + q * 2);
        const blastA = 0.45 * Math.pow(1 - q, 2);
        if (blastA > 0.004) {
          ctx.strokeStyle = colorPrefix + ink(blastA).toFixed(3) + ")";
          ctx.lineWidth = Math.max(0.5, 2 * (1 - q));
          ctx.beginPath();
          ctx.arc(pc.x, pc.y, blastR, 0, 2 * Math.PI);
          ctx.stroke();
        }
        const trailQ = q - 0.14;
        if (trailQ > 0) {
          const trailR = pouchR * (1 + trailQ * 2);
          const trailA = 0.18 * Math.pow(1 - trailQ, 2);
          if (trailA > 0.004) {
            ctx.strokeStyle = colorPrefix + ink(trailA).toFixed(3) + ")";
            ctx.lineWidth = Math.max(0.5, 1.2 * (1 - trailQ));
            ctx.beginPath();
            ctx.arc(pc.x, pc.y, trailR, 0, 2 * Math.PI);
            ctx.stroke();
          }
        }
        halos.push({
          x: pc.x,
          y: pc.y,
          z: radius * 0.2,
          r: pouchR * (1.3 + q * 0.5),
          alpha: 0.5 * Math.pow(1 - q, 2),
        });
      }
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

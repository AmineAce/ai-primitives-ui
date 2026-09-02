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
import type { Dot, Halo, Point2D } from "../canvas/types";

export interface RebasingOrbProps {
  size?: number;
  speed?: number;
  paused?: boolean;
  color?: string;
  "aria-label"?: string;
}

const DURATION = 5.4;
const N = 12;
const ACTIVATE_LEN = 0.18;
const REPLAY_START = 0.8;
const REPLAY_STAGGER = 0.22;
const FLIGHT_DUR = 0.42;
const COMPLETE_START = 4.6;
const PULSE_DUR = 0.3;
const CROSS_START = COMPLETE_START + PULSE_DUR;
const CROSS_DUR = DURATION - CROSS_START;
const RING_PHIS = [1.3, Math.PI / 2, 1.84];
const RING_OFFS = [-0.07, 0, 0.07];
const EQUATOR = 1;
const BASE_SPHERE = 80;
const TILT_X = 0.3;
const HOVER_LIFT = 1.05;
const FLY_LIFT = 0.13;

interface Ring {
  phi: number;
  offset: number;
  theta: number[];
  spawnTheta: number[];
  pts: Point3D[];
  spawn: Point3D[];
}

export function RebasingOrb({
  size = 64,
  speed = 1,
  paused = false,
  color,
  "aria-label": ariaLabel = "Rebasing",
}: RebasingOrbProps) {
  const count = Math.max(8, Math.round((BASE_SPHERE * size) / 64));
  const radius = fitRadius(size);
  const cx = size / 2;
  const cy = size / 2;
  const unit = size / 64;
  const dotSize = 2.2 * unit;
  const commSize = 2 * unit;

  const { sphereDots, rings, tip } = useMemo(() => {
    const dots = makeSphereDots(count, radius);
    const rgs: Ring[] = RING_PHIS.map((phi, idx) => {
      const theta: number[] = [];
      const spawnTheta: number[] = [];
      const pts: Point3D[] = [];
      const spawn: Point3D[] = [];
      for (let i = 0; i < N; i++) {
        const t = Math.PI + 0.15 + (2 * Math.PI * i) / N;
        const st = Math.PI + 0.25 + i / (N - 1);
        theta.push(t);
        spawnTheta.push(st);
        pts.push(spherePoint(t, phi, radius));
        const s = spherePoint(st, phi, radius);
        spawn.push({
          x: s.x * HOVER_LIFT,
          y: s.y * HOVER_LIFT,
          z: s.z * HOVER_LIFT,
        });
      }
      return { phi, offset: RING_OFFS[idx], theta, spawnTheta, pts, spawn };
    });
    const tp = spherePoint(Math.PI + 2 * Math.PI - 0.12, Math.PI / 2, radius);
    return { sphereDots: dots, rings: rgs, tip: tp };
  }, [count, radius]);
  const dotsPool = useMemo<Dot[]>(() => [], []);
  const halosPool = useMemo<Halo[]>(() => [], []);
  const cmp = useMemo(() => (a: Dot, b: Dot) => a.z - b.z, []);

  const commitPos = (ring: Ring, i: number, tt: number): Point3D => {
    const rep = clamp(
      (tt - REPLAY_START - ring.offset - i * REPLAY_STAGGER) / FLIGHT_DUR,
      0,
      1,
    );
    if (rep >= 1) return ring.pts[i];
    if (rep > 0) {
      const e = easeInOutSine(rep);
      const theta =
        ring.spawnTheta[i] + (ring.theta[i] - ring.spawnTheta[i]) * e;
      const p = spherePoint(theta, ring.phi, radius);
      const lift =
        1 + FLY_LIFT * Math.sin(Math.PI * rep) + (HOVER_LIFT - 1) * (1 - rep);
      return { x: p.x * lift, y: p.y * lift, z: p.z * lift };
    }
    const h = ring.spawn[i];
    return {
      x: h.x,
      y: h.y + Math.sin(tt * 6 + i * 1.7) * 0.02 * radius,
      z: h.z,
    };
  };

  const pointOnRail = (pts2d: Point2D[], f: number): Point2D => {
    let total = 0;
    for (let i = 1; i < pts2d.length; i++) {
      total += Math.hypot(
        pts2d[i].x - pts2d[i - 1].x,
        pts2d[i].y - pts2d[i - 1].y,
      );
    }
    const target = clamp(f, 0, 1) * total;
    let acc = 0;
    for (let i = 1; i < pts2d.length; i++) {
      const seg = Math.hypot(
        pts2d[i].x - pts2d[i - 1].x,
        pts2d[i].y - pts2d[i - 1].y,
      );
      if (acc + seg >= target) {
        const u = seg === 0 ? 0 : (target - acc) / seg;
        return {
          x: pts2d[i - 1].x + (pts2d[i].x - pts2d[i - 1].x) * u,
          y: pts2d[i - 1].y + (pts2d[i].y - pts2d[i - 1].y) * u,
        };
      }
      acc += seg;
    }
    return pts2d[pts2d.length - 1];
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
      ctx.strokeStyle = colorPrefix + ink(0.25).toFixed(3) + ")";
      ctx.lineWidth = 1;
      for (let r = 0; r < rings.length; r++) {
        ctx.beginPath();
        for (let i = 0; i < N; i++) {
          const p = projectP(rings[r].pts[i]);
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        if (r === EQUATOR) {
          const tp = projectP(tip);
          ctx.lineTo(tp.x, tp.y);
        }
        ctx.stroke();
      }
      for (const ring of rings) {
        for (let i = 0; i < N; i++) {
          const p = projectP(ring.pts[i]);
          ctx.fillStyle =
            colorPrefix + ink(0.5 * (p.z > 0 ? 0.35 : 1)).toFixed(3) + ")";
          ctx.beginPath();
          ctx.arc(p.x, p.y, commSize * p.scale, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
      const tp = projectP(tip);
      ctx.fillStyle = colorPrefix + ink(0.8).toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(tp.x, tp.y, commSize * 1.2 * tp.scale, 0, 2 * Math.PI);
      ctx.fill();
      return;
    }

    const cycle = t % DURATION;
    const fills: string[] = [];
    for (let i = 0; i <= 20; i++)
      fills[i] = colorPrefix + ink(i / 20).toFixed(3) + ")";
    const fillFor = (alpha: number) =>
      fills[Math.round(clamp(alpha, 0, 1) * 20)];

    const settling = cycle >= CROSS_START;
    const q = settling ? clamp((cycle - CROSS_START) / CROSS_DUR, 0, 1) : 0;

    const plantPulse =
      cycle >= COMPLETE_START && cycle < CROSS_START
        ? easeOutCubic(
            clamp((cycle - COMPLETE_START) / (PULSE_DUR * 0.5), 0, 1),
          ) * clamp((CROSS_START - cycle) / (PULSE_DUR * 0.5), 0, 1)
        : 0;

    const rings2d: Point2D[][] = rings.map((ring) =>
      ring.pts.map((p) => projectP(p)),
    );
    const tip2d = projectP(tip);
    rings2d[EQUATOR].push({ x: tip2d.x, y: tip2d.y });

    const plantedCount: number[] = [];
    for (let r = 0; r < rings.length; r++) {
      let pc = 0;
      for (let i = 0; i < N; i++) {
        const launch = REPLAY_START + rings[r].offset + i * REPLAY_STAGGER;
        if (clamp((cycle - launch) / FLIGHT_DUR, 0, 1) >= 1) pc++;
      }
      plantedCount.push(pc);
    }

    let lineAlpha = settling ? 0.1 * (1 - q) : 0.1;
    if (!settling && cycle >= COMPLETE_START) {
      lineAlpha += plantPulse * 0.25;
    }
    ctx.strokeStyle = colorPrefix + ink(lineAlpha).toFixed(3) + ")";
    ctx.lineWidth = 1;
    for (let r = 0; r < rings.length; r++) {
      const pc = plantedCount[r];
      if (pc <= 0) continue;
      const endIdx = pc === N ? (r === EQUATOR ? N : N - 1) : pc - 1;
      ctx.beginPath();
      for (let i = 0; i <= endIdx; i++) {
        const p = rings2d[r][i];
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }

    const dots = dotsPool;
    dots.length = 0;
    const halos = halosPool;
    halos.length = 0;

    for (let r = 0; r < rings.length; r++) {
      const ring = rings[r];
      for (let i = 0; i < N; i++) {
        const launch = REPLAY_START + ring.offset + i * REPLAY_STAGGER;
        const rep = clamp((cycle - launch) / FLIGHT_DUR, 0, 1);
        const land = launch + FLIGHT_DUR;
        const landFlash =
          rep >= 1 && !settling ? clamp(1 - (cycle - land) / 0.12, 0, 1) : 0;

        if (settling) {
          if (rep >= 1) {
            const rp = projectP(ring.pts[i]);
            dots.push({
              x: rp.x,
              y: rp.y,
              r: commSize * rp.scale,
              z: rp.z,
              alpha: 0.9 * (1 - q) * (rp.z > 0 ? 0.35 : 1),
            });
          }
          continue;
        }

        const p = projectP(commitPos(ring, i, cycle));
        const flying = rep > 0 && rep < 1;
        const vis = clamp(
          (cycle - (launch - ACTIVATE_LEN)) / ACTIVATE_LEN,
          0,
          1,
        );
        if (vis <= 0) continue;
        if (flying) {
          let prev: Point2D | null = null;
          for (let k = 1; k <= 4; k++) {
            const tt = cycle - k * 0.03;
            const repK = clamp((tt - launch) / FLIGHT_DUR, 0, 1);
            if (repK <= 0 || repK >= 1) break;
            const tp = projectP(commitPos(ring, i, tt));
            if (prev) {
              ctx.strokeStyle =
                colorPrefix + ink(0.18 * (1 - k / 5)).toFixed(3) + ")";
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(prev.x, prev.y);
              ctx.lineTo(tp.x, tp.y);
              ctx.stroke();
            }
            prev = { x: tp.x, y: tp.y };
          }
        }
        const alpha =
          (0.9 * vis + plantPulse * 0.7 * rep + landFlash * 0.5) *
          (p.z > 0 ? 0.35 : 1);
        dots.push({
          x: p.x,
          y: p.y,
          r: commSize * p.scale,
          z: p.z,
          alpha,
        });
        if (flying) {
          halos.push({
            x: p.x,
            y: p.y,
            z: p.z,
            r: commSize * 2.2,
            alpha: 0.16,
          });
        }
        if (landFlash > 0) {
          halos.push({
            x: p.x,
            y: p.y,
            z: p.z,
            r: commSize * 2.6,
            alpha: 0.25 * landFlash,
          });
        }
      }
    }

    const tipVis = settling
      ? 1 - q
      : clamp((cycle - (REPLAY_START - ACTIVATE_LEN)) / ACTIVATE_LEN, 0, 1);
    dots.push({
      x: tip2d.x,
      y: tip2d.y,
      r: commSize * 1.2 * tip2d.scale,
      z: tip2d.z,
      alpha: (0.8 + plantPulse * 0.2) * tipVis * (tip2d.z > 0 ? 0.35 : 1),
    });

    if (!settling && cycle >= COMPLETE_START) {
      const tp = clamp((cycle - COMPLETE_START) / PULSE_DUR, 0, 1);
      for (let r = 0; r < rings.length; r++) {
        const w = pointOnRail(rings2d[r], easeInOutSine(tp));
        dots.push({
          x: w.x,
          y: w.y,
          r: commSize * 1.3,
          z: -100,
          alpha: 0.95,
        });
        halos.push({
          x: w.x,
          y: w.y,
          z: -100,
          r: commSize * 2.4,
          alpha: 0.2,
        });
      }
    }

    for (let i = 0; i < count; i++) {
      const p = projectP(sphereDots[i]);
      dots.push({
        x: p.x,
        y: p.y,
        r: dotSize * p.scale,
        z: p.z,
        alpha: 0.15 * (p.z > 0 ? 0.35 : 1),
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

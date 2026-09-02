"use client";

import { useMemo } from "react";
import { CanvasContainer } from "../canvas/CanvasContainer";
import { fitRadius, makeSphereDots, projectWithTrig } from "../canvas/sphere";
import { clamp } from "../lib/math";
import { useOrbAnimation } from "../canvas/useOrbAnimation";
import type { Dot, Halo } from "../canvas/types";

export interface DnaOrbProps {
  size?: number;
  speed?: number;
  paused?: boolean;
  color?: string;
  "aria-label"?: string;
}

const BASE_SPHERE = 60;
export const PAIRS = 22;
const BACKBONE_RES = 48;
const TURNS = 1.6;
export const TWIST = Math.PI * 2 * TURNS;
const WAVE_PERIOD = 3; // seconds per full backbone pass (up A, down B)
const WAVE_WIDTH = 0.12; // gaussian width of the sequencing wave, in q units
const WAVE_BOOST = 0.45; // peak glow added by the wave
const SPIN = 0.35; // rad/s: slow continuous helix twist
const BACK_LINE = 0.45; // depth dim for segments behind the axis
const BACK_DOT = 0.35; // depth dim for dots behind the axis

interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  z: number;
  alpha: number;
  width: number;
}

export function helixPoint(
  tNorm: number,
  phase: number,
  helixR: number,
  helixH: number,
) {
  const y = -helixH / 2 + tNorm * helixH;
  const ang = tNorm * TWIST + phase;
  return { x: helixR * Math.cos(ang), y, z: helixR * Math.sin(ang) };
}

export function DnaOrb({
  size = 64,
  speed = 1,
  paused = false,
  color,
  "aria-label": ariaLabel = "Sequencing",
}: DnaOrbProps) {
  const count = Math.max(8, Math.round((BASE_SPHERE * size) / 64));
  const radius = fitRadius(size);
  const cx = size / 2;
  const cy = size / 2;
  const unit = size / 64;
  const dotSize = 1.7 * unit;
  const baseHelixR = radius * 0.38;
  const helixH = radius * 1.5;

  const sphereDots = useMemo(
    () => makeSphereDots(count, radius),
    [count, radius],
  );
  const dotsPool = useMemo<Dot[]>(() => [], []);
  const segPool = useMemo<Segment[]>(() => [], []);
  const halosPool = useMemo<Halo[]>(() => [], []);
  const cmp = useMemo(
    () => (a: { z: number }, b: { z: number }) => a.z - b.z,
    [],
  );

  const render = (
    ctx: CanvasRenderingContext2D,
    t: number,
    reduced: boolean,
    colorPrefix: string,
    ink: (a: number) => number,
  ) => {
    const tiltX = 0.06;
    const tiltY = reduced ? 0.08 : t * SPIN;
    const cosX = Math.cos(tiltX);
    const sinX = Math.sin(tiltX);
    const cosY = Math.cos(tiltY);
    const sinY = Math.sin(tiltY);
    ctx.clearRect(0, 0, size, size);

    const fills: string[] = [];
    for (let i = 0; i <= 64; i++)
      fills[i] = colorPrefix + ink(i / 64).toFixed(3) + ")";
    const fillFor = (a: number) => fills[Math.round(clamp(a, 0, 1) * 64)];
    const project = (p: { x: number; y: number; z: number }) =>
      projectWithTrig(p, cx, cy, cosX, sinX, cosY, sinY);

    const paint = (dots: Dot[], segs: Segment[], halos: Halo[]) => {
      dots.sort(cmp);
      segs.sort(cmp);
      halos.sort(cmp);
      let i = 0;
      let j = 0;
      let k = 0;
      while (i < dots.length || j < segs.length || k < halos.length) {
        const d = dots[i];
        const s = segs[j];
        const h = halos[k];
        const dz = d ? d.z : Infinity;
        const sz = s ? s.z : Infinity;
        const hz = h ? h.z : Infinity;
        if (dz <= sz && dz <= hz) {
          if (d.alpha > 0.003) {
            ctx.fillStyle = fillFor(d.alpha);
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.r, 0, 2 * Math.PI);
            ctx.fill();
          }
          i++;
        } else if (sz <= hz) {
          if (s.alpha > 0.003) {
            ctx.strokeStyle = colorPrefix + ink(s.alpha).toFixed(3) + ")";
            ctx.lineWidth = s.width;
            ctx.beginPath();
            ctx.moveTo(s.x1, s.y1);
            ctx.lineTo(s.x2, s.y2);
            ctx.stroke();
          }
          j++;
        } else {
          if (h.alpha > 0.003) {
            ctx.fillStyle = fillFor(h.alpha);
            ctx.beginPath();
            ctx.arc(h.x, h.y, h.r, 0, 2 * Math.PI);
            ctx.fill();
          }
          k++;
        }
      }
    };

    // anchors removed: fully invisible

    // Shared scene builder: one geometry path for reduced-motion and animated
    // rendering. waveH is the wave head's position on the circular backbone
    // path (0 = bottom of strand A, 1 = top, 2 = bottom of strand B); null
    // renders the static base state.
    const glowW2 = WAVE_WIDTH * WAVE_WIDTH;
    const helixR = baseHelixR * (1 + Math.sin(t * 1.2) * 0.04);

    const build = (waveH: number | null) => {
      let di = 0;
      let si = 0;
      let hi = 0;
      const pushDot = (
        x: number,
        y: number,
        r: number,
        z: number,
        alpha: number,
      ) => {
        const o = dotsPool[di] ?? (dotsPool[di] = {} as Dot);
        o.x = x;
        o.y = y;
        o.r = r;
        o.z = z;
        o.alpha = alpha;
        di++;
      };
      const pushSeg = (
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        z: number,
        alpha: number,
        width: number,
      ) => {
        const o = segPool[si] ?? (segPool[si] = {} as Segment);
        o.x1 = x1;
        o.y1 = y1;
        o.x2 = x2;
        o.y2 = y2;
        o.z = z;
        o.alpha = alpha;
        o.width = width;
        si++;
      };
      const pushHalo = (
        x: number,
        y: number,
        z: number,
        r: number,
        alpha: number,
      ) => {
        const o = halosPool[hi] ?? (halosPool[hi] = {} as Halo);
        o.x = x;
        o.y = y;
        o.z = z;
        o.r = r;
        o.alpha = alpha;
        hi++;
      };

      for (const dot of sphereDots) {
        const p = project(dot);
        pushDot(
          p.x,
          p.y,
          dotSize * p.scale,
          p.z,
          0.12 * (p.z > 0 ? BACK_DOT : 1),
        );
      }

      for (let strand = 0; strand < 2; strand++) {
        const phase = strand === 0 ? 0 : Math.PI;
        let prevP = project(helixPoint(0, phase, helixR, helixH));
        for (let i = 1; i <= BACKBONE_RES; i++) {
          const tNorm = i / BACKBONE_RES;
          const p = project(helixPoint(tNorm, phase, helixR, helixH));
          let lit = 0;
          if (waveH !== null) {
            // q wraps the backbone into a circle: up A, down B, across the base
            const q = strand === 0 ? tNorm : 2 - tNorm;
            let d = Math.abs(q - waveH);
            d = Math.min(d, 2 - d);
            lit = Math.exp(-(d * d) / glowW2) * WAVE_BOOST;
          }
          const midZ = (prevP.z + p.z) / 2;
          pushSeg(
            prevP.x,
            prevP.y,
            p.x,
            p.y,
            midZ,
            (0.5 + lit * 0.55) * (midZ > 0 ? BACK_LINE : 1),
            1.1 * unit,
          );
          prevP = p;
        }
      }

      for (let i = 1; i < PAIRS - 1; i++) {
        const tNorm = i / (PAIRS - 1);
        let lit = 0;
        if (waveH !== null) {
          // a rung lights when the wave passes either of its attachments
          let dA = Math.abs(tNorm - waveH);
          dA = Math.min(dA, 2 - dA);
          let dB = Math.abs(2 - tNorm - waveH);
          dB = Math.min(dB, 2 - dB);
          lit = Math.exp(-(Math.min(dA, dB) ** 2) / glowW2) * WAVE_BOOST;
        }
        const a = helixPoint(tNorm, 0, helixR, helixH);
        const b = helixPoint(tNorm, Math.PI, helixR, helixH);
        const pa = project(a);
        const pb = project(b);
        const midZ = (a.z + b.z) / 2;
        pushSeg(
          pa.x,
          pa.y,
          pb.x,
          pb.y,
          midZ,
          (0.25 + lit * 0.55) * (midZ > 0 ? BACK_LINE : 1),
          unit,
        );
        if (lit > 0.18)
          pushHalo(
            (pa.x + pb.x) / 2,
            (pa.y + pb.y) / 2,
            midZ,
            dotSize * 2.2 * (1 + lit * 0.3),
            0.14 * lit,
          );
        const rScale = 1 + lit * 0.18;
        pushDot(
          pa.x,
          pa.y,
          dotSize * rScale * pa.scale,
          pa.z,
          Math.min(1, (0.8 + lit * 0.2) * (pa.z > 0 ? BACK_DOT : 1)),
        );
        pushDot(
          pb.x,
          pb.y,
          dotSize * rScale * pb.scale,
          pb.z,
          Math.min(1, (0.8 + lit * 0.2) * (pb.z > 0 ? BACK_DOT : 1)),
        );
      }
      dotsPool.length = di;
      segPool.length = si;
      halosPool.length = hi;
    };

    if (reduced) build(null);
    else build(((t % WAVE_PERIOD) / WAVE_PERIOD) * 2);

    paint(dotsPool, segPool, halosPool);
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

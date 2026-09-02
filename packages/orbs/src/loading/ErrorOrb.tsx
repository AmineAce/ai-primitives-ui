"use client";

import { useMemo } from "react";
import { CanvasContainer } from "../canvas/CanvasContainer";
import { easeOutCubic, easeOutExpo } from "../canvas/easing";
import { fitRadius, makeSphereDots, projectWithTrig } from "../canvas/sphere";
import { clamp } from "../lib/math";
import { useOrbAnimation } from "../canvas/useOrbAnimation";
import { mulberry32 } from "../canvas/random";
import type { Dot } from "../canvas/types";

export interface ErrorOrbProps {
  size?: number;
  speed?: number;
  paused?: boolean;
  color?: string;
  "aria-label"?: string;
}

const DURATION = 4.0;
const BASE_SPHERE = 80;
const RUN_END = 0.6;
const GLITCH_START = 0.6;
const GLITCH_DUR = 0.24;
const HOLD_GLITCH_END = 2.3;
const EXCLAM_START = 2.28;
const EXCLAM_DUR = 0.32;
const HOLD_EXCLAM_END = 3.32;

export function ErrorOrb({
  size = 64,
  speed = 1,
  paused = false,
  color,
  "aria-label": ariaLabel = "Failed",
}: ErrorOrbProps) {
  const count = Math.max(8, Math.round((BASE_SPHERE * size) / 64));
  const radius = fitRadius(size);
  const cx = size / 2;
  const cy = size / 2;
  const unit = size / 64;
  const dotSize = 1.9 * unit;

  const { sphereDots, jitter } = useMemo(() => {
    const dots = makeSphereDots(count, radius);
    const rand = mulberry32(20260910);
    const j: { dx: number; dy: number }[] = [];
    for (let i = 0; i < count; i++) {
      const ang = rand() * 2 * Math.PI;
      const mag = (0.38 + rand() * 0.22) * unit;
      j.push({ dx: Math.cos(ang) * mag, dy: Math.sin(ang) * mag });
    }
    return { sphereDots: dots, jitter: j };
  }, [count, radius, unit]);

  const dotsPool = useMemo<Dot[]>(() => [], []);
  const cmp = useMemo(() => (a: Dot, b: Dot) => a.z - b.z, []);

  const render = (
    ctx: CanvasRenderingContext2D,
    t: number,
    reduced: boolean,
    colorPrefix: string,
    ink: (a: number) => number,
  ) => {
    const fills: string[] = [];
    for (let i = 0; i <= 20; i++)
      fills[i] = colorPrefix + ink(i / 20).toFixed(3) + ")";
    const fillFor = (a: number) => fills[Math.round(clamp(a, 0, 1) * 20)];

    const tiltX = 0.3;
    const baseTiltY = reduced ? 0.12 : t * 0.06;
    let tiltY = baseTiltY;
    let glitchBase = 0;
    let exclamEase = 0;

    if (!reduced) {
      const cycle = t % DURATION;
      if (cycle < RUN_END) {
        tiltY = t * 0.06;
        glitchBase = 0;
        exclamEase = 0;
      } else if (cycle < GLITCH_START + GLITCH_DUR) {
        const p = clamp((cycle - GLITCH_START) / GLITCH_DUR, 0, 1);
        const e1 = easeOutExpo(clamp(p / 0.52, 0, 1));
        const e2 = p > 0.52 ? easeOutExpo(clamp((p - 0.52) / 0.48, 0, 1)) : 0;
        glitchBase = e1 * 0.62 + e2 * 0.38;
        tiltY = 0.08;
      } else if (cycle < HOLD_GLITCH_END) {
        glitchBase = 1;
        tiltY = 0.08;
      } else if (cycle < EXCLAM_START + EXCLAM_DUR) {
        glitchBase = 1;
        exclamEase = easeOutCubic(
          clamp((cycle - EXCLAM_START) / EXCLAM_DUR, 0, 1),
        );
        tiltY = 0.08;
      } else if (cycle < HOLD_EXCLAM_END) {
        glitchBase = 1;
        exclamEase = 1;
        tiltY = 0.08;
      } else {
        const p = clamp(
          (cycle - HOLD_EXCLAM_END) / (DURATION - HOLD_EXCLAM_END),
          0,
          1,
        );
        const e = easeOutCubic(p);
        glitchBase = 1 - e;
        exclamEase = 1 - e;
        tiltY = 0.08 * (1 - e) + baseTiltY * e;
      }
    } else {
      glitchBase = 1;
      exclamEase = 1;
      tiltY = 0.12;
    }

    const cosX = Math.cos(tiltX);
    const sinX = Math.sin(tiltX);
    const cosY = Math.cos(tiltY);
    const sinY = Math.sin(tiltY);
    ctx.clearRect(0, 0, size, size);

    if (reduced) {
      for (let i = 0; i < sphereDots.length; i++) {
        const p = projectWithTrig(
          sphereDots[i],
          cx,
          cy,
          cosX,
          sinX,
          cosY,
          sinY,
        );
        const j = jitter[i];
        const inSlice = i % 7 < 2;
        const off = inSlice ? 2.2 * unit : 0;
        const x = p.x + j.dx + off;
        const y = p.y + j.dy;
        ctx.fillStyle =
          colorPrefix + ink(0.09 * (p.z > 0 ? 0.35 : 1)).toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(x, y, dotSize * p.scale, 0, 2 * Math.PI);
        ctx.fill();
      }
      ctx.strokeStyle = colorPrefix + ink(0.12).toFixed(3) + ")";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.92, 0, 2 * Math.PI);
      ctx.stroke();
      const stemH = 8 * unit;
      const stemW = 1.6 * unit;
      const dotR = 1.35 * unit;
      ctx.fillStyle = colorPrefix + ink(0.82).toFixed(3) + ")";
      ctx.fillRect(cx - stemW / 2, cy - stemH * 0.72, stemW, stemH);
      ctx.beginPath();
      ctx.arc(cx, cy + stemH * 0.42, dotR, 0, 2 * Math.PI);
      ctx.fill();
      return;
    }

    const cycle = t % DURATION;
    const dots = dotsPool;
    dots.length = 0;

    const isGlitching = glitchBase > 0.04;
    const flicker = isGlitching
      ? 0.72 + 0.28 * Math.sin(t * 38.2) * Math.cos(t * 19.7)
      : 1;
    const glitch = glitchBase * clamp(flicker, 0.45, 1.35);

    // digital slice params: time-varying
    const tSeed = t * 22.3;
    const sliceCount = 4;
    const slices: { y: number; h: number; off: number }[] = [];
    for (let s = 0; s < sliceCount; s++) {
      const y = cy + Math.sin(tSeed * 0.31 + s * 1.17) * radius * 0.62;
      const h = (1.6 + Math.abs(Math.sin(tSeed * 0.47 + s * 2.1)) * 1.4) * unit;
      const off =
        Math.sin(tSeed * 0.83 + s * 1.9) * 3.2 * unit +
        Math.cos(tSeed * 1.11 + s) * 1.1 * unit;
      slices.push({ y, h, off });
    }

    for (let i = 0; i < sphereDots.length; i++) {
      const p = projectWithTrig(sphereDots[i], cx, cy, cosX, sinX, cosY, sinY);
      const j = jitter[i];
      let x = p.x + j.dx * glitch;
      let y = p.y + j.dy * glitch;
      if (isGlitching) {
        for (const sl of slices) {
          if (y > sl.y - sl.h / 2 && y < sl.y + sl.h / 2) {
            x += sl.off * glitch * 0.88;
            // block dropout: faint alpha for some in slice
            break;
          }
        }
        // vertical tear jitter every ~6 frames
        if (Math.floor(t * 28) % 7 === i % 7)
          y += Math.sin(t * 61 + i) * 0.9 * unit * glitch;
      }
      const base = 0.11 * (p.z > 0 ? 0.35 : 1);
      const boosted = base + 0.16 * glitch * (p.z > 0 ? 0.35 : 1);
      const dropout =
        isGlitching && i % 13 === Math.floor(t * 18) % 13 ? 0.35 : 1;
      const exclamDim = exclamEase > 0.5 ? 0.84 : 1;
      dots.push({
        x,
        y,
        r: dotSize * p.scale,
        z: p.z,
        alpha: boosted * dropout * exclamDim,
      });
    }

    // ring: stutters with glitch, not smooth
    const ringBase = radius * 0.92;
    const ringJitter = glitch * 0.9 * unit * Math.sin(t * 44);
    const ringAlpha = (() => {
      if (cycle < RUN_END) return 0.08;
      if (glitchBase > 0.04 && glitchBase < 0.98)
        return 0.13 + 0.07 * Math.abs(Math.sin(t * 31));
      if (cycle < HOLD_EXCLAM_END) return 0.11 + 0.03 * Math.sin(t * 9);
      const p = clamp(
        (cycle - HOLD_EXCLAM_END) / (DURATION - HOLD_EXCLAM_END),
        0,
        1,
      );
      return 0.11 * (1 - easeOutCubic(p) * 0.32);
    })();

    ctx.strokeStyle = colorPrefix + ink(ringAlpha).toFixed(3) + ")";
    ctx.lineWidth = 1;
    if (glitch > 0.12) {
      ctx.beginPath();
      ctx.arc(
        cx + ringJitter * 0.6,
        cy - ringJitter * 0.35,
        ringBase,
        0,
        2 * Math.PI,
      );
      ctx.stroke();
      ctx.strokeStyle = colorPrefix + ink(ringAlpha * 0.48).toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(
        cx - ringJitter * 0.45,
        cy + ringJitter * 0.28,
        ringBase,
        0,
        2 * Math.PI,
      );
      ctx.stroke();
      // scanlines during glitch
      const scanA = 0.13 * glitch;
      ctx.strokeStyle = colorPrefix + ink(scanA).toFixed(3) + ")";
      ctx.lineWidth = 1;
      for (const sl of slices) {
        if (Math.abs(sl.off) < 0.6 * unit) continue;
        ctx.beginPath();
        ctx.moveTo(cx - radius * 0.74, sl.y);
        ctx.lineTo(cx + radius * 0.74, sl.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - radius * 0.74, sl.y + sl.h * 0.42);
        ctx.lineTo(cx + radius * 0.74, sl.y + sl.h * 0.42);
        ctx.stroke();
      }
    } else {
      ctx.beginPath();
      ctx.arc(cx, cy, ringBase, 0, 2 * Math.PI);
      ctx.stroke();
    }

    dots.sort(cmp);
    for (const d of dots) {
      if (d.alpha <= 0.003) continue;
      ctx.fillStyle = fillFor(d.alpha);
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, 2 * Math.PI);
      ctx.fill();
    }

    if (exclamEase > 0.004) {
      const rawA = 0.84 * easeOutCubic(clamp(exclamEase / 0.62, 0, 1));
      const cycle = t % DURATION;
      const isOut = cycle >= HOLD_EXCLAM_END;
      const outP = isOut
        ? clamp((cycle - HOLD_EXCLAM_END) / (DURATION - HOLD_EXCLAM_END), 0, 1)
        : 0;
      const glitchIn = exclamEase < 0.96 && !isOut ? 1 - exclamEase : 0;
      const glitchOut = isOut ? outP : 0;
      const glitchAmt = Math.max(glitchIn, glitchOut);
      const revealOff = glitchAmt * 2.6 * unit * Math.sin(t * 41);
      const gOff = glitch * 0.5 * unit * Math.sin(t * 37) + revealOff * 0.5;
      const flickerA =
        glitchAmt > 0.04 ? 0.58 + 0.42 * (Math.sin(t * 52) > 0 ? 1 : 0.68) : 1;
      const a = rawA * flickerA * (isOut ? 1 - outP * 0.12 : 1);
      if (a > 0.005) {
        ctx.fillStyle = colorPrefix + ink(a).toFixed(3) + ")";
        const stemH = 8.4 * unit;
        const stemW = 1.6 * unit;
        const dotR = 1.32 * unit;
        const stemTop = cy - 5.6 * unit;
        const dotY = stemTop + stemH + 1.8 * unit + dotR;
        const sliceOff1 =
          glitchAmt > 0.04 ? Math.sin(t * 47) * 2.0 * unit * glitchAmt : 0;
        const sliceOff2 =
          glitchAmt > 0.04 ? Math.cos(t * 39) * 1.4 * unit * glitchAmt : 0;
        const sliceOff3 =
          glitchAmt > 0.04 ? Math.sin(t * 53) * 1.1 * unit * glitchAmt : 0;
        ctx.fillRect(
          cx + gOff * 0.35 + sliceOff1 - stemW / 2,
          stemTop,
          stemW,
          stemH * 0.38,
        );
        ctx.fillRect(
          cx + gOff * 0.35 + sliceOff2 - stemW / 2,
          stemTop + stemH * 0.38,
          stemW,
          stemH * 0.32,
        );
        ctx.fillRect(
          cx + gOff * 0.35 + sliceOff3 - stemW / 2,
          stemTop + stemH * 0.7,
          stemW,
          stemH * 0.3,
        );
        ctx.beginPath();
        ctx.arc(
          cx + gOff * 0.32 + sliceOff1 * 0.45,
          dotY,
          dotR,
          0,
          2 * Math.PI,
        );
        ctx.fill();
      }
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

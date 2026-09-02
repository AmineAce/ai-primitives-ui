"use client";

import { useMemo } from "react";
import { CanvasContainer } from "../canvas/CanvasContainer";
import { easeOutBack, easeOutCubic, easeOutExpo } from "../canvas/easing";
import { fitRadius, makeSphereDots, projectWithTrig } from "../canvas/sphere";
import { clamp } from "../lib/math";
import { useOrbAnimation } from "../canvas/useOrbAnimation";
import type { Dot, Halo } from "../canvas/types";

export interface DownloadOrbProps {
  size?: number;
  speed?: number;
  paused?: boolean;
  color?: string;
  "aria-label"?: string;
}

const DURATION = 5.2;
const BASE_SPHERE = 80;
const COLS = 4;
const ROWS = 6;
const FRAGMENTS = 3 + (ROWS - 1) * COLS;
const APPEAR_START = 0.45;
const APPEAR_WINDOW = 1.35;
const APPEAR_DUR = 0.42;
const BORDER_START = 1.9;
const BORDER_DUR = 0.58;
const FOLD_START = 2.6;
const FOLD_DUR = 0.38;
const LINES_START = 2.7;
const SEAL_START = 3.65;
const SEAL_DUR = 0.42;
const HOLD_END = 5.0;

export function DownloadOrb({
  size = 64,
  speed = 1,
  paused = false,
  color,
  "aria-label": ariaLabel = "Generating file",
}: DownloadOrbProps) {
  const count = Math.max(8, Math.round((BASE_SPHERE * size) / 64));
  const radius = fitRadius(size);
  const cx = size / 2;
  const cy = size / 2;
  const unit = size / 64;
  const dotSize = 1.9 * unit;
  const fragSize = 1.55 * unit;
  const w = radius * 1.18;
  const h = radius * 1.52;
  const fold = w * 0.24;
  const r = 2.4 * unit;

  const { sphereDots, fragTargets, appearTimes } = useMemo(() => {
    const dots = makeSphereDots(count, radius);
    const targets: { x: number; y: number }[] = [];
    const times: number[] = [];
    const left = cx - w / 2 + 3 * unit;
    const rightFull = cx + w / 2 - 3 * unit;
    const foldX = cx + w / 2 - fold;
    const top = cy - h / 2 + 5 * unit;
    const cellH = (h - 10 * unit) / ROWS;
    let idx = 0;
    for (let row = 0; row < ROWS; row++) {
      const isTopRow = row === 0;
      const colsForRow = isTopRow ? 3 : COLS;
      const rightForRow = isTopRow ? foldX - 2.2 * unit : rightFull;
      const widthForRow = rightForRow - left;
      const cellWForRow = widthForRow / colsForRow;
      for (let col = 0; col < colsForRow; col++) {
        const tx = left + (col + 0.5) * cellWForRow;
        const ty = top + (row + 0.5) * cellH;
        targets.push({ x: tx, y: ty });
        const t = idx / (FRAGMENTS - 1);
        times.push(APPEAR_START + t * APPEAR_WINDOW);
        idx++;
      }
    }
    return { sphereDots: dots, fragTargets: targets, appearTimes: times };
  }, [count, radius, cx, cy, w, h, fold]);

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
    const tiltX = 0.3;
    const tiltY = reduced ? 0.12 : t * 0.06;
    const cosX = Math.cos(tiltX);
    const sinX = Math.sin(tiltX);
    const cosY = Math.cos(tiltY);
    const sinY = Math.sin(tiltY);
    ctx.clearRect(0, 0, size, size);

    const fills: string[] = [];
    for (let i = 0; i <= 20; i++)
      fills[i] = colorPrefix + ink(i / 20).toFixed(3) + ")";
    const fillFor = (a: number) => fills[Math.round(clamp(a, 0, 1) * 20)];

    const filePath = (bobY: number) => {
      const left = cx - w / 2;
      const top = cy - h / 2 + bobY;
      const right = cx + w / 2;
      const bottom = cy + h / 2 + bobY;
      const foldX = right - fold;
      const foldY = top + fold;
      ctx.beginPath();
      ctx.moveTo(left + r, top);
      ctx.lineTo(foldX, top);
      ctx.lineTo(right, foldY);
      ctx.lineTo(right, bottom - r);
      ctx.arcTo(right, bottom, left, bottom, r);
      ctx.arcTo(left, bottom, left, top, r);
      ctx.arcTo(left, top, right, top, r);
      ctx.closePath();
      return { left, top, right, bottom, foldX, foldY };
    };

    const drawFileShell = (
      fillA: number,
      strokeA: number,
      foldA: number,
      foldScale: number,
      bobY: number,
      shadowA: number,
    ) => {
      const { left, top, right, bottom, foldX, foldY } = filePath(bobY);
      if (shadowA > 0.004) {
        ctx.fillStyle = colorPrefix + ink(shadowA).toFixed(3) + ")";
        ctx.beginPath();
        ctx.moveTo(left + r, top + 1.8 * unit);
        ctx.lineTo(foldX, top + 1.8 * unit);
        ctx.lineTo(right, foldY + 1.8 * unit);
        ctx.lineTo(right, bottom - r + 1.8 * unit);
        ctx.arcTo(right, bottom + 1.8 * unit, left, bottom + 1.8 * unit, r);
        ctx.arcTo(left, bottom + 1.8 * unit, left, top + 1.8 * unit, r);
        ctx.arcTo(left, top + 1.8 * unit, right, top + 1.8 * unit, r);
        ctx.closePath();
        ctx.fill();
      }
      if (fillA > 0.004) {
        ctx.fillStyle = colorPrefix + ink(fillA).toFixed(3) + ")";
        filePath(bobY);
        ctx.fill();
      }
      if (strokeA > 0.004) {
        ctx.strokeStyle = colorPrefix + ink(strokeA).toFixed(3) + ")";
        ctx.lineWidth = 1;
        filePath(bobY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(foldX, top);
        ctx.lineTo(foldX, foldY);
        ctx.lineTo(right, foldY);
        ctx.stroke();
        if (foldScale > 0.004) {
          const fx = foldX + fold * (1 - foldScale) * 0.55;
          const fy = foldY - fold * (1 - foldScale) * 0.55;
          // crease shadow
          ctx.strokeStyle =
            colorPrefix + ink(0.07 * foldScale).toFixed(3) + ")";
          ctx.beginPath();
          ctx.moveTo(fx, top);
          ctx.lineTo(fx, fy);
          ctx.lineTo(right, fy);
          ctx.stroke();
          ctx.fillStyle = colorPrefix + ink(foldA * foldScale).toFixed(3) + ")";
          ctx.beginPath();
          ctx.moveTo(fx, top);
          ctx.lineTo(right, top);
          ctx.lineTo(right, fy);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle =
            colorPrefix +
            ink(clamp(foldA * 1.35, 0, 0.9) * foldScale).toFixed(3) +
            ")";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(fx, top);
          ctx.lineTo(right, fy);
          ctx.stroke();
        }
      }
    };

    if (reduced) {
      for (const dot of sphereDots) {
        const p = projectWithTrig(dot, cx, cy, cosX, sinX, cosY, sinY);
        ctx.fillStyle =
          colorPrefix + ink(0.11 * (p.z > 0 ? 0.35 : 1)).toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(p.x, p.y, dotSize * p.scale, 0, 2 * Math.PI);
        ctx.fill();
      }
      drawFileShell(0.1, 0.32, 0.07, 1, 0, 0.05);
      for (let i = 0; i < fragTargets.length; i++) {
        const e = fragTargets[i];
        ctx.fillStyle = colorPrefix + ink(0.18).toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(e.x, e.y, fragSize * 0.92, 0, 2 * Math.PI);
        ctx.fill();
      }
      return;
    }

    const cycle = t % DURATION;
    const dots = dotsPool;
    dots.length = 0;
    const halos = halosPool;
    halos.length = 0;

    const resetFade =
      cycle >= HOLD_END
        ? easeOutCubic(clamp((cycle - HOLD_END) / (DURATION - HOLD_END), 0, 1))
        : 0;
    const bobY =
      cycle >= SEAL_START && cycle < HOLD_END
        ? Math.sin(cycle * 1.25) * 0.22 * unit
        : 0;

    const latAlphas = [0.045, 0.03];
    const latPhis = [0.42, -0.42];
    latPhis.forEach((phi, idx) => {
      const a = latAlphas[idx] * (1 - resetFade);
      if (a <= 0.004) return;
      ctx.strokeStyle = colorPrefix + ink(a).toFixed(3) + ")";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let s = 0; s <= 48; s++) {
        const th = (s / 48) * 2 * Math.PI;
        const rr = radius * Math.cos(phi);
        const yy = radius * Math.sin(phi);
        const p = projectWithTrig(
          { x: rr * Math.cos(th), y: yy, z: rr * Math.sin(th) },
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
    });

    for (const dot of sphereDots) {
      const p = projectWithTrig(dot, cx, cy, cosX, sinX, cosY, sinY);
      dots.push({
        x: p.x,
        y: p.y,
        r: dotSize * p.scale,
        z: p.z,
        alpha: 0.11 * (1 - resetFade * 0.5) * (p.z > 0 ? 0.35 : 1),
      });
    }

    let landed = 0;
    const fragDots: Dot[] = [];
    const fragHalos: Halo[] = [];

    for (let i = 0; i < fragTargets.length; i++) {
      const appear = appearTimes[i];
      const tIn = cycle - appear;
      if (tIn <= 0) continue;
      if (tIn < APPEAR_DUR) {
        const p = clamp(tIn / APPEAR_DUR, 0, 1);
        const eased = easeOutExpo(p);
        const back = easeOutBack(p);
        const yLift = (1 - eased) * 4.2 * unit;
        const scale = 1 + 0.36 * (1 - back);
        const alpha =
          easeOutCubic(clamp(p / 0.28, 0, 1)) * 0.92 * (1 - resetFade);
        const e = fragTargets[i];
        fragDots.push({
          x: e.x,
          y: e.y - yLift + bobY,
          r: fragSize * scale,
          z: -5,
          alpha,
        });
        if (p > 0.12 && p < 0.88) {
          fragHalos.push({
            x: e.x,
            y: e.y - yLift * 0.5 + bobY,
            z: -5,
            r: fragSize * 2.1,
            alpha: 0.06 * (1 - p),
          });
        }
      } else {
        landed++;
        const e = fragTargets[i];
        fragDots.push({
          x: e.x,
          y: e.y + bobY,
          r: fragSize * 0.96,
          z: -5,
          alpha: 0.82 * (1 - resetFade * 0.7),
        });
      }
    }

    const progress = landed / fragTargets.length;
    const borderP = clamp((cycle - BORDER_START) / BORDER_DUR, 0, 1);
    const borderEase = easeOutCubic(borderP);
    const foldP = clamp((cycle - FOLD_START) / FOLD_DUR, 0, 1);
    const foldEase = easeOutCubic(foldP);
    const sealP = clamp((cycle - SEAL_START) / SEAL_DUR, 0, 1);
    const sealEase = easeOutCubic(sealP);
    const sealActive = cycle >= SEAL_START && cycle < SEAL_START + SEAL_DUR;
    const holdActive = cycle >= SEAL_START + SEAL_DUR && cycle < HOLD_END;

    let fillA = 0.05 + borderEase * 0.14 + progress * 0.06;
    let strokeA = 0.07 + borderEase * 0.26 + foldEase * 0.06;
    let foldA = foldEase * 0.15;
    let shadowA = 0.04 + borderEase * 0.05;
    if (sealActive) {
      fillA += 0.06 * sealEase;
      strokeA += 0.07 * sealEase;
      foldA += 0.05 * sealEase;
    } else if (holdActive) {
      fillA += 0.045;
      strokeA += 0.045;
      foldA += 0.02;
    }
    fillA = clamp(fillA, 0, 0.68) * (1 - resetFade * 0.88);
    strokeA = clamp(strokeA, 0, 0.9) * (1 - resetFade);
    foldA = clamp(foldA, 0, 0.5) * (1 - resetFade);
    shadowA = clamp(shadowA, 0, 0.12) * (1 - resetFade);

    if (sealActive || holdActive) {
      const pulse = sealActive ? sealEase : 1;
      const breathe = 0.5 + 0.5 * Math.sin(cycle * 1.7);
      halos.push({
        x: cx,
        y: cy + bobY,
        z: 5,
        r: Math.max(w, h) * 0.6 * (1 + pulse * 0.1),
        alpha:
          (sealActive ? 0.062 * (1 - sealP) : 0.034 + breathe * 0.01) *
          (1 - resetFade),
      });
    }

    drawFileShell(fillA, strokeA, foldA, foldEase, bobY, shadowA);

    if (cycle >= LINES_START) {
      const lineCount = 3;
      for (let li = 0; li < lineCount; li++) {
        const lp = clamp((cycle - (LINES_START + li * 0.14)) / 0.42, 0, 1);
        if (lp <= 0) continue;
        const a = easeOutCubic(lp) * 0.14 * (1 - resetFade);
        if (a <= 0.005) continue;
        ctx.strokeStyle = colorPrefix + ink(a).toFixed(3) + ")";
        ctx.lineWidth = 1;
        const y = cy - h * 0.02 + li * 3.6 * unit + bobY;
        const x1 = cx - w * 0.34;
        const x2 = cx + w * 0.26 - (li === 2 ? 10 * unit : 0);
        const cur = x1 + (x2 - x1) * easeOutCubic(lp);
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(cur, y);
        ctx.stroke();
        if (li < 2 && lp > 0.6) {
          const subA = ((lp - 0.6) / 0.4) * 0.065 * (1 - resetFade);
          ctx.strokeStyle = colorPrefix + ink(subA).toFixed(3) + ")";
          ctx.beginPath();
          ctx.moveTo(x1, y + 1.7 * unit);
          ctx.lineTo(
            x1 + (x2 - x1) * 0.62 * easeOutCubic(clamp((lp - 0.6) / 0.4, 0, 1)),
            y + 1.7 * unit,
          );
          ctx.stroke();
        }
      }
    }

    if (sealActive) {
      const ringR = Math.max(w, h) * 0.56 * sealEase;
      const a1 = 0.16 * (1 - sealP);
      ctx.strokeStyle = colorPrefix + ink(a1).toFixed(3) + ")";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy + bobY, ringR, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.fillStyle = colorPrefix + ink(0.05 * (1 - sealP)).toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(cx, cy + bobY, ringR * 0.62, 0, 2 * Math.PI);
      ctx.fill();
    }

    ctx.save();
    filePath(bobY);
    ctx.clip();
    if (progress < 0.96) {
      const grainA = 0.016 * (1 - resetFade) * (1 - progress * 0.5);
      if (grainA > 0.004) {
        ctx.fillStyle = colorPrefix + ink(grainA).toFixed(3) + ")";
        for (let i = 0; i < fragTargets.length; i++) {
          const e = fragTargets[i];
          if (cycle - appearTimes[i] <= 0) {
            ctx.beginPath();
            ctx.arc(e.x, e.y + bobY, fragSize * 0.4, 0, 2 * Math.PI);
            ctx.fill();
          }
        }
      }
    }
    for (const d of fragDots) {
      ctx.fillStyle = fillFor(d.alpha * 0.96);
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, 2 * Math.PI);
      ctx.fill();
    }
    for (const h of fragHalos) {
      ctx.fillStyle = fillFor(h.alpha);
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.r, 0, 2 * Math.PI);
      ctx.fill();
    }
    ctx.restore();

    dots.sort(cmp);
    for (const d of dots) {
      if (d.alpha <= 0.003) continue;
      ctx.fillStyle = fillFor(d.alpha * (d.z > 0 ? 0.35 : 1));
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, 2 * Math.PI);
      ctx.fill();
    }
    for (const hh of halos) {
      if (hh.alpha <= 0.004) continue;
      ctx.fillStyle = fillFor(hh.alpha);
      ctx.beginPath();
      ctx.arc(hh.x, hh.y, hh.r, 0, 2 * Math.PI);
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

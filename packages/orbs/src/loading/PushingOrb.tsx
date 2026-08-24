"use client";

import { CanvasContainer } from "../canvas/CanvasContainer";
import { easeOutCubic } from "../canvas/easing";
import {
  fitRadius,
  makeSphereDots,
  project,
  type Point3D,
} from "../canvas/sphere";
import { clamp } from "../lib/math";
import { useOrbAnimation } from "../canvas/useOrbAnimation";
import { mulberry32 } from "../canvas/random";
import type { Dot, Halo } from "../canvas/types";

export interface PushingOrbProps {
  size?: number;
  speed?: number;
  paused?: boolean;
  color?: string;
  "aria-label"?: string;
}

const SELECT_START = 0.05;
const SELECT_WINDOW = 0.5;
const BLAST_START = 0.55;
const BLAST = 1;
const SETTLE = 0.45;
const DURATION = BLAST_START + BLAST + SETTLE;
const BASE_SPHERE = 80;
const PUSH_COUNT = 18;
const RIM = 1.1;
const TILT_X = 0.3;

interface Packet {
  index: number;
  target: Point3D;
  selectSpawn: number;
}

export function PushingOrb({
  size = 64,
  speed = 1,
  paused = false,
  color,
  "aria-label": ariaLabel = "Pushing",
}: PushingOrbProps) {
  const count = Math.max(8, Math.round((BASE_SPHERE * size) / 64));
  const radius = fitRadius(size);
  const cx = size / 2;
  const cy = size / 2;
  const unit = size / 64;
  const dotSize = 2.2 * unit;
  const packetSize = 2 * unit;
  const rimR = radius * RIM;

  const sphereDots = makeSphereDots(count, radius);
  const rand = mulberry32(20260818);
  const order = Array.from({ length: count }, (_, i) => i);
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = order[i];
    order[i] = order[j];
    order[j] = tmp;
  }
  const picked = order
    .slice(0, Math.min(PUSH_COUNT, count))
    .sort((a, b) => sphereDots[b].y - sphereDots[a].y);
  const packets: Packet[] = picked.map((idx, i) => ({
    index: idx,
    target: sphereDots[idx],
    selectSpawn: SELECT_START + SELECT_WINDOW * (i / picked.length),
  }));

  const render = (
    ctx: CanvasRenderingContext2D,
    t: number,
    reduced: boolean,
    colorPrefix: string,
    ink: (a: number) => number,
  ) => {
    const tiltX = TILT_X;
    const tiltY = reduced ? 0.15 : t * 0.1;
    ctx.clearRect(0, 0, size, size);

    if (reduced) {
      for (const dot of sphereDots) {
        const p = project(dot, cx, cy, tiltX, tiltY);
        ctx.fillStyle =
          colorPrefix + ink(0.5 * (p.z > 0 ? 0.35 : 1)).toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(p.x, p.y, dotSize * p.scale, 0, 2 * Math.PI);
        ctx.fill();
      }
      return;
    }

    const cycle = t % DURATION;
    const waveP =
      cycle >= BLAST_START
        ? easeOutCubic(clamp((cycle - BLAST_START) / BLAST, 0, 1))
        : 0;
    const ringR = rimR * waveP;

    const dots: Dot[] = [];
    const halos: Halo[] = [];
    const busy = new Set<number>();

    for (const packet of packets) {
      const sIn = cycle - packet.selectSpawn;
      if (sIn <= 0) continue;

      const p = project(packet.target, cx, cy, tiltX, tiltY);
      const d = Math.hypot(p.x - cx, p.y - cy);
      busy.add(packet.index);

      if (ringR >= d) {
        dots.push({
          x: p.x,
          y: p.y,
          r: packetSize * p.scale,
          z: p.z,
          alpha: 0.15 * (p.z > 0 ? 0.35 : 1),
        });
        continue;
      }

      const selP = easeOutCubic(clamp(sIn / 0.12, 0, 1));
      dots.push({
        x: p.x,
        y: p.y,
        r: packetSize * p.scale,
        z: p.z,
        alpha: 0.9 * selP * (p.z > 0 ? 0.35 : 1),
      });
      halos.push({
        x: p.x,
        y: p.y,
        r: packetSize * p.scale * 2.6,
        alpha: 0.18 * (1 - clamp(sIn / 0.3, 0, 1)),
      });
    }

    for (let i = 0; i < count; i++) {
      if (busy.has(i)) continue;
      const p = project(sphereDots[i], cx, cy, tiltX, tiltY);
      dots.push({
        x: p.x,
        y: p.y,
        r: dotSize * p.scale,
        z: p.z,
        alpha: 0.15 * (p.z > 0 ? 0.35 : 1),
      });
    }

    dots.sort((a, b) => a.z - b.z);
    for (const d of dots) {
      ctx.fillStyle = colorPrefix + ink(d.alpha).toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, 2 * Math.PI);
      ctx.fill();
    }

    for (const h of halos) {
      ctx.fillStyle = colorPrefix + ink(h.alpha).toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.r, 0, 2 * Math.PI);
      ctx.fill();
    }

    if (waveP > 0 && ringR > 0.5) {
      const ringFade = clamp((waveP - 0.9) / 0.1, 0, 1);
      ctx.strokeStyle =
        colorPrefix + ink(0.75 * (1 - ringFade)).toFixed(3) + ")";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, ringR, 0, 2 * Math.PI);
      ctx.stroke();
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

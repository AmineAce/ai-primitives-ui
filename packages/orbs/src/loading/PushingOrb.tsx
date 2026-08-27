"use client";

import { useMemo } from "react";
import { CanvasContainer } from "../canvas/CanvasContainer";
import { easeOutCubic } from "../canvas/easing";
import {
  fitRadius,
  makeSphereDots,
  projectWithTrig,
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

  const { sphereDots, packets } = useMemo(() => {
    const dots = makeSphereDots(count, radius);
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
      .sort((a, b) => dots[b].y - dots[a].y);
    const pkts: Packet[] = picked.map((idx, i) => ({
      index: idx,
      target: dots[idx],
      selectSpawn: SELECT_START + SELECT_WINDOW * (i / picked.length),
    }));
    return { sphereDots: dots, packets: pkts };
  }, [count, radius]);
  const dotsPool = useMemo<Dot[]>(() => [], []);
  const halosPool = useMemo<Halo[]>(() => [], []);
  const busySet = useMemo(() => new Set<number>(), []);
  const cmp = useMemo(() => (a: Dot, b: Dot) => a.z - b.z, []);

  const render = (
    ctx: CanvasRenderingContext2D,
    t: number,
    reduced: boolean,
    colorPrefix: string,
    ink: (a: number) => number,
  ) => {
    const tiltX = TILT_X;
    const tiltY = reduced ? 0.15 : t * 0.1;
    const cosX = Math.cos(tiltX);
    const sinX = Math.sin(tiltX);
    const cosY = Math.cos(tiltY);
    const sinY = Math.sin(tiltY);
    ctx.clearRect(0, 0, size, size);

    if (reduced) {
      for (const dot of sphereDots) {
        const p = projectWithTrig(dot, cx, cy, cosX, sinX, cosY, sinY);
        ctx.fillStyle =
          colorPrefix + ink(0.5 * (p.z > 0 ? 0.35 : 1)).toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(p.x, p.y, dotSize * p.scale, 0, 2 * Math.PI);
        ctx.fill();
      }
      return;
    }

    const cycle = t % DURATION;
    const fills: string[] = [];
    for (let i = 0; i <= 20; i++)
      fills[i] = colorPrefix + ink(i / 20).toFixed(3) + ")";
    const fillFor = (alpha: number) =>
      fills[Math.round(clamp(alpha, 0, 1) * 20)];
    const waveP =
      cycle >= BLAST_START
        ? easeOutCubic(clamp((cycle - BLAST_START) / BLAST, 0, 1))
        : 0;
    const ringR = rimR * waveP;

    const dots = dotsPool;
    dots.length = 0;
    const halos = halosPool;
    halos.length = 0;
    const busy = busySet;
    busy.clear();

    for (const packet of packets) {
      const sIn = cycle - packet.selectSpawn;
      if (sIn <= 0) continue;

      const p = projectWithTrig(packet.target, cx, cy, cosX, sinX, cosY, sinY);
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
      const p = projectWithTrig(sphereDots[i], cx, cy, cosX, sinX, cosY, sinY);
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

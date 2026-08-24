"use client";

import { CanvasContainer } from "../canvas/CanvasContainer";
import { easeInOutSine, easeOutBack, easeOutCubic } from "../canvas/easing";
import {
  fitRadius,
  makeSphereDots,
  project,
  type Point3D,
} from "../canvas/sphere";
import { clamp } from "../lib/math";
import { useOrbAnimation } from "../canvas/useOrbAnimation";
import { lerp3 } from "../canvas/paths";
import { mulberry32 } from "../canvas/random";
import type { Dot, Halo } from "../canvas/types";

export interface PullingOrbProps {
  size?: number;
  speed?: number;
  paused?: boolean;
  color?: string;
  "aria-label"?: string;
}

const LAY = 0.4;
const SPAWN_START = 0.2;
const SPAWN_WINDOW = 2.2;
const FALL = 1;
const SNAP = 0.25;
const MERGE_START = SPAWN_START + SPAWN_WINDOW + FALL;
const PULL = 1.2;
const SETTLE = 0.6;
const DURATION = MERGE_START + PULL + SETTLE;
const BASE_SPHERE = 80;
const PACKETS = 24;

interface Packet {
  index: number;
  target: Point3D;
  spawn: number;
}

export function PullingOrb({
  size = 64,
  speed = 1,
  paused = false,
  color,
  "aria-label": ariaLabel = "Pulling",
}: PullingOrbProps) {
  const count = Math.max(8, Math.round((BASE_SPHERE * size) / 64));
  const radius = fitRadius(size);
  const cx = size / 2;
  const cy = size / 2;
  const unit = size / 64;
  const dotSize = 2.2 * unit;
  const packetSize = 2 * unit;
  const mergeRadius = radius * 1.15;
  const origin: Point3D = { x: 0, y: 0, z: 0 };

  const sphereDots = makeSphereDots(count, radius);
  const rand = mulberry32(20260817);
  const order = Array.from({ length: count }, (_, i) => i);
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = order[i];
    order[i] = order[j];
    order[j] = tmp;
  }
  const packetCount = Math.min(PACKETS, count);
  const packets: Packet[] = Array.from({ length: packetCount }, (_, i) => ({
    index: order[i],
    target: sphereDots[order[i]],
    spawn: SPAWN_START + SPAWN_WINDOW * (1 - Math.pow(1 - i / packetCount, 2)),
  }));

  const render = (
    ctx: CanvasRenderingContext2D,
    t: number,
    reduced: boolean,
    colorPrefix: string,
    ink: (a: number) => number,
  ) => {
    const tiltX = 0.3;
    const tiltY = reduced ? 0.15 : t * 0.1;
    ctx.clearRect(0, 0, size, size);

    const op = project(origin, cx, cy, tiltX, tiltY);

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
    const layExt = easeOutCubic(clamp(cycle / LAY, 0, 1));
    const pullActive = cycle >= MERGE_START;
    const pullP = pullActive ? clamp((cycle - MERGE_START) / PULL, 0, 1) : 0;
    const pullEase = easeOutCubic(pullP);
    const ringR = mergeRadius * (1 - pullEase);

    for (const packet of packets) {
      const tp = project(packet.target, cx, cy, tiltX, tiltY);
      ctx.strokeStyle =
        colorPrefix + ink(0.07 * layExt * (1 - pullEase)).toFixed(3) + ")";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(op.x, op.y);
      ctx.lineTo(op.x + (tp.x - op.x) * layExt, op.y + (tp.y - op.y) * layExt);
      ctx.stroke();
    }

    const dots: Dot[] = [];
    const halos: Halo[] = [];
    const busy = new Set<number>();

    let newestActive: Packet | undefined;
    for (const packet of packets) {
      const tIn = cycle - packet.spawn;
      if (tIn <= 0) continue;

      if (tIn < FALL) {
        const rideP = easeInOutSine(tIn / FALL);
        const pos3d = lerp3(origin, packet.target, rideP);
        const p = project(pos3d, cx, cy, tiltX, tiltY);
        const spawnFade = clamp(tIn / 0.12, 0, 1);
        busy.add(packet.index);
        newestActive = packet;
        dots.push({
          x: p.x,
          y: p.y,
          r: packetSize * p.scale,
          z: p.z,
          alpha: 0.9 * spawnFade * (p.z > 0 ? 0.35 : 1),
        });
        continue;
      }

      const p = project(packet.target, cx, cy, tiltX, tiltY);
      const post = tIn - FALL;

      if (pullActive) {
        const d = Math.hypot(p.x - op.x, p.y - op.y);
        const orbP = clamp((d - ringR) / d, 0, 1);
        if (orbP >= 1) continue;
        busy.add(packet.index);
        newestActive = packet;
        const slide = easeOutCubic(orbP);
        const pos3d = lerp3(packet.target, origin, slide);
        const sp = project(pos3d, cx, cy, tiltX, tiltY);
        dots.push({
          x: sp.x,
          y: sp.y,
          r: packetSize * sp.scale,
          z: sp.z,
          alpha: 0.9 * (1 - slide) * (sp.z > 0 ? 0.35 : 1),
        });
        continue;
      }

      busy.add(packet.index);
      newestActive = packet;
      if (post < SNAP) {
        const snapP = post / SNAP;
        dots.push({
          x: p.x,
          y: p.y,
          r: packetSize * p.scale * (1 + 0.5 * easeOutBack(snapP)),
          z: p.z,
          alpha: 0.9 * (p.z > 0 ? 0.35 : 1),
        });
        halos.push({
          x: p.x,
          y: p.y,
          r: packetSize * p.scale * 2.4,
          alpha: 0.12 * (1 - snapP),
        });
      } else {
        dots.push({
          x: p.x,
          y: p.y,
          r: packetSize * p.scale,
          z: p.z,
          alpha: 0.9 * (p.z > 0 ? 0.35 : 1),
        });
      }
    }

    if (newestActive) {
      const tp = project(newestActive.target, cx, cy, tiltX, tiltY);
      ctx.strokeStyle =
        colorPrefix + ink(0.04 + 0.03 * Math.sin(t * 4)).toFixed(3) + ")";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(op.x, op.y);
      ctx.lineTo(tp.x, tp.y);
      ctx.stroke();
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

    if (pullActive) {
      ctx.fillStyle = colorPrefix + ink(0.06 * (1 - pullEase)).toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(op.x, op.y, ringR, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle =
        colorPrefix + ink(0.35 * (1 - pullEase * 0.6)).toFixed(3) + ")";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(op.x, op.y, ringR, 0, 2 * Math.PI);
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

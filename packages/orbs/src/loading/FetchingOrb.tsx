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

export interface FetchingOrbProps {
  size?: number;
  speed?: number;
  paused?: boolean;
  color?: string;
  "aria-label"?: string;
}

const FALL = 1;
const SNAP = 0.25;
const BRIGHT = 1;
const SETTLE = 0.5;
const RET_FALL = 0.8;
const SPAWN_WINDOW = 2.2;
const SETTLE_END = FALL + SNAP + BRIGHT + SETTLE;
const LIFECYCLE = SETTLE_END + RET_FALL;
const DURATION = SPAWN_WINDOW + LIFECYCLE;
const BASE_SPHERE = 80;
const PACKETS = 24;

interface Packet {
  index: number;
  target: Point3D;
  spawn: number;
}

export function FetchingOrb({
  size = 64,
  speed = 1,
  paused = false,
  color,
  "aria-label": ariaLabel = "Fetching",
}: FetchingOrbProps) {
  const count = Math.max(8, Math.round((BASE_SPHERE * size) / 64));
  const radius = fitRadius(size);
  const cx = size / 2;
  const cy = size / 2;
  const unit = size / 64;
  const dotSize = 2.2 * unit;
  const packetSize = 2 * unit;
  const arcAmp = 8 * unit;
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
    spawn: SPAWN_WINDOW * (1 - Math.pow(1 - i / packetCount, 2)),
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

    const dots: Dot[] = [];
    const halos: Halo[] = [];
    const busy = new Set<number>();

    let newestActive: Packet | undefined;
    for (const packet of packets) {
      const tIn = cycle - packet.spawn;
      if (tIn <= 0 || tIn >= LIFECYCLE) continue;
      busy.add(packet.index);
      newestActive = packet;

      if (tIn < FALL) {
        const travelP = tIn / FALL;
        const eased = easeInOutSine(travelP);
        const pos3d = lerp3(origin, packet.target, eased);
        const p = project(pos3d, cx, cy, tiltX, tiltY);
        const tp = project(packet.target, cx, cy, tiltX, tiltY);
        let dx = tp.x - op.x;
        let dy = tp.y - op.y;
        const len = Math.hypot(dx, dy) || 1;
        dx /= len;
        dy /= len;
        const arc = Math.sin(Math.PI * travelP) * (1 - travelP) * arcAmp;
        const spawnFade = clamp(tIn / 0.12, 0, 1);
        dots.push({
          x: p.x - dy * arc,
          y: p.y + dx * arc,
          r: packetSize * p.scale,
          z: p.z,
          alpha: 0.9 * spawnFade * (p.z > 0 ? 0.35 : 1),
        });
      } else if (tIn < SETTLE_END) {
        const post = tIn - FALL;
        const p = project(packet.target, cx, cy, tiltX, tiltY);
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
        } else if (post < SNAP + BRIGHT) {
          dots.push({
            x: p.x,
            y: p.y,
            r: packetSize * p.scale,
            z: p.z,
            alpha: 0.9 * (p.z > 0 ? 0.35 : 1),
          });
        } else {
          const s = clamp((post - SNAP - BRIGHT) / SETTLE, 0, 1);
          dots.push({
            x: p.x,
            y: p.y,
            r: packetSize * p.scale,
            z: p.z,
            alpha: (0.9 - 0.75 * easeOutCubic(s)) * (p.z > 0 ? 0.35 : 1),
          });
        }
      } else {
        const reverseP = clamp((tIn - SETTLE_END) / RET_FALL, 0, 1);
        const road = 1 - easeInOutSine(reverseP);
        const pos3d = lerp3(origin, packet.target, road);
        const p = project(pos3d, cx, cy, tiltX, tiltY);
        const tp = project(packet.target, cx, cy, tiltX, tiltY);
        let dx = tp.x - op.x;
        let dy = tp.y - op.y;
        const len = Math.hypot(dx, dy) || 1;
        dx /= len;
        dy /= len;
        const arc = Math.sin(Math.PI * road) * (1 - road) * arcAmp;
        const pulse = Math.sin(t * 3.2);
        const rise = easeOutCubic(clamp(reverseP / 0.15, 0, 1));
        const endFade = easeOutCubic(clamp((reverseP - 0.85) / 0.15, 0, 1));
        dots.push({
          x: p.x - dy * arc,
          y: p.y + dx * arc,
          r: packetSize * p.scale * (1 + 0.2 * pulse),
          z: p.z,
          alpha:
            (0.8 + 0.15 * pulse) * rise * (1 - endFade) * (p.z > 0 ? 0.35 : 1),
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

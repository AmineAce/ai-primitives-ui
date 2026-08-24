"use client";

import { CanvasContainer } from "../canvas/CanvasContainer";
import { easeInOutSine } from "../canvas/easing";
import { lerp3 } from "../canvas/paths";
import {
  fitRadius,
  makeSphereDots,
  project,
  type Point3D,
} from "../canvas/sphere";
import { useOrbAnimation } from "../canvas/useOrbAnimation";
import type { Dot } from "../canvas/types";

export interface CubeOrbProps {
  size?: number;
  speed?: number;
  paused?: boolean;
  color?: string;
  "aria-label"?: string;
}

interface TurnEvent {
  t0: number;
  t1: number;
  from: Point3D;
  to: Point3D;
}

const N = 4;
const DURATION = 9;
const TURN_DUR = 0.6;
const PAUSE = 0.35;
const TURN_FACES = 5;
const BLOOM_T0 = TURN_FACES * (TURN_DUR + PAUSE);
const BLOOM_DUR = 0.9;
const ORB_T0 = BLOOM_T0 + BLOOM_DUR;
const ORB_DUR = 1.6;
const REFORM_T0 = ORB_T0 + ORB_DUR;
const REFORM_DUR = 0.9;
const TILT_X = 0.3;
const DOT_ALPHA = 0.8;

function rotX(p: Point3D, theta: number): Point3D {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  return {
    x: p.x,
    y: p.y * c - p.z * s,
    z: p.y * s + p.z * c,
  };
}

function rotY(p: Point3D, theta: number): Point3D {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  return {
    x: p.x * c + p.z * s,
    y: p.y,
    z: -p.x * s + p.z * c,
  };
}

function rotZ(p: Point3D, theta: number): Point3D {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  return {
    x: p.x * c - p.y * s,
    y: p.x * s + p.y * c,
    z: p.z,
  };
}

export function CubeOrb({
  size = 64,
  speed = 1,
  paused = false,
  color,
  "aria-label": ariaLabel = "Thinking",
}: CubeOrbProps) {
  const radius = fitRadius(size);
  const cx = size / 2;
  const cy = size / 2;
  const unit = size / 64;
  const dotSize = 1.8 * unit;
  const s = radius / (1.5 * Math.sqrt(3));

  const offsets = [-1.5, -0.5, 0.5, 1.5];
  const base: Point3D[] = [];
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      for (let k = 0; k < N; k++) {
        if (i > 0 && i < N - 1 && j > 0 && j < N - 1 && k > 0 && k < N - 1) {
          continue;
        }
        base.push({ x: offsets[i] * s, y: offsets[j] * s, z: offsets[k] * s });
      }
    }
  }

  const turnSpecs: {
    axis: "x" | "y" | "z";
    layer: number;
    theta: number;
  }[] = [
    { axis: "y", layer: 1.5 * s, theta: Math.PI / 2 },
    { axis: "z", layer: 1.5 * s, theta: Math.PI / 2 },
    { axis: "x", layer: 1.5 * s, theta: -Math.PI / 2 },
    { axis: "y", layer: -1.5 * s, theta: -Math.PI / 2 },
    { axis: "z", layer: -1.5 * s, theta: -Math.PI / 2 },
  ];
  const turns = turnSpecs.map((turn, idx) => ({
    ...turn,
    t0: idx * (TURN_DUR + PAUSE),
    t1: idx * (TURN_DUR + PAUSE) + TURN_DUR,
  }));

  const events: TurnEvent[][] = base.map(() => []);
  const pos = base.slice();
  for (const turn of turns) {
    for (let i = 0; i < pos.length; i++) {
      const p = pos[i];
      const v = turn.axis === "y" ? p.y : turn.axis === "x" ? p.x : p.z;
      if (Math.abs(v - turn.layer) < 0.001) {
        const to =
          turn.axis === "y"
            ? rotY(p, turn.theta)
            : turn.axis === "x"
              ? rotX(p, turn.theta)
              : rotZ(p, turn.theta);
        events[i].push({ t0: turn.t0, t1: turn.t1, from: p, to });
        pos[i] = to;
      }
    }
  }
  const finalPos = pos;

  const sphereDots = makeSphereDots(base.length, radius);

  const cubePos = (i: number, cyc: number): Point3D => {
    let cur = base[i];
    for (const ev of events[i]) {
      if (cyc >= ev.t1) {
        cur = ev.to;
      } else if (cyc >= ev.t0) {
        const f = easeInOutSine((cyc - ev.t0) / (ev.t1 - ev.t0));
        cur = lerp3(ev.from, ev.to, f);
        break;
      } else {
        break;
      }
    }
    return cur;
  };

  const render = (
    ctx: CanvasRenderingContext2D,
    t: number,
    reduced: boolean,
    colorPrefix: string,
    ink: (a: number) => number,
  ) => {
    const tiltY = reduced ? 0.15 : t * 0.1;
    const cyc = t % DURATION;
    ctx.clearRect(0, 0, size, size);

    const dots: Dot[] = [];

    for (let i = 0; i < base.length; i++) {
      let p3: Point3D;
      if (reduced) {
        p3 = base[i];
      } else if (cyc < BLOOM_T0) {
        p3 = cubePos(i, cyc);
      } else if (cyc < ORB_T0) {
        const f = easeInOutSine((cyc - BLOOM_T0) / BLOOM_DUR);
        p3 = lerp3(finalPos[i], sphereDots[i], f);
      } else if (cyc < REFORM_T0) {
        p3 = sphereDots[i];
      } else if (cyc < REFORM_T0 + REFORM_DUR) {
        const f = easeInOutSine((cyc - REFORM_T0) / REFORM_DUR);
        p3 = lerp3(sphereDots[i], base[i], f);
      } else {
        p3 = base[i];
      }

      const p = project(p3, cx, cy, TILT_X, tiltY);
      dots.push({
        x: p.x,
        y: p.y,
        r: dotSize * p.scale,
        z: p.z,
        alpha: DOT_ALPHA * (p.z > 0 ? 0.35 : 1),
      });
    }

    dots.sort((a, b) => a.z - b.z);
    for (const d of dots) {
      ctx.fillStyle = colorPrefix + ink(d.alpha).toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, 2 * Math.PI);
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

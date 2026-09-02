"use client";

import { useMemo } from "react";
import { CanvasContainer } from "../canvas/CanvasContainer";
import {
  fitRadius,
  projectWithTrig,
  type Point3D,
  type ProjectedPoint,
} from "../canvas/sphere";
import { clamp } from "../lib/math";
import { useOrbAnimation } from "../canvas/useOrbAnimation";
import type { Dot } from "../canvas/types";

export interface GraphOrbProps {
  size?: number;
  speed?: number;
  paused?: boolean;
  color?: string;
  "aria-label"?: string;
}

const DURATION = 4.8; // one full pole → pole → pole wave bounce
const WAVE_RATE = (Math.PI * 2) / DURATION;

function icosphere(subdivisions: number, radius: number) {
  const t = (1 + Math.sqrt(5)) / 2;
  let verts: Point3D[] = [
    { x: -1, y: t, z: 0 },
    { x: 1, y: t, z: 0 },
    { x: -1, y: -t, z: 0 },
    { x: 1, y: -t, z: 0 },
    { x: 0, y: -1, z: t },
    { x: 0, y: 1, z: t },
    { x: 0, y: -1, z: -t },
    { x: 0, y: 1, z: -t },
    { x: t, y: 0, z: -1 },
    { x: t, y: 0, z: 1 },
    { x: -t, y: 0, z: -1 },
    { x: -t, y: 0, z: 1 },
  ].map((v) => {
    const l = Math.hypot(v.x, v.y, v.z);
    return {
      x: (v.x / l) * radius,
      y: (v.y / l) * radius,
      z: (v.z / l) * radius,
    };
  });
  let faces: number[][] = [
    [0, 11, 5],
    [0, 5, 1],
    [0, 1, 7],
    [0, 7, 10],
    [0, 10, 11],
    [1, 5, 9],
    [5, 11, 4],
    [11, 10, 2],
    [10, 7, 6],
    [7, 1, 8],
    [3, 9, 4],
    [3, 4, 2],
    [3, 2, 6],
    [3, 6, 8],
    [3, 8, 9],
    [4, 9, 5],
    [2, 4, 11],
    [6, 2, 10],
    [8, 6, 7],
    [9, 8, 1],
  ];
  const midCache = new Map<string, number>();
  function mid(a: number, b: number) {
    const key = a < b ? `${a}_${b}` : `${b}_${a}`;
    if (midCache.has(key)) return midCache.get(key)!;
    const pa = verts[a],
      pb = verts[b];
    const m = {
      x: (pa.x + pb.x) / 2,
      y: (pa.y + pb.y) / 2,
      z: (pa.z + pb.z) / 2,
    };
    const l = Math.hypot(m.x, m.y, m.z);
    const idx = verts.length;
    verts.push({
      x: (m.x / l) * radius,
      y: (m.y / l) * radius,
      z: (m.z / l) * radius,
    });
    midCache.set(key, idx);
    return idx;
  }
  for (let s = 0; s < subdivisions; s++) {
    const newFaces: number[][] = [];
    for (const [a, b, c] of faces) {
      const ab = mid(a, b),
        bc = mid(b, c),
        ca = mid(c, a);
      newFaces.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
    }
    faces = newFaces;
    midCache.clear();
  }
  const edgeSet = new Set<string>();
  for (const [a, b, c] of faces)
    for (const [u, v] of [
      [a, b],
      [b, c],
      [c, a],
    ] as const)
      edgeSet.add(u < v ? `${u}_${v}` : `${v}_${u}`);
  const edges = Array.from(edgeSet).map((k) => {
    const [a, b] = k.split("_").map(Number);
    return { a, b };
  });
  return { verts, edges };
}

export function GraphOrb({
  size = 64,
  speed = 1,
  paused = false,
  color,
  "aria-label": ariaLabel = "Mapping network",
}: GraphOrbProps) {
  const radius = fitRadius(size);
  const cx = size / 2;
  const cy = size / 2;
  const unit = size / 64;

  const { verts, edges, nodeT, edgeT } = useMemo(() => {
    const { verts, edges } = icosphere(1, radius * 0.96);
    let east = 0,
      west = 0,
      maxX = -Infinity,
      minX = Infinity;
    for (let i = 0; i < verts.length; i++) {
      if (verts[i].x > maxX) {
        maxX = verts[i].x;
        east = i;
      }
      if (verts[i].x < minX) {
        minX = verts[i].x;
        west = i;
      }
    }
    const maxDist = Math.hypot(
      verts[east].x - verts[west].x,
      verts[east].y - verts[west].y,
      verts[east].z - verts[west].z,
    );
    const nodeT = verts.map(
      (v) =>
        Math.min(
          Math.hypot(
            v.x - verts[east].x,
            v.y - verts[east].y,
            v.z - verts[east].z,
          ),
          Math.hypot(
            v.x - verts[west].x,
            v.y - verts[west].y,
            v.z - verts[west].z,
          ),
        ) / maxDist,
    );
    const edgeT = edges.map((e) => {
      const mx = (verts[e.a].x + verts[e.b].x) / 2,
        my = (verts[e.a].y + verts[e.b].y) / 2,
        mz = (verts[e.a].z + verts[e.b].z) / 2;
      return (
        Math.min(
          Math.hypot(
            mx - verts[east].x,
            my - verts[east].y,
            mz - verts[east].z,
          ),
          Math.hypot(
            mx - verts[west].x,
            my - verts[west].y,
            mz - verts[west].z,
          ),
        ) / maxDist
      );
    });
    return { verts, edges, nodeT, edgeT };
  }, [radius]);

  const dotsPool = useMemo<Dot[]>(() => [], []);
  const projPool = useMemo<ProjectedPoint[]>(() => [], []);
  const edgePathsPool = useMemo<(Path2D | null)[]>(() => [], []);
  const cmp = useMemo(() => (a: Dot, b: Dot) => a.z - b.z, []);

  const render = (
    ctx: CanvasRenderingContext2D,
    t: number,
    reduced: boolean,
    colorPrefix: string,
    ink: (a: number) => number,
  ) => {
    const tiltX = 0.18;
    // Gentle sway instead of a full spin: keeps the reveal poles roughly in
    // place while the globe never feels frozen.
    const tiltY = reduced ? 0.1 : 0.12 + 0.22 * Math.sin(t * 0.22);
    const cosX = Math.cos(tiltX);
    const sinX = Math.sin(tiltX);
    const cosY = Math.cos(tiltY);
    const sinY = Math.sin(tiltY);
    ctx.clearRect(0, 0, size, size);

    // Continuous closed loop: the network is always visible at a steady base,
    // and a glowing wavefront travels pole → pole → pole, forever (ping-pong,
    // seamless: nothing ever leaves the view).
    const cycle = t % DURATION;
    const waveS = reduced ? 0 : Math.sin(cycle * WAVE_RATE) * 0.5 + 0.5;
    const glowW = 0.16;
    const glowW2 = glowW * glowW;

    // Project every vertex once per frame; edges and nodes read from the cache.
    const proj = projPool;
    for (let i = 0; i < verts.length; i++)
      proj[i] = projectWithTrig(verts[i], cx, cy, cosX, sinX, cosY, sinY);

    const fills: string[] = [];
    for (let i = 0; i <= 64; i++)
      fills[i] = colorPrefix + ink(i / 64).toFixed(3) + ")";
    const fillFor = (a: number) => fills[Math.round(clamp(a, 0, 1) * 64)];

    if (reduced) {
      for (const e of edges) {
        ctx.strokeStyle = colorPrefix + ink(0.22).toFixed(3) + ")";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(proj[e.a].x, proj[e.a].y);
        ctx.lineTo(proj[e.b].x, proj[e.b].y);
        ctx.stroke();
      }
      for (let i = 0; i < verts.length; i++) {
        const p = proj[i];
        ctx.fillStyle =
          colorPrefix + ink(0.82 * (p.z > 0 ? 0.38 : 1)).toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5 * unit * p.scale, 0, 2 * Math.PI);
        ctx.fill();
      }
      return;
    }

    const dots = dotsPool;
    dots.length = 0;

    // Edges batched into one Path2D per alpha bucket: one stroke call each
    // instead of one per edge.
    const EDGE_BUCKETS = 48;
    const EDGE_ALPHA_MAX = 0.38;
    const paths = edgePathsPool;
    for (let i = 0; i <= EDGE_BUCKETS; i++) paths[i] = null;
    for (let ei = 0; ei < edges.length; ei++) {
      const e = edges[ei];
      const d = edgeT[ei] - waveS;
      const lit = Math.exp(-(d * d) / glowW2);
      const midZ = (verts[e.a].z + verts[e.b].z) / 2;
      const a = (0.14 + lit * 0.24) * (midZ > 0 ? 0.72 : 0.45);
      if (a <= 0.004) continue;
      const bi = Math.min(
        EDGE_BUCKETS,
        Math.round((a / EDGE_ALPHA_MAX) * EDGE_BUCKETS),
      );
      const path = paths[bi] ?? (paths[bi] = new Path2D());
      path.moveTo(proj[e.a].x, proj[e.a].y);
      path.lineTo(proj[e.b].x, proj[e.b].y);
    }
    ctx.lineWidth = 1.15;
    for (let i = 0; i <= EDGE_BUCKETS; i++) {
      const path = paths[i];
      if (!path) continue;
      ctx.strokeStyle =
        colorPrefix + ink((i / EDGE_BUCKETS) * EDGE_ALPHA_MAX).toFixed(3) + ")";
      ctx.stroke(path);
    }

    for (let ni = 0; ni < verts.length; ni++) {
      const d = nodeT[ni] - waveS;
      const lit = Math.exp(-(d * d) / glowW2);
      const p = proj[ni];
      dots.push({
        x: p.x,
        y: p.y,
        r: 1.5 * unit * (1 + lit * 0.35) * p.scale,
        z: p.z,
        alpha: (0.32 + lit * 0.45) * (p.z > 0 ? 0.4 : 1),
      });
    }

    dots.sort(cmp);
    for (const d of dots) {
      if (d.alpha <= 0.003) continue;
      ctx.fillStyle = fillFor(d.alpha);
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = fillFor(d.alpha * 0.18);
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r * 2.1, 0, 2 * Math.PI);
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

"use client";

import { useEffect, useRef } from "react";
import { useOrbInk } from "@/hooks/use-orb-ink";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const ORB_SIZE = 128;
const GLOBE_R = 26;
const GLOBE_DOT_R = 1.4;
const ORBIT_R = 50;
const TILT_X = 0.42;
const SAT_SPEED = 0.0011;
const TRAIL_LEN = 30;
const MAX_DPR = 2;
const TWO_PI = Math.PI * 2;

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface TrailPoint {
  x: number;
  y: number;
  z: number;
}

const RINGS = [
  { y: -0.7, count: 5 },
  { y: -0.35, count: 8 },
  { y: 0, count: 10 },
  { y: 0.35, count: 8 },
  { y: 0.7, count: 5 },
];

const GLOBE_POINTS: Point3D[] = [
  { x: 0, y: 1, z: 0 },
  { x: 0, y: -1, z: 0 },
];

for (const ring of RINGS) {
  const rr = Math.sqrt(1 - ring.y * ring.y);
  for (let j = 0; j < ring.count; j++) {
    const theta = (j * TWO_PI) / ring.count;
    GLOBE_POINTS.push({
      x: rr * Math.cos(theta),
      y: ring.y,
      z: rr * Math.sin(theta),
    });
  }
}

export function HeroOrb() {
  const ref = useRef<HTMLCanvasElement>(null);
  const { color, ink } = useOrbInk();
  const reduced = useReducedMotion();
  const colorRef = useRef(color);
  const inkRef = useRef(ink);

  useEffect(() => {
    colorRef.current = color;
  }, [color]);

  useEffect(() => {
    inkRef.current = ink;
  }, [ink]);

  useEffect(() => {
    if (!reduced) return;
    const canvas = ref.current;
    if (!canvas) return;
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const curSize = isMobile ? 96 : ORB_SIZE;
    const curGlobeR = isMobile ? 19 : GLOBE_R;
    const curOrbitR = isMobile ? 38 : ORBIT_R;
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const px = Math.round(curSize * dpr);
    canvas.width = px;
    canvas.height = px;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cx = curSize / 2;
    const cy = curSize / 2;
    const dot = (x: number, y: number, r: number, a: number) => {
      ctx.globalAlpha = ink(a);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TWO_PI);
      ctx.fill();
    };
    const drawGlobe = (t: number) => {
      const radius = curGlobeR + Math.sin((t / 2400) * TWO_PI) * 1.3;
      const spin = t * 0.00025;
      const cosY = Math.cos(spin);
      const sinY = Math.sin(spin);
      const cosX = Math.cos(TILT_X);
      const sinX = Math.sin(TILT_X);
      const projected = GLOBE_POINTS.map((p) => {
        const x = p.x * radius;
        const y = p.y * radius;
        const z = p.z * radius;
        const x1 = x * cosY + z * sinY;
        const z1 = -x * sinY + z * cosY;
        const y2 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;
        return { x: cx + x1, y: cy - y2, z: z2 };
      });
      projected.sort((a, b) => b.z - a.z);
      for (const p of projected)
        dot(p.x, p.y, GLOBE_DOT_R, 0.9 * (p.z > 0 ? 0.35 : 1));
    };
    const satellite = (theta: number): TrailPoint => {
      const ox = Math.cos(theta) * curOrbitR;
      const oy = -Math.sin(theta) * curOrbitR * Math.sin(0.45);
      const oz = Math.sin(theta) * curOrbitR * Math.cos(0.45);
      return { x: cx + ox, y: cy - oy, z: oz };
    };
    drawGlobe(600);
    const s = satellite(0.9);
    dot(s.x, s.y, 2.2, 0.95);
  }, [color, ink, reduced]);

  useEffect(() => {
    if (reduced) return;
    const canvas = ref.current;
    if (!canvas) return;
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const curSize = isMobile ? 96 : ORB_SIZE;
    const curGlobeR = isMobile ? 19 : GLOBE_R;
    const curOrbitR = isMobile ? 38 : ORBIT_R;
    const curTrail = isMobile ? 18 : TRAIL_LEN;
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const px = Math.round(curSize * dpr);
    canvas.width = px;
    canvas.height = px;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = curSize / 2;
    const cy = curSize / 2;

    const dot = (x: number, y: number, r: number, a: number) => {
      ctx.globalAlpha = inkRef.current(a);
      ctx.fillStyle = colorRef.current;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TWO_PI);
      ctx.fill();
    };

    const drawGlobe = (t: number) => {
      const radius = curGlobeR + Math.sin((t / 2400) * TWO_PI) * 1.3;
      const spin = t * 0.00025;
      const cosY = Math.cos(spin);
      const sinY = Math.sin(spin);
      const cosX = Math.cos(TILT_X);
      const sinX = Math.sin(TILT_X);
      const projected = GLOBE_POINTS.map((p) => {
        const x = p.x * radius;
        const y = p.y * radius;
        const z = p.z * radius;
        const x1 = x * cosY + z * sinY;
        const z1 = -x * sinY + z * cosY;
        const y2 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;
        return { x: cx + x1, y: cy - y2, z: z2 };
      });
      projected.sort((a, b) => b.z - a.z);
      for (const p of projected)
        dot(p.x, p.y, GLOBE_DOT_R, 0.9 * (p.z > 0 ? 0.35 : 1));
    };

    const satellite = (theta: number): TrailPoint => {
      const ox = Math.cos(theta) * curOrbitR;
      const oy = -Math.sin(theta) * curOrbitR * Math.sin(0.45);
      const oz = Math.sin(theta) * curOrbitR * Math.cos(0.45);
      return { x: cx + ox, y: cy - oy, z: oz };
    };

    const drawTrailSegment = (a: TrailPoint, b: TrailPoint, f: number) => {
      ctx.globalAlpha = inkRef.current(0.6 * f);
      ctx.strokeStyle = colorRef.current;
      ctx.lineWidth = 0.5 + 1.3 * f;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    };

    let raf = 0;
    let start = 0;
    const trail: TrailPoint[] = [];
    const frame = (now: number) => {
      if (start === 0) start = now;
      const t = now - start;
      ctx.clearRect(0, 0, curSize, curSize);

      const s = satellite(SAT_SPEED * t);
      trail.push(s);
      if (trail.length > curTrail) trail.shift();

      for (let i = 0; i < trail.length - 1; i++)
        if (trail[i].z > 0)
          drawTrailSegment(
            trail[i],
            trail[i + 1],
            (i + 1) / (trail.length - 1),
          );
      if (s.z > 0) dot(s.x, s.y, 2.2, 0.4);

      drawGlobe(t);

      for (let i = 0; i < trail.length - 1; i++)
        if (trail[i].z <= 0)
          drawTrailSegment(
            trail[i],
            trail[i + 1],
            (i + 1) / (trail.length - 1),
          );
      if (s.z <= 0) dot(s.x, s.y, 2.2, 0.95);
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  return (
    <canvas
      ref={ref}
      width={ORB_SIZE}
      height={ORB_SIZE}
      aria-hidden="true"
      className="size-24 md:size-32"
    />
  );
}

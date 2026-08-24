"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./Button";
import { useOrbInk } from "@/hooks/use-orb-ink";
import { useReducedMotion } from "@/hooks/useReducedMotion";

type Status = "idle" | "approved" | "denied";
type Risk = "low" | "medium" | "high";

interface ApprovalCardProps {
  command: string;
  description?: string;
  tool?: string;
  risk?: Risk;
  approveLabel?: string;
  denyLabel?: string;
  onApprove?: () => void;
  onDeny?: () => void;
  className?: string;
}

const RISK_CLASSES: Record<Risk, string> = {
  low: "text-fg-subtle",
  medium: "text-fg-muted",
  high: "text-fg",
};

const SIZE = 28;
const MAX_DPR = 2;
const GLOBE_R = 6.4;
const GLOBE_DOT_R = 0.8;
const ORBIT_R = 10;
const ORBIT_TILT = 1;
const SAT_R = 1.1;
const ORBIT_SPEED = 0.0022;
const TRAIL_LEN = 22;
const SPLIT_MS = 240;
const FLASH_MS = 200;
const TWO_PI = Math.PI * 2;

function easeOutExpo(t: number): number {
  return t <= 0 ? 0 : 1 - Math.pow(2, -10 * t);
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

interface Dot {
  x: number;
  y: number;
  r: number;
  a: number;
}

function drawDots(
  ctx: CanvasRenderingContext2D,
  color: string,
  dots: Dot[],
  ink: (a: number) => number = (a) => a,
) {
  for (const dot of dots) {
    ctx.globalAlpha = ink(dot.a);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(dot.x, dot.y, dot.r, 0, TWO_PI);
    ctx.fill();
  }
}

interface Point3D {
  x: number;
  y: number;
  z: number;
}

const GLOBE_RINGS: { y: number; count: number }[] = [
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

for (const ring of GLOBE_RINGS) {
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

interface GlobeOpts {
  cx: number;
  cy: number;
  radius: number;
  spin: number;
  tilt: number;
  alpha: number;
  sep?: { nx: number; ny: number; delta: number };
}

function drawGlobe(
  ctx: CanvasRenderingContext2D,
  color: string,
  opts: GlobeOpts,
  ink: (a: number) => number = (a) => a,
) {
  const { cx, cy, radius, spin, tilt, alpha, sep } = opts;
  const cosY = Math.cos(spin);
  const sinY = Math.sin(spin);
  const cosX = Math.cos(tilt);
  const sinX = Math.sin(tilt);
  const projected: { x: number; y: number; z: number }[] = [];
  for (const p of GLOBE_POINTS) {
    const x = p.x * radius;
    const y = p.y * radius;
    const z = p.z * radius;
    const x1 = x * cosY + z * sinY;
    const z1 = -x * sinY + z * cosY;
    const y2 = y * cosX - z1 * sinX;
    const z2 = y * sinX + z1 * cosX;
    let px = cx + x1;
    let py = cy - y2;
    if (sep) {
      const relX = px - cx;
      const relY = py - cy;
      const side = relX * sep.nx + relY * sep.ny >= 0 ? 1 : -1;
      px += side * sep.delta * sep.nx;
      py += side * sep.delta * sep.ny;
    }
    projected.push({ x: px, y: py, z: z2 });
  }
  projected.sort((a, b) => b.z - a.z);
  const dots: Dot[] = projected.map((p) => ({
    x: p.x,
    y: p.y,
    r: GLOBE_DOT_R,
    a: alpha * (p.z > 0 ? 0.35 : 1),
  }));
  drawDots(ctx, color, dots, ink);
}

function StatusOrb({ status }: { status: Status }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { color, ink } = useOrbInk();
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const px = Math.round(SIZE * dpr);
    if (canvas.width !== px) canvas.width = px;
    canvas.height = px;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = SIZE / 2;
    const cy = SIZE / 2;

    const breath = (t: number) => {
      const s = Math.sin((t / 2400) * TWO_PI);
      return (s >= 0 ? s : s * 0.4) * 1.3;
    };

    const drawIdle = (t: number) => {
      ctx.clearRect(0, 0, SIZE, SIZE);
      drawGlobe(
        ctx,
        color,
        {
          cx,
          cy,
          radius: GLOBE_R + breath(t),
          spin: 0,
          tilt: 0.4,
          alpha: 0.9,
        },
        ink,
      );
    };

    const drawApproved = (t: number, finalFrame: boolean) => {
      ctx.clearRect(0, 0, SIZE, SIZE);
      if (finalFrame) {
        drawGlobe(
          ctx,
          color,
          {
            cx,
            cy,
            radius: GLOBE_R,
            spin: 0,
            tilt: 0.4,
            alpha: 0.9,
          },
          ink,
        );
        drawDots(
          ctx,
          color,
          [{ x: cx + ORBIT_R, y: cy, r: SAT_R, a: 0.95 }],
          ink,
        );
        return;
      }
      const fp = clamp01(t / FLASH_MS);
      const e = easeOutExpo(fp);

      const theta = ORBIT_SPEED * t;
      const dist = lerp(GLOBE_R + SAT_R, ORBIT_R, e);
      const cosX = Math.cos(0.4);
      const sinX = Math.sin(0.4);
      const ox = Math.cos(theta) * dist;
      const oy = -Math.sin(theta) * dist * Math.sin(ORBIT_TILT);
      const oz = Math.sin(theta) * dist * Math.cos(ORBIT_TILT);
      const y2 = oy * cosX - oz * sinX;
      const z2 = oy * sinX + oz * cosX;
      const sx = cx + ox;
      const sy = cy - y2;

      trail.push({ x: sx, y: sy, z: z2 });
      if (trail.length > TRAIL_LEN) trail.shift();

      const drawTrailSegment = (i: number) => {
        const a = trail[i];
        const b = trail[i + 1];
        const f = (i + 1) / (TRAIL_LEN - 1);
        ctx.globalAlpha = ink(0.55 * f);
        ctx.strokeStyle = color;
        ctx.lineWidth = lerp(0.35, 1.15, f);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      };

      for (let i = 0; i < trail.length - 1; i++) {
        if (trail[i].z > 0) drawTrailSegment(i);
      }
      if (z2 > 0) {
        drawDots(ctx, color, [{ x: sx, y: sy, r: SAT_R, a: 0.4 }], ink);
      }

      drawGlobe(
        ctx,
        color,
        {
          cx,
          cy,
          radius: GLOBE_R + breath(t),
          spin: 0,
          tilt: 0.4,
          alpha: 0.9,
        },
        ink,
      );

      const flashA = (1 - fp) * 0.85;
      if (flashA > 0.01) {
        ctx.save();
        ctx.globalAlpha = flashA;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(cx, cy, lerp(0.6, ORBIT_R, e), 0, TWO_PI);
        ctx.stroke();
        ctx.restore();
      }

      for (let i = 0; i < trail.length - 1; i++) {
        if (trail[i].z <= 0) drawTrailSegment(i);
      }
      if (z2 <= 0) {
        drawDots(ctx, color, [{ x: sx, y: sy, r: SAT_R, a: 0.95 }], ink);
      }
      ctx.globalAlpha = 1;
    };

    const drawDenied = (t: number, finalFrame: boolean) => {
      ctx.clearRect(0, 0, SIZE, SIZE);
      const g = finalFrame ? 1 : clamp01(t / SPLIT_MS);
      const delta = easeOutCubic(g) * 3.5;
      drawGlobe(
        ctx,
        color,
        {
          cx,
          cy,
          radius: GLOBE_R,
          spin: 0,
          tilt: 0.4,
          alpha: 0.85,
          sep: { nx: 0.7071, ny: -0.7071, delta },
        },
        ink,
      );
      const flashA = finalFrame
        ? 0
        : Math.sin(Math.PI * clamp01(t / FLASH_MS)) * 0.9;
      if (flashA > 0.01) {
        ctx.save();
        ctx.globalAlpha = flashA;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(cx - 7, cy - 7);
        ctx.lineTo(cx + 7, cy + 7);
        ctx.stroke();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    };

    if (reduced) {
      if (status === "idle") {
        drawIdle(0);
      } else if (status === "approved") {
        drawApproved(0, true);
      } else {
        drawDenied(0, true);
      }
      return;
    }

    let raf = 0;
    let start = 0;
    const trail: { x: number; y: number; z: number }[] = [];
    const loop = (now: number) => {
      if (start === 0) start = now;
      const t = now - start;
      if (status === "idle") {
        drawIdle(t);
        raf = requestAnimationFrame(loop);
      } else if (status === "approved") {
        drawApproved(t, false);
        raf = requestAnimationFrame(loop);
      } else {
        drawDenied(t, false);
        raf = requestAnimationFrame(loop);
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [status, color, ink, reduced]);

  return (
    <canvas
      ref={ref}
      width={SIZE}
      height={SIZE}
      aria-hidden="true"
      className="size-7"
    />
  );
}

export function ApprovalCard({
  command,
  description,
  tool = "shell",
  risk = "high",
  approveLabel = "Approve",
  denyLabel = "Deny",
  onApprove,
  onDeny,
  className,
}: ApprovalCardProps) {
  const [status, setStatus] = useState<Status>("idle");

  const approve = () => {
    if (status !== "idle") return;
    setStatus("approved");
    onApprove?.();
  };

  const deny = () => {
    if (status !== "idle") return;
    setStatus("denied");
    onDeny?.();
  };

  useEffect(() => {
    if (status !== "idle") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
        approve();
      } else if (event.key === "Escape") {
        deny();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div
      className={cn(
        "border-strong w-full max-w-sm rounded-xl border bg-elevated p-5",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <span className="font-mono text-[10px] uppercase tracking-widest text-fg-subtle">
          {tool}
        </span>
        <StatusOrb status={status} />
        <span
          className={cn(
            "font-mono text-[10px] uppercase tracking-widest",
            RISK_CLASSES[risk],
          )}
        >
          {risk}
        </span>
      </div>

      <p className="mt-6 font-mono text-base leading-relaxed text-fg">
        <span className="select-none text-fg-subtle">$ </span>
        {command}
      </p>

      {description && (
        <p className="mt-2 text-sm leading-relaxed text-fg-muted">
          {description}
        </p>
      )}

      <div className="bg-border-muted mt-6 h-px" aria-hidden="true" />

      <div className="mt-4 flex h-9 items-center justify-end gap-2">
        <button
          type="button"
          onClick={deny}
          disabled={status === "denied"}
          className={cn(
            buttonVariants({ variant: "secondary", size: "md" }),
            status === "approved" && "opacity-50",
          )}
        >
          {status === "denied" ? "Denied" : denyLabel}
        </button>
        <button
          type="button"
          onClick={approve}
          disabled={status === "approved"}
          className={cn(
            buttonVariants({ variant: "primary", size: "md" }),
            status === "denied" && "opacity-50",
          )}
        >
          {status === "approved" ? "Approved" : approveLabel}
        </button>
      </div>

      <span className="sr-only" role="status" aria-live="polite">
        {status === "approved" && "Approved"}
        {status === "denied" && "Denied"}
      </span>
    </div>
  );
}

export function DemoApprovalCard() {
  const [key, setKey] = useState(0);
  const widget = (
    <ApprovalCard
      key={key}
      command="rm -rf .next/cache"
      description="Deletes the stale build cache so the next dev run starts clean. This cannot be undone."
    />
  );

  return (
    <div className="flex flex-col items-center gap-3">
      {widget}
      <button
        type="button"
        onClick={() => setKey((k) => k + 1)}
        className="font-mono text-[10px] uppercase tracking-widest text-fg-subtle transition-colors hover:text-fg"
      >
        Reset
      </button>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { StageLock } from "@/components/ui/stage-lock";
import { useOrbInk } from "@/hooks/use-orb-ink";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const LEAD_MS = 400;
const ROW_GAP_MS = 320;
const BEAT_MS = 350;
const HOLD_MS = 1400;
const DRAIN_MS = 180;
const NODE_SIZE = 20;
const RING_R = 8;
const GLOBE_R = 4.1;
const GLOBE_DOT_R = 0.55;
const TILT = 0.35;
const IGNITE_MS = 220;
const SETTLE_MS = 240;
const ERROR_PCT = 0.68;
const STATIC_PROGRESS = 0.5;
const TWO_PI = Math.PI * 2;

type Phase = "q" | "r" | "d" | "e";
type TaskStatus = "pending" | "running" | "done" | "error";

interface TaskRow {
  id: string;
  label: string;
  duration: number;
  error?: boolean;
}

interface TaskRowsProps {
  rows: TaskRow[];
  loop?: boolean;
  className?: string;
}

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface Dot {
  x: number;
  y: number;
  r: number;
  a: number;
}

const GLOBE_RINGS = [
  { y: -0.55, count: 5 },
  { y: 0, count: 7 },
  { y: 0.55, count: 5 },
];

export const GLOBE_POINTS: Point3D[] = [];
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

function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function phaseAt(
  t: number,
  start: number,
  duration: number,
  error: boolean,
): Phase {
  if (t < start) return "q";
  if (t < start + duration + BEAT_MS) return "r";
  return error ? "e" : "d";
}

function toStatus(phase: Phase): TaskStatus {
  if (phase === "q") return "pending";
  if (phase === "r") return "running";
  return phase === "d" ? "done" : "error";
}

function drawDots(ctx: CanvasRenderingContext2D, color: string, dots: Dot[]) {
  for (const d of dots) {
    ctx.globalAlpha = d.a;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, TWO_PI);
    ctx.fill();
  }
}

export interface GlobeOpts {
  cx: number;
  cy: number;
  radius: number;
  spin: number;
  spread: number;
  alpha: number;
  split?: number;
}

export function drawGlobe(
  ctx: CanvasRenderingContext2D,
  color: string,
  o: GlobeOpts,
) {
  const cosY = Math.cos(o.spin);
  const sinY = Math.sin(o.spin);
  const cosX = Math.cos(TILT);
  const sinX = Math.sin(TILT);
  const dots: Dot[] = [];
  for (const p of GLOBE_POINTS) {
    const x = p.x * o.radius;
    const y = p.y * o.radius;
    const z = p.z * o.radius;
    const x1 = x * cosY + z * sinY;
    const z1 = -x * sinY + z * cosY;
    const y2 = y * cosX - z1 * sinX;
    const z2 = y * sinX + z1 * cosX;
    let px = o.cx + x1 * o.spread;
    let py = o.cy - y2 * o.spread;
    if (o.split) {
      const side = (px - o.cx) * 0.7071 - (py - o.cy) * 0.7071 >= 0 ? 1 : -1;
      px += side * o.split * 0.7071;
      py -= side * o.split * 0.7071;
    }
    dots.push({
      x: px,
      y: py,
      r: GLOBE_DOT_R,
      a: o.alpha * (z2 > 0 ? 0.35 : 1),
    });
  }
  drawDots(ctx, color, dots);
}

const RIGHT_WORD: Record<TaskStatus, string> = {
  pending: "queued",
  running: "",
  done: "done",
  error: "error",
};

const RIGHT_CLASS: Record<TaskStatus, string> = {
  pending: "text-fg-subtle",
  running: "text-fg",
  done: "text-fg-muted",
  error: "text-fg",
};

const LABEL_CLASS: Record<TaskStatus, string> = {
  pending: "text-fg-muted",
  running: "text-fg",
  done: "text-fg-muted",
  error: "text-fg-muted line-through decoration-fg-subtle",
};

const ENTER_DELAY = ["", "delay-75", "delay-150", "delay-200"];

function TaskRowItem({
  label,
  status,
  duration,
  error,
  last,
  comet,
  index,
}: {
  label: string;
  status: TaskStatus;
  duration: number;
  error: boolean;
  last: boolean;
  comet: boolean;
  index: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);
  const [mounted, setMounted] = useState(false);
  const [settled, setSettled] = useState(false);
  const { color, ink } = useOrbInk();
  const reduced = useReducedMotion();

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (status === "pending" || status === "running") {
      if (pctRef.current) pctRef.current.textContent = "";
      setSettled(false);
      return;
    }
    const raf = requestAnimationFrame(() => setSettled(true));
    return () => cancelAnimationFrame(raf);
  }, [status]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const px = Math.round(NODE_SIZE * dpr);
    canvas.width = px;
    canvas.height = px;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = NODE_SIZE / 2;
    const cy = NODE_SIZE / 2;

    const dot = (x: number, y: number, r: number, a: number) => {
      ctx.globalAlpha = ink(a);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TWO_PI);
      ctx.fill();
    };

    const ring = (a: number) => {
      ctx.globalAlpha = ink(a);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, RING_R, 0, TWO_PI);
      ctx.stroke();
    };

    const arc = (prog: number, a: number) => {
      if (prog <= 0.001) return;
      ctx.globalAlpha = ink(a);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(cx, cy, RING_R, -Math.PI / 2, -Math.PI / 2 + prog * TWO_PI);
      ctx.stroke();
    };

    const headDot = (prog: number, a: number) => {
      const ang = -Math.PI / 2 + prog * TWO_PI;
      dot(cx + Math.cos(ang) * RING_R, cy + Math.sin(ang) * RING_R, 1.3, a);
    };

    const breath = (t: number) => Math.sin((t / 1600) * TWO_PI) * 0.3;

    const drawPending = () => {
      ctx.clearRect(0, 0, NODE_SIZE, NODE_SIZE);
      ring(0.22);
      dot(cx, cy, 0.9, 0.15);
    };

    const drawRun = (t: number) => {
      ctx.clearRect(0, 0, NODE_SIZE, NODE_SIZE);
      const k = easeOutCubic(clamp01(t / IGNITE_MS));
      const target = error ? ERROR_PCT : 1;
      const prog = easeOutCubic(clamp01(t / duration)) * target;
      ring(0.22 + 0.1 * k);
      drawGlobe(ctx, color, {
        cx,
        cy,
        radius: GLOBE_R + breath(t),
        spin: t * 0.0006,
        spread: lerp(1.8, 1, k),
        alpha: ink(k * 0.9),
      });
      arc(prog, 0.9 * k);
      headDot(prog, 0.95 * k);
      if (pctRef.current) {
        pctRef.current.textContent = `${Math.round(prog * 100)}%`;
      }
    };

    const drawRunStatic = () => {
      ctx.clearRect(0, 0, NODE_SIZE, NODE_SIZE);
      ring(0.32);
      drawGlobe(ctx, color, {
        cx,
        cy,
        radius: GLOBE_R,
        spin: 0.6,
        spread: 1,
        alpha: ink(0.9),
      });
      arc(STATIC_PROGRESS, 0.9);
      headDot(STATIC_PROGRESS, 0.95);
      if (pctRef.current) {
        pctRef.current.textContent = `${Math.round(STATIC_PROGRESS * 100)}%`;
      }
    };

    const drawDone = (t: number) => {
      ctx.clearRect(0, 0, NODE_SIZE, NODE_SIZE);
      const q = easeOutCubic(clamp01(t / SETTLE_MS));
      ring(lerp(0.32, 0.22, q));
      if (q < 1) {
        ctx.globalAlpha = ink((1 - q) * 0.5);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(cx, cy, lerp(RING_R, RING_R + 4, q), 0, TWO_PI);
        ctx.stroke();
      }
      drawGlobe(ctx, color, {
        cx,
        cy,
        radius: GLOBE_R,
        spin: 0.6,
        spread: lerp(1, 0.15, q),
        alpha: ink((1 - q) * 0.9),
      });
      arc(1, (1 - q) * 0.9);
      dot(cx, cy, lerp(1, 2.2, q), lerp(0.75, 0.95, q));
    };

    const drawError = (t: number) => {
      ctx.clearRect(0, 0, NODE_SIZE, NODE_SIZE);
      const q = easeOutCubic(clamp01(t / SETTLE_MS));
      ring(0.22);
      arc(ERROR_PCT, lerp(0.9, 0.3, q));
      drawGlobe(ctx, color, {
        cx,
        cy,
        radius: GLOBE_R,
        spin: 0.6,
        spread: 1,
        alpha: ink(0.85),
        split: q * 3.2,
      });
    };

    if (reduced) {
      if (status === "pending") drawPending();
      else if (status === "running") drawRunStatic();
      else if (status === "done") drawDone(SETTLE_MS + 10);
      else drawError(SETTLE_MS + 10);
      return;
    }

    if (status === "pending") {
      drawPending();
      return;
    }

    let raf = 0;
    let start = 0;
    const frame = (now: number) => {
      if (start === 0) start = now;
      const t = now - start;
      if (status === "running") {
        drawRun(t);
        raf = requestAnimationFrame(frame);
        return;
      }
      if (status === "done") drawDone(t);
      else drawError(t);
      if (t >= SETTLE_MS) return;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [status, duration, error, color, ink, reduced]);

  const traveled = status === "done" || status === "error";

  return (
    <div
      className={cn(
        "flex gap-3 transition-all duration-300 ease-out",
        ENTER_DELAY[index] ?? "",
        mounted ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
      )}
    >
      <div className="flex w-5 shrink-0 flex-col items-center">
        <canvas
          ref={canvasRef}
          width={NODE_SIZE}
          height={NODE_SIZE}
          aria-hidden="true"
          className="size-5"
        />
        {!last && (
          <div
            aria-hidden="true"
            className={cn(
              "relative w-px flex-1",
              traveled ? "bg-border-strong" : "bg-border-muted",
            )}
          >
            {comet && (
              <span className="animate-comet absolute left-1/2 -ml-0.5 size-1 rounded-full bg-fg" />
            )}
          </div>
        )}
      </div>
      <div className="flex flex-1 items-center justify-between gap-3 pb-5">
        <span className={cn("font-mono text-xs", LABEL_CLASS[status])}>
          {label}
        </span>
        <span className="relative grid font-mono text-[10px]">
          <span
            ref={pctRef}
            className={cn(
              "col-start-1 row-start-1 tabular-nums transition-opacity duration-200",
              RIGHT_CLASS[status],
              settled ? "opacity-0" : "opacity-100",
            )}
          >
            {""}
          </span>
          <span
            className={cn(
              "col-start-1 row-start-1 transition-opacity delay-150 duration-200",
              RIGHT_CLASS[status],
              settled ? "opacity-100" : "opacity-0",
            )}
          >
            {RIGHT_WORD[status]}
          </span>
        </span>
      </div>
    </div>
  );
}

export function TaskRows({ rows, loop = false, className }: TaskRowsProps) {
  const [elapsed, setElapsed] = useState(0);
  const [announce, setAnnounce] = useState("");
  const [cycle, setCycle] = useState(0);
  const [draining, setDraining] = useState(false);
  const reduced = useReducedMotion();

  const { starts, total, terminal } = useMemo(() => {
    const s: number[] = [];
    let t = LEAD_MS;
    for (const row of rows) {
      s.push(t);
      t += row.duration + BEAT_MS + ROW_GAP_MS;
    }
    return {
      starts: s,
      total: rows.length > 0 ? t - ROW_GAP_MS : 0,
      terminal: rows.map((r) => (r.error ? "e" : "d")).join(""),
    };
  }, [rows]);

  useEffect(() => {
    if (reduced || rows.length === 0) return;

    let raf = 0;
    let start = 0;
    let prev = "";
    let drainStart = 0;
    const frame = (now: number) => {
      if (start === 0) start = now;
      let t = now - start;
      if (drainStart > 0) {
        if (now - drainStart < DRAIN_MS) {
          raf = requestAnimationFrame(frame);
          return;
        }
        drainStart = 0;
        setDraining(false);
        setCycle((c) => c + 1);
        start = now;
        t = 0;
      } else if (loop && t >= total + HOLD_MS) {
        drainStart = now;
        setDraining(true);
      }
      const snap = rows
        .map((row, i) =>
          phaseAt(t, starts[i], row.duration, Boolean(row.error)),
        )
        .join("");
      if (snap !== prev) {
        const oldSnap = prev;
        prev = snap;
        setElapsed(t);
        const events: string[] = [];
        for (let i = 0; i < snap.length; i++) {
          if (snap[i] === oldSnap[i]) continue;
          const label = rows[i].label;
          if (snap[i] === "r") events.push(`${label} running`);
          else if (snap[i] === "d") events.push(`${label} complete`);
          else if (snap[i] === "e") events.push(`${label} failed`);
        }
        if (events.length > 0) setAnnounce(events.join(", "));
      }
      if (!loop && snap === terminal) return;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [rows, loop, reduced, starts, total, terminal]);

  useEffect(() => {
    if (reduced) {
      setAnnounce(
        rows
          .map((r) => `${r.label} ${r.error ? "failed" : "complete"}`)
          .join(", "),
      );
    }
  }, [reduced, rows]);

  if (rows.length === 0) return null;

  const runIdx = Math.min(2, rows.length - 1);

  const snapNow = rows
    .map((row, i) =>
      reduced
        ? i < runIdx
          ? "d"
          : i === runIdx
            ? "r"
            : "q"
        : phaseAt(elapsed, starts[i], row.duration, Boolean(row.error)),
    )
    .join("");
  const finished = snapNow === terminal;
  const errorCount = rows.filter((r) => r.error).length;
  const summary = [
    `${rows.length - errorCount} done`,
    errorCount > 0 ? `${errorCount} failed` : "",
    `${(total / 1000).toFixed(1)}s`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <StageLock className={className}>
        <div
          key={cycle}
          aria-hidden="true"
          className={cn(
            "flex flex-col transition-opacity duration-150",
            draining && "opacity-0",
          )}
        >
          {rows.map((row, i) => {
            const status = reduced
              ? i < runIdx
                ? "done"
                : i === runIdx
                  ? "running"
                  : "pending"
              : toStatus(
                  phaseAt(elapsed, starts[i], row.duration, Boolean(row.error)),
                );
            const next = rows[i + 1];
            const comet =
              !reduced &&
              next != null &&
              status === "done" &&
              toStatus(
                phaseAt(
                  elapsed,
                  starts[i + 1],
                  next.duration,
                  Boolean(next.error),
                ),
              ) === "pending";
            return (
              <TaskRowItem
                key={row.id}
                label={row.label}
                status={status}
                duration={row.duration}
                error={Boolean(row.error)}
                last={i === rows.length - 1}
                comet={comet}
                index={i}
              />
            );
          })}
          <div
            className={cn(
              "flex justify-end transition-all duration-500 ease-out",
              finished
                ? "translate-y-0 opacity-100"
                : "translate-y-1 opacity-0",
            )}
          >
            <span className="font-mono text-[10px] tracking-wide text-fg-subtle">
              {summary}
            </span>
          </div>
        </div>
      </StageLock>
      <span className="sr-only" role="status" aria-live="polite">
        {announce}
      </span>
    </>
  );
}

const DEMO_ROWS: TaskRow[] = [
  { id: "scan", label: "scan_repo", duration: 1200 },
  { id: "map", label: "map_deps", duration: 1700 },
  { id: "plan", label: "plan_edit", duration: 1500 },
  { id: "verify", label: "verify_build", duration: 2400, error: true },
];

export function DemoTaskRows() {
  const [key, setKey] = useState(0);
  const widget = (
    <div className="border-strong w-full max-w-sm rounded-xl border bg-elevated p-5">
      <span className="font-mono text-[10px] uppercase tracking-widest text-fg-subtle">
        Tasks
      </span>
      <TaskRows key={key} rows={DEMO_ROWS} loop className="mt-4" />
    </div>
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

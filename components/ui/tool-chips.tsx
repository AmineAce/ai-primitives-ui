"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { StageLock } from "@/components/ui/stage-lock";
import { useOrbInk } from "@/hooks/use-orb-ink";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const ENTER_MS = 180;
const GAP_MS = 240;
const LEAD_MS = 350;
const HOLD_MS = 900;
const DRAIN_MS = 180;
const ORB_SIZE = 16;
const TWO_PI = Math.PI * 2;

interface ToolStep {
  label: string;
  duration: number;
}

interface ToolChipsProps {
  script: ToolStep[];
  loop?: boolean;
  className?: string;
}

type Phase = "p" | "r" | "d";

function buildTimeline(script: ToolStep[]): number[] {
  const starts: number[] = [];
  let t = LEAD_MS;
  for (const step of script) {
    starts.push(t);
    t += ENTER_MS + step.duration + GAP_MS;
  }
  return starts;
}

function phaseAt(t: number, start: number, duration: number): Phase {
  if (t < start) return "p";
  if (t < start + ENTER_MS + duration) return "r";
  return "d";
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeOutCubic(p: number): number {
  return 1 - Math.pow(1 - p, 3);
}

export function MiniOrb({ done }: { done: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { color, ink } = useOrbInk();
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const px = Math.round(ORB_SIZE * dpr);
    canvas.width = px;
    canvas.height = px;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = ORB_SIZE / 2;
    const cy = ORB_SIZE / 2;
    const SPIN1 = 0.0038;
    const SPIN2 = 0.0027;
    const COLLAPSE_MS = 140;

    const breath = (t: number) => Math.sin((t / 1500) * TWO_PI) * 0.35;

    const dot = (x: number, y: number, r: number, a: number) => {
      ctx.globalAlpha = ink(a);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TWO_PI);
      ctx.fill();
    };

    const satellites = (t: number) => {
      const rx = 5.4 + breath(t);
      const ry = 3.1 + breath(t) * 0.5;
      const a1 = t * SPIN1;
      const a2 = -t * SPIN2 + 1.1;
      return [
        { x: cx + Math.cos(a1) * rx, y: cy - Math.sin(a1) * ry },
        { x: cx + Math.cos(a2) * rx, y: cy - Math.sin(a2) * ry },
      ];
    };

    const drawRun = (t: number) => {
      const enter = Math.min(1, t / ENTER_MS);
      const k = easeOutCubic(enter);
      satellites(t)
        .sort((a, b) => a.y - b.y)
        .forEach((s) => {
          const back = s.y < cy;
          const x = cx + (s.x - cx) * k;
          const y = cy + (s.y - cy) * k;
          dot(x, y, back ? 0.7 : 0.9, enter * (back ? 0.4 : 0.95));
        });
      dot(cx, cy, (0.85 + breath(t) * 0.2) * k, enter * 0.75);
    };

    const drawDone = (t: number) => {
      const p = Math.min(1, t / COLLAPSE_MS);
      const q = easeOutCubic(p);
      satellites(t).forEach((s) => {
        dot(lerp(s.x, cx, q), lerp(s.y, cy, q), 0.9 * (1 - q), 0.95 * (1 - q));
      });
      dot(cx, cy, lerp(0.85, 1.9, q), lerp(0.75, 0.95, q));
    };

    if (reduced) {
      if (done) drawDone(COLLAPSE_MS + 10);
      else drawRun(600);
      return;
    }

    let raf = 0;
    let start = 0;
    const frame = (now: number) => {
      if (start === 0) start = now;
      const t = now - start;
      if (done) {
        drawDone(t);
        if (t >= COLLAPSE_MS) return;
      } else {
        drawRun(t);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [done, color, ink, reduced]);

  return (
    <canvas
      ref={ref}
      width={ORB_SIZE}
      height={ORB_SIZE}
      aria-hidden="true"
      className="size-4"
    />
  );
}

function ToolChip({
  label,
  done,
  visible,
}: {
  label: string;
  done: boolean;
  visible: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex h-7 items-center gap-2 transition-all duration-200 ease-out",
        visible ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0",
      )}
    >
      {visible ? (
        <MiniOrb done={done} />
      ) : (
        <span aria-hidden="true" className="size-4" />
      )}
      <span
        className={cn(
          "font-mono text-xs transition-colors",
          done ? "text-fg-muted" : "text-fg",
        )}
      >
        {label}
      </span>
    </div>
  );
}

export function ToolChips({ script, loop = false, className }: ToolChipsProps) {
  const [elapsed, setElapsed] = useState(0);
  const [announce, setAnnounce] = useState("");
  const reduced = useReducedMotion();
  const [cycle, setCycle] = useState(0);
  const [draining, setDraining] = useState(false);

  const { starts, total } = useMemo(() => {
    const s = buildTimeline(script);
    const last = script[script.length - 1];
    return {
      starts: s,
      total: last ? s[s.length - 1] + ENTER_MS + last.duration : 0,
    };
  }, [script]);

  useEffect(() => {
    if (reduced) {
      setAnnounce(script.map((s) => `${s.label} complete`).join(", "));
      return;
    }
    if (script.length === 0) return;

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
      const snap = script
        .map((s, i) => phaseAt(t, starts[i], s.duration))
        .join("");
      if (snap !== prev) {
        const oldSnap = prev;
        prev = snap;
        setElapsed(t);
        const events: string[] = [];
        for (let i = 0; i < snap.length; i++) {
          const c = snap[i];
          if (c !== oldSnap[i]) {
            const label = script[i].label;
            if (c === "r") events.push(`${label} running`);
            else if (c === "d") events.push(`${label} complete`);
          }
        }
        if (events.length > 0) setAnnounce(events.join(", "));
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [script, loop, reduced, starts, total]);

  if (script.length === 0) return null;

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
          {script.map((step, i) => {
            const phase = reduced
              ? "d"
              : phaseAt(elapsed, starts[i], step.duration);
            return (
              <ToolChip
                key={i}
                label={step.label}
                done={phase === "d"}
                visible={phase !== "p"}
              />
            );
          })}
        </div>
      </StageLock>
      <span className="sr-only" role="status" aria-live="polite">
        {announce}
      </span>
    </>
  );
}

const DEMO_SCRIPT: ToolStep[] = [
  { label: "read_file", duration: 1100 },
  { label: "search", duration: 1700 },
  { label: "read_file", duration: 800 },
  { label: "write_file", duration: 1300 },
];

export function DemoToolChips() {
  const [key, setKey] = useState(0);
  const widget = (
    <div className="border-strong w-full max-w-sm rounded-xl border bg-elevated p-5">
      <span className="font-mono text-[10px] uppercase tracking-widest text-fg-subtle">
        Tools
      </span>
      <ToolChips key={key} script={DEMO_SCRIPT} loop className="mt-4" />
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

"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useOrbInk } from "@/hooks/use-orb-ink";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export interface RecommendationOption {
  key: string;
  title: React.ReactNode;
  description: React.ReactNode;
  short: string;
  signal: number;
  confidenceLabel: string;
  cta: string;
  ctaVariant?: "primary" | "secondary" | "ghost";
}

export interface RecommendationCardProps {
  prompt?: string;
  options: RecommendationOption[];
  defaultSelectedKey?: string;
  onAccept?: (key: string) => void;
  className?: string;
}

const NODE_SIZE = 14;
const RING_R = 5;
const TWO_PI = Math.PI * 2;

function ConfidenceMeter({ signal }: { signal: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { color, ink } = useOrbInk();
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
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

    const drawStatic = () => {
      ctx.clearRect(0, 0, NODE_SIZE, NODE_SIZE);
      if (signal === 0) {
        ring(0.22);
        dot(cx, cy, 0.9, 0.2);
        return;
      }
      ring(0.35);
      dot(cx, cy, 1, 0.55);
      const count = Math.min(3, Math.max(1, signal));
      for (let i = 0; i < count; i++) {
        const ang = -Math.PI / 2 + (i * TWO_PI) / count;
        dot(
          cx + Math.cos(ang) * RING_R,
          cy + Math.sin(ang) * RING_R,
          0.9,
          0.95,
        );
      }
    };

    if (reduced || signal === 0) {
      drawStatic();
      if (signal === 0) return;
    }

    if (reduced) return;

    let raf = 0;
    let start = 0;
    const frame = (now: number) => {
      if (start === 0) start = now;
      const t = now - start;
      ctx.clearRect(0, 0, NODE_SIZE, NODE_SIZE);
      ring(0.35);
      dot(cx, cy, 1, 0.55);
      const count = Math.min(3, Math.max(1, signal));
      for (let i = 0; i < count; i++) {
        const base = (i * TWO_PI) / count;
        const speed = 0.0012 + i * 0.0004;
        const dir = i % 2 === 0 ? 1 : -1;
        const ang = -Math.PI / 2 + base + t * speed * dir;
        dot(
          cx + Math.cos(ang) * RING_R,
          cy + Math.sin(ang) * RING_R,
          0.9,
          0.95,
        );
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [signal, color, ink, reduced]);

  return (
    <canvas
      ref={ref}
      width={NODE_SIZE}
      height={NODE_SIZE}
      aria-hidden="true"
      className="size-3.5 shrink-0"
    />
  );
}

export function RecommendationCard({
  prompt = "Want me to place this restock order?",
  options,
  defaultSelectedKey,
  onAccept,
  className,
}: RecommendationCardProps) {
  const [selected, setSelected] = useState(
    defaultSelectedKey ?? options[0]?.key ?? "",
  );
  const [open, setOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [announce, setAnnounce] = useState("");

  const active = options.find((o) => o.key === selected) ?? options[0] ?? null;
  const others = options.filter((o) => o.key !== selected);

  if (!active) return null;

  return (
    <div
      className={cn(
        "border-strong w-full max-w-sm overflow-hidden rounded-xl border bg-elevated",
        className,
      )}
    >
      <div className="p-5">
        <span className="text-sm font-medium text-fg">{prompt}</span>
        <p
          key={active.key}
          className="mt-1.5 min-h-12 text-sm leading-relaxed text-fg-muted"
          style={{ animation: "fade-in 180ms ease-out both" }}
        >
          {active.title}
          {active.description ? (
            <span className="text-fg-muted"> · {active.description}</span>
          ) : null}
        </p>
      </div>

      <div
        className="grid transition-[grid-template-rows,opacity] duration-300"
        style={{
          gridTemplateRows: open ? "1fr" : "0fr",
          opacity: open ? 1 : 0,
          transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div className="overflow-hidden">
          <div className="border-t border-muted bg-elevated px-2 py-2">
            <p className="px-1.5 pb-1 font-mono text-[10px] uppercase tracking-widest text-fg-subtle">
              Other options
            </p>
            {others.map((o, i) => (
              <button
                key={o.key}
                type="button"
                onClick={() => {
                  setSelected(o.key);
                  setAccepted(false);
                  setAnnounce(`${o.short} selected`);
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-1.5 py-1.5 text-left transition-colors hover:bg-surface",
                  i === 0 && "delay-75",
                  i === 1 && "delay-150",
                )}
              >
                <ConfidenceMeter signal={o.signal} />
                <span className="min-w-0 flex-1 truncate font-mono text-xs text-fg">
                  {o.short}
                </span>
                <span className="shrink-0 font-mono text-[10px] text-fg-subtle">
                  {o.confidenceLabel}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-muted bg-elevated px-5 py-4">
        <span className="flex items-center gap-2">
          <ConfidenceMeter signal={active.signal} />
          <span className="font-mono text-xs text-fg-muted">
            {active.confidenceLabel}
          </span>
        </span>
        <span className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            Alternatives
          </Button>
          <Button
            variant={accepted ? "primary" : (active.ctaVariant ?? "primary")}
            size="sm"
            onClick={() => {
              setAccepted(true);
              setAnnounce(`${active.short} accepted`);
              onAccept?.(active.key);
            }}
          >
            {accepted ? "Accepted" : active.cta}
          </Button>
        </span>
      </div>
      <span className="sr-only" role="status" aria-live="polite">
        {announce}
      </span>
    </div>
  );
}

const DEMO_OPTIONS: RecommendationOption[] = [
  {
    key: "high",
    title: "Reorder waffle cones",
    description: "7-day lead from Cone King",
    short: "Reorder from Cone King · 7-day lead",
    signal: 3,
    confidenceLabel: "High",
    cta: "Accept",
    ctaVariant: "primary",
  },
  {
    key: "review",
    title: "Switch vanilla",
    description: "Vanilla Madagascar for peak season",
    short: "Switch to Vanilla Madagascar",
    signal: 2,
    confidenceLabel: "Medium",
    cta: "Configure",
    ctaVariant: "secondary",
  },
  {
    key: "none",
    title: "Full restock",
    description: "Every SKU",
    short: "Full restock across every SKU",
    signal: 0,
    confidenceLabel: "Low",
    cta: "Accept full restock",
    ctaVariant: "secondary",
  },
];

export function DemoRecommendationCard() {
  const [key, setKey] = useState(0);
  return (
    <div className="flex flex-col items-center gap-3">
      <RecommendationCard
        key={key}
        options={DEMO_OPTIONS}
        prompt="Want me to place this restock order?"
      />
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

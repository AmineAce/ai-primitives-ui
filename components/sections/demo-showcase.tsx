"use client";

import type { ComponentType } from "react";
import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Container } from "@/components/ui/container";
import { primitives } from "@/lib/primitives";
import { cn } from "@/lib/utils";
import { useOrbInk } from "@/hooks/use-orb-ink";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { DemoApprovalCard } from "@/components/ui/approval-card";
import { DemoToolChips } from "@/components/ui/tool-chips";
import { DemoTaskRows } from "@/components/ui/task-rows";
import { DemoChat } from "@/components/ui/chat";
import { DemoRecommendationCard } from "@/components/ui/recommendation-card";
import { DemoContextCards } from "@/components/ui/context-cards";
import { DemoDiffTable } from "@/components/ui/diff-table";

function CanvasSkeleton() {
  return <div className="bg-border-muted size-16 animate-pulse rounded-full" />;
}

const CloningOrb = dynamic(
  () => import("@ai-primitives-ui/ui").then((m) => m.CloningOrb),
  { ssr: false, loading: CanvasSkeleton },
);
const FetchingOrb = dynamic(
  () => import("@ai-primitives-ui/ui").then((m) => m.FetchingOrb),
  { ssr: false, loading: CanvasSkeleton },
);
const PullingOrb = dynamic(
  () => import("@ai-primitives-ui/ui").then((m) => m.PullingOrb),
  { ssr: false, loading: CanvasSkeleton },
);
const PushingOrb = dynamic(
  () => import("@ai-primitives-ui/ui").then((m) => m.PushingOrb),
  { ssr: false, loading: CanvasSkeleton },
);
const MergingOrb = dynamic(
  () => import("@ai-primitives-ui/ui").then((m) => m.MergingOrb),
  { ssr: false, loading: CanvasSkeleton },
);
const RebasingOrb = dynamic(
  () => import("@ai-primitives-ui/ui").then((m) => m.RebasingOrb),
  { ssr: false, loading: CanvasSkeleton },
);
const StashingOrb = dynamic(
  () => import("@ai-primitives-ui/ui").then((m) => m.StashingOrb),
  { ssr: false, loading: CanvasSkeleton },
);
const SyncOrb = dynamic(
  () => import("@ai-primitives-ui/ui").then((m) => m.SyncOrb),
  { ssr: false, loading: CanvasSkeleton },
);
const CubeOrb = dynamic(
  () => import("@ai-primitives-ui/ui").then((m) => m.CubeOrb),
  { ssr: false, loading: CanvasSkeleton },
);
const ScanOrb = dynamic(
  () => import("@ai-primitives-ui/ui").then((m) => m.ScanOrb),
  { ssr: false, loading: CanvasSkeleton },
);
const StreamingText = dynamic(
  () => import("@ai-primitives-ui/ui").then((m) => m.StreamingText),
  {
    ssr: false,
    loading: () => (
      <div className="bg-border-muted h-10 w-48 animate-pulse rounded" />
    ),
  },
);

function LoopStreamingText() {
  return <StreamingText loop />;
}

function ComingSoonOrb() {
  const ref = useRef<HTMLCanvasElement>(null);
  const { color, ink } = useOrbInk();
  const reduced = useReducedMotion();
  const colorRef = useRef(color);
  const inkRef = useRef(ink);
  const inViewRef = useRef(true);

  useEffect(() => {
    colorRef.current = color;
  }, [color]);

  useEffect(() => {
    inkRef.current = ink;
  }, [ink]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        inViewRef.current = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0, rootMargin: "100px" },
    );
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!reduced) return;
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = 64;
    const px = Math.round(size * dpr);
    canvas.width = px;
    canvas.height = px;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cx = size / 2;
    const cy = size / 2;
    const R = 28;
    ctx.clearRect(0, 0, size, size);
    ctx.globalAlpha = ink(0.35);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = ink(0.18);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = ink(0.9);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(
      cx + Math.cos(-Math.PI / 2) * R,
      cy + Math.sin(-Math.PI / 2) * R,
      2,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }, [color, ink, reduced]);

  useEffect(() => {
    if (reduced) return;
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = 64;
    const px = Math.round(size * dpr);
    canvas.width = px;
    canvas.height = px;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = size / 2;
    const cy = size / 2;
    const R = 28;

    const draw = (t: number) => {
      ctx.clearRect(0, 0, size, size);
      ctx.globalAlpha = inkRef.current(0.35);
      ctx.strokeStyle = colorRef.current;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = inkRef.current(0.18);
      ctx.fillStyle = colorRef.current;
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();
      const ang = -Math.PI / 2 + t * 0.0012;
      const x = cx + Math.cos(ang) * R;
      const y = cy + Math.sin(ang) * R;
      ctx.globalAlpha = inkRef.current(0.9);
      ctx.fillStyle = colorRef.current;
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    };

    let raf = 0;
    let start = 0;
    const frame = (now: number) => {
      if (!inViewRef.current || document.hidden) {
        raf = requestAnimationFrame(frame);
        return;
      }
      if (start === 0) start = now;
      draw(now - start);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  return (
    <canvas
      ref={ref}
      width={64}
      height={64}
      aria-hidden="true"
      className="size-16"
    />
  );
}

const PRIMITIVE_COMPONENTS: Record<string, ComponentType> = {
  cloning: CloningOrb,
  sync: SyncOrb,
  fetching: FetchingOrb,
  pulling: PullingOrb,
  pushing: PushingOrb,
  merging: MergingOrb,
  rebasing: RebasingOrb,
  stashing: StashingOrb,
  thinking: CubeOrb,
  scan: ScanOrb,
  "streaming-text": LoopStreamingText,
  "approval-card": DemoApprovalCard,
  "tool-chips": DemoToolChips,
  "task-rows": DemoTaskRows,
  chat: DemoChat,
  "recommendation-card": DemoRecommendationCard,
  "context-cards": DemoContextCards,
  "diff-table": DemoDiffTable,
};

export function DemoShowcase() {
  return (
    <section className="border-t border-muted py-24">
      <Container>
        <h2 className="text-lg font-medium">Showcase</h2>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {primitives.map((primitive) => {
            const LiveComponent = PRIMITIVE_COMPONENTS[primitive.id];
            const isLive =
              primitive.status === "ready" && LiveComponent != null;

            return (
              <div
                key={primitive.id}
                className={cn(
                  "flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border bg-elevated p-8 text-center",
                  primitive.span === 2 && "md:col-span-2",
                )}
              >
                {isLive ? <LiveComponent /> : <ComingSoonOrb />}
                <h3 className="font-mono text-sm text-fg-default">
                  {primitive.name}
                </h3>
                <p className="text-xs leading-relaxed text-fg-subtle">
                  {primitive.description}
                </p>
                {!isLive && (
                  <span className="font-mono text-[10px] uppercase tracking-widest text-fg-subtle">
                    Coming soon
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

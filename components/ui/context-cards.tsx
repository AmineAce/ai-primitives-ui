"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useOrbInk } from "@/hooks/use-orb-ink";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const NODE_SIZE = 14;
const RING_R = 5;
const TWO_PI = Math.PI * 2;

export type ContextBlock =
  | { kind: "text"; text: string }
  | { kind: "image"; src: string; alt: string }
  | { kind: "video"; src: string }
  | { kind: "link"; href: string; label: string };

export interface Source {
  id: string;
  title: string;
  blocks: ContextBlock[];
  relevance: number;
}

interface ContextCardsProps {
  sources: Source[];
  onOpen?: (id: string) => void;
  className?: string;
}

function SourceNode({ relevance }: { relevance: number }) {
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

    const draw = (angleOffset: number) => {
      ctx.clearRect(0, 0, NODE_SIZE, NODE_SIZE);

      ctx.globalAlpha = ink(0.18);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, RING_R, 0, TWO_PI);
      ctx.stroke();

      ctx.globalAlpha = ink(0.9);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cx, cy, 1, 0, TWO_PI);
      ctx.fill();

      const count = Math.max(0, Math.min(3, relevance));
      for (let i = 0; i < count; i++) {
        const ang =
          -Math.PI / 2 + (i * TWO_PI) / Math.max(1, count) + angleOffset;
        const px = cx + Math.cos(ang) * RING_R;
        const py = cy + Math.sin(ang) * RING_R;

        ctx.globalAlpha = ink(0.28);
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(px, py);
        ctx.stroke();

        ctx.globalAlpha = ink(0.95);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(px, py, 0.9, 0, TWO_PI);
        ctx.fill();
      }
    };

    if (reduced || relevance === 0) {
      draw(0);
      return;
    }

    let raf = 0;
    let start = 0;
    const frame = (now: number) => {
      if (start === 0) start = now;
      draw((now - start) * 0.0009);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [relevance, color, ink, reduced]);

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

function ContextCard({
  source,
  onOpen,
}: {
  source: Source;
  onOpen?: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(
    source.blocks.find((b) => b.kind === "text")?.text ?? "",
  );
  const textBlock = source.blocks.find((b) => b.kind === "text");

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-inset text-left transition-colors",
        expanded ? "border-strong" : "hover:border-strong border-muted",
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-start gap-3 px-4 py-3 text-left"
      >
        <SourceNode relevance={source.relevance} />
        <span className="min-w-0 flex-1">
          <span className="block font-mono text-xs font-medium text-fg">
            {source.title}
          </span>
          {textBlock && !expanded && (
            <span className="mt-1 line-clamp-2 block font-mono text-[11px] leading-relaxed text-fg-muted">
              {editing ? draft : textBlock.text}
            </span>
          )}
        </span>
        <span className="shrink-0 font-mono text-[10px] text-fg-subtle">
          {expanded ? "−" : "+"}
        </span>
      </button>

      <div
        className="grid transition-[grid-template-rows,opacity] duration-300"
        style={{
          gridTemplateRows: expanded ? "1fr" : "0fr",
          opacity: expanded ? 1 : 0,
          transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div className="overflow-hidden">
          <div className="space-y-3 border-t border-muted px-4 py-3">
            {source.blocks.map((block, i) => {
              if (block.kind === "text") {
                return editing ? (
                  <textarea
                    key={i}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={3}
                    className="border-strong w-full rounded-md border bg-surface px-3 py-2 font-mono text-xs text-fg outline-none focus:border-fg"
                  />
                ) : (
                  <p
                    key={i}
                    className="font-mono text-xs leading-relaxed text-fg-muted"
                  >
                    {block.text}
                  </p>
                );
              }
              if (block.kind === "image") {
                return (
                  <img
                    key={i}
                    src={block.src}
                    alt={block.alt}
                    loading="lazy"
                    decoding="async"
                    width={600}
                    height={300}
                    className="w-full rounded-lg border border-muted object-cover"
                  />
                );
              }
              if (block.kind === "video") {
                return (
                  <video
                    key={i}
                    src={block.src}
                    controls
                    className="w-full rounded-lg border border-muted"
                  />
                );
              }
              return (
                <a
                  key={i}
                  href={block.href}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:border-strong inline-flex items-center gap-1.5 rounded-full border border-muted bg-surface px-3 py-1 font-mono text-xs text-fg transition-colors"
                >
                  <span className="size-1.5 rounded-full bg-fg" />
                  {block.label}
                </a>
              );
            })}
            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditing((v) => !v)}
              >
                {editing ? "Save" : "Edit"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpen?.(source.id)}
              >
                Open
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  navigator.clipboard?.writeText(
                    source.blocks
                      .map((b) => ("text" in b ? b.text : ""))
                      .join(" "),
                  )
                }
              >
                Copy
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ContextCards({
  sources,
  onOpen,
  className,
}: ContextCardsProps) {
  if (sources.length === 0) return null;
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {sources.map((s) => (
        <ContextCard key={s.id} source={s} onOpen={onOpen} />
      ))}
    </div>
  );
}

const DEMO_SOURCES: Source[] = [
  {
    id: "next-config",
    title: "next.config.ts",
    blocks: [
      {
        kind: "text",
        text: "The manifest points at stale chunks after the cache was deleted. The fix is to clear .next and rebuild.",
      },
      {
        kind: "link",
        href: "https://nextjs.org/docs",
        label: "Next.js docs →",
      },
    ],
    relevance: 3,
  },
  {
    id: "cache-memo",
    title: "Build cache memo",
    blocks: [
      {
        kind: "text",
        text: "Canvas orbs use fitRadius so every size renders as a full circle. Video and image blocks render inline.",
      },
      {
        kind: "image",
        src: "https://picsum.photos/seed/orbs/600/300",
        alt: "Demo image",
      },
    ],
    relevance: 2,
  },
];

export function DemoContextCards() {
  return (
    <div className="border-strong w-full max-w-sm rounded-xl border bg-elevated p-5">
      <span className="font-mono text-[10px] uppercase tracking-widest text-fg-subtle">
        Sources
      </span>
      <ContextCards sources={DEMO_SOURCES} className="mt-4" />
    </div>
  );
}

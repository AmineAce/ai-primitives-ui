"use client";

import { FileCode } from "lucide-react";
import { cn } from "@/lib/utils";

export type DiffLineType = "added" | "removed" | "context";

export interface DiffLine {
  type: DiffLineType;
  oldNo?: number;
  newNo?: number;
  content: string;
}

interface DiffTableProps {
  file?: string;
  lines: DiffLine[];
  className?: string;
}

function DiffGutter({ type }: { type: DiffLineType }) {
  if (type === "added") {
    return (
      <span aria-hidden="true" className="size-2 rounded-full bg-emerald-500" />
    );
  }
  if (type === "removed") {
    return (
      <span
        aria-hidden="true"
        className="size-2 rounded-full border border-red-500"
      />
    );
  }
  return (
    <span aria-hidden="true" className="bg-fg-subtle/40 size-1 rounded-full" />
  );
}

const KEYWORDS = new Set([
  "const",
  "let",
  "var",
  "function",
  "class",
  "return",
  "export",
  "default",
  "import",
  "from",
  "async",
  "await",
  "if",
  "else",
  "for",
  "while",
  "extends",
  "type",
  "interface",
  "enum",
]);

function CodeContent({
  content,
  type,
}: {
  content: string;
  type: DiffLineType;
}) {
  const base =
    type === "added"
      ? "text-fg"
      : type === "removed"
        ? "text-fg-muted"
        : "text-fg-muted";
  const parts = content.split(
    /(\bconst\b|\blet\b|\bvar\b|\bfunction\b|\bclass\b|\breturn\b|\bexport\b|\bdefault\b|\bimport\b|\bfrom\b|\basync\b|\bawait\b|\bif\b|\belse\b|\bfor\b|\bwhile\b|\bextends\b|\btype\b|\binterface\b|\benum\b)/,
  );
  return (
    <span className={base}>
      {parts.map((part, i) =>
        KEYWORDS.has(part) ? (
          <span key={i} className="font-medium text-fg">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </span>
  );
}

export function DiffTable({ file, lines, className }: DiffTableProps) {
  const added = lines.filter((l) => l.type === "added").length;
  const removed = lines.filter((l) => l.type === "removed").length;

  return (
    <div
      className={cn(
        "border-strong w-full overflow-hidden rounded-t-xl border bg-elevated",
        className,
      )}
    >
      {file && (
        <div className="flex items-center justify-between border-b border-muted bg-inset px-4 py-2">
          <span className="flex items-center gap-2 font-mono text-xs text-fg">
            <FileCode className="size-3.5 text-fg-subtle" />
            {file}
          </span>
          <span className="flex items-center gap-1.5 font-mono text-xs">
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-emerald-600">
              +{added}
            </span>
            <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-red-500">
              -{removed}
            </span>
          </span>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse font-mono text-xs">
          <thead className="sr-only">
            <tr>
              <th scope="col">Old</th>
              <th scope="col">New</th>
              <th scope="col">Type</th>
              <th scope="col">Code</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, i) => {
              const isLast = i === lines.length - 1;
              const accent =
                line.type === "added"
                  ? "bg-emerald-500/40"
                  : line.type === "removed"
                    ? "bg-red-500/30"
                    : "";
              const rowBg =
                line.type === "added"
                  ? "bg-emerald-500/[0.08] hover:bg-emerald-500/[0.12]"
                  : line.type === "removed"
                    ? "bg-red-500/[0.06] hover:bg-red-500/[0.10]"
                    : "";
              const rowBorder =
                line.type === "added"
                  ? "border-emerald-500/40"
                  : line.type === "removed"
                    ? "border-red-500/30"
                    : "border-transparent";
              return (
                <tr
                  key={i}
                  style={{
                    animation: "fade-in 180ms ease-out both",
                    animationDelay: `${i * 30}ms`,
                  }}
                  className={cn(
                    "border-l-2 transition-colors hover:bg-surface",
                    !isLast && [rowBorder, rowBg],
                    isLast && "border-transparent",
                  )}
                >
                  <td
                    className={cn(
                      "relative w-10 px-2 py-1 text-right tabular-nums text-fg-subtle",
                      isLast && rowBg,
                    )}
                  >
                    {isLast && line.type !== "context" && (
                      <span
                        aria-hidden="true"
                        className={cn(
                          "absolute bottom-0 left-0 top-0 w-0.5",
                          accent,
                        )}
                      />
                    )}
                    {line.oldNo ?? ""}
                  </td>
                  <td
                    className={cn(
                      "w-10 px-2 py-1 text-right tabular-nums text-fg-subtle",
                      isLast && rowBg,
                    )}
                  >
                    {line.newNo ?? ""}
                  </td>
                  <td className={cn("w-6 px-1 py-1", isLast && rowBg)}>
                    <span className="flex items-center justify-center">
                      <DiffGutter type={line.type} />
                    </span>
                  </td>
                  <td
                    className={cn(
                      "whitespace-pre px-3 py-1 text-left",
                      isLast && rowBg,
                    )}
                  >
                    <CodeContent content={line.content} type={line.type} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const DEMO_LINES: DiffLine[] = [
  { type: "context", oldNo: 12, newNo: 12, content: "  const x = 1;" },
  { type: "removed", oldNo: 13, content: "- const y = old();" },
  { type: "added", newNo: 13, content: "+ const y = next();" },
  { type: "context", oldNo: 14, newNo: 14, content: "  return x + y;" },
  { type: "context", oldNo: 15, newNo: 15, content: "}" },
  { type: "added", newNo: 16, content: "+ export default y;" },
];

export function DemoDiffTable() {
  return (
    <div className="w-full">
      <DiffTable file="app/auth.ts" lines={DEMO_LINES} />
    </div>
  );
}

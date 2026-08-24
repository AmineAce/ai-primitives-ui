"use client";

import { useState, type HTMLAttributes } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PreProps extends HTMLAttributes<HTMLPreElement> {}

export function Pre({ className, children, ...props }: PreProps) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    const text =
      typeof children === "string"
        ? children
        : children != null
          ? String(children)
          : "";
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {}
  };

  return (
    <div className="relative">
      <pre
        className={cn(
          "overflow-x-auto rounded-lg border bg-elevated p-4 pr-12 font-mono text-sm text-fg",
          className,
        )}
        {...props}
      >
        {children}
      </pre>
      <button
        type="button"
        onClick={onCopy}
        aria-label={copied ? "Copied" : "Copy code"}
        className="hover:border-strong absolute right-2 top-2 inline-flex size-7 items-center justify-center rounded-md border border-transparent bg-background text-fg-muted transition-colors hover:text-fg"
      >
        {copied ? (
          <Check className="size-3.5" />
        ) : (
          <Copy className="size-3.5" />
        )}
      </button>
    </div>
  );
}

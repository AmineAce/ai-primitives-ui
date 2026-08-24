"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

export function StageLock({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let peak = 0;
    const ro = new ResizeObserver(() => {
      const h = el.scrollHeight;
      if (h > peak) {
        peak = h;
        el.style.minHeight = `${h}px`;
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

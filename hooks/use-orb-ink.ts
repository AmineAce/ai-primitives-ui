"use client";

import { useMemo } from "react";
import { useTheme } from "@/lib/theme";
import { inkFromColor, type Ink } from "@ai-primitives-ui/ui";

const FALLBACK = "#8b949e";

/* Single source of truth for canvas ink: resolves --fg-default for the
   active theme and derives the matching alpha-lift curve from it. */
export function useOrbInk(fallback = FALLBACK): { color: string; ink: Ink } {
  const { resolvedTheme } = useTheme();

  const color = useMemo(() => {
    if (typeof window === "undefined") return fallback;
    return (
      getComputedStyle(document.documentElement)
        .getPropertyValue("--fg-default")
        .trim() || fallback
    );
  }, [resolvedTheme, fallback]);

  const ink = useMemo(() => inkFromColor(color), [color]);

  return { color, ink };
}

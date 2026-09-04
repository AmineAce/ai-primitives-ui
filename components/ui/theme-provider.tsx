"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import {
  applyTheme,
  getStoredTheme,
  getSystemTheme,
  readDomTheme,
  setStoredTheme,
  ThemeContext,
  THEME_ATTRIBUTE,
  THEME_STORAGE_KEY,
  type Theme,
} from "@/lib/theme";

export interface ThemeProviderProps {
  children: ReactNode;
  /** Fallback while the client resolves the real theme. */
  defaultTheme?: Theme;
}

function ThemeContextProvider({
  children,
  defaultTheme = "dark",
}: ThemeProviderProps) {
  const nextThemes = useTheme();
  const [theme, setThemeState] = useState<Theme | null>(() => getStoredTheme());
  const [resolvedTheme, setResolvedTheme] = useState<Theme>(defaultTheme);

  /* Resolve the initial theme on mount: stored > DOM > system. */
  useEffect(() => {
    const stored = getStoredTheme();
    const resolved = stored ?? readDomTheme() ?? getSystemTheme();
    applyTheme(resolved);
    setThemeState(stored);
    setResolvedTheme(resolved);
  }, []);

  /* Watch for external changes to data-theme / .dark / .light on <html>. */
  useEffect(() => {
    const sync = () =>
      setResolvedTheme(readDomTheme() ?? getStoredTheme() ?? getSystemTheme());
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [THEME_ATTRIBUTE, "class"],
    });
    return () => observer.disconnect();
  }, []);

  /* Follow the system preference while no explicit theme is chosen. */
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => {
      if (getStoredTheme() === null) {
        const next = getSystemTheme();
        applyTheme(next);
        setResolvedTheme(next);
      }
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const setTheme = useCallback(
    (next: Theme) => {
      setStoredTheme(next);
      applyTheme(next);
      setThemeState(next);
      setResolvedTheme(next);
      // Keep next-themes (fumadocs docs toggle) on the same key and state.
      nextThemes.setTheme(next);
    },
    [nextThemes],
  );

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function ThemeProvider(props: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      storageKey={THEME_STORAGE_KEY}
      defaultTheme={props.defaultTheme ?? "dark"}
      enableSystem
      disableTransitionOnChange
    >
      <ThemeContextProvider {...props} />
    </NextThemesProvider>
  );
}

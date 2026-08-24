"use client";

import { createContext, useContext } from "react";

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "ai-primitives-theme";
export const THEME_ATTRIBUTE = "data-theme";

export const isBrowser = () => typeof window !== "undefined";

/* --------------------------------------------------------------------------
 * Read the user's preference.
 * ------------------------------------------------------------------------ */

export function getStoredTheme(): Theme | null {
  if (!isBrowser()) return null;
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : null;
  } catch {
    return null;
  }
}

export function setStoredTheme(theme: Theme): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* storage unavailable — theme still applies for this session */
  }
}

export function getSystemTheme(): Theme {
  if (!isBrowser() || !window.matchMedia) return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

export function getInitialTheme(): Theme {
  return getStoredTheme() ?? getSystemTheme();
}

/* --------------------------------------------------------------------------
 * Read / write the theme on the <html> element.
 * ------------------------------------------------------------------------ */

export function readDomTheme(): Theme | null {
  if (typeof document === "undefined") return null;
  const root = document.documentElement;
  const attr = root.getAttribute(THEME_ATTRIBUTE);
  if (attr === "light" || attr === "dark") return attr;
  if (root.classList.contains("dark")) return "dark";
  if (root.classList.contains("light")) return "light";
  return null;
}

export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute(THEME_ATTRIBUTE, theme);
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme === "light");
}

/* --------------------------------------------------------------------------
 * React context + hook.
 * ------------------------------------------------------------------------ */

export interface ThemeContextValue {
  /** Explicitly chosen theme, or null when following the system preference. */
  theme: Theme | null;
  /** The theme currently applied to the document. */
  resolvedTheme: Theme;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a <ThemeProvider>");
  }
  return context;
}

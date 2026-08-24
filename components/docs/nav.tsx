"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DocNavItem {
  id: string;
  label: string;
}

export const DOC_NAV: DocNavItem[] = [
  { id: "getting-started", label: "Getting Started" },
  { id: "installation", label: "Installation" },
  { id: "usage", label: "Usage" },
  { id: "primitives", label: "Primitives" },
  { id: "playground", label: "Playground" },
  { id: "theming", label: "Theming" },
  { id: "accessibility", label: "Accessibility" },
  { id: "api-reference", label: "API Reference" },
];

function useActiveSection() {
  const [active, setActive] = useState(DOC_NAV[0].id);

  useEffect(() => {
    const sections = DOC_NAV.map((item) =>
      document.getElementById(item.id),
    ).filter((el): el is HTMLElement => el !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length > 0) {
          setActive(visible[visible.length - 1].target.id);
        }
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0.1 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return active;
}

export interface DocsNavProps {
  onNavigate?: () => void;
}

export function DocsNav({ onNavigate }: DocsNavProps) {
  const active = useActiveSection();

  return (
    <nav aria-label="Documentation">
      <ul className="space-y-0.5">
        {DOC_NAV.map((item) => {
          const isActive = active === item.id;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={onNavigate}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "block border-l-2 py-1.5 pl-4 pr-3 text-sm transition-colors",
                  isActive
                    ? "border-fg bg-elevated text-foreground"
                    : "border-transparent text-fg-muted hover:bg-surface hover:text-foreground",
                )}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function MobileDocsNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-16 z-40 border-b border-muted backdrop-blur md:hidden">
      <div className="flex h-12 items-center justify-between px-4">
        <p className="text-sm font-medium tracking-tight">Documentation</p>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="docs-mobile-nav"
          aria-label={
            open ? "Close documentation menu" : "Open documentation menu"
          }
          className="inline-flex size-9 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-surface hover:text-foreground"
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>
      {open ? (
        <div
          id="docs-mobile-nav"
          className="fixed inset-x-0 top-28 z-40 max-h-[calc(100vh-7rem)] overflow-y-auto border-b border-muted bg-background px-4 py-3"
        >
          <DocsNav onNavigate={() => setOpen(false)} />
        </div>
      ) : null}
    </div>
  );
}

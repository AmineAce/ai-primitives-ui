"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Github } from "lucide-react";
import { Container } from "@/components/ui/container";
import { buttonVariants } from "@/components/ui/Button";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

const REPO_URL = "https://github.com/AmineAce/ai-primitives-ui";

const NAV_ITEMS = [{ href: "/docs", label: "Docs" }];

export function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);
  const isHome = isActive("/");

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-colors",
        isScrolled
          ? "bg-transparent py-2"
          : "border-b border-border bg-background",
      )}
    >
      <Container
        className={cn(
          "flex h-16 items-center justify-between gap-4 transition-all duration-300",
          isScrolled &&
            "bg-background/50 rounded-2xl border backdrop-blur-lg lg:px-5",
        )}
      >
        <Link
          href="/"
          className={cn(
            "flex items-center gap-2.5 text-sm font-medium tracking-tight transition-colors",
            isHome ? "text-foreground" : "text-secondary hover:text-foreground",
          )}
        >
          <Logo className={cn(!isHome && "text-secondary")} />
          AI Primitives
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm text-secondary transition-colors hover:bg-surface hover:text-foreground",
                  active && "bg-surface text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="AI Primitives on GitHub"
            className="inline-flex size-9 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-surface hover:text-foreground"
          >
            <Github className="size-4" />
          </a>
          <ThemeToggle className="ml-1" />
          <Link
            href="/docs"
            className={cn(
              buttonVariants({ size: "sm" }),
              "ml-2 hidden sm:inline-flex",
            )}
          >
            Get started
          </Link>
        </nav>
      </Container>
    </header>
  );
}

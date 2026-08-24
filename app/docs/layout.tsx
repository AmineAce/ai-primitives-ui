import type { Metadata } from "next";
import { Footer } from "@/components/sections/footer";
import { DocsNav, MobileDocsNav } from "@/components/docs/nav";

export const metadata: Metadata = {
  title: "Docs",
  description:
    "Documentation for AI Primitives · getting started, installation, usage, primitives, theming, accessibility, and API reference.",
  openGraph: {
    title: "AI Primitives · UI primitives for AI-native interfaces",
    description:
      "Monochrome UI primitives for AI-native interfaces. Zero dependencies.",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AI Primitives",
      },
    ],
  },
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <MobileDocsNav />
      <div className="flex flex-1">
        <aside className="sticky top-0 hidden h-[calc(100vh-4rem)] w-64 shrink-0 self-start overflow-y-auto border-r border-muted bg-bg-base px-2 pb-10 pt-16 md:block">
          <p className="px-3 pb-4 font-mono text-xs uppercase tracking-widest text-fg-subtle">
            Guide
          </p>
          <DocsNav />
        </aside>
        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-3xl px-6 pb-28 pt-14 lg:px-8">
            {children}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

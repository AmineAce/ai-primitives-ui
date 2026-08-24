import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Primitives",
  description:
    "Crafted UI primitives for AI-native interfaces. A monochrome, open-source library.",
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

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main className="flex min-h-screen flex-col">{children}</main>;
}

import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { WebVitals } from "@/components/ui/web-vitals";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/sections/navbar";
import "./globals.css";

const THEME_INIT_SCRIPT = `(function(){var K="ai-primitives-theme",t=null;try{t=localStorage.getItem(K);}catch(e){}if(t!=="light"&&t!=="dark"){t=(window.matchMedia&&window.matchMedia("(prefers-color-scheme: light)").matches)?"light":"dark";}var r=document.documentElement;r.classList.remove("dark","light");r.classList.add(t);r.setAttribute("data-theme",t);})();`;

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  preload: true,
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: "AI Primitives · UI primitives for AI-native interfaces",
    template: "%s · AI Primitives",
  },
  description:
    "A dependency-free library of monochrome UI primitives for AI-native interfaces: loading states, thinking traces, streaming text, tool chips, approval cards, and more. No WebGL, no dependencies.",
  metadataBase: new URL("https://ai-primitives-ui.vercel.app"),
  manifest: "/manifest.json",
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
  twitter: {
    card: "summary_large_image",
    title: "AI Primitives · UI primitives for AI-native interfaces",
    description:
      "Monochrome UI primitives for AI-native interfaces. Zero dependencies.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1117" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://picsum.photos" />
        <link rel="preconnect" href="https://fastly.picsum.photos" />
      </head>
      <body
        className={cn(
          inter.variable,
          jetbrainsMono.variable,
          "bg-background font-sans text-foreground antialiased",
        )}
      >
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <script
          type="speculationrules"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              prerender: [
                {
                  where: { href_matches: "/*" },
                  eagerness: "moderate",
                },
              ],
            }),
          }}
        />
        <WebVitals />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "AI Primitives",
              description:
                "A dependency-free library of monochrome UI primitives for AI-native interfaces: loading states, thinking traces, streaming text, approval cards, tool chips, and more. No WebGL, no dependencies.",
              applicationCategory: "DeveloperApplication",
              operatingSystem: "Any",
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
              url: "https://ai-primitives-ui.vercel.app",
              sameAs: ["https://github.com/AmineAce/ai-primitives-ui"],
            }),
          }}
        />
        <ThemeProvider>
          <Navbar />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

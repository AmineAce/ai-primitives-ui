import { createMDX } from "fumadocs-mdx/next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  transpilePackages: ["@ai-primitives-ui/ui"],
  experimental: {
    optimizePackageImports: ["@ai-primitives-ui/ui"],
  },
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default createMDX()(nextConfig);

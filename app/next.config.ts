// Mehrzad ArianMehr©
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // CRITICAL: transpile @prisma/client so Turbopack bundles it instead of
  // externalizing it (which causes "Cannot find module @prisma/client-<hash>").
  transpilePackages: ["@prisma/client", ".prisma/client"],
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;

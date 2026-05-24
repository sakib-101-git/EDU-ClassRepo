import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Silence the workspace root detection warning
    root: __dirname,
  },
  images: {
    remotePatterns: [
      // Allow profile pics and materials from Cloudflare R2
      {
        protocol: "https",
        hostname: "**.r2.dev",
      },
      {
        protocol: "https",
        hostname: "pub-*.r2.dev",
      },
    ],
  },
};

export default nextConfig;

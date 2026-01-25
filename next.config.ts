import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ignore ESLint errors during build (for deployment)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Security headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  // Performance optimizations
  compress: true,
  // Hide X-Powered-By header
  poweredByHeader: false,
};

export default nextConfig;

import type { NextConfig } from "next";

const isStaticExport = process.env.STATIC_EXPORT === "true";

const nextConfig: NextConfig = {
  // Only enable static export when building for APK (Capacitor)
  // Normal web dev (npm run dev) works without this restriction
  ...(isStaticExport && { output: "export" }),

  // Trailing slash ensures proper route resolution in Capacitor WebView
  trailingSlash: true,

  images: {
    // Image Optimization requires a Node.js server — unavailable in APK
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;

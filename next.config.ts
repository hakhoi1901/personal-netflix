import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow external images from common poster/image sources
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;

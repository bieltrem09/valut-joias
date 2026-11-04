import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 828, 1280, 1600, 2048],
  },
  poweredByHeader: false,
};

export default nextConfig;

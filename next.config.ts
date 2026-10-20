import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [480, 828, 1200, 1920],
    imageSizes: [96, 256, 384],
  },
  experimental: {
    optimizePackageImports: ['gsap', 'motion'],
  },
};

export default nextConfig;

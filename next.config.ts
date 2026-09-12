import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.109', '192.168.1.237'], // ← دقیقاً host بدون پروتکل و پورت
  images: {
    domains: [],
  },
  // ✅ این خط رو اضافه کن
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
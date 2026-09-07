import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.237'], // ← دقیقاً host بدون پروتکل و پورت
};

export default nextConfig;
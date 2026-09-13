import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.109', '192.168.1.237'], // ← دقیقاً host بدون پروتکل و پورت
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      // اگه از دامنه‌های دیگه مثل Unsplash هم استفاده میکنی، اینجا اضافه کن
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      }
    ],
  },
  // ✅ این خط رو اضافه کن
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
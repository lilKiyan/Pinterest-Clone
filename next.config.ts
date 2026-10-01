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
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // جلوی clickjacking (تو iframe باز نشو)
          { key: 'X-Frame-Options', value: 'DENY' },
          // جلوی MIME-sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // referrer اطلاعات نده به سایت‌های خارجی
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // دوربین/میکروفون به هیچ‌کس جز خودت
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
    ]
  },
};

export default nextConfig;
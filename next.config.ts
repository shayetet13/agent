import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options",    value: "nosniff" },
  { key: "X-Frame-Options",           value: "SAMEORIGIN" },
  { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === "production"
      ? { exclude: ["error", "warn"] }
      : false,
  },

  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },

  // อนุญาตให้เข้า dev server ผ่าน LAN IP (มือถือในวงเดียวกัน)
  allowedDevOrigins: [
    "192.168.100.99",
    "192.168.100.*",
    "192.168.1.*",
    "192.168.0.*",
  ],
  devIndicators: false,
};

export default nextConfig;

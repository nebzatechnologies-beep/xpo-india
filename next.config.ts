import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  turbopack: {
    root: process.cwd(),
  },
  async rewrites() {
    return [
      {
        source: '/superadmin',
        destination: '/admin/dashboard',
      },
      {
        source: '/superadmin/:path*',
        destination: '/admin/:path*',
      },
      {
        source: '/trust',
        destination: '/dashboard/verification',
      },
    ];
  },
};

export default nextConfig;

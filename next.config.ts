import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
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
    ];
  },
};

export default nextConfig;

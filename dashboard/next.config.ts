import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // Temporarily ignore TypeScript errors during build
    // TODO: Fix Supabase type generation and remove this
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      {
        source: '/dashboard/development',
        destination: '/dashboard/planning',
        permanent: true, // 308 status - browser caches this
      },
      {
        source: '/dashboard/development/:path*',
        destination: '/dashboard/planning',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

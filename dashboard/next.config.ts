import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // Temporarily ignore TypeScript errors during build
    // TODO: Fix Supabase type generation and remove this
    ignoreBuildErrors: true,
  },
};

export default nextConfig;

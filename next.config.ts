import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone', // Required for Docker deployment
  allowedDevOrigins: [
    "schoolmatic.cloud",
    "www.schoolmatic.cloud",
    "schoolmatic.themediavault.app",
  ],

  // Suppress Radix UI hydration warnings for aria-controls mismatch
  // These are caused by random ID generation and don't affect functionality
  reactStrictMode: true,

  webpack: (config) => {
    return config;
  },
};

export default nextConfig;

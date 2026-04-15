import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  env: {
    APP_VERSION: process.env.npm_package_version || '0.0.0',
  },
	images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'qsfp0nm8zxity2tw.public.blob.vercel-storage.com',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname),
  experimental: {
    serverActions: {
      bodySizeLimit: '8mb',
    },
  },
};

export default nextConfig;

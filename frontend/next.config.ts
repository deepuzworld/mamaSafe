import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const isDev = process.env.NODE_ENV === 'development';
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || (isDev ? 'http://localhost:5000' : 'https://backend-production-5d43.up.railway.app');
    return [
      {
        source: '/core-api/:path*',
        destination: `${backendUrl}/api/:path*`
      },
      {
        source: '/uploads/:path*',
        destination: `${backendUrl}/uploads/:path*`
      }
    ];
  }
};

export default nextConfig;

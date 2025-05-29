import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // experimental: {
  //   reactCompiler: {
  //     compilationMode: 'annotation',
  //   },
  // },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/compare',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

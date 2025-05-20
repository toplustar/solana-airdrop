/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/auth/:path*',
  //       destination: 'https://api.streamflow.finance/v2/api/auth/:path*',
  //     },
  //     {
  //       source: '/api/airdrops/:path*',
  //       destination: 'https://api.streamflow.finance/v2/api/airdrops/:path*',
  //     },
  //   ];
  // },
}

export default nextConfig

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hauzisha.co.ke',
        pathname: '/blog/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'gfx3.senetic.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avechi.co.ke',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'marketplace.canva.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.thewirecutter.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'healthkenya.co.ke',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'dynamic-media-cdn.tripadvisor.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.metrostores.co.ke',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.salla.sa',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'mchzszszydkhzlwcessy.supabase.co',
        pathname: '/storage/v1/object/public/uploads/**'
      }
    ],
  },
};

export default nextConfig;
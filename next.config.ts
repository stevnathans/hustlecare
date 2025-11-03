import type { NextConfig } from "next";

const nextConfig: NextConfig = {
 images: {
  remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hauzisha.co.ke',
        pathname: '/blog/wp-content/uploads/**',
      },
    ],
    domains: [
      'gfx3.senetic.com', 
     'avechi.co.ke',
     'marketplace.canva.com',
     'lh3.googleusercontent.com',
     'cdn.thewirecutter.com',
     'healthkenya.co.ke',
     'hauzisha.co.ke',
     'encrypted-tbn0.gstatic.com',
     'dynamic-media-cdn.tripadvisor.com',
     'storage.googleapis.com',
     'www.metrostores.co.ke',
     'cdn.salla.sa',
     'mchzszszydkhzlwcessy.supabase.co',
      // Add any other domains you use
    ],
  },
};

module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mchzszszydkhzlwcessy.supabase.co',
        pathname: '/storage/v1/object/public/uploads/**'
      }
    ],
  },
};

export default nextConfig;

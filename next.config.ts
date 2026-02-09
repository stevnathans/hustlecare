// next.config.ts
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure we're using the correct URL in production
  async headers() {
    return [
      {
        source: '/api/auth/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },
  images: {
    unoptimized: true, // disable Next's image optimization (so domains list isn't required)
    // Alternative: if you want to enable optimization for Google profile images:
    // remotePatterns: [
    //   {
    //     protocol: 'https',
    //     hostname: 'lh3.googleusercontent.com',
    //   },
    // ],
  },
};

module.exports = nextConfig;
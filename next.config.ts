// next.config.ts
/** @type {import('next').NextConfig} */

// Pages served identically under both / and /us via rewrite — no content
// duplicated, same page component renders for either URL. Treated as
// "shared for now" per current decision; revisit each entry later to
// decide whether it needs a genuine market-specific version instead
// (Privacy Policy and Terms of Service in particular may need real
// jurisdiction-specific content down the line, not just a rewrite).
const marketMirroredPaths = [
  'about',
  'contact',
  'privacy',
  'terms',
  'cookie',
  'gdpr',
  'faqs',
  'support',
  'community',
  'our-story',
];

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
  async rewrites() {
    return marketMirroredPaths.map((path) => ({
      source: `/us/${path}`,
      destination: `/${path}`,
    }));
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
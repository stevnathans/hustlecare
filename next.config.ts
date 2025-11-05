// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true, // disable Next's image optimization (so domains list isn't required)
  },
};

module.exports = nextConfig;

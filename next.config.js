/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Whitelist Whop's image servers
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.whop.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // In case any default Whop stock photos are used
      }
    ],
  },
  // Allow embedding in Whop iframe
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' https://whop.com https://*.whop.com",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

// next.config.mjs
import nextPWA from 'next-pwa';

const withPWA = nextPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  additionalManifestEntries: [
    { url: '/Itsallfunandgames/games.json', revision: null },
    { url: '/Itsallfunandgames/offline/index.html', revision: null },
  ],
  runtimeCaching: [
    {
      urlPattern: ({ request }) => request.mode === 'navigate',
      handler: 'NetworkFirst',
      options: { cacheName: 'pages', networkTimeoutSeconds: 3 },
    },
    {
      urlPattern: ({ request }) =>
        ['style', 'script', 'worker', 'font'].includes(request.destination),
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'assets' },
    },
    {
      urlPattern: ({ request }) => request.destination === 'image',
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
    {
      urlPattern: /\/Itsallfunandgames\/games\.json$/,
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'dataset' },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/Itsallfunandgames',
  assetPrefix: '/Itsallfunandgames',
  trailingSlash: true,
  images: {
    unoptimized: true, // Required for static export
  },
};

export default withPWA(nextConfig);
/** @type {import('next').NextConfig} */
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: false,
<<<<<<< HEAD
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  sw: 'sw.js',
=======
  manifest: {
    name: 'Devi Jewellers Repair',
    short_name: 'Devi Jewellers',
    description: 'Jewellery Repair Management System',
    theme_color: '#A8007E',
    background_color: '#ffffff',
    display: 'standalone',
    orientation: 'portrait',
    start_url: '/',
    scope: '/',
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ]
  },
>>>>>>> f25b23d612c8fe7e60507e6dc9d70da47b144fb3
  fallbacks: {
    document: '/'
  }
})

const nextConfig = {
<<<<<<< HEAD
  output: 'standalone',
=======
>>>>>>> f25b23d612c8fe7e60507e6dc9d70da47b144fb3
  trailingSlash: true,
  images: { unoptimized: true },
}

module.exports = withPWA(nextConfig)
<<<<<<< HEAD

=======
>>>>>>> f25b23d612c8fe7e60507e6dc9d70da47b144fb3

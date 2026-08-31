/** @type {import('next').NextConfig} */
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: false,
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
  fallbacks: {
    document: '/'
  }
})

const nextConfig = {
  trailingSlash: true,
  images: { unoptimized: true },
}

module.exports = withPWA(nextConfig)

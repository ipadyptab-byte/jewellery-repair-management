/** @type {import('next').NextConfig} */
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: false,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  sw: 'sw.js',
  fallbacks: {
    document: '/'
  }
})

const nextConfig = {
  output: 'standalone',
  trailingSlash: true,
  images: { unoptimized: true },
}

module.exports = withPWA(nextConfig)


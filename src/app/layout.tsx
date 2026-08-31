<<<<<<< HEAD
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const viewport: Viewport = {
  themeColor: '#c0003a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover'
}

export const metadata: Metadata = {
  title: 'Devi Jewellers — Repair Management',
  description: 'Jewellery Repair Management System — Gold | Silver | Diamonds | Pearls',
  manifest: '/manifest.json',
  applicationName: 'Devi Jewellers Repair',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Devi Repair'
  },
  formatDetection: {
    telephone: false
  },
  icons: { 
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.png', sizes: '192x192', type: 'image/png' },
      { url: '/logo.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [
      { url: '/icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/logo.png', sizes: '512x512', type: 'image/png' }
    ],
    shortcut: '/favicon.ico'
  }
=======
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Devi Jewellers — Repair Management',
  description: 'Jewellery Repair Management System — Gold | Silver | Diamonds | Pearls',
  icons: { 
    icon: '/favicon.ico',
    apple: '/favicon.png',
    shortcut: '/favicon.ico'
  },
>>>>>>> f25b23d612c8fe7e60507e6dc9d70da47b144fb3
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
<<<<<<< HEAD
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Devi Repair" />
        <meta name="theme-color" content="#c0003a" />
        <meta name="msapplication-TileColor" content="#c0003a" />
        <meta name="msapplication-TileImage" content="/icon.png" />
        <meta name="msapplication-tap-highlight" content="no" />
=======
>>>>>>> f25b23d612c8fe7e60507e6dc9d70da47b144fb3
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" defer></script>
      </head>
      <body>{children}</body>
    </html>
  )
}
<<<<<<< HEAD

=======
>>>>>>> f25b23d612c8fe7e60507e6dc9d70da47b144fb3

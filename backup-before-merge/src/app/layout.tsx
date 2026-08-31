import type { Metadata, Viewport } from 'next'
import './globals.css'

export const viewport: Viewport = {
  themeColor: '#A8007E',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Devi Repair',
  },
  formatDetection: {
    telephone: false,
  },
<<<<<<< Updated upstream
  title: 'Devi Jewellers — Repair Management',
  description: 'Jewellery Repair Management System — Gold | Silver | Diamonds | Pearls',
  icons: { 
    icon: '/favicon.ico',
    apple: '/icon.png',
    shortcut: '/favicon.ico'
  },
=======
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
>>>>>>> Stashed changes
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
<<<<<<< Updated upstream
=======
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Devi Repair" />
        <meta name="theme-color" content="#c0003a" />
        <meta name="msapplication-TileColor" content="#c0003a" />
        <meta name="msapplication-TileImage" content="/icon.png" />
        <meta name="msapplication-tap-highlight" content="no" />
>>>>>>> Stashed changes
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" defer></script>
      </head>
      <body>{children}</body>
    </html>
  )
}
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes

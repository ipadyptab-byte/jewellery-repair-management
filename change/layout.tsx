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
  title: 'Devi Jewellers — Repair Management',
  description: 'Jewellery Repair Management System — Gold | Silver | Diamonds | Pearls',
  icons: { 
    icon: '/favicon.ico',
    apple: '/icon.png',
    shortcut: '/favicon.ico'
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" defer></script>
      </head>
      <body>{children}</body>
    </html>
  )
}

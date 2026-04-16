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

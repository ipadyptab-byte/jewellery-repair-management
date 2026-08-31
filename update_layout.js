const fs = require('fs');
let code = fs.readFileSync('src/app/layout.tsx', 'utf8');

code = code.replace(
  "import type { Metadata } from 'next'",
  "import type { Metadata, Viewport } from 'next'"
);

code = code.replace(
  "export const metadata: Metadata = {",
  `export const viewport: Viewport = {
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
  },`
);

fs.writeFileSync('src/app/layout.tsx', code);

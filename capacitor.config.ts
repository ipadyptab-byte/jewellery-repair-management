import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'devijewellers.repair',
  appName: 'Devi Jewellers Repair',
  webDir: '.next',
  server: {
    url: 'https://jewellery-repair-management.vercel.app',
    androidScheme: 'https'
  }
};

export default config;

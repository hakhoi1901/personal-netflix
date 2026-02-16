import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hakhoi.theater',
  appName: 'Theater',
  webDir: 'out',
  server: {
    // Use HTTPS scheme — required for Firebase Auth to work in WebView
    androidScheme: 'https',
  },
  android: {
    // Allow mixed content (HTTP inside HTTPS) for Drive iframe compatibility
    allowMixedContent: true,
  },
};

export default config;

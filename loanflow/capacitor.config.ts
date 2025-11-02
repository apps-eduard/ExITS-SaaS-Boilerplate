import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.exitsaas.mobile',
  appName: 'ExITS SaaS',
  webDir: 'www',
  bundledWebRuntime: false,
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#1a1a1a',
      overlaysWebView: false,
    },
    Keyboard: {
      resizeOnFullScreen: true,
    },
    Camera: {
      permissions: ['camera', 'photos'],
    },
    Geolocation: {
      permissions: ['location'],
    },
    LocalNotifications: {
      permissions: ['notifications'],
    },
  },
};

export default config;

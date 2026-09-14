import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.linefreeindia.app',
  appName: 'Line Free India',
  webDir: 'dist',
  server: { androidScheme: 'https' },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '848717293503-jl6isf2gqs9fmca1nte72c63idm4qqin.apps.googleusercontent.com',
      clientId: '848717293503-jl6isf2gqs9fmca1nte72c63idm4qqin.apps.googleusercontent.com',
      forceCodeForRefreshToken: false
    },
    PushNotifications: { presentationOptions: ["badge", "sound", "alert"] },
    StatusBar: {
      overlaysWebView: false,
      style: 'LIGHT',
      backgroundColor: '#FFFFFF',
    },
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: '#0a0a0c',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    }
  }
};

export default config;

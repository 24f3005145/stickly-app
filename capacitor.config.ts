import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // TODO: replace with your own unique ID before publishing.
  // Must match applicationId/namespace in android/app/build.gradle
  // and the Kotlin package name.
  appId: 'com.example.stickly',
  appName: 'Stickly',
  webDir: 'dist',
  android: { allowMixedContent: false },
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      backgroundColor: '#FFFFFF',
      androidScaleType: 'CENTER_INSIDE',
      showSpinner: false,
    },
  },
};

export default config;

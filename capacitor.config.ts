import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fretquency.app',
  appName: 'Fretquency',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    // Native cold-start splash. The window background is a static drawable
    // (the note mark on the drawer-palette gradient) generated into android/
    // by `capacitor-assets generate` in the APK workflow; `backgroundColor` is
    // the solid fallback (mid-gradient) for the brief moment before it paints.
    // Keep the native phase short — once the WebView is up, index.html's own
    // #boot-splash (same gradient, animated cyan progress bar) takes over and
    // src/main.tsx fades it once React has mounted.
    SplashScreen: {
      launchShowDuration: 600,
      launchAutoHide: true,
      launchFadeOutDuration: 200,
      backgroundColor: '#141426',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashImmersive: true,
    },
  },
};

export default config;

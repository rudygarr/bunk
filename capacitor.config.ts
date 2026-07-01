import type { CapacitorConfig } from '@capacitor/cli';

// Wraps the built CampHQ web app as a native iOS app.
// Bundle ID matches the Apple App ID created for Sign in with Apple.
const config: CapacitorConfig = {
  appId: 'app.camphq.ios',
  appName: 'CampHQ',
  webDir: 'dist',
  ios: {
    contentInset: 'always',
  },
};

export default config;

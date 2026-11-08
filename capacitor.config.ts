import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.opexnal.connect",
  appName: "Opexnal",
  webDir: ".output/public",
  server: {
    // Load the official Opexnal web app; native changes still require a Play Store release.
    // Never put API credentials or signing secrets in this file.
    url: "https://opexnal.com",
    cleartext: false,
    allowNavigation: ["opexnal.com", "www.opexnal.com"],
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;

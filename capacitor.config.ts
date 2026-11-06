import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.opexnal.connect",
  appName: "Opexnal",
  webDir: ".output/public",
  server: {
    // Load the deployed Opexnal web app; native changes still require a Play Store release.
    // Never put API credentials or signing secrets in this file.
    url: "https://opexnal.ai.studio",
    cleartext: false,
    allowNavigation: ["opexnal.ai.studio", "opexnal-connect.vercel.app"],
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;

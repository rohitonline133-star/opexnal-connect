import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.opexnal.connect",
  appName: "Opexnal",
  webDir: ".output/public",
  server: {
    // This wrapper loads the existing production web app.
    // Keep API credentials on the server; never put secrets in this config.
    url: "https://opexnal.ai.studio",
    cleartext: false,
    allowNavigation: ["opexnal.ai.studio", "opexnal-connect.vercel.app"],
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;

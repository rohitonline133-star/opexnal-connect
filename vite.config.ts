import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import path from "path";

export default defineConfig({
  vite: {
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
  },
  nitro: {
    preset: "node-server",
  },
});

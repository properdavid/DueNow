import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { execSync } from "node:child_process";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import tsconfigPaths from "vite-tsconfig-paths";

import { duenowManifest } from "./pwa/manifest";

const appVersion = process.env.DUENOW_APP_VERSION ?? gitVersion();

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  plugins: [
    tailwindcss(),
    reactRouter(),
    VitePWA({
      injectRegister: null,
      registerType: "prompt",
      manifest: duenowManifest,
      // Without this the dev server never serves /manifest.webmanifest or /dev-sw.js,
      // and React Router's catch-all answers them with "No route matches URL".
      devOptions: {
        enabled: true,
      },
      workbox: {
        globPatterns: ["**/*.{js,css,woff2,png,svg}"],
        additionalManifestEntries: [{ url: "/offline.html", revision: appVersion }],
        navigateFallback: null,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkOnly",
            options: {
              precacheFallback: {
                fallbackURL: "/offline.html",
              },
            },
          },
        ],
      },
    }),
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      "~": new URL("./app", import.meta.url).pathname,
    },
  },
});

function gitVersion() {
  try {
    return execSync("git rev-parse --short=12 HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "development";
  }
}

import type { ManifestOptions } from "vite-plugin-pwa";

export const primaryIndigoHex = "#4d41c8";
export const darkPrimaryIndigoHex = "#857cde";

export const duenowManifest = {
  name: "DueNow",
  short_name: "DueNow",
  description: "Household project management for a two-person household.",
  start_url: "/",
  scope: "/",
  display: "standalone",
  theme_color: primaryIndigoHex,
  icons: [
    {
      src: "/icons/app-icon-192.png",
      sizes: "192x192",
      type: "image/png",
    },
    {
      src: "/icons/app-icon-512.png",
      sizes: "512x512",
      type: "image/png",
    },
    {
      src: "/icons/app-icon-maskable-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    },
    {
      src: "/icons/app-icon.svg",
      sizes: "any",
      type: "image/svg+xml",
    },
  ],
} satisfies Partial<ManifestOptions>;

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "~": new URL("./app", import.meta.url).pathname,
    },
  },
  test: {
    environment: "node",
    include: ["app/**/*.test.{ts,tsx}", "scripts/**/*.test.mjs", "tests/**/*.test.{ts,tsx}"],
    exclude: ["prototypes/**", "node_modules/**"],
  },
});

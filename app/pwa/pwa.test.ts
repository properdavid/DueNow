import { existsSync, readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

import { controlErrorMessage } from "~/pwa/unreachable";
import { clientAction } from "~/pwa/unreachable-action";
import { createLocalStorageVersionStore, shouldShowUpdateBanner } from "~/pwa/update-banner";
import { duenowManifest, primaryIndigoHex } from "../../pwa/manifest";

describe("PWA install and Unreachable State seams", () => {
  test("the manifest installs standalone from the root with the App Icon set", () => {
    expect(duenowManifest).toMatchObject({
      name: "DueNow",
      short_name: "DueNow",
      start_url: "/",
      scope: "/",
      display: "standalone",
      theme_color: primaryIndigoHex,
    });
    expect(duenowManifest).not.toHaveProperty("background_color");
    expect(duenowManifest).not.toHaveProperty("orientation");
    expect(duenowManifest.icons).toEqual([
      { src: "/icons/app-icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/app-icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/app-icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icons/app-icon.svg", sizes: "any", type: "image/svg+xml" },
    ]);
    expect(primaryIndigoHex).toBe(["#4d", "41", "c8"].join(""));
  });

  test("the checked-in icon generator emits one outlined artwork at every required size", () => {
    const script = readFileSync("scripts/generate-icons.mjs", "utf8");
    expect(script).toContain("app-icon-192.png");
    expect(script).toContain("app-icon-512.png");
    expect(script).toContain("app-icon-maskable-512.png");
    expect(script).toContain("scale = 0.88");

    for (const path of [
      "public/icons/app-icon-192.png",
      "public/icons/app-icon-512.png",
      "public/icons/app-icon-maskable-512.png",
      "public/icons/app-icon.svg",
      "public/icons/favicon.svg",
      "public/icons/apple-touch-icon-180.png",
      "public/icons/apple-touch-icon-167.png",
      "public/icons/apple-touch-icon-152.png",
    ]) {
      expect(existsSync(path)).toBe(true);
    }

    const svg = readFileSync("public/icons/app-icon.svg", "utf8");
    expect(svg).toContain("scale(0.88)");
    expect(svg).toContain("<path");
    expect(svg).not.toContain("<text");
  });

  test("the precached unreachable screen is self-contained and names the symptom", () => {
    const offline = readFileSync("public/offline.html", "utf8");
    expect(offline).toContain("Can't reach DueNow");
    expect(offline).toContain("Retry");
    expect(offline).toContain("prefers-color-scheme");
    expect(offline).not.toContain("<script");
    expect(offline).not.toContain('href="http');
  });

  test("failed writes use the same Unreachable State vocabulary in place", () => {
    expect(controlErrorMessage("Try again.")).toBe("Can't reach DueNow — Retry.");
    expect(controlErrorMessage("Summary is required.")).toBe("Summary is required.");
  });

  test("client actions keep write network failures at the control seam", async () => {
    await expect(clientAction({ serverAction: async () => ({ ok: true }) })).resolves.toEqual({ ok: true });
    await expect(clientAction({ serverAction: async () => { throw new TypeError("Failed to fetch"); } })).resolves.toEqual({
      ok: false,
      error: { message: "Try again." },
    });
    await expect(clientAction({ serverAction: async () => { throw new Error("Bug"); } })).rejects.toThrow("Bug");
  });

  test("Update Banner dismissal is keyed by the stable build version", () => {
    const values = new Map<string, string>();
    const store = createLocalStorageVersionStore({
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
      clear: () => values.clear(),
      key: (index: number) => Array.from(values.keys())[index] ?? null,
      get length() {
        return values.size;
      },
    });

    expect(shouldShowUpdateBanner("abc123", store)).toBe(true);
    store.dismissVersion("abc123");
    expect(shouldShowUpdateBanner("abc123", store)).toBe(false);
    expect(shouldShowUpdateBanner("def456", store)).toBe(true);
  });
});

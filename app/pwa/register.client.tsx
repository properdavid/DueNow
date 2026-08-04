/// <reference types="vite-plugin-pwa/client" />

import { createRoot, type Root } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";

import { Button } from "~/components/ui/button";
import { createLocalStorageVersionStore, shouldShowUpdateBanner, type VersionStore } from "./update-banner";

declare const __APP_VERSION__: string;

export function registerDueNowServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  const updateServiceWorker = registerSW({
    immediate: true,
    onNeedRefresh() {
      showUpdateBanner(document, __APP_VERSION__, createLocalStorageVersionStore(localStorage), () => updateServiceWorker(true));
    },
  });
}

function showUpdateBanner(document: Document, version: string, store: VersionStore, onSwitch: () => void) {
  if (!shouldShowUpdateBanner(version, store) || document.getElementById("duenow-update-banner")) {
    return;
  }

  const container = document.createElement("div");
  container.id = "duenow-update-banner";
  document.body.append(container);
  const root = createRoot(container);
  root.render(<UpdateBanner onDismiss={() => dismissUpdateBanner(root, container, store, version)} onSwitch={onSwitch} />);
}

function dismissUpdateBanner(root: Root, container: HTMLElement, store: VersionStore, version: string) {
  store.dismissVersion(version);
  root.unmount();
  container.remove();
}

function UpdateBanner({ onDismiss, onSwitch }: { onDismiss: () => void; onSwitch: () => void }) {
  return (
    <section
      aria-label="Update Banner"
      className="fixed inset-x-4 bottom-24 z-50 mx-auto flex max-w-xl flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4 text-card-foreground shadow-lg"
    >
      <p className="min-w-0 flex-1 text-xs">A newer version of DueNow is ready.</p>
      <Button type="button" onClick={onSwitch}>
        Update
      </Button>
      <Button type="button" variant="outline" onClick={onDismiss}>
        Not now
      </Button>
    </section>
  );
}

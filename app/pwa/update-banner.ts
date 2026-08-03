export interface VersionStore {
  dismissedVersion(): string | null;
  dismissVersion(version: string): void;
}

export function shouldShowUpdateBanner(version: string, store: VersionStore) {
  return store.dismissedVersion() !== version;
}

export function createLocalStorageVersionStore(storage: Storage, key = "duenow-dismissed-update") {
  return {
    dismissedVersion: () => storage.getItem(key),
    dismissVersion: (version: string) => storage.setItem(key, version),
  } satisfies VersionStore;
}

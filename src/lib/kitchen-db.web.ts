// Web: the kitchen lives in IndexedDB (database "sous", store "kitchen_state"), one record per
// slice. navigator.storage.persist() asks the browser to keep it like a persistent volume
// instead of clearing it under storage pressure.
import type { KitchenDb } from './kitchen-db';

const DB_NAME = 'sous';
const STORE = 'kitchen_state';
const LEGACY_KEY = 'kitchen-manager';

let opening: Promise<IDBDatabase> | undefined;

function open(): Promise<IDBDatabase> {
  opening ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return opening;
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

function safeLocalStorage(): Storage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

export const kitchenDb: KitchenDb = {
  async loadAll() {
    const db = await open();
    const tx = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const [keys, values] = await Promise.all(
      [store.getAllKeys(), store.getAll()].map(
        (req) =>
          new Promise<unknown[]>((resolve, reject) => {
            req.onsuccess = () => resolve(req.result as unknown[]);
            req.onerror = () => reject(req.error);
          }),
      ),
    );
    return Object.fromEntries(keys.map((k, i) => [String(k), String(values[i])]));
  },

  async save(changes) {
    const db = await open();
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    for (const [key, value] of Object.entries(changes)) {
      if (value === null) store.delete(key);
      else store.put(value, key);
    }
    await done(tx);
  },

  readLegacy: async () => safeLocalStorage()?.getItem(LEGACY_KEY) ?? null,
  removeLegacy: async () => safeLocalStorage()?.removeItem(LEGACY_KEY),

  async describe() {
    const persistent = (await navigator.storage?.persisted?.()) ?? false;
    return { engine: 'IndexedDB in this browser', persistent };
  },

  async requestPersistence() {
    try {
      return (await navigator.storage?.persist?.()) ?? false;
    } catch {
      return false;
    }
  },
};

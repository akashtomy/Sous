// Phones: the kitchen lives in an on-device SQLite database (sous.db), one row per slice of
// state (inventory, plan, history, pending sync queue, …) so a change rewrites only its slice.
// The web build uses IndexedDB instead (kitchen-db.web.ts) behind the same interface.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';

export interface KitchenDb {
  /** Every stored slice as key -> JSON text. */
  loadAll(): Promise<Record<string, string>>;
  /** Writes changed slices atomically; null deletes a slice. */
  save(changes: Record<string, string | null>): Promise<void>;
  /** The pre-SQLite storage blob (zustand persist, AsyncStorage) if it still exists. */
  readLegacy(): Promise<string | null>;
  removeLegacy(): Promise<void>;
  /** Short human description for Settings. */
  describe(): Promise<{ engine: string; persistent: boolean }>;
  /** Web only: ask the browser not to evict this site's storage. */
  requestPersistence(): Promise<boolean>;
}

const LEGACY_KEY = 'kitchen-manager';

let opening: Promise<SQLite.SQLiteDatabase> | undefined;

function db(): Promise<SQLite.SQLiteDatabase> {
  opening ??= (async () => {
    const d = await SQLite.openDatabaseAsync('sous.db');
    await d.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS kitchen_state (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
    return d;
  })();
  return opening;
}

export const kitchenDb: KitchenDb = {
  async loadAll() {
    const rows = await (await db()).getAllAsync<{ key: string; value: string }>(
      'SELECT key, value FROM kitchen_state',
    );
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  },

  async save(changes) {
    const d = await db();
    const now = Date.now();
    await d.withTransactionAsync(async () => {
      for (const [key, value] of Object.entries(changes)) {
        if (value === null) await d.runAsync('DELETE FROM kitchen_state WHERE key = ?', key);
        else
          await d.runAsync(
            `INSERT INTO kitchen_state (key, value, updated_at) VALUES (?, ?, ?)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
            key,
            value,
            now,
          );
      }
    });
  },

  readLegacy: () => AsyncStorage.getItem(LEGACY_KEY),
  removeLegacy: () => AsyncStorage.removeItem(LEGACY_KEY),
  describe: async () => ({ engine: 'SQLite on this device', persistent: true }),
  requestPersistence: async () => true,
};

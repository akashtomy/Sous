import type { KitchenDb } from '@/lib/kitchen-db';
import { EMPTY_SHARED } from '@/sync/state';

import { DEFAULT_SETTINGS, useKitchen } from '../kitchen';
import { _resetPersistenceForTests, flushKitchen, hydrateKitchen, migrateLegacy } from '../persistence';

jest.mock('@/lib/kitchen-db', () => ({ kitchenDb: {} }));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'uuid' }));

function memoryDb(rows: Record<string, string> = {}, legacy: string | null = null) {
  const saves: Record<string, string | null>[] = [];
  const db: KitchenDb & { rows: Record<string, string>; saves: typeof saves; legacy: string | null } = {
    rows,
    saves,
    legacy,
    loadAll: async () => ({ ...rows }),
    save: async (changes) => {
      saves.push(changes);
      for (const [k, v] of Object.entries(changes)) {
        if (v === null) delete rows[k];
        else rows[k] = v;
      }
    },
    readLegacy: async () => db.legacy,
    removeLegacy: async () => {
      db.legacy = null;
    },
    describe: async () => ({ engine: 'memory', persistent: true }),
    requestPersistence: async () => true,
  };
  return db;
}

beforeEach(() => {
  _resetPersistenceForTests();
  useKitchen.setState({ ...EMPTY_SHARED, settings: DEFAULT_SETTINGS, pendingOps: [], householdId: undefined, seed: 1 });
});

describe('device database persistence', () => {
  it('loads saved slices and fills new defaults', async () => {
    const db = memoryDb({
      inventory: JSON.stringify({ rice: { ingredientId: 'rice', qty: 900 } }),
      onboarded: 'true',
      prefs: JSON.stringify({ people: 3 }),
      settings: JSON.stringify({ claudeEnabled: true }),
    });
    await hydrateKitchen(db);
    const s = useKitchen.getState();
    expect(s.inventory.rice.qty).toBe(900);
    expect(s.onboarded).toBe(true);
    expect(s.prefs.people).toBe(3);
    expect(s.prefs.weekendEffort).toBe('elaborate'); // default filled in
    expect(s.settings).toEqual({ ...DEFAULT_SETTINGS, claudeEnabled: true });
    expect(db.saves).toHaveLength(0); // nothing rewritten just by loading
  });

  it('migrates the old single-blob storage once, then removes it', async () => {
    const legacy = JSON.stringify({
      version: 2,
      state: {
        onboarded: true,
        inventory: { onion: { ingredientId: 'onion', qty: 500 } },
        settings: { cartService: 'Zepto', notifications: true },
      },
    });
    const db = memoryDb({}, legacy);
    await hydrateKitchen(db);
    const s = useKitchen.getState();
    expect(s.cartService).toBe('Zepto');
    expect(s.settings).toEqual({ ...DEFAULT_SETTINGS, notifications: true });
    expect(JSON.parse(db.rows.inventory).onion.qty).toBe(500);
    expect(db.rows._schema).toBe('4');
    expect(db.legacy).toBeNull();
  });

  it('writes only the slices that changed, and deletes cleared ones', async () => {
    const db = memoryDb({ onboarded: 'true', householdId: '"h1"' });
    await hydrateKitchen(db);
    useKitchen.getState().addStock('rice', 1000);
    await flushKitchen(db);
    // In a household the change is also queued for sync, so the queue slice is saved too.
    expect(Object.keys(db.saves[0])).toEqual(['inventory', 'pendingOps']);
    useKitchen.setState({ householdId: undefined });
    await flushKitchen(db);
    expect(db.saves[1]).toEqual({ householdId: null });
    expect(db.rows.householdId).toBeUndefined();
  });

  it('ignores unreadable legacy data', () => {
    expect(migrateLegacy('not json')).toBeUndefined();
  });
});

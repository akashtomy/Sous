import type { SupabaseClient } from '@supabase/supabase-js';

import { useKitchen } from '@/store/kitchen';

import { SyncEngine } from '../engine';
import { EMPTY_SHARED, type SnapshotRows } from '../state';

jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('expo-crypto', () => {
  let n = 0;
  return { randomUUID: () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}` };
});

const HID = 'h-1';

const emptyRows = (): SnapshotRows & { applied: string[] } => ({
  inventory: [],
  history: [],
  outside: [],
  feedback: [],
  shopping: [],
  ai: [],
  docs: [],
  applied: [],
});

type Rpc = (
  name: string,
  args: Record<string, unknown>,
) => Promise<{ data: unknown; error: { message: string; code?: string } | null }>;

function fakeClient(rpc: Rpc) {
  const channel = { on: () => channel, subscribe: () => channel };
  return {
    rpc: jest.fn(rpc),
    channel: jest.fn(() => channel),
    removeChannel: jest.fn(),
  } as unknown as SupabaseClient & { rpc: jest.Mock };
}

beforeEach(() => {
  useKitchen.setState({ ...EMPTY_SHARED, pendingOps: [], householdId: HID, syncError: undefined });
});

describe('SyncEngine', () => {
  it('sends queued ops and clears them once the server confirms', async () => {
    const client = fakeClient(async (name) =>
      name === 'apply_ops' ? { data: 1, error: null } : { data: emptyRows(), error: null },
    );
    const engine = new SyncEngine(client, HID);
    useKitchen.getState().addStock('onion', 500);
    expect(useKitchen.getState().pendingOps).toHaveLength(1);
    await engine.flush();
    expect(client.rpc).toHaveBeenCalledWith('apply_ops', {
      p_household: HID,
      p_ops: [expect.objectContaining({ type: 'inv.delta', ingredientId: 'onion', delta: 500 })],
    });
    expect(useKitchen.getState().pendingOps).toHaveLength(0);
    engine.stop();
  });

  it('keeps ops queued while offline', async () => {
    const client = fakeClient(async () => ({
      data: null,
      error: { message: 'TypeError: Network request failed' },
    }));
    const engine = new SyncEngine(client, HID);
    useKitchen.getState().addStock('onion', 500);
    await engine.flush();
    expect(useKitchen.getState().pendingOps).toHaveLength(1);
    expect(useKitchen.getState().syncError).toMatch(/Offline/);
    engine.stop();
  });

  it('refresh rebases unconfirmed changes on top of the partner’s data', async () => {
    // This phone used 120 g onion (not yet sent); the partner meanwhile added 500 g.
    useKitchen.setState({ inventory: { onion: { ingredientId: 'onion', qty: 1000 } } });
    useKitchen.getState().dispatch([{ type: 'inv.delta', ingredientId: 'onion', delta: -120 }]);
    const rows = emptyRows();
    rows.inventory = [{ ingredient_id: 'onion', qty: 1500, par: null, added_on: null }];
    const client = fakeClient(async () => ({ data: rows, error: null }));
    await new SyncEngine(client, HID).refresh();
    expect(useKitchen.getState().inventory.onion.qty).toBe(1380);
    expect(useKitchen.getState().pendingOps).toHaveLength(1);
  });

  it('drops queued ops the server already applied (no double counting)', async () => {
    useKitchen.setState({ inventory: { onion: { ingredientId: 'onion', qty: 1000 } } });
    useKitchen.getState().dispatch([{ type: 'inv.delta', ingredientId: 'onion', delta: -120 }]);
    const id = useKitchen.getState().pendingOps[0].id;
    const rows = emptyRows();
    rows.inventory = [{ ingredient_id: 'onion', qty: 880, par: null, added_on: null }];
    rows.applied = [id];
    const client = fakeClient(async () => ({ data: rows, error: null }));
    await new SyncEngine(client, HID).refresh();
    expect(useKitchen.getState().inventory.onion.qty).toBe(880);
    expect(useKitchen.getState().pendingOps).toHaveLength(0);
  });

  it('drops a batch the server rejects so the queue can’t get stuck', async () => {
    const client = fakeClient(async (name) =>
      name === 'apply_ops'
        ? { data: null, error: { message: 'new row violates check constraint', code: '23514' } }
        : { data: emptyRows(), error: null },
    );
    const engine = new SyncEngine(client, HID);
    useKitchen.getState().setVideo('poha', 'https://example.com/not-youtube');
    await engine.flush();
    expect(useKitchen.getState().pendingOps).toHaveLength(0);
    expect(useKitchen.getState().syncError).toMatch(/couldn’t be saved/);
    engine.stop();
  });

  it('reports lost access when the snapshot comes back empty', async () => {
    const onLostAccess = jest.fn();
    const client = fakeClient(async () => ({ data: null, error: null }));
    await new SyncEngine(client, HID, { onLostAccess }).refresh();
    expect(onLostAccess).toHaveBeenCalled();
  });
});

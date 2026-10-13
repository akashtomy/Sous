// Saves the kitchen store to the device database (SQLite on phones, IndexedDB on web) one slice
// per row, and loads it at startup. Only slices whose value changed are written.
import { useSyncExternalStore } from 'react';
import { AppState, Platform } from 'react-native';

import { DEFAULT_PREFS } from '@/core/planner';
import { kitchenDb, type KitchenDb } from '@/lib/kitchen-db';
import { SHARED_KEYS } from '@/sync/state';

import { DEFAULT_SETTINGS, useKitchen } from './kitchen';

type State = ReturnType<typeof useKitchen.getState>;

/** Everything worth keeping across launches (not toasts, errors or functions). */
export const PERSISTED_KEYS = [
  ...SHARED_KEYS,
  'settings',
  'seed',
  'householdId',
  'pendingOps',
  'lastSyncedAt',
] as const satisfies readonly (keyof State)[];
type PersistedKey = (typeof PERSISTED_KEYS)[number];

const SCHEMA_KEY = '_schema';
const SCHEMA_VERSION = 4;
const WRITE_DELAY = 250;

let hydrated = false;
const listeners = new Set<() => void>();
let lastSaved: Partial<Record<PersistedKey, unknown>> = {};
let timer: ReturnType<typeof setTimeout> | undefined;
let unsubscribe: (() => void) | undefined;

function setHydrated() {
  hydrated = true;
  listeners.forEach((l) => l());
}

/** Older data shapes -> current. v1–3 were a single zustand blob; v3 moved cartService. */
export function migrateLegacy(blob: string): Partial<State> | undefined {
  try {
    const { state, version } = JSON.parse(blob) as { state?: Record<string, unknown>; version?: number };
    if (!state) return undefined;
    const settings = { ...(state.settings as Record<string, unknown> | undefined) };
    if ((version ?? 0) < 3 && typeof settings.cartService === 'string') state.cartService = settings.cartService;
    delete settings.cartService;
    return { ...state, settings } as unknown as Partial<State>;
  } catch {
    return undefined;
  }
}

function withDefaults(p: Partial<State>): Partial<State> {
  return {
    ...p,
    prefs: { ...DEFAULT_PREFS, ...p.prefs },
    settings: { ...DEFAULT_SETTINGS, ...p.settings },
    pendingOps: p.pendingOps ?? [],
  };
}

function changedSlices(state: State): Record<string, string | null> {
  const changes: Record<string, string | null> = {};
  for (const key of PERSISTED_KEYS) {
    const value = state[key];
    if (Object.is(value, lastSaved[key])) continue;
    changes[key] = value === undefined ? null : JSON.stringify(value);
    lastSaved[key] = value;
  }
  return changes;
}

/** Writes pending changes now (also called when the app goes to the background). */
export async function flushKitchen(db: KitchenDb = kitchenDb) {
  clearTimeout(timer);
  timer = undefined;
  const changes = changedSlices(useKitchen.getState());
  if (Object.keys(changes).length) await db.save(changes);
}

/**
 * Loads the saved kitchen into the store, migrating the old single-blob storage the first time,
 * then keeps the database up to date. Safe to call once at startup.
 */
export async function hydrateKitchen(db: KitchenDb = kitchenDb): Promise<void> {
  try {
    const rows = await db.loadAll();
    let restored: Partial<State> = {};
    if (Object.keys(rows).length) {
      for (const key of PERSISTED_KEYS) {
        if (rows[key] !== undefined) (restored as Record<string, unknown>)[key] = JSON.parse(rows[key]);
      }
    } else {
      const legacy = await db.readLegacy();
      restored = (legacy && migrateLegacy(legacy)) || {};
    }
    useKitchen.setState(withDefaults(restored));
    // Baseline = what's stored, so the first save only writes real changes. A fresh migration
    // writes everything once, plus the schema marker.
    lastSaved = Object.keys(rows).length ? { ...useKitchen.getState() } : {};
    if (!Object.keys(rows).length) {
      await db.save({ ...changedSlices(useKitchen.getState()), [SCHEMA_KEY]: String(SCHEMA_VERSION) });
      await db.removeLegacy();
    }
  } catch (e) {
    console.warn('Could not load saved kitchen data', e);
  }
  unsubscribe?.();
  unsubscribe = useKitchen.subscribe(() => {
    clearTimeout(timer);
    timer = setTimeout(() => void flushKitchen(db).catch((e) => console.warn('Save failed', e)), WRITE_DELAY);
  });
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') void flushKitchen(db);
    });
    // Ask once for persistent storage so the browser doesn't evict the kitchen.
    void db.requestPersistence();
  } else {
    AppState.addEventListener('change', (s) => {
      if (s !== 'active') void flushKitchen(db);
    });
  }
  setHydrated();
}

/** True once saved data has been loaded (avoids flashing onboarding on launch). */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => hydrated,
    () => false,
  );
}

/** Test helper. */
export function _resetPersistenceForTests() {
  hydrated = false;
  lastSaved = {};
  clearTimeout(timer);
  unsubscribe?.();
  unsubscribe = undefined;
}

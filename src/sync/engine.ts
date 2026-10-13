// Keeps this device's kitchen in sync with the household in Supabase.
//
//   send:    queued ops -> apply_ops() in batches; retried with backoff when offline.
//   receive: household_snapshot() (data + which queued ops are already applied, read in one
//            statement), then queued ops still unknown to the server are re-applied on top.
//   live:    Realtime postgres_changes on the household's tables trigger a debounced refresh.

import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { AppState, type NativeEventSubscription } from 'react-native';

import { registerSyncFlush, useKitchen } from '@/store/kitchen';

import { applyOps, stateFromRows, type Op, type SnapshotRows } from './state';

const TABLES = [
  'inventory_items',
  'meal_history',
  'outside_meals',
  'recipe_feedback',
  'shopping_extras',
  'ai_recipes',
  'household_docs',
] as const;
const BATCH = 100;

export interface SyncHooks {
  /** Membership changed (partner joined/left) — reload the members list. */
  onMembersChanged?: () => void;
  /** The server says we're no longer a member (removed by the owner). */
  onLostAccess?: () => void;
}

/** A Postgres error (SQLSTATE) means the server rejected the request; anything else is transport. */
function isServerRejection(error: { code?: string } | null): boolean {
  return !!error?.code && /^[0-9A-Z]{5}$/.test(error.code);
}

export class SyncEngine {
  private channel?: RealtimeChannel;
  private appState?: NativeEventSubscription;
  private refreshTimer?: ReturnType<typeof setTimeout>;
  private retryTimer?: ReturnType<typeof setTimeout>;
  private retryDelay = 2000;
  private flushing = false;
  private stopped = false;

  constructor(
    private client: SupabaseClient,
    readonly householdId: string,
    private hooks: SyncHooks = {},
  ) {}

  start() {
    registerSyncFlush(() => void this.flush());
    this.subscribe();
    this.appState = AppState.addEventListener('change', (s) => {
      if (s === 'active') {
        this.scheduleRefresh(0);
        void this.flush();
      }
    });
    void this.flush();
    return this.refresh();
  }

  stop() {
    this.stopped = true;
    registerSyncFlush(undefined);
    this.appState?.remove();
    clearTimeout(this.refreshTimer);
    clearTimeout(this.retryTimer);
    if (this.channel) void this.client.removeChannel(this.channel);
  }

  /** Pulls the household snapshot and rebases still-unconfirmed local ops on top of it. */
  async refresh(): Promise<void> {
    if (this.stopped) return;
    const pendingIds = useKitchen.getState().pendingOps.map((o) => o.id);
    const { data, error } = await this.client.rpc('household_snapshot', {
      p_household: this.householdId,
      p_pending: pendingIds,
    });
    if (this.stopped) return;
    if (error) {
      useKitchen.setState({
        syncError: isServerRejection(error) ? error.message : 'Offline — showing saved data',
      });
      if (!isServerRejection(error)) this.scheduleRefresh(this.retryDelay);
      return;
    }
    if (data === null) {
      this.hooks.onLostAccess?.();
      return;
    }
    const snap = data as SnapshotRows & { applied: string[] };
    const applied = new Set(snap.applied);
    // Read pending again: ops may have been queued while the request was in flight.
    const remaining = useKitchen.getState().pendingOps.filter((o) => !applied.has(o.id));
    useKitchen.setState({
      ...applyOps(stateFromRows(snap), remaining),
      pendingOps: remaining,
      householdId: this.householdId,
      lastSyncedAt: new Date().toISOString(),
      syncError: undefined,
    });
  }

  /** Sends queued ops in batches. Safe to call often; only one send runs at a time. */
  async flush(): Promise<void> {
    if (this.flushing || this.stopped) return;
    this.flushing = true;
    try {
      for (;;) {
        const batch: Op[] = useKitchen.getState().pendingOps.slice(0, BATCH);
        if (!batch.length) break;
        const { error } = await this.client.rpc('apply_ops', {
          p_household: this.householdId,
          p_ops: batch,
        });
        if (this.stopped) return;
        if (error && !isServerRejection(error)) {
          useKitchen.setState({ syncError: 'Offline — changes will sync when you’re back online' });
          this.scheduleRetry();
          return;
        }
        if (error && /not_a_member/.test(error.message)) {
          this.hooks.onLostAccess?.();
          return;
        }
        const sent = new Set(batch.map((o) => o.id));
        useKitchen.setState((s) => ({
          pendingOps: s.pendingOps.filter((o) => !sent.has(o.id)),
          // A rejected batch is dropped so one bad change can't block the queue forever.
          syncError: error
            ? `A change couldn’t be saved (${error.message}). Showing the latest data.`
            : undefined,
        }));
        this.retryDelay = 2000;
        if (error) this.scheduleRefresh(0);
      }
      // Make sure we converge even if a realtime event is missed.
      this.scheduleRefresh(1500);
    } finally {
      this.flushing = false;
    }
  }

  private scheduleRetry() {
    clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(() => void this.flush(), this.retryDelay);
    this.retryDelay = Math.min(this.retryDelay * 2, 60_000);
  }

  private scheduleRefresh(ms = 400) {
    clearTimeout(this.refreshTimer);
    this.refreshTimer = setTimeout(() => void this.refresh(), ms);
  }

  private subscribe() {
    const hid = this.householdId;
    let ch = this.client.channel(`household-${hid}`);
    for (const table of TABLES) {
      ch = ch
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table, filter: `household_id=eq.${hid}` },
          () => this.scheduleRefresh(),
        )
        // Deletes can't be filtered server-side; the old row carries the primary key.
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table }, (p) => {
          if ((p.old as { household_id?: string })?.household_id === hid) this.scheduleRefresh();
        });
    }
    ch = ch
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'household_members',
          filter: `household_id=eq.${hid}`,
        },
        () => this.hooks.onMembersChanged?.(),
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'household_members' },
        (p) => {
          if ((p.old as { household_id?: string })?.household_id === hid)
            this.hooks.onMembersChanged?.();
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'households', filter: `id=eq.${hid}` },
        () => this.hooks.onMembersChanged?.(),
      );
    this.channel = ch.subscribe((status) => {
      // Catch up on anything missed while disconnected.
      if (status === 'SUBSCRIBED') this.scheduleRefresh(0);
    });
  }
}

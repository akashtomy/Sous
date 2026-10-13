import * as Crypto from 'expo-crypto';
import { create } from 'zustand';

import { ingredientById, recipeById } from '@/core/catalog';
import { deduct, isLow, type Need } from '@/core/inventory';
import type { OutsideMeal, Rating } from '@/core/persona';
import { remainingShortfall, type Preferences, type WeekPlan } from '@/core/planner';
import type { Course, Inventory, Recipe } from '@/core/types';
import { notifyLowStock } from '@/lib/notify';
import {
  applyOps,
  EMPTY_SHARED,
  pickShared,
  settingsDoc,
  type HistoryEntry,
  type Op,
  type OpBody,
  type SharedState,
} from '@/sync/state';

export type { HistoryEntry } from '@/sync/state';

/** Settings that belong to this device, not the household. */
export interface Settings {
  notifications: boolean;
  claudeEnabled: boolean;
  hasApiKey: boolean;
  model: string;
}

export interface Toast {
  id: number;
  message: string;
  undoEntryId?: string;
}

interface KitchenState extends SharedState {
  settings: Settings;
  seed: number;
  toast?: Toast;
  /** Household this cached data belongs to (accounts mode). */
  householdId?: string;
  /** Changes made on this device that the server hasn't confirmed yet. */
  pendingOps: Op[];
  syncError?: string;
  lastSyncedAt?: string;

  /** Applies changes locally and, with accounts on, queues them for the server. */
  dispatch: (ops: OpBody[]) => void;
  completeOnboarding: (inv: Inventory) => void;
  setStock: (id: string, qty: number) => void;
  addStock: (id: string, qty: number) => void;
  removeStock: (id: string) => void;
  setPar: (id: string, par: number | undefined) => void;
  setPrefs: (p: Partial<Preferences>) => void;
  shuffle: () => void;
  cook: (
    recipeId: string,
    servings: number,
    needs: Need[],
    opts?: { slot?: HistoryEntry['slot']; course?: Course },
  ) => HistoryEntry;
  undoCook: (entryId: string) => void;
  setPlan: (plan: WeekPlan | undefined) => void;
  /** Puts a recipe into a plan slot (alternatives, "add to plan"); the old one counts as swapped away. */
  setSlotRecipe: (day: number, course: Course, recipeId: string) => void;
  rate: (recipeId: string, rating: Rating | undefined) => void;
  hideRecipe: (recipeId: string) => void;
  unhideRecipe: (recipeId: string) => void;
  logOutside: (meal: Omit<OutsideMeal, 'id'>) => string;
  removeOutside: (id: string) => void;
  setVideo: (recipeId: string, url: string | undefined) => void;
  togglePrepDone: (taskId: string) => void;
  markPurchased: (items: { ingredientId: string; qty: number }[]) => void;
  addToShopping: (needs: Need[]) => void;
  clearShoppingExtras: () => void;
  saveAiRecipes: (rs: Recipe[]) => void;
  removeAiRecipe: (id: string) => void;
  setCartService: (name: string) => void;
  updateSettings: (s: Partial<Settings>) => void;
  showToast: (message: string, undoEntryId?: string) => void;
  dismissToast: () => void;
  resetAll: () => void;
}

/** Local calendar date as YYYY-MM-DD. */
export function todayIso(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export const DEFAULT_SETTINGS: Settings = {
  notifications: false,
  claudeEnabled: false,
  hasApiKey: false,
  model: 'claude-opus-5-5',
};

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

// The sync engine registers here; kept as a hook to avoid an import cycle.
let onQueued: (() => void) | undefined;
export function registerSyncFlush(fn: (() => void) | undefined) {
  onQueued = fn;
}

function patchSlot(
  plan: WeekPlan | undefined,
  day: number,
  course: Course,
  patch: (slot: WeekPlan['days'][number][number]) => WeekPlan['days'][number][number],
): WeekPlan | undefined {
  if (!plan) return plan;
  return {
    ...plan,
    days: plan.days.map((d, di) =>
      di === day ? d.map((x) => (x.course === course ? patch(x) : x)) : d,
    ),
  };
}

const planOp = (plan: WeekPlan | undefined): OpBody => ({
  type: 'doc.set',
  key: 'plan',
  data: plan ?? null,
});

const lowNames = (inv: Inventory) =>
  new Set(
    Object.values(inv)
      .filter(isLow)
      .map((i) => i.ingredientId),
  );

// Saved to the device database by store/persistence.ts (SQLite on phones, IndexedDB on web).
export const useKitchen = create<KitchenState>()(
    (set, get) => ({
      ...EMPTY_SHARED,
      settings: DEFAULT_SETTINGS,
      seed: 1,
      pendingOps: [],

      dispatch: (ops) => {
        if (!ops.length) return;
        const queued = get().householdId
          ? ops.map((o) => ({ ...o, id: Crypto.randomUUID() }) as Op)
          : [];
        set((s) => ({
          ...applyOps(pickShared(s), ops),
          pendingOps: queued.length ? [...s.pendingOps, ...queued] : s.pendingOps,
        }));
        if (queued.length) onQueued?.();
      },

      completeOnboarding: (inv) =>
        get().dispatch([
          { type: 'inv.replace_all', items: Object.values(inv) },
          { type: 'doc.set', key: 'settings', data: { ...settingsDoc(get()), onboarded: true } },
        ]),

      setStock: (id, qty) =>
        get().dispatch([
          {
            type: 'inv.set',
            ingredientId: id,
            qty,
            ...(get().inventory[id] ? {} : { addedOn: todayIso() }),
          },
        ]),
      addStock: (id, qty) =>
        get().dispatch([{ type: 'inv.delta', ingredientId: id, delta: qty, addedOn: todayIso() }]),
      removeStock: (id) => get().dispatch([{ type: 'inv.remove', ingredientId: id }]),
      setPar: (id, par) =>
        get().dispatch([{ type: 'inv.par', ingredientId: id, par: par ?? null }]),

      setPrefs: (p) =>
        get().dispatch([{ type: 'doc.set', key: 'prefs', data: { ...get().prefs, ...p } }]),
      shuffle: () => set((s) => ({ seed: s.seed + 1 })),

      cook: (recipeId, servings, needs, opts = {}) => {
        const { slot } = opts;
        const before = lowNames(get().inventory);
        const { applied } = deduct(get().inventory, needs);
        const course = slot?.course ?? opts.course;
        const entry: HistoryEntry = {
          id: newId(),
          recipeId,
          servings,
          date: todayIso(),
          applied,
          ...(slot ? { slot } : {}),
          ...(course ? { course } : {}),
        };
        const ops: OpBody[] = applied.map((a) => ({
          type: 'inv.delta',
          ingredientId: a.ingredientId,
          delta: -(a.before - a.after),
        }));
        ops.push({ type: 'history.add', entry });
        if (slot) {
          ops.push(
            planOp(
              patchSlot(get().plan, slot.day, slot.course, (x) => ({
                ...x,
                cookedEntryId: entry.id,
              })),
            ),
          );
        }
        get().dispatch(ops);
        const name = recipeById(recipeId, get().aiRecipes)?.name ?? 'Meal';
        get().showToast(`${name} cooked — inventory updated`, entry.id);
        const newlyLow = [...lowNames(get().inventory)].filter((id) => !before.has(id));
        if (get().settings.notifications && newlyLow.length) {
          void notifyLowStock(newlyLow.map((id) => ingredientById(id)?.name ?? id));
        }
        return entry;
      },

      undoCook: (entryId) => {
        const s = get();
        const entry = s.history.find((h) => h.id === entryId);
        if (!entry) return;
        const ops: OpBody[] = entry.applied.map((a) => ({
          type: 'inv.delta',
          ingredientId: a.ingredientId,
          delta: a.before - a.after,
        }));
        ops.push({ type: 'history.remove', entryId });
        if (s.plan?.days.some((d) => d.some((x) => x.cookedEntryId === entryId))) {
          ops.push(
            planOp({
              ...s.plan,
              days: s.plan.days.map((d) =>
                d.map((x) =>
                  x.cookedEntryId === entryId ? { ...x, cookedEntryId: undefined } : x,
                ),
              ),
            }),
          );
        }
        s.dispatch(ops);
        set({ toast: { id: Date.now(), message: 'Undone — inventory restored' } });
      },

      setPlan: (plan) =>
        get().dispatch([planOp(plan), { type: 'doc.set', key: 'prep_done', data: [] }]),

      setSlotRecipe: (day, course, recipeId) => {
        const s = get();
        const old = s.plan?.days[day]?.find((x) => x.course === course);
        if (!s.plan || !old || old.recipeId === recipeId) return;
        const plan = patchSlot(s.plan, day, course, (x) => ({
          ...x,
          recipeId,
          alternates: [x.recipeId, ...x.alternates.filter((a) => a !== recipeId)],
          cookedEntryId: undefined,
          eatOutId: undefined,
        }))!;
        s.dispatch([
          planOp({ ...plan, shortfall: remainingShortfall(plan, s.inventory, s.aiRecipes) }),
          { type: 'feedback.swapped', recipeId: old.recipeId },
        ]);
      },

      rate: (recipeId, rating) =>
        get().dispatch([{ type: 'feedback.rating', recipeId, rating: rating ?? null }]),
      hideRecipe: (recipeId) => {
        get().dispatch([{ type: 'feedback.hidden', recipeId, hidden: true }]);
        set({ toast: { id: Date.now(), message: 'Got it — we won’t suggest that again' } });
      },
      unhideRecipe: (recipeId) =>
        get().dispatch([{ type: 'feedback.hidden', recipeId, hidden: false }]),

      logOutside: (meal) => {
        const id = newId();
        const ops: OpBody[] = [{ type: 'outside.add', meal: { ...meal, id } }];
        if (meal.replacedSlot) {
          ops.push(
            planOp(
              patchSlot(get().plan, meal.replacedSlot.day, meal.replacedSlot.course, (x) => ({
                ...x,
                eatOutId: id,
              })),
            ),
          );
        }
        get().dispatch(ops);
        set({ toast: { id: Date.now(), message: `Logged ${meal.name}` } });
        return id;
      },
      removeOutside: (id) => {
        const s = get();
        const ops: OpBody[] = [{ type: 'outside.remove', mealId: id }];
        if (s.plan?.days.some((d) => d.some((x) => x.eatOutId === id))) {
          ops.push(
            planOp({
              ...s.plan,
              days: s.plan.days.map((d) =>
                d.map((x) => (x.eatOutId === id ? { ...x, eatOutId: undefined } : x)),
              ),
            }),
          );
        }
        s.dispatch(ops);
      },

      setVideo: (recipeId, url) =>
        get().dispatch([{ type: 'feedback.video', recipeId, url: url ?? null }]),
      togglePrepDone: (taskId) => {
        const done = get().prepDone;
        get().dispatch([
          {
            type: 'doc.set',
            key: 'prep_done',
            data: done.includes(taskId) ? done.filter((t) => t !== taskId) : [...done, taskId],
          },
        ]);
      },

      markPurchased: (items) => {
        const today = todayIso();
        get().dispatch([
          ...items.map((i): OpBody => ({
            type: 'inv.delta',
            ingredientId: i.ingredientId,
            delta: i.qty,
            addedOn: today,
          })),
          { type: 'shopping.remove', ingredientIds: items.map((i) => i.ingredientId) },
        ]);
        set({
          toast: {
            id: Date.now(),
            message: `${items.length} item${items.length === 1 ? '' : 's'} added to your kitchen`,
          },
        });
      },
      addToShopping: (needs) => {
        get().dispatch([{ type: 'shopping.add', items: needs }]);
        set({
          toast: {
            id: Date.now(),
            message: `Added ${needs.length} item${needs.length === 1 ? '' : 's'} to your shopping list`,
          },
        });
      },
      clearShoppingExtras: () => get().dispatch([{ type: 'shopping.clear' }]),

      saveAiRecipes: (rs) => get().dispatch([{ type: 'ai.add', recipes: rs }]),
      removeAiRecipe: (id) => get().dispatch([{ type: 'ai.remove', recipeId: id }]),
      setCartService: (name) =>
        get().dispatch([
          { type: 'doc.set', key: 'settings', data: { ...settingsDoc(get()), cartService: name } },
        ]),
      updateSettings: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),
      showToast: (message, undoEntryId) => set({ toast: { id: Date.now(), message, undoEntryId } }),
      dismissToast: () => set({ toast: undefined }),
      resetAll: () => {
        get().dispatch([{ type: 'reset' }]);
        set({ seed: 1, toast: undefined });
      },
    })
);

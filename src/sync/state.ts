// The household's shared kitchen state and the operations that change it.
//
// Every change is an Op. The app applies ops locally right away (optimistic), queues them,
// and sends them to Supabase's apply_ops(). When a fresh server snapshot arrives, ops that
// the server hasn't seen yet are re-applied on top, so nothing typed offline is lost.
// applyOp() mirrors the SQL in supabase/migrations exactly.

import type { Applied, Need } from '@/core/inventory';
import type { OutsideMeal, Rating } from '@/core/persona';
import { DEFAULT_PREFS, type Preferences, type WeekPlan } from '@/core/planner';
import type { Course, Inventory, InventoryItem, Recipe } from '@/core/types';

export interface HistoryEntry {
  id: string;
  recipeId: string;
  servings: number;
  date: string;
  applied: Applied[];
  /** Set when cooked from the weekly plan. */
  slot?: { day: number; course: Course };
  course?: Course;
}

export interface SharedState {
  onboarded: boolean;
  inventory: Inventory;
  prefs: Preferences;
  plan?: WeekPlan;
  prepDone: string[];
  history: HistoryEntry[];
  aiRecipes: Recipe[];
  shoppingExtras: Need[];
  ratings: Record<string, Rating>;
  hidden: string[];
  swappedAway: Record<string, number>;
  outside: OutsideMeal[];
  videoLinks: Record<string, string>;
  cartService: string;
}

export const EMPTY_SHARED: SharedState = {
  onboarded: false,
  inventory: {},
  prefs: DEFAULT_PREFS,
  plan: undefined,
  prepDone: [],
  history: [],
  aiRecipes: [],
  shoppingExtras: [],
  ratings: {},
  hidden: [],
  swappedAway: {},
  outside: [],
  videoLinks: {},
  cartService: 'Swiggy Instamart',
};

export const SHARED_KEYS = Object.keys(EMPTY_SHARED) as (keyof SharedState)[];

export type DocKey = 'prefs' | 'plan' | 'prep_done' | 'settings';
export interface HouseholdSettingsDoc {
  onboarded: boolean;
  cartService: string;
}

export type OpBody =
  | { type: 'inv.delta'; ingredientId: string; delta: number; addedOn?: string }
  | { type: 'inv.set'; ingredientId: string; qty: number; addedOn?: string }
  | { type: 'inv.remove'; ingredientId: string }
  | { type: 'inv.par'; ingredientId: string; par: number | null }
  | { type: 'inv.replace_all'; items: InventoryItem[] }
  | { type: 'history.add'; entry: HistoryEntry }
  | { type: 'history.remove'; entryId: string }
  | { type: 'outside.add'; meal: OutsideMeal }
  | { type: 'outside.remove'; mealId: string }
  | { type: 'feedback.rating'; recipeId: string; rating: Rating | null }
  | { type: 'feedback.hidden'; recipeId: string; hidden: boolean }
  | { type: 'feedback.swapped'; recipeId: string }
  | { type: 'feedback.video'; recipeId: string; url: string | null }
  | { type: 'shopping.add'; items: Need[] }
  | { type: 'shopping.remove'; ingredientIds: string[] }
  | { type: 'shopping.clear' }
  | { type: 'ai.add'; recipes: Recipe[] }
  | { type: 'ai.remove'; recipeId: string }
  | { type: 'doc.set'; key: 'prefs'; data: Preferences }
  | { type: 'doc.set'; key: 'plan'; data: WeekPlan | null }
  | { type: 'doc.set'; key: 'prep_done'; data: string[] }
  | { type: 'doc.set'; key: 'settings'; data: HouseholdSettingsDoc }
  | { type: 'reset' };

export type Op = OpBody & { id: string };

const r2 = (n: number) => Math.round(n * 100) / 100;

function without<K extends string, V>(rec: Record<K, V>, key: K): Record<K, V> {
  const next = { ...rec };
  delete next[key];
  return next;
}

/** Applies one op to the shared state (pure). */
export function applyOp(s: SharedState, op: OpBody): SharedState {
  switch (op.type) {
    case 'inv.delta': {
      const prev = s.inventory[op.ingredientId];
      if (op.delta < 0) {
        if (!prev) return s;
        return {
          ...s,
          inventory: {
            ...s.inventory,
            [op.ingredientId]: { ...prev, qty: r2(Math.max(prev.qty + op.delta, 0)) },
          },
        };
      }
      if (op.delta === 0) return s;
      const item: InventoryItem = {
        ...(prev ?? { ingredientId: op.ingredientId, qty: 0 }),
        qty: r2((prev?.qty ?? 0) + op.delta),
        ...((op.addedOn ?? prev?.addedOn) ? { addedOn: op.addedOn ?? prev?.addedOn } : {}),
      };
      return { ...s, inventory: { ...s.inventory, [op.ingredientId]: item } };
    }
    case 'inv.set': {
      const prev = s.inventory[op.ingredientId];
      const addedOn = op.addedOn ?? prev?.addedOn;
      const item: InventoryItem = {
        ...(prev ?? { ingredientId: op.ingredientId }),
        ingredientId: op.ingredientId,
        qty: r2(Math.max(op.qty, 0)),
        ...(addedOn ? { addedOn } : {}),
      };
      return { ...s, inventory: { ...s.inventory, [op.ingredientId]: item } };
    }
    case 'inv.remove':
      return { ...s, inventory: without(s.inventory, op.ingredientId) };
    case 'inv.par': {
      const prev = s.inventory[op.ingredientId];
      if (!prev) return s;
      const next = { ...prev };
      if (op.par === null) delete next.par;
      else next.par = op.par;
      return { ...s, inventory: { ...s.inventory, [op.ingredientId]: next } };
    }
    case 'inv.replace_all':
      return {
        ...s,
        inventory: Object.fromEntries(
          op.items.map((i) => [i.ingredientId, { ...i, qty: Math.max(i.qty, 0) }]),
        ),
      };

    case 'history.add':
      if (s.history.some((h) => h.id === op.entry.id)) return s;
      return { ...s, history: [op.entry, ...s.history].slice(0, 500) };
    case 'history.remove':
      return { ...s, history: s.history.filter((h) => h.id !== op.entryId) };

    case 'outside.add':
      if (s.outside.some((o) => o.id === op.meal.id)) return s;
      return { ...s, outside: [op.meal, ...s.outside].slice(0, 500) };
    case 'outside.remove':
      return { ...s, outside: s.outside.filter((o) => o.id !== op.mealId) };

    case 'feedback.rating':
      return {
        ...s,
        ratings: op.rating
          ? { ...s.ratings, [op.recipeId]: op.rating }
          : without(s.ratings, op.recipeId),
      };
    case 'feedback.hidden':
      return {
        ...s,
        hidden: op.hidden
          ? s.hidden.includes(op.recipeId)
            ? s.hidden
            : [...s.hidden, op.recipeId]
          : s.hidden.filter((h) => h !== op.recipeId),
      };
    case 'feedback.swapped':
      return {
        ...s,
        swappedAway: { ...s.swappedAway, [op.recipeId]: (s.swappedAway[op.recipeId] ?? 0) + 1 },
      };
    case 'feedback.video':
      return {
        ...s,
        videoLinks: op.url
          ? { ...s.videoLinks, [op.recipeId]: op.url }
          : without(s.videoLinks, op.recipeId),
      };

    case 'shopping.add': {
      const merged = new Map(s.shoppingExtras.map((n) => [n.ingredientId, n.qty]));
      for (const n of op.items)
        merged.set(n.ingredientId, Math.max(merged.get(n.ingredientId) ?? 0, n.qty));
      return {
        ...s,
        shoppingExtras: [...merged].map(([ingredientId, qty]) => ({ ingredientId, qty })),
      };
    }
    case 'shopping.remove':
      return {
        ...s,
        shoppingExtras: s.shoppingExtras.filter((n) => !op.ingredientIds.includes(n.ingredientId)),
      };
    case 'shopping.clear':
      return { ...s, shoppingExtras: [] };

    case 'ai.add': {
      const fresh = op.recipes.filter((r) => !s.aiRecipes.some((x) => x.id === r.id));
      return { ...s, aiRecipes: [...fresh, ...s.aiRecipes].slice(0, 60) };
    }
    case 'ai.remove':
      return { ...s, aiRecipes: s.aiRecipes.filter((r) => r.id !== op.recipeId) };

    case 'doc.set':
      if (op.key === 'prefs') return { ...s, prefs: { ...DEFAULT_PREFS, ...op.data } };
      if (op.key === 'plan') return { ...s, plan: op.data ?? undefined };
      if (op.key === 'prep_done') return { ...s, prepDone: op.data };
      return {
        ...s,
        onboarded: !!op.data.onboarded,
        cartService: op.data.cartService || EMPTY_SHARED.cartService,
      };

    case 'reset':
      return { ...EMPTY_SHARED };
  }
}

export function applyOps(s: SharedState, ops: OpBody[]): SharedState {
  return ops.reduce(applyOp, s);
}

export function pickShared<T extends SharedState>(s: T): SharedState {
  return Object.fromEntries(SHARED_KEYS.map((k) => [k, s[k]])) as unknown as SharedState;
}

export function settingsDoc(
  s: Pick<SharedState, 'onboarded' | 'cartService'>,
): HouseholdSettingsDoc {
  return { onboarded: s.onboarded, cartService: s.cartService };
}

/** Ops that recreate a device's existing data inside a newly created household. */
export function opsToUpload(s: SharedState): OpBody[] {
  const ops: OpBody[] = [{ type: 'inv.replace_all', items: Object.values(s.inventory) }];
  for (const entry of [...s.history].reverse()) ops.push({ type: 'history.add', entry });
  for (const meal of [...s.outside].reverse()) ops.push({ type: 'outside.add', meal });
  for (const [recipeId, rating] of Object.entries(s.ratings))
    ops.push({ type: 'feedback.rating', recipeId, rating });
  for (const recipeId of s.hidden) ops.push({ type: 'feedback.hidden', recipeId, hidden: true });
  for (const [recipeId, n] of Object.entries(s.swappedAway))
    for (let i = 0; i < n; i++) ops.push({ type: 'feedback.swapped', recipeId });
  for (const [recipeId, url] of Object.entries(s.videoLinks))
    ops.push({ type: 'feedback.video', recipeId, url });
  if (s.shoppingExtras.length) ops.push({ type: 'shopping.add', items: s.shoppingExtras });
  if (s.aiRecipes.length) ops.push({ type: 'ai.add', recipes: [...s.aiRecipes].reverse() });
  ops.push({ type: 'doc.set', key: 'prefs', data: s.prefs });
  if (s.plan) ops.push({ type: 'doc.set', key: 'plan', data: s.plan });
  if (s.prepDone.length) ops.push({ type: 'doc.set', key: 'prep_done', data: s.prepDone });
  ops.push({ type: 'doc.set', key: 'settings', data: settingsDoc(s) });
  return ops;
}

// ---------------------------------------------------------------- server rows -> state

export interface SnapshotRows {
  inventory: {
    ingredient_id: string;
    qty: number | string;
    par: number | string | null;
    added_on: string | null;
  }[];
  history: {
    id: string;
    recipe_id: string;
    servings: number | string;
    date: string;
    course: string | null;
    slot: HistoryEntry['slot'] | null;
    applied: Applied[] | null;
  }[];
  outside: { data: OutsideMeal }[];
  feedback: {
    recipe_id: string;
    rating: Rating | null;
    hidden: boolean;
    swapped_away: number;
    video_url: string | null;
  }[];
  shopping: { ingredient_id: string; qty: number | string }[];
  ai: { data: Recipe }[];
  docs: { key: DocKey; data: unknown }[];
}

/** Builds shared state from the household's rows (history and outside meals newest first). */
export function stateFromRows(rows: SnapshotRows): SharedState {
  const s: SharedState = { ...EMPTY_SHARED };
  s.inventory = Object.fromEntries(
    rows.inventory.map((r) => {
      const item: InventoryItem = { ingredientId: r.ingredient_id, qty: Number(r.qty) };
      if (r.par !== null && r.par !== undefined) item.par = Number(r.par);
      if (r.added_on) item.addedOn = r.added_on.slice(0, 10);
      return [r.ingredient_id, item];
    }),
  );
  s.history = rows.history.map((r) => ({
    id: r.id,
    recipeId: r.recipe_id,
    servings: Number(r.servings),
    date: r.date.slice(0, 10),
    applied: r.applied ?? [],
    ...(r.slot ? { slot: r.slot } : {}),
    ...(r.course ? { course: r.course as Course } : {}),
  }));
  s.outside = rows.outside.map((r) => r.data);
  for (const f of rows.feedback) {
    if (f.rating) s.ratings = { ...s.ratings, [f.recipe_id]: f.rating };
    if (f.hidden) s.hidden = [...s.hidden, f.recipe_id];
    if (f.swapped_away) s.swappedAway = { ...s.swappedAway, [f.recipe_id]: f.swapped_away };
    if (f.video_url) s.videoLinks = { ...s.videoLinks, [f.recipe_id]: f.video_url };
  }
  s.shoppingExtras = rows.shopping.map((r) => ({
    ingredientId: r.ingredient_id,
    qty: Number(r.qty),
  }));
  s.aiRecipes = rows.ai.map((r) => r.data);
  for (const d of rows.docs) {
    if (d.key === 'prefs') s.prefs = { ...DEFAULT_PREFS, ...(d.data as Partial<Preferences>) };
    else if (d.key === 'plan') s.plan = d.data as WeekPlan;
    else if (d.key === 'prep_done') s.prepDone = d.data as string[];
    else if (d.key === 'settings') {
      const doc = d.data as Partial<HouseholdSettingsDoc>;
      s.onboarded = !!doc.onboarded;
      s.cartService = doc.cartService || EMPTY_SHARED.cartService;
    }
  }
  return s;
}

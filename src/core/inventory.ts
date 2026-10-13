import { ingredientById } from './catalog';
import type { Ingredient, Inventory, InventoryItem, Recipe } from './types';

export interface Need {
  ingredientId: string;
  qty: number;
  optional?: boolean;
}

/** One change applied to the inventory; kept so it can be undone exactly. */
export interface Applied {
  ingredientId: string;
  before: number;
  after: number;
}

const round = (n: number) => Math.round(n * 100) / 100;

/** Recipe ingredient quantities for a number of servings. Staples (salt, water) are excluded. */
export function scaledNeeds(recipe: Recipe, servings: number): Need[] {
  return recipe.ingredients
    .filter((i) => !ingredientById(i.id)?.staple)
    .map((i) => ({
      ingredientId: i.id,
      qty: round(i.qty * servings),
      ...(i.optional ? { optional: true } : {}),
    }));
}

export function stockOf(inv: Inventory, id: string): number {
  return inv[id]?.qty ?? 0;
}

/**
 * Deducts needs from the inventory, clamping at zero. Items not in the inventory are skipped
 * (nothing to deduct), and optional items are only deducted when in stock.
 */
export function deduct(
  inv: Inventory,
  needs: Need[],
): { inventory: Inventory; applied: Applied[] } {
  const next: Inventory = { ...inv };
  const applied: Applied[] = [];
  for (const n of needs) {
    const item = next[n.ingredientId];
    if (!item || n.qty <= 0) continue;
    const before = item.qty;
    const after = round(Math.max(0, before - n.qty));
    if (after === before) continue;
    next[n.ingredientId] = { ...item, qty: after };
    applied.push({ ingredientId: n.ingredientId, before, after });
  }
  return { inventory: next, applied };
}

/** Reverses a deduction. Only restores what was taken, so later restocks are preserved. */
export function undoDeduct(inv: Inventory, applied: Applied[]): Inventory {
  const next: Inventory = { ...inv };
  for (const a of applied) {
    const item = next[a.ingredientId];
    const taken = a.before - a.after;
    if (item) next[a.ingredientId] = { ...item, qty: round(item.qty + taken) };
    else next[a.ingredientId] = { ingredientId: a.ingredientId, qty: round(taken) };
  }
  return next;
}

/** Adds stock (a purchase, online or offline). Resets the freshness clock for perishables. */
export function restock(inv: Inventory, id: string, qty: number, today: string): Inventory {
  const prev = inv[id];
  const item: InventoryItem = {
    ...(prev ?? { ingredientId: id, qty: 0 }),
    qty: round((prev?.qty ?? 0) + qty),
    addedOn: today,
  };
  return { ...inv, [id]: item };
}

export function setQty(inv: Inventory, id: string, qty: number, today: string): Inventory {
  const prev = inv[id];
  return {
    ...inv,
    [id]: {
      ...(prev ?? { ingredientId: id }),
      ingredientId: id,
      qty: round(Math.max(0, qty)),
      addedOn: prev?.addedOn ?? today,
    },
  };
}

export function removeItem(inv: Inventory, id: string): Inventory {
  const next = { ...inv };
  delete next[id];
  return next;
}

export function parFor(item: InventoryItem, ing: Ingredient): number {
  return item.par ?? ing.defaultPar;
}

/** Below its par level. Items with a par of 0 (e.g. meat bought per plan) never count as low. */
export function isLow(item: InventoryItem): boolean {
  const ing = ingredientById(item.ingredientId);
  if (!ing || ing.staple) return false;
  const par = parFor(item, ing);
  return par > 0 && item.qty < par;
}

export function daysBetween(fromIso: string, toIso: string): number {
  const ms = Date.parse(toIso.slice(0, 10)) - Date.parse(fromIso.slice(0, 10));
  return Math.round(ms / 86_400_000);
}

/** Days of freshness left for a perishable item; undefined when it keeps. */
export function freshnessLeft(item: InventoryItem, today: string): number | undefined {
  const ing = ingredientById(item.ingredientId);
  if (!ing?.perishableDays || !item.addedOn || item.qty <= 0) return undefined;
  return ing.perishableDays - daysBetween(item.addedOn, today);
}

/** Perishables to use within `withinDays` days, soonest first. */
export function expiringSoon(inv: Inventory, today: string, withinDays = 1): InventoryItem[] {
  return Object.values(inv)
    .filter((i) => {
      const left = freshnessLeft(i, today);
      return left !== undefined && left <= withinDays;
    })
    .sort((a, b) => (freshnessLeft(a, today) ?? 0) - (freshnessLeft(b, today) ?? 0));
}

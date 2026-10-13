import { ingredientById } from './catalog';
import { isLow, parFor, type Need } from './inventory';
import type { Ingredient, IngredientCategory, Inventory } from './types';
import { formatPacks, formatQty } from './units';

export type RefillReason = 'low' | 'plan' | 'both';

export interface RefillItem {
  ingredientId: string;
  name: string;
  category: IngredientCategory;
  /** What is actually needed, in base units. */
  needQty: number;
  packSize: number;
  packCount: number;
  /** Human text, e.g. "2 × 500 g". */
  buyText: string;
  reason: RefillReason;
}

/** Smallest pack that covers the need; multiples of the largest pack when none is big enough. */
export function roundToPacks(ing: Ingredient, need: number): { packSize: number; count: number } {
  const packs = [...ing.packSizes].sort((a, b) => a - b);
  const fit = packs.find((p) => p >= need);
  if (fit) return { packSize: fit, count: 1 };
  const largest = packs[packs.length - 1];
  return { packSize: largest, count: Math.ceil(need / largest) };
}

/**
 * Merges items below par with the meal plan's shortfall. A low item is topped up to twice
 * its par so it doesn't immediately run low again.
 */
export function buildRefillList(inv: Inventory, planShortfall: Need[] = []): RefillItem[] {
  const need = new Map<string, { qty: number; low: boolean; plan: boolean }>();
  for (const item of Object.values(inv)) {
    if (!isLow(item)) continue;
    const ing = ingredientById(item.ingredientId);
    if (!ing) continue;
    need.set(item.ingredientId, {
      qty: Math.max(0, parFor(item, ing) * 2 - item.qty),
      low: true,
      plan: false,
    });
  }
  for (const s of planShortfall) {
    const prev = need.get(s.ingredientId);
    if (prev) need.set(s.ingredientId, { qty: prev.qty + s.qty, low: prev.low, plan: true });
    else need.set(s.ingredientId, { qty: s.qty, low: false, plan: true });
  }

  const out: RefillItem[] = [];
  for (const [id, n] of need) {
    const ing = ingredientById(id);
    if (!ing || ing.staple || n.qty <= 0) continue;
    const { packSize, count } = roundToPacks(ing, n.qty);
    out.push({
      ingredientId: id,
      name: ing.name,
      category: ing.category,
      needQty: Math.round(n.qty * 100) / 100,
      packSize,
      packCount: count,
      buyText: formatPacks(ing, packSize, count),
      reason: n.low && n.plan ? 'both' : n.low ? 'low' : 'plan',
    });
  }
  const order: IngredientCategory[] = [
    'vegetable',
    'fruit',
    'herb',
    'dairy',
    'protein',
    'grain',
    'pulse',
    'bakery',
    'oil',
    'nut',
    'spice',
    'condiment',
  ];
  return out.sort(
    (a, b) => order.indexOf(a.category) - order.indexOf(b.category) || a.name.localeCompare(b.name),
  );
}

/**
 * Message to paste into Claude (with the Swiggy Instamart connector enabled) so it fills the
 * cart. Explicitly asks Claude not to check out.
 */
export function cartMessage(items: RefillItem[], service = 'Swiggy Instamart'): string {
  const lines = items.map((i) => `- ${i.name}: ${i.buyText}`);
  return [
    `Please add these items to my ${service} cart. Pick a commonly available brand, ask me if a pack size or product is ambiguous, and do NOT check out or pay:`,
    ...lines,
  ].join('\n');
}

/** Plain list for sharing or copying. */
export function plainList(items: RefillItem[]): string {
  return items.map((i) => `${i.name} — ${i.buyText}`).join('\n');
}

export function describeNeed(n: Need): string {
  const ing = ingredientById(n.ingredientId);
  return ing ? `${ing.name} ${formatQty(ing, n.qty)}` : n.ingredientId;
}

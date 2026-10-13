import type { Course, HealthTier, Ingredient, Macros, Nutrition, RecipeIngredient } from './types';

export const ZERO_MACROS: Macros = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 };

/** Grams (or ml) represented by a quantity in the ingredient's base unit. */
export function toGrams(ing: Ingredient, qty: number): number {
  return ing.unit === 'pc' ? qty * (ing.gramsPerPc ?? 0) : qty;
}

export function macrosFor(ing: Ingredient, qty: number): Macros {
  const f = toGrams(ing, qty) / 100;
  const p = ing.per100;
  return {
    kcal: p.kcal * f,
    protein: p.protein * f,
    carbs: p.carbs * f,
    fat: p.fat * f,
    fiber: p.fiber * f,
    sugar: p.sugar * f,
  };
}

export function addMacros(a: Macros, b: Macros): Macros {
  return {
    kcal: a.kcal + b.kcal,
    protein: a.protein + b.protein,
    carbs: a.carbs + b.carbs,
    fat: a.fat + b.fat,
    fiber: a.fiber + b.fiber,
    sugar: a.sugar + b.sugar,
  };
}

const r1 = (n: number) => Math.round(n * 10) / 10;

export function scaleNutrition(n: Nutrition, factor: number): Nutrition {
  return {
    kcal: Math.round(n.kcal * factor),
    protein: r1(n.protein * factor),
    carbs: r1(n.carbs * factor),
    fat: r1(n.fat * factor),
    fiber: r1(n.fiber * factor),
    sugar: r1(n.sugar * factor),
    addedSugar: r1(n.addedSugar * factor),
  };
}

/** Per-serving nutrition for a recipe's ingredient list. Optional items are counted. */
export function computeNutrition(
  items: RecipeIngredient[],
  lookup: (id: string) => Ingredient | undefined,
): Nutrition {
  let total = ZERO_MACROS;
  let addedSugar = 0;
  for (const it of items) {
    const ing = lookup(it.id);
    if (!ing) continue;
    const m = macrosFor(ing, it.qty);
    total = addMacros(total, m);
    if (ing.sweetener) addedSugar += m.sugar;
  }
  return scaleNutrition({ ...total, addedSugar }, 1);
}

/** Per-serving kcal ceilings used by the health classification. */
export const KCAL_LIMITS: Record<Course, { healthy: number; indulgent: number }> = {
  breakfast: { healthy: 450, indulgent: 600 },
  lunch: { healthy: 600, indulgent: 800 },
  dinner: { healthy: 600, indulgent: 800 },
  snack: { healthy: 250, indulgent: 400 },
  dessert: { healthy: 250, indulgent: 400 },
};

/**
 * Transparent rules (also shown in the app):
 * - indulgent: tagged fried; or kcal above the course's indulgent cap; or fat > 55 % of kcal;
 *   or added sugar > 10 % of kcal (mains) / > 25 g (desserts).
 * - healthy: kcal within the healthy cap, fat ≤ 40 % of kcal, fibre ≥ 3 g (≥ 1 g desserts,
 *   ≥ 1.5 g snacks), added sugar ≤ 5 % of kcal (≤ 12 g desserts), and for meals protein ≥ 10 % of kcal.
 * - balanced: everything else.
 * The primary course (first listed) decides which limits apply.
 */
export function classifyHealth(n: Nutrition, course: Course, tags: string[]): HealthTier {
  const lim = KCAL_LIMITS[course];
  const kcal = Math.max(n.kcal, 1);
  const fatShare = (n.fat * 9) / kcal;
  const addedShare = (n.addedSugar * 4) / kcal;
  const proteinShare = (n.protein * 4) / kcal;
  const dessert = course === 'dessert';
  const snack = course === 'snack';

  if (
    tags.includes('fried') ||
    n.kcal > lim.indulgent ||
    fatShare > 0.55 ||
    (dessert ? n.addedSugar > 25 : addedShare > 0.1)
  ) {
    return 'indulgent';
  }
  const healthy =
    n.kcal <= lim.healthy &&
    fatShare <= 0.4 &&
    n.fiber >= (dessert ? 1 : snack ? 1.5 : 3) &&
    (dessert ? n.addedSugar <= 12 : addedShare <= 0.05) &&
    (dessert || snack || proteinShare >= 0.1);
  return healthy ? 'healthy' : 'balanced';
}

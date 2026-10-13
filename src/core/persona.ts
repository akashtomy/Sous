// Learns a taste profile from what the household actually does: meals cooked, ratings,
// "not for me", swaps away from planned dishes, and meals eaten outside.

import { ingredientById } from './catalog';
import { addDays } from './dates';
import type { Course, Cuisine, Recipe } from './types';

export type Rating = 'love' | 'ok' | 'dislike';

export interface CookedRecord {
  recipeId: string;
  date: string;
  servings: number;
}

export interface OutsideMeal {
  id: string;
  date: string;
  course: Course;
  name: string;
  place?: string;
  /** Total spend for the meal. */
  cost?: number;
  /** Estimated kcal per person. */
  kcal: number;
  people: number;
  cuisine?: Cuisine;
  recipeId?: string;
  /** The planned meal it replaced, if any. */
  replacedSlot?: { day: number; course: Course };
}

export interface PersonaInput {
  cooked: CookedRecord[];
  ratings: Record<string, Rating>;
  hidden: string[];
  /** How often each recipe was swapped out of a plan. */
  swappedAway: Record<string, number>;
  outside: OutsideMeal[];
  lookup: (id: string) => Recipe | undefined;
  today: string;
}

/** What the planner uses to personalise ranking. */
export interface PersonaSignals {
  cuisineAffinity: Partial<Record<Cuisine, number>>;
  styleAffinity: Record<string, number>;
  /** Meals actually cooked per style, so claims like "you often cook X" need real evidence. */
  styleMeals: Record<string, number>;
  likedIngredients: string[];
  dislikedIngredients: string[];
  loved: string[];
  /** Rated "didn't like" or marked "not for me": never suggested. */
  excluded: string[];
  /** Swapped away repeatedly: ranked lower. */
  avoided: string[];
}

export interface Persona extends PersonaSignals {
  enoughData: boolean;
  labels: string[];
  mealsCooked: number;
  topCuisines: { cuisine: Cuisine; share: number }[];
  topStyles: { style: string; share: number }[];
  avgCookMin: number;
  healthyShare: number;
  avgKcal: number;
  thisWeek: { home: number; out: number; spend: number; kcalPerPersonPerDay: number };
}

const SKIP_CATEGORIES = new Set(['spice', 'condiment', 'oil', 'herb']);
const RATING_WEIGHT: Record<Rating, number> = { love: 3, ok: 1, dislike: -3 };

function topShares<K extends string>(weights: Map<K, number>, n: number) {
  const total = [...weights.values()].filter((v) => v > 0).reduce((a, b) => a + b, 0) || 1;
  return [...weights.entries()]
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k, v]) => ({ key: k, share: v / total }));
}

export function buildPersona(input: PersonaInput): Persona {
  const { cooked, ratings, hidden, swappedAway, outside, lookup, today } = input;
  const cuisineW = new Map<Cuisine, number>();
  const styleW = new Map<string, number>();
  const ingredientW = new Map<string, number>();
  const add = <K>(m: Map<K, number>, k: K, v: number) => m.set(k, (m.get(k) ?? 0) + v);

  // Every cooked meal counts once; ratings add (or subtract) on top.
  const recipeWeight = new Map<string, number>();
  for (const c of cooked) add(recipeWeight, c.recipeId, 1);
  for (const [id, r] of Object.entries(ratings)) add(recipeWeight, id, RATING_WEIGHT[r]);
  for (const id of hidden) add(recipeWeight, id, -3);

  for (const [id, w] of recipeWeight) {
    const r = lookup(id);
    if (!r) continue;
    add(cuisineW, r.cuisine, w);
    add(styleW, r.style, w);
    for (const it of r.ingredients) {
      const ing = ingredientById(it.id);
      if (!ing || ing.staple || SKIP_CATEGORIES.has(ing.category)) continue;
      add(ingredientW, it.id, w);
    }
  }
  // Eating out says something about cravings, at half weight.
  for (const o of outside) {
    const cuisine = o.cuisine ?? (o.recipeId ? lookup(o.recipeId)?.cuisine : undefined);
    if (cuisine) add(cuisineW, cuisine, 0.5);
  }

  const maxPos = (m: Map<string, number>) => Math.max(1, ...[...m.values()].filter((v) => v > 0));
  const cuisineMax = maxPos(cuisineW as Map<string, number>);
  const styleMax = maxPos(styleW);
  const cuisineAffinity: Partial<Record<Cuisine, number>> = {};
  for (const [c, w] of cuisineW) if (w > 0) cuisineAffinity[c] = w / cuisineMax;
  const styleAffinity: Record<string, number> = {};
  for (const [s, w] of styleW) if (w > 0) styleAffinity[s] = w / styleMax;
  // Too little history says nothing about taste yet: don't tilt rankings on one or two meals.
  const signalCount = cooked.length + Object.keys(ratings).length + hidden.length + outside.length;
  if (signalCount < 3) {
    for (const k of Object.keys(cuisineAffinity)) delete cuisineAffinity[k as Cuisine];
    for (const k of Object.keys(styleAffinity)) delete styleAffinity[k];
  }
  const styleMeals: Record<string, number> = {};
  for (const c of cooked) {
    const st = lookup(c.recipeId)?.style;
    if (st) styleMeals[st] = (styleMeals[st] ?? 0) + 1;
  }

  const loved = Object.entries(ratings)
    .filter(([, r]) => r === 'love')
    .map(([id]) => id);
  const excluded = [
    ...new Set([
      ...hidden,
      ...Object.entries(ratings)
        .filter(([, r]) => r === 'dislike')
        .map(([id]) => id),
    ]),
  ];
  const avoided = Object.entries(swappedAway)
    .filter(([id, n]) => n >= 2 && !loved.includes(id))
    .map(([id]) => id);

  const likedIngredients = [...ingredientW.entries()]
    .filter(([, w]) => w >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id]) => id);
  // An ingredient is disliked when it shows up in 2+ rejected dishes and in nothing loved.
  const rejectedCount = new Map<string, number>();
  const lovedIngredients = new Set(
    loved.flatMap((id) => lookup(id)?.ingredients.map((i) => i.id) ?? []),
  );
  for (const id of excluded) {
    for (const it of lookup(id)?.ingredients ?? []) {
      const ing = ingredientById(it.id);
      if (!ing || ing.staple || SKIP_CATEGORIES.has(ing.category) || lovedIngredients.has(it.id))
        continue;
      add(rejectedCount, it.id, 1);
    }
  }
  const dislikedIngredients = [...rejectedCount.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  // Descriptive stats over cooked meals.
  const cookedRecipes = cooked.map((c) => lookup(c.recipeId)).filter((r): r is Recipe => !!r);
  const n = cookedRecipes.length;
  const avg = (f: (r: Recipe) => number) =>
    n ? cookedRecipes.reduce((s, r) => s + f(r), 0) / n : 0;
  const avgCookMin = Math.round(avg((r) => r.totalMin));
  const healthyShare = n ? cookedRecipes.filter((r) => r.healthTier === 'healthy').length / n : 0;
  const avgKcal = Math.round(avg((r) => r.nutrition.kcal));
  const proteinShare = avg((r) => (r.nutrition.protein * 4) / Math.max(r.nutrition.kcal, 1));

  const weekStart = addDays(today, -6);
  const inWeek = (d: string) => d >= weekStart && d <= today;
  const homeWeek = cooked.filter((c) => inWeek(c.date));
  const outWeek = outside.filter((o) => inWeek(o.date));
  const kcalWeek =
    homeWeek.reduce((s, c) => s + (lookup(c.recipeId)?.nutrition.kcal ?? 0), 0) +
    outWeek.reduce((s, o) => s + o.kcal, 0);
  const daysWithFood =
    new Set([...homeWeek.map((c) => c.date), ...outWeek.map((o) => o.date)]).size || 1;

  const topCuisines = topShares(cuisineW, 3).map((x) => ({ cuisine: x.key, share: x.share }));
  const topStyles = topShares(styleW, 3).map((x) => ({ style: x.key, share: x.share }));

  const labels: string[] = [];
  if (n >= 3) {
    labels.push(
      avgCookMin <= 25
        ? 'Quick weekday cooks'
        : avgCookMin <= 40
          ? 'Happy with some cooking'
          : 'Love a proper cook',
    );
    if (topStyles[0] && topStyles[0].share >= 0.35) labels.push(`${topStyles[0].style} fans`);
    if (healthyShare >= 0.6) labels.push('Health-focused');
    if (proteinShare >= 0.18) labels.push('Protein-forward');
  }
  if (outWeek.length >= 4) labels.push('Eat out often');
  else if (homeWeek.length >= 5 && outWeek.length <= 1) labels.push('Mostly home-cooked');

  return {
    enoughData: signalCount >= 3,
    labels,
    mealsCooked: n,
    topCuisines,
    topStyles,
    avgCookMin,
    healthyShare,
    avgKcal,
    thisWeek: {
      home: homeWeek.length,
      out: outWeek.length,
      spend: outWeek.reduce((s, o) => s + (o.cost ?? 0), 0),
      kcalPerPersonPerDay: Math.round(kcalWeek / daysWithFood),
    },
    cuisineAffinity,
    styleAffinity,
    styleMeals,
    likedIngredients,
    dislikedIngredients,
    loved,
    excluded,
    avoided,
  };
}

/** Ranking adjustment for one recipe, with a short reason when it is notable. */
export function personaAdjust(
  r: Recipe,
  s: PersonaSignals | undefined,
): { delta: number; reason?: string } {
  if (!s) return { delta: 0 };
  let delta = 0;
  let reason: string | undefined;
  const style = s.styleAffinity[r.style] ?? 0;
  const cuisine = s.cuisineAffinity[r.cuisine] ?? 0;
  delta += 0.06 * cuisine + 0.06 * style;
  if (style >= 0.6 && (s.styleMeals[r.style] ?? 0) >= 3) reason = `You often cook ${r.style}`;
  if (s.loved.includes(r.id)) {
    delta += 0.12;
    reason = 'You loved this';
  }
  const likedHits = r.ingredients.filter((i) => s.likedIngredients.includes(i.id)).length;
  delta += Math.min(0.06, likedHits * 0.02);
  if (r.ingredients.some((i) => !i.optional && s.dislikedIngredients.includes(i.id))) delta -= 0.15;
  if (s.avoided.includes(r.id)) delta -= 0.12;
  return { delta, reason };
}

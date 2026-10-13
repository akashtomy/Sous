import { ingredientById, RECIPES } from './catalog';
import { addDays, isWeekend, nextWeekdayOnOrAfter, PREP_WEEKDAY, type PrepDay } from './dates';
import { deduct, freshnessLeft, scaledNeeds, stockOf, type Need } from './inventory';
import { prepSavedMinutes } from './mealprep';
import { personaAdjust, type PersonaSignals } from './persona';
import type { Course, Cuisine, Diet, Effort, Inventory, Recipe } from './types';

export type Mood = 'any' | 'light' | 'comfort' | 'high-protein';
export type MealMode = 'healthy' | 'balanced' | 'cheat';

export interface Preferences {
  scope: 'day' | 'week';
  meals: Course[];
  people: number;
  diet: Diet;
  /** Empty means "surprise me" (any cuisine). */
  cuisines: Cuisine[];
  /** Effort allowed on weekdays (Mon–Fri). */
  maxEffort: Effort;
  /** Effort allowed on Saturday and Sunday. */
  weekendEffort: Effort;
  /** Batch-prep on the weekend; weekday dishes then count their post-prep cooking time. */
  mealPrep: boolean;
  prepDay: PrepDay;
  /** Week plans start on the prep day (so prep feeds Mon–Fri) or today. */
  weekStart: 'prep-day' | 'today';
  mood: Mood;
  mode: MealMode;
  /** Ingredient ids to exclude (allergies, dislikes). */
  avoid: string[];
  /** Optional per-person daily calorie target. */
  kcalTarget?: number;
  usePerishables: boolean;
}

export const DEFAULT_PREFS: Preferences = {
  scope: 'day',
  meals: ['breakfast', 'lunch', 'dinner'],
  people: 2,
  diet: 'veg',
  cuisines: [],
  maxEffort: 'quick',
  weekendEffort: 'elaborate',
  mealPrep: true,
  prepDay: 'sunday',
  weekStart: 'prep-day',
  mood: 'any',
  mode: 'healthy',
  avoid: [],
  usePerishables: true,
};

export interface Suggestion {
  recipe: Recipe;
  score: number;
  /** 0–1 weighted share of the recipe's ingredients already in stock. */
  coverage: number;
  /** Shortfall to buy (quantity beyond what is in stock), required items only. */
  missing: Need[];
  reasons: string[];
}

export interface PlanSlot {
  day: number;
  course: Course;
  recipeId: string;
  servings: number;
  alternates: string[];
  /** Id of the history entry created when this meal was cooked. */
  cookedEntryId?: string;
  /** Set when the household ate out instead; the slot no longer needs ingredients. */
  eatOutId?: string;
}

export interface WeekPlan {
  startDate: string;
  prefs: Preferences;
  days: PlanSlot[][];
  /** Everything the week needs beyond current stock, simulated in cooking order. */
  shortfall: Need[];
}

export interface PlanContext {
  today: string;
  /** Recently cooked recipe ids (most recent first) to avoid repeats. */
  recent?: string[];
  /** Extra recipes (e.g. saved Claude ideas) to consider alongside the built-in set. */
  extra?: Recipe[];
  /** Seed for tie-break jitter so "Shuffle" gives a different but reproducible plan. */
  seed?: number;
  /** Learned tastes; disliked dishes are never suggested. */
  persona?: PersonaSignals;
  /** Date being planned (defaults to today); decides weekday vs weekend effort. */
  date?: string;
}

const DIET_ALLOWED: Record<Diet, Diet[]> = {
  vegan: ['vegan'],
  veg: ['vegan', 'veg'],
  egg: ['vegan', 'veg', 'egg'],
  nonveg: ['vegan', 'veg', 'egg', 'nonveg'],
};
const EFFORT_RANK: Record<Effort, number> = { quick: 0, moderate: 1, elaborate: 2 };
/** Share of the daily calorie target per course. */
export const COURSE_KCAL_SHARE: Record<Course, number> = {
  breakfast: 0.25,
  lunch: 0.35,
  dinner: 0.3,
  snack: 0.1,
  dessert: 0.1,
};
const CATEGORY_WEIGHT: Record<string, number> = {
  spice: 0.25,
  herb: 0.25,
  condiment: 0.25,
  oil: 0.5,
};

const PROTEIN_GROUPS: Record<string, string> = {
  chicken: 'chicken',
  'chicken-breast': 'chicken',
  mutton: 'red-meat',
  'lamb-mince': 'red-meat',
  pork: 'pork',
  fish: 'fish',
  salmon: 'fish',
  tuna: 'fish',
  prawns: 'seafood',
  egg: 'egg',
  paneer: 'paneer',
  tofu: 'soy',
  'soya-chunks': 'soy',
  edamame: 'soy',
  chickpeas: 'chickpea',
  'kala-chana': 'chickpea',
  rajma: 'beans',
  'black-beans': 'beans',
  lobia: 'beans',
  'fava-beans': 'beans',
};

/** Main protein family of a recipe, used to rotate proteins across a plan. */
export function mainProtein(recipe: Recipe): string | undefined {
  let best: { group: string; grams: number } | undefined;
  for (const it of recipe.ingredients) {
    const ing = ingredientById(it.id);
    if (!ing) continue;
    const group = PROTEIN_GROUPS[it.id] ?? (ing.category === 'pulse' ? 'dal' : undefined);
    if (!group) continue;
    const grams = ing.unit === 'pc' ? it.qty * (ing.gramsPerPc ?? 0) : it.qty;
    if (!best || grams > best.grams) best = { group, grams };
  }
  return best?.group;
}

function effortForMinutes(min: number): Effort {
  return min <= 20 ? 'quick' : min <= 45 ? 'moderate' : 'elaborate';
}

/** Cooking time on the day: weekday dishes get weekend-prep savings when meal prep is on. */
export function effectiveMinutes(r: Recipe, prefs: Preferences, date: string): number {
  return prefs.mealPrep && !isWeekend(date) ? r.totalMin - prepSavedMinutes(r) : r.totalMin;
}

export function effortLimit(prefs: Preferences, date: string): Effort {
  return isWeekend(date) ? (prefs.weekendEffort ?? prefs.maxEffort) : prefs.maxEffort;
}

export function isEligible(
  r: Recipe,
  prefs: Preferences,
  course: Course,
  date?: string,
  excluded: string[] = [],
): boolean {
  if (!r.course.includes(course)) return false;
  if (excluded.includes(r.id)) return false;
  if (!DIET_ALLOWED[prefs.diet].includes(r.diet)) return false;
  const limit = date ? effortLimit(prefs, date) : prefs.maxEffort;
  const effort = date ? effortForMinutes(effectiveMinutes(r, prefs, date)) : r.effort;
  if (EFFORT_RANK[effort] > EFFORT_RANK[limit]) return false;
  if (prefs.mode === 'healthy' && r.healthTier === 'indulgent') return false;
  if (prefs.avoid.length && r.ingredients.some((i) => !i.optional && prefs.avoid.includes(i.id)))
    return false;
  return true;
}

/** Quantity-aware stock coverage for a recipe at a given number of servings. */
export function coverageOf(
  r: Recipe,
  servings: number,
  inv: Inventory,
): { coverage: number; missing: Need[] } {
  let wSum = 0;
  let wHave = 0;
  const missing: Need[] = [];
  for (const n of scaledNeeds(r, servings)) {
    const ing = ingredientById(n.ingredientId);
    const w = (CATEGORY_WEIGHT[ing?.category ?? ''] ?? 1) * (n.optional ? 0.3 : 1);
    const have = stockOf(inv, n.ingredientId);
    wSum += w;
    wHave += w * Math.min(1, have / n.qty);
    if (!n.optional && have < n.qty) {
      missing.push({ ingredientId: n.ingredientId, qty: Math.round((n.qty - have) * 100) / 100 });
    }
  }
  return { coverage: wSum ? wHave / wSum : 0, missing };
}

function moodScore(r: Recipe, mood: Mood): number {
  if (mood === 'any') return 0.5;
  const proteinShare = (r.nutrition.protein * 4) / Math.max(r.nutrition.kcal, 1);
  if (mood === 'high-protein')
    return r.tags.includes('high-protein') || proteinShare >= 0.2 ? 1 : 0;
  if (mood === 'light')
    return r.tags.includes('light') || r.tags.includes('soup')
      ? 1
      : r.nutrition.kcal < 350
        ? 0.6
        : 0;
  return r.tags.includes('comfort') || r.tags.includes('one-pot') ? 1 : 0;
}

function modeScore(r: Recipe, mode: MealMode): number {
  const table: Record<MealMode, Record<Recipe['healthTier'], number>> = {
    healthy: { healthy: 1, balanced: 0.5, indulgent: 0 },
    balanced: { healthy: 0.8, balanced: 1, indulgent: 0.3 },
    cheat: { healthy: 0.3, balanced: 0.7, indulgent: 1 },
  };
  return table[mode][r.healthTier];
}

function kcalFit(r: Recipe, prefs: Preferences, course: Course): number {
  if (!prefs.kcalTarget) return 0.5;
  const budget = prefs.kcalTarget * COURSE_KCAL_SHARE[course];
  return Math.max(0, 1 - Math.abs(r.nutrition.kcal - budget) / budget);
}

/** Share of soon-to-expire stock this recipe would use up. */
function perishableUse(
  r: Recipe,
  inv: Inventory,
  today: string,
): { score: number; names: string[] } {
  const names: string[] = [];
  for (const it of r.ingredients) {
    const item = inv[it.id];
    if (!item) continue;
    const left = freshnessLeft(item, today);
    if (left !== undefined && left <= 1) names.push(ingredientById(it.id)?.name ?? it.id);
  }
  return { score: Math.min(1, names.length / 2), names };
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function scoreOne(
  r: Recipe,
  prefs: Preferences,
  course: Course,
  inv: Inventory,
  ctx: PlanContext,
  jitter: number,
): Suggestion {
  const { coverage, missing } = coverageOf(r, prefs.people, inv);
  const cuisineMatch = !prefs.cuisines.length || prefs.cuisines.includes(r.cuisine) ? 1 : 0;
  const perish = prefs.usePerishables ? perishableUse(r, inv, ctx.today) : { score: 0, names: [] };
  const recentIdx = ctx.recent?.indexOf(r.id) ?? -1;
  const recentPenalty = recentIdx === -1 ? 0 : recentIdx < 3 ? 0.25 : 0.1;
  const taste = personaAdjust(r, ctx.persona);

  const score =
    0.4 * coverage +
    0.15 * cuisineMatch +
    0.1 * moodScore(r, prefs.mood) +
    0.15 * modeScore(r, prefs.mode) +
    0.1 * kcalFit(r, prefs, course) +
    0.1 * perish.score +
    taste.delta -
    recentPenalty +
    jitter;

  const reasons: string[] = [];
  const have = r.ingredients.filter((i) => !ingredientById(i.id)?.staple).length - missing.length;
  reasons.push(
    missing.length
      ? `You have ${have} of ${have + missing.length} ingredients`
      : 'Everything is in your kitchen',
  );
  if (taste.reason) reasons.push(taste.reason);
  if (perish.names.length)
    reasons.push(`Uses up ${perish.names.slice(0, 2).join(' & ')} before it spoils`);
  const date = ctx.date ?? ctx.today;
  const onDay = effectiveMinutes(r, prefs, date);
  if (onDay < r.totalMin) reasons.push(`~${onDay} min with weekend prep`);
  else if (r.effort === 'quick') reasons.push(`Quick: ${r.totalMin} min`);
  if (r.healthTier === 'healthy') reasons.push('Healthy pick');
  return { recipe: r, score, coverage, missing, reasons };
}

/** Ranked options for one meal, filtered by preferences and only from the chosen cuisines when set. */
export function suggest(
  prefs: Preferences,
  course: Course,
  inv: Inventory,
  ctx: PlanContext,
  limit = 6,
  exclude: string[] = [],
): Suggestion[] {
  const rand = mulberry32(ctx.seed ?? 1);
  const date = ctx.date ?? ctx.today;
  const pool = [...RECIPES, ...(ctx.extra ?? [])].filter(
    (r) =>
      !exclude.includes(r.id) &&
      isEligible(r, prefs, course, date, ctx.persona?.excluded) &&
      (!prefs.cuisines.length || prefs.cuisines.includes(r.cuisine)),
  );
  return pool
    .map((r) => scoreOne(r, prefs, course, inv, ctx, rand() * 0.04))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function addNeed(acc: Map<string, number>, n: Need) {
  acc.set(n.ingredientId, Math.round(((acc.get(n.ingredientId) ?? 0) + n.qty) * 100) / 100);
}

/** Where a new week plan starts: today, or the next prep day so weekend prep feeds Mon–Fri. */
export function weekStartDate(prefs: Preferences, today: string): string {
  if (!prefs.mealPrep || prefs.weekStart === 'today') return today;
  return nextWeekdayOnOrAfter(today, PREP_WEEKDAY[prefs.prepDay]);
}

/**
 * Builds a 7-day plan greedily in cooking order. Each pick deducts from a simulated inventory
 * so later days see depleted stock, and anything short is collected into `shortfall`.
 */
export function planWeek(
  prefs: Preferences,
  inv: Inventory,
  ctx: PlanContext,
  days = 7,
  startDate = ctx.today,
): WeekPlan {
  const rand = mulberry32((ctx.seed ?? 1) * 7919);
  let sim: Inventory = { ...inv };
  const used = new Set<string>();
  const shortfall = new Map<string, number>();
  const plan: PlanSlot[][] = [];
  let prevDayProteins = new Map<Course, string | undefined>();

  for (let d = 0; d < days; d++) {
    const daySlots: PlanSlot[] = [];
    const dayProteins = new Map<Course, string | undefined>();
    let prevCuisine: Cuisine | undefined;
    const date = addDays(startDate, d);
    const dayCtx = { ...ctx, date };
    for (const course of prefs.meals) {
      const pool = [...RECIPES, ...(ctx.extra ?? [])].filter(
        (r) =>
          !used.has(r.id) &&
          isEligible(r, prefs, course, date, ctx.persona?.excluded) &&
          (!prefs.cuisines.length || prefs.cuisines.includes(r.cuisine)),
      );
      const ranked = pool
        .map((r) => {
          const s = scoreOne(r, prefs, course, sim, dayCtx, rand() * 0.04);
          const protein = mainProtein(r);
          let penalty = 0;
          if (prevCuisine && r.cuisine === prevCuisine && prefs.cuisines.length !== 1)
            penalty += 0.08;
          if (protein && [...dayProteins.values()].includes(protein)) penalty += 0.06;
          if (protein && prevDayProteins.get(course) === protein) penalty += 0.08;
          return { ...s, score: s.score - penalty };
        })
        .sort((a, b) => b.score - a.score);
      const pick = ranked[0];
      if (!pick) continue;
      used.add(pick.recipe.id);
      prevCuisine = pick.recipe.cuisine;
      dayProteins.set(course, mainProtein(pick.recipe));

      const needs = scaledNeeds(pick.recipe, prefs.people);
      for (const n of needs) {
        if (n.optional) continue;
        const have = sim[n.ingredientId]?.qty ?? 0;
        if (have < n.qty) addNeed(shortfall, { ingredientId: n.ingredientId, qty: n.qty - have });
      }
      sim = deduct(sim, needs).inventory;

      daySlots.push({
        day: d,
        course,
        recipeId: pick.recipe.id,
        servings: prefs.people,
        alternates: ranked.slice(1, 6).map((x) => x.recipe.id),
      });
    }
    prevDayProteins = dayProteins;
    plan.push(daySlots);
  }

  return {
    startDate,
    prefs,
    days: plan,
    shortfall: [...shortfall.entries()].map(([ingredientId, qty]) => ({ ingredientId, qty })),
  };
}

/** Recomputes the plan's shortfall against current stock for meals not yet cooked. */
export function remainingShortfall(plan: WeekPlan, inv: Inventory, extra: Recipe[] = []): Need[] {
  let sim: Inventory = { ...inv };
  const acc = new Map<string, number>();
  for (const day of plan.days) {
    for (const slot of day) {
      if (slot.cookedEntryId || slot.eatOutId) continue;
      const r = [...RECIPES, ...extra].find((x) => x.id === slot.recipeId);
      if (!r) continue;
      const needs = scaledNeeds(r, slot.servings);
      for (const n of needs) {
        if (n.optional) continue;
        const have = sim[n.ingredientId]?.qty ?? 0;
        if (have < n.qty) addNeed(acc, { ingredientId: n.ingredientId, qty: n.qty - have });
      }
      sim = deduct(sim, needs).inventory;
    }
  }
  return [...acc.entries()].map(([ingredientId, qty]) => ({ ingredientId, qty }));
}

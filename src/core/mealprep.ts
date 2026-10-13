// Weekend meal prep: turns the weekday meals of a plan into batch tasks done on the prep day
// (cook dals, soak & cook beans, grind batter, masala base, chop vegetables, marinate…).
// Rules are derived from each recipe's ingredients and steps, so they work for any recipe.

import { ingredientById, recipeById } from './catalog';
import { addDays, isWeekend, PREP_WEEKDAY, weekdayOf, type PrepDay } from './dates';
import type { Course, Recipe } from './types';

export type PrepKind =
  | 'batter'
  | 'beans'
  | 'pulses'
  | 'sprouts'
  | 'grains'
  | 'masala'
  | 'gg-paste'
  | 'potatoes'
  | 'marinate'
  | 'chutney'
  | 'dough'
  | 'chop'
  | 'greens';

interface Rule {
  kind: PrepKind;
  /** Minutes this saves on the day the dish is cooked. */
  savedMin: number;
  /** Hands-on minutes on the prep day for one batch. */
  activeMin: number;
  /** Days it keeps in the fridge after prep. */
  keepsDays: number;
  /** Can portions for later days be frozen? */
  freezable: boolean;
  /** Ingredients (per serving) this task covers for the recipe, or [] if it doesn't apply. */
  match: (r: Recipe) => { id: string; qty: number }[];
}

const SPLIT_DALS = ['toor-dal', 'moong-dal', 'chana-dal', 'masoor-dal', 'brown-lentils'];
const BEANS = [
  'chickpeas',
  'rajma',
  'kala-chana',
  'lobia',
  'black-beans',
  'fava-beans',
  'whole-urad',
];
const WHOLE_GRAINS = ['brown-rice', 'quinoa', 'bulgur'];
const HARD_VEG = [
  'carrot',
  'green-beans',
  'cabbage',
  'cauliflower',
  'capsicum',
  'red-pepper',
  'pumpkin',
  'bottle-gourd',
  'beetroot',
  'broccoli',
  'raw-banana',
  'drumstick',
];
const GREENS = ['coriander-leaves', 'mint', 'curry-leaves', 'spinach', 'methi', 'parsley'];
const MARINATED = ['chicken', 'chicken-breast', 'fish', 'salmon', 'prawns', 'mutton'];

const isBatterRecipe = (r: Recipe) =>
  r.tags.includes('fermented') || /batter/i.test(r.advancePrep ?? '');
const pick = (r: Recipe, ids: string[], min = 0) =>
  r.ingredients
    .filter((i) => ids.includes(i.id) && i.qty >= min)
    .map((i) => ({ id: i.id, qty: i.qty }));
const qtyOf = (r: Recipe, id: string) => r.ingredients.find((i) => i.id === id)?.qty ?? 0;

const RULES: Rule[] = [
  {
    kind: 'batter',
    savedMin: 15,
    activeMin: 25,
    keepsDays: 5,
    freezable: false,
    match: (r) =>
      isBatterRecipe(r)
        ? pick(r, ['idli-rice', 'urad-dal', 'rice', 'fenugreek-seeds', 'yeast'])
        : [],
  },
  {
    kind: 'beans',
    savedMin: 25,
    activeMin: 10,
    keepsDays: 4,
    freezable: true,
    // Falafel needs soaked raw chickpeas, so it isn't pre-cooked.
    match: (r) => (/do not cook/i.test(r.advancePrep ?? '') ? [] : pick(r, BEANS, 20)),
  },
  {
    kind: 'pulses',
    savedMin: 15,
    activeMin: 10,
    keepsDays: 3,
    freezable: true,
    match: (r) => (isBatterRecipe(r) ? [] : pick(r, SPLIT_DALS, 15)),
  },
  {
    // Whole moong is used soaked or sprouted raw (pesarattu, sprouts chaat, misal), not cooked.
    kind: 'sprouts',
    savedMin: 5,
    activeMin: 5,
    keepsDays: 4,
    freezable: false,
    match: (r) => pick(r, ['whole-moong'], 20),
  },
  {
    kind: 'grains',
    savedMin: 15,
    activeMin: 5,
    keepsDays: 3,
    freezable: true,
    match: (r) => pick(r, WHOLE_GRAINS, 35),
  },
  {
    kind: 'masala',
    savedMin: 10,
    activeMin: 20,
    keepsDays: 5,
    freezable: true,
    match: (r) =>
      r.cuisine === 'indian' && qtyOf(r, 'onion') >= 30 && qtyOf(r, 'tomato') >= 30
        ? pick(r, ['onion', 'tomato'])
        : [],
  },
  {
    kind: 'gg-paste',
    savedMin: 3,
    activeMin: 5,
    keepsDays: 10,
    freezable: true,
    match: (r) => (qtyOf(r, 'ginger') && qtyOf(r, 'garlic') ? pick(r, ['ginger', 'garlic']) : []),
  },
  {
    kind: 'potatoes',
    savedMin: 15,
    activeMin: 5,
    keepsDays: 3,
    freezable: false,
    match: (r) =>
      qtyOf(r, 'potato') >= 40 && r.steps.some((s) => /boil|boiled/i.test(s) && /potato/i.test(s))
        ? pick(r, ['potato'])
        : [],
  },
  {
    kind: 'marinate',
    savedMin: 10,
    activeMin: 10,
    keepsDays: 2,
    freezable: true,
    match: (r) => pick(r, MARINATED, 60),
  },
  {
    kind: 'chutney',
    savedMin: 7,
    activeMin: 10,
    keepsDays: 3,
    freezable: false,
    match: (r) =>
      r.course.includes('breakfast') && qtyOf(r, 'coconut') >= 10 && qtyOf(r, 'green-chilli')
        ? pick(r, ['coconut'])
        : qtyOf(r, 'mint') >= 3 && qtyOf(r, 'coriander-leaves') >= 3
          ? pick(r, ['mint', 'coriander-leaves'])
          : [],
  },
  {
    kind: 'dough',
    savedMin: 8,
    activeMin: 10,
    keepsDays: 2,
    freezable: false,
    match: (r) =>
      qtyOf(r, 'atta') >= 30 && !r.tags.includes('baked') && !r.tags.includes('fried')
        ? pick(r, ['atta'])
        : [],
  },
  {
    kind: 'chop',
    savedMin: 5,
    activeMin: 15,
    keepsDays: 3,
    freezable: false,
    match: (r) => pick(r, HARD_VEG, 20),
  },
  {
    kind: 'greens',
    savedMin: 3,
    activeMin: 10,
    keepsDays: 4,
    freezable: false,
    match: (r) => pick(r, GREENS),
  },
];

const TITLES: Record<PrepKind, string> = {
  batter: 'Soak, grind and ferment the batter',
  beans: 'Soak overnight, then pressure-cook beans',
  pulses: 'Pressure-cook dals',
  sprouts: 'Soak and sprout whole moong',
  grains: 'Cook whole grains',
  masala: 'Cook an onion-tomato masala base',
  'gg-paste': 'Blend ginger-garlic paste',
  potatoes: 'Boil and peel potatoes',
  marinate: 'Portion and marinate meat or fish',
  chutney: 'Make chutneys',
  dough: 'Knead roti dough',
  chop: 'Wash and chop vegetables',
  greens: 'Clean and dry herbs and greens',
};

const HOW: Record<PrepKind, string> = {
  batter:
    'Soak Saturday morning, grind in the evening and leave to ferment overnight. Refrigerate once risen.',
  beans:
    'Soak Saturday night. Cook Sunday with salt until just tender, cool, and box with some cooking liquid.',
  pulses:
    'Cook each dal plain with turmeric and salt. Cool fast and box per meal; temper fresh on the day.',
  sprouts:
    'Soak Saturday night, drain and keep in a covered box or cloth. Sprouts by Monday; refrigerate once they show tails.',
  grains: 'Cook, spread to cool, then box per meal. Reheat with a splash of water.',
  masala:
    'Slowly cook onion until golden, add ginger-garlic, then tomato and salt until jammy. Spoon in per meal and add the dish’s spices on the day.',
  'gg-paste': 'Blend with a little oil and salt; keep in a clean jar.',
  potatoes: 'Boil, peel and refrigerate whole.',
  marinate: 'Cut into portions, marinate in curd/lemon and spices, and bag per meal.',
  chutney: 'Grind and keep in a jar; temper on the day you eat it.',
  dough: 'Knead soft, rub with a little oil and keep in an airtight box.',
  chop: 'Wash, dry well and chop. Store in boxes lined with kitchen paper.',
  greens: 'Pick, wash, dry completely and wrap in kitchen paper.',
};

export interface PrepMeal {
  date: string;
  day: number;
  course: Course;
  recipeId: string;
  recipeName: string;
  /** Too far from prep day to keep in the fridge: freeze this portion. */
  freeze: boolean;
}

export interface PrepTask {
  id: string;
  kind: PrepKind;
  title: string;
  how: string;
  items: { ingredientId: string; qty: number }[];
  meals: PrepMeal[];
  activeMin: number;
  savedMin: number;
  storage: string;
}

export interface PrepPlan {
  prepDate: string;
  tasks: PrepTask[];
  totalActiveMin: number;
  totalSavedMin: number;
  /** Weekday meals the prep covers. */
  mealsCovered: number;
}

/** Minutes a recipe saves when its weekend-prep components are ready (capped at half its time). */
export function prepSavedMinutes(r: Recipe): number {
  const saved = RULES.reduce((sum, rule) => sum + (rule.match(r).length ? rule.savedMin : 0), 0);
  return Math.min(saved, Math.floor(r.totalMin / 2));
}

/** Prep kinds that apply to a recipe (for badges on recipe pages). */
export function prepKindsFor(r: Recipe): PrepKind[] {
  return RULES.filter((rule) => rule.match(r).length).map((rule) => rule.kind);
}

export function prepTitle(kind: PrepKind): string {
  return TITLES[kind];
}

/** The prep date for a plan: the first chosen prep weekday on or after the plan start. */
export function prepDateFor(startDate: string, prepDay: PrepDay): string {
  const target = PREP_WEEKDAY[prepDay];
  return addDays(startDate, (target - weekdayOf(startDate) + 7) % 7);
}

/**
 * Builds the prep list for the weekday meals that come after the prep day in the plan.
 * Fridge-only tasks skip meals beyond their keeping time; freezable tasks mark those
 * portions "freeze".
 */
export function buildPrepPlan(
  plan: {
    startDate: string;
    days: {
      course: Course;
      recipeId: string;
      servings: number;
      cookedEntryId?: string;
      eatOutId?: string;
    }[][];
  },
  prepDay: PrepDay,
  extra: Recipe[] = [],
): PrepPlan {
  const prepDate = prepDateFor(plan.startDate, prepDay);
  const tasks = new Map<string, PrepTask>();
  // Per meal: minutes saved by its prepped components, capped like prepSavedMinutes().
  const mealSaved = new Map<string, { sum: number; cap: number }>();

  plan.days.forEach((slots, day) => {
    const date = addDays(plan.startDate, day);
    const offset = Math.round((Date.parse(date) - Date.parse(prepDate)) / 86_400_000);
    if (offset <= 0 || offset > 6 || isWeekend(date)) return;
    for (const slot of slots) {
      if (slot.cookedEntryId || slot.eatOutId) continue;
      const r = recipeById(slot.recipeId, extra);
      if (!r) continue;
      for (const rule of RULES) {
        const items = rule.match(r);
        if (!items.length) continue;
        const tooFar = offset > rule.keepsDays;
        if (tooFar && !rule.freezable) continue;
        // Pulses and beans are one task per ingredient so quantities stay readable.
        const perIngredient = rule.kind === 'pulses' || rule.kind === 'beans';
        const groups = perIngredient ? items.map((i) => [i]) : [items];
        for (const group of groups) {
          const id = perIngredient ? `${rule.kind}:${group[0].id}` : rule.kind;
          const task =
            tasks.get(id) ??
            ({
              id,
              kind: rule.kind,
              title: perIngredient
                ? `${rule.kind === 'beans' ? 'Soak & cook' : 'Cook'} ${ingredientById(group[0].id)?.name ?? group[0].id}`
                : TITLES[rule.kind],
              how: HOW[rule.kind],
              items: [],
              meals: [],
              activeMin: rule.activeMin,
              savedMin: 0,
              storage: rule.freezable
                ? `Fridge up to ${rule.keepsDays} days; freeze later portions`
                : `Fridge up to ${rule.keepsDays} days`,
            } satisfies PrepTask);
          for (const it of group) {
            const prev = task.items.find((x) => x.ingredientId === it.id);
            const add = Math.round(it.qty * slot.servings * 100) / 100;
            if (prev) prev.qty = Math.round((prev.qty + add) * 100) / 100;
            else task.items.push({ ingredientId: it.id, qty: add });
          }
          if (!task.meals.some((m) => m.day === day && m.course === slot.course)) {
            task.meals.push({
              date,
              day,
              course: slot.course,
              recipeId: r.id,
              recipeName: r.name,
              freeze: tooFar,
            });
            task.savedMin += rule.savedMin;
            const key = `${day}-${slot.course}`;
            const m = mealSaved.get(key) ?? { sum: 0, cap: Math.floor(r.totalMin / 2) };
            m.sum += rule.savedMin;
            mealSaved.set(key, m);
          }
          tasks.set(id, task);
        }
      }
    }
  });

  const order: PrepKind[] = [
    'batter',
    'beans',
    'pulses',
    'sprouts',
    'grains',
    'masala',
    'gg-paste',
    'potatoes',
    'marinate',
    'chutney',
    'dough',
    'chop',
    'greens',
  ];
  const list = [...tasks.values()].sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));
  const covered = new Set(list.flatMap((t) => t.meals.map((m) => `${m.day}-${m.course}`)));
  return {
    prepDate,
    tasks: list,
    totalActiveMin: list.reduce((s, t) => s + t.activeMin, 0),
    totalSavedMin: [...mealSaved.values()].reduce((s, m) => s + Math.min(m.sum, m.cap), 0),
    mealsCovered: covered.size,
  };
}

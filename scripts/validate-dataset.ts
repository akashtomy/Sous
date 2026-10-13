// Validates the built dataset and prints coverage. Exit code 1 on any error.
//   npm run validate-data

import ingredients from '../src/core/data/ingredients.json';
import recipesJson from '../src/core/data/recipes.json';
import type { Course, Cuisine, HealthTier, Ingredient, Recipe } from '../src/core/types';

const recipes = recipesJson as Recipe[];
const ings = ingredients as Ingredient[];
const ingIds = new Set(ings.map((i) => i.id));

const COURSES: Course[] = ['breakfast', 'lunch', 'dinner', 'dessert', 'snack'];
const REQUIRED: Course[] = ['breakfast', 'lunch', 'dinner', 'dessert'];
const CUISINES: Cuisine[] = ['indian', 'lebanese', 'chinese', 'continental', 'international'];
const KCAL_RANGE: Record<Course, [number, number]> = {
  breakfast: [100, 800],
  lunch: [200, 900],
  dinner: [200, 900],
  snack: [60, 450],
  dessert: [60, 450],
};
const MIN_PER_CELL = 3;

const errors: string[] = [];
const warn: string[] = [];

const seenIngIds = new Set<string>();
for (const i of ings) {
  if (seenIngIds.has(i.id)) errors.push(`duplicate ingredient id ${i.id}`);
  seenIngIds.add(i.id);
  if (i.unit === 'pc' && !i.gramsPerPc) errors.push(`${i.id}: unit pc needs gramsPerPc`);
  if (!i.packSizes.length) errors.push(`${i.id}: no pack sizes`);
}

for (const r of recipes) {
  const where = `${r.id}`;
  if (!r.steps.length) errors.push(`${where}: no steps`);
  if (!(r.prepMin >= 0 && r.cookMin >= 0 && r.totalMin > 0)) errors.push(`${where}: bad times`);
  if (!r.portion) errors.push(`${where}: no portion`);
  if (!r.course.length) errors.push(`${where}: no course`);
  const seen = new Set<string>();
  for (const it of r.ingredients) {
    if (!ingIds.has(it.id)) errors.push(`${where}: unknown ingredient ${it.id}`);
    if (seen.has(it.id)) errors.push(`${where}: ingredient listed twice: ${it.id}`);
    seen.add(it.id);
  }
  const [lo, hi] = KCAL_RANGE[r.course[0]];
  if (r.nutrition.kcal < lo || r.nutrition.kcal > hi) {
    errors.push(`${where}: ${r.nutrition.kcal} kcal outside ${lo}–${hi} for ${r.course[0]}`);
  }
  if (
    (r.diet === 'vegan' || r.diet === 'veg') &&
    r.ingredients.some(
      (i) =>
        [
          'egg',
          'chicken',
          'chicken-breast',
          'mutton',
          'lamb-mince',
          'fish',
          'salmon',
          'prawns',
          'pork',
          'tuna',
          'fish-sauce',
        ].includes(i.id) && !i.optional,
    )
  ) {
    errors.push(`${where}: diet ${r.diet} but contains egg/meat/fish`);
  }
  if (
    r.diet === 'egg' &&
    r.ingredients.some((i) =>
      [
        'chicken',
        'chicken-breast',
        'mutton',
        'lamb-mince',
        'fish',
        'salmon',
        'prawns',
        'pork',
        'tuna',
      ].includes(i.id),
    )
  ) {
    errors.push(`${where}: diet egg but contains meat/fish`);
  }
  if (
    r.diet === 'vegan' &&
    r.ingredients.some(
      (i) =>
        [
          'milk',
          'curd',
          'greek-yogurt',
          'labneh',
          'paneer',
          'butter',
          'ghee',
          'cheese',
          'mozzarella',
          'feta',
          'parmesan',
          'fresh-cream',
          'honey',
        ].includes(i.id) && !i.optional,
    )
  ) {
    errors.push(`${where}: vegan but contains dairy/honey`);
  }
}

// Coverage table (a recipe counts in every course it lists).
const cell = (c: Cuisine, k: Course) =>
  recipes.filter((r) => r.cuisine === c && r.course.includes(k)).length;
const pad = (s: string | number, n: number) => String(s).padStart(n);
console.log(
  `\n${'cuisine'.padEnd(14)}${COURSES.map((k) => pad(k, 11)).join('')}${pad('total', 8)}`,
);
for (const c of CUISINES) {
  const row = COURSES.map((k) => cell(c, k));
  console.log(
    `${c.padEnd(14)}${row.map((n) => pad(n, 11)).join('')}${pad(recipes.filter((r) => r.cuisine === c).length, 8)}`,
  );
  for (const k of REQUIRED) {
    if (cell(c, k) < MIN_PER_CELL)
      errors.push(`${c} × ${k}: only ${cell(c, k)} recipes (need ${MIN_PER_CELL})`);
  }
}

const tiers: Record<HealthTier, number> = { healthy: 0, balanced: 0, indulgent: 0 };
for (const r of recipes) tiers[r.healthTier]++;
console.log(
  `\nhealth tiers: ${Object.entries(tiers)
    .map(([k, v]) => `${k} ${v} (${Math.round((v / recipes.length) * 100)}%)`)
    .join(', ')}`,
);
const efforts: Record<string, number> = {};
for (const r of recipes) efforts[r.effort] = (efforts[r.effort] ?? 0) + 1;
console.log(
  `effort: ${Object.entries(efforts)
    .map(([k, v]) => `${k} ${v}`)
    .join(', ')}`,
);
const diets: Record<string, number> = {};
for (const r of recipes) diets[r.diet] = (diets[r.diet] ?? 0) + 1;
console.log(
  `diet: ${Object.entries(diets)
    .map(([k, v]) => `${k} ${v}`)
    .join(', ')}`,
);
const regions = [...new Set(recipes.filter((r) => r.cuisine === 'indian').map((r) => r.region))];
console.log(
  `indian regions: ${regions.map((g) => `${g} ${recipes.filter((r) => r.cuisine === 'indian' && r.region === g).length}`).join(', ')}`,
);
console.log(`total: ${recipes.length} recipes, ${ings.length} ingredients`);

for (const w of warn) console.warn(`warn: ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`error: ${e}`);
  console.error(`\n${errors.length} error(s)`);
  process.exit(1);
}
console.log('\nDataset OK');

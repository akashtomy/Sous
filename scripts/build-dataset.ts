// Expands the authored recipe drafts into the app dataset.
//   npm run build-data     -> writes src/core/data/{ingredients,recipes}.json and data/*.json
// Throws on any authoring error (unknown ingredient, bad quantity, duplicate id).

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { ingredients } from '../data/source/ingredients';
import { parseCourses, type CuisineDrafts, type RecipeDraft } from '../data/source/dsl';
import { indian } from '../data/source/recipes/indian';
import { lebanese } from '../data/source/recipes/lebanese';
import { chinese } from '../data/source/recipes/chinese';
import { continental } from '../data/source/recipes/continental';
import { international } from '../data/source/recipes/international';
import { classifyHealth, computeNutrition } from '../src/core/nutrition';
import type { Effort, Ingredient, Recipe, RecipeIngredient } from '../src/core/types';

const ALL: CuisineDrafts[] = [indian, lebanese, chinese, continental, international];

const byId = new Map<string, Ingredient>(ingredients.map((i) => [i.id, i]));

/** Parses "id qty, id qty?" and sums repeats (shared tempering blocks can overlap a recipe's own items). */
function parseIngredients(r: RecipeDraft): RecipeIngredient[] {
  const merged = new Map<string, RecipeIngredient>();
  for (const tok of r.i
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)) {
    const m = /^([a-z0-9-]+)\s+([0-9.]+)(\?)?$/.exec(tok);
    if (!m) throw new Error(`${r.id}: cannot parse ingredient "${tok}"`);
    const [, id, qty, opt] = m;
    if (!byId.has(id)) throw new Error(`${r.id}: unknown ingredient "${id}"`);
    const n = Number(qty);
    if (!(n > 0)) throw new Error(`${r.id}: bad quantity in "${tok}"`);
    const prev = merged.get(id);
    if (prev) {
      prev.qty = Math.round((prev.qty + n) * 100) / 100;
      if (!opt) delete prev.optional;
    } else {
      merged.set(id, opt ? { id, qty: n, optional: true } : { id, qty: n });
    }
  }
  return [...merged.values()];
}

function effortFor(total: number): Effort {
  if (total <= 20) return 'quick';
  if (total <= 45) return 'moderate';
  return 'elaborate';
}

export function buildRecipes(): Recipe[] {
  const seen = new Set<string>();
  const out: Recipe[] = [];
  for (const group of ALL) {
    for (const d of group.recipes) {
      if (seen.has(d.id)) throw new Error(`duplicate recipe id ${d.id}`);
      seen.add(d.id);
      const items = parseIngredients(d);
      const course = parseCourses(d.c);
      const tags = (d.tg ?? '').split(/\s+/).filter(Boolean);
      const nutrition = computeNutrition(items, (id) => byId.get(id));
      const [prepMin, cookMin] = d.t;
      out.push({
        id: d.id,
        name: d.n,
        cuisine: group.cuisine,
        style: d.st,
        region: d.rg,
        origin: d.o,
        course,
        diet: d.d,
        effort: d.e ?? effortFor(prepMin + cookMin),
        prepMin,
        cookMin,
        totalMin: prepMin + cookMin,
        ...(d.adv ? { advancePrep: d.adv } : {}),
        tags,
        ingredients: items,
        steps: d.s,
        portion: d.p,
        nutrition,
        healthTier: classifyHealth(nutrition, course[0], tags),
        source: 'builtin',
      });
    }
  }
  return out;
}

if (require.main === module) {
  const recipes = buildRecipes();
  const root = join(__dirname, '..');
  const appData = join(root, 'src/core/data');
  mkdirSync(appData, { recursive: true });
  const write = (p: string, v: unknown) => writeFileSync(p, JSON.stringify(v, null, 1) + '\n');
  write(join(appData, 'ingredients.json'), ingredients);
  write(join(appData, 'recipes.json'), recipes);
  write(join(root, 'data/ingredients.json'), ingredients);
  write(join(root, 'data/recipes.json'), recipes);
  console.log(`Built ${recipes.length} recipes, ${ingredients.length} ingredients.`);
}

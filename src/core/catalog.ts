import ingredientsJson from './data/ingredients.json';
import recipesJson from './data/recipes.json';
import type { Ingredient, Recipe } from './types';

export const INGREDIENTS = ingredientsJson as Ingredient[];
export const RECIPES = recipesJson as Recipe[];

const ingredientMap = new Map(INGREDIENTS.map((i) => [i.id, i]));
const recipeMap = new Map(RECIPES.map((r) => [r.id, r]));

export function ingredientById(id: string): Ingredient | undefined {
  return ingredientMap.get(id);
}

export function recipeById(id: string, extra: Recipe[] = []): Recipe | undefined {
  return recipeMap.get(id) ?? extra.find((r) => r.id === id);
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/**
 * Maps free text ("Jeera", "red onions", "sarson") to an ingredient: exact name/alias first,
 * then singular/plural tolerant match, then substring match on name or alias.
 */
export function findIngredient(text: string): Ingredient | undefined {
  const q = norm(text);
  if (!q) return undefined;
  const keys = (i: Ingredient) => [
    norm(i.name),
    norm(i.id.replace(/-/g, ' ')),
    ...i.aliases.map(norm),
  ];
  const singular = q.replace(/(es|s)$/, '');
  return (
    INGREDIENTS.find((i) => keys(i).includes(q)) ??
    INGREDIENTS.find((i) =>
      keys(i).some((k) => k === singular || k.replace(/(es|s)$/, '') === singular),
    ) ??
    INGREDIENTS.find((i) =>
      keys(i).some((k) => k.startsWith(q) || (q.length >= 4 && k.includes(q))),
    )
  );
}

/** Ingredient search for pickers, best matches first. */
export function searchIngredients(text: string, limit = 12): Ingredient[] {
  const q = norm(text);
  if (!q) return [];
  const scored: { ing: Ingredient; s: number }[] = [];
  for (const ing of INGREDIENTS) {
    if (ing.staple) continue;
    const names = [norm(ing.name), ...ing.aliases.map(norm)];
    let s = 0;
    for (const n of names) {
      if (n === q) s = Math.max(s, 3);
      else if (n.startsWith(q)) s = Math.max(s, 2);
      else if (n.includes(q)) s = Math.max(s, 1);
    }
    if (s) scored.push({ ing, s });
  }
  return scored
    .sort((a, b) => b.s - a.s || a.ing.name.localeCompare(b.ing.name))
    .slice(0, limit)
    .map((x) => x.ing);
}

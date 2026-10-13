// Optional "More ideas with Claude". Uses the person's own API key from Settings; never required.
// Type-only at the top: the SDK itself is loaded on first use so it never runs at app startup.
import type Anthropic from '@anthropic-ai/sdk';

import { findIngredient, ingredientById } from './catalog';
import { classifyHealth } from './nutrition';
import type { Preferences } from './planner';
import type { Course, Cuisine, Diet, Effort, Inventory, Recipe, RecipeIngredient } from './types';
import { formatQty } from './units';

export const DEFAULT_CLAUDE_MODEL = 'claude-opus-5-5';

const COURSES: Course[] = ['breakfast', 'lunch', 'dinner', 'dessert', 'snack'];
const CUISINES: Cuisine[] = ['indian', 'lebanese', 'chinese', 'continental', 'international'];
const DIETS: Diet[] = ['vegan', 'veg', 'egg', 'nonveg'];

const RECIPE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['recipes'],
  properties: {
    recipes: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'name',
          'cuisine',
          'style',
          'origin',
          'course',
          'diet',
          'prepMin',
          'cookMin',
          'portion',
          'kcalPerServing',
          'proteinG',
          'carbsG',
          'fatG',
          'fiberG',
          'ingredients',
          'steps',
          'tags',
        ],
        properties: {
          name: { type: 'string' },
          cuisine: { type: 'string', enum: CUISINES },
          style: { type: 'string', description: "Regional style, e.g. 'South Indian', 'Sichuan'" },
          origin: { type: 'string', description: 'State or country of origin' },
          course: { type: 'string', enum: COURSES },
          diet: { type: 'string', enum: DIETS },
          prepMin: { type: 'integer' },
          cookMin: { type: 'integer' },
          portion: { type: 'string', description: 'What one serving looks like' },
          kcalPerServing: { type: 'integer' },
          proteinG: { type: 'number' },
          carbsG: { type: 'number' },
          fatG: { type: 'number' },
          fiberG: { type: 'number' },
          tags: { type: 'array', items: { type: 'string' } },
          ingredients: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['name', 'qtyPerServing', 'unit'],
              properties: {
                name: { type: 'string' },
                qtyPerServing: { type: 'number' },
                unit: { type: 'string', enum: ['g', 'ml', 'pc'] },
              },
            },
          },
          steps: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
} as const;

interface RawIngredient {
  name: string;
  qtyPerServing: number;
  unit: 'g' | 'ml' | 'pc';
}
interface RawRecipe {
  name: string;
  cuisine: Cuisine;
  style: string;
  origin: string;
  course: Course;
  diet: Diet;
  prepMin: number;
  cookMin: number;
  portion: string;
  kcalPerServing: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  tags: string[];
  ingredients: RawIngredient[];
  steps: string[];
}

export class ClaudeIdeasError extends Error {}

/** Builds the prompt from what's in stock and the answers to the planning questions. */
export function buildPrompt(prefs: Preferences, course: Course, inv: Inventory): string {
  const stock = Object.values(inv)
    .filter((i) => i.qty > 0)
    .map((i) => {
      const ing = ingredientById(i.ingredientId);
      return ing ? `${ing.name}: ${formatQty(ing, i.qty)}` : undefined;
    })
    .filter(Boolean)
    .join('\n');
  const cuisines = prefs.cuisines.length
    ? prefs.cuisines.join(', ')
    : 'any of indian, lebanese, chinese, continental, international';
  const avoid = prefs.avoid.map((id) => ingredientById(id)?.name ?? id).join(', ') || 'none';
  return [
    `Suggest 4 home-cookable ${course} recipes for ${prefs.people} people.`,
    `Cuisine: ${cuisines}. Diet: ${prefs.diet} (vegan < veg < egg < nonveg; stay within it).`,
    `Effort: at most ${prefs.maxEffort} (quick ≤ 20 min, moderate ≤ 45 min active). Mood: ${prefs.mood}. Meal mode: ${prefs.mode} (healthy means balanced, lower oil and sugar; cheat means indulgent is fine).`,
    `Avoid: ${avoid}.`,
    prefs.kcalTarget ? `Daily calorie target per person: ${prefs.kcalTarget} kcal.` : '',
    'Prefer recipes that mainly use the stock below so little shopping is needed. Give realistic per-serving quantities in g, ml or pc, realistic per-serving calories and macros, and concise original steps.',
    'Use plain ingredient names (e.g. "onion", "toor dal", "mustard seeds") so they can be matched to the pantry.',
    '',
    'Kitchen stock:',
    stock || '(empty)',
  ]
    .filter((l) => l !== '')
    .join('\n');
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** Maps one Claude recipe onto the app's Recipe type; ingredients it can't match stay "untracked". */
export function toRecipe(raw: RawRecipe, now = Date.now()): Recipe | undefined {
  if (!raw.name || !raw.steps?.length || !raw.ingredients?.length) return undefined;
  if (!(raw.kcalPerServing > 0) || raw.prepMin < 0 || raw.cookMin < 0) return undefined;
  if (!COURSES.includes(raw.course) || !CUISINES.includes(raw.cuisine) || !DIETS.includes(raw.diet))
    return undefined;

  const ingredients: RecipeIngredient[] = [];
  const untracked: string[] = [];
  let addedSugar = 0;
  for (const ri of raw.ingredients) {
    const ing = findIngredient(ri.name);
    if (!ing || !(ri.qtyPerServing > 0)) {
      untracked.push(`${ri.name} (${ri.qtyPerServing} ${ri.unit})`);
      continue;
    }
    let qty = ri.qtyPerServing;
    if (ing.unit === 'pc' && ri.unit !== 'pc') qty = ing.gramsPerPc ? qty / ing.gramsPerPc : NaN;
    else if (ing.unit !== 'pc' && ri.unit === 'pc')
      qty = ing.gramsPerPc ? qty * ing.gramsPerPc : NaN;
    if (!Number.isFinite(qty) || qty <= 0) {
      untracked.push(`${ri.name} (${ri.qtyPerServing} ${ri.unit})`);
      continue;
    }
    if (ing.sweetener) addedSugar += (ing.per100.sugar * qty) / 100;
    const prev = ingredients.find((x) => x.id === ing.id);
    if (prev) prev.qty += qty;
    else ingredients.push({ id: ing.id, qty: Math.round(qty * 100) / 100 });
  }

  const nutrition = {
    kcal: Math.round(raw.kcalPerServing),
    protein: raw.proteinG,
    carbs: raw.carbsG,
    fat: raw.fatG,
    fiber: raw.fiberG,
    sugar: Math.round(addedSugar * 10) / 10,
    addedSugar: Math.round(addedSugar * 10) / 10,
  };
  const total = raw.prepMin + raw.cookMin;
  const effort: Effort = total <= 20 ? 'quick' : total <= 45 ? 'moderate' : 'elaborate';
  const tags = [...raw.tags.map(slug), 'ai'];
  return {
    id: `ai-${slug(raw.name)}-${now.toString(36)}`,
    name: raw.name,
    cuisine: raw.cuisine,
    style: raw.style,
    region: raw.style,
    origin: raw.origin,
    course: [raw.course],
    diet: raw.diet,
    effort,
    prepMin: raw.prepMin,
    cookMin: raw.cookMin,
    totalMin: total,
    tags,
    ingredients,
    steps: untracked.length
      ? [...raw.steps, `Also uses (not tracked in your inventory): ${untracked.join(', ')}.`]
      : raw.steps,
    portion: raw.portion,
    nutrition,
    healthTier: classifyHealth(nutrition, raw.course, tags),
    source: 'claude',
  };
}

export interface IdeasOptions {
  apiKey: string;
  model?: string;
  prefs: Preferences;
  course: Course;
  inventory: Inventory;
  /** Injected in tests. */
  client?: Pick<Anthropic, 'beta'>;
}

/**
 * Asks Claude for recipe ideas as structured JSON. Errors are mapped to short user-facing
 * messages; the caller falls back to built-in suggestions.
 */
export async function generateIdeas(opts: IdeasOptions): Promise<Recipe[]> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Anthropic = (require('@anthropic-ai/sdk') as typeof import('@anthropic-ai/sdk')).default;
  const client =
    opts.client ??
    new Anthropic({
      apiKey: opts.apiKey,
      dangerouslyAllowBrowser: true,
      timeout: 90_000,
      maxRetries: 1,
    });
  let response: Anthropic.Beta.BetaMessage;
  try {
    response = await client.beta.messages.create({
      model: opts.model || DEFAULT_CLAUDE_MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium', format: { type: 'json_schema', schema: RECIPE_SCHEMA } },
      system:
        'You are a practical home-cooking assistant for a kitchen inventory app. Recipes must be realistic, safe and cookable at home, with honest calorie estimates.',
      messages: [{ role: 'user', content: buildPrompt(opts.prefs, opts.course, opts.inventory) }],
    });
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError)
      throw new ClaudeIdeasError('Your Anthropic API key was rejected. Check it in Settings.');
    if (e instanceof Anthropic.RateLimitError)
      throw new ClaudeIdeasError('Claude is rate-limited right now. Try again in a minute.');
    if (e instanceof Anthropic.APIConnectionTimeoutError)
      throw new ClaudeIdeasError('Claude took too long to answer. Try again.');
    if (e instanceof Anthropic.APIConnectionError)
      throw new ClaudeIdeasError('Could not reach Claude. Check your connection.');
    if (e instanceof Anthropic.APIError)
      throw new ClaudeIdeasError(`Claude request failed (${e.status ?? 'error'}).`);
    throw e;
  }

  if (response.stop_reason === 'refusal')
    throw new ClaudeIdeasError('Claude declined this request.');
  if (response.stop_reason === 'max_tokens')
    throw new ClaudeIdeasError('Claude’s answer was cut off. Try again.');
  const text = response.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('');
  let parsed: { recipes?: RawRecipe[] };
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new ClaudeIdeasError('Claude returned an unreadable answer. Try again.');
  }
  const now = Date.now();
  const recipes = (parsed.recipes ?? [])
    .map((r, i) => toRecipe(r, now + i))
    .filter((r): r is Recipe => !!r);
  if (!recipes.length)
    throw new ClaudeIdeasError('Claude didn’t return any usable recipes. Try again.');
  return recipes;
}

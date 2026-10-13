import { recipeById, RECIPES } from '../catalog';
import { scaledNeeds } from '../inventory';
import {
  DEFAULT_PREFS,
  isEligible,
  planWeek,
  remainingShortfall,
  suggest,
  type Preferences,
} from '../planner';
import type { Inventory } from '../types';

const ctx = { today: '2026-10-11', seed: 3 };
const stockFor = (ids: string[], qty = 5000): Inventory =>
  Object.fromEntries(ids.map((id) => [id, { ingredientId: id, qty }]));

describe('eligibility filters', () => {
  const veg: Preferences = { ...DEFAULT_PREFS, diet: 'veg', maxEffort: 'elaborate', mode: 'cheat' };

  it('keeps diet within the chosen level', () => {
    expect(isEligible(recipeById('tandoori-chicken-salad')!, veg, 'dinner')).toBe(false);
    expect(isEligible(recipeById('palak-paneer-roti')!, veg, 'dinner')).toBe(true);
    expect(isEligible(recipeById('palak-paneer-roti')!, { ...veg, diet: 'vegan' }, 'dinner')).toBe(
      false,
    );
    expect(
      isEligible(recipeById('masala-omelette-toast')!, { ...veg, diet: 'egg' }, 'breakfast'),
    ).toBe(true);
  });

  it('respects effort, avoid list and healthy mode', () => {
    expect(isEligible(recipeById('undhiyu')!, { ...veg, maxEffort: 'moderate' }, 'lunch')).toBe(
      false,
    );
    expect(isEligible(recipeById('kanda-poha')!, { ...veg, avoid: ['peanuts'] }, 'breakfast')).toBe(
      false,
    );
    expect(isEligible(recipeById('chole-bhature')!, veg, 'breakfast')).toBe(true);
    expect(isEligible(recipeById('chole-bhature')!, { ...veg, mode: 'healthy' }, 'breakfast')).toBe(
      false,
    );
  });

  it('only suggests from chosen cuisines and the right course', () => {
    const prefs: Preferences = {
      ...DEFAULT_PREFS,
      cuisines: ['lebanese'],
      diet: 'nonveg',
      maxEffort: 'elaborate',
    };
    const res = suggest(prefs, 'breakfast', {}, ctx, 20);
    expect(res.length).toBeGreaterThan(3);
    for (const s of res) {
      expect(s.recipe.cuisine).toBe('lebanese');
      expect(s.recipe.course).toContain('breakfast');
    }
  });
});

describe('ranking', () => {
  it('puts a fully stocked dish first and reports nothing missing', () => {
    const poha = recipeById('kanda-poha')!;
    const inv = stockFor(poha.ingredients.map((i) => i.id));
    const res = suggest(
      { ...DEFAULT_PREFS, cuisines: ['indian'], diet: 'vegan' },
      'breakfast',
      inv,
      ctx,
    );
    expect(res[0].recipe.id).toBe('kanda-poha');
    expect(res[0].missing).toEqual([]);
    expect(res[0].coverage).toBeCloseTo(1);
  });

  it('prefers dishes that use soon-to-spoil stock', () => {
    const inv: Inventory = {
      spinach: { ingredientId: 'spinach', qty: 500, addedOn: '2026-10-09' },
    };
    const res = suggest(
      { ...DEFAULT_PREFS, cuisines: ['indian'], meals: ['lunch'] },
      'lunch',
      inv,
      ctx,
      5,
    );
    expect(res[0].recipe.ingredients.some((i) => i.id === 'spinach')).toBe(true);
    expect(res[0].reasons.join(' ')).toMatch(/Spinach/);
  });
});

describe('weekly plan', () => {
  const prefs: Preferences = {
    ...DEFAULT_PREFS,
    scope: 'week',
    diet: 'nonveg',
    maxEffort: 'elaborate',
    people: 2,
  };

  it('fills 7 days × 3 meals with no repeated dish', () => {
    const plan = planWeek(prefs, {}, ctx);
    expect(plan.days).toHaveLength(7);
    const ids = plan.days.flat().map((s) => s.recipeId);
    expect(ids).toHaveLength(21);
    expect(new Set(ids).size).toBe(21);
    for (const day of plan.days)
      expect(day.map((s) => s.course)).toEqual(['breakfast', 'lunch', 'dinner']);
  });

  it('shortfall equals total plan needs minus stock, per ingredient', () => {
    const inv: Inventory = {
      rice: { ingredientId: 'rice', qty: 300 },
      onion: { ingredientId: 'onion', qty: 200 },
    };
    const plan = planWeek(prefs, inv, ctx);
    const total = new Map<string, number>();
    for (const slot of plan.days.flat()) {
      for (const n of scaledNeeds(recipeById(slot.recipeId)!, slot.servings)) {
        if (!n.optional) total.set(n.ingredientId, (total.get(n.ingredientId) ?? 0) + n.qty);
      }
    }
    const short = Object.fromEntries(plan.shortfall.map((n) => [n.ingredientId, n.qty]));
    for (const [id, need] of total) {
      const expected = Math.max(0, need - (inv[id]?.qty ?? 0));
      if (expected > 0.01) expect(short[id]).toBeCloseTo(expected, 1);
      else expect(short[id]).toBeUndefined();
    }
    // Remaining shortfall against the same stock is identical before anything is cooked.
    const again = Object.fromEntries(
      remainingShortfall(plan, inv).map((n) => [n.ingredientId, n.qty]),
    );
    expect(again).toEqual(short);
  });

  it('honours vegan + quick filters across the whole week', () => {
    const plan = planWeek(
      {
        ...prefs,
        diet: 'vegan',
        maxEffort: 'quick',
        weekendEffort: 'quick',
        mealPrep: false,
        meals: ['breakfast', 'dinner'],
      },
      {},
      ctx,
    );
    for (const slot of plan.days.flat()) {
      const r = RECIPES.find((x) => x.id === slot.recipeId)!;
      expect(r.diet).toBe('vegan');
      expect(r.effort).toBe('quick');
    }
  });
});

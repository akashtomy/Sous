import { ingredientById, recipeById } from '../catalog';
import { classifyHealth, computeNutrition, macrosFor, scaleNutrition } from '../nutrition';
import { formatQty, toBase } from '../units';

const ing = (id: string) => {
  const i = ingredientById(id);
  if (!i) throw new Error(`missing ${id}`);
  return i;
};

describe('units', () => {
  it('converts typed quantities to base units', () => {
    expect(toBase(ing('rice'), 2, 'kg')).toBe(2000);
    expect(toBase(ing('oil'), 1, 'l')).toBe(1000);
    expect(toBase(ing('oil'), 2, 'tbsp')).toBe(30);
    expect(toBase(ing('mustard-seeds'), 2, 'tsp')).toBe(6);
    expect(toBase(ing('egg'), 6, 'pc')).toBe(6);
  });

  it('formats quantities for people', () => {
    expect(formatQty(ing('rice'), 1500)).toBe('1.5 kg');
    expect(formatQty(ing('onion'), 120)).toBe('120 g');
    expect(formatQty(ing('oil'), 10)).toBe('2 tsp');
    expect(formatQty(ing('oil'), 30)).toBe('2 tbsp');
    expect(formatQty(ing('oil'), 2000)).toBe('2 L');
    expect(formatQty(ing('mustard-seeds'), 3)).toBe('1 tsp');
    expect(formatQty(ing('egg'), 2)).toBe('2 pc');
    expect(formatQty(ing('lemon'), 0.5)).toBe('½ pc');
  });
});

describe('nutrition math', () => {
  it('scales per-100 g values and converts pieces to grams', () => {
    expect(macrosFor(ing('rice'), 50).kcal).toBeCloseTo(178, 0);
    // 2 eggs × 50 g × 143 kcal/100 g
    expect(macrosFor(ing('egg'), 2).kcal).toBeCloseTo(143, 0);
    expect(macrosFor(ing('oil'), 10).fat).toBeCloseTo(9.2, 1);
  });

  it('sums a recipe and counts only sweeteners as added sugar', () => {
    const n = computeNutrition(
      [
        { id: 'milk', qty: 200 },
        { id: 'jaggery', qty: 10 },
      ],
      ingredientById,
    );
    expect(n.kcal).toBe(Math.round(120 + 35.4));
    expect(n.sugar).toBeCloseTo(9.6 + 8.4, 1);
    expect(n.addedSugar).toBeCloseTo(8.4, 1);
  });

  it('scales nutrition for servings', () => {
    const r = recipeById('masala-oats')!;
    expect(scaleNutrition(r.nutrition, 3).kcal).toBe(Math.round(r.nutrition.kcal * 3));
  });

  // Spot-checks against typical published per-serving values for these plates
  // (USDA FoodData Central / common nutrition references for equivalent portions).
  it.each([
    ['masala-oats', 230, 330], // 50 g oats bowl with veg
    ['idli-sambar', 280, 420], // 3 idlis + 1 bowl sambar
    ['rajma-chawal', 450, 600], // 1 bowl rajma + 1 plate rice
    ['tandoori-chicken-salad', 420, 600], // 200 g chicken + roti + salad
    ['overnight-oats-berries', 350, 520], // 50 g oats, milk, yogurt, berries, nuts
    ['hummus-bowl', 380, 560], // hummus + crudités + ½ pita
  ])('%s is within %i–%i kcal per serving', (id, lo, hi) => {
    const kcal = recipeById(id)!.nutrition.kcal;
    expect(kcal).toBeGreaterThanOrEqual(lo);
    expect(kcal).toBeLessThanOrEqual(hi);
  });
});

describe('health classification', () => {
  const base = { kcal: 400, protein: 18, carbs: 55, fat: 10, fiber: 8, sugar: 5, addedSugar: 0 };

  it('marks a lean, fibre-rich meal healthy', () => {
    expect(classifyHealth(base, 'lunch', [])).toBe('healthy');
  });
  it('marks fried food indulgent regardless of numbers', () => {
    expect(classifyHealth(base, 'lunch', ['fried'])).toBe('indulgent');
  });
  it('marks a calorie-heavy breakfast indulgent', () => {
    expect(classifyHealth({ ...base, kcal: 700 }, 'breakfast', [])).toBe('indulgent');
  });
  it('marks a low-protein meal balanced', () => {
    expect(classifyHealth({ ...base, protein: 6 }, 'dinner', [])).toBe('balanced');
  });
  it('judges desserts by added sugar, not fruit/milk sugar', () => {
    const d = { kcal: 180, protein: 6, carbs: 30, fat: 4, fiber: 2, sugar: 22, addedSugar: 8 };
    expect(classifyHealth(d, 'dessert', [])).toBe('healthy');
    expect(classifyHealth({ ...d, addedSugar: 30 }, 'dessert', [])).toBe('indulgent');
  });
});

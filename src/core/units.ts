import type { Ingredient } from './types';

/** Units a person can type in; each converts to the ingredient's base unit. */
export type InputUnit = 'g' | 'kg' | 'ml' | 'l' | 'pc' | 'tsp' | 'tbsp' | 'cup';

const TSP_ML = 5;
const TBSP_ML = 15;
const CUP_ML = 240;
/** Rough grams per teaspoon for dry spices/seeds. */
const SPICE_G_PER_TSP = 3;

export function inputUnitsFor(ing: Ingredient): InputUnit[] {
  if (ing.unit === 'pc') return ['pc'];
  if (ing.unit === 'ml') return ['ml', 'l', 'tbsp', 'cup'];
  if (ing.category === 'spice') return ['g', 'tsp'];
  return ['g', 'kg'];
}

export function defaultInputUnit(ing: Ingredient): InputUnit {
  if (ing.unit === 'pc') return 'pc';
  if (ing.unit === 'ml') return ing.category === 'oil' ? 'l' : 'ml';
  if (ing.category === 'spice' || ing.category === 'herb') return 'g';
  return ing.packSizes[0] >= 1000 ? 'kg' : 'g';
}

/** Converts a typed quantity to the ingredient's base unit (g, ml or pc). */
export function toBase(ing: Ingredient, qty: number, unit: InputUnit): number {
  switch (unit) {
    case 'kg':
    case 'l':
      return qty * 1000;
    case 'tsp':
      return ing.unit === 'ml' ? qty * TSP_ML : qty * SPICE_G_PER_TSP;
    case 'tbsp':
      return ing.unit === 'ml' ? qty * TBSP_ML : qty * SPICE_G_PER_TSP * 3;
    case 'cup':
      return qty * CUP_ML;
    default:
      return qty;
  }
}

function trim(n: number, digits = 1): string {
  const f = 10 ** digits;
  return String(Math.round(n * f) / f);
}

function fraction(n: number): string {
  const whole = Math.floor(n);
  const rem = n - whole;
  const frac = rem < 0.125 ? '' : rem < 0.375 ? '¼' : rem < 0.625 ? '½' : rem < 0.875 ? '¾' : '';
  const w = rem >= 0.875 ? whole + 1 : whole;
  if (!w) return frac || '0';
  return `${w}${frac}`;
}

/** Human-friendly quantity for display: "1.5 kg", "2 tbsp", "½ pc", "250 g". */
export function formatQty(ing: Ingredient, qty: number): string {
  if (ing.unit === 'pc') return `${fraction(qty)} pc`;
  if (ing.unit === 'ml') {
    if (qty >= 1000) return `${trim(qty / 1000, 2)} L`;
    if (ing.category === 'oil' || ing.category === 'condiment') {
      if (qty < TBSP_ML) return `${fraction(qty / TSP_ML)} tsp`;
      if (qty <= 60) return `${fraction(qty / TBSP_ML)} tbsp`;
    }
    return `${Math.round(qty)} ml`;
  }
  if (qty >= 1000) return `${trim(qty / 1000, 2)} kg`;
  if (ing.category === 'spice' && qty < 10) return `${fraction(qty / SPICE_G_PER_TSP)} tsp`;
  if (qty < 10) return `${trim(qty)} g`;
  return `${Math.round(qty)} g`;
}

/** Shopping-list friendly pack text, e.g. "2 × 500 g". */
export function formatPacks(ing: Ingredient, packSize: number, count: number): string {
  const one = ing.unit === 'pc' ? `${packSize} pc` : formatPackSize(ing, packSize);
  return count > 1 ? `${count} × ${one}` : one;
}

function formatPackSize(ing: Ingredient, size: number): string {
  if (ing.unit === 'ml') return size >= 1000 ? `${trim(size / 1000, 2)} L` : `${size} ml`;
  return size >= 1000 ? `${trim(size / 1000, 2)} kg` : `${size} g`;
}

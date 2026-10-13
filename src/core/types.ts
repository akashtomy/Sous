// Shared domain types. Pure TS: no React Native imports anywhere under src/core.

export type Unit = 'g' | 'ml' | 'pc';

export type IngredientCategory =
  | 'vegetable'
  | 'fruit'
  | 'grain'
  | 'pulse'
  | 'spice'
  | 'herb'
  | 'oil'
  | 'dairy'
  | 'protein'
  | 'nut'
  | 'condiment'
  | 'bakery';

export interface Macros {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
}

/** Per-serving nutrition; addedSugar counts only free sugars (sugar, jaggery, honey). */
export interface Nutrition extends Macros {
  addedSugar: number;
}

export interface Ingredient {
  id: string;
  name: string;
  aliases: string[];
  category: IngredientCategory;
  /** Base unit that inventory and recipe quantities use for this item. */
  unit: Unit;
  /** For unit 'pc': edible grams per piece, used for nutrition. */
  gramsPerPc?: number;
  /** Nutrition per 100 g (or per 100 ml for unit 'ml'). */
  per100: Macros;
  /** Always assumed available (salt, water); never deducted or alerted. */
  staple?: boolean;
  /** Its sugar counts as added/free sugar (sugar, jaggery, honey). */
  sweetener?: boolean;
  /** Typical shelf life once bought; undefined = long-keeping. */
  perishableDays?: number;
  /** Purchasable pack sizes in base unit, ascending. */
  packSizes: number[];
  /** Low-stock threshold in base unit. */
  defaultPar: number;
}

export type Cuisine = 'indian' | 'lebanese' | 'chinese' | 'continental' | 'international';
export type Course = 'breakfast' | 'lunch' | 'dinner' | 'dessert' | 'snack';
export type Diet = 'vegan' | 'veg' | 'egg' | 'nonveg';
export type Effort = 'quick' | 'moderate' | 'elaborate';
export type HealthTier = 'healthy' | 'balanced' | 'indulgent';

export interface RecipeIngredient {
  id: string;
  /** Quantity per serving, in the ingredient's base unit. */
  qty: number;
  optional?: boolean;
}

export interface Recipe {
  id: string;
  name: string;
  cuisine: Cuisine;
  /** e.g. 'South Indian', 'Sichuan', 'Thai', 'Levant' */
  style: string;
  /** Indian: North/South/East/West/North-East/Central. Others: wider region. */
  region: string;
  /** State (India) or country of origin. */
  origin: string;
  course: Course[];
  diet: Diet;
  effort: Effort;
  prepMin: number;
  cookMin: number;
  totalMin: number;
  /** Hands-off advance work such as soaking or fermenting. */
  advancePrep?: string;
  tags: string[];
  ingredients: RecipeIngredient[];
  steps: string[];
  /** What one serving looks like on the plate. */
  portion: string;
  /** Per serving, computed from the ingredient master. */
  nutrition: Nutrition;
  healthTier: HealthTier;
  source: 'builtin' | 'claude';
}

export interface InventoryItem {
  ingredientId: string;
  qty: number;
  /** Override of the ingredient's default par level. */
  par?: number;
  /** ISO date the item was last restocked; used for perishables. */
  addedOn?: string;
}

export type Inventory = Record<string, InventoryItem>;

// Choices and labels shared by setup, the meal questions and the summaries on Today.
import type { MealMode, Mood } from '@/core/planner';
import type { Course, Cuisine, Diet, Effort } from '@/core/types';

export const COURSES: Course[] = ['breakfast', 'lunch', 'dinner', 'dessert', 'snack'];
export const CUISINES: Cuisine[] = ['indian', 'lebanese', 'chinese', 'continental', 'international'];

export const DIETS: { v: Diet; label: string }[] = [
  { v: 'veg', label: 'Vegetarian' },
  { v: 'egg', label: 'Veg + eggs' },
  { v: 'nonveg', label: 'Non-veg' },
  { v: 'vegan', label: 'Vegan' },
];
export const DIET_LABEL = Object.fromEntries(DIETS.map((d) => [d.v, d.label])) as Record<Diet, string>;

export const EFFORTS: { v: Effort; label: string }[] = [
  { v: 'quick', label: 'Quick (≤ 20 min)' },
  { v: 'moderate', label: 'Some effort (≤ 45 min)' },
  { v: 'elaborate', label: 'Happy to cook' },
];
export const EFFORT_LABEL = Object.fromEntries(EFFORTS.map((e) => [e.v, e.label])) as Record<
  Effort,
  string
>;

export const MOODS: { v: Mood; label: string }[] = [
  { v: 'any', label: 'Anything' },
  { v: 'light', label: 'Something light' },
  { v: 'comfort', label: 'Comfort food' },
  { v: 'high-protein', label: 'High protein' },
];

export const MODES: { v: MealMode; label: string }[] = [
  { v: 'healthy', label: 'Healthy' },
  { v: 'balanced', label: 'Balanced' },
  { v: 'cheat', label: 'Cheat meal' },
];
export const MODE_LABEL = Object.fromEntries(MODES.map((m) => [m.v, m.label])) as Record<
  MealMode,
  string
>;

export const toggleIn = <K,>(list: K[], v: K) =>
  list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

// Common outside / takeaway dishes with rough per-person calories for a typical restaurant
// portion in India. Estimates only: portion sizes and recipes vary a lot between places.

import type { Cuisine } from './types';

export interface OutsidePreset {
  name: string;
  cuisine: Cuisine;
  kcal: number;
}

export const OUTSIDE_PRESETS: OutsidePreset[] = [
  { name: 'Chicken biryani', cuisine: 'indian', kcal: 800 },
  { name: 'Veg biryani', cuisine: 'indian', kcal: 650 },
  { name: 'Butter chicken with 2 butter naan', cuisine: 'indian', kcal: 1100 },
  { name: 'Paneer butter masala with 2 naan', cuisine: 'indian', kcal: 1000 },
  { name: 'Dal makhani with jeera rice', cuisine: 'indian', kcal: 750 },
  { name: 'North Indian veg thali', cuisine: 'indian', kcal: 900 },
  { name: 'South Indian meals (rice thali)', cuisine: 'indian', kcal: 800 },
  { name: 'Masala dosa with sambar & chutney', cuisine: 'indian', kcal: 450 },
  { name: 'Idli-vada with sambar', cuisine: 'indian', kcal: 450 },
  { name: 'Chole bhature', cuisine: 'indian', kcal: 850 },
  { name: 'Pav bhaji', cuisine: 'indian', kcal: 600 },
  { name: 'Vada pav (2)', cuisine: 'indian', kcal: 600 },
  { name: 'Samosa (2)', cuisine: 'indian', kcal: 520 },
  { name: 'Pani puri (1 plate)', cuisine: 'indian', kcal: 300 },
  { name: 'Kathi roll', cuisine: 'indian', kcal: 500 },
  { name: 'Veg momos (8)', cuisine: 'indian', kcal: 350 },
  { name: 'Chicken momos (8)', cuisine: 'indian', kcal: 420 },
  { name: 'Veg hakka noodles', cuisine: 'chinese', kcal: 600 },
  { name: 'Chicken fried rice', cuisine: 'chinese', kcal: 700 },
  { name: 'Chilli chicken (dry)', cuisine: 'chinese', kcal: 550 },
  { name: 'Gobi manchurian', cuisine: 'chinese', kcal: 500 },
  { name: 'Chicken shawarma roll', cuisine: 'lebanese', kcal: 550 },
  { name: 'Falafel wrap', cuisine: 'lebanese', kcal: 600 },
  { name: 'Hummus & pita platter', cuisine: 'lebanese', kcal: 600 },
  { name: 'Margherita pizza (½ medium)', cuisine: 'continental', kcal: 700 },
  { name: 'Burger with fries', cuisine: 'continental', kcal: 900 },
  { name: 'Pasta in white sauce', cuisine: 'continental', kcal: 850 },
  { name: 'Pasta arrabbiata', cuisine: 'continental', kcal: 600 },
  { name: 'Chicken Caesar salad', cuisine: 'continental', kcal: 450 },
  { name: 'Sub sandwich (6-inch)', cuisine: 'continental', kcal: 450 },
  { name: 'Coffee and a pastry', cuisine: 'continental', kcal: 450 },
  { name: 'Thai green curry with rice', cuisine: 'international', kcal: 750 },
  { name: 'Pad thai', cuisine: 'international', kcal: 650 },
  { name: 'Sushi (8 pieces)', cuisine: 'international', kcal: 400 },
  { name: 'Burrito bowl', cuisine: 'international', kcal: 700 },
  { name: 'Salad bowl', cuisine: 'international', kcal: 400 },
  { name: 'Ice cream (2 scoops)', cuisine: 'continental', kcal: 300 },
];

/** Restaurant versions of home dishes usually carry more oil, butter and sugar. */
export const RESTAURANT_FACTOR = 1.3;

export function searchPresets(q: string, limit = 6): OutsidePreset[] {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  return OUTSIDE_PRESETS.filter((p) => p.name.toLowerCase().includes(s)).slice(0, limit);
}

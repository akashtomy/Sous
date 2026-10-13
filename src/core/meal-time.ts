import type { Course } from './types';

/** Meals in the order someone thinks about them at this hour: the next meal comes first. */
export function mealsByTimeOfDay(meals: Course[], hour: number): Course[] {
  const order: Course[] =
    hour < 10
      ? ['breakfast', 'lunch', 'snack', 'dinner', 'dessert']
      : hour < 15
        ? ['lunch', 'snack', 'dinner', 'dessert', 'breakfast']
        : ['dinner', 'dessert', 'breakfast', 'lunch', 'snack'];
  return order.filter((c) => meals.includes(c));
}

/** Breakfast and lunch listed after 3 pm are for tomorrow. */
export function isForTomorrow(course: Course, hour: number): boolean {
  return hour >= 15 && (course === 'breakfast' || course === 'lunch');
}

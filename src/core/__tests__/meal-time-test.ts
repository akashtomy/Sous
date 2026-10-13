import { isForTomorrow, mealsByTimeOfDay } from '../meal-time';

describe('meals by time of day', () => {
  const all = ['breakfast', 'lunch', 'dinner', 'dessert', 'snack'] as const;
  it('puts the next meal first', () => {
    expect(mealsByTimeOfDay([...all], 8)[0]).toBe('breakfast');
    expect(mealsByTimeOfDay([...all], 13)[0]).toBe('lunch');
    expect(mealsByTimeOfDay([...all], 20)[0]).toBe('dinner');
  });
  it('keeps only the chosen meals', () => {
    expect(mealsByTimeOfDay(['breakfast', 'dinner'], 20)).toEqual(['dinner', 'breakfast']);
  });
  it('marks breakfast and lunch after 3 pm as tomorrow', () => {
    expect(isForTomorrow('breakfast', 21)).toBe(true);
    expect(isForTomorrow('dinner', 21)).toBe(false);
    expect(isForTomorrow('lunch', 9)).toBe(false);
  });
});

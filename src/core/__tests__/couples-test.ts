import { recipeById, RECIPES } from '../catalog';
import { addDays, isWeekend, weekdayOf } from '../dates';
import { OUTSIDE_PRESETS, searchPresets } from '../eatout';
import { buildPrepPlan, prepDateFor, prepSavedMinutes } from '../mealprep';
import { buildPersona, personaAdjust, type PersonaInput } from '../persona';
import {
  DEFAULT_PREFS,
  effectiveMinutes,
  isEligible,
  planWeek,
  remainingShortfall,
  suggest,
  weekStartDate,
  type Preferences,
  type WeekPlan,
} from '../planner';
import { normaliseYoutubeUrl, youtubeSearchUrl } from '../youtube';

// 2026-10-11 is a Sunday, 2026-10-12 a Monday.
const SUNDAY = '2026-10-11';
const MONDAY = '2026-10-12';

describe('dates', () => {
  it('knows weekdays and weekends', () => {
    expect(weekdayOf(SUNDAY)).toBe(0);
    expect(isWeekend(SUNDAY)).toBe(true);
    expect(isWeekend(MONDAY)).toBe(false);
    expect(addDays(MONDAY, 6)).toBe('2026-10-18');
  });
});

describe('working-couple defaults', () => {
  it('defaults to 2 people, quick weekdays, relaxed weekends and Sunday prep', () => {
    expect(DEFAULT_PREFS).toMatchObject({
      people: 2,
      maxEffort: 'quick',
      weekendEffort: 'elaborate',
      mealPrep: true,
      prepDay: 'sunday',
    });
  });

  it('starts the week on the prep day so prep feeds Monday–Friday', () => {
    expect(weekStartDate(DEFAULT_PREFS, MONDAY)).toBe('2026-10-18');
    expect(weekStartDate(DEFAULT_PREFS, SUNDAY)).toBe(SUNDAY);
    expect(weekStartDate({ ...DEFAULT_PREFS, weekStart: 'today' }, MONDAY)).toBe(MONDAY);
  });

  it('counts weekend-prep savings on weekdays only', () => {
    const dal = recipeById('dal-tadka-phulka')!; // 35 min: dal, masala, dough, greens
    expect(prepSavedMinutes(dal)).toBeGreaterThan(0);
    expect(effectiveMinutes(dal, DEFAULT_PREFS, MONDAY)).toBeLessThanOrEqual(20);
    expect(effectiveMinutes(dal, DEFAULT_PREFS, SUNDAY)).toBe(dal.totalMin);
    // So it is a quick weekday dinner with prep, but not without.
    expect(isEligible(dal, DEFAULT_PREFS, 'dinner', MONDAY)).toBe(true);
    expect(isEligible(dal, { ...DEFAULT_PREFS, mealPrep: false }, 'dinner', MONDAY)).toBe(false);
  });

  it('allows elaborate dishes at the weekend but not on weekdays', () => {
    const undhiyu = recipeById('undhiyu')!;
    const prefs = { ...DEFAULT_PREFS, mode: 'balanced' as const };
    expect(isEligible(undhiyu, prefs, 'lunch', SUNDAY)).toBe(true);
    expect(isEligible(undhiyu, prefs, 'lunch', MONDAY)).toBe(false);
  });

  it('plans quick weekdays and fuller weekends', () => {
    const prefs: Preferences = { ...DEFAULT_PREFS, diet: 'nonveg' };
    const plan = planWeek(prefs, {}, { today: SUNDAY, seed: 2 }, 7, SUNDAY);
    plan.days.forEach((slots, d) => {
      const date = addDays(SUNDAY, d);
      for (const s of slots) {
        const r = recipeById(s.recipeId)!;
        if (!isWeekend(date)) expect(effectiveMinutes(r, prefs, date)).toBeLessThanOrEqual(20);
      }
    });
  });
});

describe('weekend meal prep', () => {
  const plan: WeekPlan = {
    startDate: SUNDAY,
    prefs: DEFAULT_PREFS,
    shortfall: [],
    days: [
      [{ day: 0, course: 'dinner', recipeId: 'rajma-chawal', servings: 2, alternates: [] }], // Sunday itself
      [{ day: 1, course: 'dinner', recipeId: 'dal-tadka-phulka', servings: 2, alternates: [] }],
      [{ day: 2, course: 'breakfast', recipeId: 'idli-sambar', servings: 2, alternates: [] }],
      [{ day: 3, course: 'dinner', recipeId: 'lauki-chana-dal', servings: 2, alternates: [] }],
      [{ day: 4, course: 'dinner', recipeId: 'rajma-chawal', servings: 2, alternates: [] }],
      [
        {
          day: 5,
          course: 'dinner',
          recipeId: 'tandoori-chicken-salad',
          servings: 2,
          alternates: [],
        },
      ],
      [{ day: 6, course: 'dinner', recipeId: 'kadhi-chawal', servings: 2, alternates: [] }], // Saturday
    ],
  };
  const prep = buildPrepPlan(plan, 'sunday');
  const task = (id: string) => prep.tasks.find((t) => t.id === id);

  it('preps on the Sunday the plan starts and covers only Mon–Fri meals', () => {
    expect(prepDateFor(SUNDAY, 'sunday')).toBe(SUNDAY);
    expect(prep.prepDate).toBe(SUNDAY);
    const days = new Set(prep.tasks.flatMap((t) => t.meals.map((m) => m.day)));
    expect(days.has(0)).toBe(false);
    expect(days.has(6)).toBe(false);
    expect(prep.mealsCovered).toBe(5);
  });

  it('aggregates dal quantities and adds batter and bean tasks', () => {
    expect(task('pulses:toor-dal')?.items[0]).toEqual({ ingredientId: 'toor-dal', qty: 60 }); // 30 g × 2
    expect(task('batter')?.meals.map((m) => m.recipeId)).toEqual(['idli-sambar']);
    expect(task('beans:rajma')?.meals[0]).toMatchObject({ day: 4, freeze: false }); // Thursday = 4 days
  });

  it('freezes far-off portions and skips fridge-only prep that would not keep', () => {
    expect(task('marinate')?.meals[0]).toMatchObject({ day: 5, freeze: true }); // chicken on Friday
    const dough = task('dough');
    expect(dough?.meals.every((m) => m.day <= 2)).toBe(true);
  });

  it('sprouts whole moong instead of cooking it', () => {
    const p = buildPrepPlan(
      {
        startDate: SUNDAY,
        days: [[], [{ course: 'breakfast', recipeId: 'pesarattu', servings: 2 }]],
      },
      'sunday',
    );
    expect(p.tasks.map((t) => t.kind)).toContain('sprouts');
    expect(p.tasks.some((t) => t.kind === 'pulses')).toBe(false);
  });

  it('reports time spent and saved', () => {
    expect(prep.totalActiveMin).toBeGreaterThan(0);
    expect(prep.totalSavedMin).toBeGreaterThan(prep.tasks.length);
  });

  it('skips meals already cooked or eaten out', () => {
    const p2 = {
      ...plan,
      days: plan.days.map((d) => d.map((s) => (s.day === 1 ? { ...s, eatOutId: 'x' } : s))),
    };
    const tasks = buildPrepPlan(p2, 'sunday').tasks;
    expect(tasks.find((t) => t.id === 'pulses:toor-dal')).toBeUndefined(); // only Monday's dal used it
    expect(tasks.find((t) => t.id === 'pulses:chana-dal')?.meals.map((m) => m.day)).toEqual([3]);
    expect(remainingShortfall(p2, {}).length).toBeLessThan(remainingShortfall(plan, {}).length);
  });
});

describe('taste persona', () => {
  const base: PersonaInput = {
    cooked: [],
    ratings: {},
    hidden: [],
    swappedAway: {},
    outside: [],
    lookup: (id) => recipeById(id),
    today: MONDAY,
  };

  it('needs a few meals before it says anything', () => {
    expect(buildPersona(base).enoughData).toBe(false);
    // Two meals are not a taste profile: no ranking tilt and no "you often cook" claims.
    const two = buildPersona({
      ...base,
      cooked: ['dal-tadka-phulka', 'rajma-chawal'].map((recipeId) => ({
        recipeId,
        date: MONDAY,
        servings: 2,
      })),
    });
    expect(two.cuisineAffinity).toEqual({});
    expect(personaAdjust(recipeById('chole-brown-rice')!, two).reason).toBeUndefined();
  });

  it('learns cuisine and style affinity from cooking and ratings', () => {
    const p = buildPersona({
      ...base,
      cooked: ['idli-sambar', 'ven-pongal', 'rasam-rice', 'curd-rice', 'pesarattu'].map(
        (recipeId) => ({ recipeId, date: MONDAY, servings: 2 }),
      ),
      ratings: { 'idli-sambar': 'love' },
    });
    expect(p.enoughData).toBe(true);
    expect(p.topCuisines[0].cuisine).toBe('indian');
    expect(p.loved).toContain('idli-sambar');
    expect(p.labels.join(' ')).toMatch(/Tamil fans|South Indian fans/);
    expect(p.thisWeek.home).toBe(5);
  });

  it('excludes disliked dishes and infers disliked ingredients', () => {
    const p = buildPersona({
      ...base,
      ratings: { 'baingan-bharta': 'dislike', 'yu-xiang-eggplant': 'dislike' },
      hidden: ['baba-ghanoush-plate'],
    });
    expect(p.excluded).toEqual(expect.arrayContaining(['baingan-bharta', 'baba-ghanoush-plate']));
    expect(p.dislikedIngredients).toContain('brinjal');
    const res = suggest(
      { ...DEFAULT_PREFS, maxEffort: 'elaborate', mode: 'balanced', cuisines: ['indian'] },
      'dinner',
      {},
      { today: MONDAY, persona: p },
      300,
    );
    expect(res.some((s) => s.recipe.id === 'baingan-bharta')).toBe(false);
    expect(personaAdjust(recipeById('bharli-vangi')!, p).delta).toBeLessThan(0);
  });

  it('tracks eating out and spend for the week', () => {
    const p = buildPersona({
      ...base,
      outside: [
        {
          id: 'a',
          date: MONDAY,
          course: 'dinner',
          name: 'Pizza',
          kcal: 700,
          people: 2,
          cost: 900,
          cuisine: 'continental',
        },
        {
          id: 'b',
          date: '2026-09-01',
          course: 'lunch',
          name: 'Old',
          kcal: 500,
          people: 1,
          cost: 300,
        },
        {
          id: 'c',
          date: '2026-09-02',
          course: 'dinner',
          name: 'Pasta',
          kcal: 850,
          people: 2,
          cuisine: 'continental',
        },
      ],
    });
    expect(p.thisWeek).toMatchObject({ out: 1, spend: 900 });
    expect(p.cuisineAffinity.continental).toBeGreaterThan(0);
  });

  it('ranks loved dishes higher and explains why', () => {
    const p = buildPersona({ ...base, ratings: { 'kanda-poha': 'love' } });
    const adj = personaAdjust(recipeById('kanda-poha')!, p);
    expect(adj.delta).toBeGreaterThan(0.1);
    expect(adj.reason).toBe('You loved this');
  });
});

describe('eating out and YouTube', () => {
  it('has calorie estimates for common outside dishes', () => {
    expect(OUTSIDE_PRESETS.length).toBeGreaterThan(30);
    expect(searchPresets('biryani').map((p) => p.name)).toEqual(['Chicken biryani', 'Veg biryani']);
  });

  it('builds a YouTube search link for every recipe', () => {
    expect(youtubeSearchUrl(recipeById('idli-sambar')!)).toBe(
      'https://www.youtube.com/results?search_query=Idli%20recipe%20Tamil%20Nadu',
    );
    for (const r of RECIPES)
      expect(youtubeSearchUrl(r)).toMatch(
        /^https:\/\/www\.youtube\.com\/results\?search_query=.+recipe/,
      );
  });

  it('accepts only YouTube links as a saved video', () => {
    expect(normaliseYoutubeUrl('https://youtu.be/abc123?si=x')).toBe('https://youtu.be/abc123');
    expect(normaliseYoutubeUrl('https://m.youtube.com/watch?v=abc&t=10')).toBe(
      'https://www.youtube.com/watch?v=abc',
    );
    expect(normaliseYoutubeUrl('https://evil.example.com/watch?v=abc')).toBeUndefined();
    expect(normaliseYoutubeUrl('not a url')).toBeUndefined();
  });
});

import { DEFAULT_PREFS, type WeekPlan } from '@/core/planner';

import {
  applyOp,
  applyOps,
  EMPTY_SHARED,
  opsToUpload,
  stateFromRows,
  type SharedState,
  type SnapshotRows,
} from '../state';

const base: SharedState = {
  ...EMPTY_SHARED,
  inventory: { onion: { ingredientId: 'onion', qty: 1000, par: 300, addedOn: '2026-10-01' } },
};

describe('applyOp mirrors the server', () => {
  it('deltas clamp at zero and skip unstocked deductions', () => {
    let s = applyOp(base, { type: 'inv.delta', ingredientId: 'onion', delta: -120 });
    expect(s.inventory.onion).toEqual({
      ingredientId: 'onion',
      qty: 880,
      par: 300,
      addedOn: '2026-10-01',
    });
    s = applyOp(s, { type: 'inv.delta', ingredientId: 'onion', delta: -5000 });
    expect(s.inventory.onion.qty).toBe(0);
    expect(applyOp(s, { type: 'inv.delta', ingredientId: 'saffron', delta: -1 })).toBe(s);
  });

  it('restocking adds and refreshes the date; new items are created', () => {
    const s = applyOps(base, [
      { type: 'inv.delta', ingredientId: 'onion', delta: 500, addedOn: '2026-10-12' },
      { type: 'inv.delta', ingredientId: 'rice', delta: 1000, addedOn: '2026-10-12' },
    ]);
    expect(s.inventory.onion).toMatchObject({ qty: 1500, par: 300, addedOn: '2026-10-12' });
    expect(s.inventory.rice).toEqual({ ingredientId: 'rice', qty: 1000, addedOn: '2026-10-12' });
  });

  it('set keeps par and date unless given; par null clears it', () => {
    let s = applyOp(base, { type: 'inv.set', ingredientId: 'onion', qty: 50 });
    expect(s.inventory.onion).toEqual({
      ingredientId: 'onion',
      qty: 50,
      par: 300,
      addedOn: '2026-10-01',
    });
    s = applyOp(s, { type: 'inv.par', ingredientId: 'onion', par: null });
    expect(s.inventory.onion.par).toBeUndefined();
  });

  it('two partners’ concurrent changes both survive a rebase', () => {
    // Server already has the partner's +500; this phone's -120 is still pending.
    const server = applyOp(base, { type: 'inv.delta', ingredientId: 'onion', delta: 500 });
    const rebased = applyOps(server, [{ type: 'inv.delta', ingredientId: 'onion', delta: -120 }]);
    expect(rebased.inventory.onion.qty).toBe(1380);
  });

  it('feedback, shopping, outside, AI ideas and docs', () => {
    const s = applyOps(base, [
      { type: 'feedback.rating', recipeId: 'poha', rating: 'love' },
      { type: 'feedback.hidden', recipeId: 'undhiyu', hidden: true },
      { type: 'feedback.swapped', recipeId: 'undhiyu' },
      { type: 'feedback.swapped', recipeId: 'undhiyu' },
      { type: 'feedback.video', recipeId: 'poha', url: 'https://youtu.be/x' },
      { type: 'shopping.add', items: [{ ingredientId: 'paneer', qty: 200 }] },
      { type: 'shopping.add', items: [{ ingredientId: 'paneer', qty: 150 }] },
      {
        type: 'outside.add',
        meal: {
          id: 'o1',
          date: '2026-10-12',
          course: 'dinner',
          name: 'Pizza',
          kcal: 700,
          people: 2,
        },
      },
      { type: 'doc.set', key: 'prefs', data: { ...DEFAULT_PREFS, people: 3 } },
      { type: 'doc.set', key: 'settings', data: { onboarded: true, cartService: 'Zepto' } },
    ]);
    expect(s.ratings).toEqual({ poha: 'love' });
    expect(s.hidden).toEqual(['undhiyu']);
    expect(s.swappedAway).toEqual({ undhiyu: 2 });
    expect(s.videoLinks).toEqual({ poha: 'https://youtu.be/x' });
    expect(s.shoppingExtras).toEqual([{ ingredientId: 'paneer', qty: 200 }]);
    expect(s.outside).toHaveLength(1);
    expect(s.prefs.people).toBe(3);
    expect(s).toMatchObject({ onboarded: true, cartService: 'Zepto' });

    const cleared = applyOps(s, [
      { type: 'feedback.rating', recipeId: 'poha', rating: null },
      { type: 'feedback.hidden', recipeId: 'undhiyu', hidden: false },
      { type: 'feedback.video', recipeId: 'poha', url: null },
      { type: 'shopping.remove', ingredientIds: ['paneer'] },
      { type: 'outside.remove', mealId: 'o1' },
    ]);
    expect(cleared).toMatchObject({
      ratings: {},
      hidden: [],
      videoLinks: {},
      shoppingExtras: [],
      outside: [],
    });
  });

  it('history add is idempotent and remove works', () => {
    const entry = { id: 'h1', recipeId: 'poha', servings: 2, date: '2026-10-12', applied: [] };
    let s = applyOps(base, [
      { type: 'history.add', entry },
      { type: 'history.add', entry },
    ]);
    expect(s.history).toHaveLength(1);
    s = applyOp(s, { type: 'history.remove', entryId: 'h1' });
    expect(s.history).toHaveLength(0);
  });

  it('reset empties shared data', () => {
    expect(applyOp(base, { type: 'reset' })).toEqual(EMPTY_SHARED);
  });
});

describe('server snapshot', () => {
  const plan = {
    startDate: '2026-10-18',
    prefs: DEFAULT_PREFS,
    days: [],
    shortfall: [],
  } as WeekPlan;
  const rows: SnapshotRows = {
    inventory: [
      { ingredient_id: 'onion', qty: '880', par: null, added_on: '2026-10-12' },
      { ingredient_id: 'rice', qty: 5000, par: '1000', added_on: null },
    ],
    history: [
      {
        id: 'h2',
        recipe_id: 'dal-tadka-phulka',
        servings: '2',
        date: '2026-10-12',
        course: 'dinner',
        slot: { day: 1, course: 'dinner' },
        applied: [],
      },
      {
        id: 'h1',
        recipe_id: 'kanda-poha',
        servings: 2,
        date: '2026-10-11',
        course: null,
        slot: null,
        applied: null,
      },
    ],
    outside: [
      {
        data: {
          id: 'o1',
          date: '2026-10-12',
          course: 'lunch',
          name: 'Biryani',
          kcal: 650,
          people: 2,
        },
      },
    ],
    feedback: [
      {
        recipe_id: 'kanda-poha',
        rating: 'love',
        hidden: false,
        swapped_away: 1,
        video_url: 'https://youtu.be/y',
      },
    ],
    shopping: [{ ingredient_id: 'paneer', qty: '200' }],
    ai: [],
    docs: [
      { key: 'plan', data: plan },
      { key: 'settings', data: { onboarded: true, cartService: 'Swiggy Instamart' } },
      { key: 'prefs', data: { people: 2, diet: 'nonveg' } },
    ],
  };

  it('converts rows (numeric strings, nulls) into app state', () => {
    const s = stateFromRows(rows);
    expect(s.inventory.onion).toEqual({ ingredientId: 'onion', qty: 880, addedOn: '2026-10-12' });
    expect(s.inventory.rice).toEqual({ ingredientId: 'rice', qty: 5000, par: 1000 });
    expect(s.history[0]).toEqual({
      id: 'h2',
      recipeId: 'dal-tadka-phulka',
      servings: 2,
      date: '2026-10-12',
      applied: [],
      slot: { day: 1, course: 'dinner' },
      course: 'dinner',
    });
    expect(s.history[1].course).toBeUndefined();
    expect(s.ratings).toEqual({ 'kanda-poha': 'love' });
    expect(s.swappedAway).toEqual({ 'kanda-poha': 1 });
    expect(s.plan).toEqual(plan);
    expect(s.prefs).toEqual({ ...DEFAULT_PREFS, people: 2, diet: 'nonveg' });
    expect(s.onboarded).toBe(true);
  });

  it('uploading a device’s data reproduces the same state', () => {
    const device = stateFromRows(rows);
    expect(applyOps(EMPTY_SHARED, opsToUpload(device))).toEqual(device);
  });
});

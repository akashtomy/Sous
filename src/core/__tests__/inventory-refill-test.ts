import { ingredientById, recipeById } from '../catalog';
import { deduct, expiringSoon, isLow, restock, scaledNeeds, undoDeduct } from '../inventory';
import { buildRefillList, cartMessage, roundToPacks } from '../refill';
import type { Inventory } from '../types';

const TODAY = '2026-10-11';

describe('inventory deduction', () => {
  const inv: Inventory = {
    rice: { ingredientId: 'rice', qty: 1000 },
    onion: { ingredientId: 'onion', qty: 50 },
  };

  it('deducts, clamps at zero and skips items not stocked', () => {
    const { inventory, applied } = deduct(inv, [
      { ingredientId: 'rice', qty: 130 },
      { ingredientId: 'onion', qty: 80 },
      { ingredientId: 'garlic', qty: 5 },
    ]);
    expect(inventory.rice.qty).toBe(870);
    expect(inventory.onion.qty).toBe(0);
    expect(inventory.garlic).toBeUndefined();
    expect(applied).toEqual([
      { ingredientId: 'rice', before: 1000, after: 870 },
      { ingredientId: 'onion', before: 50, after: 0 },
    ]);
  });

  it('undo restores exactly what was taken, keeping later restocks', () => {
    const { inventory, applied } = deduct(inv, [{ ingredientId: 'rice', qty: 130 }]);
    const restocked = restock(inventory, 'rice', 500, TODAY);
    expect(undoDeduct(restocked, applied).rice.qty).toBe(1500);
  });

  it('scales recipe needs by servings and drops staples', () => {
    const r = recipeById('kanda-poha')!;
    const needs = scaledNeeds(r, 3);
    expect(needs.find((n) => n.ingredientId === 'poha')?.qty).toBe(180);
    expect(needs.find((n) => n.ingredientId === 'salt')).toBeUndefined();
    expect(needs.find((n) => n.ingredientId === 'potato')?.optional).toBe(true);
  });
});

describe('alerts', () => {
  it('flags items below par, but never par-0 items', () => {
    expect(isLow({ ingredientId: 'mustard-seeds', qty: 10 })).toBe(true); // par 20
    expect(isLow({ ingredientId: 'mustard-seeds', qty: 30 })).toBe(false);
    expect(isLow({ ingredientId: 'chicken', qty: 0 })).toBe(false); // bought per plan
    expect(isLow({ ingredientId: 'rice', qty: 400, par: 300 })).toBe(false); // custom par
  });

  it('lists perishables close to spoiling, soonest first', () => {
    const inv: Inventory = {
      spinach: { ingredientId: 'spinach', qty: 200, addedOn: '2026-10-09' }, // 3-day life → 1 left
      tomato: { ingredientId: 'tomato', qty: 300, addedOn: '2026-10-10' }, // 6-day life → 5 left
      milk: { ingredientId: 'milk', qty: 500, addedOn: '2026-10-10' }, // 2-day life → 1 left
      rice: { ingredientId: 'rice', qty: 1000, addedOn: '2026-01-01' }, // keeps
    };
    expect(
      expiringSoon(inv, TODAY)
        .map((i) => i.ingredientId)
        .sort(),
    ).toEqual(['milk', 'spinach']);
  });
});

describe('refill list', () => {
  it('rounds needs up to pack sizes', () => {
    const oil = ingredientById('oil')!; // packs 1000, 5000
    expect(roundToPacks(oil, 300)).toEqual({ packSize: 1000, count: 1 });
    expect(roundToPacks(oil, 12000)).toEqual({ packSize: 5000, count: 3 });
  });

  it('tops low items up to twice par and merges plan shortfall', () => {
    const inv: Inventory = {
      'mustard-seeds': { ingredientId: 'mustard-seeds', qty: 5 }, // par 20 → need 35
      onion: { ingredientId: 'onion', qty: 100 }, // par 500 → need 900
      rice: { ingredientId: 'rice', qty: 5000 },
    };
    const list = buildRefillList(inv, [
      { ingredientId: 'onion', qty: 300 },
      { ingredientId: 'paneer', qty: 160 },
    ]);
    const by = Object.fromEntries(list.map((i) => [i.ingredientId, i]));
    expect(by['mustard-seeds']).toMatchObject({
      needQty: 35,
      packSize: 50,
      packCount: 1,
      reason: 'low',
    });
    expect(by.onion).toMatchObject({ needQty: 1200, packSize: 2000, reason: 'both' });
    expect(by.paneer).toMatchObject({
      needQty: 160,
      packSize: 200,
      buyText: '200 g',
      reason: 'plan',
    });
    expect(by.rice).toBeUndefined();
  });

  it('writes a cart message that tells Claude not to check out', () => {
    const list = buildRefillList({}, [{ ingredientId: 'mustard-oil', qty: 400 }]);
    const msg = cartMessage(list);
    expect(msg).toContain('Swiggy Instamart');
    expect(msg).toContain('do NOT check out');
    expect(msg).toContain('Mustard oil: 500 ml');
  });
});

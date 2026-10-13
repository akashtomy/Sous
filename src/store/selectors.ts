import { useMemo } from 'react';

import { recipeById } from '@/core/catalog';
import { expiringSoon } from '@/core/inventory';
import { buildPersona, type Persona } from '@/core/persona';
import { remainingShortfall, type PlanContext } from '@/core/planner';
import { buildRefillList } from '@/core/refill';

import { todayIso, useKitchen } from './kitchen';

/** Low-stock items, what the accepted weekly plan still needs, and items added by hand. */
export function useRefillList() {
  const inventory = useKitchen((s) => s.inventory);
  const plan = useKitchen((s) => s.plan);
  const ai = useKitchen((s) => s.aiRecipes);
  const extras = useKitchen((s) => s.shoppingExtras);
  return useMemo(
    () =>
      buildRefillList(inventory, [
        ...(plan ? remainingShortfall(plan, inventory, ai) : []),
        ...extras,
      ]),
    [inventory, plan, ai, extras],
  );
}

export function useExpiring() {
  const inventory = useKitchen((s) => s.inventory);
  return useMemo(() => expiringSoon(inventory, todayIso()), [inventory]);
}

/** Recently cooked recipe ids, newest first, for repeat avoidance. */
export function useRecent() {
  const history = useKitchen((s) => s.history);
  return useMemo(() => history.slice(0, 10).map((h) => h.recipeId), [history]);
}

/** Taste profile learned from cooking, ratings, swaps and eating out. */
export function usePersona(): Persona {
  const history = useKitchen((s) => s.history);
  const ratings = useKitchen((s) => s.ratings);
  const hidden = useKitchen((s) => s.hidden);
  const swappedAway = useKitchen((s) => s.swappedAway);
  const outside = useKitchen((s) => s.outside);
  const ai = useKitchen((s) => s.aiRecipes);
  return useMemo(
    () =>
      buildPersona({
        cooked: history.map((h) => ({ recipeId: h.recipeId, date: h.date, servings: h.servings })),
        ratings,
        hidden,
        swappedAway,
        outside,
        lookup: (id) => recipeById(id, ai),
        today: todayIso(),
      }),
    [history, ratings, hidden, swappedAway, outside, ai],
  );
}

/** Everything the planner needs besides preferences and stock. */
export function usePlanContext(date?: string): PlanContext {
  const recent = useRecent();
  const persona = usePersona();
  const ai = useKitchen((s) => s.aiRecipes);
  const seed = useKitchen((s) => s.seed);
  return useMemo(
    () => ({ today: todayIso(), date, recent, extra: ai, seed, persona }),
    [date, recent, ai, seed, persona],
  );
}

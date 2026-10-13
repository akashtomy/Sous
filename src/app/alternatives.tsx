import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';

import { COURSE_LABEL, MealCard } from '@/components/meal';
import { Button, Chip, ChipGroup, Empty, Screen, Section, T } from '@/components/ui';
import { recipeById } from '@/core/catalog';
import { addDays, dayLabel } from '@/core/dates';
import { suggest } from '@/core/planner';
import type { Course } from '@/core/types';
import { useKitchen } from '@/store/kitchen';
import { usePlanContext } from '@/store/selectors';
import { goBackOr } from '@/lib/nav';

/** Pick a different dish for one plan slot from several ranked alternatives. */
export default function Alternatives() {
  const { day: dayParam, course } = useLocalSearchParams<{ day: string; course: Course }>();
  const day = Number(dayParam);
  const plan = useKitchen((s) => s.plan);
  const inventory = useKitchen((s) => s.inventory);
  const ai = useKitchen((s) => s.aiRecipes);
  const setSlot = useKitchen((s) => s.setSlotRecipe);
  const [anyCuisine, setAnyCuisine] = useState(false);
  const date = plan ? addDays(plan.startDate, day) : undefined;
  const ctx = usePlanContext(date);
  const slot = plan?.days[day]?.find((s) => s.course === course);
  const current = slot ? recipeById(slot.recipeId, ai) : undefined;

  const options = useMemo(() => {
    if (!plan || !slot) return [];
    const planned = plan.days.flat().map((s) => s.recipeId);
    const prefs = anyCuisine ? { ...plan.prefs, cuisines: [] } : plan.prefs;
    return suggest(prefs, course, inventory, ctx, 8, planned);
  }, [plan, slot, course, inventory, ctx, anyCuisine]);

  if (!plan || !slot || !current || !date) {
    return (
      <Screen>
        <Empty
          icon="calendar-outline"
          title="Nothing to swap"
          body="This meal is no longer in your plan."
          action={<Button title="Back" onPress={() => goBackOr('/plan')} />}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: `${COURSE_LABEL[course]} · ${dayLabel(date)}` }} />
      <Section title="Planned now">
        <MealCard
          recipe={current}
          servings={slot.servings}
          onPress={() => router.push({ pathname: '/recipe/[id]', params: { id: current.id } })}
        />
      </Section>
      <Section title={`${options.length} alternatives`}>
        <ChipGroup>
          <Chip label="Plan cuisines" selected={!anyCuisine} onPress={() => setAnyCuisine(false)} />
          <Chip label="Any cuisine" selected={anyCuisine} onPress={() => setAnyCuisine(true)} />
        </ChipGroup>
        <T variant="small" color="textMuted">
          Ranked by what&apos;s in your kitchen, your tastes and the day&apos;s effort. Dishes
          already in this week are left out.
        </T>
        {options.map((s) => (
          <MealCard
            key={s.recipe.id}
            recipe={s.recipe}
            coverage={s.coverage}
            missing={s.missing}
            reason={s.reasons.slice(0, 2).join(' · ')}
            onPress={() => router.push({ pathname: '/recipe/[id]', params: { id: s.recipe.id } })}
            actions={
              <Button
                title="Use this instead"
                icon="checkmark"
                small
                onPress={() => {
                  setSlot(day, course, s.recipe.id);
                  goBackOr('/plan');
                }}
                accessibilityLabel={`Use ${s.recipe.name} instead`}
              />
            }
          />
        ))}
        {!options.length ? (
          <T color="textMuted">
            No other dishes fit this day&apos;s answers. Try “Any cuisine” or change your answers.
          </T>
        ) : null}
      </Section>
    </Screen>
  );
}

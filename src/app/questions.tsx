import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { IngredientSearch } from '@/components/ingredient-picker';
import { COURSE_LABEL, CUISINE_LABEL } from '@/components/meal';
import {
  Button,
  Chip,
  ChipGroup,
  Input,
  Screen,
  Section,
  Stepper,
  T,
  Toggle,
} from '@/components/ui';
import { ingredientById } from '@/core/catalog';
import { dayLabel } from '@/core/dates';
import {
  planWeek,
  weekStartDate,
  type MealMode,
  type Mood,
  type Preferences,
} from '@/core/planner';
import type { Course, Cuisine, Diet, Effort } from '@/core/types';
import { Spacing } from '@/constants/theme';
import { todayIso, useKitchen } from '@/store/kitchen';
import { usePlanContext } from '@/store/selectors';

const COURSES: Course[] = ['breakfast', 'lunch', 'dinner', 'dessert', 'snack'];
const CUISINES: Cuisine[] = ['indian', 'lebanese', 'chinese', 'continental', 'international'];
const DIETS: { v: Diet; label: string }[] = [
  { v: 'vegan', label: 'Vegan' },
  { v: 'veg', label: 'Vegetarian' },
  { v: 'egg', label: 'Veg + eggs' },
  { v: 'nonveg', label: 'Non-veg' },
];
const EFFORTS: { v: Effort; label: string }[] = [
  { v: 'quick', label: 'Quick (≤ 20 min)' },
  { v: 'moderate', label: 'Some effort (≤ 45 min)' },
  { v: 'elaborate', label: 'Happy to cook' },
];
const MOODS: { v: Mood; label: string }[] = [
  { v: 'any', label: 'Anything' },
  { v: 'light', label: 'Something light' },
  { v: 'comfort', label: 'Comfort food' },
  { v: 'high-protein', label: 'High protein' },
];
const MODES: { v: MealMode; label: string }[] = [
  { v: 'healthy', label: 'Healthy' },
  { v: 'balanced', label: 'Balanced' },
  { v: 'cheat', label: 'Cheat meal' },
];

export default function Questions() {
  const saved = useKitchen((s) => s.prefs);
  const setPrefs = useKitchen((s) => s.setPrefs);
  const inventory = useKitchen((s) => s.inventory);
  const setPlan = useKitchen((s) => s.setPlan);
  const ctx = usePlanContext();
  const [p, setP] = useState<Preferences>(saved);
  const [kcalText, setKcalText] = useState(p.kcalTarget ? String(p.kcalTarget) : '');
  const update = (x: Partial<Preferences>) => setP((cur) => ({ ...cur, ...x }));
  const toggle = <K,>(list: K[], v: K) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

  const submit = () => {
    const kcal = Number(kcalText);
    const prefs: Preferences = { ...p, kcalTarget: kcal > 0 ? kcal : undefined };
    setPrefs(prefs);
    if (prefs.scope === 'week') {
      setPlan(planWeek(prefs, inventory, ctx, 7, weekStartDate(prefs, todayIso())));
      router.replace('/plan');
    } else {
      router.replace('/');
    }
  };

  return (
    <Screen
      footer={
        <Button
          title={p.scope === 'week' ? 'Build my week' : 'Show suggestions'}
          icon="sparkles"
          onPress={submit}
          disabled={!p.meals.length}
          style={{ flex: 1 }}
        />
      }>
      <Section title="Plan for">
        <ChipGroup>
          <Chip
            label="Today"
            icon="sunny-outline"
            selected={p.scope === 'day'}
            onPress={() => update({ scope: 'day' })}
          />
          <Chip
            label="The whole week"
            icon="calendar-outline"
            selected={p.scope === 'week'}
            onPress={() => update({ scope: 'week' })}
          />
        </ChipGroup>
      </Section>

      <Section title="Which meals?">
        <ChipGroup>
          {COURSES.map((c) => (
            <Chip
              key={c}
              label={COURSE_LABEL[c]}
              selected={p.meals.includes(c)}
              onPress={() =>
                update({ meals: COURSES.filter((x) => toggle(p.meals, c).includes(x)) })
              }
            />
          ))}
        </ChipGroup>
      </Section>

      <Section title="How many people?">
        <Stepper value={p.people} onChange={(people) => update({ people })} label="people" />
      </Section>

      <Section title="Healthy or cheat meal?">
        <ChipGroup>
          {MODES.map((m) => (
            <Chip
              key={m.v}
              label={m.label}
              selected={p.mode === m.v}
              onPress={() => update({ mode: m.v })}
            />
          ))}
        </ChipGroup>
      </Section>

      <Section title="What do you feel like?">
        <ChipGroup>
          {MOODS.map((m) => (
            <Chip
              key={m.v}
              label={m.label}
              selected={p.mood === m.v}
              onPress={() => update({ mood: m.v })}
            />
          ))}
        </ChipGroup>
      </Section>

      <Section title="Cuisine">
        <ChipGroup>
          <Chip
            label="Surprise me"
            icon="shuffle"
            selected={!p.cuisines.length}
            onPress={() => update({ cuisines: [] })}
          />
          {CUISINES.map((c) => (
            <Chip
              key={c}
              label={CUISINE_LABEL[c]}
              selected={p.cuisines.includes(c)}
              onPress={() => update({ cuisines: toggle(p.cuisines, c) })}
            />
          ))}
        </ChipGroup>
      </Section>

      <Section title="Weekday cooking time">
        <ChipGroup>
          {EFFORTS.map((e) => (
            <Chip
              key={e.v}
              label={e.label}
              selected={p.maxEffort === e.v}
              onPress={() => update({ maxEffort: e.v })}
            />
          ))}
        </ChipGroup>
      </Section>

      <Section title="Weekend cooking time">
        <ChipGroup>
          {EFFORTS.map((e) => (
            <Chip
              key={e.v}
              label={e.label}
              selected={p.weekendEffort === e.v}
              onPress={() => update({ weekendEffort: e.v })}
            />
          ))}
        </ChipGroup>
      </Section>

      <Section title="Weekend meal prep">
        <Toggle
          label="Prep on the weekend for quick weekdays"
          hint="Cook dals, grind batter, make masala base and chop veg in one go. Weekday dishes then count their after-prep time."
          value={p.mealPrep}
          onChange={(mealPrep) => update({ mealPrep })}
        />
        {p.mealPrep ? (
          <>
            <ChipGroup>
              <Chip
                label="Prep on Saturday"
                selected={p.prepDay === 'saturday'}
                onPress={() => update({ prepDay: 'saturday' })}
              />
              <Chip
                label="Prep on Sunday"
                selected={p.prepDay === 'sunday'}
                onPress={() => update({ prepDay: 'sunday' })}
              />
            </ChipGroup>
            {p.scope === 'week' ? (
              <ChipGroup>
                <Chip
                  label={`Start week on prep day (${dayLabel(weekStartDate({ ...p, weekStart: 'prep-day' }, todayIso()))})`}
                  selected={p.weekStart === 'prep-day'}
                  onPress={() => update({ weekStart: 'prep-day' })}
                />
                <Chip
                  label="Start today"
                  selected={p.weekStart === 'today'}
                  onPress={() => update({ weekStart: 'today' })}
                />
              </ChipGroup>
            ) : null}
          </>
        ) : null}
      </Section>

      <Section title="Diet">
        <ChipGroup>
          {DIETS.map((d) => (
            <Chip
              key={d.v}
              label={d.label}
              selected={p.diet === d.v}
              onPress={() => update({ diet: d.v })}
            />
          ))}
        </ChipGroup>
      </Section>

      <Section title="Avoid (allergies or dislikes)">
        {p.avoid.length ? (
          <ChipGroup>
            {p.avoid.map((id) => (
              <Chip
                key={id}
                tone="danger"
                icon="close"
                label={ingredientById(id)?.name ?? id}
                onPress={() => update({ avoid: p.avoid.filter((x) => x !== id) })}
              />
            ))}
          </ChipGroup>
        ) : null}
        <IngredientSearch
          placeholder="Add an ingredient to avoid"
          exclude={p.avoid}
          onPick={(ing) => update({ avoid: [...p.avoid, ing.id] })}
        />
      </Section>

      <Section title="Daily calories per person (optional)">
        <Input
          value={kcalText}
          onChangeText={setKcalText}
          keyboardType="number-pad"
          placeholder="e.g. 1800"
          accessibilityLabel="Daily calorie target"
        />
        <T variant="small" color="textMuted">
          Used to pick portions that fit roughly 25 % breakfast, 35 % lunch, 30 % dinner.
        </T>
      </Section>

      <View style={{ marginTop: Spacing.lg }}>
        <Toggle
          label="Use up perishables first"
          hint="Prefer dishes with vegetables, herbs or dairy close to spoiling."
          value={p.usePerishables}
          onChange={(usePerishables) => update({ usePerishables })}
        />
      </View>
    </Screen>
  );
}

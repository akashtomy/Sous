import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { COURSE_LABEL, CUISINE_LABEL } from '@/components/meal';
import {
  Button,
  Card,
  Chip,
  ChipGroup,
  Input,
  Row,
  Screen,
  Section,
  Stepper,
  T,
  Toggle,
} from '@/components/ui';
import { recipeById, RECIPES } from '@/core/catalog';
import { addDays, dayLabel } from '@/core/dates';
import { RESTAURANT_FACTOR, searchPresets } from '@/core/eatout';
import type { Course, Cuisine } from '@/core/types';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { todayIso, useKitchen } from '@/store/kitchen';
import { goBackOr } from '@/lib/nav';

const COURSES: Course[] = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'];

function defaultCourse(): Course {
  const h = new Date().getHours();
  return h < 11 ? 'breakfast' : h < 16 ? 'lunch' : h < 18 ? 'snack' : 'dinner';
}

/** Log a meal eaten outside (restaurant, office canteen, takeaway, a friend's place). */
export default function EatOut() {
  const params = useLocalSearchParams<{ day?: string; course?: Course }>();
  const plan = useKitchen((s) => s.plan);
  const people = useKitchen((s) => s.prefs.people);
  const ai = useKitchen((s) => s.aiRecipes);
  const logOutside = useKitchen((s) => s.logOutside);
  const theme = useTheme();
  const today = todayIso();

  const fromPlanDate =
    plan && params.day !== undefined ? addDays(plan.startDate, Number(params.day)) : undefined;
  const [date, setDate] = useState(fromPlanDate ?? today);
  const [course, setCourse] = useState<Course>(params.course ?? defaultCourse());
  const [name, setName] = useState('');
  const [kcalText, setKcalText] = useState('');
  const [cuisine, setCuisine] = useState<Cuisine | undefined>();
  const [recipeId, setRecipeId] = useState<string | undefined>();
  const [count, setCount] = useState(people);
  const [place, setPlace] = useState('');
  const [costText, setCostText] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);

  // The planned meal this would replace, if the plan has one for that date and meal.
  const planDay = plan
    ? Math.round((Date.parse(date) - Date.parse(plan.startDate)) / 86_400_000)
    : -1;
  const slot =
    plan && planDay >= 0 && planDay < plan.days.length
      ? plan.days[planDay].find((s) => s.course === course && !s.cookedEntryId && !s.eatOutId)
      : undefined;
  const planned = slot ? recipeById(slot.recipeId, ai) : undefined;
  const [replace, setReplace] = useState(true);

  const suggestions = useMemo(() => {
    const q = name.trim().toLowerCase();
    if (q.length < 2) return [];
    const presets = searchPresets(q, 5).map((p) => ({
      key: `p:${p.name}`,
      name: p.name,
      kcal: p.kcal,
      cuisine: p.cuisine,
      recipeId: undefined as string | undefined,
    }));
    const dishes = RECIPES.filter((r) => r.name.toLowerCase().includes(q))
      .slice(0, 4)
      .map((r) => ({
        key: `r:${r.id}`,
        name: r.name,
        kcal: Math.round(r.nutrition.kcal * RESTAURANT_FACTOR),
        cuisine: r.cuisine,
        recipeId: r.id as string | undefined,
      }));
    return [...presets, ...dishes];
  }, [name]);

  const kcal = Number(kcalText);
  const cost = Number(costText);
  const valid = name.trim().length > 0 && kcal > 0;

  const save = () => {
    logOutside({
      date,
      course,
      name: name.trim(),
      kcal: Math.round(kcal),
      people: count,
      ...(place.trim() ? { place: place.trim() } : {}),
      ...(cost > 0 ? { cost } : {}),
      ...(cuisine ? { cuisine } : {}),
      ...(recipeId ? { recipeId } : {}),
      ...(slot && replace ? { replacedSlot: { day: planDay, course } } : {}),
    });
    goBackOr('/you');
  };

  return (
    <Screen
      footer={
        <Button
          title="Save"
          icon="checkmark"
          onPress={save}
          disabled={!valid}
          style={{ flex: 1 }}
        />
      }>
      <Stack.Screen options={{ title: 'Ate outside' }} />
      <T color="textMuted">
        Track meals from outside so calories, spend and your taste profile stay complete.
      </T>

      <Section title="When">
        <ChipGroup>
          <Chip label="Today" selected={date === today} onPress={() => setDate(today)} />
          <Chip
            label="Yesterday"
            selected={date === addDays(today, -1)}
            onPress={() => setDate(addDays(today, -1))}
          />
          {fromPlanDate && fromPlanDate !== today && fromPlanDate !== addDays(today, -1) ? (
            <Chip
              label={dayLabel(fromPlanDate)}
              selected={date === fromPlanDate}
              onPress={() => setDate(fromPlanDate)}
            />
          ) : null}
        </ChipGroup>
        <ChipGroup>
          {COURSES.map((c) => (
            <Chip
              key={c}
              label={COURSE_LABEL[c]}
              selected={course === c}
              onPress={() => setCourse(c)}
            />
          ))}
        </ChipGroup>
      </Section>

      <Section title="What did you have?">
        <Input
          value={name}
          onChangeText={(t) => {
            setName(t);
            setShowSuggestions(true);
            setRecipeId(undefined);
          }}
          placeholder="e.g. biryani, pizza, masala dosa"
          accessibilityLabel="Dish eaten outside"
        />
        {showSuggestions && suggestions.length ? (
          <View
            style={{
              borderWidth: 1,
              borderColor: theme.border,
              borderRadius: Radius.md,
              overflow: 'hidden',
            }}>
            {suggestions.map((s) => (
              <Pressable
                key={s.key}
                accessibilityRole="button"
                onPress={() => {
                  setName(s.name);
                  setKcalText(String(s.kcal));
                  setCuisine(s.cuisine);
                  setRecipeId(s.recipeId);
                  setShowSuggestions(false);
                }}
                style={({ pressed }) => ({
                  padding: Spacing.md,
                  backgroundColor: pressed ? theme.cardAlt : theme.card,
                })}>
                <T>{s.name}</T>
                <T variant="caption" color="textMuted">
                  ~{s.kcal} kcal per person · {CUISINE_LABEL[s.cuisine]}
                  {s.recipeId ? ' · restaurant-style estimate' : ''}
                </T>
              </Pressable>
            ))}
          </View>
        ) : null}
        <Row>
          <View style={{ flex: 1, gap: 4 }}>
            <T variant="caption" color="textMuted">
              Calories per person
            </T>
            <Input
              value={kcalText}
              onChangeText={setKcalText}
              keyboardType="number-pad"
              placeholder="kcal"
              accessibilityLabel="Calories per person"
            />
          </View>
          <View style={{ gap: 4 }}>
            <T variant="caption" color="textMuted">
              People
            </T>
            <Stepper value={count} onChange={setCount} label="people" />
          </View>
        </Row>
        <T variant="small" color="textMuted">
          Calorie numbers are rough estimates for a typical portion; edit if you know better.
        </T>
      </Section>

      <Section title="Where and how much (optional)">
        <Input
          value={place}
          onChangeText={setPlace}
          placeholder="Restaurant, canteen, delivery app…"
          accessibilityLabel="Place"
        />
        <Input
          value={costText}
          onChangeText={setCostText}
          keyboardType="decimal-pad"
          placeholder="Total spend (₹)"
          accessibilityLabel="Total spend in rupees"
        />
      </Section>

      {slot && planned ? (
        <Card>
          <Toggle
            label={`This replaces your planned ${planned.name}`}
            hint="Its ingredients come off the shopping list and stay in your kitchen."
            value={replace}
            onChange={setReplace}
          />
        </Card>
      ) : null}
    </Screen>
  );
}

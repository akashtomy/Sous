import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';

import { COURSE_LABEL, CUISINE_LABEL, MealCard } from '@/components/meal';
import { Chip, ChipGroup, Empty, Input, Row, T } from '@/components/ui';
import { ingredientById, RECIPES } from '@/core/catalog';
import { coverageOf } from '@/core/planner';
import type { Course, Cuisine, Diet, Recipe } from '@/core/types';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useKitchen } from '@/store/kitchen';
import { usePersona } from '@/store/selectors';

const CUISINES: Cuisine[] = ['indian', 'lebanese', 'chinese', 'continental', 'international'];
const COURSES: Course[] = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'];
const DIETS: { v: Diet; label: string }[] = [
  { v: 'vegan', label: 'Vegan' },
  { v: 'veg', label: 'Vegetarian' },
  { v: 'egg', label: 'Egg' },
  { v: 'nonveg', label: 'Non-veg' },
];
type Sort = 'match' | 'quick' | 'light' | 'az';
const SORTS: { v: Sort; label: string }[] = [
  { v: 'match', label: 'Best for my kitchen' },
  { v: 'quick', label: 'Quickest' },
  { v: 'light', label: 'Lightest' },
  { v: 'az', label: 'A–Z' },
];

// Searchable text per recipe: name, style, origin, tags and ingredient names/aliases.
const SEARCH_TEXT = new Map(
  RECIPES.map((r) => [
    r.id,
    [
      r.name,
      r.style,
      r.origin,
      r.region,
      ...r.tags,
      ...r.ingredients.flatMap((i) => {
        const ing = ingredientById(i.id);
        return ing ? [ing.name, ...ing.aliases] : [];
      }),
    ]
      .join(' ')
      .toLowerCase(),
  ]),
);

const toggle = <T,>(list: T[], v: T) =>
  list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

export default function RecipesScreen() {
  const inventory = useKitchen((s) => s.inventory);
  const people = useKitchen((s) => s.prefs.people);
  const ai = useKitchen((s) => s.aiRecipes);
  const persona = usePersona();
  const theme = useTheme();
  const [q, setQ] = useState('');
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [diets, setDiets] = useState<Diet[]>([]);
  const [quickOnly, setQuickOnly] = useState(false);
  const [healthyOnly, setHealthyOnly] = useState(false);
  const [canCook, setCanCook] = useState(false);
  const [lovedOnly, setLovedOnly] = useState(false);
  const [sort, setSort] = useState<Sort>('match');

  const coverage = useMemo(
    () =>
      new Map([...RECIPES, ...ai].map((r) => [r.id, coverageOf(r, people, inventory).coverage])),
    [inventory, people, ai],
  );

  const list = useMemo(() => {
    const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const all: Recipe[] = [...RECIPES, ...ai];
    const filtered = all.filter((r) => {
      if (words.length) {
        const text = SEARCH_TEXT.get(r.id) ?? r.name.toLowerCase();
        if (!words.every((w) => text.includes(w))) return false;
      }
      if (cuisines.length && !cuisines.includes(r.cuisine)) return false;
      if (courses.length && !r.course.some((c) => courses.includes(c))) return false;
      if (diets.length && !diets.includes(r.diet)) return false;
      if (quickOnly && r.effort !== 'quick') return false;
      if (healthyOnly && r.healthTier !== 'healthy') return false;
      if (canCook && (coverage.get(r.id) ?? 0) < 0.9) return false;
      if (lovedOnly && !persona.loved.includes(r.id)) return false;
      return true;
    });
    const by: Record<Sort, (a: Recipe, b: Recipe) => number> = {
      match: (a, b) =>
        (coverage.get(b.id) ?? 0) - (coverage.get(a.id) ?? 0) || a.totalMin - b.totalMin,
      quick: (a, b) => a.totalMin - b.totalMin,
      light: (a, b) => a.nutrition.kcal - b.nutrition.kcal,
      az: (a, b) => a.name.localeCompare(b.name),
    };
    return filtered.sort(by[sort]);
  }, [
    q,
    cuisines,
    courses,
    diets,
    quickOnly,
    healthyOnly,
    canCook,
    lovedOnly,
    sort,
    coverage,
    persona.loved,
    ai,
  ]);

  const header = (
    <View style={{ gap: Spacing.md, paddingTop: Spacing.lg, paddingBottom: Spacing.sm }}>
      <T variant="title">All recipes</T>
      <Input
        value={q}
        onChangeText={setQ}
        placeholder="Search dish or ingredient (e.g. paneer, ragi, hummus)"
        autoCorrect={false}
        accessibilityLabel="Search recipes"
      />
      <ChipGroup>
        {CUISINES.map((c) => (
          <Chip
            key={c}
            label={CUISINE_LABEL[c]}
            selected={cuisines.includes(c)}
            onPress={() => setCuisines(toggle(cuisines, c))}
          />
        ))}
      </ChipGroup>
      <ChipGroup>
        {COURSES.map((c) => (
          <Chip
            key={c}
            label={COURSE_LABEL[c]}
            selected={courses.includes(c)}
            onPress={() => setCourses(toggle(courses, c))}
          />
        ))}
      </ChipGroup>
      <ChipGroup>
        {DIETS.map((d) => (
          <Chip
            key={d.v}
            label={d.label}
            selected={diets.includes(d.v)}
            onPress={() => setDiets(toggle(diets, d.v))}
          />
        ))}
      </ChipGroup>
      <ChipGroup>
        <Chip
          icon="flash-outline"
          label="Quick (≤ 20 min)"
          selected={quickOnly}
          onPress={() => setQuickOnly(!quickOnly)}
        />
        <Chip
          icon="leaf-outline"
          label="Healthy"
          selected={healthyOnly}
          onPress={() => setHealthyOnly(!healthyOnly)}
        />
        <Chip
          icon="checkmark-circle-outline"
          label="Can cook now"
          selected={canCook}
          onPress={() => setCanCook(!canCook)}
        />
        {persona.loved.length ? (
          <Chip
            icon="heart-outline"
            label="Loved"
            selected={lovedOnly}
            onPress={() => setLovedOnly(!lovedOnly)}
          />
        ) : null}
      </ChipGroup>
      <Row style={{ flexWrap: 'wrap' }}>
        <T variant="small" color="textMuted">
          {list.length} of {RECIPES.length + ai.length} · sort:
        </T>
        {SORTS.map((s) => (
          <Chip key={s.v} label={s.label} selected={sort === s.v} onPress={() => setSort(s.v)} />
        ))}
      </Row>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <FlatList
        data={list}
        keyExtractor={(r) => r.id}
        ListHeaderComponent={header}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          width: '100%',
          maxWidth: MaxContentWidth,
          alignSelf: 'center',
          paddingHorizontal: Spacing.lg,
          paddingBottom: Spacing.xxl,
          gap: Spacing.md,
        }}
        initialNumToRender={8}
        renderItem={({ item }) => (
          <MealCard
            recipe={item}
            coverage={coverage.get(item.id)}
            reason={
              persona.loved.includes(item.id)
                ? 'You loved this'
                : persona.excluded.includes(item.id)
                  ? 'Marked “not for me”'
                  : undefined
            }
            onPress={() =>
              router.push({
                pathname: '/recipe/[id]',
                params: { id: item.id, servings: String(people) },
              })
            }
          />
        )}
        ListEmptyComponent={
          <Empty
            icon="search-outline"
            title="No recipes match"
            body="Try fewer filters or another word."
          />
        }
      />
    </View>
  );
}

import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Linking, View } from 'react-native';

import { COURSE_LABEL, CUISINE_LABEL, HealthBadge, MealCard } from '@/components/meal';
import {
  Banner,
  Button,
  Card,
  Chip,
  ChipGroup,
  Divider,
  Empty,
  Input,
  Row,
  Screen,
  Section,
  Stepper,
  T,
} from '@/components/ui';
import { ingredientById, recipeById, RECIPES } from '@/core/catalog';
import { addDays, dayName } from '@/core/dates';
import { scaledNeeds, stockOf, type Need } from '@/core/inventory';
import { prepKindsFor, prepSavedMinutes, prepTitle } from '@/core/mealprep';
import { classifyHealth, KCAL_LIMITS, scaleNutrition } from '@/core/nutrition';
import { coverageOf } from '@/core/planner';
import type { Course, Recipe } from '@/core/types';
import { formatQty } from '@/core/units';
import { normaliseYoutubeUrl, youtubeSearchUrl } from '@/core/youtube';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useKitchen } from '@/store/kitchen';
import { goBackOr } from '@/lib/nav';

const DIET_LABEL = {
  vegan: 'Vegan',
  veg: 'Vegetarian',
  egg: 'Contains egg',
  nonveg: 'Non-veg',
} as const;
const EFFORT_LABEL = {
  quick: 'Quick',
  moderate: 'Moderate effort',
  elaborate: 'Elaborate',
} as const;

export default function RecipeScreen() {
  const params = useLocalSearchParams<{
    id: string;
    servings?: string;
    day?: string;
    course?: string;
  }>();
  const ai = useKitchen((s) => s.aiRecipes);
  const inventory = useKitchen((s) => s.inventory);
  const defaultPeople = useKitchen((s) => s.prefs.people);
  const cook = useKitchen((s) => s.cook);
  const addToShopping = useKitchen((s) => s.addToShopping);
  const plan = useKitchen((s) => s.plan);
  const ratings = useKitchen((s) => s.ratings);
  const hidden = useKitchen((s) => s.hidden);
  const videoLinks = useKitchen((s) => s.videoLinks);
  const rate = useKitchen((s) => s.rate);
  const hideRecipe = useKitchen((s) => s.hideRecipe);
  const unhideRecipe = useKitchen((s) => s.unhideRecipe);
  const setVideo = useKitchen((s) => s.setVideo);
  const setSlotRecipe = useKitchen((s) => s.setSlotRecipe);
  const showToast = useKitchen((s) => s.showToast);
  const theme = useTheme();
  const recipe = recipeById(params.id, ai);
  const [servings, setServings] = useState(Number(params.servings) || defaultPeople);
  const [confirming, setConfirming] = useState(false);
  const [videoText, setVideoText] = useState('');
  const [editingVideo, setEditingVideo] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);

  const similar = useMemo(
    () => (recipe ? similarRecipes(recipe, inventory, defaultPeople) : []),
    [recipe, inventory, defaultPeople],
  );

  const needs = useMemo(() => (recipe ? scaledNeeds(recipe, servings) : []), [recipe, servings]);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [skipped, setSkipped] = useState<Record<string, boolean>>({});

  if (!recipe) {
    return (
      <Screen>
        <Empty
          icon="help-circle-outline"
          title="Recipe not found"
          body="It may have been an AI idea that was removed."
          action={<Button title="Go back" onPress={() => goBackOr('/')} />}
        />
      </Screen>
    );
  }

  const total = scaleNutrition(recipe.nutrition, servings);
  const short = needs.filter((n) => !n.optional && stockOf(inventory, n.ingredientId) < n.qty);
  const slot =
    params.day !== undefined && params.course
      ? { day: Number(params.day), course: params.course as Course }
      : undefined;

  const finalNeeds: Need[] = needs
    .filter((n) => !skipped[n.ingredientId] && inventory[n.ingredientId])
    .map((n) => {
      const t = overrides[n.ingredientId];
      if (t === undefined) return n;
      // Overrides are typed in the ingredient's base unit (g / ml / pc).
      const v = Number(t.replace(',', '.'));
      return { ...n, qty: Number.isFinite(v) && v >= 0 ? v : n.qty };
    });

  const doCook = () => {
    cook(recipe.id, servings, finalNeeds, { slot, course: slot?.course ?? recipe.course[0] });
    goBackOr('/');
  };

  const savedVideo = videoLinks[recipe.id];
  const rating = ratings[recipe.id];
  const isHidden = hidden.includes(recipe.id);
  const prepKinds = prepKindsFor(recipe);
  const prepSaves = prepSavedMinutes(recipe);
  // Plan slots this dish could go into (same meal type, not yet cooked or eaten out).
  const planSlots = plan
    ? plan.days.flatMap((d, di) =>
        d
          .filter(
            (x) =>
              recipe.course.includes(x.course) &&
              !x.cookedEntryId &&
              !x.eatOutId &&
              x.recipeId !== recipe.id,
          )
          .map((x) => ({
            day: di,
            course: x.course,
            date: addDays(plan.startDate, di),
            current: recipeById(x.recipeId, ai)?.name,
          })),
      )
    : [];

  const why = whyTier(recipe.nutrition, recipe.course[0], recipe.tags);

  return (
    <Screen
      footer={
        confirming ? (
          <>
            <Button
              title="Cancel"
              kind="secondary"
              onPress={() => setConfirming(false)}
              style={{ flex: 1 }}
            />
            <Button
              title={`Confirm & deduct ${finalNeeds.length}`}
              icon="checkmark-done"
              onPress={doCook}
              style={{ flex: 2 }}
            />
          </>
        ) : (
          <Button
            title="Cook this"
            icon="flame"
            onPress={() => setConfirming(true)}
            style={{ flex: 1 }}
          />
        )
      }>
      <Stack.Screen options={{ title: recipe.name }} />
      <View style={{ gap: 4 }}>
        <T variant="title">{recipe.name}</T>
        <T color="textMuted">
          {CUISINE_LABEL[recipe.cuisine]} · {recipe.style} · {recipe.origin}
        </T>
      </View>
      <ChipGroup>
        {recipe.course.map((c) => (
          <Chip key={c} label={COURSE_LABEL[c]} />
        ))}
        <Chip label={DIET_LABEL[recipe.diet]} />
        <Chip
          label={`${EFFORT_LABEL[recipe.effort]} · ${recipe.totalMin} min`}
          icon="time-outline"
        />
        {recipe.source === 'claude' ? (
          <Chip label="AI idea" icon="sparkles-outline" tone="accent" />
        ) : null}
      </ChipGroup>

      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <HealthBadge tier={recipe.healthTier} />
          <T variant="caption" color="textMuted">
            per serving
          </T>
        </Row>
        <Row style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Stat label="Calories" value={`${recipe.nutrition.kcal}`} unit="kcal" />
          <Stat label="Protein" value={`${recipe.nutrition.protein}`} unit="g" />
          <Stat label="Carbs" value={`${recipe.nutrition.carbs}`} unit="g" />
          <Stat label="Fat" value={`${recipe.nutrition.fat}`} unit="g" />
          <Stat label="Fibre" value={`${recipe.nutrition.fiber}`} unit="g" />
        </Row>
        <T variant="small" color="textMuted">
          {why}
        </T>
        <Divider />
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <T variant="label">Portion</T>
            <T variant="small" color="textMuted">
              {recipe.portion} per person
            </T>
          </View>
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <T variant="label">Servings</T>
            <T variant="small" color="textMuted">
              Total {total.kcal} kcal · prep {recipe.prepMin} min · cook {recipe.cookMin} min
            </T>
          </View>
          <Stepper value={servings} onChange={setServings} label="servings" />
        </Row>
        {recipe.advancePrep ? (
          <Banner
            icon="alarm-outline"
            tone="primary"
            title="Plan ahead"
            body={recipe.advancePrep}
          />
        ) : null}
        {prepKinds.length && prepSaves ? (
          <Banner
            icon="time-outline"
            tone="primary"
            title={`~${recipe.totalMin - prepSaves} min on a weekday with weekend prep`}
            body={`Prep ahead: ${prepKinds.map((k) => prepTitle(k).toLowerCase()).join('; ')}.`}
          />
        ) : null}
      </Card>

      <Card>
        <Row style={{ flexWrap: 'wrap' }}>
          <Button
            title={savedVideo ? 'Watch your video' : 'Watch on YouTube'}
            icon="logo-youtube"
            small
            onPress={() => Linking.openURL(savedVideo ?? youtubeSearchUrl(recipe))}
          />
          <Button
            title={savedVideo ? 'Change video' : 'Save the video you liked'}
            kind="ghost"
            small
            onPress={() => setEditingVideo(!editingVideo)}
          />
        </Row>
        {editingVideo ? (
          <Row>
            <Input
              value={videoText}
              onChangeText={setVideoText}
              placeholder="Paste a YouTube link"
              autoCapitalize="none"
              autoCorrect={false}
              style={{ flex: 1 }}
              accessibilityLabel="YouTube link for this recipe"
            />
            <Button
              title="Save"
              small
              disabled={!normaliseYoutubeUrl(videoText)}
              onPress={() => {
                setVideo(recipe.id, normaliseYoutubeUrl(videoText));
                setVideoText('');
                setEditingVideo(false);
                showToast('Video saved for this recipe');
              }}
            />
            {savedVideo ? (
              <Button
                title="Remove"
                kind="ghost"
                small
                onPress={() => {
                  setVideo(recipe.id, undefined);
                  setEditingVideo(false);
                }}
              />
            ) : null}
          </Row>
        ) : null}
        <Divider />
        <T variant="label">Your verdict</T>
        <ChipGroup>
          <Chip
            icon="heart"
            label="Loved it"
            selected={rating === 'love'}
            onPress={() => rate(recipe.id, rating === 'love' ? undefined : 'love')}
          />
          <Chip
            icon="thumbs-up-outline"
            label="It was OK"
            selected={rating === 'ok'}
            onPress={() => rate(recipe.id, rating === 'ok' ? undefined : 'ok')}
          />
          {isHidden ? (
            <Chip icon="refresh" label="Suggest again" onPress={() => unhideRecipe(recipe.id)} />
          ) : (
            <Chip
              icon="close-circle-outline"
              tone="danger"
              label="Not for me"
              onPress={() => hideRecipe(recipe.id)}
            />
          )}
        </ChipGroup>
        {plan ? (
          <>
            <Divider />
            <Row style={{ justifyContent: 'space-between' }}>
              <T variant="label">Add to your week plan</T>
              <Button
                title={planOpen ? 'Hide' : 'Choose a day'}
                kind="ghost"
                small
                onPress={() => setPlanOpen(!planOpen)}
              />
            </Row>
            {planOpen ? (
              planSlots.length ? (
                <ChipGroup>
                  {planSlots.map((p) => (
                    <Chip
                      key={`${p.day}-${p.course}`}
                      icon="calendar-outline"
                      label={`${dayName(p.date)} ${COURSE_LABEL[p.course].toLowerCase()}`}
                      accessibilityLabel={`Put on ${dayName(p.date, 'long')} ${p.course}, replacing ${p.current}`}
                      onPress={() => {
                        setSlotRecipe(p.day, p.course, recipe.id);
                        setPlanOpen(false);
                        showToast(`Added for ${dayName(p.date, 'long')} ${p.course}`);
                      }}
                    />
                  ))}
                </ChipGroup>
              ) : (
                <T variant="small" color="textMuted">
                  No open {recipe.course.map((c) => COURSE_LABEL[c].toLowerCase()).join('/')} slots
                  in your plan.
                </T>
              )
            ) : null}
          </>
        ) : null}
      </Card>

      {confirming ? (
        <Section title="Deduct from your kitchen">
          <T variant="small" color="textMuted">
            Adjust what you actually used, or untick items you didn’t use. Items you don’t stock are
            skipped.
          </T>
          {needs.map((n) => {
            const ing = ingredientById(n.ingredientId)!;
            const stocked = !!inventory[n.ingredientId];
            const off = skipped[n.ingredientId] || !stocked;
            return (
              <Row key={n.ingredientId} style={{ opacity: off ? 0.5 : 1 }}>
                <Chip
                  label=""
                  accessibilityLabel={`${off ? 'Include' : 'Skip'} ${ing.name}`}
                  icon={off ? 'square-outline' : 'checkbox'}
                  selected={!off}
                  onPress={
                    stocked
                      ? () => setSkipped((s) => ({ ...s, [n.ingredientId]: !s[n.ingredientId] }))
                      : undefined
                  }
                />
                <View style={{ flex: 1 }}>
                  <T>{ing.name}</T>
                  <T variant="caption" color="textMuted">
                    {stocked
                      ? `In stock: ${formatQty(ing, stockOf(inventory, n.ingredientId))}`
                      : 'Not in your kitchen'}
                  </T>
                </View>
                <Input
                  value={overrides[n.ingredientId] ?? String(n.qty)}
                  onChangeText={(t) => setOverrides((o) => ({ ...o, [n.ingredientId]: t }))}
                  keyboardType="decimal-pad"
                  editable={!off}
                  style={{ width: 84, textAlign: 'right' }}
                  accessibilityLabel={`${ing.name} amount used in ${ing.unit}`}
                />
                <T variant="caption" color="textMuted" style={{ width: 22 }}>
                  {ing.unit}
                </T>
              </Row>
            );
          })}
        </Section>
      ) : (
        <>
          <Section
            title="Ingredients"
            action={
              <T variant="caption" color="textMuted">
                for {servings}
              </T>
            }>
            {short.length ? (
              <Banner
                icon="cart-outline"
                tone="accent"
                title={`${short.length} to buy or top up`}
                body={short.map((n) => ingredientById(n.ingredientId)?.name).join(', ')}
                action={
                  <Button
                    title="Add to list"
                    small
                    kind="secondary"
                    onPress={() =>
                      addToShopping(
                        short.map((n) => ({
                          ingredientId: n.ingredientId,
                          qty: n.qty - stockOf(inventory, n.ingredientId),
                        })),
                      )
                    }
                  />
                }
              />
            ) : (
              <Banner icon="checkmark-circle-outline" tone="primary" title="You have everything" />
            )}
            <Card>
              {needs.map((n) => {
                const ing = ingredientById(n.ingredientId)!;
                const have = stockOf(inventory, n.ingredientId);
                const ok = have >= n.qty;
                return (
                  <Row key={n.ingredientId} style={{ justifyContent: 'space-between' }}>
                    <Row style={{ flex: 1 }}>
                      <Ionicons
                        name={
                          ok ? 'checkmark-circle' : n.optional ? 'ellipse-outline' : 'alert-circle'
                        }
                        size={18}
                        color={ok ? theme.primary : n.optional ? theme.textMuted : theme.accent}
                      />
                      <T style={{ flex: 1 }}>
                        {ing.name}
                        {n.optional ? (
                          <T variant="caption" color="textMuted">
                            {' '}
                            (optional)
                          </T>
                        ) : null}
                      </T>
                    </Row>
                    <T variant="label">{formatQty(ing, n.qty)}</T>
                  </Row>
                );
              })}
            </Card>
          </Section>
          <Section title="Method">
            {recipe.steps.map((s, i) => (
              <Row key={i} style={{ alignItems: 'flex-start' }} gap={Spacing.md}>
                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    backgroundColor: theme.primarySoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <T variant="caption" color="primary">
                    {i + 1}
                  </T>
                </View>
                <T style={{ flex: 1 }}>{s}</T>
              </Row>
            ))}
          </Section>
          {similar.length ? (
            <Section title="Similar dishes">
              {similar.map((r) => (
                <MealCard
                  key={r.id}
                  recipe={r}
                  onPress={() =>
                    router.push({
                      pathname: '/recipe/[id]',
                      params: { id: r.id, servings: String(servings) },
                    })
                  }
                />
              ))}
            </Section>
          ) : null}
        </>
      )}
    </Screen>
  );
}

/** Same meal type and diet, preferring the same style/cuisine and what's in stock. */
function similarRecipes(
  r: Recipe,
  inv: Parameters<typeof coverageOf>[2],
  people: number,
): Recipe[] {
  return RECIPES.filter((x) => x.id !== r.id && x.course[0] === r.course[0] && x.diet === r.diet)
    .map((x) => ({
      x,
      score:
        (x.style === r.style ? 2 : 0) +
        (x.cuisine === r.cuisine ? 1 : 0) +
        coverageOf(x, people, inv).coverage +
        (x.healthTier === r.healthTier ? 0.5 : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((s) => s.x);
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <View style={{ minWidth: 64, paddingVertical: 4 }}>
      <T variant="heading">
        {value}
        <T variant="caption" color="textMuted">
          {' '}
          {unit}
        </T>
      </T>
      <T variant="caption" color="textMuted">
        {label}
      </T>
    </View>
  );
}

function whyTier(n: Parameters<typeof classifyHealth>[0], course: Course, tags: string[]): string {
  const tier = classifyHealth(n, course, tags);
  const fatPct = Math.round(((n.fat * 9) / Math.max(n.kcal, 1)) * 100);
  const proteinPct = Math.round(((n.protein * 4) / Math.max(n.kcal, 1)) * 100);
  const parts = [
    `${fatPct}% of calories from fat`,
    `${proteinPct}% from protein`,
    `${n.fiber} g fibre`,
  ];
  if (n.addedSugar) parts.push(`${n.addedSugar} g added sugar`);
  const cap = KCAL_LIMITS[course];
  if (tags.includes('fried')) return `Treat: deep-fried. ${parts.join(', ')}.`;
  if (tier === 'healthy')
    return `Healthy: within ${cap.healthy} kcal for ${course}; ${parts.join(', ')}.`;
  if (tier === 'indulgent')
    return `Treat: ${parts.join(', ')} (over the limits for an everyday ${course}).`;
  return `Balanced: ${parts.join(', ')}.`;
}

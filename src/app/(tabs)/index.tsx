import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { COURSE_LABEL, CUISINE_LABEL, MealCard } from '@/components/meal';
import {
  Banner,
  Button,
  Card,
  Chip,
  ChipGroup,
  IconButton,
  Row,
  Screen,
  Section,
  T,
} from '@/components/ui';
import { ingredientById, recipeById } from '@/core/catalog';
import { ClaudeIdeasError, generateIdeas } from '@/core/claude';
import { addDays, isWeekend } from '@/core/dates';
import { daysBetween } from '@/core/inventory';
import { effortLimit, suggest } from '@/core/planner';
import type { Course } from '@/core/types';
import { getApiKey } from '@/lib/secrets';
import { todayIso, useKitchen } from '@/store/kitchen';
import { useExpiring, usePlanContext, useRefillList } from '@/store/selectors';

const MODE_LABEL = { healthy: 'Healthy', balanced: 'Balanced', cheat: 'Cheat meal' } as const;
const EFFORT_LABEL = {
  quick: 'Quick (≤ 20 min)',
  moderate: 'Up to 45 min',
  elaborate: 'Any effort',
} as const;

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export default function Today() {
  const prefs = useKitchen((s) => s.prefs);
  const inventory = useKitchen((s) => s.inventory);
  const shuffle = useKitchen((s) => s.shuffle);
  const history = useKitchen((s) => s.history);
  const ratings = useKitchen((s) => s.ratings);
  const rate = useKitchen((s) => s.rate);
  const ai = useKitchen((s) => s.aiRecipes);
  const plan = useKitchen((s) => s.plan);
  const settings = useKitchen((s) => s.settings);
  const saveAi = useKitchen((s) => s.saveAiRecipes);
  const refill = useRefillList();
  const expiring = useExpiring();
  const today = todayIso();
  const ctx = usePlanContext(today);
  const [expanded, setExpanded] = useState<Partial<Record<Course, boolean>>>({});
  const [aiBusy, setAiBusy] = useState<Course | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [lastAi, setLastAi] = useState<Partial<Record<Course, string[]>>>({});

  const byCourse = useMemo(
    () =>
      Object.fromEntries(
        prefs.meals.map((c) => [c, suggest(prefs, c, inventory, ctx, 6)]),
      ) as Record<Course, ReturnType<typeof suggest>>,
    [prefs, inventory, ctx],
  );
  // Ask about the last meal cooked today or yesterday that hasn't been rated.
  const toRate = history.find((h) => h.date >= addDays(today, -1) && !ratings[h.recipeId]);
  const toRateRecipe = toRate ? recipeById(toRate.recipeId, ai) : undefined;

  const planDay = plan ? daysBetween(plan.startDate, today) : -1;
  const todaysPlan =
    plan && planDay >= 0 && planDay < plan.days.length ? plan.days[planDay] : undefined;

  const open = (id: string, extra: Record<string, string> = {}) =>
    router.push({
      pathname: '/recipe/[id]',
      params: { id, servings: String(prefs.people), ...extra },
    });

  const askClaude = async (course: Course) => {
    setAiError(null);
    setAiBusy(course);
    try {
      const apiKey = await getApiKey();
      if (!apiKey) throw new ClaudeIdeasError('Add your Anthropic API key in Settings first.');
      const ideas = await generateIdeas({
        apiKey,
        model: settings.model,
        prefs,
        course,
        inventory,
      });
      saveAi(ideas);
      setLastAi((m) => ({ ...m, [course]: ideas.map((r) => r.id) }));
    } catch (e) {
      setAiError(e instanceof ClaudeIdeasError ? e.message : 'Something went wrong asking Claude.');
    } finally {
      setAiBusy(null);
    }
  };

  const summary = [
    `${prefs.people} ${prefs.people === 1 ? 'person' : 'people'}`,
    MODE_LABEL[prefs.mode],
    prefs.cuisines.length ? prefs.cuisines.map((c) => CUISINE_LABEL[c]).join(', ') : 'Any cuisine',
    `${isWeekend(today) ? 'Weekend' : 'Weekday'}: ${EFFORT_LABEL[effortLimit(prefs, today)]}${
      prefs.mealPrep && !isWeekend(today) ? ' with weekend prep' : ''
    }`,
  ].join(' · ');

  return (
    <Screen>
      <View style={{ gap: 2 }}>
        <T variant="title">{greeting()}</T>
        <T color="textMuted">Here’s what you can cook from your kitchen.</T>
      </View>

      <Card onPress={() => router.push('/questions')}>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <T variant="label">What would you like to eat?</T>
            <T variant="small" color="textMuted">
              {summary}
            </T>
          </View>
          <Chip label="Change" icon="options-outline" />
        </Row>
      </Card>

      {toRateRecipe ? (
        <Card>
          <T variant="label">How was the {toRateRecipe.name}?</T>
          <T variant="small" color="textMuted">
            Your answers shape what we suggest next.
          </T>
          <ChipGroup>
            <Chip icon="heart" label="Loved it" onPress={() => rate(toRateRecipe.id, 'love')} />
            <Chip
              icon="thumbs-up-outline"
              label="It was OK"
              onPress={() => rate(toRateRecipe.id, 'ok')}
            />
            <Chip
              icon="thumbs-down-outline"
              label="Not again"
              onPress={() => rate(toRateRecipe.id, 'dislike')}
            />
          </ChipGroup>
        </Card>
      ) : null}

      {refill.length ? (
        <Banner
          icon="cart-outline"
          tone="accent"
          title={`${refill.length} item${refill.length === 1 ? '' : 's'} to refill`}
          body={
            refill
              .slice(0, 4)
              .map((r) => r.name)
              .join(', ') + (refill.length > 4 ? '…' : '')
          }
          action={
            <Button title="View" small kind="secondary" onPress={() => router.push('/shopping')} />
          }
        />
      ) : null}
      {expiring.length ? (
        <Banner
          icon="hourglass-outline"
          tone="danger"
          title="Use soon"
          body={expiring
            .slice(0, 5)
            .map((i) => ingredientById(i.ingredientId)?.name)
            .join(', ')}
        />
      ) : null}
      {aiError ? (
        <Banner
          icon="alert-circle-outline"
          tone="danger"
          title="Claude ideas unavailable"
          body={aiError}
        />
      ) : null}

      {todaysPlan?.length ? (
        <Section
          title="From your week plan"
          action={
            <Button title="Open plan" kind="ghost" small onPress={() => router.push('/plan')} />
          }>
          {todaysPlan.map((slot) => {
            const r = recipeById(slot.recipeId, ai);
            if (!r) return null;
            return (
              <MealCard
                key={slot.course}
                recipe={r}
                servings={slot.servings}
                reason={`${COURSE_LABEL[slot.course]}${slot.cookedEntryId ? ' · cooked ✓' : ''}`}
                onPress={() =>
                  open(r.id, {
                    servings: String(slot.servings),
                    day: String(planDay),
                    course: slot.course,
                  })
                }
              />
            );
          })}
        </Section>
      ) : null}

      {prefs.meals.map((course) => {
        const aiIds = lastAi[course] ?? [];
        const list = (byCourse[course] ?? []).filter((s) => !aiIds.includes(s.recipe.id));
        const shown = expanded[course] ? list : list.slice(0, 3);
        const aiShown = aiIds.map((id) => ai.find((r) => r.id === id)).filter((r) => !!r);
        return (
          <Section
            key={course}
            title={COURSE_LABEL[course]}
            action={
              <IconButton
                icon="shuffle"
                label={`Shuffle ${course} suggestions`}
                onPress={shuffle}
                color="primary"
              />
            }>
            {shown.length ? (
              shown.map((s) => (
                <MealCard
                  key={s.recipe.id}
                  recipe={s.recipe}
                  coverage={s.coverage}
                  missing={s.missing}
                  reason={s.reasons.slice(0, 2).join(' · ')}
                  onPress={() => open(s.recipe.id)}
                />
              ))
            ) : (
              <T color="textMuted">
                Nothing matches these answers. Try more effort, another cuisine, or a different
                diet.
              </T>
            )}
            {aiShown.map((r) => (
              <MealCard
                key={r.id}
                recipe={r}
                reason="New idea from Claude"
                onPress={() => open(r.id)}
              />
            ))}
            <ChipGroup>
              {list.length > 3 ? (
                <Chip
                  label={expanded[course] ? 'Show fewer' : `Show ${list.length - 3} more`}
                  onPress={() => setExpanded((e) => ({ ...e, [course]: !e[course] }))}
                />
              ) : null}
              {settings.claudeEnabled ? (
                <Chip
                  label={aiBusy === course ? 'Asking Claude…' : 'More ideas with Claude'}
                  icon="sparkles-outline"
                  onPress={aiBusy ? undefined : () => askClaude(course)}
                />
              ) : null}
              <Chip
                label="Ate out"
                icon="storefront-outline"
                onPress={() => router.push({ pathname: '/eat-out', params: { course } })}
              />
            </ChipGroup>
          </Section>
        );
      })}
    </Screen>
  );
}

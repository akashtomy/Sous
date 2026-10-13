import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { KitchenTitle } from '@/components/kitchen-title';
import { COURSE_LABEL, MealCard } from '@/components/meal';
import { DIET_LABEL, EFFORT_LABEL, MODE_LABEL } from '@/components/pref-options';
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
  type IconName,
} from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { ingredientById, recipeById } from '@/core/catalog';
import { ClaudeIdeasError, generateIdeas } from '@/core/claude';
import { addDays, dayName, isWeekend } from '@/core/dates';
import { daysBetween } from '@/core/inventory';
import { isForTomorrow, mealsByTimeOfDay } from '@/core/meal-time';
import { effortLimit, suggest } from '@/core/planner';
import type { Course } from '@/core/types';
import { useTheme } from '@/hooks/use-theme';
import { getApiKey } from '@/lib/secrets';
import { todayIso, useKitchen } from '@/store/kitchen';
import { useExpiring, usePlanContext, useRefillList } from '@/store/selectors';

function greeting(hour: number) {
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
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
  const theme = useTheme();
  const refill = useRefillList();
  const expiring = useExpiring();
  const today = todayIso();
  const hour = new Date().getHours();
  const ctx = usePlanContext(today);
  const [expanded, setExpanded] = useState<Partial<Record<Course, boolean>>>({});
  const [aiBusy, setAiBusy] = useState<Course | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [lastAi, setLastAi] = useState<Partial<Record<Course, string[]>>>({});

  const meals = mealsByTimeOfDay(prefs.meals, hour);
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
  const planActive = !!plan && planDay >= 0 && planDay < plan.days.length;
  // A plan that starts on the coming prep day.
  const planUpcoming = !!plan && planDay < 0;
  const todaysPlan = planActive ? plan.days[planDay] : undefined;
  const planLeft = planActive
    ? plan.days.slice(planDay).flat().filter((s) => !s.cookedEntryId && !s.eatOutId).length
    : 0;

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

  const weekend = isWeekend(today);
  const summary = [
    `For ${prefs.people}`,
    DIET_LABEL[prefs.diet],
    MODE_LABEL[prefs.mode],
    `${weekend ? 'Weekend' : 'Weekday'}: ${EFFORT_LABEL[effortLimit(prefs, today)]}`,
  ].join(' · ');

  return (
    <Screen safeTop>
      <KitchenTitle title={greeting(hour)} />

      <Row gap={Spacing.sm}>
        <QuickAction
          icon="calendar-outline"
          label={planActive || planUpcoming ? 'Week plan' : 'Plan week'}
          href={
            planActive || planUpcoming
              ? '/plan'
              : { pathname: '/questions', params: { scope: 'week' } }
          }
        />
        <QuickAction icon="bag-add-outline" label="Groceries" href="/inventory" />
        <QuickAction
          icon="cart-outline"
          label="Shopping"
          href="/shopping"
          badge={refill.length || undefined}
        />
        <QuickAction icon="storefront-outline" label="Ate out" href="/eat-out" />
      </Row>

      {toRateRecipe ? (
        <Card>
          <T variant="label">How was the {toRateRecipe.name}?</T>
          <T variant="small" color="textMuted">
            Your answers shape what Sous suggests next.
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

      {todaysPlan?.length ? (
        <Section
          title="Today’s plan"
          action={
            <Button
              title={`${planLeft} left this week`}
              kind="ghost"
              small
              onPress={() => router.push('/plan')}
            />
          }>
          {todaysPlan.map((slot) => {
            const r = recipeById(slot.recipeId, ai);
            if (!r) return null;
            return (
              <MealCard
                key={slot.course}
                recipe={r}
                servings={slot.servings}
                reason={`${COURSE_LABEL[slot.course]}${
                  slot.cookedEntryId ? ' · cooked ✓' : slot.eatOutId ? ' · ate out' : ''
                }`}
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
      ) : planUpcoming ? (
        <Card onPress={() => router.push('/plan')}>
          <Row gap={Spacing.md}>
            <Ionicons name="calendar" size={28} color={theme.primary} />
            <View style={{ flex: 1, gap: 2 }}>
              <T variant="heading">Your week starts {dayName(plan.startDate, 'long')}</T>
              <T variant="small" color="textMuted">
                {plan.prefs.mealPrep
                  ? 'Your prep list and shopping list are ready.'
                  : 'Your shopping list is ready.'}{' '}
                Until then, pick from the ideas below.
              </T>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
          </Row>
        </Card>
      ) : (
        <Card>
          <Row gap={Spacing.md} style={{ alignItems: 'flex-start' }}>
            <Ionicons name="calendar" size={28} color={theme.primary} />
            <View style={{ flex: 1, gap: 2 }}>
              <T variant="heading">{plan ? 'Plan the next week' : 'Plan your week'}</T>
              <T variant="small" color="textMuted">
                Seven days of meals from what you have
                {prefs.mealPrep ? ', with a weekend prep list that makes weekdays quick' : ''}. Takes
                a minute.
              </T>
            </View>
          </Row>
          <Button
            title="Plan my week"
            icon="sparkles"
            onPress={() => router.push({ pathname: '/questions', params: { scope: 'week' } })}
          />
        </Card>
      )}

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

      <Card onPress={() => router.push({ pathname: '/questions', params: { scope: 'day' } })}>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <T variant="label">Ideas from your kitchen</T>
            <T variant="small" color="textMuted">
              {summary}
            </T>
          </View>
          <Chip label="Change" icon="options-outline" />
        </Row>
      </Card>

      {meals.map((course, i) => {
        const aiIds = lastAi[course] ?? [];
        const list = (byCourse[course] ?? []).filter((s) => !aiIds.includes(s.recipe.id));
        const shown = expanded[course] ? list : list.slice(0, i === 0 ? 3 : 2);
        const aiShown = aiIds.map((id) => ai.find((r) => r.id === id)).filter((r) => !!r);
        const tomorrow = isForTomorrow(course, hour);
        return (
          <Section
            key={course}
            title={`${i === 0 ? 'Next up: ' : ''}${COURSE_LABEL[course]}${tomorrow ? ' (tomorrow)' : ''}`}
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
                Nothing matches these answers. Try more time, another cuisine, or add groceries.
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
              {list.length > shown.length || expanded[course] ? (
                <Chip
                  label={expanded[course] ? 'Show fewer' : `Show ${list.length - shown.length} more`}
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

function QuickAction({
  icon,
  label,
  href,
  badge,
}: {
  icon: IconName;
  label: string;
  href: Href;
  badge?: number;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => router.push(href)}
      accessibilityRole="button"
      accessibilityLabel={badge ? `${label}, ${badge} items` : label}
      style={({ pressed }) => [
        {
          flex: 1,
          alignItems: 'center',
          gap: 6,
          paddingVertical: Spacing.md,
          borderRadius: Radius.lg,
          backgroundColor: theme.card,
          borderWidth: 1,
          borderColor: theme.border,
        },
        pressed && { opacity: 0.8 },
      ]}>
      <View>
        <Ionicons name={icon} size={24} color={theme.primary} />
        {badge ? (
          <View
            style={{
              position: 'absolute',
              top: -6,
              right: -12,
              minWidth: 18,
              height: 18,
              paddingHorizontal: 4,
              borderRadius: 9,
              backgroundColor: theme.accent,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <T variant="caption" style={{ color: theme.onPrimary, fontSize: 11, lineHeight: 14 }}>
              {badge > 99 ? '99+' : badge}
            </T>
          </View>
        ) : null}
      </View>
      <T variant="caption" numberOfLines={1}>
        {label}
      </T>
    </Pressable>
  );
}

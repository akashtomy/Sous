import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { COURSE_LABEL, HealthBadge } from '@/components/meal';
import { Banner, Button, Card, Chip, Empty, Row, Screen, Section, T } from '@/components/ui';
import { recipeById } from '@/core/catalog';
import { addDays, dayLabel, dayName, isWeekend } from '@/core/dates';
import { daysBetween } from '@/core/inventory';
import { buildPrepPlan } from '@/core/mealprep';
import { effectiveMinutes, planWeek, weekStartDate } from '@/core/planner';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { confirm } from '@/lib/confirm';
import { todayIso, useKitchen } from '@/store/kitchen';
import { usePlanContext, useRefillList } from '@/store/selectors';

const fmtHours = (min: number) =>
  min < 60 ? `${min} min` : `${Math.floor(min / 60)} h${min % 60 ? ` ${min % 60} min` : ''}`;

export default function PlanScreen() {
  const plan = useKitchen((s) => s.plan);
  const prefs = useKitchen((s) => s.prefs);
  const inventory = useKitchen((s) => s.inventory);
  const ai = useKitchen((s) => s.aiRecipes);
  const outside = useKitchen((s) => s.outside);
  const prepDone = useKitchen((s) => s.prepDone);
  const setPlan = useKitchen((s) => s.setPlan);
  const shuffle = useKitchen((s) => s.shuffle);
  const ctx = usePlanContext();
  const refill = useRefillList();
  const theme = useTheme();
  const today = todayIso();

  const prep = useMemo(
    () => (plan && plan.prefs.mealPrep ? buildPrepPlan(plan, plan.prefs.prepDay, ai) : undefined),
    [plan, ai],
  );

  if (!plan) {
    return (
      <Screen safeTop>
        <Empty
          icon="calendar-outline"
          title="No weekly plan yet"
          body="Quick weekday meals, relaxed weekends, and a Sunday prep list that does the slow work ahead. Answer a few questions to start."
          action={
            <Button
              title="Plan my week"
              icon="sparkles"
              onPress={() => router.push({ pathname: '/questions', params: { scope: 'week' } })}
            />
          }
        />
      </Screen>
    );
  }

  const regenerate = () => {
    shuffle();
    const p = { ...plan.prefs, people: prefs.people };
    setPlan(planWeek(p, inventory, { ...ctx, seed: ctx.seed! + 1 }, 7, weekStartDate(p, today)));
  };
  const todayIndex = daysBetween(plan.startDate, today);
  const slots = plan.days.flat();
  const cooked = slots.filter((s) => s.cookedEntryId).length;
  const eatenOut = slots.filter((s) => s.eatOutId).length;
  const prepLeft = prep ? prep.tasks.filter((t) => !prepDone.includes(t.id)).length : 0;

  return (
    <Screen safeTop>
      <View>
        <T variant="title">Your week</T>
        <T color="textMuted">
          {dayName(plan.startDate, 'long')} {plan.startDate.slice(8)} –{' '}
          {dayName(addDays(plan.startDate, 6), 'long')} {addDays(plan.startDate, 6).slice(8)} ·{' '}
          {plan.prefs.people} people · {cooked}/{slots.length} cooked
          {eatenOut ? ` · ${eatenOut} eaten out` : ''}
        </T>
      </View>
      <Row style={{ flexWrap: 'wrap' }}>
        <Button title="Shuffle week" icon="shuffle" kind="secondary" small onPress={regenerate} />
        <Button
          title="Change answers"
          icon="options-outline"
          kind="secondary"
          small
          onPress={() => router.push({ pathname: '/questions', params: { scope: 'week' } })}
        />
        <Button
          title="Clear"
          icon="trash-outline"
          kind="ghost"
          small
          onPress={() =>
            confirm('Clear the weekly plan?', 'Cooked meals stay deducted from your kitchen.', () =>
              setPlan(undefined),
            )
          }
        />
      </Row>

      {prep && prep.tasks.length ? (
        <Pressable onPress={() => router.push('/prep')} accessibilityRole="button">
          <Banner
            icon="time-outline"
            tone="primary"
            title={`${dayName(prep.prepDate, 'long')} prep: ${prep.tasks.length} tasks · ~${fmtHours(prep.totalActiveMin)}`}
            body={`Saves ~${fmtHours(prep.totalSavedMin)} across ${prep.mealsCovered} weekday meals.${
              prepLeft < prep.tasks.length ? ` ${prep.tasks.length - prepLeft} done.` : ''
            } Tap for the list.`}
            action={<Ionicons name="chevron-forward" size={20} color={theme.primary} />}
          />
        </Pressable>
      ) : null}

      {refill.length ? (
        <Banner
          icon="cart-outline"
          tone="accent"
          title={`Buy ${refill.length} item${refill.length === 1 ? '' : 's'} for this plan`}
          body="Includes anything already running low."
          action={
            <Button title="List" small kind="secondary" onPress={() => router.push('/shopping')} />
          }
        />
      ) : (
        <Banner
          icon="checkmark-circle-outline"
          tone="primary"
          title="Your kitchen covers the whole week"
        />
      )}

      {plan.days.map((day, di) => {
        const date = addDays(plan.startDate, di);
        const weekend = isWeekend(date);
        const isPrepDay = prep?.prepDate === date;
        return (
          <Section
            key={di}
            title={`${di === todayIndex ? 'Today · ' : ''}${dayLabel(date)}`}
            action={
              <Chip
                label={isPrepDay ? 'Prep day' : weekend ? 'Weekend' : 'Weekday · quick'}
                tone={isPrepDay ? 'accent' : 'primary'}
              />
            }>
            {day.map((slot) => {
              const r = recipeById(slot.recipeId, ai);
              if (!r) return null;
              const done = !!slot.cookedEntryId;
              const out = slot.eatOutId ? outside.find((o) => o.id === slot.eatOutId) : undefined;
              const onDay = effectiveMinutes(r, plan.prefs, date);
              const open = () =>
                router.push({
                  pathname: '/recipe/[id]',
                  params: {
                    id: r.id,
                    servings: String(slot.servings),
                    day: String(di),
                    course: slot.course,
                  },
                });
              return (
                <Card key={slot.course}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${COURSE_LABEL[slot.course]}: ${r.name}`}
                    onPress={open}
                    style={({ pressed }) => [{ gap: Spacing.sm }, pressed && { opacity: 0.8 }]}>
                    <Row style={{ justifyContent: 'space-between' }}>
                      <T variant="caption" color="textMuted">
                        {COURSE_LABEL[slot.course].toUpperCase()}
                      </T>
                      {done ? (
                        <Row gap={4}>
                          <Ionicons name="checkmark-circle" size={16} color={theme.primary} />
                          <T variant="caption" color="primary">
                            Cooked
                          </T>
                        </Row>
                      ) : out ? (
                        <Row gap={4}>
                          <Ionicons name="storefront-outline" size={16} color={theme.accent} />
                          <T variant="caption" color="accent">
                            Ate out
                          </T>
                        </Row>
                      ) : null}
                    </Row>
                    <T
                      variant="label"
                      style={
                        done || out
                          ? { textDecorationLine: 'line-through', opacity: 0.6 }
                          : undefined
                      }>
                      {r.name}
                    </T>
                    {out ? (
                      <T variant="small" color="textMuted">
                        Had {out.name}
                        {out.place ? ` at ${out.place}` : ''} instead
                      </T>
                    ) : null}
                    <Row gap={Spacing.md} style={{ flexWrap: 'wrap' }}>
                      <T variant="caption" color="textMuted">
                        {r.nutrition.kcal} kcal ·{' '}
                        {onDay < r.totalMin ? `${onDay} min after prep` : `${r.totalMin} min`} ·{' '}
                        {r.style}
                      </T>
                      <HealthBadge tier={r.healthTier} />
                    </Row>
                  </Pressable>
                  {!done && !out ? (
                    <Row style={{ flexWrap: 'wrap' }}>
                      <Chip
                        icon="swap-horizontal"
                        label="Alternatives"
                        onPress={() =>
                          router.push({
                            pathname: '/alternatives',
                            params: { day: String(di), course: slot.course },
                          })
                        }
                      />
                      <Chip
                        icon="storefront-outline"
                        label="Ate out"
                        onPress={() =>
                          router.push({
                            pathname: '/eat-out',
                            params: { day: String(di), course: slot.course },
                          })
                        }
                      />
                    </Row>
                  ) : null}
                </Card>
              );
            })}
          </Section>
        );
      })}
    </Screen>
  );
}

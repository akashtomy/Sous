import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { COURSE_LABEL } from '@/components/meal';
import { Banner, Button, Card, Chip, Empty, Row, Screen, T } from '@/components/ui';
import { ingredientById } from '@/core/catalog';
import { dayLabel, dayName } from '@/core/dates';
import { buildPrepPlan } from '@/core/mealprep';
import { formatQty } from '@/core/units';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useKitchen } from '@/store/kitchen';

const fmt = (min: number) =>
  min < 60 ? `${min} min` : `${Math.floor(min / 60)} h${min % 60 ? ` ${min % 60} min` : ''}`;

/** Weekend batch-prep checklist for the weekday meals in the plan. */
export default function PrepScreen() {
  const plan = useKitchen((s) => s.plan);
  const ai = useKitchen((s) => s.aiRecipes);
  const done = useKitchen((s) => s.prepDone);
  const toggle = useKitchen((s) => s.togglePrepDone);
  const theme = useTheme();
  const prep = useMemo(
    () => (plan ? buildPrepPlan(plan, plan.prefs.prepDay, ai) : undefined),
    [plan, ai],
  );

  if (!plan || !prep || !prep.tasks.length) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Weekend prep' }} />
        <Empty
          icon="time-outline"
          title="No prep needed"
          body="Prep covers the weekday meals that come after your prep day. Build a plan that starts on your prep day to get a list."
          action={<Button title="Plan my week" onPress={() => router.push('/questions')} />}
        />
      </Screen>
    );
  }

  const left = prep.tasks.filter((t) => !done.includes(t.id));
  return (
    <Screen>
      <Stack.Screen options={{ title: `${dayName(prep.prepDate, 'long')} prep` }} />
      <T variant="title">{dayLabel(prep.prepDate)}</T>
      <T color="textMuted">
        About {fmt(prep.totalActiveMin)} hands-on today saves ~{fmt(prep.totalSavedMin)} across{' '}
        {prep.mealsCovered} weekday meals. Do them in this order: soaking and slow jobs first.
      </T>
      <Banner
        icon={left.length ? 'list-outline' : 'checkmark-done-circle-outline'}
        tone={left.length ? 'accent' : 'primary'}
        title={
          left.length
            ? `${left.length} of ${prep.tasks.length} tasks left`
            : 'All prep done — enjoy the quick weekday dinners'
        }
        body="Prep doesn’t change your stock. Ingredients come off when you tap “Cook this” on the day."
      />

      {prep.tasks.map((t) => {
        const isDone = done.includes(t.id);
        return (
          <Card key={t.id} style={isDone ? { opacity: 0.6 } : undefined}>
            <Pressable
              onPress={() => toggle(t.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isDone }}
              accessibilityLabel={t.title}
              style={styles.head}>
              <Ionicons
                name={isDone ? 'checkbox' : 'square-outline'}
                size={24}
                color={isDone ? theme.primary : theme.textMuted}
              />
              <View style={{ flex: 1 }}>
                <T
                  variant="label"
                  style={isDone ? { textDecorationLine: 'line-through' } : undefined}>
                  {t.title}
                </T>
                <T variant="caption" color="textMuted">
                  ~{t.activeMin} min · saves {t.savedMin} min · {t.storage}
                </T>
              </View>
            </Pressable>
            <Row style={{ flexWrap: 'wrap' }} gap={6}>
              {t.items.map((i) => {
                const ing = ingredientById(i.ingredientId);
                return ing ? (
                  <Chip key={i.ingredientId} label={`${ing.name} ${formatQty(ing, i.qty)}`} />
                ) : null;
              })}
            </Row>
            <T variant="small" color="textMuted">
              {t.how}
            </T>
            <View style={{ gap: 2 }}>
              {t.meals.map((m) => (
                <Pressable
                  key={`${m.day}-${m.course}`}
                  onPress={() =>
                    router.push({ pathname: '/recipe/[id]', params: { id: m.recipeId } })
                  }
                  accessibilityRole="link">
                  <T variant="small">
                    → {dayName(m.date)} {COURSE_LABEL[m.course].toLowerCase()}: {m.recipeName}
                    {m.freeze ? ' (freeze this portion)' : ''}
                  </T>
                </Pressable>
              ))}
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
});

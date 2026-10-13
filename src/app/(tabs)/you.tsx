import { router } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { COURSE_LABEL, CUISINE_LABEL } from '@/components/meal';
import {
  Banner,
  Button,
  Card,
  Chip,
  ChipGroup,
  Divider,
  IconButton,
  Meter,
  Row,
  Screen,
  Section,
  T,
} from '@/components/ui';
import { ingredientById, recipeById } from '@/core/catalog';
import { dayName } from '@/core/dates';
import type { Rating } from '@/core/persona';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/store/auth';
import { todayIso, useKitchen } from '@/store/kitchen';
import { useKitchenName } from '@/store/kitchen-name';
import { usePersona } from '@/store/selectors';

const RATING_LABEL: {
  v: Rating;
  label: string;
  icon: 'heart' | 'thumbs-up-outline' | 'thumbs-down-outline';
}[] = [
  { v: 'love', label: 'Loved it', icon: 'heart' },
  { v: 'ok', label: 'It was OK', icon: 'thumbs-up-outline' },
  { v: 'dislike', label: 'Not again', icon: 'thumbs-down-outline' },
];

type Entry =
  | { kind: 'home'; id: string; date: string; recipeId: string; name: string; course?: string }
  | {
      kind: 'out';
      id: string;
      date: string;
      name: string;
      course: string;
      place?: string;
      cost?: number;
      kcal: number;
    };

export default function YouScreen() {
  const persona = usePersona();
  const household = useAuth((s) => s.household);
  const members = useAuth((s) => s.members);
  const pendingSync = useKitchen((s) => s.pendingOps.length);
  const syncError = useKitchen((s) => s.syncError);
  const history = useKitchen((s) => s.history);
  const outside = useKitchen((s) => s.outside);
  const ratings = useKitchen((s) => s.ratings);
  const hidden = useKitchen((s) => s.hidden);
  const ai = useKitchen((s) => s.aiRecipes);
  const avoid = useKitchen((s) => s.prefs.avoid);
  const rate = useKitchen((s) => s.rate);
  const unhide = useKitchen((s) => s.unhideRecipe);
  const removeOutside = useKitchen((s) => s.removeOutside);
  const setPrefs = useKitchen((s) => s.setPrefs);
  const today = todayIso();
  const kitchenName = useKitchenName();

  const recent: Entry[] = useMemo(() => {
    const home: Entry[] = history.map((h) => ({
      kind: 'home',
      id: h.id,
      date: h.date,
      recipeId: h.recipeId,
      name: recipeById(h.recipeId, ai)?.name ?? 'Removed recipe',
      course: h.course,
    }));
    const out: Entry[] = outside.map((o) => ({ kind: 'out', ...o }));
    return [...home, ...out].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 15);
  }, [history, outside, ai]);

  const w = persona.thisWeek;
  const unrated = [...new Set(history.map((h) => h.recipeId))]
    .filter((id) => !ratings[id])
    .slice(0, 5);

  return (
    <Screen safeTop>
      <Row style={{ justifyContent: 'space-between' }}>
        <T variant="title">You</T>
        <IconButton
          icon="settings-outline"
          label="Settings"
          onPress={() => router.push('/settings')}
        />
      </Row>
      {household ? (
        <Card onPress={() => router.push('/household')}>
          <Row style={{ justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <T variant="label">{household.name}</T>
              <T variant="small" color="textMuted">
                {members.length > 1
                  ? `Shared with ${members
                      .filter((m) => !m.isMe)
                      .map((m) => m.displayName)
                      .join(', ')}`
                  : 'Just you so far — invite your partner'}
                {syncError ? ' · offline' : pendingSync ? ` · ${pendingSync} to sync` : ' · synced'}
              </T>
            </View>
            <Chip label={members.length > 1 ? 'Manage' : 'Invite'} icon="people-outline" />
          </Row>
        </Card>
      ) : (
        <Card onPress={() => router.push('/kitchen-name')}>
          <Row style={{ justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <T variant="label">{kitchenName}</T>
              <T variant="small" color="textMuted">
                Saved on this device only
              </T>
            </View>
            <Chip label="Rename" icon="pencil" />
          </Row>
        </Card>
      )}
      {!persona.enoughData ? (
        <Banner
          icon="sparkles-outline"
          tone="primary"
          title="Learning what you like"
          body="Cook a few meals and rate them. Suggestions then lean towards your favourites and away from what you skip."
        />
      ) : persona.labels.length ? (
        <ChipGroup>
          {persona.labels.map((l) => (
            <Chip key={l} label={l} tone="primary" />
          ))}
        </ChipGroup>
      ) : null}

      <Card>
        <T variant="label">Last 7 days</T>
        <Row style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Stat value={w.home} label="Cooked at home" />
          <Stat value={w.out} label="Eaten out" />
          <Stat value={w.spend ? `₹${Math.round(w.spend)}` : '—'} label="Spent outside" />
          <Stat value={w.kcalPerPersonPerDay || '—'} label="kcal / person / day" />
        </Row>
        <Row style={{ flexWrap: 'wrap' }}>
          <Button
            title="Log a meal from outside"
            icon="storefront-outline"
            kind="secondary"
            small
            onPress={() => router.push('/eat-out')}
          />
        </Row>
      </Card>

      {unrated.length ? (
        <Section title="How were these?">
          {unrated.map((id) => {
            const r = recipeById(id, ai);
            if (!r) return null;
            return (
              <Card key={id}>
                <T
                  variant="label"
                  onPress={() => router.push({ pathname: '/recipe/[id]', params: { id } })}>
                  {r.name}
                </T>
                <ChipGroup>
                  {RATING_LABEL.map((x) => (
                    <Chip key={x.v} icon={x.icon} label={x.label} onPress={() => rate(id, x.v)} />
                  ))}
                </ChipGroup>
              </Card>
            );
          })}
        </Section>
      ) : null}

      {persona.enoughData ? (
        <Section title="What you like">
          <Card>
            {persona.topStyles.map((s) => (
              <View key={s.style} style={{ gap: 4 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <T variant="small">{s.style}</T>
                  <T variant="caption" color="textMuted">
                    {Math.round(s.share * 100)}%
                  </T>
                </Row>
                <Meter value={s.share} />
              </View>
            ))}
            {persona.topCuisines.length ? (
              <T variant="small" color="textMuted">
                Cuisines:{' '}
                {persona.topCuisines
                  .map((c) => `${CUISINE_LABEL[c.cuisine]} ${Math.round(c.share * 100)}%`)
                  .join(' · ')}
              </T>
            ) : null}
            <T variant="small" color="textMuted">
              Typical cook time {persona.avgCookMin} min · {Math.round(persona.healthyShare * 100)}%
              healthy picks · ~{persona.avgKcal} kcal a meal
            </T>
            {persona.likedIngredients.length ? (
              <>
                <Divider />
                <T variant="label">Ingredients you cook with most</T>
                <ChipGroup>
                  {persona.likedIngredients.map((id) => (
                    <Chip key={id} label={ingredientById(id)?.name ?? id} />
                  ))}
                </ChipGroup>
              </>
            ) : null}
            {persona.loved.length ? (
              <>
                <Divider />
                <T variant="label">Favourites</T>
                <ChipGroup>
                  {persona.loved.map((id) => (
                    <Chip
                      key={id}
                      icon="heart"
                      label={recipeById(id, ai)?.name ?? id}
                      onPress={() => router.push({ pathname: '/recipe/[id]', params: { id } })}
                    />
                  ))}
                </ChipGroup>
              </>
            ) : null}
          </Card>
        </Section>
      ) : null}

      {persona.excluded.length || persona.dislikedIngredients.length ? (
        <Section title="What you skip">
          <Card>
            {persona.excluded.length ? (
              <>
                <T variant="small" color="textMuted">
                  Never suggested. Tap to bring one back.
                </T>
                <ChipGroup>
                  {persona.excluded.map((id) => (
                    <Chip
                      key={id}
                      icon="close"
                      tone="danger"
                      label={recipeById(id, ai)?.name ?? id}
                      onPress={() => {
                        if (hidden.includes(id)) unhide(id);
                        if (ratings[id] === 'dislike') rate(id, undefined);
                      }}
                    />
                  ))}
                </ChipGroup>
              </>
            ) : null}
            {persona.dislikedIngredients.length ? (
              <>
                <Divider />
                <T variant="label">Looks like you don&apos;t enjoy</T>
                <T variant="small" color="textMuted">
                  These show up in several dishes you skipped. Dishes with them are already ranked
                  lower; tap to avoid them completely.
                </T>
                <ChipGroup>
                  {persona.dislikedIngredients.map((id) => (
                    <Chip
                      key={id}
                      label={`${ingredientById(id)?.name ?? id}${avoid.includes(id) ? ' · avoided' : ''}`}
                      selected={avoid.includes(id)}
                      onPress={() =>
                        setPrefs({
                          avoid: avoid.includes(id)
                            ? avoid.filter((a) => a !== id)
                            : [...avoid, id],
                        })
                      }
                    />
                  ))}
                </ChipGroup>
              </>
            ) : null}
          </Card>
        </Section>
      ) : null}

      <Section title="Recent meals">
        {recent.length ? (
          <Card style={{ gap: Spacing.xs }}>
            {recent.map((e, i) => (
              <View key={`${e.kind}-${e.id}`} style={{ gap: Spacing.xs }}>
                {i > 0 ? <Divider /> : null}
                <Row style={{ justifyContent: 'space-between' }}>
                  <View style={{ flex: 1 }}>
                    <T variant="small">
                      {e.kind === 'out' ? '🍽 ' : '🏠 '}
                      {e.name}
                      {e.kind === 'home' && ratings[e.recipeId] === 'love' ? ' ♥' : ''}
                    </T>
                    <T variant="caption" color="textMuted">
                      {e.date === today ? 'Today' : dayName(e.date, 'long')}
                      {e.course
                        ? ` · ${COURSE_LABEL[e.course as keyof typeof COURSE_LABEL] ?? e.course}`
                        : ''}
                      {e.kind === 'out'
                        ? ` · ${e.place ? `${e.place} · ` : ''}${e.kcal} kcal${e.cost ? ` · ₹${e.cost}` : ''}`
                        : ''}
                    </T>
                  </View>
                  {e.kind === 'out' ? (
                    <IconButton
                      icon="trash-outline"
                      label={`Delete ${e.name}`}
                      onPress={() => removeOutside(e.id)}
                      color="textMuted"
                    />
                  ) : null}
                </Row>
              </View>
            ))}
          </Card>
        ) : (
          <T color="textMuted">
            Nothing yet. Cook something from Today or log a meal from outside.
          </T>
        )}
      </Section>
    </Screen>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <View style={{ minWidth: 72, paddingVertical: 4 }}>
      <T variant="heading">{value}</T>
      <T variant="caption" color="textMuted">
        {label}
      </T>
    </View>
  );
}

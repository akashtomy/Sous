import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { IngredientSearch } from '@/components/ingredient-picker';
import {
  Banner,
  Button,
  Card,
  Chip,
  ChipGroup,
  Input,
  Row,
  Screen,
  Section,
  T,
} from '@/components/ui';
import { ingredientById } from '@/core/catalog';
import type { Inventory } from '@/core/types';
import { defaultInputUnit, formatQty, toBase } from '@/core/units';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { todayIso, useKitchen } from '@/store/kitchen';
import { INDIAN_STARTER, ONBOARDING_PICKS } from '@/store/presets';

/** One-time setup: tick what you have and adjust quantities. */
export default function Onboarding() {
  const existing = useKitchen((s) => s.inventory);
  const complete = useKitchen((s) => s.completeOnboarding);
  const [qty, setQty] = useState<Record<string, number>>(() =>
    Object.fromEntries(Object.values(existing).map((i) => [i.ingredientId, i.qty])),
  );
  const [extra, setExtra] = useState<string[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const count = Object.values(qty).filter((n) => n > 0).length;

  const sections = useMemo(() => {
    const listed = new Set(ONBOARDING_PICKS.flatMap((s) => s.ids));
    const others = [...new Set([...extra, ...Object.keys(qty)])].filter((id) => !listed.has(id));
    return others.length
      ? [...ONBOARDING_PICKS, { title: 'Also in your kitchen', ids: others }]
      : ONBOARDING_PICKS;
  }, [extra, qty]);

  const finish = () => {
    const today = todayIso();
    const inv: Inventory = {};
    for (const [id, n] of Object.entries(qty))
      if (n > 0) inv[id] = { ingredientId: id, qty: n, addedOn: today };
    complete(inv);
    router.replace('/');
  };

  return (
    <Screen
      footer={
        <>
          <Button
            title={count ? `Save ${count} items` : 'Skip for now'}
            icon="checkmark"
            onPress={finish}
            style={{ flex: 1 }}
          />
        </>
      }>
      <T variant="title">What’s in your kitchen?</T>
      <T color="textMuted">
        Add everything once. After that the app deducts what you cook and you only add new purchases
        (online or offline).
      </T>
      <Banner
        icon="sparkles-outline"
        tone="primary"
        title="Start from a typical Indian kitchen"
        body="Fills common staples, dals, spices and vegetables with usual quantities. Untick or edit anything."
        action={
          <Button title="Use" small onPress={() => setQty((q) => ({ ...INDIAN_STARTER, ...q }))} />
        }
      />

      <Section title="Add anything else">
        <IngredientSearch
          onPick={(ing) => {
            setExtra((e) => (e.includes(ing.id) ? e : [...e, ing.id]));
            setEditing(ing.id);
          }}
        />
      </Section>

      {sections.map((sec) => (
        <Section key={sec.title} title={sec.title}>
          <ChipGroup>
            {sec.ids.map((id) => {
              const ing = ingredientById(id);
              if (!ing) return null;
              const have = (qty[id] ?? 0) > 0;
              return (
                <Chip
                  key={id}
                  label={have ? `${ing.name} · ${formatQty(ing, qty[id])}` : ing.name}
                  selected={have}
                  icon={have ? 'checkmark' : 'add'}
                  onPress={() => {
                    if (have) setEditing(id);
                    else {
                      setQty((q) => ({ ...q, [id]: INDIAN_STARTER[id] ?? ing.packSizes[0] }));
                      setEditing(id);
                    }
                  }}
                />
              );
            })}
          </ChipGroup>
          {editing && sec.ids.includes(editing) ? (
            <QuickEdit
              id={editing}
              value={qty[editing] ?? 0}
              onChange={(n) => setQty((q) => ({ ...q, [editing]: n }))}
              onDone={() => setEditing(null)}
            />
          ) : null}
        </Section>
      ))}
      <View style={{ height: Spacing.xl }} />
    </Screen>
  );
}

function QuickEdit({
  id,
  value,
  onChange,
  onDone,
}: {
  id: string;
  value: number;
  onChange: (n: number) => void;
  onDone: () => void;
}) {
  const ing = ingredientById(id)!;
  const theme = useTheme();
  const unit = defaultInputUnit(ing);
  const factor = toBase(ing, 1, unit);
  const [text, setText] = useState(value ? String(Math.round((value / factor) * 100) / 100) : '');
  const commit = (t: string) => {
    setText(t);
    const n = Number(t.replace(',', '.'));
    if (Number.isFinite(n)) onChange(Math.max(0, n * factor));
  };
  return (
    <Card style={{ backgroundColor: theme.cardAlt }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <T variant="label">{ing.name}</T>
        <Pressable onPress={onDone} accessibilityRole="button" hitSlop={8}>
          <T variant="label" color="primary">
            Done
          </T>
        </Pressable>
      </Row>
      <Row>
        <Input
          value={text}
          onChangeText={commit}
          keyboardType="decimal-pad"
          style={{ flex: 1 }}
          accessibilityLabel={`${ing.name} quantity in ${unit}`}
          autoFocus
        />
        <View
          style={{
            paddingHorizontal: Spacing.md,
            paddingVertical: 12,
            borderRadius: Radius.md,
            backgroundColor: theme.card,
          }}>
          <T variant="label">{unit}</T>
        </View>
      </Row>
      <Row style={{ flexWrap: 'wrap' }}>
        {ing.packSizes.map((p) => (
          <Chip
            key={p}
            label={formatQty(ing, p)}
            onPress={() => commit(String(Math.round((p / factor) * 100) / 100))}
          />
        ))}
        <Chip
          label="Remove"
          tone="danger"
          icon="close"
          onPress={() => {
            onChange(0);
            onDone();
          }}
        />
      </Row>
    </Card>
  );
}

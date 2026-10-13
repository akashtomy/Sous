import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { IngredientSearch, QuantityForm } from '@/components/ingredient-picker';
import { KitchenTitle } from '@/components/kitchen-title';
import { CATEGORY_LABEL } from '@/components/meal';
import {
  Banner,
  Button,
  Card,
  Chip,
  ChipGroup,
  Empty,
  Row,
  Screen,
  Section,
  T,
} from '@/components/ui';
import { ingredientById } from '@/core/catalog';
import { freshnessLeft, isLow } from '@/core/inventory';
import type { Ingredient, IngredientCategory } from '@/core/types';
import { formatQty } from '@/core/units';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { todayIso, useKitchen } from '@/store/kitchen';
import { useRefillList } from '@/store/selectors';

const ORDER: IngredientCategory[] = [
  'vegetable',
  'fruit',
  'herb',
  'dairy',
  'protein',
  'grain',
  'bakery',
  'pulse',
  'oil',
  'nut',
  'spice',
  'condiment',
];

type Filter = 'all' | 'low' | 'soon';

export default function InventoryScreen() {
  const inventory = useKitchen((s) => s.inventory);
  const addStock = useKitchen((s) => s.addStock);
  const [adding, setAdding] = useState<Ingredient | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const theme = useTheme();
  const today = todayIso();
  const refill = useRefillList();

  const items = Object.values(inventory);
  const lowCount = items.filter(isLow).length;
  const soonCount = items.filter((i) => (freshnessLeft(i, today) ?? 99) <= 1).length;

  const groups = useMemo(() => {
    const shown = items.filter((i) =>
      filter === 'low' ? isLow(i) : filter === 'soon' ? (freshnessLeft(i, today) ?? 99) <= 1 : true,
    );
    const map = new Map<IngredientCategory, typeof shown>();
    for (const i of shown) {
      const ing = ingredientById(i.ingredientId);
      if (!ing) continue;
      map.set(ing.category, [...(map.get(ing.category) ?? []), i]);
    }
    return ORDER.filter((c) => map.has(c)).map((c) => ({
      category: c,
      items: map
        .get(c)!
        .sort((a, b) =>
          (ingredientById(a.ingredientId)?.name ?? '').localeCompare(
            ingredientById(b.ingredientId)?.name ?? '',
          ),
        ),
    }));
  }, [items, filter, today]);

  return (
    <Screen safeTop>
      <KitchenTitle
        title="Pantry"
        subtitle={`${items.length} item${items.length === 1 ? '' : 's'} · cooking deducts automatically`}
      />

      <Card>
        <T variant="label">Bought groceries?</T>
        {adding ? (
          <QuantityForm
            ingredient={adding}
            submitLabel={inventory[adding.id] ? 'Add to stock' : 'Add to kitchen'}
            onSubmit={(qty) => {
              addStock(adding.id, qty);
              setAdding(null);
            }}
            onCancel={() => setAdding(null)}
          />
        ) : (
          <>
            <IngredientSearch onPick={setAdding} placeholder="Add one item (e.g. paneer, jeera)" />
            <Button
              title="Update many items at once"
              icon="list-outline"
              kind="secondary"
              small
              onPress={() => router.push({ pathname: '/onboarding', params: { mode: 'pantry' } })}
            />
          </>
        )}
      </Card>

      {refill.length ? (
        <Banner
          icon="cart-outline"
          tone="accent"
          title={`Shopping list · ${refill.length} item${refill.length === 1 ? '' : 's'}`}
          body={
            refill
              .slice(0, 4)
              .map((r) => r.name)
              .join(', ') + (refill.length > 4 ? '…' : '')
          }
          action={
            <Button title="Open" small kind="secondary" onPress={() => router.push('/shopping')} />
          }
        />
      ) : null}

      <ChipGroup>
        <Chip
          label={`All · ${items.length}`}
          selected={filter === 'all'}
          onPress={() => setFilter('all')}
        />
        <Chip
          label={`Running low · ${lowCount}`}
          selected={filter === 'low'}
          onPress={() => setFilter('low')}
        />
        <Chip
          label={`Use soon · ${soonCount}`}
          selected={filter === 'soon'}
          onPress={() => setFilter('soon')}
        />
      </ChipGroup>

      {!groups.length ? (
        <Empty
          icon="file-tray-outline"
          title={filter === 'all' ? 'Your kitchen is empty' : 'Nothing here'}
          body={
            filter === 'all'
              ? 'Search above to add what you have, or tick items with “Update many items at once”.'
              : 'Good news — nothing in this list right now.'
          }
        />
      ) : (
        groups.map((g) => (
          <Section key={g.category} title={CATEGORY_LABEL[g.category]}>
            <Card style={{ paddingVertical: Spacing.xs }}>
              {g.items.map((item, idx) => {
                const ing = ingredientById(item.ingredientId)!;
                const low = isLow(item);
                const left = freshnessLeft(item, today);
                return (
                  <Pressable
                    key={item.ingredientId}
                    onPress={() =>
                      router.push({ pathname: '/stock/[id]', params: { id: item.ingredientId } })
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`${ing.name}, ${formatQty(ing, item.qty)}${low ? ', running low' : ''}`}
                    style={({ pressed }) => [
                      styles.row,
                      idx > 0 && {
                        borderTopWidth: StyleSheet.hairlineWidth,
                        borderTopColor: theme.border,
                      },
                      pressed && { opacity: 0.7 },
                    ]}>
                    <View style={{ flex: 1 }}>
                      <T>{ing.name}</T>
                      <Row gap={Spacing.sm}>
                        {low ? (
                          <T variant="caption" color="accent">
                            Running low
                          </T>
                        ) : null}
                        {left !== undefined && left <= 1 ? (
                          <T variant="caption" color="danger">
                            {left <= 0
                              ? 'Use today'
                              : `Use within ${left} day${left === 1 ? '' : 's'}`}
                          </T>
                        ) : null}
                      </Row>
                    </View>
                    <T variant="label" color={item.qty <= 0 ? 'danger' : 'text'}>
                      {item.qty <= 0 ? 'Out' : formatQty(ing, item.qty)}
                    </T>
                    <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
                  </Pressable>
                );
              })}
            </Card>
          </Section>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    minHeight: 52,
  },
});

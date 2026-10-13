import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import { useMemo, useState } from 'react';
import { Pressable, Share, StyleSheet, View } from 'react-native';

import { CATEGORY_LABEL } from '@/components/meal';
import { Banner, Button, Card, Empty, Row, Screen, Section, T } from '@/components/ui';
import { cartMessage, plainList, type RefillItem } from '@/core/refill';
import type { IngredientCategory } from '@/core/types';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useKitchen } from '@/store/kitchen';
import { useRefillList } from '@/store/selectors';

const REASON: Record<RefillItem['reason'], string> = {
  low: 'Running low',
  plan: 'For your meals',
  both: 'Running low · needed for your meals',
};

export default function ShoppingScreen() {
  const list = useRefillList();
  const service = useKitchen((s) => s.cartService);
  const markPurchased = useKitchen((s) => s.markPurchased);
  const showToast = useKitchen((s) => s.showToast);
  const theme = useTheme();
  const [unchecked, setUnchecked] = useState<Record<string, boolean>>({});
  const [showHow, setShowHow] = useState(false);

  const selected = useMemo(() => list.filter((i) => !unchecked[i.ingredientId]), [list, unchecked]);

  if (!list.length) {
    return (
      <Screen>
        <Empty
          icon="checkmark-done-circle-outline"
          title="Nothing to buy"
          body="Items appear here when they run low, when a weekly plan needs them, or when you add a recipe's missing items."
        />
      </Screen>
    );
  }

  const copyForCart = async () => {
    await Clipboard.setStringAsync(cartMessage(selected, service));
    showToast(`Copied — paste it to Claude with the ${service} connector on`);
    setShowHow(true);
  };

  return (
    <Screen
      footer={
        <>
          <Button
            title="Mark bought"
            kind="secondary"
            icon="bag-check-outline"
            disabled={!selected.length}
            onPress={() =>
              markPurchased(
                selected.map((i) => ({
                  ingredientId: i.ingredientId,
                  qty: i.packSize * i.packCount,
                })),
              )
            }
          />
          <Button
            title={`Copy for ${service.split(' ').pop()}`}
            icon="copy-outline"
            disabled={!selected.length}
            onPress={copyForCart}
            style={{ flex: 1 }}
          />
        </>
      }>
      <Row style={{ justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <T color="textMuted">
            {selected.length} of {list.length} selected · rounded to pack sizes
          </T>
        </View>
        <Button
          title="Share"
          icon="share-outline"
          kind="ghost"
          small
          onPress={() => Share.share({ message: plainList(selected) })}
        />
      </Row>

      <Pressable onPress={() => setShowHow((v) => !v)} accessibilityRole="button">
        <Banner
          icon="sparkles-outline"
          tone="primary"
          title={`Fill your ${service} cart with Claude`}
          body={showHow ? undefined : 'Tap to see how'}
        />
      </Pressable>
      {showHow ? (
        <Card>
          <T variant="small">
            1. Tap “Copy”. The message lists every selected item with pack sizes.
          </T>
          <T variant="small">
            2. In the Claude app, turn on the {service} connector and paste the message.
          </T>
          <T variant="small">
            3. Claude searches each item and adds it to your cart. It asks you when a brand or size
            is unclear, and it never checks out or pays.
          </T>
          <T variant="small">
            4. Review and pay in {service}. When it arrives, tap “Mark bought” here to restock your
            kitchen.
          </T>
        </Card>
      ) : null}

      {groupBy(list).map(([cat, items]) => (
        <Section key={cat} title={CATEGORY_LABEL[cat]}>
          <Card style={{ paddingVertical: Spacing.xs }}>
            {items.map((i, idx) => {
              const on = !unchecked[i.ingredientId];
              return (
                <Pressable
                  key={i.ingredientId}
                  onPress={() => setUnchecked((u) => ({ ...u, [i.ingredientId]: on }))}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  style={[
                    styles.row,
                    idx > 0 && {
                      borderTopWidth: StyleSheet.hairlineWidth,
                      borderTopColor: theme.border,
                    },
                  ]}>
                  <Ionicons
                    name={on ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={on ? theme.primary : theme.textMuted}
                  />
                  <View style={{ flex: 1 }}>
                    <T style={!on ? { opacity: 0.5 } : undefined}>{i.name}</T>
                    <T variant="caption" color={i.reason === 'plan' ? 'textMuted' : 'accent'}>
                      {REASON[i.reason]}
                    </T>
                  </View>
                  <T variant="label" style={!on ? { opacity: 0.5 } : undefined}>
                    {i.buyText}
                  </T>
                </Pressable>
              );
            })}
          </Card>
        </Section>
      ))}
    </Screen>
  );
}

function groupBy(list: RefillItem[]): [IngredientCategory, RefillItem[]][] {
  const m = new Map<IngredientCategory, RefillItem[]>();
  for (const i of list) m.set(i.category, [...(m.get(i.category) ?? []), i]);
  return [...m.entries()];
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: 52,
  },
});

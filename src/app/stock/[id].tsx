import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import {
  Button,
  Card,
  Chip,
  ChipGroup,
  Empty,
  Input,
  Row,
  Screen,
  Section,
  T,
} from '@/components/ui';
import { ingredientById } from '@/core/catalog';
import { freshnessLeft, isLow, parFor } from '@/core/inventory';
import { defaultInputUnit, formatQty, inputUnitsFor, toBase, type InputUnit } from '@/core/units';
import { todayIso, useKitchen } from '@/store/kitchen';
import { goBackOr } from '@/lib/nav';

export default function StockItem() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = useKitchen((s) => s.inventory[id]);
  const setStock = useKitchen((s) => s.setStock);
  const addStock = useKitchen((s) => s.addStock);
  const removeStock = useKitchen((s) => s.removeStock);
  const setPar = useKitchen((s) => s.setPar);
  const ing = ingredientById(id);
  const [unit, setUnit] = useState<InputUnit>(ing ? defaultInputUnit(ing) : 'g');
  const factor = ing ? toBase(ing, 1, unit) : 1;
  const [text, setText] = useState(item ? String(Math.round((item.qty / factor) * 100) / 100) : '');
  const [parText, setParText] = useState(item && ing ? String(parFor(item, ing)) : '');

  if (!ing || !item) {
    return (
      <Screen>
        <Empty
          icon="help-circle-outline"
          title="Item not found"
          body="It may have been removed."
          action={<Button title="Close" onPress={() => goBackOr('/inventory')} />}
        />
      </Screen>
    );
  }

  const n = Number(text.replace(',', '.'));
  const valid = text.trim() !== '' && Number.isFinite(n) && n >= 0;
  const left = freshnessLeft(item, todayIso());

  const changeUnit = (u: InputUnit) => {
    const f = toBase(ing, 1, u);
    if (valid) setText(String(Math.round(((n * factor) / f) * 100) / 100));
    setUnit(u);
  };

  return (
    <Screen
      footer={
        <>
          <Button
            title="Remove"
            kind="danger"
            icon="trash-outline"
            onPress={() => {
              removeStock(id);
              goBackOr('/inventory');
            }}
          />
          <Button
            title="Save"
            icon="checkmark"
            disabled={!valid}
            style={{ flex: 1 }}
            onPress={() => {
              setStock(id, n * factor);
              const par = Number(parText);
              setPar(
                id,
                Number.isFinite(par) && par >= 0 && parText.trim() !== '' && par !== ing.defaultPar
                  ? par
                  : undefined,
              );
              goBackOr('/inventory');
            }}
          />
        </>
      }>
      <Stack.Screen options={{ title: ing.name }} />
      <T variant="title">{ing.name}</T>
      <T color="textMuted">
        In stock: {formatQty(ing, item.qty)}
        {isLow(item) ? ' · running low' : ''}
        {left !== undefined
          ? ` · ${left <= 0 ? 'use today' : `fresh for ~${left} more day${left === 1 ? '' : 's'}`}`
          : ''}
      </T>

      <Section title="Bought more?">
        <ChipGroup>
          {ing.packSizes.map((p) => (
            <Chip
              key={p}
              icon="add"
              label={formatQty(ing, p)}
              onPress={() => {
                addStock(id, p);
                goBackOr('/inventory');
              }}
            />
          ))}
        </ChipGroup>
      </Section>

      <Section title="Set exact quantity">
        <Card>
          <Row>
            <Input
              value={text}
              onChangeText={setText}
              keyboardType="decimal-pad"
              style={{ flex: 1 }}
              accessibilityLabel={`${ing.name} quantity`}
            />
          </Row>
          <ChipGroup>
            {inputUnitsFor(ing).map((u) => (
              <Chip key={u} label={u} selected={u === unit} onPress={() => changeUnit(u)} />
            ))}
          </ChipGroup>
        </Card>
      </Section>

      <Section title="Alert me below">
        <Card>
          <Row>
            <Input
              value={parText}
              onChangeText={setParText}
              keyboardType="decimal-pad"
              style={{ flex: 1 }}
              accessibilityLabel="Low stock threshold"
            />
            <T variant="label">{ing.unit}</T>
          </Row>
          <T variant="small" color="textMuted">
            When stock drops under this, it goes on your shopping list. 0 turns the alert off.
            Default {formatQty(ing, ing.defaultPar) || '0'}.
          </T>
        </Card>
      </Section>
    </Screen>
  );
}

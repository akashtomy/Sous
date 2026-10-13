import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { searchIngredients } from '@/core/catalog';
import type { Ingredient } from '@/core/types';
import { defaultInputUnit, inputUnitsFor, toBase, type InputUnit } from '@/core/units';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Button, Chip, ChipGroup, Input, Row, T } from './ui';

/** Search box listing matching ingredients; calls onPick with the chosen one. */
export function IngredientSearch({
  onPick,
  placeholder = 'Search ingredients (e.g. jeera, paneer)',
  exclude = [],
}: {
  onPick: (ing: Ingredient) => void;
  placeholder?: string;
  exclude?: string[];
}) {
  const [q, setQ] = useState('');
  const theme = useTheme();
  const results = searchIngredients(q, 8).filter((i) => !exclude.includes(i.id));
  return (
    <View style={{ gap: Spacing.xs }}>
      <Input
        value={q}
        onChangeText={setQ}
        placeholder={placeholder}
        autoCorrect={false}
        accessibilityLabel="Search ingredients"
      />
      {results.length ? (
        <View
          style={{
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: Radius.md,
            overflow: 'hidden',
          }}>
          {results.map((ing) => (
            <Pressable
              key={ing.id}
              onPress={() => {
                onPick(ing);
                setQ('');
              }}
              accessibilityRole="button"
              style={({ pressed }) => ({
                padding: Spacing.md,
                backgroundColor: pressed ? theme.cardAlt : theme.card,
              })}>
              <T>{ing.name}</T>
              {ing.aliases.length ? (
                <T variant="caption" color="textMuted">
                  {ing.aliases.slice(0, 3).join(' · ')}
                </T>
              ) : null}
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** Quantity + unit entry for one ingredient; returns the amount in base units. */
export function QuantityForm({
  ingredient,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  ingredient: Ingredient;
  submitLabel: string;
  onSubmit: (baseQty: number) => void;
  onCancel?: () => void;
}) {
  const [text, setText] = useState('');
  const [unit, setUnit] = useState<InputUnit>(defaultInputUnit(ingredient));
  const n = Number(text.replace(',', '.'));
  const valid = text.trim() !== '' && Number.isFinite(n) && n > 0;
  return (
    <View style={{ gap: Spacing.sm }}>
      <T variant="label">{ingredient.name}</T>
      <Row>
        <Input
          value={text}
          onChangeText={setText}
          keyboardType="decimal-pad"
          placeholder="Quantity"
          style={{ flex: 1 }}
          accessibilityLabel={`Quantity of ${ingredient.name}`}
          onSubmitEditing={() => valid && onSubmit(toBase(ingredient, n, unit))}
        />
      </Row>
      <ChipGroup>
        {inputUnitsFor(ingredient).map((u) => (
          <Chip key={u} label={u} selected={u === unit} onPress={() => setUnit(u)} />
        ))}
      </ChipGroup>
      <Row>
        <Button
          title={submitLabel}
          onPress={() => onSubmit(toBase(ingredient, n, unit))}
          disabled={!valid}
          small
        />
        {onCancel ? <Button title="Cancel" kind="ghost" onPress={onCancel} small /> : null}
      </Row>
    </View>
  );
}

import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, View } from 'react-native';

import { ingredientById } from '@/core/catalog';
import type { Need } from '@/core/inventory';
import type { Course, Cuisine, HealthTier, IngredientCategory, Recipe } from '@/core/types';
import { formatQty } from '@/core/units';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Card, Chip, Meter, Row, T } from './ui';

export const CUISINE_LABEL: Record<Cuisine, string> = {
  indian: 'Indian',
  lebanese: 'Lebanese',
  chinese: 'Chinese',
  continental: 'Continental',
  international: 'International',
};
export const COURSE_LABEL: Record<Course, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  dessert: 'Dessert',
  snack: 'Snack',
};
export const CATEGORY_LABEL: Record<IngredientCategory, string> = {
  vegetable: 'Vegetables',
  fruit: 'Fruit',
  herb: 'Herbs',
  grain: 'Grains, flours & bread',
  bakery: 'Bread & bakery',
  pulse: 'Dals & pulses',
  dairy: 'Dairy & eggs',
  protein: 'Meat, fish & protein',
  oil: 'Oils & ghee',
  nut: 'Nuts & seeds',
  spice: 'Spices',
  condiment: 'Pantry & sauces',
};

const TIER_LABEL: Record<HealthTier, string> = {
  healthy: 'Healthy',
  balanced: 'Balanced',
  indulgent: 'Treat',
};

export function HealthBadge({ tier }: { tier: HealthTier }) {
  const theme = useTheme();
  const color = theme[tier];
  return (
    <Row gap={4}>
      <Ionicons
        name={
          tier === 'healthy' ? 'leaf' : tier === 'balanced' ? 'scale-outline' : 'ice-cream-outline'
        }
        size={14}
        color={color}
      />
      <T variant="caption" style={{ color }}>
        {TIER_LABEL[tier]}
      </T>
    </Row>
  );
}

export function MetaLine({ recipe, servings }: { recipe: Recipe; servings?: number }) {
  const theme = useTheme();
  return (
    <Row gap={Spacing.md} style={{ flexWrap: 'wrap' }}>
      <Row gap={4}>
        <Ionicons name="flame-outline" size={14} color={theme.textMuted} />
        <T variant="caption" color="textMuted">
          {recipe.nutrition.kcal} kcal/serving
        </T>
      </Row>
      <Row gap={4}>
        <Ionicons name="time-outline" size={14} color={theme.textMuted} />
        <T variant="caption" color="textMuted">
          {recipe.totalMin} min
        </T>
      </Row>
      {servings ? (
        <Row gap={4}>
          <Ionicons name="people-outline" size={14} color={theme.textMuted} />
          <T variant="caption" color="textMuted">
            {servings}
          </T>
        </Row>
      ) : null}
      <HealthBadge tier={recipe.healthTier} />
    </Row>
  );
}

export function MealCard({
  recipe,
  coverage,
  missing,
  reason,
  servings,
  onPress,
  actions,
}: {
  recipe: Recipe;
  coverage?: number;
  missing?: Need[];
  reason?: string;
  servings?: number;
  onPress: () => void;
  /** Buttons shown under the card body (kept outside the card's own press target). */
  actions?: React.ReactNode;
}) {
  return (
    <Card>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={recipe.name}
        style={({ pressed }) => [{ gap: Spacing.sm }, pressed && { opacity: 0.85 }]}>
        <View style={{ gap: 2 }}>
          <T variant="label">{recipe.name}</T>
          <T variant="caption" color="textMuted">
            {CUISINE_LABEL[recipe.cuisine]} · {recipe.style}
            {recipe.origin && recipe.origin !== recipe.style ? ` · ${recipe.origin}` : ''}
            {recipe.source === 'claude' ? ' · AI idea' : ''}
          </T>
        </View>
        <MetaLine recipe={recipe} servings={servings} />
        {coverage !== undefined ? (
          <Row gap={Spacing.sm}>
            <Meter value={coverage} />
            <T variant="caption" color="textMuted">
              {Math.round(coverage * 100)}% in stock
            </T>
          </Row>
        ) : null}
        {reason ? (
          <T variant="small" color="textMuted">
            {reason}
          </T>
        ) : null}
        {missing && missing.length ? (
          <Row gap={6} style={{ flexWrap: 'wrap' }}>
            {missing.slice(0, 4).map((m) => {
              const ing = ingredientById(m.ingredientId);
              return (
                <Chip
                  key={m.ingredientId}
                  tone="accent"
                  label={`${ing?.name ?? m.ingredientId} ${ing ? formatQty(ing, m.qty) : ''}`}
                />
              );
            })}
            {missing.length > 4 ? (
              <Chip tone="accent" label={`+${missing.length - 4} more`} />
            ) : null}
          </Row>
        ) : null}
      </Pressable>
      {actions ? <Row style={{ flexWrap: 'wrap' }}>{actions}</Row> : null}
    </Card>
  );
}

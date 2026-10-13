import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { T } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { useKitchenName } from '@/store/kitchen-name';

/** Page heading with the kitchen's name above it; tapping the name renames the kitchen. */
export function KitchenTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  const name = useKitchenName();
  const theme = useTheme();
  return (
    <View style={{ gap: 2 }}>
      <Pressable
        onPress={() => router.push('/kitchen-name')}
        accessibilityRole="button"
        accessibilityLabel={`Kitchen: ${name}. Rename`}
        hitSlop={8}
        style={({ pressed }) => [
          { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
          pressed && { opacity: 0.6 },
        ]}>
        <Ionicons name="home" size={14} color={theme.primary} />
        <T variant="label" color="primary" numberOfLines={1}>
          {name}
        </T>
        <Ionicons name="pencil" size={13} color={theme.textMuted} />
      </Pressable>
      <T variant="title">{title}</T>
      {subtitle ? <T color="textMuted">{subtitle}</T> : null}
    </View>
  );
}

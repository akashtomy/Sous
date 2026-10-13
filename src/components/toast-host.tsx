import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useKitchen } from '@/store/kitchen';

import { T } from './ui';

/** Bottom toast with an optional Undo for the last cooked meal. */
export function ToastHost() {
  const toast = useKitchen((s) => s.toast);
  const dismiss = useKitchen((s) => s.dismissToast);
  const undo = useKitchen((s) => s.undoCook);
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(dismiss, toast.undoEntryId ? 8000 : 3500);
    return () => clearTimeout(t);
  }, [toast, dismiss]);

  if (!toast) return null;
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: insets.bottom + 136 }]}>
      <View
        style={[styles.toast, { backgroundColor: theme.text }]}
        accessibilityLiveRegion="polite"
        accessibilityRole="alert">
        <T variant="small" style={{ color: theme.background, flex: 1 }}>
          {toast.message}
        </T>
        {toast.undoEntryId ? (
          <Pressable
            onPress={() => undo(toast.undoEntryId!)}
            accessibilityRole="button"
            hitSlop={8}>
            <T variant="label" style={{ color: theme.accent }}>
              Undo
            </T>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  toast: {
    width: '100%',
    maxWidth: MaxContentWidth - 2 * Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
  },
});

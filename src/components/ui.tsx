// Small cross-platform UI kit used by every screen.
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MaxContentWidth, Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

type TextVariant = 'title' | 'heading' | 'body' | 'label' | 'small' | 'caption';

const TEXT: Record<
  TextVariant,
  { fontSize: number; lineHeight: number; fontWeight: '400' | '500' | '600' | '700' }
> = {
  title: { fontSize: 26, lineHeight: 32, fontWeight: '700' },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
  label: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
  small: { fontSize: 14, lineHeight: 19, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
};

export function T({
  variant = 'body',
  color = 'text',
  style,
  ...rest
}: TextProps & { variant?: TextVariant; color?: ThemeColor }) {
  const theme = useTheme();
  return <Text style={[TEXT[variant], { color: theme[color] }, style]} {...rest} />;
}

/**
 * Scrollable page with safe-area padding and a centred max width on wide screens.
 * `safeTop` pads below the status bar, for screens without a navigation header (the tabs).
 */
export function Screen({
  children,
  scroll = true,
  footer,
  padTop = true,
  safeTop = false,
}: {
  children: ReactNode;
  scroll?: boolean;
  footer?: ReactNode;
  padTop?: boolean;
  safeTop?: boolean;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const top = (padTop ? Spacing.lg : 0) + (safeTop ? insets.top : 0);
  const inner = <View style={[styles.content, { paddingTop: top }]}>{children}</View>;
  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={{ paddingBottom: Spacing.xxl + (footer ? 72 : 0) }}
          keyboardShouldPersistTaps="handled">
          {inner}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>{inner}</View>
      )}
      {footer ? (
        <View
          style={[
            styles.footer,
            {
              backgroundColor: theme.background,
              borderTopColor: theme.border,
              paddingBottom: Math.max(insets.bottom, Spacing.md),
            },
          ]}>
          <View style={styles.footerInner}>{footer}</View>
        </View>
      ) : null}
    </View>
  );
}

export function Card({
  children,
  style,
  onPress,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const base = [styles.card, { backgroundColor: theme.card, borderColor: theme.border }, style];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [base, pressed && { opacity: 0.85 }]}
      accessibilityRole="button">
      {children}
    </Pressable>
  );
}

export function Row({
  children,
  style,
  gap = Spacing.sm,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  gap?: number;
}) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>
  );
}

export function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <View style={{ gap: Spacing.sm, marginTop: Spacing.lg }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <T variant="heading">{title}</T>
        {action}
      </Row>
      {children}
    </View>
  );
}

type ButtonKind = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  title,
  onPress,
  kind = 'primary',
  icon,
  disabled,
  loading,
  small,
  style,
  accessibilityLabel,
}: {
  title: string;
  onPress: () => void;
  kind?: ButtonKind;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const theme = useTheme();
  const bg = {
    primary: theme.primary,
    secondary: theme.primarySoft,
    ghost: 'transparent',
    danger: theme.dangerSoft,
  }[kind];
  const fg = {
    primary: theme.onPrimary,
    secondary: theme.primary,
    ghost: theme.primary,
    danger: theme.danger,
  }[kind];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        { backgroundColor: bg, opacity: disabled ? 0.45 : pressed ? 0.8 : 1 },
        kind === 'ghost' && { paddingHorizontal: Spacing.sm },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : icon ? (
        <Ionicons name={icon} size={small ? 16 : 18} color={fg} />
      ) : null}
      <Text style={{ color: fg, fontSize: small ? 14 : 16, fontWeight: '600' }}>{title}</Text>
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  label,
  color = 'text',
}: {
  icon: IconName;
  onPress: () => void;
  label: string;
  color?: ThemeColor;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.6 }]}>
      <Ionicons name={icon} size={22} color={theme[color]} />
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  icon,
  tone = 'primary',
  accessibilityLabel,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
  tone?: 'primary' | 'accent' | 'danger';
  accessibilityLabel?: string;
}) {
  const theme = useTheme();
  const on = { primary: theme.primary, accent: theme.accent, danger: theme.danger }[tone];
  const soft = { primary: theme.primarySoft, accent: theme.accentSoft, danger: theme.dangerSoft }[
    tone
  ];
  const content = (
    <>
      {icon ? <Ionicons name={icon} size={14} color={selected ? theme.onPrimary : on} /> : null}
      <Text
        style={{
          color: selected ? theme.onPrimary : onPress ? theme.text : on,
          fontSize: 14,
          fontWeight: '500',
        }}>
        {label}
      </Text>
    </>
  );
  const style = [
    styles.chip,
    {
      backgroundColor: selected ? on : onPress ? theme.card : soft,
      borderColor: selected ? on : onPress ? theme.border : soft,
    },
  ];
  if (!onPress) return <View style={style}>{content}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected: !!selected }}
      style={({ pressed }) => [style, pressed && { opacity: 0.8 }]}>
      {content}
    </Pressable>
  );
}

export function ChipGroup({ children }: { children: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>{children}</View>
  );
}

export function Stepper({
  value,
  onChange,
  min = 1,
  max = 20,
  label,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  label?: string;
}) {
  const theme = useTheme();
  return (
    <Row gap={Spacing.md}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Decrease ${label ?? ''}`}
        onPress={() => onChange(Math.max(min, value - 1))}
        style={[styles.stepBtn, { borderColor: theme.border, backgroundColor: theme.card }]}>
        <Ionicons name="remove" size={20} color={theme.text} />
      </Pressable>
      <T
        variant="heading"
        style={{ minWidth: 28, textAlign: 'center' }}
        accessibilityLabel={`${label ?? 'Value'} ${value}`}>
        {value}
      </T>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Increase ${label ?? ''}`}
        onPress={() => onChange(Math.min(max, value + 1))}
        style={[styles.stepBtn, { borderColor: theme.border, backgroundColor: theme.card }]}>
        <Ionicons name="add" size={20} color={theme.text} />
      </Pressable>
    </Row>
  );
}

export function Input(props: TextInputProps) {
  const theme = useTheme();
  return (
    <TextInput
      placeholderTextColor={theme.textMuted}
      {...props}
      style={[
        styles.input,
        { color: theme.text, backgroundColor: theme.card, borderColor: theme.border },
        props.style,
      ]}
    />
  );
}

export function Toggle({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  const theme = useTheme();
  return (
    <Row style={{ justifyContent: 'space-between', paddingVertical: Spacing.xs }}>
      <View style={{ flex: 1, paddingRight: Spacing.md }}>
        <T variant="label">{label}</T>
        {hint ? (
          <T variant="small" color="textMuted">
            {hint}
          </T>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: theme.primary, false: theme.border }}
        thumbColor="#FFFFFF"
        // react-native-web uses a separate prop for the "on" thumb (default teal).
        {...(Platform.OS === 'web' ? { activeThumbColor: '#FFFFFF' } : {})}
        accessibilityLabel={label}
      />
    </Row>
  );
}

export function Banner({
  icon,
  tone = 'accent',
  title,
  body,
  action,
}: {
  icon: IconName;
  tone?: 'accent' | 'danger' | 'primary';
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  const theme = useTheme();
  const bg = { accent: theme.accentSoft, danger: theme.dangerSoft, primary: theme.primarySoft }[
    tone
  ];
  const fg = { accent: theme.accent, danger: theme.danger, primary: theme.primary }[tone];
  return (
    <View style={[styles.banner, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={22} color={fg} />
      <View style={{ flex: 1, gap: 2 }}>
        <T variant="label">{title}</T>
        {body ? (
          <T variant="small" color="textMuted">
            {body}
          </T>
        ) : null}
      </View>
      {action}
    </View>
  );
}

export function Meter({ value }: { value: number }) {
  const theme = useTheme();
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  const color = pct >= 90 ? theme.primary : pct >= 60 ? theme.accent : theme.danger;
  return (
    <View
      style={[styles.meter, { backgroundColor: theme.cardAlt }]}
      accessibilityLabel={`${pct}% of ingredients in stock`}>
      <View
        style={{
          width: `${pct}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: Radius.pill,
        }}
      />
    </View>
  );
}

export function Empty({
  icon,
  title,
  body,
  action,
}: {
  icon: IconName;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.xxl,
        paddingHorizontal: Spacing.lg,
      }}>
      <Ionicons name={icon} size={40} color={theme.textMuted} />
      <T variant="heading" style={{ textAlign: 'center' }}>
        {title}
      </T>
      <T color="textMuted" style={{ textAlign: 'center' }}>
        {body}
      </T>
      {action}
    </View>
  );
}

export function Divider() {
  const theme = useTheme();
  return (
    <View
      style={{
        height: StyleSheet.hairlineWidth,
        backgroundColor: theme.border,
        marginVertical: Spacing.sm,
      }}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  footerInner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  button: {
    minHeight: 48,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  buttonSmall: { minHeight: 36, paddingHorizontal: Spacing.md, borderRadius: Radius.sm },
  iconButton: { padding: Spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    borderWidth: 1,
    minHeight: 34,
  },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  meter: { height: 6, borderRadius: Radius.pill, overflow: 'hidden', flex: 1 },
});

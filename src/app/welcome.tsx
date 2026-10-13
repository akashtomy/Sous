import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router } from 'expo-router';
import { View } from 'react-native';

import { BrandHeader } from '@/components/brand';
import { Button, Screen, T, type IconName } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { RECIPES } from '@/core/catalog';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/store/auth';
import { useKitchen } from '@/store/kitchen';

const POINTS: { icon: IconName; title: string; body: string; sharedOnly?: boolean }[] = [
  {
    icon: 'calendar-outline',
    title: 'Plan the week in a minute',
    body: 'Quick weekday meals, relaxed weekends and a weekend prep list that does the slow work ahead.',
  },
  {
    icon: 'basket-outline',
    title: 'Cook from what you have',
    body: `${RECIPES.length} healthy recipes ranked by what's in your kitchen. Cooking updates your stock.`,
  },
  {
    icon: 'cart-outline',
    title: 'Never run out',
    body: 'Your shopping list builds itself, ready to paste into Swiggy Instamart.',
  },
  {
    icon: 'people-outline',
    title: 'Made for two',
    body: 'Share one kitchen with your partner. Plans and stock stay in sync on both phones.',
    sharedOnly: true,
  },
];

/** Landing page: what Sous does, then sign up / sign in (or straight to setup without accounts). */
export default function Welcome() {
  const status = useAuth((s) => s.status);
  const onboarded = useKitchen((s) => s.onboarded);
  const theme = useTheme();
  const accounts = status !== 'disabled';

  if (status === 'signedIn' || (!accounts && onboarded)) return <Redirect href="/" />;

  return (
    <Screen
      safeTop
      footer={
        <View style={{ flex: 1, gap: Spacing.sm }}>
          <Button
            title="Get started"
            icon="arrow-forward"
            onPress={() =>
              router.push(accounts ? { pathname: '/login', params: { mode: 'signup' } } : '/onboarding')
            }
          />
          {accounts ? (
            <Button
              title="I already have an account"
              kind="ghost"
              onPress={() => router.push({ pathname: '/login', params: { mode: 'signin' } })}
            />
          ) : null}
        </View>
      }>
      <BrandHeader />
      <View style={{ gap: Spacing.md, paddingBottom: accounts ? 64 : 0 }}>
        {POINTS.filter((p) => accounts || !p.sharedOnly).map((p) => (
          <View key={p.title} style={{ flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: Radius.md,
                backgroundColor: theme.primarySoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons name={p.icon} size={22} color={theme.primary} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <T variant="label">{p.title}</T>
              <T variant="small" color="textMuted">
                {p.body}
              </T>
            </View>
          </View>
        ))}
      </View>
    </Screen>
  );
}

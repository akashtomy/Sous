import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { T } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/store/auth';
import { useKitchen } from '@/store/kitchen';
import { useRefillList } from '@/store/selectors';

export default function TabLayout() {
  const theme = useTheme();
  const onboarded = useKitchen((s) => s.onboarded);
  const synced = useKitchen((s) => !!s.lastSyncedAt);
  const refillCount = useRefillList().length;
  const status = useAuth((s) => s.status);
  const household = useAuth((s) => s.household);
  const householdLoaded = useAuth((s) => s.householdLoaded);
  const recovering = useAuth((s) => s.recovering);

  // Accounts mode: signed in, with a kitchen, before anything else.
  if (status === 'loading' || (status === 'signedIn' && !householdLoaded)) {
    return <Loading text="Signing you in…" />;
  }
  if (status === 'signedOut') return <Redirect href="/welcome" />;
  if (status === 'signedIn') {
    if (recovering) return <Redirect href="/reset-password" />;
    if (!household) return <Redirect href="/household-setup" />;
    // A partner's phone has no cache yet: wait for the kitchen instead of showing setup.
    if (!onboarded && !synced) return <Loading text="Loading your kitchen…" />;
  }
  // Without accounts the welcome page leads into setup.
  if (!onboarded) return <Redirect href={status === 'disabled' ? '/welcome' : '/onboarding'} />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: { backgroundColor: theme.card, borderTopColor: theme.border },
        headerStyle: { backgroundColor: theme.background },
        headerTitleStyle: { color: theme.text },
        headerShadowVisible: false,
        // Each tab draws its own title (with the kitchen name), so no navigation header.
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="restaurant-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: 'Plan',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: 'Recipes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Kitchen',
          tabBarBadge: refillCount || undefined,
          tabBarBadgeStyle: { backgroundColor: theme.accent, color: theme.onPrimary },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="file-tray-stacked-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="you"
        options={{
          title: 'You',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

function Loading({ text }: { text: string }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.md,
        backgroundColor: theme.background,
      }}>
      <ActivityIndicator color={theme.primary} />
      <T color="textMuted">{text}</T>
    </View>
  );
}

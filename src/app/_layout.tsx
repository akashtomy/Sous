import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';

import { ToastHost } from '@/components/toast-host';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/store/auth';
import { hydrateKitchen, useHydrated } from '@/store/persistence';

SplashScreen.preventAutoHideAsync().catch(() => {});
// Load the saved kitchen (SQLite on phones, IndexedDB on web) before anything renders.
void hydrateKitchen();

export default function RootLayout() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const c = Colors[scheme];
  const hydrated = useHydrated();

  useEffect(() => {
    if (!hydrated) return;
    // Auth starts after the cached kitchen has loaded, so it can tell whose data is cached.
    useAuth.getState().init();
    SplashScreen.hideAsync().catch(() => {});
  }, [hydrated]);

  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      background: c.background,
      card: c.card,
      text: c.text,
      border: c.border,
      primary: c.primary,
    },
  };

  if (!hydrated) return <View style={{ flex: 1, backgroundColor: c.background }} />;

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerTintColor: c.primary,
          headerTitleStyle: { color: c.text },
          contentStyle: { backgroundColor: c.background },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="kitchen-name" options={{ title: 'Rename kitchen', presentation: 'modal' }} />
        <Stack.Screen name="shopping" options={{ title: 'Shopping list' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        <Stack.Screen name="recipe/[id]" options={{ title: 'Recipe' }} />
        <Stack.Screen
          name="questions"
          options={{ title: 'What would you like to eat?', presentation: 'modal' }}
        />
        <Stack.Screen name="stock/[id]" options={{ title: 'Edit item', presentation: 'modal' }} />
        <Stack.Screen
          name="alternatives"
          options={{ title: 'Alternatives', presentation: 'modal' }}
        />
        <Stack.Screen name="eat-out" options={{ title: 'Ate outside', presentation: 'modal' }} />
        <Stack.Screen name="prep" options={{ title: 'Weekend prep' }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="household-setup" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="household" options={{ title: 'Household & partner' }} />
        <Stack.Screen name="auth-callback" options={{ headerShown: false }} />
        <Stack.Screen name="reset-password" options={{ title: 'New password' }} />
      </Stack>
      <ToastHost />
    </ThemeProvider>
  );
}

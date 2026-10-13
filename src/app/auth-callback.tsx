import * as Linking from 'expo-linking';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';

import { Banner, Button, Screen, T } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { friendlyAuthError, useAuth } from '@/store/auth';

/**
 * Landing page for email-confirmation and password-reset links (and web Google sign-in).
 * On the web supabase-js reads the tokens from the URL itself; on phones the deep link URL
 * is passed to the auth store.
 */
export default function AuthCallback() {
  const status = useAuth((s) => s.status);
  const recovering = useAuth((s) => s.recovering);
  const handleAuthUrl = useAuth((s) => s.handleAuthUrl);
  const url = Linking.useLinkingURL();
  const theme = useTheme();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web' || !url) return;
    handleAuthUrl(url).catch((e) => setError(friendlyAuthError(e)));
  }, [url, handleAuthUrl]);

  if (recovering) return <Redirect href="/reset-password" />;
  if (status === 'signedIn' || status === 'disabled') return <Redirect href="/" />;

  return (
    <Screen>
      <View style={{ alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xxl }}>
        {error ? (
          <>
            <Banner
              icon="alert-circle-outline"
              tone="danger"
              title={error}
              body="The link may have expired. Try again from the sign-in screen."
            />
            <Button title="Back to sign in" onPress={() => router.replace('/login')} />
          </>
        ) : (
          <>
            <ActivityIndicator color={theme.primary} />
            <T color="textMuted">Signing you in…</T>
          </>
        )}
      </View>
    </Screen>
  );
}

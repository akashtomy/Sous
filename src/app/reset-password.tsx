import { Redirect, router } from 'expo-router';
import { useState } from 'react';

import { Banner, Button, Card, Input, Screen, T } from '@/components/ui';
import { friendlyAuthError, useAuth } from '@/store/auth';
import { useKitchen } from '@/store/kitchen';

/** Reached from a password-reset email: choose a new password. */
export default function ResetPassword() {
  const status = useAuth((s) => s.status);
  const updatePassword = useAuth((s) => s.updatePassword);
  const showToast = useKitchen((s) => s.showToast);
  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === 'disabled') return <Redirect href="/" />;
  if (status === 'signedOut') return <Redirect href="/login" />;

  const valid = password.length >= 8 && password === again;

  return (
    <Screen>
      <T variant="title">Choose a new password</T>
      {error ? <Banner icon="alert-circle-outline" tone="danger" title={error} /> : null}
      <Card>
        <Input
          value={password}
          onChangeText={setPassword}
          placeholder="New password (at least 8 characters)"
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          accessibilityLabel="New password"
        />
        <Input
          value={again}
          onChangeText={setAgain}
          placeholder="Type it again"
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          accessibilityLabel="Repeat new password"
        />
        {again && password !== again ? (
          <T variant="small" color="danger">
            The passwords don&apos;t match.
          </T>
        ) : null}
        <Button
          title="Save password"
          loading={busy}
          disabled={!valid || busy}
          onPress={async () => {
            setError(null);
            setBusy(true);
            try {
              await updatePassword(password);
              showToast('Password updated');
              router.replace('/');
            } catch (e) {
              setError(friendlyAuthError(e));
            } finally {
              setBusy(false);
            }
          }}
        />
      </Card>
    </Screen>
  );
}

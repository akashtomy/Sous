import { Redirect } from 'expo-router';
import { useState } from 'react';

import { Banner, Button, Card, Input, Row, Screen, T, Toggle } from '@/components/ui';
import { friendlyAuthError, useAuth } from '@/store/auth';
import { useKitchen } from '@/store/kitchen';

/** After the first sign-in: start a kitchen, or join the partner's with their code. */
export default function HouseholdSetup() {
  const status = useAuth((s) => s.status);
  const household = useAuth((s) => s.household);
  const username = useAuth((s) => s.username);
  const createHousehold = useAuth((s) => s.createHousehold);
  const joinHousehold = useAuth((s) => s.joinHousehold);
  const signOut = useAuth((s) => s.signOut);
  // Data created on this phone before accounts existed (not tied to any household yet).
  const hasDeviceData = useKitchen(
    (s) => !s.householdId && (s.onboarded || Object.keys(s.inventory).length > 0),
  );
  const [name, setName] = useState(username ? `${username}'s kitchen` : 'Our kitchen');
  const [bring, setBring] = useState(true);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState<'create' | 'join' | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (status !== 'signedIn') return <Redirect href={status === 'signedOut' ? '/login' : '/'} />;
  if (household) return <Redirect href="/" />;

  const run = async (kind: 'create' | 'join', fn: () => Promise<void>) => {
    setError(null);
    setBusy(kind);
    try {
      await fn();
    } catch (e) {
      setError(friendlyAuthError(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen>
      <T variant="title">Your shared kitchen</T>
      <T color="textMuted">
        Everyone in a kitchen sees the same stock, plans, shopping list and history, live.
      </T>
      {error ? <Banner icon="alert-circle-outline" tone="danger" title={error} /> : null}

      <Card>
        <T variant="heading">Join your partner</T>
        <T variant="small" color="textMuted">
          Ask them to open You → Household → Invite partner, and type the 6-character code here.
        </T>
        <Input
          value={code}
          onChangeText={(t) =>
            setCode(
              t
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, '')
                .slice(0, 6),
            )
          }
          placeholder="ABC234"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={6}
          accessibilityLabel="Invite code"
          style={{ fontSize: 22, letterSpacing: 4, textAlign: 'center' }}
        />
        <Button
          title="Join kitchen"
          icon="people-outline"
          loading={busy === 'join'}
          disabled={code.length !== 6 || !!busy}
          onPress={() => run('join', () => joinHousehold(code))}
        />
      </Card>

      <Card>
        <T variant="heading">Or start a new kitchen</T>
        <Input
          value={name}
          onChangeText={setName}
          placeholder="Kitchen name"
          accessibilityLabel="Kitchen name"
        />
        {hasDeviceData ? (
          <Toggle
            label="Bring the kitchen data on this phone"
            hint="Your stock, plan, history and tastes from before you signed in."
            value={bring}
            onChange={setBring}
          />
        ) : null}
        <Button
          title="Create kitchen"
          icon="home-outline"
          kind="secondary"
          loading={busy === 'create'}
          disabled={!name.trim() || !!busy}
          onPress={() => run('create', () => createHousehold(name, hasDeviceData && bring))}
        />
      </Card>

      <Row style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
        <T variant="small" color="textMuted">
          Signed in as @{username}
        </T>
        <Button title="Sign out" kind="ghost" small onPress={() => void signOut()} />
      </Row>
    </Screen>
  );
}

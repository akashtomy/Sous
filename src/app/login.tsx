import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { BrandHeader } from '@/components/brand';
import { Banner, Button, Card, Chip, ChipGroup, Input, Row, Screen, T } from '@/components/ui';
import { GOOGLE_SIGN_IN } from '@/config/features';
import { goBackOr } from '@/lib/nav';
import { normaliseUsername, passwordProblem, usernameProblem } from '@/core/username';
import { friendlyAuthError, useAuth } from '@/store/auth';

type Mode = 'signin' | 'signup';
type Availability = 'unknown' | 'checking' | 'free' | 'taken';

export default function Login() {
  const status = useAuth((s) => s.status);
  const signIn = useAuth((s) => s.signIn);
  const signUp = useAuth((s) => s.signUp);
  const google = useAuth((s) => s.signInWithGoogle);
  const isAvailable = useAuth((s) => s.isUsernameAvailable);
  const params = useLocalSearchParams<{ mode?: string }>();
  const [mode, setMode] = useState<Mode>(params.mode === 'signup' ? 'signup' : 'signin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [busy, setBusy] = useState<'form' | 'google' | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Last server answer for a username; the displayed status is derived from it.
  const [checked, setChecked] = useState<{ name: string; free: boolean } | null>(null);

  const uProblem = username ? usernameProblem(username) : undefined;
  const pProblem = password ? passwordProblem(password) : undefined;

  const wanted = normaliseUsername(username);
  const shouldCheck = mode === 'signup' && !!username && !usernameProblem(username);
  const availability: Availability = !shouldCheck
    ? 'unknown'
    : checked?.name !== wanted
      ? 'checking'
      : checked.free
        ? 'free'
        : 'taken';

  // While creating an account, check the username as the person types (debounced).
  useEffect(() => {
    if (!shouldCheck) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      const free = await isAvailable(wanted);
      if (!cancelled) setChecked({ name: wanted, free });
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [shouldCheck, wanted, isAvailable]);

  if (status === 'disabled' || status === 'signedIn') return <Redirect href="/" />;

  const valid =
    mode === 'signin'
      ? !!username && !!password && !username.includes('@')
      : !usernameProblem(username) &&
        !passwordProblem(password) &&
        password === confirmPw &&
        availability !== 'taken';

  const run = async (kind: 'form' | 'google', fn: () => Promise<void>) => {
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

  const submit = () =>
    run('form', () => (mode === 'signin' ? signIn(username, password) : signUp(username, password)));

  const usernameHint = !username
    ? undefined
    : mode !== 'signup'
      ? username.includes('@') && uProblem
        ? { text: uProblem, color: 'danger' as const }
        : undefined
      : uProblem
        ? { text: uProblem, color: 'danger' as const }
        : availability === 'checking'
          ? { text: 'Checking…', color: 'textMuted' as const }
          : availability === 'taken'
            ? { text: `@${normaliseUsername(username)} is taken`, color: 'danger' as const }
            : availability === 'free'
              ? { text: `@${normaliseUsername(username)} is available`, color: 'primary' as const }
              : undefined;

  return (
    <Screen safeTop>
      <Row>
        <Button title="Back" icon="chevron-back" kind="ghost" small onPress={() => goBackOr('/welcome')} />
      </Row>
      <BrandHeader
        subtitle={mode === 'signup' ? 'Create your account to start planning' : 'Welcome back'}
      />
      {error ? <Banner icon="alert-circle-outline" tone="danger" title={error} /> : null}

      <Card>
        <ChipGroup>
          <Chip label="Sign in" selected={mode === 'signin'} onPress={() => setMode('signin')} />
          <Chip label="Create account" selected={mode === 'signup'} onPress={() => setMode('signup')} />
        </ChipGroup>
        <Input
          value={username}
          onChangeText={(t) => setUsername(t.replace(/\s/g, ''))}
          placeholder="Username"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
          textContentType="username"
          maxLength={20}
          accessibilityLabel="Username"
        />
        {usernameHint ? (
          <T variant="small" color={usernameHint.color}>
            {usernameHint.text}
          </T>
        ) : mode === 'signup' ? (
          <T variant="small" color="textMuted">
            3–20 characters: letters, numbers, dots and underscores.
          </T>
        ) : null}
        <Input
          value={password}
          onChangeText={setPassword}
          placeholder={mode === 'signup' ? 'Password (at least 8 characters)' : 'Password'}
          secureTextEntry
          autoCapitalize="none"
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          textContentType={mode === 'signup' ? 'newPassword' : 'password'}
          accessibilityLabel="Password"
          onSubmitEditing={() => mode === 'signin' && valid && submit()}
        />
        {mode === 'signup' ? (
          <>
            {pProblem ? (
              <T variant="small" color="danger">
                {pProblem}
              </T>
            ) : null}
            <Input
              value={confirmPw}
              onChangeText={setConfirmPw}
              placeholder="Type the password again"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              accessibilityLabel="Confirm password"
              onSubmitEditing={() => valid && submit()}
            />
            {confirmPw && confirmPw !== password ? (
              <T variant="small" color="danger">
                The passwords don&apos;t match.
              </T>
            ) : null}
          </>
        ) : null}
        <Button
          title={mode === 'signin' ? 'Sign in' : 'Create account'}
          loading={busy === 'form'}
          disabled={!valid || !!busy}
          onPress={submit}
        />
        {mode === 'signup' ? (
          <T variant="small" color="textMuted">
            Accounts have no email, so a forgotten password can&apos;t be reset by email. Save it in
            your phone&apos;s password manager.
          </T>
        ) : null}
      </Card>

      {GOOGLE_SIGN_IN ? (
        <>
          <Row style={{ justifyContent: 'center' }}>
            <T variant="small" color="textMuted">
              or
            </T>
          </Row>
          <Button
            title="Continue with Google"
            icon="logo-google"
            kind="secondary"
            loading={busy === 'google'}
            disabled={!!busy}
            onPress={() => run('google', google)}
          />
        </>
      ) : null}
    </Screen>
  );
}

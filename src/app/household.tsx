import * as Clipboard from 'expo-clipboard';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Share, View } from 'react-native';

import {
  Banner,
  Button,
  Card,
  Chip,
  Divider,
  Input,
  Row,
  Screen,
  Section,
  T,
} from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { passwordProblem } from '@/core/username';
import { confirm } from '@/lib/confirm';
import { friendlyAuthError, useAuth } from '@/store/auth';
import { useKitchen } from '@/store/kitchen';

/** Kitchen name, partners, invite codes, sync status and sign-out. */
export default function HouseholdScreen() {
  const status = useAuth((s) => s.status);
  const username = useAuth((s) => s.username);
  const updatePassword = useAuth((s) => s.updatePassword);
  const household = useAuth((s) => s.household);
  const members = useAuth((s) => s.members);
  const createInvite = useAuth((s) => s.createInvite);
  const rename = useAuth((s) => s.renameHousehold);
  const removeMember = useAuth((s) => s.removeMember);
  const leave = useAuth((s) => s.leaveHousehold);
  const join = useAuth((s) => s.joinHousehold);
  const signOut = useAuth((s) => s.signOut);
  const pending = useKitchen((s) => s.pendingOps.length);
  const syncError = useKitchen((s) => s.syncError);
  const lastSyncedAt = useKitchen((s) => s.lastSyncedAt);
  const showToast = useKitchen((s) => s.showToast);

  const [invite, setInvite] = useState<string | null>(null);
  const [name, setName] = useState(household?.name ?? '');
  const [code, setCode] = useState('');
  const [newPw, setNewPw] = useState('');
  const [newPw2, setNewPw2] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (status === 'disabled') return <Redirect href="/settings" />;
  if (status !== 'signedIn') return <Redirect href="/login" />;
  if (!household) return <Redirect href="/household-setup" />;
  const isOwner = household.role === 'owner';

  const run = async (key: string, fn: () => Promise<void>) => {
    setError(null);
    setBusy(key);
    try {
      await fn();
    } catch (e) {
      setError(friendlyAuthError(e));
    } finally {
      setBusy(null);
    }
  };

  const shareText = (c: string) =>
    `Join our kitchen "${household.name}" on Sous: create an account, choose “Join your partner” and enter ${c} (valid for 48 hours).`;

  return (
    <Screen>
      <T variant="title">{household.name}</T>
      <T color="textMuted">
        Everyone here shares stock, plans, shopping and history. Signed in as @{username}.
      </T>
      {error ? <Banner icon="alert-circle-outline" tone="danger" title={error} /> : null}
      <Banner
        icon={
          syncError
            ? 'cloud-offline-outline'
            : pending
              ? 'cloud-upload-outline'
              : 'cloud-done-outline'
        }
        tone={syncError ? 'accent' : 'primary'}
        title={
          syncError ??
          (pending
            ? `${pending} change${pending === 1 ? '' : 's'} waiting to sync`
            : 'All changes saved')
        }
        body={
          lastSyncedAt ? `Last synced ${new Date(lastSyncedAt).toLocaleTimeString()}` : undefined
        }
      />

      <Section title="People">
        <Card>
          {members.map((m, i) => (
            <View key={m.userId} style={{ gap: Spacing.xs }}>
              {i > 0 ? <Divider /> : null}
              <Row style={{ justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <T variant="label">
                    {m.displayName}
                    {m.isMe ? ' (you)' : ''}
                  </T>
                  <T variant="caption" color="textMuted">
                    {m.role === 'owner' ? 'Owner' : 'Member'}
                  </T>
                </View>
                {isOwner && !m.isMe ? (
                  <Chip
                    label="Remove"
                    icon="close"
                    tone="danger"
                    onPress={() =>
                      confirm(
                        `Remove ${m.displayName}?`,
                        'They lose access to this kitchen straight away.',
                        () => void run(`remove-${m.userId}`, () => removeMember(m.userId)),
                        'Remove',
                      )
                    }
                  />
                ) : null}
              </Row>
            </View>
          ))}
        </Card>
      </Section>

      <Section title="Invite your partner">
        <Card>
          {invite ? (
            <>
              <T variant="small" color="textMuted">
                Share this code. It works once and expires in 48 hours.
              </T>
              <T
                variant="title"
                style={{ textAlign: 'center', letterSpacing: 6, fontSize: 34, lineHeight: 42 }}
                accessibilityLabel={`Invite code ${invite.split('').join(' ')}`}>
                {invite}
              </T>
              <Row style={{ flexWrap: 'wrap' }}>
                <Button
                  title="Share"
                  icon="share-outline"
                  small
                  onPress={() => Share.share({ message: shareText(invite) })}
                />
                <Button
                  title="Copy"
                  icon="copy-outline"
                  kind="secondary"
                  small
                  onPress={async () => {
                    await Clipboard.setStringAsync(invite);
                    showToast('Code copied');
                  }}
                />
                <Button
                  title="New code"
                  kind="ghost"
                  small
                  onPress={() => run('invite', async () => setInvite(await createInvite()))}
                />
              </Row>
            </>
          ) : (
            <Button
              title="Create invite code"
              icon="person-add-outline"
              loading={busy === 'invite'}
              onPress={() => run('invite', async () => setInvite(await createInvite()))}
            />
          )}
        </Card>
      </Section>

      {isOwner ? (
        <Section title="Kitchen name">
          <Row>
            <Input
              value={name}
              onChangeText={setName}
              style={{ flex: 1 }}
              accessibilityLabel="Kitchen name"
            />
            <Button
              title="Save"
              small
              disabled={!name.trim() || name.trim() === household.name}
              loading={busy === 'rename'}
              onPress={() => run('rename', () => rename(name))}
            />
          </Row>
        </Section>
      ) : null}

      <Section title="Join a different kitchen">
        <T variant="small" color="textMuted">
          You&apos;ll leave “{household.name}”.
          {members.length === 1 ? ' As its only member, its data will be deleted.' : ''}
        </T>
        <Row>
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
            placeholder="Invite code"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={6}
            style={{ flex: 1 }}
            accessibilityLabel="Invite code for another kitchen"
          />
          <Button
            title="Join"
            small
            disabled={code.length !== 6}
            loading={busy === 'join'}
            onPress={() =>
              confirm(
                'Switch kitchens?',
                `You'll leave “${household.name}”.`,
                () =>
                  void run('join', async () => {
                    await join(code);
                    router.replace('/');
                  }),
                'Switch',
              )
            }
          />
        </Row>
      </Section>

      <Section title="Account">
        <Card>
          <T variant="label">Change password</T>
          <Input
            value={newPw}
            onChangeText={setNewPw}
            placeholder="New password (at least 8 characters)"
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            accessibilityLabel="New password"
          />
          <Input
            value={newPw2}
            onChangeText={setNewPw2}
            placeholder="Type it again"
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            accessibilityLabel="Repeat new password"
          />
          <Button
            title="Update password"
            small
            kind="secondary"
            disabled={!!passwordProblem(newPw) || newPw !== newPw2}
            loading={busy === 'password'}
            onPress={() =>
              run('password', async () => {
                await updatePassword(newPw);
                setNewPw('');
                setNewPw2('');
                showToast('Password updated');
              })
            }
          />
          <Divider />
          <Button
            title="Sign out"
            icon="log-out-outline"
            kind="secondary"
            onPress={() =>
              confirm(
                'Sign out?',
                pending
                  ? `${pending} change(s) haven't synced yet and will be lost if this phone can't reach the server.`
                  : 'Your kitchen stays in your account; this phone keeps no copy.',
                () => void signOut(),
                'Sign out',
              )
            }
          />
          <Button
            title="Leave this kitchen"
            icon="exit-outline"
            kind="danger"
            loading={busy === 'leave'}
            onPress={() =>
              confirm(
                `Leave “${household.name}”?`,
                members.length === 1
                  ? 'You are the only member, so this kitchen and all its data will be deleted.'
                  : isOwner
                    ? 'Ownership passes to the longest-standing member. They keep all the data.'
                    : 'The others keep all the data. You can start or join another kitchen.',
                () =>
                  void run('leave', async () => {
                    await leave();
                    router.replace('/household-setup');
                  }),
                'Leave',
              )
            }
          />
        </Card>
      </Section>
    </Screen>
  );
}

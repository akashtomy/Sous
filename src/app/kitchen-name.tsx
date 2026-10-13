import { useState } from 'react';

import { Banner, Button, Input, Screen, T } from '@/components/ui';
import { goBackOr } from '@/lib/nav';
import { friendlyAuthError, useAuth } from '@/store/auth';
import { useKitchen } from '@/store/kitchen';
import { MAX_KITCHEN_NAME, renameKitchen, useKitchenName } from '@/store/kitchen-name';

/** Rename the kitchen (everyone in a shared kitchen sees the new name). */
export default function KitchenName() {
  const current = useKitchenName();
  const shared = useAuth((s) => !!s.household);
  const showToast = useKitchen((s) => s.showToast);
  const [name, setName] = useState(current);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clean = name.trim();

  const save = async () => {
    setError(null);
    setBusy(true);
    try {
      await renameKitchen(clean);
      showToast('Kitchen renamed');
      goBackOr('/');
    } catch (e) {
      setError(friendlyAuthError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      footer={
        <Button
          title="Save name"
          icon="checkmark"
          loading={busy}
          disabled={!clean || clean === current}
          onPress={save}
          style={{ flex: 1 }}
        />
      }>
      <T variant="title">Kitchen name</T>
      <T color="textMuted">
        {shared
          ? 'Everyone in this kitchen sees the new name.'
          : 'Shown at the top of Today and Kitchen.'}
      </T>
      {error ? <Banner icon="alert-circle-outline" tone="danger" title={error} /> : null}
      <Input
        value={name}
        onChangeText={setName}
        placeholder="e.g. Akash & Riya's kitchen"
        maxLength={MAX_KITCHEN_NAME}
        autoFocus
        accessibilityLabel="Kitchen name"
        onSubmitEditing={() => clean && clean !== current && void save()}
        returnKeyType="done"
      />
    </Screen>
  );
}

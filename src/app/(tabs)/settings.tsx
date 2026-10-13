import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import {
  Banner,
  Button,
  Card,
  Chip,
  ChipGroup,
  Divider,
  Input,
  Row,
  Screen,
  Section,
  T,
  Toggle,
} from '@/components/ui';
import { INGREDIENTS, RECIPES } from '@/core/catalog';
import { DEFAULT_CLAUDE_MODEL } from '@/core/claude';
import { kitchenDb } from '@/lib/kitchen-db';
import { enableNotifications, notificationsUnavailableReason } from '@/lib/notify';
import { getApiKey, setApiKey } from '@/lib/secrets';
import { confirm } from '@/lib/confirm';
import { useAuth } from '@/store/auth';
import { useKitchen } from '@/store/kitchen';

const SERVICES = ['Swiggy Instamart', 'Zomato', 'Blinkit', 'Zepto', 'BigBasket'];

export default function SettingsScreen() {
  const settings = useKitchen((s) => s.settings);
  const update = useKitchen((s) => s.updateSettings);
  const cartService = useKitchen((s) => s.cartService);
  const household = useAuth((s) => s.household);
  const setCartService = useKitchen((s) => s.setCartService);
  const ai = useKitchen((s) => s.aiRecipes);
  const removeAi = useKitchen((s) => s.removeAiRecipe);
  const resetAll = useKitchen((s) => s.resetAll);
  const showToast = useKitchen((s) => s.showToast);
  const [keyText, setKeyText] = useState('');
  const [model, setModel] = useState(settings.model);
  const [notifyNote, setNotifyNote] = useState<string | null>(null);
  const [storage, setStorage] = useState<{ engine: string; persistent: boolean } | null>(null);

  useEffect(() => {
    kitchenDb.describe().then(setStorage, () => setStorage(null));
  }, []);

  useEffect(() => {
    getApiKey().then((k) => update({ hasApiKey: !!k }));
  }, [update]);

  const saveKey = async () => {
    const k = keyText.trim();
    await setApiKey(k || null);
    update({ hasApiKey: !!k });
    setKeyText('');
    showToast(k ? 'API key saved on this device' : 'API key removed');
  };

  return (
    <Screen>
      <T variant="title">Settings</T>

      <Section title="Shopping">
        <Card>
          <T variant="label">Grocery app for cart filling</T>
          <ChipGroup>
            {SERVICES.map((s) => (
              <Chip
                key={s}
                label={s}
                selected={cartService === s}
                onPress={() => setCartService(s)}
              />
            ))}
          </ChipGroup>
          <T variant="small" color="textMuted">
            Used in the message you paste to Claude. Claude fills the cart through that app’s
            connector, if one is available to you.
          </T>
          <Divider />
          <Toggle
            label="Low-stock notifications"
            hint={
              notificationsUnavailableReason ??
              'Get a notification when cooking takes an item below its alert level.'
            }
            value={settings.notifications && !notificationsUnavailableReason}
            onChange={async (v) => {
              if (!v) return update({ notifications: false });
              if (notificationsUnavailableReason)
                return setNotifyNote(notificationsUnavailableReason);
              const ok = await enableNotifications();
              update({ notifications: ok });
              setNotifyNote(
                ok
                  ? null
                  : 'Notifications are blocked or not supported here. Enable them in your phone settings.',
              );
            }}
          />
          {notifyNote ? (
            <T variant="small" color="danger">
              {notifyNote}
            </T>
          ) : null}
        </Card>
      </Section>

      <Section title="More ideas with Claude (optional)">
        <Card>
          <Toggle
            label="Show “More ideas with Claude”"
            hint="Generates extra recipes from your stock. The built-in recipes always work without it."
            value={settings.claudeEnabled}
            onChange={(v) => update({ claudeEnabled: v })}
          />
          {settings.claudeEnabled ? (
            <>
              <Divider />
              <T variant="label">Anthropic API key {settings.hasApiKey ? '· saved' : ''}</T>
              <Row>
                <Input
                  value={keyText}
                  onChangeText={setKeyText}
                  placeholder={settings.hasApiKey ? 'Paste a new key to replace' : 'sk-ant-…'}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{ flex: 1 }}
                  accessibilityLabel="Anthropic API key"
                />
              </Row>
              <Row>
                <Button title="Save key" small onPress={saveKey} disabled={!keyText.trim()} />
                {settings.hasApiKey ? (
                  <Button
                    title="Remove key"
                    small
                    kind="ghost"
                    onPress={async () => {
                      await setApiKey(null);
                      update({ hasApiKey: false });
                    }}
                  />
                ) : null}
              </Row>
              <Banner
                icon="shield-outline"
                tone="accent"
                title="Personal use only"
                body={
                  Platform.OS === 'web'
                    ? 'On the web the key is kept in this browser and requests go straight from it to Anthropic. Do not use a shared or work key.'
                    : 'Stored in your phone’s secure storage and sent only to Anthropic. Usage is billed to your Anthropic account.'
                }
              />
              <T variant="label">Model</T>
              <Row>
                <Input
                  value={model}
                  onChangeText={setModel}
                  autoCapitalize="none"
                  style={{ flex: 1 }}
                  accessibilityLabel="Claude model"
                  onBlur={() => update({ model: model.trim() || DEFAULT_CLAUDE_MODEL })}
                />
              </Row>
            </>
          ) : null}
        </Card>
        {ai.length ? (
          <Card>
            <T variant="label">Saved AI ideas ({ai.length})</T>
            {ai.slice(0, 12).map((r) => (
              <Row key={r.id} style={{ justifyContent: 'space-between' }}>
                <T
                  variant="small"
                  style={{ flex: 1 }}
                  onPress={() => router.push({ pathname: '/recipe/[id]', params: { id: r.id } })}>
                  {r.name}
                </T>
                <Chip label="Remove" icon="close" tone="danger" onPress={() => removeAi(r.id)} />
              </Row>
            ))}
          </Card>
        ) : null}
      </Section>

      <Section title="Kitchen">
        <Card>
          <T variant="label">Saved on this device</T>
          <T variant="small" color="textMuted">
            {storage
              ? `${storage.engine}${
                  storage.persistent
                    ? ' · kept permanently'
                    : ' · the browser may clear it if space runs low'
                }.`
              : 'Checking…'}{' '}
            {household
              ? `Also synced with “${household.name}”, so it is safe if this device is lost.`
              : 'Not backed up anywhere else.'}
          </T>
          {Platform.OS === 'web' && storage && !storage.persistent ? (
            <Button
              title="Keep data permanently"
              small
              kind="secondary"
              icon="lock-closed-outline"
              onPress={async () => {
                const ok = await kitchenDb.requestPersistence();
                setStorage(await kitchenDb.describe());
                showToast(
                  ok
                    ? 'This browser will keep your kitchen'
                    : 'The browser said no. Installing Sous to your home screen usually helps.',
                );
              }}
            />
          ) : null}
          <Divider />
          {household ? (
            <Button
              title="Household, partner & sign out"
              kind="secondary"
              icon="people-outline"
              onPress={() => router.push('/household')}
            />
          ) : null}
          <Button
            title="Run kitchen setup again"
            kind="secondary"
            icon="refresh"
            onPress={() => router.push('/onboarding')}
          />
          <Button
            title="Reset all data"
            kind="danger"
            icon="trash-outline"
            onPress={() =>
              confirm(
                'Reset everything?',
                household
                  ? `Deletes the inventory, plans, cooking history, ratings, eating-out log and saved ideas of “${household.name}” for everyone in it.`
                  : 'Deletes your inventory, plans, cooking history, ratings, eating-out log and saved ideas on this device.',
                () => {
                  resetAll();
                  router.replace('/onboarding');
                },
                'Reset',
              )
            }
          />
        </Card>
      </Section>

      <Section title="About the recipes">
        <Card>
          <T variant="small" color="textMuted">
            {RECIPES.length} recipes across Indian (every region), Lebanese, Chinese, Continental
            and International cuisines, built on {INGREDIENTS.length} ingredients. Calories are
            estimates computed from USDA FoodData Central and IFCT 2017 values. Health labels follow
            fixed rules for calories, fat, fibre, protein and added sugar.
          </T>
        </Card>
      </Section>
    </Screen>
  );
}

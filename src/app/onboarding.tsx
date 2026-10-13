import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { IngredientSearch } from '@/components/ingredient-picker';
import { CUISINE_LABEL } from '@/components/meal';
import { CUISINES, DIETS, EFFORTS, toggleIn } from '@/components/pref-options';
import {
  Banner,
  Button,
  Card,
  Chip,
  ChipGroup,
  Input,
  Row,
  Screen,
  Section,
  Stepper,
  T,
  Toggle,
} from '@/components/ui';
import { ingredientById } from '@/core/catalog';
import type { Preferences } from '@/core/planner';
import type { Inventory } from '@/core/types';
import { defaultInputUnit, formatQty, toBase } from '@/core/units';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { goBackOr } from '@/lib/nav';
import { friendlyAuthError } from '@/store/auth';
import { todayIso, useKitchen } from '@/store/kitchen';
import { MAX_KITCHEN_NAME, renameKitchen, useKitchenName } from '@/store/kitchen-name';
import { INDIAN_STARTER, ONBOARDING_PICKS } from '@/store/presets';

type Step = 'kitchen' | 'cooking' | 'pantry';
const STEPS: { key: Step; label: string }[] = [
  { key: 'kitchen', label: 'Your kitchen' },
  { key: 'cooking', label: 'How you cook' },
  { key: 'pantry', label: 'Pantry' },
];
type SetupPrefs = Pick<
  Preferences,
  'people' | 'diet' | 'cuisines' | 'maxEffort' | 'mealPrep' | 'prepDay'
>;

/**
 * First-run setup in three steps (kitchen → cooking style → pantry).
 * With `?mode=pantry` it is the bulk pantry editor reached from the Kitchen tab.
 */
export default function Onboarding() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const pantryOnly = mode === 'pantry';
  const theme = useTheme();
  const existing = useKitchen((s) => s.inventory);
  const saved = useKitchen((s) => s.prefs);
  const complete = useKitchen((s) => s.completeOnboarding);
  const setPrefs = useKitchen((s) => s.setPrefs);
  const setStock = useKitchen((s) => s.setStock);
  const removeStock = useKitchen((s) => s.removeStock);
  const showToast = useKitchen((s) => s.showToast);
  const currentName = useKitchenName();

  const [step, setStep] = useState<Step>(pantryOnly ? 'pantry' : 'kitchen');
  const [name, setName] = useState(currentName);
  const [p, setP] = useState<SetupPrefs>({
    people: saved.people,
    diet: saved.diet,
    cuisines: saved.cuisines,
    maxEffort: saved.maxEffort,
    mealPrep: saved.mealPrep,
    prepDay: saved.prepDay,
  });
  const update = (x: Partial<SetupPrefs>) => setP((cur) => ({ ...cur, ...x }));
  const [qty, setQty] = useState<Record<string, number>>(() =>
    Object.fromEntries(Object.values(existing).map((i) => [i.ingredientId, i.qty])),
  );
  const [extra, setExtra] = useState<string[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [starterAdded, setStarterAdded] = useState(false);
  const [busy, setBusy] = useState(false);
  const count = Object.values(qty).filter((n) => n > 0).length;
  const index = STEPS.findIndex((s) => s.key === step);

  const sections = useMemo(() => {
    const listed = new Set(ONBOARDING_PICKS.flatMap((s) => s.ids));
    const others = [...new Set([...extra, ...Object.keys(qty)])].filter((id) => !listed.has(id));
    return others.length
      ? [...ONBOARDING_PICKS, { title: 'Also in your kitchen', ids: others }]
      : ONBOARDING_PICKS;
  }, [extra, qty]);

  const finish = async () => {
    if (pantryOnly) {
      let changed = 0;
      for (const id of new Set([...Object.keys(qty), ...Object.keys(existing)])) {
        const next = qty[id] ?? 0;
        const before = existing[id]?.qty;
        if (next <= 0 && before !== undefined) removeStock(id);
        else if (next > 0 && next !== before) setStock(id, next);
        else continue;
        changed++;
      }
      showToast(changed ? `Kitchen updated · ${changed} item${changed === 1 ? '' : 's'}` : 'No changes');
      goBackOr('/inventory');
      return;
    }
    setBusy(true);
    try {
      await renameKitchen(name);
    } catch (e) {
      // The name can be fixed later; don't block setup on it.
      showToast(friendlyAuthError(e));
    }
    setPrefs(p);
    const today = todayIso();
    const inv: Inventory = {};
    for (const [id, n] of Object.entries(qty))
      if (n > 0) inv[id] = { ingredientId: id, qty: n, addedOn: today };
    complete(inv);
    setBusy(false);
    router.replace('/');
  };

  const next = () => (step === 'pantry' ? void finish() : setStep(STEPS[index + 1].key));
  const back = () => setStep(STEPS[index - 1].key);
  const nextTitle =
    step === 'pantry'
      ? pantryOnly
        ? 'Save changes'
        : count
          ? `Finish · ${count} items`
          : 'Finish without pantry'
      : 'Next';

  return (
    // Keyed by step so each step starts scrolled to the top.
    <Screen
      key={step}
      safeTop
      footer={
        <>
          {pantryOnly ? (
            <Button title="Cancel" kind="secondary" onPress={() => goBackOr('/inventory')} />
          ) : index > 0 ? (
            <Button title="Back" kind="secondary" icon="chevron-back" onPress={back} />
          ) : null}
          <Button
            title={nextTitle}
            icon={step === 'pantry' ? 'checkmark' : 'arrow-forward'}
            onPress={next}
            loading={busy}
            disabled={step === 'kitchen' && !name.trim()}
            style={{ flex: 1 }}
          />
        </>
      }>
      {pantryOnly ? null : (
        <View style={{ gap: Spacing.sm }}>
          <Row gap={6}>
            {STEPS.map((s, i) => (
              <View
                key={s.key}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: Radius.pill,
                  backgroundColor: i <= index ? theme.primary : theme.border,
                }}
              />
            ))}
          </Row>
          <T variant="caption" color="textMuted">
            STEP {index + 1} OF {STEPS.length} · {STEPS[index].label.toUpperCase()}
          </T>
        </View>
      )}

      {step === 'kitchen' ? (
        <>
          <T variant="title">Let’s set up your kitchen</T>
          <T color="textMuted">Three quick steps. You can change any of this later.</T>
          <Section title="Kitchen name">
            <Input
              value={name}
              onChangeText={setName}
              placeholder="e.g. Akash & Riya's kitchen"
              maxLength={MAX_KITCHEN_NAME}
              accessibilityLabel="Kitchen name"
            />
          </Section>
          <Section title="How many people do you cook for?">
            <Stepper value={p.people} onChange={(people) => update({ people })} label="people" />
            <T variant="small" color="textMuted">
              Portions and shopping quantities scale to this.
            </T>
          </Section>
          <Section title="What do you eat?">
            <ChipGroup>
              {DIETS.map((d) => (
                <Chip
                  key={d.v}
                  label={d.label}
                  selected={p.diet === d.v}
                  onPress={() => update({ diet: d.v })}
                />
              ))}
            </ChipGroup>
            <T variant="small" color="textMuted">
              Only dishes that fit are suggested.
            </T>
          </Section>
        </>
      ) : null}

      {step === 'cooking' ? (
        <>
          <T variant="title">How do you cook?</T>
          <T color="textMuted">So weekday suggestions fit your evenings.</T>
          <Section title="Cuisines you enjoy">
            <ChipGroup>
              <Chip
                label="All of them"
                selected={!p.cuisines.length}
                onPress={() => update({ cuisines: [] })}
              />
              {CUISINES.map((c) => (
                <Chip
                  key={c}
                  label={CUISINE_LABEL[c]}
                  selected={p.cuisines.includes(c)}
                  onPress={() => update({ cuisines: toggleIn(p.cuisines, c) })}
                />
              ))}
            </ChipGroup>
          </Section>
          <Section title="Time to cook on a weekday">
            <ChipGroup>
              {EFFORTS.map((e) => (
                <Chip
                  key={e.v}
                  label={e.label}
                  selected={p.maxEffort === e.v}
                  onPress={() => update({ maxEffort: e.v })}
                />
              ))}
            </ChipGroup>
          </Section>
          <Section title="Weekend meal prep">
            <Toggle
              label="Prep on the weekend for quick weekdays"
              hint="Cook dals, grind batter, make masala base and chop veg in one go. Weekday meals then take a fraction of the time."
              value={p.mealPrep}
              onChange={(mealPrep) => update({ mealPrep })}
            />
            {p.mealPrep ? (
              <ChipGroup>
                <Chip
                  label="Saturday"
                  selected={p.prepDay === 'saturday'}
                  onPress={() => update({ prepDay: 'saturday' })}
                />
                <Chip
                  label="Sunday"
                  selected={p.prepDay === 'sunday'}
                  onPress={() => update({ prepDay: 'sunday' })}
                />
              </ChipGroup>
            ) : null}
          </Section>
        </>
      ) : null}

      {step === 'pantry' ? (
        <>
          <T variant="title">{pantryOnly ? 'Update your kitchen' : 'What’s in your kitchen?'}</T>
          <T color="textMuted">
            {pantryOnly
              ? 'Tick what you have and tap an item to set its quantity. Unticked items are removed.'
              : 'Add it once. After that Sous deducts what you cook, and you only add new shopping.'}
          </T>
          {pantryOnly ? null : (
            <Banner
              icon={starterAdded ? 'checkmark-circle' : 'sparkles-outline'}
              tone="primary"
              title="Start from a typical Indian kitchen"
              body="Common staples, dals, spices and vegetables in usual quantities. Untick or edit anything."
              action={
                <Button
                  title={starterAdded ? 'Added' : 'Add'}
                  icon={starterAdded ? 'checkmark' : undefined}
                  small
                  disabled={starterAdded}
                  onPress={() => {
                    setQty((q) => ({ ...INDIAN_STARTER, ...q }));
                    setStarterAdded(true);
                  }}
                />
              }
            />
          )}

          <Section title="Search">
            <IngredientSearch
              onPick={(ing) => {
                setExtra((e) => (e.includes(ing.id) ? e : [...e, ing.id]));
                setQty((q) => (q[ing.id] ? q : { ...q, [ing.id]: INDIAN_STARTER[ing.id] ?? ing.packSizes[0] }));
                setEditing(ing.id);
              }}
            />
          </Section>

          {sections.map((sec) => (
            <Section key={sec.title} title={sec.title}>
              <ChipGroup>
                {sec.ids.map((id) => {
                  const ing = ingredientById(id);
                  if (!ing) return null;
                  const have = (qty[id] ?? 0) > 0;
                  return (
                    <Chip
                      key={id}
                      label={have ? `${ing.name} · ${formatQty(ing, qty[id])}` : ing.name}
                      selected={have}
                      icon={have ? 'checkmark' : 'add'}
                      onPress={() => {
                        if (!have)
                          setQty((q) => ({ ...q, [id]: INDIAN_STARTER[id] ?? ing.packSizes[0] }));
                        setEditing(id);
                      }}
                    />
                  );
                })}
              </ChipGroup>
              {editing && sec.ids.includes(editing) ? (
                <QuickEdit
                  key={editing}
                  id={editing}
                  value={qty[editing] ?? 0}
                  onChange={(n) => setQty((q) => ({ ...q, [editing]: n }))}
                  onDone={() => setEditing(null)}
                />
              ) : null}
            </Section>
          ))}
        </>
      ) : null}
      <View style={{ height: Spacing.xl }} />
    </Screen>
  );
}

function QuickEdit({
  id,
  value,
  onChange,
  onDone,
}: {
  id: string;
  value: number;
  onChange: (n: number) => void;
  onDone: () => void;
}) {
  const ing = ingredientById(id)!;
  const theme = useTheme();
  const unit = defaultInputUnit(ing);
  const factor = toBase(ing, 1, unit);
  const [text, setText] = useState(value ? String(Math.round((value / factor) * 100) / 100) : '');
  const commit = (t: string) => {
    setText(t);
    const n = Number(t.replace(',', '.'));
    if (Number.isFinite(n)) onChange(Math.max(0, n * factor));
  };
  return (
    <Card style={{ backgroundColor: theme.cardAlt }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <T variant="label">{ing.name}</T>
        <Pressable onPress={onDone} accessibilityRole="button" hitSlop={8}>
          <T variant="label" color="primary">
            Done
          </T>
        </Pressable>
      </Row>
      <Row>
        <Input
          value={text}
          onChangeText={commit}
          keyboardType="decimal-pad"
          style={{ flex: 1 }}
          accessibilityLabel={`${ing.name} quantity in ${unit}`}
          autoFocus
        />
        <View
          style={{
            paddingHorizontal: Spacing.md,
            paddingVertical: 12,
            borderRadius: Radius.md,
            backgroundColor: theme.card,
          }}>
          <T variant="label">{unit}</T>
        </View>
      </Row>
      <Row style={{ flexWrap: 'wrap' }}>
        {ing.packSizes.map((size) => (
          <Chip
            key={size}
            label={formatQty(ing, size)}
            onPress={() => commit(String(Math.round((size / factor) * 100) / 100))}
          />
        ))}
        <Chip
          label="Don't have it"
          tone="danger"
          icon="close"
          onPress={() => {
            onChange(0);
            onDone();
          }}
        />
      </Row>
    </Card>
  );
}

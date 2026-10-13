import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import KitchenName from '@/app/kitchen-name';
import Onboarding from '@/app/onboarding';
import Welcome from '@/app/welcome';
import { useAuth } from '@/store/auth';
import { DEFAULT_SETTINGS, useKitchen } from '@/store/kitchen';
import { EMPTY_SHARED } from '@/sync/state';

jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock(
  'react-native-safe-area-context',
  () =>
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('react-native-safe-area-context/jest/mock').default,
);
jest.mock('@/lib/supabase', () => ({ supabase: null, accountsEnabled: false }));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'uuid' }));
jest.mock('expo-web-browser', () => ({ maybeCompleteAuthSession: jest.fn() }));
jest.mock('expo-auth-session', () => ({ makeRedirectUri: () => 'sous://auth-callback' }));

let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  Redirect: ({ href }: { href: string }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Text: T } = require('react-native');
    return <T>{`redirect:${href}`}</T>;
  },
  router: { replace: jest.fn(), push: jest.fn(), back: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => mockParams,
}));

const press = (label: string) => fireEvent.press(screen.getByRole('button', { name: label }));

beforeEach(() => {
  mockParams = {};
  jest.clearAllMocks();
  useAuth.setState({ status: 'disabled', household: undefined });
  useKitchen.setState({
    ...EMPTY_SHARED,
    settings: DEFAULT_SETTINGS,
    pendingOps: [],
    householdId: undefined,
  });
});

describe('Welcome', () => {
  it('without accounts, Get started goes straight to setup', async () => {
    await render(<Welcome />);
    expect(screen.getByText('Plan the week in a minute')).toBeTruthy();
    expect(screen.queryByText('Made for two')).toBeNull();
    expect(screen.queryByRole('button', { name: 'I already have an account' })).toBeNull();
    await press('Get started');
    expect(router.push).toHaveBeenCalledWith('/onboarding');
  });

  it('with accounts, offers sign-up and sign-in', async () => {
    useAuth.setState({ status: 'signedOut' });
    await render(<Welcome />);
    expect(screen.getByText('Made for two')).toBeTruthy();
    await press('Get started');
    expect(router.push).toHaveBeenCalledWith({ pathname: '/login', params: { mode: 'signup' } });
    await press('I already have an account');
    expect(router.push).toHaveBeenCalledWith({ pathname: '/login', params: { mode: 'signin' } });
  });

  it('skips itself once the kitchen is set up', async () => {
    useKitchen.setState({ onboarded: true });
    await render(<Welcome />);
    expect(screen.getByText('redirect:/')).toBeTruthy();
  });
});

describe('Setup', () => {
  it('walks through kitchen, cooking style and pantry, then saves everything', async () => {
    await render(<Onboarding />);
    expect(screen.getByText('STEP 1 OF 3 · YOUR KITCHEN')).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Kitchen name'), 'Akash & Riya');
    await press('Increase people');
    await press('Non-veg');
    await press('Next');

    expect(screen.getByText('STEP 2 OF 3 · HOW YOU COOK')).toBeTruthy();
    await press('Indian');
    await press('Some effort (≤ 45 min)');
    await press('Back');
    expect(screen.getByLabelText('Kitchen name').props.value).toBe('Akash & Riya');
    await press('Next');
    await press('Next');

    expect(screen.getByText('STEP 3 OF 3 · PANTRY')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Finish without pantry' })).toBeTruthy();
    await press('Add');
    expect(screen.getByRole('button', { name: 'Added' })).toBeTruthy();
    const finish = screen.getByRole('button', { name: /^Finish · \d+ items$/ });
    await fireEvent.press(finish);

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/'));
    const s = useKitchen.getState();
    expect(s.settings.kitchenName).toBe('Akash & Riya');
    expect(s.prefs).toMatchObject({ people: 3, diet: 'nonveg', cuisines: ['indian'], maxEffort: 'moderate' });
    expect(s.onboarded).toBe(true);
    expect(Object.keys(s.inventory).length).toBeGreaterThan(40);
  });

  it('as the bulk pantry editor, only changes what was touched', async () => {
    mockParams = { mode: 'pantry' };
    useKitchen.setState({
      onboarded: true,
      inventory: {
        onion: { ingredientId: 'onion', qty: 1000, addedOn: '2026-10-01' },
        rice: { ingredientId: 'rice', qty: 5000, addedOn: '2026-10-01' },
      },
    });
    await render(<Onboarding />);
    expect(screen.queryByText(/STEP 1 OF 3/)).toBeNull();
    await press('Onion · 1 kg');
    await press("Don't have it");
    await press('Save changes');
    const inv = useKitchen.getState().inventory;
    expect(inv.onion).toBeUndefined();
    expect(inv.rice).toEqual({ ingredientId: 'rice', qty: 5000, addedOn: '2026-10-01' });
    expect(router.back).toHaveBeenCalled();
  });
});

describe('Kitchen name', () => {
  it('renames a single-device kitchen', async () => {
    await render(<KitchenName />);
    expect(screen.getByLabelText('Kitchen name').props.value).toBe('Our kitchen');
    await fireEvent.changeText(screen.getByLabelText('Kitchen name'), '  Sunday   Kitchen ');
    await press('Save name');
    await waitFor(() => expect(useKitchen.getState().settings.kitchenName).toBe('Sunday Kitchen'));
  });

  it('renames the shared kitchen for everyone', async () => {
    const renameHousehold = jest.fn().mockResolvedValue(undefined);
    useAuth.setState({
      status: 'signedIn',
      household: { id: 'h1', name: 'Old name', role: 'member' },
      renameHousehold,
    });
    await render(<KitchenName />);
    expect(screen.getByText('Everyone in this kitchen sees the new name.')).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Kitchen name'), 'New name');
    await press('Save name');
    await waitFor(() => expect(renameHousehold).toHaveBeenCalledWith('New name'));
  });
});

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import HouseholdScreen from '@/app/household';
import HouseholdSetup from '@/app/household-setup';
import Login from '@/app/login';
import { useAuth } from '@/store/auth';
import { useKitchen } from '@/store/kitchen';
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
jest.mock('@/lib/supabase', () => ({ supabase: null, accountsEnabled: true }));
jest.mock('expo-crypto', () => ({
  randomUUID: () => 'uuid',
  getRandomBytes: () => new Uint8Array(32),
}));
jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync: jest.fn(),
}));
jest.mock('expo-auth-session', () => ({ makeRedirectUri: () => 'sous://auth-callback' }));
jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn() }));
jest.mock('expo-router', () => ({
  Redirect: ({ href }: { href: string }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Text: T } = require('react-native');
    return <T>{`redirect:${href}`}</T>;
  },
  router: { replace: jest.fn(), push: jest.fn(), back: jest.fn(), canGoBack: () => false },
  useLocalSearchParams: () => ({}),
}));

const press = (label: string) => fireEvent.press(screen.getByRole('button', { name: label }));
// RNTL v14: render, fireEvent and unmount are async.

beforeEach(() => {
  useKitchen.setState({
    ...EMPTY_SHARED,
    pendingOps: [],
    householdId: undefined,
    syncError: undefined,
  });
});

describe('Login', () => {
  it('signs in with a username; Google is off by default', async () => {
    useAuth.setState({ status: 'signedOut' });
    await render(<Login />);
    expect(screen.getByText('Sous')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Continue with Google' })).toBeNull();
    expect(screen.getByLabelText('Username')).toBeTruthy();
    expect(screen.queryByLabelText('Confirm password')).toBeNull();
  });

  it('creating an account checks the username rules and availability', async () => {
    jest.useFakeTimers();
    const isUsernameAvailable = jest.fn(async (u: string) => u.toLowerCase() !== 'riya');
    const signUp = jest.fn().mockResolvedValue(undefined);
    useAuth.setState({ status: 'signedOut', isUsernameAvailable, signUp });
    await render(<Login />);
    await press('Create account');
    await fireEvent.changeText(screen.getByLabelText('Username'), 'ab');
    expect(screen.getByText('At least 3 characters.')).toBeTruthy();

    await fireEvent.changeText(screen.getByLabelText('Username'), 'Riya');
    await act(async () => jest.advanceTimersByTime(450));
    await waitFor(() => expect(screen.getByText('@riya is taken')).toBeTruthy());

    await fireEvent.changeText(screen.getByLabelText('Username'), 'riya_k');
    await act(async () => jest.advanceTimersByTime(450));
    await waitFor(() => expect(screen.getByText('@riya_k is available')).toBeTruthy());

    await fireEvent.changeText(screen.getByLabelText('Password'), 'longenough');
    await fireEvent.changeText(screen.getByLabelText('Confirm password'), 'different');
    expect(screen.getByText("The passwords don't match.")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Confirm password'), 'longenough');
    const submit = screen.getAllByRole('button', { name: 'Create account' })[1];
    await fireEvent.press(submit);
    expect(signUp).toHaveBeenCalledWith('riya_k', 'longenough');
    jest.useRealTimers();
  });

  it('shows a friendly message when sign-in fails', async () => {
    const signIn = jest.fn().mockRejectedValue(new Error('Invalid login credentials'));
    useAuth.setState({ status: 'signedOut', signIn });
    await render(<Login />);
    await fireEvent.changeText(screen.getByLabelText('Username'), 'riya');
    await fireEvent.changeText(screen.getByLabelText('Password'), 'x');
    await fireEvent.press(screen.getAllByRole('button', { name: 'Sign in' })[1]);
    await waitFor(() => expect(screen.getByText('Wrong username or password.')).toBeTruthy());
    expect(signIn).toHaveBeenCalledWith('riya', 'x');
  });

  it('steers people who type an email towards a username', async () => {
    const signUp = jest.fn();
    useAuth.setState({ status: 'signedOut', signUp });
    await render(<Login />);
    await press('Create account');
    await fireEvent.changeText(screen.getByLabelText('Username'), 'Akash27@gmail.com');
    expect(screen.getByText('Pick a username, not an email. For example: akash27')).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Password'), 'longenough');
    await fireEvent.changeText(screen.getByLabelText('Confirm password'), 'longenough');
    await fireEvent.press(screen.getAllByRole('button', { name: 'Create account' })[1]);
    expect(signUp).not.toHaveBeenCalled();
  });

  it('explains Supabase setup problems instead of showing raw errors', async () => {
    const signUp = jest
      .fn()
      .mockRejectedValueOnce(new Error('Email address "akash27@users.sous.app" is invalid'))
      .mockRejectedValueOnce(new Error('email rate limit exceeded'))
      .mockRejectedValueOnce(
        new Error('Could not find the function public.username_available(p_username) in the schema cache'),
      );
    useAuth.setState({ status: 'signedOut', signUp, isUsernameAvailable: async () => true });
    await render(<Login />);
    await press('Create account');
    await fireEvent.changeText(screen.getByLabelText('Username'), 'akash27');
    await fireEvent.changeText(screen.getByLabelText('Password'), 'longenough');
    await fireEvent.changeText(screen.getByLabelText('Confirm password'), 'longenough');
    const submit = () => fireEvent.press(screen.getAllByRole('button', { name: 'Create account' })[1]);
    await submit();
    await waitFor(() => expect(screen.getByText(/turned off in Supabase/)).toBeTruthy());
    await submit();
    await waitFor(() => expect(screen.getByText(/turned off in Supabase/)).toBeTruthy());
    await submit();
    await waitFor(() => expect(screen.getByText(/database isn’t set up yet/)).toBeTruthy());
  });

  it('leaves the login screen once signed in', async () => {
    useAuth.setState({ status: 'signedIn' });
    await render(<Login />);
    expect(screen.getByText('redirect:/')).toBeTruthy();
  });
});

describe('Household setup', () => {
  it('joins with a 6-character code (uppercased, cleaned)', async () => {
    const joinHousehold = jest.fn().mockResolvedValue(undefined);
    useAuth.setState({
      status: 'signedIn',
      username: 'akash',
      household: undefined,
      joinHousehold,
    });
    await render(<HouseholdSetup />);
    const join = screen.getByRole('button', { name: 'Join kitchen' });
    expect(join.props.accessibilityState?.disabled).toBe(true);
    await fireEvent.changeText(screen.getByLabelText('Invite code'), 'abc-23x');
    await press('Join kitchen');
    await waitFor(() => expect(joinHousehold).toHaveBeenCalledWith('ABC23X'));
  });

  it('offers to bring this phone’s data only when there is some', async () => {
    const createHousehold = jest.fn().mockResolvedValue(undefined);
    useAuth.setState({
      status: 'signedIn',
      username: 'akash',
      household: undefined,
      createHousehold,
    });
    const { unmount } = await render(<HouseholdSetup />);
    expect(screen.queryByText('Bring the kitchen data on this phone')).toBeNull();
    await unmount();

    useKitchen.setState({
      onboarded: true,
      inventory: { rice: { ingredientId: 'rice', qty: 1000 } },
    });
    await render(<HouseholdSetup />);
    expect(screen.getByText('Bring the kitchen data on this phone')).toBeTruthy();
    expect(screen.getByLabelText('Kitchen name').props.value).toBe("akash's kitchen");
    await press('Create kitchen');
    await waitFor(() => expect(createHousehold).toHaveBeenCalledWith("akash's kitchen", true));
  });
});

describe('Household screen', () => {
  const base = {
    status: 'signedIn' as const,
    username: 'akash',
    household: { id: 'h1', name: 'Our kitchen', role: 'owner' as const },
    members: [
      { userId: 'a', displayName: 'Akash', role: 'owner' as const, isMe: true },
      { userId: 'b', displayName: 'Partner', role: 'member' as const, isMe: false },
    ],
  };

  it('lists people, lets the owner remove others, and creates an invite code', async () => {
    const createInvite = jest.fn().mockResolvedValue('ABC234');
    useAuth.setState({ ...base, createInvite });
    await render(<HouseholdScreen />);
    expect(screen.getByText('Akash (you)')).toBeTruthy();
    expect(screen.getByText('Partner')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Remove' })).toHaveLength(1);
    await press('Create invite code');
    await waitFor(() => expect(screen.getByText('ABC234')).toBeTruthy());
    expect(screen.getByText('All changes saved')).toBeTruthy();
  });

  it('members cannot remove people but can rename the kitchen; pending sync is shown', async () => {
    const renameHousehold = jest.fn().mockResolvedValue(undefined);
    useAuth.setState({ ...base, household: { ...base.household, role: 'member' }, renameHousehold });
    useKitchen.setState({ pendingOps: [{ id: '1', type: 'shopping.clear' }] });
    await render(<HouseholdScreen />);
    expect(screen.queryByRole('button', { name: 'Remove' })).toBeNull();
    expect(screen.getByText('1 change waiting to sync')).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Kitchen name'), '  Akash & Riya  ');
    await press('Save');
    await waitFor(() => expect(renameHousehold).toHaveBeenCalledWith('Akash & Riya'));
  });

  it('sends people without a kitchen to setup', async () => {
    useAuth.setState({ ...base, household: undefined });
    await render(<HouseholdScreen />);
    expect(screen.getByText('redirect:/household-setup')).toBeTruthy();
  });
});

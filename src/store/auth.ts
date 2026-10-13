// Accounts, the household (shared kitchen) and partners. Only active when Supabase is configured.
import type { Session } from '@supabase/supabase-js';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { create } from 'zustand';

import { GOOGLE_SIGN_IN, USERNAME_EMAIL_DOMAIN } from '@/config/features';
import { normaliseUsername, usernameToEmail } from '@/core/username';
import { supabase } from '@/lib/supabase';
import { SyncEngine } from '@/sync/engine';
import { EMPTY_SHARED, opsToUpload, pickShared, type Op } from '@/sync/state';

import { useKitchen } from './kitchen';

WebBrowser.maybeCompleteAuthSession();

export interface Member {
  userId: string;
  displayName: string;
  role: 'owner' | 'member';
  isMe: boolean;
}

export interface Household {
  id: string;
  name: string;
  role: 'owner' | 'member';
}

interface AuthState {
  /** 'disabled' = no Supabase config: single-device mode. */
  status: 'disabled' | 'loading' | 'signedOut' | 'signedIn';
  userId?: string;
  /** The account's username (or, for Google accounts, the name part of the email). */
  username?: string;
  household?: Household;
  members: Member[];
  /** Household lookup finished for the signed-in user. */
  householdLoaded: boolean;
  /** Opened from a password-reset link: ask for a new password. */
  recovering: boolean;

  init: () => void;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (username: string, password: string) => Promise<void>;
  /** Server check used while typing a new username; true when free (or when it can't tell). */
  isUsernameAvailable: (username: string) => Promise<boolean>;
  /** Only when the GOOGLE_SIGN_IN feature flag is on. */
  signInWithGoogle: () => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  /** Handles tokens in an incoming deep link (email confirmation, password reset). */
  handleAuthUrl: (url: string) => Promise<void>;
  signOut: () => Promise<void>;
  loadHousehold: () => Promise<void>;
  createHousehold: (name: string, bringDeviceData: boolean) => Promise<void>;
  joinHousehold: (code: string) => Promise<void>;
  createInvite: () => Promise<string>;
  renameHousehold: (name: string) => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
  leaveHousehold: () => Promise<void>;
}

let engine: SyncEngine | undefined;
let initialised = false;

/** Where auth links and OAuth return to: the web origin, or the app's deep link (Expo Go: exp://…). */
export function authRedirectUrl(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined')
    return `${window.location.origin}/auth-callback`;
  return makeRedirectUri({ path: 'auth-callback' });
}

/** Turns Supabase/Postgres errors into something a person can act on. */
export function friendlyAuthError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String((e as { message?: string })?.message ?? e);
  if (/invalid login credentials/i.test(msg)) return 'Wrong username or password.';
  if (/username_taken|already registered|already been registered|database error saving new user/i.test(msg))
    return 'That username is taken. Try another one.';
  // Supabase validates (and refuses) the internal username address only when it tries to mail it,
  // i.e. when "Confirm email" is still on.
  if (/email not confirmed|confirm_email_on|email_address_invalid|email address .* is invalid/i.test(msg))
    return 'Sign-up needs “Confirm email” turned off in Supabase (Authentication → Sign In / Providers → Email).';
  if (/PGRST202|could not find the function|schema cache/i.test(msg))
    return 'The Sous database isn’t set up yet. Run the SQL files in supabase/migrations in the Supabase SQL Editor.';
  if (/google_disabled/.test(msg)) return 'Google sign-in is turned off.';
  if (/password should be at least|weak password/i.test(msg))
    return 'Choose a stronger password (at least 8 characters).';
  if (/invalid_or_expired_code/.test(msg))
    return 'That code is wrong or has expired. Ask your partner for a new one.';
  if (/household_full/.test(msg)) return 'That kitchen already has the maximum of 6 people.';
  if (/already_in_household/.test(msg)) return 'You already belong to a kitchen.';
  if (/owner_only/.test(msg)) return 'Only the kitchen’s owner can do that.';
  if (/rate limit|too many/i.test(msg))
    return 'Too many attempts. Please wait a minute and try again.';
  if (/network|fetch/i.test(msg)) return 'Can’t reach the server. Check your connection.';
  return msg;
}

function clearKitchen(householdId?: string) {
  useKitchen.setState({
    ...EMPTY_SHARED,
    pendingOps: [],
    householdId,
    lastSyncedAt: undefined,
    syncError: undefined,
  });
}

async function startEngine(householdId: string) {
  if (!supabase) return;
  if (engine?.householdId === householdId) return;
  engine?.stop();
  engine = new SyncEngine(supabase, householdId, {
    onMembersChanged: () => void useAuth.getState().loadHousehold(),
    onLostAccess: () => void useAuth.getState().loadHousehold(),
  });
  await engine.start();
}

function stopEngine() {
  engine?.stop();
  engine = undefined;
}

/** Unwraps a Supabase response: throws its error, or returns the success branch's data. */
function must<R extends { data: unknown; error: unknown }>(
  res: R,
): Extract<R, { error: null }>['data'] {
  if (res.error) throw res.error;
  return res.data as Extract<R, { error: null }>['data'];
}

export const useAuth = create<AuthState>()((set, get) => ({
  status: supabase ? 'loading' : 'disabled',
  members: [],
  householdLoaded: false,
  recovering: false,

  init: () => {
    if (!supabase || initialised) return;
    initialised = true;
    const apply = (session: Session | null) => {
      const uid = session?.user.id;
      if (!uid) {
        stopEngine();
        set({
          status: 'signedOut',
          userId: undefined,
          username: undefined,
          household: undefined,
          members: [],
          householdLoaded: false,
        });
        return;
      }
      const changed = uid !== get().userId;
      const meta = session.user.user_metadata as { username?: string } | undefined;
      set({
        status: 'signedIn',
        userId: uid,
        username: meta?.username ?? session.user.email?.split('@')[0],
      });
      // Supabase advises against awaiting other calls inside the auth callback.
      if (changed) setTimeout(() => void get().loadHousehold(), 0);
    };
    supabase.auth.getSession().then(({ data }) => apply(data.session));
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') set({ recovering: true });
      apply(session);
    });
  },

  signIn: async (username, password) => {
    must(
      await supabase!.auth.signInWithPassword({
        email: usernameToEmail(username, USERNAME_EMAIL_DOMAIN),
        password,
      }),
    );
  },

  isUsernameAvailable: async (username) => {
    const { data, error } = await supabase!.rpc('username_available', {
      p_username: normaliseUsername(username),
    });
    return error ? true : data !== false;
  },

  signUp: async (username, password) => {
    const u = normaliseUsername(username);
    if (!(await get().isUsernameAvailable(u))) throw new Error('username_taken');
    const data = must(
      await supabase!.auth.signUp({
        email: usernameToEmail(u, USERNAME_EMAIL_DOMAIN),
        password,
        options: { data: { username: u, display_name: u } },
      }),
    );
    // No session means Supabase is waiting for an email confirmation that can never arrive.
    if (!data.session) throw new Error('confirm_email_on');
  },

  signInWithGoogle: async () => {
    if (!GOOGLE_SIGN_IN) throw new Error('google_disabled');
    const redirectTo = authRedirectUrl();
    if (Platform.OS === 'web') {
      // The page navigates to Google and comes back to /auth-callback with the session.
      must(await supabase!.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } }));
      return;
    }
    const data = must(
      await supabase!.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      }),
    );
    const result = await WebBrowser.openAuthSessionAsync(data.url ?? '', redirectTo);
    if (result.type === 'success') await get().handleAuthUrl(result.url);
  },

  handleAuthUrl: async (url) => {
    const { params, errorCode } = QueryParams.getQueryParams(url);
    if (errorCode) throw new Error(params.error_description ?? errorCode);
    if (!params.access_token) return;
    must(
      await supabase!.auth.setSession({
        access_token: params.access_token,
        refresh_token: params.refresh_token,
      }),
    );
    if (params.type === 'recovery') set({ recovering: true });
  },


  updatePassword: async (password) => {
    must(await supabase!.auth.updateUser({ password }));
    set({ recovering: false });
  },

  signOut: async () => {
    await engine?.flush();
    stopEngine();
    // Nothing from this kitchen stays on the device after signing out.
    clearKitchen(undefined);
    await supabase?.auth.signOut();
  },

  loadHousehold: async () => {
    const uid = get().userId;
    if (!supabase || !uid) return;
    const mine = await supabase
      .from('household_members')
      .select('household_id, role, households(name)')
      .eq('user_id', uid)
      .maybeSingle();
    if (mine.error) {
      // Offline: keep using the cached kitchen if it belongs to this user's last household.
      const cached = useKitchen.getState().householdId;
      if (cached && !get().household) {
        set({
          household: { id: cached, name: 'Your kitchen', role: 'member' },
          householdLoaded: true,
        });
        void startEngine(cached);
      }
      return;
    }
    if (!mine.data) {
      stopEngine();
      const cached = useKitchen.getState().householdId;
      // Removed from a household (or it was deleted): don't keep its data on this device.
      if (cached) clearKitchen(undefined);
      set({ household: undefined, members: [], householdLoaded: true });
      return;
    }
    const row = mine.data as unknown as {
      household_id: string;
      role: 'owner' | 'member';
      households: { name: string } | null;
    };
    const household: Household = {
      id: row.household_id,
      name: row.households?.name ?? 'Our kitchen',
      role: row.role,
    };
    if (useKitchen.getState().householdId !== household.id) clearKitchen(household.id);

    const memberRows = await supabase
      .from('household_members')
      .select('user_id, role, joined_at')
      .eq('household_id', household.id)
      .order('joined_at');
    const ids = (memberRows.data ?? []).map((m) => m.user_id as string);
    const profiles = ids.length
      ? await supabase.from('profiles').select('id, display_name').in('id', ids)
      : { data: [] };
    const names = new Map(
      (profiles.data ?? []).map((p) => [p.id as string, p.display_name as string]),
    );
    set({
      household,
      householdLoaded: true,
      members: (memberRows.data ?? []).map((m) => ({
        userId: m.user_id as string,
        displayName: names.get(m.user_id as string) || 'Partner',
        role: m.role as 'owner' | 'member',
        isMe: m.user_id === uid,
      })),
    });
    await startEngine(household.id);
  },

  createHousehold: async (name, bringDeviceData) => {
    const local = pickShared(useKitchen.getState());
    const hid = must(await supabase!.rpc('create_household', { p_name: name })) as string;
    if (bringDeviceData) {
      // Keep what's on screen and upload it as this household's first changes.
      const ops: Op[] = opsToUpload(local).map((o) => ({ ...o, id: Crypto.randomUUID() }) as Op);
      useKitchen.setState({ householdId: hid, pendingOps: ops, lastSyncedAt: undefined });
    } else {
      clearKitchen(hid);
    }
    await get().loadHousehold();
  },

  joinHousehold: async (code) => {
    const hid = must(
      await supabase!.rpc('join_household', { p_code: code.trim().toUpperCase() }),
    ) as string;
    stopEngine();
    clearKitchen(hid);
    await get().loadHousehold();
  },

  createInvite: async () => must(await supabase!.rpc('create_invite')) as string,

  renameHousehold: async (name) => {
    must(await supabase!.rpc('rename_household', { p_name: name }));
    await get().loadHousehold();
  },

  removeMember: async (userId) => {
    must(await supabase!.rpc('remove_member', { p_user: userId }));
    await get().loadHousehold();
  },

  leaveHousehold: async () => {
    await engine?.flush();
    must(await supabase!.rpc('leave_household'));
    stopEngine();
    clearKitchen(undefined);
    set({ household: undefined, members: [] });
  },
}));

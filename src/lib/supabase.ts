// Supabase client. Accounts are enabled when EXPO_PUBLIC_SUPABASE_URL and a key are set
// (see .env.example); without them the app runs in single-device mode.
import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import aesjs from 'aes-js';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { AppState, Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Session storage for phones. Supabase sessions are larger than SecureStore's 2 KB limit, so
 * (as Supabase's Expo guide recommends) the session is AES-encrypted into AsyncStorage and
 * only the 256-bit key lives in the Keychain / Keystore.
 */
class LargeSecureStore {
  private async encrypt(storageKey: string, value: string) {
    const encryptionKey = Crypto.getRandomBytes(256 / 8);
    const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(1));
    const encrypted = cipher.encrypt(aesjs.utils.utf8.toBytes(value));
    await SecureStore.setItemAsync(storageKey, aesjs.utils.hex.fromBytes(encryptionKey));
    return aesjs.utils.hex.fromBytes(encrypted);
  }

  private async decrypt(storageKey: string, value: string) {
    const keyHex = await SecureStore.getItemAsync(storageKey);
    if (!keyHex) return null;
    const cipher = new aesjs.ModeOfOperation.ctr(
      aesjs.utils.hex.toBytes(keyHex),
      new aesjs.Counter(1),
    );
    return aesjs.utils.utf8.fromBytes(cipher.decrypt(aesjs.utils.hex.toBytes(value)));
  }

  async getItem(storageKey: string) {
    const encrypted = await AsyncStorage.getItem(storageKey);
    return encrypted ? this.decrypt(storageKey, encrypted) : null;
  }

  async setItem(storageKey: string, value: string) {
    await AsyncStorage.setItem(storageKey, await this.encrypt(storageKey, value));
  }

  async removeItem(storageKey: string) {
    await AsyncStorage.removeItem(storageKey);
    await SecureStore.deleteItemAsync(storageKey);
  }
}

const isWeb = Platform.OS === 'web';

export const supabase: SupabaseClient | null =
  url && key
    ? createClient(url, key, {
        auth: {
          // Web keeps the default (localStorage) and reads OAuth/recovery tokens from the URL.
          ...(isWeb ? {} : { storage: new LargeSecureStore() }),
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: isWeb,
          flowType: 'implicit',
        },
      })
    : null;

export const accountsEnabled = !!supabase;

// Phones: refresh tokens only while the app is in the foreground (Supabase recommendation).
if (supabase && !isWeb) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

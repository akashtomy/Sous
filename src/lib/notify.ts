// Opt-in local notifications for low stock. Web shows the in-app banner only.
//
// expo-notifications is loaded lazily: since SDK 53, merely importing it throws inside
// Expo Go on Android, which would crash the app at startup. There we skip notifications
// entirely (the in-app refill banner still works); development/store builds get them.
import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

type NotificationsModule = typeof import('expo-notifications');

/** Why notifications can't be offered here, or undefined when they can. */
export const notificationsUnavailableReason: string | undefined =
  Platform.OS === 'android' && isRunningInExpoGo()
    ? 'Not available in Expo Go on Android. Use a development build to get stock alerts on this phone.'
    : undefined;

let mod: NotificationsModule | null | undefined;
let handlerSet = false;

function load(): NotificationsModule | null {
  if (mod !== undefined) return mod;
  if (notificationsUnavailableReason) return (mod = null);
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require('expo-notifications') as NotificationsModule;
  } catch {
    mod = null;
  }
  return mod;
}

function ensureHandler(n: NotificationsModule) {
  if (handlerSet) return;
  n.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  handlerSet = true;
}

/** Asks for permission; returns whether notifications can be shown. */
export async function enableNotifications(): Promise<boolean> {
  const n = load();
  if (!n) return false;
  try {
    ensureHandler(n);
    if (Platform.OS === 'android') {
      await n.setNotificationChannelAsync('stock', {
        name: 'Kitchen stock alerts',
        importance: n.AndroidImportance.DEFAULT,
      });
    }
    const current = await n.getPermissionsAsync();
    if (current.status === 'granted') return true;
    const asked = await n.requestPermissionsAsync();
    return asked.status === 'granted';
  } catch {
    return false;
  }
}

export async function notifyLowStock(names: string[]): Promise<void> {
  if (!names.length) return;
  const n = load();
  if (!n) return;
  try {
    ensureHandler(n);
    const shown = names.slice(0, 4).join(', ');
    await n.scheduleNotificationAsync({
      content: {
        title: 'Running low in your kitchen',
        body:
          names.length > 4
            ? `${shown} and ${names.length - 4} more. Open the shopping list to refill.`
            : `${shown}. Open the shopping list to refill.`,
      },
      // Immediate delivery; Android needs the channel on the trigger.
      trigger: Platform.OS === 'android' ? { channelId: 'stock' } : null,
    });
  } catch {
    // Notification failures never block cooking.
  }
}

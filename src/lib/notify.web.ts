// Web: no system notifications; the in-app refill banner covers alerts.
export const notificationsUnavailableReason: string | undefined =
  'Phone only. On the web you see the in-app banner.';

export async function enableNotifications(): Promise<boolean> {
  return false;
}

export async function notifyLowStock(_names: string[]): Promise<void> {}

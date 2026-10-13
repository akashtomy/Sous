// The kitchen's name: the household's name in a shared kitchen, a device setting otherwise.
import { useAuth } from './auth';
import { useKitchen } from './kitchen';

export const DEFAULT_KITCHEN_NAME = 'Our kitchen';
export const MAX_KITCHEN_NAME = 40;

export function useKitchenName(): string {
  const shared = useAuth((s) => s.household?.name);
  const local = useKitchen((s) => s.settings.kitchenName);
  return shared ?? local ?? DEFAULT_KITCHEN_NAME;
}

/** Renames the kitchen for everyone in it (or on this device without an account). */
export async function renameKitchen(name: string): Promise<void> {
  const clean = name.trim().replace(/\s+/g, ' ').slice(0, MAX_KITCHEN_NAME);
  if (!clean) return;
  const auth = useAuth.getState();
  if (auth.household) {
    if (clean !== auth.household.name) await auth.renameHousehold(clean);
  } else {
    useKitchen.getState().updateSettings({ kitchenName: clean });
  }
}

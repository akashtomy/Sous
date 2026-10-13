import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

const noop = () => () => {};

/**
 * To support static rendering, the scheme is 'light' during server render and the real
 * value once running on the client.
 */
export function useColorScheme() {
  const isClient = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
  const colorScheme = useRNColorScheme();
  return isClient ? colorScheme : 'light';
}

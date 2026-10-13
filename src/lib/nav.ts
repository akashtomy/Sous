import { router, type Href } from 'expo-router';

/** Go back when there is history (normal in-app flow); otherwise open `fallback` (deep link, refresh). */
export function goBackOr(fallback: Href) {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}

import { router } from 'expo-router';

/**
 * Back to the previous screen, or Home when there is none (a screen opened straight from a link or,
 * in Phase 4, a notification). A bare router.back() there throws "GO_BACK was not handled".
 */
export function goBackOrHome(): void {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

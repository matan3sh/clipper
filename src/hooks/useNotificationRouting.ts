import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { syncAllReminders, voucherIdOf } from '@/lib/notifications';
import { useHydrated } from '@/lib/store';

function openVoucher(response: Notifications.NotificationResponse): void {
  if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
  const id = voucherIdOf(response.notification.request.content);
  if (id) router.push({ pathname: '/voucher/[id]', params: { id } });
}

/**
 * Root-level notification wiring, enabled once the navigator is mounted:
 * - rebuilds the reminder schedule from the saved vouchers at launch and on every return to the
 *   foreground (asks for permission the first time)
 * - opens Detail when a reminder is tapped, including the tap that launched the app
 */
export function useNotificationRouting(navigatorReady: boolean): void {
  const hydrated = useHydrated();
  const ready = navigatorReady && hydrated;

  useEffect(() => {
    if (!ready) return;
    const sync = () =>
      syncAllReminders().catch((error: unknown) => console.warn('Clippr: could not schedule reminders', error));
    sync();
    // Coming back to the app can mean permission changed (including the first prompt being answered).
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') sync();
    });
    return () => subscription.remove();
  }, [ready]);

  useEffect(() => {
    if (!navigatorReady) return;
    const launch = Notifications.getLastNotificationResponse();
    if (launch) {
      openVoucher(launch);
      // Otherwise a reload would reopen the same voucher.
      Notifications.clearLastNotificationResponse();
    }
    const subscription = Notifications.addNotificationResponseReceivedListener(openVoucher);
    return () => subscription.remove();
  }, [navigatorReady]);
}

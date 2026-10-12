import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { getNotificationStatus, type NotificationStatus } from '@/lib/notifications';

/**
 * The current notification permission, re-read whenever the app returns to the foreground
 * (so a change made in iOS Settings shows up without a relaunch). `null` until the first read.
 */
export function useNotificationStatus(): { status: NotificationStatus | null; refresh: () => void } {
  const [status, setStatus] = useState<NotificationStatus | null>(null);

  const refresh = useCallback(() => {
    getNotificationStatus()
      .then(setStatus)
      .catch((error: unknown) => console.warn('Clippr: could not read notification permission', error));
  }, []);

  useEffect(() => {
    refresh();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  return { status, refresh };
}

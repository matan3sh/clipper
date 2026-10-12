import * as Notifications from 'expo-notifications';

import { notificationText, upcomingReminders, type UpcomingReminder } from '@/lib/reminders';
import { useClipprStore } from '@/lib/store';
import type { Voucher } from '@/types/voucher';

/** iOS keeps at most 64 pending local notifications per app; stay under it and keep the soonest. */
const MAX_SCHEDULED = 60;

/** Shows reminders as a banner even while Clippr is open. Call once, before anything is scheduled. */
export function configureNotifications(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

function isAllowed(status: Notifications.NotificationPermissionsStatus): boolean {
  return status.granted || status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

export type NotificationStatus = 'granted' | 'denied' | 'undetermined';

/** Reads the current permission without prompting, for the Settings and Alerts status. */
export async function getNotificationStatus(): Promise<NotificationStatus> {
  const current = await Notifications.getPermissionsAsync();
  if (isAllowed(current)) return 'granted';
  return current.canAskAgain ? 'undetermined' : 'denied';
}

/** True when reminders can be shown. Asks the first time; never asks again once the user has answered. */
export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (isAllowed(current) || !current.canAskAgain) return isAllowed(current);
  const next = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  });
  return isAllowed(next);
}

/** The voucher id a delivered or scheduled notification belongs to, if it's one of ours. */
export function voucherIdOf(content: Notifications.NotificationContent): string | null {
  const id = content.data?.voucherId;
  return typeof id === 'string' ? id : null;
}

// Scheduling and cancelling are async round-trips to iOS. Run them one at a time so a quick
// edit-then-delete can't interleave and leave a stale reminder behind.
let queue: Promise<unknown> = Promise.resolve();
function serial<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => undefined);
  return run;
}

async function schedule({ voucher, reminder, date }: UpcomingReminder): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: { ...notificationText(voucher, reminder.daysBefore), data: { voucherId: voucher.id } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
  });
}

/** Cancels every pending notification for a voucher: the ids stored on it and any tagged with its id. */
async function cancelFor(voucher: Voucher): Promise<void> {
  const ids = new Set(voucher.reminders.flatMap((r) => (r.notificationId ? [r.notificationId] : [])));
  const pending = await Notifications.getAllScheduledNotificationsAsync();
  for (const request of pending) {
    if (voucherIdOf(request.content) === voucher.id) ids.add(request.identifier);
  }
  await Promise.all([...ids].map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}

/**
 * (Re)schedules a voucher's reminders after it's added or edited: cancels what was pending for it,
 * then schedules each enabled reminder still to come and stores the new notification ids.
 */
export function scheduleVoucherReminders(voucher: Voucher): Promise<void> {
  return serial(async () => {
    await cancelFor(voucher);
    const ids: Record<string, string> = {};
    if (voucher.status === 'active' && (await ensureNotificationPermission())) {
      const { notifyAt } = useClipprStore.getState().settings;
      for (const item of upcomingReminders([voucher], notifyAt)) {
        ids[item.reminder.id] = await schedule(item);
      }
    }
    useClipprStore.getState().setNotificationIds(voucher.id, ids);
  });
}

/** Cancels every pending reminder, for "Delete all vouchers". */
export function cancelAllReminders(): Promise<void> {
  return serial(() => Notifications.cancelAllScheduledNotificationsAsync());
}

/** Cancels a voucher's pending reminders, before it's deleted or marked as used. */
export function cancelVoucherReminders(voucher: Voucher): Promise<void> {
  return serial(async () => {
    await cancelFor(voucher);
    if (useClipprStore.getState().vouchers.some((v) => v.id === voucher.id)) {
      useClipprStore.getState().setNotificationIds(voucher.id, {});
    }
  });
}

/**
 * Rebuilds the whole schedule from the store. Runs at launch and whenever the app returns to the
 * foreground, so vouchers saved before reminders were scheduled, a reinstall (which wipes pending
 * notifications), permission granted later in iOS Settings or a changed notify time all end up
 * matching what the app shows.
 */
export function syncAllReminders(): Promise<void> {
  return serial(async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    const allowed = await ensureNotificationPermission();
    // Read the store after the permission prompt, which can stay up for as long as the user likes.
    const { vouchers, settings, setNotificationIds } = useClipprStore.getState();
    const upcoming = allowed ? upcomingReminders(vouchers, settings.notifyAt).slice(0, MAX_SCHEDULED) : [];
    const ids = new Map<string, Record<string, string>>();
    for (const item of upcoming) {
      const forVoucher = ids.get(item.voucher.id) ?? {};
      forVoucher[item.reminder.id] = await schedule(item);
      ids.set(item.voucher.id, forVoucher);
    }
    for (const voucher of vouchers) setNotificationIds(voucher.id, ids.get(voucher.id) ?? {});
  });
}

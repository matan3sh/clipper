import { addDays, parseISO, set, subDays } from 'date-fns';

import { formatMoney } from '@/lib/format';
import { newId } from '@/lib/ids';
import type { Reminder, Settings, Voucher } from '@/types/voucher';

/** When a reminder fires: `daysBefore` days ahead of expiry, at the user's notify time. */
export function reminderDate(expiryDate: string, daysBefore: number, notifyAt: Settings['notifyAt']): Date {
  return set(subDays(parseISO(expiryDate), daysBefore), {
    hours: notifyAt.hour,
    minutes: notifyAt.minute,
    seconds: 0,
    milliseconds: 0,
  });
}

export function isReminderPast(
  expiryDate: string,
  daysBefore: number,
  notifyAt: Settings['notifyAt'],
  now: Date = new Date(),
): boolean {
  return reminderDate(expiryDate, daysBefore, notifyAt).getTime() <= now.getTime();
}

export interface ReminderChoice {
  /** Preset offsets the user switched on. */
  presets: number[];
  /** The custom day count, or null when the custom reminder is off. */
  customDays: number | null;
}

/**
 * The reminders to store on a new voucher: the enabled presets plus the custom one,
 * skipping any whose time has already passed and any custom value that repeats a preset.
 */
export function buildReminders(
  expiryDate: string | null,
  choice: ReminderChoice,
  notifyAt: Settings['notifyAt'],
  now: Date = new Date(),
): Reminder[] {
  if (!expiryDate) return [];
  const upcoming = (days: number) => !isReminderPast(expiryDate, days, notifyAt, now);
  const presets = [...new Set(choice.presets)].filter(upcoming).sort((a, b) => b - a);
  const reminders: Reminder[] = presets.map((daysBefore) => ({ id: newId(), daysBefore, enabled: true }));
  const { customDays } = choice;
  if (customDays !== null && !presets.includes(customDays) && upcoming(customDays)) {
    reminders.push({ id: newId(), daysBefore: customDays, enabled: true, custom: true });
  }
  return reminders;
}

/** The add flow's choice, rebuilt from a saved voucher's reminders so the edit form starts where it left off. */
export function reminderChoice(reminders: Reminder[]): ReminderChoice {
  const enabled = reminders.filter((r) => r.enabled);
  return {
    presets: enabled.filter((r) => !r.custom).map((r) => r.daysBefore),
    customDays: enabled.find((r) => r.custom)?.daysBefore ?? null,
  };
}

/** "3 days before", "1 day before", "On the day". */
export function reminderLabel(daysBefore: number): string {
  if (daysBefore === 0) return 'On the day';
  return daysBefore === 1 ? '1 day before' : `${daysBefore} days before`;
}

/** One line for the Detail screen: "3 days, 1 day before · on the day", or "None". */
export function remindersSummary(reminders: Reminder[]): string {
  const days = [...new Set(reminders.filter((r) => r.enabled).map((r) => r.daysBefore))].sort((a, b) => b - a);
  if (days.length === 0) return 'None';
  const before = days.filter((d) => d > 0).map((d) => (d === 1 ? '1 day' : `${d} days`));
  const parts = before.length > 0 ? [`${before.join(', ')} before`] : [];
  if (days.includes(0)) parts.push(parts.length > 0 ? 'on the day' : 'On the day');
  return parts.join(' · ');
}

/** What the notification says: "Northwind Books expires in 3 days" / "$40.00 voucher — tap to open it." */
export function notificationText(
  voucher: Pick<Voucher, 'storeName' | 'amount' | 'currency'>,
  daysBefore: number,
): { title: string; body: string } {
  const when = daysBefore === 0 ? 'today' : daysBefore === 1 ? 'tomorrow' : `in ${daysBefore} days`;
  return {
    title: `${voucher.storeName} expires ${when}`,
    body: `${formatMoney(voucher.amount, voucher.currency)} voucher — tap to open it.`,
  };
}

export interface UpcomingReminder {
  voucher: Voucher;
  reminder: Reminder;
  date: Date;
}

/**
 * Every reminder still to come on active vouchers, soonest first. The single source for both
 * what gets scheduled with iOS and what the Alerts tab lists, so the two can't drift apart.
 */
export function upcomingReminders(
  vouchers: Voucher[],
  notifyAt: Settings['notifyAt'],
  now: Date = new Date(),
): UpcomingReminder[] {
  const items: UpcomingReminder[] = [];
  for (const voucher of vouchers) {
    const { expiryDate } = voucher;
    if (voucher.status !== 'active' || !expiryDate) continue;
    for (const reminder of voucher.reminders) {
      if (!reminder.enabled) continue;
      const date = reminderDate(expiryDate, reminder.daysBefore, notifyAt);
      if (date.getTime() > now.getTime()) items.push({ voucher, reminder, date });
    }
  }
  return items.sort((a, b) => a.date.getTime() - b.date.getTime() || a.voucher.storeName.localeCompare(b.voucher.storeName));
}

/** Splits upcoming reminders into the next 7 days and everything after, for the Alerts tab. */
export function splitByWeek(items: UpcomingReminder[], now: Date = new Date()): {
  thisWeek: UpcomingReminder[];
  later: UpcomingReminder[];
} {
  const cutoff = addDays(now, 7).getTime();
  return {
    thisWeek: items.filter((i) => i.date.getTime() <= cutoff),
    later: items.filter((i) => i.date.getTime() > cutoff),
  };
}

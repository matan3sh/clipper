import { parseISO, set, subDays } from 'date-fns';

import { newId } from '@/lib/ids';
import type { Reminder, Settings } from '@/types/voucher';

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

import { describe, expect, it } from '@jest/globals';

import {
  buildReminders,
  isReminderPast,
  notificationText,
  reminderChoice,
  reminderDate,
  reminderLabel,
  remindersSummary,
  splitByWeek,
  upcomingReminders,
} from '@/lib/reminders';
import type { Reminder, Voucher } from '@/types/voucher';

const NINE_AM = { hour: 9, minute: 0 };
// 12 Oct 2026, 10:30: today's 9:00 reminder has already gone.
const NOW = new Date(2026, 9, 12, 10, 30);

describe('reminderDate', () => {
  it('fires the given number of days before expiry, at the notify time', () => {
    expect(reminderDate('2026-10-17', 3, NINE_AM)).toEqual(new Date(2026, 9, 14, 9, 0));
    expect(reminderDate('2026-10-17', 0, { hour: 18, minute: 15 })).toEqual(new Date(2026, 9, 17, 18, 15));
  });
});

describe('isReminderPast', () => {
  it('treats a reminder earlier today as passed and tomorrow as upcoming', () => {
    expect(isReminderPast('2026-10-17', 5, NINE_AM, NOW)).toBe(true);
    expect(isReminderPast('2026-10-17', 4, NINE_AM, NOW)).toBe(false);
  });
});

describe('buildReminders', () => {
  it('returns nothing for a voucher that never expires', () => {
    expect(buildReminders(null, { presets: [7, 3], customDays: 2 }, NINE_AM, NOW)).toEqual([]);
  });

  it('keeps upcoming presets, longest first, and drops ones already passed', () => {
    const reminders = buildReminders('2026-10-17', { presets: [1, 7, 3], customDays: null }, NINE_AM, NOW);
    expect(reminders.map((r) => r.daysBefore)).toEqual([3, 1]);
    expect(reminders.every((r) => r.enabled && !r.custom)).toBe(true);
  });

  it('adds the custom reminder unless it repeats a preset', () => {
    const custom = buildReminders('2026-10-17', { presets: [3], customDays: 2 }, NINE_AM, NOW);
    expect(custom.map((r) => [r.daysBefore, r.custom ?? false])).toEqual([
      [3, false],
      [2, true],
    ]);
    const repeat = buildReminders('2026-10-17', { presets: [3], customDays: 3 }, NINE_AM, NOW);
    expect(repeat).toHaveLength(1);
  });
});

const reminder = (daysBefore: number, extra: Partial<Reminder> = {}): Reminder => ({
  id: `r${daysBefore}${extra.custom ? 'c' : ''}`,
  daysBefore,
  enabled: true,
  ...extra,
});

const voucher = (storeName: string, expiryDate: string | null, reminders: Reminder[], extra: Partial<Voucher> = {}): Voucher => ({
  id: storeName,
  storeName,
  category: 'books',
  amount: 40,
  currency: 'USD',
  expiryDate,
  photoUri: '',
  scanQuality: 90,
  status: 'active',
  reminders,
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
  ...extra,
});

describe('reminderChoice', () => {
  it('rebuilds presets and the custom count from saved reminders, ignoring disabled ones', () => {
    expect(reminderChoice([reminder(7), reminder(3, { enabled: false }), reminder(1), reminder(2, { custom: true })])).toEqual({
      presets: [7, 1],
      customDays: 2,
    });
    expect(reminderChoice([])).toEqual({ presets: [], customDays: null });
  });
});

describe('reminderLabel and remindersSummary', () => {
  it('labels single reminders', () => {
    expect(reminderLabel(0)).toBe('On the day');
    expect(reminderLabel(1)).toBe('1 day before');
    expect(reminderLabel(7)).toBe('7 days before');
  });

  it('summarises a voucher\'s reminders, longest first', () => {
    expect(remindersSummary([reminder(1), reminder(3), reminder(2, { custom: true })])).toBe('3 days, 2 days, 1 day before');
    expect(remindersSummary([reminder(0), reminder(7)])).toBe('7 days before · on the day');
    expect(remindersSummary([reminder(0)])).toBe('On the day');
    expect(remindersSummary([reminder(3, { enabled: false })])).toBe('None');
  });
});

describe('notificationText', () => {
  it('says when the voucher expires and what it is worth', () => {
    const v = { storeName: 'Northwind Books', amount: 40, currency: 'USD' as const };
    expect(notificationText(v, 3)).toEqual({
      title: 'Northwind Books expires in 3 days',
      body: '$40.00 voucher — tap to open it.',
    });
    expect(notificationText(v, 1).title).toBe('Northwind Books expires tomorrow');
    expect(notificationText(v, 0).title).toBe('Northwind Books expires today');
  });
});

describe('upcomingReminders', () => {
  it('lists future reminders on active vouchers, soonest first', () => {
    const items = upcomingReminders(
      [
        voucher('Petal & Co.', '2026-10-23', [reminder(7), reminder(3)]),
        voucher('Northwind Books', '2026-10-17', [reminder(5), reminder(3), reminder(1, { enabled: false })]),
        voucher('Atlas Outdoor', null, [reminder(3)]),
        voucher('Used Store', '2026-10-20', [reminder(3)], { status: 'used' }),
      ],
      NINE_AM,
      NOW,
    );
    expect(items.map((i) => [i.voucher.storeName, i.reminder.daysBefore])).toEqual([
      ['Northwind Books', 3],
      ['Petal & Co.', 7],
      ['Petal & Co.', 3],
    ]);
    expect(items[0].date).toEqual(new Date(2026, 9, 14, 9, 0));
  });

  it('splits them into the next 7 days and later', () => {
    const items = upcomingReminders(
      [voucher('Oak & Ember Home', '2026-11-15', [reminder(7)]), voucher('Northwind Books', '2026-10-17', [reminder(3)])],
      NINE_AM,
      NOW,
    );
    const { thisWeek, later } = splitByWeek(items, NOW);
    expect(thisWeek.map((i) => i.voucher.storeName)).toEqual(['Northwind Books']);
    expect(later.map((i) => i.voucher.storeName)).toEqual(['Oak & Ember Home']);
  });
});

import { describe, expect, it } from '@jest/globals';

import { buildReminders, isReminderPast, reminderDate } from '@/lib/reminders';

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

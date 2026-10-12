import { differenceInCalendarDays, format, parseISO, startOfToday } from 'date-fns';

import { CURRENCIES, type CurrencyCode, type Voucher } from '@/types/voucher';

export function currencySymbol(code: CurrencyCode): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? code;
}

/** Splits an amount into whole and decimal parts, e.g. ₪1,284 and .50, for the two-tone total. */
export function splitMoney(amount: number, code: CurrencyCode): { whole: string; cents: string } {
  const [whole, cents] = amount.toFixed(2).split('.');
  return { whole: `${currencySymbol(code)}${Number(whole).toLocaleString('en-US')}`, cents: `.${cents}` };
}

export function formatMoney(amount: number, code: CurrencyCode): string {
  const { whole, cents } = splitMoney(amount, code);
  return whole + cents;
}

/** Whole days from today until expiry; negative once expired, null when the voucher never expires. */
export function daysUntil(expiryDate: string | null): number | null {
  if (!expiryDate) return null;
  return differenceInCalendarDays(parseISO(expiryDate), startOfToday());
}

export function formatShortDate(isoDate: string): string {
  return format(parseISO(isoDate), 'd MMM');
}

export function formatDayDate(isoDate: string): string {
  return format(parseISO(isoDate), 'EEE, d MMM');
}

export type ExpiryState = 'expired' | 'soon' | 'later' | 'none';

/** "soon" covers the next 30 days, matching the Expiring filter and the tinted day chips. */
export function expiryState(voucher: Pick<Voucher, 'expiryDate'>): ExpiryState {
  const days = daysUntil(voucher.expiryDate);
  if (days === null) return 'none';
  if (days < 0) return 'expired';
  if (days <= 30) return 'soon';
  return 'later';
}

export function expiryChipLabel(voucher: Pick<Voucher, 'expiryDate'>): string {
  const days = daysUntil(voucher.expiryDate);
  if (days === null) return 'Open';
  if (days < 0) return 'Expired';
  if (days === 0) return 'Today';
  return days === 1 ? '1 day' : `${days} days`;
}

/** Soonest expiry first; vouchers without an expiry go last. */
export function byExpiry(a: Voucher, b: Voucher): number {
  if (a.expiryDate === b.expiryDate) return a.storeName.localeCompare(b.storeName);
  if (a.expiryDate === null) return 1;
  if (b.expiryDate === null) return -1;
  return a.expiryDate.localeCompare(b.expiryDate);
}

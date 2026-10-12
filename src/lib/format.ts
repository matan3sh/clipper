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

/** Parses what the user typed in an amount field ("40", "40.5", "40,50", "1,250.00"); null unless it's a positive number. */
export function parseAmountInput(text: string): number | null {
  const trimmed = text.trim().replace(/\s/g, '');
  if (!/^\d[\d,]*(?:[.,]\d{1,2})?$/.test(trimmed)) return null;
  const normalized = /,\d{3}(?!\d)/.test(trimmed) ? trimmed.replace(/,/g, '') : trimmed.replace(',', '.');
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) && value > 0 ? Math.round(value * 100) / 100 : null;
}

/** An amount as it should appear in an editable field: two decimals, no symbol, no thousands separators. */
export function amountInputText(amount: number): string {
  return amount.toFixed(2);
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

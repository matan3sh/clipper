/** Clippr data model — the source of truth for everything stored on the device. */

export type Category = 'books' | 'fashion' | 'home' | 'beauty' | 'food' | 'tech' | 'other';

export const CATEGORIES: readonly { id: Category; label: string }[] = [
  { id: 'books', label: 'Books' },
  { id: 'fashion', label: 'Fashion' },
  { id: 'home', label: 'Home' },
  { id: 'beauty', label: 'Beauty' },
  { id: 'food', label: 'Food' },
  { id: 'tech', label: 'Tech' },
  { id: 'other', label: 'Other' },
];

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'ILS';

export const CURRENCIES: readonly { code: CurrencyCode; symbol: string }[] = [
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'ILS', symbol: '₪' },
];

/** Preset reminder offsets shown as toggles: 7d, 3d, 1d and on the day. */
export const PRESET_REMINDER_DAYS = [7, 3, 1, 0] as const;

export interface Reminder {
  id: string;
  /** Days before expiry; 0 means on the day. */
  daysBefore: number;
  enabled: boolean;
  /** True for the user-entered custom day count. */
  custom?: boolean;
  /** expo-notifications identifier, present while the reminder is scheduled. */
  notificationId?: string;
}

export type VoucherStatus = 'active' | 'used';

export interface Voucher {
  id: string;
  storeName: string;
  category: Category;
  amount: number;
  currency: CurrencyCode;
  /** ISO date (yyyy-MM-dd), or null for vouchers that never expire. */
  expiryDate: string | null;
  /** Local file URI of the full photo, copied into the app's document directory. */
  photoUri: string;
  thumbnailUri?: string;
  /** ML Kit scan quality, 0–100. */
  scanQuality: number;
  /** Raw ML Kit OCR output, kept for re-parsing. */
  extractedText?: string;
  notes?: string;
  status: VoucherStatus;
  reminders: Reminder[];
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  /** Preset offsets pre-selected for new vouchers. */
  defaultReminderDays: number[];
  defaultCurrency: CurrencyCode;
  /** Local time reminders fire at, 24h. */
  notifyAt: { hour: number; minute: number };
}

export type QualityTier = 'excellent' | 'good' | 'rescan';

/** Scan quality tiers: 85–100 excellent, 65–84 good, below 65 rescan recommended. */
export function qualityTier(score: number): QualityTier {
  if (score >= 85) return 'excellent';
  if (score >= 65) return 'good';
  return 'rescan';
}

export const QUALITY_LABELS: Record<QualityTier, string> = {
  excellent: 'Excellent scan',
  good: 'Good scan',
  rescan: 'Rescan recommended',
};

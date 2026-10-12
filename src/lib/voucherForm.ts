import { parseAmountInput } from '@/lib/format';
import type { Category, CurrencyCode } from '@/types/voucher';

/** The Details step's editable fields. Amount stays text until save, so typing "40." isn't rewritten. */
export interface DraftForm {
  storeName: string;
  amountText: string;
  currency: CurrencyCode;
  /** yyyy-MM-dd, or null for no expiry. */
  expiryDate: string | null;
  category: Category | null;
  notes: string;
}

export type FormErrors = Partial<Record<'storeName' | 'amountText' | 'category', string>>;

/** Field errors that block Continue; an empty object means the form is complete. */
export function validateForm(form: DraftForm): FormErrors {
  const errors: FormErrors = {};
  if (!form.storeName.trim()) errors.storeName = 'Add the store name';
  if (parseAmountInput(form.amountText) === null) errors.amountText = 'Enter an amount, like 40 or 40.50';
  if (!form.category) errors.category = 'Pick a category';
  return errors;
}

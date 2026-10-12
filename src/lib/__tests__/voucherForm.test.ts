import { describe, expect, it } from '@jest/globals';

import { validateForm, type DraftForm } from '@/lib/voucherForm';

const COMPLETE: DraftForm = {
  storeName: 'Northwind Books',
  amountText: '40.00',
  currency: 'USD',
  expiryDate: '2026-10-17',
  category: 'books',
  notes: '',
};

describe('validateForm', () => {
  it('accepts a complete form, with or without an expiry date', () => {
    expect(validateForm(COMPLETE)).toEqual({});
    expect(validateForm({ ...COMPLETE, expiryDate: null })).toEqual({});
  });

  it('flags a blank store name, a bad amount and a missing category', () => {
    const errors = validateForm({ ...COMPLETE, storeName: '   ', amountText: '0', category: null });
    expect(Object.keys(errors).sort()).toEqual(['amountText', 'category', 'storeName']);
  });
});

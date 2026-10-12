import { describe, expect, it } from '@jest/globals';

import { amountInputText, parseAmountInput } from '@/lib/format';

describe('parseAmountInput', () => {
  it('accepts whole numbers, dot or comma decimals and thousands separators', () => {
    expect(parseAmountInput('40')).toBe(40);
    expect(parseAmountInput(' 40.5 ')).toBe(40.5);
    expect(parseAmountInput('40,50')).toBe(40.5);
    expect(parseAmountInput('1,250.00')).toBe(1250);
  });

  it('rejects empty, zero, negative and malformed input', () => {
    for (const bad of ['', '0', '0.00', '-5', 'abc', '4.567', '$40']) {
      expect(parseAmountInput(bad)).toBeNull();
    }
  });
});

describe('amountInputText', () => {
  it('always shows two decimals, without separators', () => {
    expect(amountInputText(40)).toBe('40.00');
    expect(amountInputText(1250)).toBe('1250.00');
    expect(amountInputText(312.5)).toBe('312.50');
  });
});

import { describe, expect, it } from '@jest/globals';
import type { Block, TextLine } from '@infinitered/react-native-mlkit-text-recognition';

import {
  analyzeOcr,
  datesInText,
  findAmount,
  findExpiryDate,
  findStoreName,
  scoreQuality,
  type OcrResult,
} from '@/lib/voucherParsing';
import { qualityTier } from '@/types/voucher';

const IMAGE = { width: 1500, height: 2000 };

/** One OCR line at `top`, `height` px tall, spanning most of the image width. */
function line(text: string, top: number, height = 40): TextLine {
  const frame = { left: 150, top, right: 1350, bottom: top + height };
  return {
    text,
    frame,
    recognizedLanguages: [],
    elements: text.split(/\s+/).map((word) => ({ text: word, frame, recognizedLanguages: [] })),
  };
}

function block(...lines: TextLine[]): Block {
  return {
    text: lines.map((l) => l.text).join('\n'),
    lines,
    recognizedLanguages: [],
    frame: {
      left: Math.min(...lines.map((l) => l.frame.left)),
      top: Math.min(...lines.map((l) => l.frame.top)),
      right: Math.max(...lines.map((l) => l.frame.right)),
      bottom: Math.max(...lines.map((l) => l.frame.bottom)),
    },
  };
}

function ocr(...blocks: Block[]): OcrResult {
  return { text: blocks.map((b) => b.text).join('\n'), blocks };
}

/** The Northwind Books voucher from the design. */
const NORTHWIND = ocr(
  block(line('NORTHWIND', 200, 90), line('BOOKS', 300, 90)),
  block(line('GIFT VOUCHER', 450, 30)),
  block(line('$40.00', 520, 160)),
  block(line('Valid until 17.10.2026', 720, 36)),
  block(line('Issued 02.03.2026', 780, 30)),
  block(line('NWB-4471-2290', 1500, 40)),
);

describe('findAmount', () => {
  it('reads a prefixed symbol and maps it to a currency', () => {
    expect(findAmount([line('$40.00', 0)])).toMatchObject({ amount: 40, currency: 'USD' });
    expect(findAmount([line('₪ 185', 0)])).toMatchObject({ amount: 185, currency: 'ILS' });
    expect(findAmount([line('£12,50', 0)])).toMatchObject({ amount: 12.5, currency: 'GBP' });
  });

  it('reads suffixed symbols and ISO codes, including NIS', () => {
    expect(findAmount([line('60 €', 0)])).toMatchObject({ amount: 60, currency: 'EUR' });
    expect(findAmount([line('Value 312.50 NIS', 0)])).toMatchObject({ amount: 312.5, currency: 'ILS' });
    expect(findAmount([line('USD 1,250.00', 0)])).toMatchObject({ amount: 1250, currency: 'USD' });
  });

  it('prefers the amount printed in the largest type', () => {
    const lines = [line('Minimum spend $5', 0, 20), line('$40.00', 100, 120)];
    expect(findAmount(lines)?.amount).toBe(40);
  });

  it('falls back to a decimal next to an amount keyword, without a currency', () => {
    expect(findAmount([line('Credit balance', 0), line('75.00', 50)])).toMatchObject({ amount: 75, currency: null });
  });

  it('ignores numbers that are part of dates or codes', () => {
    expect(findAmount([line('Valid until 17.10.26', 0), line('NWB-4471-2290', 50)])).toBeNull();
  });
});

describe('datesInText', () => {
  const iso = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

  it('reads day-first numeric dates with any separator and 2- or 4-digit years', () => {
    expect(datesInText('17/10/2026').map(iso)).toEqual(['2026-10-17']);
    expect(datesInText('17.10.26').map(iso)).toEqual(['2026-10-17']);
    expect(datesInText('05-01-2027').map(iso)).toEqual(['2027-1-5']);
  });

  it('switches to month-first only when day-first is impossible', () => {
    expect(datesInText('10/17/2026').map(iso)).toEqual(['2026-10-17']);
  });

  it('reads written months in either order, and ISO dates', () => {
    expect(datesInText('Expires 17 Oct 2026').map(iso)).toEqual(['2026-10-17']);
    expect(datesInText('October 3rd, 2026').map(iso)).toEqual(['2026-10-3']);
    expect(datesInText('2026-12-31').map(iso)).toEqual(['2026-12-31']);
  });

  it('rejects dates that do not exist', () => {
    expect(datesInText('31/02/2026')).toEqual([]);
  });
});

describe('findExpiryDate', () => {
  it('prefers a date next to an expiry keyword over a later unrelated date', () => {
    const lines = [line('Valid until', 0), line('17.10.2026', 50), line('Printed 01.01.2027', 100)];
    expect(findExpiryDate(lines)?.date.getFullYear()).toBe(2026);
  });

  it('uses the latest date when nothing says "expires"', () => {
    const lines = [line('02.03.2026', 0), line('02.03.2027', 50)];
    expect(findExpiryDate(lines)?.date.getFullYear()).toBe(2027);
  });
});

describe('findStoreName', () => {
  it('picks the largest block and title-cases an all-caps name', () => {
    expect(findStoreName(NORTHWIND.blocks)?.name).toBe('Northwind Books');
  });

  it('keeps mixed-case names as printed', () => {
    const blocks = [block(line('Petal & Co.', 0, 80)), block(line('Store credit', 100, 30))];
    expect(findStoreName(blocks)?.name).toBe('Petal & Co.');
  });

  it('skips stock phrases, prices, dates, codes and web addresses', () => {
    const blocks = [
      block(line('GIFT VOUCHER', 0, 120)),
      block(line('$40.00', 150, 160)),
      block(line('www.northwind.com', 350, 100)),
      block(line('4471 2290 1188', 500, 100)),
      block(line('Oak & Ember', 700, 50)),
    ];
    expect(findStoreName(blocks)?.name).toBe('Oak & Ember');
  });
});

describe('scoreQuality', () => {
  it('scores zero when no text was found', () => {
    expect(scoreQuality(ocr(), IMAGE, 0)).toEqual({ quality: 0, breakdown: { sharp: 0, frame: 0, text: 0 } });
  });

  it('marks fragmented, symbol-heavy text as less sharp', () => {
    const crisp = scoreQuality(ocr(block(line('Northwind Books gift voucher', 0, 60))), IMAGE, 1);
    const blurry = scoreQuality(ocr(block(line('N 0 r ~ h | w : n d', 0, 60))), IMAGE, 1);
    expect(blurry.breakdown.sharp).toBeLessThan(crisp.breakdown.sharp);
  });

  it('marks a low-resolution photo as worse framed', () => {
    const big = scoreQuality(NORTHWIND, IMAGE, 3);
    const small = scoreQuality(NORTHWIND, { width: 480, height: 640 }, 3);
    expect(small.breakdown.frame).toBeLessThan(big.breakdown.frame);
  });
});

describe('analyzeOcr', () => {
  it('fills all three fields from the design voucher and rates it a usable scan', () => {
    const result = analyzeOcr(NORTHWIND, IMAGE);
    expect(result.suggestions).toEqual({
      storeName: 'Northwind Books',
      amount: 40,
      currency: 'USD',
      expiryDate: '2026-10-17',
    });
    expect(result.fieldsFound).toBe(3);
    expect(result.highlights).toHaveLength(3);
    expect(qualityTier(result.quality)).not.toBe('rescan');
  });

  it('recommends a rescan when nothing useful was read', () => {
    const result = analyzeOcr(ocr(block(line('~ | :', 0, 10))), IMAGE);
    expect(result.fieldsFound).toBe(0);
    expect(qualityTier(result.quality)).toBe('rescan');
  });
});

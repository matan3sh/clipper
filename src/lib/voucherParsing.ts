/**
 * Pure voucher parsing and scan-quality scoring over ML Kit OCR output.
 * No native imports, so it runs in unit tests; `mlkit.ts` feeds it real recognition results.
 */
import type { Block, Rect, TextLine } from '@infinitered/react-native-mlkit-text-recognition';
import { format } from 'date-fns';

import type { CurrencyCode } from '@/types/voucher';

export interface OcrResult {
  text: string;
  blocks: Block[];
}

export interface ImageSize {
  width: number;
  height: number;
}

export interface Suggestions {
  storeName: string | null;
  amount: number | null;
  currency: CurrencyCode | null;
  /** ISO date, yyyy-MM-dd. */
  expiryDate: string | null;
}

/** Sub-scores behind the overall quality, each 0–100. */
export interface QualityBreakdown {
  /** Clean, well-formed words and large enough text: blur breaks words into fragments. */
  sharp: number;
  /** How much of the photo the text covers, and the photo's resolution. */
  frame: number;
  /** How many voucher fields were found, and how much text was read. */
  text: number;
}

export interface Analysis {
  quality: number;
  breakdown: QualityBreakdown;
  extractedText: string;
  suggestions: Suggestions;
  /** Number of suggestions found: store, amount, expiry. */
  fieldsFound: number;
  /** Frames (image pixels) of the text each suggestion came from, for highlighting. */
  highlights: Rect[];
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const heightOf = (r: Rect) => r.bottom - r.top;
const areaOf = (r: Rect) => Math.max(0, r.right - r.left) * Math.max(0, r.bottom - r.top);

function allLines(blocks: Block[]): TextLine[] {
  return blocks.flatMap((b) => b.lines);
}

// ── Amount ────────────────────────────────────────────────────────────────

const SYMBOLS: Record<string, CurrencyCode> = { $: 'USD', '€': 'EUR', '£': 'GBP', '₪': 'ILS' };
const CODES: Record<string, CurrencyCode> = { USD: 'USD', EUR: 'EUR', GBP: 'GBP', ILS: 'ILS', NIS: 'ILS' };

// 1,234.50 · 1234.50 · 40,00 · 40
const NUMBER = String.raw`\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\d+(?:[.,]\d{1,2})?`;
const CURRENCY = String.raw`[₪$€£]|\b(?:USD|EUR|GBP|ILS|NIS)\b`;
const PREFIXED = new RegExp(String.raw`(${CURRENCY})\s?(${NUMBER})(?![\d.,]*\d)`, 'gi');
const SUFFIXED = new RegExp(String.raw`(?<![\d.,])(${NUMBER})\s?(${CURRENCY})`, 'gi');
const HAS_PRICE = new RegExp(`${PREFIXED.source}|${SUFFIXED.source}`, 'i');
const AMOUNT_KEYWORDS = /\b(amount|value|balance|credit|total|worth)\b|סכום|יתרה|שווי/i;
const BARE_DECIMAL = /(?<![\d.,])(\d+[.,]\d{2})(?![\d.,]*\d)/;

function toNumber(raw: string): number {
  const normalized = /,\d{3}(?!\d)/.test(raw) ? raw.replace(/,/g, '') : raw.replace(',', '.');
  return Number.parseFloat(normalized);
}

function toCurrency(raw: string): CurrencyCode | null {
  return SYMBOLS[raw] ?? CODES[raw.toUpperCase()] ?? null;
}

interface AmountMatch {
  amount: number;
  currency: CurrencyCode | null;
  line: TextLine;
}

/**
 * The voucher's value: an amount with a currency marker, printed in the largest type.
 * Falls back to a decimal amount on a line that says "value", "balance" and so on.
 */
export function findAmount(lines: TextLine[]): AmountMatch | null {
  const withCurrency: AmountMatch[] = [];
  for (const line of lines) {
    const text = stripDates(line.text);
    for (const m of text.matchAll(PREFIXED)) {
      withCurrency.push({ amount: toNumber(m[2]), currency: toCurrency(m[1]), line });
    }
    for (const m of text.matchAll(SUFFIXED)) {
      withCurrency.push({ amount: toNumber(m[1]), currency: toCurrency(m[2]), line });
    }
  }
  const pick = (list: AmountMatch[]) =>
    list
      .filter((c) => Number.isFinite(c.amount) && c.amount > 0)
      .sort((a, b) => heightOf(b.line.frame) - heightOf(a.line.frame) || b.amount - a.amount)[0] ?? null;

  const best = pick(withCurrency);
  if (best) return best;

  const fallback: AmountMatch[] = [];
  lines.forEach((line, i) => {
    const text = stripDates(line.text);
    const m = BARE_DECIMAL.exec(text);
    if (!m) return;
    const keywordNearby = AMOUNT_KEYWORDS.test(line.text) || (i > 0 && AMOUNT_KEYWORDS.test(lines[i - 1].text));
    const aloneOnLine = text.trim() === m[1];
    if (keywordNearby || aloneOnLine) fallback.push({ amount: toNumber(m[1]), currency: null, line });
  });
  return pick(fallback);
}

// ── Expiry date ───────────────────────────────────────────────────────────

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const MONTH = String.raw`(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?`;
const NUMERIC_DATE = /\b(\d{1,2})[./-](\d{1,2})[./-](\d{4}|\d{2})\b/g;
const ISO_DATE = /\b(\d{4})-(\d{2})-(\d{2})\b/g;
const DAY_MONTH_YEAR = new RegExp(String.raw`\b(\d{1,2})(?:st|nd|rd|th)?\s+${MONTH},?\s+(\d{4})\b`, 'gi');
const MONTH_DAY_YEAR = new RegExp(String.raw`\b${MONTH}\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b`, 'gi');
const EXPIRY_KEYWORDS = /valid|until|\bexp|expir|use (by|before)|good (thru|through)|תוקף|בתוקף|עד/i;

function stripDates(text: string): string {
  return text
    .replace(NUMERIC_DATE, ' ')
    .replace(ISO_DATE, ' ')
    .replace(DAY_MONTH_YEAR, ' ')
    .replace(MONTH_DAY_YEAR, ' ');
}

function makeDate(year: number, month: number, day: number): Date | null {
  const y = year < 100 ? 2000 + year : year;
  const date = new Date(y, month - 1, day);
  const valid = date.getFullYear() === y && date.getMonth() === month - 1 && date.getDate() === day;
  return valid ? date : null;
}

function monthIndex(name: string): number {
  return MONTHS.indexOf(name.slice(0, 3).toLowerCase()) + 1;
}

/** Every date written on one line. Numeric dates read as day/month unless that's impossible. */
export function datesInText(text: string): Date[] {
  const found: Date[] = [];
  const push = (d: Date | null) => {
    if (d) found.push(d);
  };
  for (const m of text.matchAll(ISO_DATE)) push(makeDate(+m[1], +m[2], +m[3]));
  const withoutIso = text.replace(ISO_DATE, ' ');
  for (const m of withoutIso.matchAll(NUMERIC_DATE)) {
    const [a, b, y] = [+m[1], +m[2], +m[3]];
    push(a <= 12 && b > 12 ? makeDate(y, a, b) : makeDate(y, b, a));
  }
  for (const m of text.matchAll(DAY_MONTH_YEAR)) push(makeDate(+m[3], monthIndex(m[2]), +m[1]));
  for (const m of text.matchAll(MONTH_DAY_YEAR)) push(makeDate(+m[3], monthIndex(m[1]), +m[2]));
  return found;
}

interface DateMatch {
  date: Date;
  line: TextLine;
}

/** A date next to "valid until", "exp" and so on; otherwise the latest date on the voucher. */
export function findExpiryDate(lines: TextLine[]): DateMatch | null {
  const keyed: DateMatch[] = [];
  const other: DateMatch[] = [];
  lines.forEach((line, i) => {
    const keyword = EXPIRY_KEYWORDS.test(line.text) || (i > 0 && EXPIRY_KEYWORDS.test(lines[i - 1].text));
    for (const date of datesInText(line.text)) (keyword ? keyed : other).push({ date, line });
  });
  const latest = (list: DateMatch[]) => list.sort((a, b) => b.date.getTime() - a.date.getTime())[0] ?? null;
  return latest(keyed) ?? latest(other);
}

// ── Store name ────────────────────────────────────────────────────────────

const GENERIC =
  /\b(gift\s*(voucher|card|certificate)s?|e-?gift|voucher|credit\s*note|store\s*credit|coupon|valid(ity)?|until|expir\w*|thank\s*you|serial|code|no\.?|number|amount|value|balance|issued?|date)\b|שובר|זיכוי|תו\s*קנייה/gi;

function titleCase(text: string): string {
  if (text !== text.toUpperCase()) return text;
  return text.toLowerCase().replace(/(^|[\s\-&/(])(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toUpperCase());
}

interface StoreMatch {
  name: string;
  block: Block;
}

/** The store name: the block printed in the largest type that isn't a price, date, code or stock phrase. */
export function findStoreName(blocks: Block[]): StoreMatch | null {
  const candidates = blocks
    .map((block) => {
      const text = block.lines.map((l) => l.text.trim()).join(' ').replace(/\s+/g, ' ').trim();
      const avgHeight = block.lines.reduce((sum, l) => sum + heightOf(l.frame), 0) / Math.max(1, block.lines.length);
      return { block, text, avgHeight };
    })
    .filter(({ text }) => {
      if (text.length < 2 || text.length > 40) return false;
      if (/@|www\.|https?:/i.test(text)) return false;
      if (datesInText(text).length > 0 || HAS_PRICE.test(text)) return false;
      const letters = text.replace(GENERIC, ' ').match(/\p{L}/gu)?.length ?? 0;
      const digits = text.match(/\d/g)?.length ?? 0;
      return letters >= 3 && digits <= letters;
    })
    .sort((a, b) => b.avgHeight - a.avgHeight || a.block.frame.top - b.block.frame.top);

  const best = candidates[0];
  return best ? { name: titleCase(best.text), block: best.block } : null;
}

// ── Quality ───────────────────────────────────────────────────────────────

const CLEAN_WORD = /^[\p{L}\p{N}₪$€£][\p{L}\p{N}.,:/'&₪$€£%#-]*$/u;

/**
 * 0–100 scan quality from OCR output alone (ML Kit exposes no confidence values on iOS).
 * Weights: sharp 35%, frame 25%, text 40%. 85+ is excellent, 65–84 good, under 65 rescan.
 */
export function scoreQuality(ocr: OcrResult, size: ImageSize, fieldsFound: number): { quality: number; breakdown: QualityBreakdown } {
  const lines = allLines(ocr.blocks);
  const elements = lines.flatMap((l) => l.elements);
  if (elements.length === 0 || size.width <= 0 || size.height <= 0) {
    return { quality: 0, breakdown: { sharp: 0, frame: 0, text: 0 } };
  }

  const minSide = Math.min(size.width, size.height);

  const clean = elements.filter((e) => CLEAN_WORD.test(e.text) && (e.text.length >= 2 || /\d/.test(e.text))).length;
  const heights = lines.map((l) => heightOf(l.frame)).sort((a, b) => a - b);
  const median = heights[Math.floor(heights.length / 2)];
  const sharp = 0.75 * (clean / elements.length) + 0.25 * clamp01(median / (0.025 * minSide));

  const coverage = ocr.blocks.reduce((sum, b) => sum + areaOf(b.frame), 0) / (size.width * size.height);
  const frame = 0.65 * clamp01(coverage / 0.15) + 0.35 * clamp01((minSide - 600) / 600);

  const text = 0.75 * (fieldsFound / 3) + 0.25 * Math.min(lines.length, 8) / 8;

  const breakdown = {
    sharp: Math.round(sharp * 100),
    frame: Math.round(frame * 100),
    text: Math.round(text * 100),
  };
  const quality = Math.round(0.35 * breakdown.sharp + 0.25 * breakdown.frame + 0.4 * breakdown.text);
  return { quality, breakdown };
}

// ── Everything together ───────────────────────────────────────────────────

export function analyzeOcr(ocr: OcrResult, size: ImageSize): Analysis {
  const lines = allLines(ocr.blocks);
  const store = findStoreName(ocr.blocks);
  const amount = findAmount(lines);
  const expiry = findExpiryDate(lines);

  const suggestions: Suggestions = {
    storeName: store?.name ?? null,
    amount: amount?.amount ?? null,
    currency: amount?.currency ?? null,
    expiryDate: expiry ? format(expiry.date, 'yyyy-MM-dd') : null,
  };
  const fieldsFound = [store, amount, expiry].filter(Boolean).length;
  const highlights = [store?.block.frame, amount?.line.frame, expiry?.line.frame].filter((r): r is Rect => !!r);

  return {
    ...scoreQuality(ocr, size, fieldsFound),
    extractedText: ocr.text,
    suggestions,
    fieldsFound,
    highlights,
  };
}

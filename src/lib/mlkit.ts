import { recognizeText } from '@infinitered/react-native-mlkit-text-recognition';

import { analyzeOcr, type Analysis, type ImageSize } from '@/lib/voucherParsing';

export type { Analysis, QualityBreakdown, Suggestions } from '@/lib/voucherParsing';

/** Reads a voucher photo on-device with ML Kit, then scores it and pulls out store, amount and expiry. */
export async function analyzeImage(uri: string, size: ImageSize): Promise<Analysis> {
  const result = await recognizeText(uri);
  return analyzeOcr(result, size);
}

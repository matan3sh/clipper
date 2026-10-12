import { Text, View } from 'react-native';

import { expiryChipLabel, expiryState, type ExpiryState } from '@/lib/format';
import type { Voucher } from '@/types/voucher';

const STYLES: Record<ExpiryState, { box: string; text: string }> = {
  soon: { box: 'bg-wash', text: 'text-wash-ink' },
  later: { box: 'bg-surface', text: 'text-muted' },
  none: { box: 'bg-surface', text: 'text-muted' },
  expired: { box: 'bg-danger-wash', text: 'text-danger' },
};

/** Days-left pill: lavender inside 30 days, neutral after that, red once expired. */
export function ExpiryBadge({ voucher }: { voucher: Pick<Voucher, 'expiryDate'> }) {
  const style = STYLES[expiryState(voucher)];
  return (
    <View className={`rounded-pill px-2 py-0.5 ${style.box}`}>
      <Text className={`font-display text-[11px] leading-4 ${style.text}`}>{expiryChipLabel(voucher)}</Text>
    </View>
  );
}

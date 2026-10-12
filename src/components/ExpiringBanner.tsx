import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { daysUntil, formatDayDate, formatMoney } from '@/lib/format';
import { colors } from '@/lib/theme';
import type { Voucher } from '@/types/voucher';

interface ExpiringBannerProps {
  /** The voucher expiring soonest. */
  voucher: Voucher;
  /** How many other vouchers also expire within a week. */
  others: number;
}

/** Lavender banner for vouchers that expire within 7 days. Opens the soonest one. */
export function ExpiringBanner({ voucher, others }: ExpiringBannerProps) {
  const days = daysUntil(voucher.expiryDate) ?? 0;
  const when = days === 0 ? 'expires today' : voucher.expiryDate ? `expires ${formatDayDate(voucher.expiryDate)}` : '';
  const more = others > 0 ? ` · +${others} more this week` : '';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${voucher.storeName} ${days === 0 ? 'expires today' : `expires in ${days} days`}. Open voucher`}
      onPress={() => router.push({ pathname: '/voucher/[id]', params: { id: voucher.id } })}
      className="flex-row items-center gap-3.5 rounded-card bg-wash p-4 active:opacity-80"
    >
      <View className="h-12 w-12 items-center justify-center rounded-pill bg-paper">
        {days === 0 ? (
          <Text className="font-display text-[11px] uppercase leading-4 text-accent-ink">Today</Text>
        ) : (
          <>
            <Text className="font-display text-[18px] leading-5 text-ink">{days}</Text>
            <Text className="font-display text-[9px] uppercase leading-3 text-accent-ink">
              {days === 1 ? 'day' : 'days'}
            </Text>
          </>
        )}
      </View>
      <View className="flex-1 gap-0.5">
        <Text numberOfLines={1} className="font-display text-body text-ink">
          {voucher.storeName}
        </Text>
        <Text numberOfLines={1} className="font-body text-body-sm text-wash-muted">
          {formatMoney(voucher.amount, voucher.currency)} · {when}
          {more}
        </Text>
      </View>
      <ChevronRight size={20} color={colors.ink} strokeWidth={2} />
    </Pressable>
  );
}

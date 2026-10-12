import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ExpiryBadge } from '@/components/ExpiryBadge';
import { CATEGORY_ICONS, categoryLabel } from '@/lib/categories';
import { expiryState, formatMoney, formatShortDate } from '@/lib/format';
import { photoFileUri } from '@/lib/photos';
import { colors } from '@/lib/theme';
import type { Voucher } from '@/types/voucher';

interface VoucherCardProps {
  voucher: Voucher;
  /** Position in the list: drives the entry stagger and which way the back sheet tilts. */
  index: number;
}

/** "Paper stack" card: a white card with a tinted sheet peeking out behind it. */
export function VoucherCard({ voucher, index }: VoucherCardProps) {
  const state = expiryState(voucher);
  const Icon = CATEGORY_ICONS[voucher.category];
  const thumbnail = photoFileUri(voucher.thumbnailUri);
  const expired = state === 'expired';
  const used = voucher.status === 'used';
  const dimmed = expired || used;
  const subtitle = voucher.expiryDate
    ? `${categoryLabel(voucher.category)} · ${expired ? 'Expired' : 'Exp'} ${formatShortDate(voucher.expiryDate)}`
    : `${categoryLabel(voucher.category)} · No expiry`;

  return (
    <Animated.View entering={FadeInDown.duration(360).delay(index * 80)} className="mb-4">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${voucher.storeName}, ${formatMoney(voucher.amount, voucher.currency)}, ${subtitle}`}
        onPress={() => router.push({ pathname: '/voucher/[id]', params: { id: voucher.id } })}
        className="active:opacity-80"
      >
        <View
          className={`absolute bottom-[-5px] left-2 right-2 top-1.5 rounded-card ${state === 'soon' ? 'bg-wash' : 'bg-blush'}`}
          style={{ transform: [{ rotate: index % 2 === 0 ? '-1.5deg' : '1.5deg' }] }}
        />
        <View
          className={`flex-row items-center gap-3 rounded-card bg-paper p-3 shadow-paper-ring ${dimmed ? 'opacity-60' : ''}`}
        >
          <View className="h-[52px] w-[52px] items-center justify-center overflow-hidden rounded-card bg-surface">
            {thumbnail ? (
              <Image source={{ uri: thumbnail }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
            ) : (
              <Icon size={22} color={colors.ink} strokeWidth={1.9} />
            )}
          </View>
          <View className="min-w-0 flex-1 gap-0.5">
            <Text numberOfLines={1} className="font-display text-body text-ink">
              {voucher.storeName}
            </Text>
            <Text numberOfLines={1} className="font-body text-caption text-muted">
              {subtitle}
            </Text>
          </View>
          <View className="items-end gap-1">
            <Text className="font-display text-body text-ink">{formatMoney(voucher.amount, voucher.currency)}</Text>
            {used ? (
              <View className="rounded-pill bg-surface px-2 py-0.5">
                <Text className="font-display text-[11px] leading-4 text-muted">Used</Text>
              </View>
            ) : (
              <ExpiryBadge voucher={voucher} />
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

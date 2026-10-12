import { router } from 'expo-router';
import { ScanLine } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { colors } from '@/lib/theme';

/** Home with no vouchers: stacked-paper illustration and the two ways to add one. */
export function EmptyState() {
  return (
    <View className="items-center gap-4 rounded-panel bg-surface pb-7">
      <View className="h-[210px] w-full" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View
          className="absolute left-1/2 top-10 h-32 w-[190px] rounded-card bg-blush"
          style={{ marginLeft: -118, transform: [{ rotate: '-9deg' }] }}
        />
        <View
          className="absolute left-1/2 top-9 h-32 w-[190px] rounded-card bg-wash"
          style={{ marginLeft: -72, transform: [{ rotate: '7deg' }] }}
        />
        <View
          className="absolute left-1/2 top-[52px] h-32 w-[190px] gap-2 rounded-card bg-paper p-4 shadow-paper"
          style={{ marginLeft: -95, transform: [{ rotate: '-2deg' }] }}
        >
          <View className="h-2 w-[70px] rounded-pill bg-ink" />
          <View className="h-1.5 w-[110px] rounded-pill bg-border" />
          <View className="mt-1.5 h-[18px] w-16 rounded-pill bg-surface" />
          <View className="flex-1" />
          <View className="h-1.5 w-[90px] rounded-pill bg-border" />
        </View>
        <Text
          className="absolute bottom-1.5 right-8 font-hand text-[22px] text-muted"
          style={{ transform: [{ rotate: '-4deg' }] }}
        >
          your first one goes here
        </Text>
      </View>

      <View className="gap-1.5 px-7">
        <Text className="text-center font-display text-subhead text-ink">Add your first voucher</Text>
        <Text className="text-center font-body text-[15px] leading-[22px] text-muted">
          Snap a photo. Clippr reads it on this phone and reminds you before it expires.
        </Text>
      </View>

      <View className="items-center">
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/voucher/new')}
          className="h-[52px] flex-row items-center gap-2 rounded-pill bg-action px-[22px] shadow-button active:opacity-90"
        >
          <ScanLine size={20} color={colors.paper} strokeWidth={2} />
          <Text className="font-display text-body text-paper">Scan a voucher</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/voucher/new', params: { source: 'library' } })}
          className="h-11 justify-center"
        >
          <Text className="font-body text-[15px] text-muted">Pick from library</Text>
        </Pressable>
      </View>
    </View>
  );
}

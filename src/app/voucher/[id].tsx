import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Placeholder } from '@/components/Placeholder';
import { colors } from '@/lib/theme';

export default function VoucherDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ScrollView className="flex-1 bg-paper" contentContainerClassName="px-gutter pb-12 pt-safe-top gap-6">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        onPress={() => router.back()}
        className="h-11 w-11 items-center justify-center rounded-pill bg-surface"
      >
        <ChevronLeft size={20} color={colors.ink} strokeWidth={2.2} />
      </Pressable>
      <Placeholder
        eyebrow="Voucher detail"
        title="Detail"
        body="Photo, expiry, inline edit, reminders and delete arrive in Phase 4."
      >
        <View className="rounded-card bg-wash p-4">
          <Text className="font-display text-body-sm text-wash-ink">Route param id: {id}</Text>
        </View>
      </Placeholder>
    </ScrollView>
  );
}

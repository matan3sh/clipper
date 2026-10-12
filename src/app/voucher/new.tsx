import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { Placeholder } from '@/components/Placeholder';
import { colors } from '@/lib/theme';

const STEPS = ['Capture', 'Analyze', 'Details', 'Reminders'] as const;

export default function NewVoucherScreen() {
  return (
    <View className="flex-1 bg-paper px-gutter pt-safe-top">
      <View className="mb-4 flex-row items-center justify-between">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancel adding voucher"
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center rounded-pill bg-surface"
        >
          <X size={20} color={colors.ink} strokeWidth={2.2} />
        </Pressable>
        <Text className="font-display text-body text-ink">Add voucher</Text>
        <View className="w-11" />
      </View>

      <View className="mb-8 flex-row gap-1.5">
        {STEPS.map((step, index) => (
          <View key={step} className="flex-1 gap-1.5">
            <View className={`h-1 rounded-pill ${index === 0 ? 'bg-action' : 'bg-hairline'}`} />
            <Text className={`text-[11px] ${index === 0 ? 'font-display text-ink' : 'font-body text-muted'}`}>
              {index + 1} {step}
            </Text>
          </View>
        ))}
      </View>

      <Placeholder
        eyebrow="Step 1 of 4"
        title="Capture"
        body="Camera, library import, ML Kit analysis and the details form arrive in Phase 3."
      />
    </View>
  );
}

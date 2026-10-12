import type { ReactNode } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SheetProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** Bottom sheet on a dimmed backdrop; tapping the backdrop closes it. */
export function Sheet({ visible, title, onClose, children }: SheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onClose}
          className="absolute inset-0 bg-ink/40"
        />
        <View
          className="gap-4 rounded-t-panel bg-paper px-gutter pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 20) }}
        >
          <View className="h-1 w-10 self-center rounded-pill bg-hairline" />
          <Text className="font-display text-title text-ink">{title}</Text>
          {children}
        </View>
      </View>
    </Modal>
  );
}

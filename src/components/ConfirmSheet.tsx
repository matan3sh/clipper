import { Pressable, Text } from 'react-native';

import { Button } from '@/components/Button';
import { Sheet } from '@/components/Sheet';

interface ConfirmSheetProps {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Bottom-sheet confirmation for irreversible actions: the action button on top, Cancel below. */
export function ConfirmSheet({ visible, title, body, confirmLabel, onConfirm, onCancel }: ConfirmSheetProps) {
  return (
    <Sheet visible={visible} title={title} onClose={onCancel}>
      <Text className="-mt-2 mb-2 font-body text-[15px] leading-[22px] text-muted">{body}</Text>
      <Button label={confirmLabel} onPress={onConfirm} />
      <Pressable
        accessibilityRole="button"
        onPress={onCancel}
        className="-mt-1 h-[52px] items-center justify-center rounded-pill bg-surface active:opacity-80"
      >
        <Text className="font-display text-body text-ink">Cancel</Text>
      </Pressable>
    </Sheet>
  );
}

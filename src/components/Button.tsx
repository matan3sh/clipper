import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Pressable, Text } from 'react-native';

import { colors } from '@/lib/theme';

interface ButtonProps {
  label: string;
  onPress: () => void;
  /** Fixed for the button's lifetime: the primary variant carries a shadow class, which can't be toggled. */
  variant?: 'primary' | 'outline';
  icon?: LucideIcon;
  loading?: boolean;
  disabled?: boolean;
  /** Stretch to fill the row. */
  grow?: boolean;
  accessibilityLabel?: string;
}

/** 56px pill button: action fill for the main action, hairline outline for the secondary one. */
export function Button({
  label,
  onPress,
  variant = 'primary',
  icon: Icon,
  loading = false,
  disabled = false,
  grow = false,
  accessibilityLabel,
}: ButtonProps) {
  const primary = variant === 'primary';
  const inactive = disabled || loading;
  const textColor = primary ? colors.paper : colors.ink;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      className={`h-14 flex-row items-center justify-center gap-2 rounded-pill px-[22px] active:opacity-90 ${
        primary ? 'bg-action shadow-button' : 'border border-border bg-paper'
      } ${grow ? 'flex-1' : ''} ${disabled ? 'opacity-40' : ''}`}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {Icon ? <Icon size={18} color={textColor} strokeWidth={2.4} /> : null}
          <Text className={`font-display text-body ${primary ? 'text-paper' : 'text-ink'}`}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

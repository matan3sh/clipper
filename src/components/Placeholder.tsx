import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

interface PlaceholderProps {
  eyebrow: string;
  title: string;
  body: string;
  children?: ReactNode;
}

/** Temporary Phase 1 screen body: shows the screen's purpose in the brand type scale. */
export function Placeholder({ eyebrow, title, body, children }: PlaceholderProps) {
  return (
    <View className="gap-1">
      <Text className="font-display text-eyebrow uppercase text-accent-ink">{eyebrow}</Text>
      <Text className="font-display text-heading text-ink">{title}</Text>
      <Text className="font-body text-body text-muted">{body}</Text>
      {children ? <View className="mt-6 gap-3">{children}</View> : null}
    </View>
  );
}

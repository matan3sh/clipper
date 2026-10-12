import { Pressable, ScrollView, Text } from 'react-native';

import { haptics } from '@/lib/haptics';
import { shadows } from '@/lib/theme';

export interface FilterOption {
  id: string;
  label: string;
}

interface FilterPillsProps {
  options: FilterOption[];
  selected: string;
  onSelect: (id: string) => void;
}

/** Horizontally scrolling single-select pills; the selected one uses the action fill. */
export function FilterPills({ options, selected, onSelect }: FilterPillsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="tablist"
      className="-mx-gutter"
      contentContainerClassName="gap-2 px-gutter"
    >
      {options.map((option) => {
        const active = option.id === selected;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => {
              if (!active) haptics.select();
              onSelect(option.id);
            }}
            className={`h-9 justify-center rounded-pill px-3.5 ${active ? 'bg-action' : 'bg-surface'}`}
            style={{ boxShadow: active ? shadows.button : undefined }}
          >
            <Text className={`font-body text-body-sm ${active ? 'text-paper' : 'text-ink'}`}>{option.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

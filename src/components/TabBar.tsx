import { router, Tabs } from 'expo-router';
import { Bell, Plus, SlidersHorizontal, WalletCards, type LucideIcon } from 'lucide-react-native';
import type { ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/lib/theme';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const TABS: Record<string, { label: string; icon: LucideIcon }> = {
  index: { label: 'Home', icon: WalletCards },
  alerts: { label: 'Alerts', icon: Bell },
  settings: { label: 'Settings', icon: SlidersHorizontal },
};

/** Floating white pill with the three tabs, beside the round add button. */
export function TabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="absolute left-gutter right-gutter flex-row items-center gap-3"
      style={{ bottom: Math.max(insets.bottom, 16) }}
    >
      <View className="h-[60px] flex-1 flex-row gap-1 rounded-pill bg-paper p-1.5 shadow-paper-ring">
        {state.routes.map((route, index) => {
          const tab = TABS[route.name];
          if (!tab) return null;
          const focused = state.index === index;
          const Icon = tab.icon;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={tab.label}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
              }}
              className={`flex-1 items-center justify-center gap-0.5 rounded-pill ${focused ? 'bg-surface' : ''}`}
            >
              <Icon size={20} color={focused ? colors.ink : colors.muted} strokeWidth={2} />
              <Text className={`text-[11px] ${focused ? 'font-display text-ink' : 'font-body text-muted'}`}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add a voucher"
        onPress={() => router.push('/voucher/new')}
        className="h-[60px] w-[60px] items-center justify-center rounded-pill bg-action shadow-button active:opacity-90"
      >
        <Plus size={24} color={colors.paper} strokeWidth={2.2} />
      </Pressable>
    </View>
  );
}

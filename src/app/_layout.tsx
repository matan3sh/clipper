import '../global.css';

import { Caveat_600SemiBold } from '@expo-google-fonts/caveat';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useNotificationRouting } from '@/hooks/useNotificationRouting';
import { configureNotifications } from '@/lib/notifications';
import { colors } from '@/lib/theme';

SplashScreen.preventAutoHideAsync();
configureNotifications();

/**
 * Keep the tabs under every stack screen, even when a link opens one directly
 * (e.g. clippr://voucher/new). Without it, closing that screen has nowhere to go back to.
 */
export const unstable_settings = { anchor: '(tabs)' };

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Caveat_600SemiBold,
  });
  const ready = fontsLoaded || fontError !== null;
  useNotificationRouting(ready);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  // Keep the splash screen up until fonts resolve, so text never flashes in a system font.
  if (!ready) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="voucher/new" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="voucher/[id]" />
      </Stack>
    </>
  );
}

/** Route-level error boundary: Expo Router renders this when a screen throws. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View className="flex-1 justify-center gap-3 bg-paper px-gutter">
      <Text className="font-display text-subhead text-ink">Something went wrong</Text>
      <Text className="font-body text-body text-muted">{error.message}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={retry}
        className="mt-2 h-14 items-center justify-center rounded-pill bg-action"
      >
        <Text className="font-display text-body text-paper">Try again</Text>
      </Pressable>
    </View>
  );
}

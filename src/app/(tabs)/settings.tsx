import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useFocusEffect } from 'expo-router';
import { Check, ChevronRight } from 'lucide-react-native';
import { useCallback, useState, type ReactNode } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';

import { ConfirmSheet } from '@/components/ConfirmSheet';
import { Sheet } from '@/components/Sheet';
import { useNotificationStatus } from '@/hooks/useNotificationStatus';
import { formatBytes } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { cancelAllReminders, syncAllReminders } from '@/lib/notifications';
import { deleteAllPhotos, photosDirSize } from '@/lib/photos';
import { useClipprStore } from '@/lib/store';
import { colors } from '@/lib/theme';
import { CURRENCIES, PRESET_REMINDER_DAYS, type CurrencyCode } from '@/types/voucher';

export default function SettingsScreen() {
  const settings = useClipprStore((s) => s.settings);
  const updateSettings = useClipprStore((s) => s.updateSettings);
  const vouchers = useClipprStore((s) => s.vouchers);
  const deleteAllVouchers = useClipprStore((s) => s.deleteAllVouchers);
  const { status } = useNotificationStatus();

  const [timeOpen, setTimeOpen] = useState(false);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [storageBytes, setStorageBytes] = useState(0);

  // Reading the directory touches the filesystem; refresh it whenever the tab comes into view.
  useFocusEffect(useCallback(() => setStorageBytes(photosDirSize()), []));

  const togglePreset = (days: number, on: boolean) => {
    haptics.select();
    const next = on
      ? [...new Set([...settings.defaultReminderDays, days])].sort((a, b) => b - a)
      : settings.defaultReminderDays.filter((d) => d !== days);
    updateSettings({ defaultReminderDays: next });
  };

  // The picker fires on every spinner tick, so only update the stored time here (cheap); the
  // reschedule — which cancels and re-adds every OS notification — runs once when the sheet closes.
  const previewNotifyAt = (date: Date) =>
    updateSettings({ notifyAt: { hour: date.getHours(), minute: date.getMinutes() } });

  const closeTimeSheet = () => {
    setTimeOpen(false);
    syncAllReminders().catch((error: unknown) => console.warn('Clippr: could not reschedule reminders', error));
  };

  const clearAll = () => {
    setConfirmingClear(false);
    cancelAllReminders().catch((error: unknown) => console.warn('Clippr: could not cancel reminders', error));
    deleteAllPhotos();
    deleteAllVouchers();
    setStorageBytes(0);
  };

  const timeLabel = format(new Date(2000, 0, 1, settings.notifyAt.hour, settings.notifyAt.minute), 'h:mm a');
  const notificationsOn = status === 'granted';

  return (
    <ScrollView className="flex-1 bg-paper" contentContainerClassName="gap-6 px-gutter pb-36 pt-safe-top">
      <Text accessibilityRole="header" className="font-display text-heading text-ink">
        Settings
      </Text>

      <Section title="Default reminders" subtitle="Pre-selected for every new voucher">
        <View className="flex-row flex-wrap gap-2">
          {PRESET_REMINDER_DAYS.map((days) => {
            const on = settings.defaultReminderDays.includes(days);
            return (
              <Pressable
                key={days}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => togglePreset(days, !on)}
                className={`h-9 flex-row items-center gap-1.5 rounded-pill border px-3.5 ${on ? 'border-action bg-action' : 'border-border bg-paper'}`}
              >
                {on ? <Check size={14} color={colors.paper} strokeWidth={2.6} /> : null}
                <Text className={`font-body text-body-sm ${on ? 'text-paper' : 'text-ink'}`}>
                  {days === 0 ? 'On the day' : `${days}d`}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Notify at, ${timeLabel}`}
          onPress={() => setTimeOpen(true)}
          className="mt-1 h-[52px] flex-row items-center justify-between border-y border-divider active:opacity-70"
        >
          <Text className="font-body text-[15px] text-ink">Notify at</Text>
          <View className="flex-row items-center gap-1.5">
            <Text className="font-display text-[15px] text-ink">{timeLabel}</Text>
            <ChevronRight size={18} color={colors.muted} strokeWidth={2.2} />
          </View>
        </Pressable>
      </Section>

      <Section title="Currency" subtitle="Used for new vouchers and your total">
        <View className="flex-row gap-2" accessibilityRole="radiogroup" accessibilityLabel="Default currency">
          {CURRENCIES.map((c) => {
            const selected = c.code === settings.defaultCurrency;
            return (
              <Pressable
                key={c.code}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => {
                  if (!selected) haptics.select();
                  updateSettings({ defaultCurrency: c.code as CurrencyCode });
                }}
                className={`h-14 flex-1 items-center justify-center gap-px rounded-card border ${selected ? 'border-action bg-action' : 'border-border bg-paper'}`}
              >
                <Text className={`font-display text-body ${selected ? 'text-paper' : 'text-ink'}`}>{c.symbol}</Text>
                <Text className={`font-display text-[11px] ${selected ? 'text-paper/80' : 'text-muted'}`}>{c.code}</Text>
              </Pressable>
            );
          })}
        </View>
      </Section>

      <Section title="On this phone">
        {status !== null ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Notifications ${notificationsOn ? 'allowed' : 'off'}${notificationsOn ? '' : ', open Settings'}`}
            disabled={notificationsOn}
            onPress={() => Linking.openSettings()}
            className="h-[52px] flex-row items-center justify-between border-b border-divider active:opacity-70"
          >
            <Text className="font-body text-[15px] text-ink">Notifications</Text>
            <View className="flex-row items-center gap-1.5">
              <View className={`h-2 w-2 rounded-pill ${notificationsOn ? 'bg-accent' : 'bg-faint'}`} />
              <Text className={`font-display text-[15px] ${notificationsOn ? 'text-ink' : 'text-muted'}`}>
                {notificationsOn ? 'Allowed' : 'Off'}
              </Text>
              {notificationsOn ? null : <ChevronRight size={18} color={colors.muted} strokeWidth={2.2} />}
            </View>
          </Pressable>
        ) : null}
        <Row label="Stored vouchers">
          <Text className="font-display text-[15px] text-ink">
            {vouchers.length} · {formatBytes(storageBytes)}
          </Text>
        </Row>
        <Pressable
          accessibilityRole="button"
          disabled={vouchers.length === 0}
          onPress={() => {
            haptics.warning();
            setConfirmingClear(true);
          }}
          className="h-[52px] justify-center active:opacity-70"
        >
          <Text className={`font-display text-[15px] ${vouchers.length === 0 ? 'text-faint' : 'text-ink'}`}>
            Delete all vouchers
          </Text>
        </Pressable>
        <Text className="mt-1 font-body text-caption leading-[18px] text-muted">
          No account, no cloud. Photos and details never leave this device.
        </Text>
      </Section>

      <Sheet visible={timeOpen} title="Notify at" onClose={closeTimeSheet}>
        <DateTimePicker
          value={new Date(2000, 0, 1, settings.notifyAt.hour, settings.notifyAt.minute)}
          mode="time"
          display="spinner"
          themeVariant="light"
          onValueChange={(_, date) => previewNotifyAt(date)}
        />
        <Pressable
          accessibilityRole="button"
          onPress={closeTimeSheet}
          className="h-14 items-center justify-center rounded-pill bg-action active:opacity-90"
        >
          <Text className="font-display text-body text-paper">Done</Text>
        </Pressable>
      </Sheet>

      <ConfirmSheet
        visible={confirmingClear}
        title="Delete all vouchers?"
        body={`All ${vouchers.length} ${vouchers.length === 1 ? 'voucher' : 'vouchers'}, their photos and scheduled reminders will be removed from this phone. This can't be undone.`}
        confirmLabel="Delete everything"
        onConfirm={clearAll}
        onCancel={() => setConfirmingClear(false)}
      />
    </ScrollView>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <View className="gap-2.5">
      <View className="gap-0.5">
        <Text className="font-display text-body text-ink">{title}</Text>
        {subtitle ? <Text className="font-body text-caption text-muted">{subtitle}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="h-[52px] flex-row items-center justify-between border-b border-divider">
      <Text className="font-body text-[15px] text-ink">{label}</Text>
      {children}
    </View>
  );
}

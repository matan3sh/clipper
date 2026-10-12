import { format } from 'date-fns';
import { router, useFocusEffect } from 'expo-router';
import { Paperclip } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { formatMoney } from '@/lib/format';
import { notificationText, reminderLabel, splitByWeek, upcomingReminders, type UpcomingReminder } from '@/lib/reminders';
import { useClipprStore, useHydrated } from '@/lib/store';
import { colors } from '@/lib/theme';

function openVoucher(id: string): void {
  router.push({ pathname: '/voucher/[id]', params: { id } });
}

/** Every reminder still to come, soonest first: a preview of the next one, then this week and later. */
export default function AlertsScreen() {
  const hydrated = useHydrated();
  const vouchers = useClipprStore((s) => s.vouchers);
  const notifyAt = useClipprStore((s) => s.settings.notifyAt);
  // Re-read the clock whenever the tab comes into view, so reminders that just fired drop off.
  const [now, setNow] = useState(() => new Date());
  useFocusEffect(useCallback(() => setNow(new Date()), []));

  const upcoming = useMemo(() => upcomingReminders(vouchers, notifyAt, now), [vouchers, notifyAt, now]);
  const { thisWeek, later } = useMemo(() => splitByWeek(upcoming, now), [upcoming, now]);

  if (!hydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-paper">
        <ActivityIndicator color={colors.action} accessibilityLabel="Loading your reminders" />
      </View>
    );
  }

  const next = upcoming[0];

  return (
    <ScrollView className="flex-1 bg-paper" contentContainerClassName="gap-5 px-gutter pb-36 pt-safe-top">
      <View className="gap-1">
        <Text accessibilityRole="header" className="font-display text-heading text-ink">
          Alerts
        </Text>
        <Text className="font-body text-[15px] leading-[22px] text-muted">
          {upcoming.length === 0
            ? 'Nothing scheduled yet'
            : `${upcoming.length} ${upcoming.length === 1 ? 'reminder' : 'reminders'} scheduled on this phone`}
        </Text>
      </View>

      {next ? (
        <>
          <NextReminder item={next} />
          <View>
            {thisWeek.length > 0 ? <Section title="This week" items={thisWeek} soon /> : null}
            {later.length > 0 ? <Section title="Later" items={later} spaced={thisWeek.length > 0} /> : null}
          </View>
        </>
      ) : (
        <View className="items-center gap-1.5 rounded-panel bg-surface px-6 py-8">
          <Text className="font-display text-body text-ink">No reminders</Text>
          <Text className="text-center font-body text-body-sm text-muted">
            Add a voucher with an expiry date and Clippr reminds you before it runs out.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

/** The next reminder, drawn the way iOS will show it. */
function NextReminder({ item }: { item: UpcomingReminder }) {
  const { title, body } = notificationText(item.voucher, item.reminder.daysBefore);
  const time = format(item.date, 'h:mm a');
  return (
    <View className="gap-2">
      <Text className="font-display text-eyebrow uppercase text-accent-ink">
        Next · {format(item.date, 'EEE d MMM')}, {time}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${body}`}
        onPress={() => openVoucher(item.voucher.id)}
        className="rounded-image bg-surface p-3 active:opacity-80"
      >
        <View className="flex-row gap-3 rounded-image bg-paper p-3.5 shadow-paper">
          <View className="h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-action">
            <Paperclip size={18} color={colors.paper} strokeWidth={2.2} />
          </View>
          <View className="flex-1 gap-0.5">
            <View className="flex-row justify-between">
              <Text className="font-display text-[12px] uppercase tracking-[0.24px] text-muted">Clippr</Text>
              <Text className="font-body text-[12px] text-muted">{time}</Text>
            </View>
            <Text className="font-display text-[15px] text-ink">{title}</Text>
            <Text className="font-body text-body-sm text-muted">{body}</Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

interface SectionProps {
  title: string;
  items: UpcomingReminder[];
  /** Within the week: filled accent dots. Later ones get an outlined dot. */
  soon?: boolean;
  spaced?: boolean;
}

function Section({ title, items, soon = false, spaced = false }: SectionProps) {
  return (
    <View className={spaced ? 'mt-3.5' : ''}>
      <Text className="mb-0.5 font-display text-caption text-muted">{title}</Text>
      {items.map((item, i) => (
        <ReminderRow key={item.reminder.id} item={item} soon={soon} last={i === items.length - 1} />
      ))}
    </View>
  );
}

function ReminderRow({ item, soon, last }: { item: UpcomingReminder; soon: boolean; last: boolean }) {
  const { voucher, reminder, date } = item;
  const amount = formatMoney(voucher.amount, voucher.currency);
  const when = `${format(date, 'EEE')} · ${reminderLabel(reminder.daysBefore)}${reminder.custom ? ' (custom)' : ''}`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${voucher.storeName}, ${amount}. ${format(date, 'EEEE d MMMM')}, ${reminderLabel(reminder.daysBefore)}`}
      onPress={() => openVoucher(voucher.id)}
      className={`h-14 flex-row items-center gap-3.5 active:opacity-70 ${last ? '' : 'border-b border-divider'}`}
    >
      <View className="w-10 items-center">
        <Text className="font-display text-title leading-6 text-ink">{format(date, 'd')}</Text>
        <Text className="font-display text-eyebrow uppercase leading-3 text-accent-ink">{format(date, 'MMM')}</Text>
      </View>
      <View className="flex-1 gap-px">
        <Text numberOfLines={1} className="font-display text-[15px] text-ink">
          {voucher.storeName} · {amount}
        </Text>
        <Text className="font-body text-caption text-muted">{when}</Text>
      </View>
      <View className={`h-2.5 w-2.5 rounded-pill ${soon ? 'bg-accent' : 'border-2 border-border'}`} />
    </Pressable>
  );
}

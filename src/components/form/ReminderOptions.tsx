import { format } from 'date-fns';
import { Minus, Plus } from 'lucide-react-native';
import { Pressable, Switch, Text, View } from 'react-native';

import { isReminderPast, reminderDate, reminderLabel, type ReminderChoice } from '@/lib/reminders';
import { colors } from '@/lib/theme';
import { PRESET_REMINDER_DAYS, type Settings } from '@/types/voucher';

const MAX_CUSTOM_DAYS = 60;

interface ReminderOptionsProps {
  expiryDate: string;
  choice: ReminderChoice;
  onChange: (choice: ReminderChoice) => void;
  notifyAt: Settings['notifyAt'];
}

/** Preset reminder switches (7d, 3d, 1d, on the day) plus a custom day-count stepper. */
export function ReminderOptions({ expiryDate, choice, onChange, notifyAt }: ReminderOptionsProps) {
  const timeLabel = format(new Date(2000, 0, 1, notifyAt.hour, notifyAt.minute), 'h:mm a');
  const describe = (days: number) => {
    const when = format(reminderDate(expiryDate, days, notifyAt), 'EEE d MMM');
    return isReminderPast(expiryDate, days, notifyAt) ? `${when} · date already passed` : `${when} · ${timeLabel}`;
  };

  const togglePreset = (days: number, on: boolean) =>
    onChange({ ...choice, presets: on ? [...choice.presets, days] : choice.presets.filter((d) => d !== days) });

  const stepCustom = (delta: 1 | -1) => {
    const current = choice.customDays;
    const next = current === null ? (delta === 1 ? 2 : null) : current + delta < 1 ? null : Math.min(current + delta, MAX_CUSTOM_DAYS);
    onChange({ ...choice, customDays: next });
  };

  return (
    <View>
      {PRESET_REMINDER_DAYS.map((days) => {
        const past = isReminderPast(expiryDate, days, notifyAt);
        const on = !past && choice.presets.includes(days);
        return (
          <View key={days} className="h-[60px] flex-row items-center gap-3 border-b border-divider">
            <View className="flex-1 gap-px">
              <Text className={`font-display text-body ${past ? 'text-faint' : 'text-ink'}`}>{reminderLabel(days)}</Text>
              <Text className="font-body text-caption text-muted">{describe(days)}</Text>
            </View>
            <Switch
              accessibilityLabel={reminderLabel(days)}
              value={on}
              disabled={past}
              onValueChange={(value) => togglePreset(days, value)}
              trackColor={{ true: colors.action, false: colors.hairline }}
            />
          </View>
        );
      })}

      <View className="h-[68px] flex-row items-center gap-3">
        <View className="flex-1 gap-px">
          <Text className="font-display text-body text-ink">Custom</Text>
          <Text className="font-body text-caption text-muted">
            {choice.customDays === null ? 'Off' : describe(choice.customDays)}
          </Text>
        </View>
        <View className="h-11 flex-row items-center gap-0.5 rounded-pill bg-surface px-1">
          <StepperButton label="Fewer days" icon="minus" disabled={choice.customDays === null} onPress={() => stepCustom(-1)} />
          <Text className="min-w-[58px] text-center font-display text-[15px] text-ink">
            {choice.customDays === null ? 'Off' : `${choice.customDays} ${choice.customDays === 1 ? 'day' : 'days'}`}
          </Text>
          <StepperButton
            label="More days"
            icon="plus"
            disabled={choice.customDays === MAX_CUSTOM_DAYS}
            onPress={() => stepCustom(1)}
          />
        </View>
      </View>
    </View>
  );
}

interface StepperButtonProps {
  label: string;
  icon: 'minus' | 'plus';
  disabled: boolean;
  onPress: () => void;
}

function StepperButton({ label, icon, disabled, onPress }: StepperButtonProps) {
  const Icon = icon === 'minus' ? Minus : Plus;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={4}
      className={`h-9 w-9 items-center justify-center rounded-pill bg-paper shadow-subtle ${disabled ? 'opacity-40' : ''}`}
    >
      <Icon size={16} color={colors.ink} strokeWidth={2.4} />
    </Pressable>
  );
}

import { format, parseISO } from 'date-fns';
import { Check, Minus, Plus } from 'lucide-react-native';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { FlowHeader } from '@/components/add-voucher/FlowHeader';
import { buildReminders, isReminderPast, reminderDate, type ReminderChoice } from '@/lib/reminders';
import { colors } from '@/lib/theme';
import { PRESET_REMINDER_DAYS, type Settings } from '@/types/voucher';

const MAX_CUSTOM_DAYS = 60;

interface RemindersStepProps {
  storeName: string;
  expiryDate: string | null;
  choice: ReminderChoice;
  onChange: (choice: ReminderChoice) => void;
  notifyAt: Settings['notifyAt'];
  saving: boolean;
  onBack: () => void;
  onSave: () => void;
}

function presetLabel(days: number): string {
  if (days === 0) return 'On the day';
  return days === 1 ? '1 day before' : `${days} days before`;
}

/** Step 4: pick when to be reminded, then save. */
export function RemindersStep({ storeName, expiryDate, choice, onChange, notifyAt, saving, onBack, onSave }: RemindersStepProps) {
  const timeLabel = format(new Date(2000, 0, 1, notifyAt.hour, notifyAt.minute), 'h:mm a');
  const describe = (days: number) => {
    if (!expiryDate) return '';
    const when = format(reminderDate(expiryDate, days, notifyAt), 'EEE d MMM');
    return isReminderPast(expiryDate, days, notifyAt) ? `${when} · date already passed` : `${when} · ${timeLabel}`;
  };
  const count = buildReminders(expiryDate, choice, notifyAt).length;

  const togglePreset = (days: number, on: boolean) =>
    onChange({ ...choice, presets: on ? [...choice.presets, days] : choice.presets.filter((d) => d !== days) });

  const stepCustom = (delta: 1 | -1) => {
    const current = choice.customDays;
    const next = current === null ? (delta === 1 ? 2 : null) : current + delta < 1 ? null : Math.min(current + delta, MAX_CUSTOM_DAYS);
    onChange({ ...choice, customDays: next });
  };

  return (
    <View className="flex-1 bg-paper">
      <ScrollView className="flex-1" contentContainerClassName="gap-4 px-gutter pb-6 pt-safe-top">
        <FlowHeader step="reminders" action="back" actionLabel="Back to details" onAction={onBack} />

        <View className="gap-1 pt-1">
          <Text accessibilityRole="header" className="font-display text-subhead text-ink">
            When should we remind you?
          </Text>
          <Text className="font-body text-[15px] leading-[22px] text-muted">
            {expiryDate ? `${storeName} · expires ${format(parseISO(expiryDate), 'EEE, d MMM')}` : `${storeName} · no expiry date`}
          </Text>
        </View>

        {expiryDate ? (
          <View>
            {PRESET_REMINDER_DAYS.map((days) => {
              const past = isReminderPast(expiryDate, days, notifyAt);
              const on = !past && choice.presets.includes(days);
              return (
                <View key={days} className="h-[60px] flex-row items-center gap-3 border-b border-divider">
                  <View className="flex-1 gap-px">
                    <Text className={`font-display text-body ${past ? 'text-faint' : 'text-ink'}`}>{presetLabel(days)}</Text>
                    <Text className="font-body text-caption text-muted">{describe(days)}</Text>
                  </View>
                  <Switch
                    accessibilityLabel={presetLabel(days)}
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
        ) : (
          <View className="rounded-card bg-surface p-4">
            <Text className="font-body text-body-sm text-muted">
              This voucher doesn&apos;t expire, so there&apos;s nothing to remind you about. Add an expiry date in the
              previous step if it has one.
            </Text>
          </View>
        )}
      </ScrollView>

      <View className="gap-3 px-gutter pb-[34px] pt-3">
        {expiryDate ? (
          <View className="flex-row items-center justify-center gap-2">
            <View className={`h-2 w-2 rounded-pill ${count > 0 ? 'bg-accent' : 'bg-border'}`} />
            <Text className="font-body text-body-sm text-muted">
              {count === 0 ? 'No reminders' : `${count} ${count === 1 ? 'reminder' : 'reminders'} set`}
            </Text>
          </View>
        ) : null}
        <Button label="Save voucher" icon={Check} loading={saving} onPress={onSave} />
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

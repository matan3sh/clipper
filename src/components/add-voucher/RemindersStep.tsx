import { format, parseISO } from 'date-fns';
import { Check } from 'lucide-react-native';
import { ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { FlowHeader } from '@/components/add-voucher/FlowHeader';
import { ReminderOptions } from '@/components/form/ReminderOptions';
import { buildReminders, type ReminderChoice } from '@/lib/reminders';
import type { Settings } from '@/types/voucher';

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

/** Step 4: pick when to be reminded, then save. */
export function RemindersStep({ storeName, expiryDate, choice, onChange, notifyAt, saving, onBack, onSave }: RemindersStepProps) {
  const count = buildReminders(expiryDate, choice, notifyAt).length;

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
          <ReminderOptions expiryDate={expiryDate} choice={choice} onChange={onChange} notifyAt={notifyAt} />
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

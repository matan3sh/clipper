import { ChevronLeft, X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { FLOW_STEPS, type FlowStep } from '@/hooks/useVoucherDraft';
import { colors } from '@/lib/theme';

const LABELS: Record<FlowStep, string> = {
  capture: 'Capture',
  analyze: 'Analyze',
  details: 'Details',
  reminders: 'Reminders',
};

interface FlowHeaderProps {
  step: FlowStep;
  /** `dark` sits on the camera viewfinder. */
  tone?: 'light' | 'dark';
  /** `close` leaves the flow; `back` goes to the previous step. */
  action: 'close' | 'back';
  actionLabel: string;
  onAction: () => void;
  right?: ReactNode;
}

/** "Add voucher" title row plus the four-step progress indicator. */
export function FlowHeader({ step, tone = 'light', action, actionLabel, onAction, right }: FlowHeaderProps) {
  const dark = tone === 'dark';
  const current = FLOW_STEPS.indexOf(step);
  const Icon = action === 'close' ? X : ChevronLeft;

  return (
    <View className="gap-4">
      <View className="flex-row items-center justify-between">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onAction}
          className={`h-11 w-11 items-center justify-center rounded-pill ${dark ? 'bg-paper/10' : 'bg-surface'}`}
        >
          <Icon size={20} color={dark ? colors.paper : colors.ink} strokeWidth={2.2} />
        </Pressable>
        <Text className={`font-display text-body ${dark ? 'text-paper' : 'text-ink'}`}>Add voucher</Text>
        {right ?? <View className="w-11" />}
      </View>

      <View
        className="flex-row gap-1.5"
        accessibilityRole="progressbar"
        accessibilityLabel={`Step ${current + 1} of ${FLOW_STEPS.length}, ${LABELS[step]}`}
      >
        {FLOW_STEPS.map((s, index) => {
          const reached = index <= current;
          const active = index === current;
          const bar = dark ? (reached ? 'bg-paper' : 'bg-paper/20') : reached ? 'bg-action' : 'bg-hairline';
          const label = dark
            ? active
              ? 'font-display text-paper'
              : 'font-body text-paper/60'
            : active
              ? 'font-display text-ink'
              : 'font-body text-muted';
          return (
            <View key={s} className="flex-1 gap-1.5">
              <View className={`h-1 rounded-pill ${bar}`} />
              <Text className={`text-[11px] ${label}`}>
                {index + 1} {LABELS[s]}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

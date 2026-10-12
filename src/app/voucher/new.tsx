import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';

import { AnalyzeStep } from '@/components/add-voucher/AnalyzeStep';
import { CaptureStep } from '@/components/add-voucher/CaptureStep';
import { DetailsStep } from '@/components/add-voucher/DetailsStep';
import { RemindersStep } from '@/components/add-voucher/RemindersStep';
import { useVoucherDraft } from '@/hooks/useVoucherDraft';

/** Add-voucher flow: Capture → Analyze → Details → Reminders, then save and return Home. */
export default function NewVoucherScreen() {
  const { source } = useLocalSearchParams<{ source?: string }>();
  const draft = useVoucherDraft();

  const save = async () => {
    try {
      await draft.save();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      Alert.alert("Couldn't save the voucher", error instanceof Error ? error.message : 'Please try again.');
    }
  };

  switch (draft.step) {
    case 'capture':
      return (
        <CaptureStep startWithLibrary={source === 'library'} onClose={() => router.back()} onCaptured={draft.analyze} />
      );
    case 'analyze':
      return (
        <AnalyzeStep
          photo={draft.photo}
          analysis={draft.analysis}
          onRetake={draft.retake}
          onContinue={() => draft.setStep('details')}
        />
      );
    case 'details':
      return (
        <DetailsStep
          form={draft.form}
          onChange={draft.updateForm}
          analysis={draft.analysis.status === 'done' ? draft.analysis.result : null}
          onBack={() => draft.setStep('analyze')}
          onContinue={() => draft.setStep('reminders')}
        />
      );
    case 'reminders':
      return (
        <RemindersStep
          storeName={draft.form.storeName.trim()}
          expiryDate={draft.form.expiryDate}
          choice={draft.reminders}
          onChange={draft.setReminders}
          notifyAt={draft.notifyAt}
          saving={draft.saving}
          onBack={() => draft.setStep('details')}
          onSave={save}
        />
      );
  }
}

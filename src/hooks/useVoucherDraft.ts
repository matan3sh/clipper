import { useCallback, useRef, useState } from 'react';

import { amountInputText, parseAmountInput } from '@/lib/format';
import { analyzeImage, type Analysis } from '@/lib/mlkit';
import { scheduleVoucherReminders } from '@/lib/notifications';
import { persistPhoto, preparePhoto, type PreparedPhoto } from '@/lib/photos';
import { buildReminders, type ReminderChoice } from '@/lib/reminders';
import type { DraftForm } from '@/lib/voucherForm';
import { useClipprStore } from '@/lib/store';
import type { Voucher } from '@/types/voucher';

export const FLOW_STEPS = ['capture', 'analyze', 'details', 'reminders'] as const;
export type FlowStep = (typeof FLOW_STEPS)[number];

export type AnalysisState =
  | { status: 'running' }
  | { status: 'done'; result: Analysis }
  | { status: 'failed'; message: string };

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Local state for the add-voucher flow: the photo, its analysis, the details form and the
 * reminder choices. Nothing reaches the store until `save()`.
 */
export function useVoucherDraft() {
  const settings = useClipprStore((s) => s.settings);
  const addVoucher = useClipprStore((s) => s.addVoucher);

  const [step, setStep] = useState<FlowStep>('capture');
  const [photo, setPhoto] = useState<PreparedPhoto | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisState>({ status: 'running' });
  const [form, setForm] = useState<DraftForm>({
    storeName: '',
    amountText: '',
    currency: settings.defaultCurrency,
    expiryDate: null,
    category: null,
    notes: '',
  });
  const [reminders, setReminders] = useState<ReminderChoice>({
    presets: settings.defaultReminderDays,
    customDays: null,
  });
  const [saving, setSaving] = useState(false);

  // A retake can start a new analysis while the old one is still running; only the latest may land.
  const runId = useRef(0);

  const analyze = useCallback(
    async (uri: string, width: number, height: number) => {
      const run = ++runId.current;
      setStep('analyze');
      setPhoto(null);
      setAnalysis({ status: 'running' });
      try {
        const prepared = await preparePhoto(uri, width, height);
        if (run !== runId.current) return;
        setPhoto(prepared);
        const result = await analyzeImage(prepared.uri, prepared);
        if (run !== runId.current) return;
        setAnalysis({ status: 'done', result });
        const { storeName, amount, currency, expiryDate } = result.suggestions;
        setForm((f) => ({
          ...f,
          storeName: storeName ?? '',
          amountText: amount !== null ? amountInputText(amount) : '',
          currency: currency ?? settings.defaultCurrency,
          expiryDate,
        }));
      } catch (error) {
        if (run !== runId.current) return;
        setAnalysis({ status: 'failed', message: message(error) });
      }
    },
    [settings.defaultCurrency],
  );

  const retake = useCallback(() => {
    runId.current++;
    setPhoto(null);
    setStep('capture');
  }, []);

  const updateForm = useCallback((patch: Partial<DraftForm>) => setForm((f) => ({ ...f, ...patch })), []);

  const save = useCallback(async (): Promise<Voucher> => {
    const amount = parseAmountInput(form.amountText);
    if (!photo || amount === null || !form.category) throw new Error('The voucher details are incomplete.');
    setSaving(true);
    try {
      const { photoUri, thumbnailUri } = await persistPhoto(photo.uri);
      const result = analysis.status === 'done' ? analysis.result : null;
      const voucher = addVoucher({
        storeName: form.storeName.trim(),
        category: form.category,
        amount,
        currency: form.currency,
        expiryDate: form.expiryDate,
        photoUri,
        thumbnailUri,
        scanQuality: result?.quality ?? 0,
        extractedText: result?.extractedText || undefined,
        notes: form.notes.trim() || undefined,
        reminders: buildReminders(form.expiryDate, reminders, settings.notifyAt),
      });
      // The voucher is saved either way; a scheduling failure shouldn't hold up the flow.
      scheduleVoucherReminders(voucher).catch((error: unknown) =>
        console.warn('Clippr: could not schedule reminders', error),
      );
      return voucher;
    } finally {
      setSaving(false);
    }
  }, [addVoucher, analysis, form, photo, reminders, settings.notifyAt]);

  return {
    step,
    setStep,
    photo,
    analysis,
    analyze,
    retake,
    form,
    updateForm,
    reminders,
    setReminders,
    notifyAt: settings.notifyAt,
    saving,
    save,
  };
}

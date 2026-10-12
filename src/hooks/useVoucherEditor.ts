import { useCallback, useState } from 'react';

import { amountInputText, parseAmountInput } from '@/lib/format';
import { scheduleVoucherReminders } from '@/lib/notifications';
import { buildReminders, reminderChoice, type ReminderChoice } from '@/lib/reminders';
import { useClipprStore } from '@/lib/store';
import { validateForm, type DraftForm, type FormErrors } from '@/lib/voucherForm';
import type { Voucher } from '@/types/voucher';

function formFrom(voucher: Voucher): DraftForm {
  return {
    storeName: voucher.storeName,
    amountText: amountInputText(voucher.amount),
    currency: voucher.currency,
    expiryDate: voucher.expiryDate,
    category: voucher.category,
    notes: voucher.notes ?? '',
  };
}

/**
 * Detail's edit mode: a working copy of the voucher's fields and reminder choice.
 * Nothing reaches the store until `save()`, which also reschedules the reminders.
 */
export function useVoucherEditor(voucher: Voucher | undefined) {
  const notifyAt = useClipprStore((s) => s.settings.notifyAt);
  const updateVoucher = useClipprStore((s) => s.updateVoucher);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<DraftForm | null>(null);
  const [reminders, setReminders] = useState<ReminderChoice>({ presets: [], customDays: null });
  const [errors, setErrors] = useState<FormErrors>({});
  const [attempted, setAttempted] = useState(false);

  const start = useCallback(() => {
    if (!voucher) return;
    setForm(formFrom(voucher));
    setReminders(reminderChoice(voucher.reminders));
    setErrors({});
    setAttempted(false);
    setEditing(true);
  }, [voucher]);

  const cancel = useCallback(() => setEditing(false), []);

  const update = useCallback(
    (patch: Partial<DraftForm>) => {
      if (!form) return;
      const next = { ...form, ...patch };
      setForm(next);
      if (attempted) setErrors(validateForm(next));
    },
    [attempted, form],
  );

  /** Returns false (and shows field errors) when the form is incomplete. */
  const save = useCallback((): boolean => {
    if (!voucher || !form) return false;
    const found = validateForm(form);
    setAttempted(true);
    setErrors(found);
    const amount = parseAmountInput(form.amountText);
    if (Object.keys(found).length > 0 || amount === null || !form.category) return false;

    updateVoucher(voucher.id, {
      storeName: form.storeName.trim(),
      amount,
      currency: form.currency,
      expiryDate: form.expiryDate,
      category: form.category,
      notes: form.notes.trim() || undefined,
      reminders: buildReminders(form.expiryDate, reminders, notifyAt),
    });
    const saved = useClipprStore.getState().vouchers.find((v) => v.id === voucher.id);
    if (saved) {
      scheduleVoucherReminders(saved).catch((error: unknown) =>
        console.warn('Clippr: could not reschedule reminders', error),
      );
    }
    setEditing(false);
    return true;
  }, [form, notifyAt, reminders, updateVoucher, voucher]);

  return { editing, form, errors, reminders, setReminders, notifyAt, start, cancel, update, save };
}

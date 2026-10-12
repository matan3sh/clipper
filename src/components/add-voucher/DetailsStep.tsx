import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { FlowHeader } from '@/components/add-voucher/FlowHeader';
import { AmountField, CategoryPicker, ExpiryField, Field, Input } from '@/components/form/VoucherFields';
import type { Analysis } from '@/lib/mlkit';
import { validateForm, type DraftForm, type FormErrors } from '@/lib/voucherForm';

interface DetailsStepProps {
  form: DraftForm;
  onChange: (patch: Partial<DraftForm>) => void;
  /** Null when the photo couldn't be read and every field is typed by hand. */
  analysis: Analysis | null;
  onBack: () => void;
  onContinue: () => void;
}

/** Step 3: check what ML Kit filled in, complete the rest and pick a category. */
export function DetailsStep({ form, onChange, analysis, onBack, onContinue }: DetailsStepProps) {
  const [errors, setErrors] = useState<FormErrors>({});
  const [attempted, setAttempted] = useState(false);

  const change = (patch: Partial<DraftForm>) => {
    onChange(patch);
    if (attempted) setErrors(validateForm({ ...form, ...patch }));
  };

  const submit = () => {
    const next = validateForm(form);
    setAttempted(true);
    setErrors(next);
    if (Object.keys(next).length === 0) onContinue();
  };

  const fromPhoto = analysis !== null && !!analysis.suggestions.storeName && form.storeName === analysis.suggestions.storeName;

  return (
    <KeyboardAvoidingView behavior="padding" className="flex-1 bg-paper">
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 px-gutter pb-6 pt-safe-top"
        keyboardShouldPersistTaps="handled"
      >
        <FlowHeader step="details" action="back" actionLabel="Back to analysis" onAction={onBack} />

        <View className="flex-row items-center gap-3 rounded-card bg-surface p-2.5">
          <View className="h-12 w-12 items-center justify-center rounded-[10px] bg-paper shadow-subtle" aria-hidden>
            <View className="h-[34px] w-[26px] gap-[3px] rounded border border-divider p-[5px]" style={{ transform: [{ rotate: '-5deg' }] }}>
              <View className="h-[3px] w-3 rounded-sm bg-ink" />
              <View className="h-[5px] w-3.5 rounded-sm bg-border" />
            </View>
          </View>
          <View className="flex-1 gap-px">
            <Text className="font-display text-body-sm text-ink">
              {analysis
                ? `Quality ${analysis.quality} · ${analysis.fieldsFound} ${analysis.fieldsFound === 1 ? 'field' : 'fields'} filled`
                : 'Nothing read from the photo'}
            </Text>
            <Text className="font-body text-caption text-muted">
              {analysis && analysis.fieldsFound > 0 ? 'Check them and pick a category' : 'Fill in the details and pick a category'}
            </Text>
          </View>
        </View>

        <Field label="Store name" error={errors.storeName}>
          <View>
            <Input
              value={form.storeName}
              onChangeText={(storeName) => change({ storeName })}
              placeholder="e.g. Northwind Books"
              autoCapitalize="words"
              returnKeyType="next"
              invalid={!!errors.storeName}
              className={fromPhoto ? 'pr-[110px]' : ''}
            />
            {fromPhoto ? (
              <View className="absolute right-2.5 top-[13px] h-6 justify-center rounded-pill bg-wash px-2">
                <Text className="font-display text-[11px] text-wash-ink">From photo</Text>
              </View>
            ) : null}
          </View>
        </Field>

        <AmountField amountText={form.amountText} currency={form.currency} error={errors.amountText} onChange={change} />
        <ExpiryField expiryDate={form.expiryDate} onChange={(expiryDate) => change({ expiryDate })} />
        <CategoryPicker value={form.category} error={errors.category} onChange={(category) => change({ category })} />

        <Field label="Notes (optional)">
          <Input
            value={form.notes}
            onChangeText={(notes) => change({ notes })}
            placeholder="Who it's from, what it's for"
            multiline
          />
        </Field>
      </ScrollView>

      <View className="px-gutter pb-[34px] pt-3">
        <Button label="Continue" onPress={submit} />
      </View>
    </KeyboardAvoidingView>
  );
}

import DateTimePicker from '@react-native-community/datetimepicker';
import { format, parseISO, startOfToday } from 'date-fns';
import { CalendarDays, Check, ChevronDown } from 'lucide-react-native';
import { useState, type ComponentProps, type ReactNode } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { Sheet } from '@/components/Sheet';
import { FlowHeader } from '@/components/add-voucher/FlowHeader';
import { currencySymbol, daysUntil, formatDayDate } from '@/lib/format';
import type { Analysis } from '@/lib/mlkit';
import { validateForm, type DraftForm, type FormErrors } from '@/lib/voucherForm';
import { colors } from '@/lib/theme';
import { CATEGORIES, CURRENCIES } from '@/types/voucher';

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
  const [dateOpen, setDateOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);

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
  const days = daysUntil(form.expiryDate);

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

        <Field label="Amount" error={errors.amountText}>
          <View className="flex-row gap-2">
            <Input
              value={form.amountText}
              onChangeText={(amountText) => change({ amountText })}
              placeholder="0.00"
              keyboardType="decimal-pad"
              invalid={!!errors.amountText}
              className="flex-1"
              strong
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Currency, ${form.currency}`}
              onPress={() => setCurrencyOpen(true)}
              className="h-[50px] flex-row items-center gap-1.5 rounded-card border border-border pl-3.5 pr-3"
            >
              <Text className="font-display text-[15px] text-ink">
                {currencySymbol(form.currency)} {form.currency}
              </Text>
              <ChevronDown size={16} color={colors.muted} strokeWidth={2.2} />
            </Pressable>
          </View>
        </Field>

        <Field label="Expiry date">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Expiry date, ${form.expiryDate ? formatDayDate(form.expiryDate) : 'none'}`}
            onPress={() => setDateOpen(true)}
            className="h-[50px] flex-row items-center gap-2.5 rounded-card border border-border px-3.5"
          >
            <CalendarDays size={20} color={colors.ink} strokeWidth={2} />
            <Text className={`flex-1 font-body text-body ${form.expiryDate ? 'text-ink' : 'text-faint'}`}>
              {form.expiryDate ? format(parseISO(form.expiryDate), 'EEE, d MMM yyyy') : 'No expiry date'}
            </Text>
            {days !== null ? (
              <Text className={`font-display text-caption ${days < 0 ? 'text-danger' : 'text-wash-ink'}`}>
                {days < 0 ? 'Expired' : days === 0 ? 'Today' : `in ${days} ${days === 1 ? 'day' : 'days'}`}
              </Text>
            ) : (
              <Text className="font-display text-caption text-accent-ink">Set date</Text>
            )}
          </Pressable>
        </Field>

        <Field label="Category" error={errors.category}>
          <View accessibilityRole="radiogroup" accessibilityLabel="Category" className="flex-row flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const selected = form.category === c.id;
              return (
                <Pressable
                  key={c.id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  onPress={() => change({ category: c.id })}
                  className={`h-9 justify-center rounded-pill border px-3.5 ${selected ? 'border-action bg-action' : 'border-border bg-paper'}`}
                >
                  <Text className={`font-body text-body-sm ${selected ? 'text-paper' : 'text-ink'}`}>{c.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </Field>

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

      <Sheet visible={dateOpen} title="Expiry date" onClose={() => setDateOpen(false)}>
        <DateTimePicker
          value={form.expiryDate ? parseISO(form.expiryDate) : startOfToday()}
          mode="date"
          display="inline"
          minimumDate={startOfToday()}
          accentColor={colors.action}
          themeVariant="light"
          onValueChange={(_, date) => change({ expiryDate: format(date, 'yyyy-MM-dd') })}
        />
        <View className="flex-row gap-2.5">
          <Button
            label="No expiry"
            variant="outline"
            onPress={() => {
              change({ expiryDate: null });
              setDateOpen(false);
            }}
          />
          <Button
            label="Done"
            grow
            onPress={() => {
              // Opening the picker with no date shows today; Done keeps what's shown.
              if (!form.expiryDate) change({ expiryDate: format(startOfToday(), 'yyyy-MM-dd') });
              setDateOpen(false);
            }}
          />
        </View>
      </Sheet>

      <Sheet visible={currencyOpen} title="Currency" onClose={() => setCurrencyOpen(false)}>
        <View accessibilityRole="radiogroup">
          {CURRENCIES.map((c, i) => {
            const selected = c.code === form.currency;
            return (
              <Pressable
                key={c.code}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => {
                  change({ currency: c.code });
                  setCurrencyOpen(false);
                }}
                className={`h-[52px] flex-row items-center gap-3 ${i < CURRENCIES.length - 1 ? 'border-b border-divider' : ''}`}
              >
                <Text className="w-8 font-display text-body text-ink">{c.symbol}</Text>
                <Text className="flex-1 font-body text-body text-ink">{c.code}</Text>
                {selected ? <Check size={20} color={colors.accent} strokeWidth={2.6} /> : null}
              </Pressable>
            );
          })}
        </View>
      </Sheet>
    </KeyboardAvoidingView>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <View className="gap-1.5">
      <Text className="font-body text-caption text-muted">{label}</Text>
      {children}
      {error ? <Text className="font-body text-caption text-danger">{error}</Text> : null}
    </View>
  );
}

type InputProps = ComponentProps<typeof TextInput> & { invalid?: boolean; /** Semibold text, for amounts. */ strong?: boolean };

function Input({ invalid = false, strong = false, className = '', ...props }: InputProps) {
  const [focused, setFocused] = useState(false);
  const border = invalid ? 'border-danger' : focused ? 'border-action' : 'border-border';
  return (
    <TextInput
      {...props}
      onFocus={(e) => {
        setFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        props.onBlur?.(e);
      }}
      placeholderTextColor={colors.faint}
      className={`rounded-card border px-3.5 text-body text-ink ${props.multiline ? 'min-h-[76px] py-3' : 'h-[50px]'} ${strong ? 'font-display' : 'font-body'} ${border} ${className}`}
    />
  );
}

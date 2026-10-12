import DateTimePicker from '@react-native-community/datetimepicker';
import { format, parseISO, startOfToday } from 'date-fns';
import { CalendarDays, Check, ChevronDown } from 'lucide-react-native';
import { useState, type ComponentProps, type ReactNode } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { Sheet } from '@/components/Sheet';
import { currencySymbol, daysUntil, formatDayDate } from '@/lib/format';
import { colors } from '@/lib/theme';
import { CATEGORIES, CURRENCIES, type Category, type CurrencyCode } from '@/types/voucher';

/** Shared voucher form fields, used by the add flow's Details step and Detail's edit mode. */

export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <View className="gap-1.5">
      <Text className="font-body text-caption text-muted">{label}</Text>
      {children}
      {error ? <Text className="font-body text-caption text-danger">{error}</Text> : null}
    </View>
  );
}

type InputProps = ComponentProps<typeof TextInput> & { invalid?: boolean; /** Semibold text, for amounts. */ strong?: boolean };

export function Input({ invalid = false, strong = false, className = '', ...props }: InputProps) {
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

interface AmountFieldProps {
  amountText: string;
  currency: CurrencyCode;
  error?: string;
  onChange: (patch: { amountText?: string; currency?: CurrencyCode }) => void;
}

/** Amount input plus the currency button and its picker sheet. */
export function AmountField({ amountText, currency, error, onChange }: AmountFieldProps) {
  const [open, setOpen] = useState(false);
  return (
    <Field label="Amount" error={error}>
      <View className="flex-row gap-2">
        <Input
          value={amountText}
          onChangeText={(text) => onChange({ amountText: text })}
          placeholder="0.00"
          keyboardType="decimal-pad"
          invalid={!!error}
          className="flex-1"
          strong
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Currency, ${currency}`}
          onPress={() => setOpen(true)}
          className="h-[50px] flex-row items-center gap-1.5 rounded-card border border-border pl-3.5 pr-3"
        >
          <Text className="font-display text-[15px] text-ink">
            {currencySymbol(currency)} {currency}
          </Text>
          <ChevronDown size={16} color={colors.muted} strokeWidth={2.2} />
        </Pressable>
      </View>

      <Sheet visible={open} title="Currency" onClose={() => setOpen(false)}>
        <View accessibilityRole="radiogroup">
          {CURRENCIES.map((c, i) => {
            const selected = c.code === currency;
            return (
              <Pressable
                key={c.code}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => {
                  onChange({ currency: c.code });
                  setOpen(false);
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
    </Field>
  );
}

interface ExpiryFieldProps {
  /** yyyy-MM-dd, or null for no expiry. */
  expiryDate: string | null;
  onChange: (expiryDate: string | null) => void;
}

/** Expiry date row that opens an inline calendar sheet, with a "No expiry" option. */
export function ExpiryField({ expiryDate, onChange }: ExpiryFieldProps) {
  const [open, setOpen] = useState(false);
  const days = daysUntil(expiryDate);
  return (
    <Field label="Expiry date">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Expiry date, ${expiryDate ? formatDayDate(expiryDate) : 'none'}`}
        onPress={() => setOpen(true)}
        className="h-[50px] flex-row items-center gap-2.5 rounded-card border border-border px-3.5"
      >
        <CalendarDays size={20} color={colors.ink} strokeWidth={2} />
        <Text className={`flex-1 font-body text-body ${expiryDate ? 'text-ink' : 'text-faint'}`}>
          {expiryDate ? format(parseISO(expiryDate), 'EEE, d MMM yyyy') : 'No expiry date'}
        </Text>
        {days !== null ? (
          <Text className={`font-display text-caption ${days < 0 ? 'text-danger' : 'text-wash-ink'}`}>
            {days < 0 ? 'Expired' : days === 0 ? 'Today' : `in ${days} ${days === 1 ? 'day' : 'days'}`}
          </Text>
        ) : (
          <Text className="font-display text-caption text-accent-ink">Set date</Text>
        )}
      </Pressable>

      <Sheet visible={open} title="Expiry date" onClose={() => setOpen(false)}>
        <DateTimePicker
          value={expiryDate ? parseISO(expiryDate) : startOfToday()}
          mode="date"
          display="inline"
          minimumDate={startOfToday()}
          accentColor={colors.action}
          themeVariant="light"
          onValueChange={(_, date) => onChange(format(date, 'yyyy-MM-dd'))}
        />
        <View className="flex-row gap-2.5">
          <Button
            label="No expiry"
            variant="outline"
            onPress={() => {
              onChange(null);
              setOpen(false);
            }}
          />
          <Button
            label="Done"
            grow
            onPress={() => {
              // Opening the picker with no date shows today; Done keeps what's shown.
              if (!expiryDate) onChange(format(startOfToday(), 'yyyy-MM-dd'));
              setOpen(false);
            }}
          />
        </View>
      </Sheet>
    </Field>
  );
}

interface CategoryPickerProps {
  value: Category | null;
  error?: string;
  onChange: (category: Category) => void;
}

/** Wrapping row of category pills; the selected one takes the action fill. */
export function CategoryPicker({ value, error, onChange }: CategoryPickerProps) {
  return (
    <Field label="Category" error={error}>
      <View accessibilityRole="radiogroup" accessibilityLabel="Category" className="flex-row flex-wrap gap-2">
        {CATEGORIES.map((c) => {
          const selected = value === c.id;
          return (
            <Pressable
              key={c.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => onChange(c.id)}
              className={`h-9 justify-center rounded-pill border px-3.5 ${selected ? 'border-action bg-action' : 'border-border bg-paper'}`}
            >
              <Text className={`font-body text-body-sm ${selected ? 'text-paper' : 'text-ink'}`}>{c.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </Field>
  );
}

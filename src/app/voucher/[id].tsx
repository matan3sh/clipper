import { format, parseISO } from 'date-fns';
import { useLocalSearchParams } from 'expo-router';
import { Check, ChevronLeft, Pencil, Share, Trash2 } from 'lucide-react-native';
import { useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Pressable, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { ConfirmSheet } from '@/components/ConfirmSheet';
import { ExpiryCard } from '@/components/detail/ExpiryCard';
import { VoucherPhoto } from '@/components/detail/VoucherPhoto';
import { ReminderOptions } from '@/components/form/ReminderOptions';
import { AmountField, CategoryPicker, ExpiryField, Field, Input } from '@/components/form/VoucherFields';
import { useVoucherActions } from '@/hooks/useVoucherActions';
import { useVoucherEditor } from '@/hooks/useVoucherEditor';
import { categoryLabel } from '@/lib/categories';
import { formatMoney } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { goBackOrHome } from '@/lib/navigation';
import { photoFileUri } from '@/lib/photos';
import { remindersSummary, upcomingReminders } from '@/lib/reminders';
import { useClipprStore, useHydrated } from '@/lib/store';
import { colors } from '@/lib/theme';
import { qualityTier, type Voucher } from '@/types/voucher';

export default function VoucherDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const hydrated = useHydrated();
  const voucher = useClipprStore((s) => s.vouchers.find((v) => v.id === id));

  if (!hydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-paper">
        <ActivityIndicator color={colors.action} accessibilityLabel="Loading the voucher" />
      </View>
    );
  }
  if (!voucher) return <MissingVoucher />;
  return <VoucherDetail voucher={voucher} />;
}

function VoucherDetail({ voucher }: { voucher: Voucher }) {
  const editor = useVoucherEditor(voucher);
  const { share, markUsed, remove: removeVoucher } = useVoucherActions(voucher);
  const notifyAt = useClipprStore((s) => s.settings.notifyAt);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const scheduled = useMemo(() => upcomingReminders([voucher], notifyAt).length, [voucher, notifyAt]);
  const photoUri = photoFileUri(voucher.photoUri);
  const active = voucher.status === 'active';

  const remove = () => {
    setConfirmingDelete(false);
    // Leave first, so the screen doesn't flash its "not found" state while it animates away.
    goBackOrHome();
    removeVoucher();
  };

  const finish = () => {
    markUsed();
    goBackOrHome();
  };

  const save = () => {
    if (editor.save()) haptics.success();
  };

  const what = photoUri ? 'Its photo, details' : 'Its details';
  const reminderText = scheduled === 0 ? '' : ` and ${scheduled} scheduled ${scheduled === 1 ? 'reminder' : 'reminders'}`;

  return (
    <View className="flex-1 bg-paper">
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-4 px-gutter pb-6 pt-safe-top"
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-row items-center justify-between">
            <IconButton label="Back" onPress={editor.editing ? editor.cancel : goBackOrHome}>
              <ChevronLeft size={20} color={colors.ink} strokeWidth={2.2} />
            </IconButton>
            <View className="flex-row gap-2">
              {photoUri && !editor.editing ? (
                <IconButton label="Share the photo" onPress={share}>
                  <Share size={18} color={colors.ink} strokeWidth={2.2} />
                </IconButton>
              ) : null}
              <Pressable
                accessibilityRole="button"
                onPress={editor.editing ? editor.cancel : editor.start}
                className="h-11 flex-row items-center gap-1.5 rounded-pill bg-surface px-4 active:opacity-80"
              >
                {editor.editing ? null : <Pencil size={16} color={colors.ink} strokeWidth={2.2} />}
                <Text className="font-display text-[15px] text-ink">{editor.editing ? 'Cancel' : 'Edit'}</Text>
              </Pressable>
            </View>
          </View>

          <VoucherPhoto voucher={voucher} />

          {editor.editing && editor.form ? (
            <EditFields editor={editor} />
          ) : (
            <Summary voucher={voucher} />
          )}
        </ScrollView>

        <View className="flex-row gap-2.5 px-gutter pb-[34px] pt-3">
          {editor.editing ? (
            <Button key="save" label="Save changes" icon={Check} grow onPress={save} />
          ) : (
            <>
              <Button
                key="delete"
                label="Delete"
                icon={Trash2}
                variant="outline"
                grow={!active}
                onPress={() => {
                  haptics.warning();
                  setConfirmingDelete(true);
                }}
              />
              {active ? <Button key="used" label="Mark as used" icon={Check} grow onPress={finish} /> : null}
            </>
          )}
        </View>
      </KeyboardAvoidingView>

      <ConfirmSheet
        visible={confirmingDelete}
        title="Delete this voucher?"
        body={`${what}${reminderText} will be removed from this phone. This can't be undone.`}
        confirmLabel="Delete voucher"
        onConfirm={remove}
        onCancel={() => setConfirmingDelete(false)}
      />
    </View>
  );
}

function Summary({ voucher }: { voucher: Voucher }) {
  const tier = qualityTier(voucher.scanQuality);
  return (
    <>
      <View className="gap-0.5">
        <View className="flex-row items-center gap-2">
          <Text className="font-display text-eyebrow uppercase text-accent-ink">{categoryLabel(voucher.category)}</Text>
          {voucher.status === 'used' ? (
            <View className="rounded-pill bg-surface px-2 py-0.5">
              <Text className="font-display text-[11px] leading-4 text-muted">Used</Text>
            </View>
          ) : null}
        </View>
        <View className="flex-row items-baseline justify-between gap-3">
          <Text accessibilityRole="header" className="flex-1 font-display text-[28px] leading-[35px] tracking-[-0.84px] text-ink">
            {voucher.storeName}
          </Text>
          <Text className="font-display text-[28px] leading-[35px] tracking-[-0.84px] text-ink">
            {formatMoney(voucher.amount, voucher.currency)}
          </Text>
        </View>
      </View>

      <ExpiryCard voucher={voucher} />

      <View>
        <InfoRow label="Reminders" value={voucher.expiryDate ? remindersSummary(voucher.reminders) : 'No expiry date'} />
        <InfoRow label="Scan quality">
          <View className="flex-row items-center gap-1.5">
            <View className={`h-2 w-2 rounded-pill ${tier === 'rescan' ? 'bg-danger' : 'bg-accent'}`} />
            <Text className="font-display text-[15px] text-ink">
              {voucher.photoUri || voucher.scanQuality > 0 ? `${voucher.scanQuality} / 100` : 'Not scanned'}
            </Text>
          </View>
        </InfoRow>
        <InfoRow label="Added" value={format(parseISO(voucher.createdAt), 'EEE, d MMM yyyy')} last={!voucher.notes} />
      </View>

      {voucher.notes ? (
        <View className="gap-1">
          <Text className="font-body text-[15px] text-muted">Notes</Text>
          <Text className="font-hand text-[22px] leading-7 text-ink">{voucher.notes}</Text>
        </View>
      ) : null}
    </>
  );
}

function EditFields({ editor }: { editor: ReturnType<typeof useVoucherEditor> }) {
  const { form, errors, update } = editor;
  if (!form) return null;
  return (
    <>
      <Field label="Store name" error={errors.storeName}>
        <Input
          value={form.storeName}
          onChangeText={(storeName) => update({ storeName })}
          placeholder="e.g. Northwind Books"
          autoCapitalize="words"
          invalid={!!errors.storeName}
        />
      </Field>
      <AmountField amountText={form.amountText} currency={form.currency} error={errors.amountText} onChange={update} />
      <ExpiryField expiryDate={form.expiryDate} onChange={(expiryDate) => update({ expiryDate })} />
      <CategoryPicker value={form.category} error={errors.category} onChange={(category) => update({ category })} />
      <Field label="Notes (optional)">
        <Input value={form.notes} onChangeText={(notes) => update({ notes })} placeholder="Who it's from, what it's for" multiline />
      </Field>

      <View className="gap-1 pt-2">
        <Text className="font-display text-title text-ink">Reminders</Text>
        {form.expiryDate ? (
          <ReminderOptions
            expiryDate={form.expiryDate}
            choice={editor.reminders}
            onChange={editor.setReminders}
            notifyAt={editor.notifyAt}
          />
        ) : (
          <Text className="font-body text-body-sm text-muted">Set an expiry date to get reminders before it runs out.</Text>
        )}
      </View>
    </>
  );
}

function InfoRow({ label, value, last = false, children }: { label: string; value?: string; last?: boolean; children?: ReactNode }) {
  return (
    <View className={`min-h-12 flex-row items-center justify-between gap-4 py-2 ${last ? '' : 'border-b border-divider'}`}>
      <Text className="font-body text-[15px] text-muted">{label}</Text>
      {children ?? <Text className="flex-1 text-right font-display text-[15px] text-ink">{value}</Text>}
    </View>
  );
}

function IconButton({ label, onPress, children }: { label: string; onPress: () => void; children: ReactNode }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="h-11 w-11 items-center justify-center rounded-pill bg-surface active:opacity-80"
    >
      {children}
    </Pressable>
  );
}

/** Shown when the id doesn't match a voucher: it was deleted, or a stale notification was tapped. */
function MissingVoucher() {
  return (
    <View className="flex-1 gap-4 bg-paper px-gutter pt-safe-top">
      <IconButton label="Back" onPress={goBackOrHome}>
        <ChevronLeft size={20} color={colors.ink} strokeWidth={2.2} />
      </IconButton>
      <View className="gap-1.5 pt-4">
        <Text className="font-display text-subhead text-ink">Voucher not found</Text>
        <Text className="font-body text-body text-muted">It may have been deleted. Your other vouchers are on Home.</Text>
      </View>
    </View>
  );
}

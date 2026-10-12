import { Check, Share, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { ConfirmSheet } from '@/components/ConfirmSheet';
import { Sheet } from '@/components/Sheet';
import { useVoucherActions } from '@/hooks/useVoucherActions';
import { haptics } from '@/lib/haptics';
import { photoFileUri } from '@/lib/photos';
import { upcomingReminders } from '@/lib/reminders';
import { useClipprStore } from '@/lib/store';
import { colors } from '@/lib/theme';
import type { Voucher } from '@/types/voucher';

interface VoucherQuickActionsProps {
  /** The long-pressed voucher, or null when the sheet is closed. */
  voucher: Voucher | null;
  onClose: () => void;
}

/** Long-press menu on a Home card: mark used, share the photo, or delete. */
export function VoucherQuickActions({ voucher, onClose }: VoucherQuickActionsProps) {
  // Remount per voucher so useVoucherActions always has a concrete one and its own confirm state.
  if (!voucher) return null;
  return <QuickActions key={voucher.id} voucher={voucher} onClose={onClose} />;
}

function QuickActions({ voucher, onClose }: { voucher: Voucher; onClose: () => void }) {
  const { share, markUsed, remove, canShare } = useVoucherActions(voucher);
  const notifyAt = useClipprStore((s) => s.settings.notifyAt);
  const [confirming, setConfirming] = useState(false);

  const active = voucher.status === 'active';
  const hasPhoto = photoFileUri(voucher.photoUri) !== null;
  const scheduled = upcomingReminders([voucher], notifyAt).length;
  const what = hasPhoto ? 'Its photo, details' : 'Its details';
  const reminderText = scheduled === 0 ? '' : ` and ${scheduled} scheduled ${scheduled === 1 ? 'reminder' : 'reminders'}`;

  return (
    <>
      <Sheet visible={!confirming} title={voucher.storeName} onClose={onClose}>
        <View className="gap-2.5">
          {active ? (
            <Button
              label="Mark as used"
              icon={Check}
              onPress={() => {
                markUsed();
                onClose();
              }}
            />
          ) : null}
          {canShare ? (
            <Button
              label="Share photo"
              icon={Share}
              variant="outline"
              onPress={async () => {
                await share();
                onClose();
              }}
            />
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Delete voucher"
            onPress={() => {
              haptics.warning();
              setConfirming(true);
            }}
            className="h-14 flex-row items-center justify-center gap-2 rounded-pill bg-danger-wash active:opacity-80"
          >
            <Trash2 size={18} color={colors.danger} strokeWidth={2.2} />
            <Text className="font-display text-body text-danger">Delete</Text>
          </Pressable>
        </View>
      </Sheet>

      <ConfirmSheet
        visible={confirming}
        title="Delete this voucher?"
        body={`${what}${reminderText} will be removed from this phone. This can't be undone.`}
        confirmLabel="Delete voucher"
        onConfirm={() => {
          remove();
          onClose();
        }}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}

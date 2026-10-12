import * as Sharing from 'expo-sharing';
import { useCallback } from 'react';

import { haptics } from '@/lib/haptics';
import { cancelVoucherReminders } from '@/lib/notifications';
import { deletePhotos, photoFileUri } from '@/lib/photos';
import { useClipprStore } from '@/lib/store';
import type { Voucher } from '@/types/voucher';

/**
 * The side effects shared by the Detail screen and Home's long-press quick actions: share the
 * photo, mark used (cancels reminders), and delete (cancels reminders, removes photos).
 * Navigation stays with the caller, since Detail leaves the screen and Home does not.
 */
export function useVoucherActions(voucher: Voucher) {
  const markUsedStore = useClipprStore((s) => s.markUsed);
  const deleteVoucherStore = useClipprStore((s) => s.deleteVoucher);
  const photoUri = photoFileUri(voucher.photoUri);

  const share = useCallback(async () => {
    if (!photoUri || !(await Sharing.isAvailableAsync())) return;
    try {
      await Sharing.shareAsync(photoUri, { mimeType: 'image/jpeg', UTI: 'public.jpeg', dialogTitle: voucher.storeName });
    } catch (error) {
      console.warn('Clippr: could not share the photo', error);
    }
  }, [photoUri, voucher.storeName]);

  const markUsed = useCallback(() => {
    markUsedStore(voucher.id);
    cancelVoucherReminders(voucher).catch((error: unknown) => console.warn('Clippr: could not cancel reminders', error));
    haptics.success();
  }, [markUsedStore, voucher]);

  const remove = useCallback(() => {
    cancelVoucherReminders(voucher).catch((error: unknown) => console.warn('Clippr: could not cancel reminders', error));
    deletePhotos([voucher.photoUri, voucher.thumbnailUri]);
    deleteVoucherStore(voucher.id);
  }, [deleteVoucherStore, voucher]);

  return { share, markUsed, remove, canShare: photoUri !== null };
}

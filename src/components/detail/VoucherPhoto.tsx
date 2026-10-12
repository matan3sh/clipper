import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { Maximize2, X } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';

import { formatMoney } from '@/lib/format';
import { photoFileUri } from '@/lib/photos';
import { colors } from '@/lib/theme';
import type { Voucher } from '@/types/voucher';

/** Bar widths for the drawn barcode on vouchers saved without a photo (the samples). */
const BARS = [2, 1, 1, 3, 2, 1, 2, 1, 3, 1, 1, 2, 3, 1, 2, 1, 1, 3, 2, 1, 2, 2, 1, 3, 1, 2];

/**
 * The voucher as tilted paper on a lavender sheet: the saved photo, or a drawn voucher when there's
 * no photo. "Full photo" opens a pinch-to-zoom viewer.
 */
export function VoucherPhoto({ voucher }: { voucher: Voucher }) {
  const [viewing, setViewing] = useState(false);
  const uri = photoFileUri(voucher.photoUri);

  return (
    <View className="h-[196px] overflow-hidden rounded-panel bg-surface">
      <View className="absolute inset-0 items-center justify-center" aria-hidden>
        <View
          className="absolute h-[150px] w-[200px] rounded-[10px] bg-wash"
          style={{ transform: [{ translateX: 12 }, { translateY: 6 }, { rotate: '5deg' }] }}
        />
        <View
          className="h-[150px] w-[200px] overflow-hidden rounded-[10px] bg-paper shadow-paper"
          style={{ transform: [{ translateX: -12 }, { rotate: '-3deg' }] }}
        >
          {uri ? (
            <Image source={{ uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          ) : (
            <DrawnVoucher voucher={voucher} />
          )}
        </View>
      </View>

      {uri ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open the full photo"
          onPress={() => setViewing(true)}
          className="absolute bottom-3 right-3 h-8 flex-row items-center gap-1.5 rounded-pill bg-paper px-3 shadow-subtle"
        >
          <Maximize2 size={14} color={colors.ink} strokeWidth={2.2} />
          <Text className="font-display text-caption text-ink">Full photo</Text>
        </Pressable>
      ) : null}

      {uri ? <PhotoViewer uri={uri} storeName={voucher.storeName} visible={viewing} onClose={() => setViewing(false)} /> : null}
    </View>
  );
}

function DrawnVoucher({ voucher }: { voucher: Voucher }) {
  return (
    <View className="flex-1 gap-1.5 p-4">
      <View className="flex-row items-start justify-between gap-2">
        <Text numberOfLines={2} className="flex-1 font-strong text-[11px] uppercase leading-[12px] text-ink">
          {voucher.storeName}
        </Text>
        <Text className="font-display text-[7px] uppercase tracking-[0.5px] text-muted">Gift voucher</Text>
      </View>
      <Text className="font-display text-[26px] leading-8 tracking-[-0.8px] text-ink">
        {formatMoney(voucher.amount, voucher.currency)}
      </Text>
      <View className="flex-1" />
      <View className="h-[22px] flex-row gap-px">
        {BARS.map((width, i) => (
          <View key={i} className={i % 2 === 0 ? 'bg-ink' : 'bg-paper'} style={{ width: width * 2 }} />
        ))}
      </View>
    </View>
  );
}

interface PhotoViewerProps {
  uri: string;
  storeName: string;
  visible: boolean;
  onClose: () => void;
}

/** Full-screen photo on the dark viewfinder colour; pinch or double-tap to zoom (iOS ScrollView zoom). */
function PhotoViewer({ uri, storeName, visible, onClose }: PhotoViewerProps) {
  const { width, height } = useWindowDimensions();
  return (
    <Modal visible={visible} animationType="fade" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View className="flex-1 bg-camera">
        <StatusBar style="light" />
        <ScrollView
          maximumZoomScale={4}
          minimumZoomScale={1}
          centerContent
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          contentContainerClassName="flex-1"
        >
          <Image
            source={{ uri }}
            accessibilityLabel={`Photo of the ${storeName} voucher`}
            style={{ width, height }}
            contentFit="contain"
          />
        </ScrollView>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close photo"
          onPress={onClose}
          className="absolute left-gutter top-safe-top h-11 w-11 items-center justify-center rounded-pill bg-paper/10"
        >
          <X size={20} color={colors.paper} strokeWidth={2.2} />
        </Pressable>
      </View>
    </Modal>
  );
}

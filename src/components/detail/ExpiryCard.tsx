import { format, parseISO } from 'date-fns';
import { CalendarX, Infinity as NoExpiry } from 'lucide-react-native';
import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { daysUntil } from '@/lib/format';
import { colors } from '@/lib/theme';
import type { Voucher } from '@/types/voucher';

const RADIUS = 18;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
/** The ring empties over the last 30 days, matching the "expiring" window used everywhere else. */
const WINDOW_DAYS = 30;

function headline(days: number): string {
  if (days < 0) return days === -1 ? 'Expired yesterday' : `Expired ${-days} days ago`;
  if (days === 0) return 'Expires today';
  if (days === 1) return 'Expires tomorrow';
  return `Expires in ${days} days`;
}

/** Lavender card with a countdown ring: how long is left and the full expiry date. */
export function ExpiryCard({ voucher }: { voucher: Pick<Voucher, 'expiryDate'> }) {
  const days = daysUntil(voucher.expiryDate);
  const expired = days !== null && days < 0;

  return (
    <View className={`flex-row items-center gap-3.5 rounded-card px-4 py-3.5 ${expired ? 'bg-danger-wash' : 'bg-wash'}`}>
      <View className="h-11 w-11 items-center justify-center">
        {days === null ? (
          <View className="h-11 w-11 items-center justify-center rounded-pill bg-paper">
            <NoExpiry size={20} color={colors.washInk} strokeWidth={2.2} />
          </View>
        ) : expired ? (
          <View className="h-11 w-11 items-center justify-center rounded-pill bg-paper">
            <CalendarX size={20} color={colors.danger} strokeWidth={2.2} />
          </View>
        ) : (
          <>
            <Svg width={44} height={44} viewBox="0 0 44 44" style={{ position: 'absolute' }}>
              <Circle cx={22} cy={22} r={RADIUS} fill={colors.paper} stroke={colors.paper} strokeWidth={5} />
              <Circle
                cx={22}
                cy={22}
                r={RADIUS}
                fill="none"
                stroke={colors.accent}
                strokeWidth={5}
                strokeLinecap="round"
                strokeDasharray={`${(CIRCUMFERENCE * Math.min(days, WINDOW_DAYS)) / WINDOW_DAYS} ${CIRCUMFERENCE}`}
                transform="rotate(-90 22 22)"
              />
            </Svg>
            <Text className="font-display text-[15px] text-ink">{days}</Text>
          </>
        )}
      </View>
      <View className="flex-1 gap-px">
        <Text className={`font-display text-body ${expired ? 'text-danger' : 'text-ink'}`}>
          {days === null ? 'No expiry date' : headline(days)}
        </Text>
        <Text className={`font-body text-body-sm ${expired ? 'text-danger' : 'text-wash-muted'}`}>
          {voucher.expiryDate ? format(parseISO(voucher.expiryDate), 'EEEE, d MMM yyyy') : 'Use it whenever you like'}
        </Text>
      </View>
    </View>
  );
}

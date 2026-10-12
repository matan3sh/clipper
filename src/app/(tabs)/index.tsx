import { Paperclip } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { ExpiringBanner } from '@/components/ExpiringBanner';
import { FilterPills, type FilterOption } from '@/components/FilterPills';
import { VoucherCard } from '@/components/VoucherCard';
import { categoryLabel } from '@/lib/categories';
import { byExpiry, daysUntil, expiryState, splitMoney } from '@/lib/format';
import { activeVouchers, useClipprStore, useHydrated } from '@/lib/store';
import { colors } from '@/lib/theme';
import { CATEGORIES } from '@/types/voucher';

const ALL = 'all';
const EXPIRING = 'expiring';
const USED = 'used';

export default function HomeScreen() {
  const hydrated = useHydrated();
  const vouchers = useClipprStore((s) => s.vouchers);
  const currency = useClipprStore((s) => s.settings.defaultCurrency);
  const [filter, setFilter] = useState<string>(ALL);

  const active = useMemo(() => activeVouchers(vouchers).sort(byExpiry), [vouchers]);
  const used = useMemo(() => vouchers.filter((v) => v.status === 'used').sort(byExpiry), [vouchers]);

  const summary = useMemo(() => {
    const usable = active.filter((v) => expiryState(v) !== 'expired');
    const total = usable.filter((v) => v.currency === currency).reduce((sum, v) => sum + v.amount, 0);
    const otherCurrencies = usable.some((v) => v.currency !== currency);
    const expiringSoon = active.filter((v) => expiryState(v) === 'soon');
    const thisWeek = active.filter((v) => {
      const days = daysUntil(v.expiryDate);
      return days !== null && days >= 0 && days <= 7;
    });
    return { total, otherCurrencies, expiringSoon, thisWeek };
  }, [active, currency]);

  const options = useMemo<FilterOption[]>(() => {
    const present = CATEGORIES.filter((c) => active.some((v) => v.category === c.id));
    return [
      { id: ALL, label: `All ${active.length}` },
      ...(summary.expiringSoon.length > 0 ? [{ id: EXPIRING, label: `Expiring ${summary.expiringSoon.length}` }] : []),
      ...present.map((c) => ({ id: c.id, label: categoryLabel(c.id) })),
      ...(used.length > 0 ? [{ id: USED, label: `Used ${used.length}` }] : []),
    ];
  }, [active, summary.expiringSoon.length, used.length]);

  // A filter can disappear (e.g. its last voucher was deleted); fall back to All.
  const selected = options.some((o) => o.id === filter) ? filter : ALL;
  const visible = useMemo(() => {
    if (selected === ALL) return active;
    if (selected === EXPIRING) return summary.expiringSoon;
    if (selected === USED) return used;
    return active.filter((v) => v.category === selected);
  }, [active, selected, summary.expiringSoon, used]);

  if (!hydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-paper">
        <ActivityIndicator color={colors.action} accessibilityLabel="Loading your vouchers" />
      </View>
    );
  }

  const { whole, cents } = splitMoney(summary.total, currency);
  const soonCount = summary.expiringSoon.length;

  return (
    <ScrollView className="flex-1 bg-paper" contentContainerClassName="gap-[22px] px-gutter pb-36 pt-safe-top">
      <View className="flex-row items-center gap-2">
        <Paperclip size={24} color={colors.ink} strokeWidth={2.2} />
        <Text className="font-display text-title text-ink">Clippr</Text>
      </View>

      <View className="gap-1">
        <Text className="font-display text-eyebrow uppercase text-accent-ink">Total on hand</Text>
        <Text className="font-display text-display text-ink">
          {whole}
          <Text className="text-faint">{cents}</Text>
        </Text>
        <Text className="font-body text-[15px] leading-[22px] text-muted">
          {active.length === 0
            ? 'No vouchers yet'
            : `Across ${active.length} ${active.length === 1 ? 'voucher' : 'vouchers'}` +
              (soonCount > 0 ? ` · ${soonCount} expire${soonCount === 1 ? 's' : ''} within 30 days` : '') +
              (summary.otherCurrencies ? ' · plus other currencies' : '')}
        </Text>
      </View>

      {active.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {summary.thisWeek[0] ? (
            <ExpiringBanner voucher={summary.thisWeek[0]} others={summary.thisWeek.length - 1} />
          ) : null}
          <FilterPills options={options} selected={selected} onSelect={setFilter} />
          <View>
            {visible.map((voucher, index) => (
              <VoucherCard key={voucher.id} voucher={voucher} index={index} />
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDays, format, startOfToday } from 'date-fns';
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { newId } from '@/lib/ids';
import type { Reminder, Settings, Voucher } from '@/types/voucher';

export type NewVoucher = Omit<Voucher, 'id' | 'createdAt' | 'updatedAt' | 'status'>;

interface ClipprState {
  vouchers: Voucher[];
  settings: Settings;
  /** True once the sample vouchers have been added, so deleting them never brings them back. */
  seeded: boolean;
  addVoucher: (input: NewVoucher) => Voucher;
  updateVoucher: (id: string, patch: Partial<Omit<Voucher, 'id' | 'createdAt'>>) => void;
  deleteVoucher: (id: string) => void;
  markUsed: (id: string) => void;
  /**
   * Records the iOS notification ids scheduled for a voucher, keyed by reminder id. Reminders not in
   * the map lose their id. Doesn't touch `updatedAt`: this is bookkeeping, not a user edit.
   */
  setNotificationIds: (voucherId: string, ids: Record<string, string>) => void;
  deleteAllVouchers: () => void;
  updateSettings: (patch: Partial<Settings>) => void;
}

const DEFAULT_SETTINGS: Settings = {
  defaultReminderDays: [7, 3, 1],
  defaultCurrency: 'ILS',
  notifyAt: { hour: 9, minute: 0 },
};

export function defaultReminders(days: number[]): Reminder[] {
  return days.map((daysBefore) => ({ id: newId(), daysBefore, enabled: true }));
}

/** Sample wallet from the design, with expiry dates relative to today so the banner always has something to show. */
function sampleVouchers(settings: Settings): Voucher[] {
  const now = new Date().toISOString();
  const inDays = (n: number) => format(addDays(startOfToday(), n), 'yyyy-MM-dd');
  const base = {
    currency: settings.defaultCurrency,
    photoUri: '',
    status: 'active' as const,
    createdAt: now,
    updatedAt: now,
  };
  return [
    { ...base, id: newId(), storeName: 'Northwind Books', category: 'books', amount: 40, expiryDate: inDays(6), scanQuality: 86, notes: 'Birthday gift from Dana — for the cookbook', reminders: defaultReminders([3, 1]) },
    { ...base, id: newId(), storeName: 'Petal & Co.', category: 'fashion', amount: 60, expiryDate: inDays(11), scanQuality: 78, reminders: defaultReminders([7, 3, 1]) },
    { ...base, id: newId(), storeName: 'Oak & Ember Home', category: 'home', amount: 185, expiryDate: inDays(34), scanQuality: 91, reminders: defaultReminders([7]) },
    { ...base, id: newId(), storeName: 'Atlas Outdoor', category: 'other', amount: 312.5, expiryDate: null, scanQuality: 62, reminders: [] },
  ];
}

export const useClipprStore = create<ClipprState>()(
  persist(
    (set) => ({
      vouchers: [],
      settings: DEFAULT_SETTINGS,
      seeded: false,

      addVoucher: (input) => {
        const now = new Date().toISOString();
        const voucher: Voucher = { ...input, id: newId(), status: 'active', createdAt: now, updatedAt: now };
        set((state) => ({ vouchers: [...state.vouchers, voucher] }));
        return voucher;
      },
      updateVoucher: (id, patch) =>
        set((state) => ({
          vouchers: state.vouchers.map((v) =>
            v.id === id ? { ...v, ...patch, updatedAt: new Date().toISOString() } : v,
          ),
        })),
      deleteVoucher: (id) => set((state) => ({ vouchers: state.vouchers.filter((v) => v.id !== id) })),
      markUsed: (id) =>
        set((state) => ({
          vouchers: state.vouchers.map((v) =>
            v.id === id ? { ...v, status: 'used', updatedAt: new Date().toISOString() } : v,
          ),
        })),
      setNotificationIds: (voucherId, ids) =>
        set((state) => {
          const voucher = state.vouchers.find((v) => v.id === voucherId);
          // The launch/foreground sync calls this for every voucher; skip the write when nothing changed.
          if (!voucher || voucher.reminders.every((r) => r.notificationId === ids[r.id])) return state;
          const reminders = voucher.reminders.map((r) => ({ ...r, notificationId: ids[r.id] }));
          return { vouchers: state.vouchers.map((v) => (v.id === voucherId ? { ...v, reminders } : v)) };
        }),
      deleteAllVouchers: () => set({ vouchers: [] }),
      updateSettings: (patch) => set((state) => ({ settings: { ...state.settings, ...patch } })),
    }),
    {
      name: 'clippr-store',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ vouchers, settings, seeded }) => ({ vouchers, settings, seeded }),
      onRehydrateStorage: () => (state, error) => {
        // persist writes after every setState, so never touch state when the read failed:
        // that would overwrite the user's saved vouchers with defaults.
        if (error || !state) {
          console.warn('Clippr: could not read saved data', error);
          return;
        }
        if (!state.seeded) {
          useClipprStore.setState({ vouchers: sampleVouchers(state.settings), seeded: true });
        }
      },
    },
  ),
);

/** True once AsyncStorage has been read. Uses persist's own flag, so it never triggers a write. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useClipprStore.persist.onFinishHydration(onChange),
    () => useClipprStore.persist.hasHydrated(),
  );
}

/**
 * Active (not used) vouchers. A plain helper, not a selector: it builds a new array,
 * so call it inside useMemo on `vouchers` rather than passing it to useClipprStore.
 */
export function activeVouchers(vouchers: Voucher[]): Voucher[] {
  return vouchers.filter((v) => v.status === 'active');
}

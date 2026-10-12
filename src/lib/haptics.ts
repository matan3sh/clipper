import * as Haptics from 'expo-haptics';

/**
 * Tasteful haptic feedback. Every call is fire-and-forget and swallows errors: haptics are a
 * nicety, never worth a crash, and they're silent no-ops on devices (and the Simulator) without
 * a Taptic Engine.
 */
function run(effect: () => Promise<void>): void {
  effect().catch(() => undefined);
}

export const haptics = {
  /** Light tick when the selection changes: a filter pill, a tab, a toggle. */
  select: () => run(() => Haptics.selectionAsync()),
  /** Light bump to acknowledge a press, e.g. opening quick actions. */
  tap: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** Something finished: saved, marked as used. */
  success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  /** A destructive step is about to be confirmed. */
  warning: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
};

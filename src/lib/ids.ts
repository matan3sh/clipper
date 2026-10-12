/** Short unique id for vouchers, reminders and photo files: base-36 time plus random suffix. */
export function newId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

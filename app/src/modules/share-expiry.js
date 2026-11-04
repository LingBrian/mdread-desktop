/* Positive sub-day lifetimes should never be rendered as an already-expired 0d. */
const DAY_MS = 24 * 60 * 60 * 1000;

export function shareDaysRemaining(expiresAt, now = Date.now()) {
  if (expiresAt == null || expiresAt === "") return null;
  const expiry = Number(expiresAt);
  if (!Number.isFinite(expiry)) return null;
  return Math.max(0, Math.ceil((expiry - now) / DAY_MS));
}

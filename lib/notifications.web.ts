/**
 * notifications.web.ts
 * Web stub — expo-notifications no funciona en browsers.
 * Todas las funciones son no-ops que retornan valores seguros.
 */
import type { Promo } from '../components/OfferBottomSheet';

let NOTIFICATION_COOLDOWN_MS = 3 * 60 * 1000;

export function setNotificationCooldown(ms: number): void {
  NOTIFICATION_COOLDOWN_MS = ms;
}

export function getNotificationCooldown(): number {
  return NOTIFICATION_COOLDOWN_MS;
}

export async function requestNotificationPermissions(): Promise<boolean> {
  return false;
}

export async function registerPushToken(_userId: string): Promise<void> {
  // No-op en web
}

export async function getLastNotificationTime(_promoId: string): Promise<number | null> {
  try {
    const stored = localStorage.getItem(`saley_notif_last_${_promoId}`);
    return stored ? parseInt(stored, 10) : null;
  } catch {
    return null;
  }
}

export async function setLastNotificationTime(promoId: string): Promise<void> {
  try {
    localStorage.setItem(`saley_notif_last_${promoId}`, Date.now().toString());
  } catch {
    // ignore
  }
}

export async function canNotifyForPromo(promoId: string): Promise<boolean> {
  const lastTime = await getLastNotificationTime(promoId);
  if (lastTime === null) return true;
  return Date.now() - lastTime >= NOTIFICATION_COOLDOWN_MS;
}

export async function sendProximityNotification(
  _promo: Promo,
  _distanceMeters: number
): Promise<void> {
  // No-op en web (sin push notifications nativas)
}

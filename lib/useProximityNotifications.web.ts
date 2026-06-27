/**
 * useProximityNotifications.web.ts
 * Web stub — expo-location watchPositionAsync no existe en browsers.
 * Usa la Geolocation API del browser para watchPosition.
 * Las notificaciones push no se disparan en web.
 */
import { useEffect, useRef, useCallback } from 'react';
import { getDistanceInMeters } from './distance';
import { canNotifyForPromo } from './notifications';
import type { Promo } from '../components/OfferBottomSheet';

const PROXIMITY_RADIUS_METERS = 200;

export function useProximityNotifications(
  promos: Promo[],
  enabled: boolean = true
): void {
  const watchIdRef = useRef<number | null>(null);
  const promosRef = useRef<Promo[]>(promos);

  useEffect(() => {
    promosRef.current = promos;
  }, [promos]);

  const handlePositionUpdate = useCallback(
    async (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      const currentPromos = promosRef.current;

      for (const promo of currentPromos) {
        if (typeof promo.lat !== 'number' || typeof promo.lng !== 'number') continue;
        const distance = getDistanceInMeters(latitude, longitude, promo.lat, promo.lng);
        if (distance <= PROXIMITY_RADIUS_METERS) {
          const canNotify = await canNotifyForPromo(promo.id);
          if (canNotify) {
            // En web podríamos usar la Notifications API del browser,
            // pero por ahora simplemente no spameamos sin push nativo.
            break;
          }
        }
      }
    },
    []
  );

  useEffect(() => {
    if (!enabled || typeof navigator === 'undefined' || !navigator.geolocation) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePositionUpdate,
      (err) => console.warn('[ProximityNotifications web] Error:', err),
      { enableHighAccuracy: false, timeout: 30000, maximumAge: 60000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [enabled, handlePositionUpdate]);
}

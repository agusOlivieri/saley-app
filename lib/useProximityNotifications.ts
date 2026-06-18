import { useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import { getDistanceInMeters } from './distance';
import {
  canNotifyForPromo,
  sendProximityNotification,
  requestNotificationPermissions,
} from './notifications';
import type { Promo } from '../components/OfferBottomSheet';

/** Radio en metros para detectar ofertas cercanas */
const PROXIMITY_RADIUS_METERS = 200;

/**
 * Hook que monitorea la ubicación del usuario y dispara notificaciones
 * locales cuando se acerca a menos de 200m de una oferta activa.
 *
 * Solo activo mientras la app está en foreground.
 *
 * @param promos - Lista de ofertas activas con lat/lng
 * @param enabled - Si el monitoreo está habilitado (ej: usuario autenticado)
 */
export function useProximityNotifications(
  promos: Promo[],
  enabled: boolean = true
): void {
  const watcherRef = useRef<Location.LocationSubscription | null>(null);
  // Usamos una ref para evitar closures stale sobre `promos`
  const promosRef = useRef<Promo[]>(promos);

  useEffect(() => {
    promosRef.current = promos;
  }, [promos]);

  const handleLocationUpdate = useCallback(
    async (newLocation: Location.LocationObject) => {
      const { latitude, longitude } = newLocation.coords;
      const currentPromos = promosRef.current;

      for (const promo of currentPromos) {
        // Validar que la promo tiene coordenadas válidas
        if (typeof promo.lat !== 'number' || typeof promo.lng !== 'number') {
          continue;
        }

        const distance = getDistanceInMeters(
          latitude,
          longitude,
          promo.lat,
          promo.lng
        );

        if (distance <= PROXIMITY_RADIUS_METERS) {
          // Verificar cooldown antes de notificar
          const canNotify = await canNotifyForPromo(promo.id);
          if (canNotify) {
            await sendProximityNotification(promo, distance);
            // Solo notificamos 1 promo por ciclo de ubicación para no spamear
            break;
          }
        }
      }
    },
    [] // Solo se crea una vez; usa promosRef para datos frescos
  );

  useEffect(() => {
    if (!enabled) return;

    let active = true;

    const startWatcher = async () => {
      const hasPermission = await requestNotificationPermissions();
      if (!hasPermission || !active) return;

      try {
        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 50, // Solo procesa cuando el usuario mueve 50m
            timeInterval: 30000,  // O cada 30 segundos como máximo
          },
          handleLocationUpdate
        );

        if (active) {
          watcherRef.current = subscription;
        } else {
          subscription.remove();
        }
      } catch (err) {
        console.error('[ProximityNotifications] Error iniciando watcher:', err);
      }
    };

    startWatcher();

    return () => {
      active = false;
      watcherRef.current?.remove();
      watcherRef.current = null;
    };
  }, [enabled, handleLocationUpdate]);
}

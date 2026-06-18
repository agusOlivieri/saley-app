import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import type { Promo } from '../components/OfferBottomSheet';

// ─── Configuración del canal de notificaciones ────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Configuración de cooldown ────────────────────────────────────────────────

/** Tiempo mínimo en ms entre notificaciones de la misma oferta. Default: 5 minutos */
let NOTIFICATION_COOLDOWN_MS = 3 * 60 * 1000; // 3 minuto

/** Permite cambiar el cooldown en runtime (útil para testing o configuración de usuario) */
export function setNotificationCooldown(ms: number): void {
  NOTIFICATION_COOLDOWN_MS = ms;
}

/** Retorna el cooldown actual en milisegundos */
export function getNotificationCooldown(): number {
  return NOTIFICATION_COOLDOWN_MS;
}

// ─── Permisos ────────────────────────────────────────────────────────────────

/**
 * Solicita permiso de notificaciones al sistema operativo.
 * @returns true si el permiso fue concedido, false si fue denegado.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Ofertas Cercanas',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6B00',
      description: 'Notificaciones de ofertas cercanas a tu ubicación',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

// ─── Registro del Push Token ──────────────────────────────────────────────────

/**
 * Obtiene el Expo Push Token del dispositivo y lo guarda en Supabase.
 * Solo funciona en dispositivos físicos con build nativo.
 * @param userId - ID del usuario autenticado en Supabase Auth
 */
export async function registerPushToken(userId: string): Promise<void> {
  try {
    // Los push tokens remotos solo funcionan en dispositivos físicos
    // En Expo Go se puede obtener pero no enviar desde servidor
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    if (!token) return;

    // Guardar en Supabase (tabla consumidores)
    const { error } = await supabase
      .from('consumidores')
      .update({ push_token: token })
      .eq('id', userId);

    if (error) {
      console.error('[Notifications] Error guardando push token:', error);
    } else {
      console.log('[Notifications] Push token registrado correctamente');
    }
  } catch (err) {
    // En simulador o sin proyecto EAS configurado, esto falla normalmente
    console.warn('[Notifications] No se pudo obtener push token (normal en simulador):', err);
  }
}

// ─── Cooldown con AsyncStorage ────────────────────────────────────────────────

const STORAGE_PREFIX = 'saley_notif_last_';

/**
 * Retorna el timestamp de la última notificación enviada para una oferta.
 * @param promoId - ID de la promo
 */
export async function getLastNotificationTime(promoId: string): Promise<number | null> {
  try {
    const stored = await AsyncStorage.getItem(`${STORAGE_PREFIX}${promoId}`);
    return stored ? parseInt(stored, 10) : null;
  } catch {
    return null;
  }
}

/**
 * Guarda el timestamp actual como última notificación para una oferta.
 * @param promoId - ID de la promo
 */
export async function setLastNotificationTime(promoId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(`${STORAGE_PREFIX}${promoId}`, Date.now().toString());
  } catch (err) {
    console.error('[Notifications] Error guardando cooldown:', err);
  }
}

/**
 * Verifica si una oferta puede ser notificada (cooldown expirado).
 * @param promoId - ID de la promo
 */
export async function canNotifyForPromo(promoId: string): Promise<boolean> {
  const lastTime = await getLastNotificationTime(promoId);
  if (lastTime === null) return true;
  return Date.now() - lastTime >= NOTIFICATION_COOLDOWN_MS;
}

// ─── Envío de notificación ────────────────────────────────────────────────────

/**
 * Envía una notificación local al usuario avisando de una oferta cercana.
 * Incluye la distancia redondeada al comercio.
 *
 * @param promo - La oferta encontrada en el radio de detección
 * @param distanceMeters - Distancia en metros al comercio
 */
export async function sendProximityNotification(
  promo: Promo,
  distanceMeters: number
): Promise<void> {
  const roundedDistance = Math.round(distanceMeters);
  const distanceText = roundedDistance < 1000
    ? `${roundedDistance}m`
    : `${(roundedDistance / 1000).toFixed(1)}km`;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `🏷️ Oferta a ${distanceText} — ${promo.nombre_comercial}`,
      body: `${promo.titulo} · A solo ${distanceText} de vos`,
      data: {
        promoId: promo.id,
        comercioId: promo.comercio_id,
        screen: '/(tabs)',
      },
      sound: true,
    },
    trigger: null, // Envío inmediato
  });

  // Registrar cooldown
  await setLastNotificationTime(promo.id);
}

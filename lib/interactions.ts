import { supabase } from './supabase';

type RegistrarInteraccionParams = {
  ofertaId: string;
  tipo: 'vista' | 'interaccion';
  consumidorId: string;
  ubicacion?: { lat: number; lng: number };
};

export async function registrarInteraccion(params: RegistrarInteraccionParams): Promise<void> {
  const { ofertaId, tipo, consumidorId, ubicacion } = params;

  const payload: Record<string, any> = {
    oferta_id: ofertaId,
    consumidor_id: consumidorId,
    tipo_accion: tipo,
  };

  // Convertir a WKT Point que acepta PostGIS
  if (ubicacion) {
    payload.ubicacion = `POINT(${ubicacion.lng} ${ubicacion.lat})`;
  }

  const { error } = await supabase
    .from('interacciones')
    .insert(payload);

  if (error) {
    // Fire-and-forget: solo logueamos, no interrumpimos la UX
    console.warn('[Interacciones] Error al registrar:', error.message);
  }
}

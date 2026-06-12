// ============================================================
// CONQUEST — Game Service
// Guardar, cargar y listar partidas en tabla public.partidas
// ============================================================
import { supabase } from './supabaseClient';

export interface SavedGame {
  id: string;
  user_id: string;
  nombre_partida: string;
  hq_id: string;
  hq_nombre: string;
  fecha_virtual: string;   // ISO string de la fecha del juego
  presupuesto: number;
  tropas: {
    infanteria: number;
    caballeria: number;
    artilleria: number;
  };
  paises: Record<string, any>;
  habilidades: any[];
  dias_campana: number;
  dominion_pct: number;
  created_at: string;
  updated_at: string;
}

export type GameDataToSave = Omit<SavedGame, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

// ─── GUARDAR / ACTUALIZAR PARTIDA ─────────────────────────────

/**
 * Guarda o actualiza una partida.
 * Si se pasa un `saveId` existente, actualiza esa fila (upsert).
 * Si no, crea una nueva partida.
 * Devuelve el ID de la partida guardada.
 */
export const saveGame = async (
  userId: string,
  data: GameDataToSave,
  saveId?: string
): Promise<{ success: true; id: string } | { success: false; error: string }> => {

  const payload = {
    user_id:        userId,
    nombre_partida: data.nombre_partida,
    hq_id:          data.hq_id,
    hq_nombre:      data.hq_nombre,
    fecha_virtual:  data.fecha_virtual,
    presupuesto:    data.presupuesto,
    tropas:         data.tropas,
    paises:         data.paises,
    habilidades:    data.habilidades,
    dias_campana:   data.dias_campana,
    dominion_pct:   data.dominion_pct,
    updated_at:     new Date().toISOString(),
  };

  if (saveId) {
    // Actualizar partida existente
    const { error } = await supabase
      .from('partidas')
      .update(payload)
      .eq('id', saveId)
      .eq('user_id', userId);  // RLS extra — solo el dueño puede actualizar

    if (error) {
      console.error('[gameService] saveGame update error:', error);
      return { success: false, error: error.message };
    }
    return { success: true, id: saveId };
  } else {
    // Nueva partida
    const { data: inserted, error } = await supabase
      .from('partidas')
      .insert(payload)
      .select('id')
      .single();

    if (error) {
      console.error('[gameService] saveGame insert error:', error);
      return { success: false, error: error.message };
    }
    return { success: true, id: inserted.id };
  }
};

// ─── LISTAR PARTIDAS DEL USUARIO ─────────────────────────────

/**
 * Devuelve la lista de partidas del usuario (sin el JSON pesado de paises/habilidades).
 */
export const loadGames = async (
  userId: string
): Promise<SavedGame[]> => {
  const { data, error } = await supabase
    .from('partidas')
    .select('id, user_id, nombre_partida, hq_id, hq_nombre, fecha_virtual, presupuesto, tropas, dias_campana, dominion_pct, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('[gameService] loadGames error:', error);
    return [];
  }
  return (data ?? []) as SavedGame[];
};

// ─── CARGAR UNA PARTIDA COMPLETA ─────────────────────────────

/**
 * Carga una partida completa con todos los datos (paises + habilidades).
 */
export const loadGame = async (
  saveId: string
): Promise<SavedGame | null> => {
  const { data, error } = await supabase
    .from('partidas')
    .select('*')
    .eq('id', saveId)
    .single();

  if (error) {
    console.error('[gameService] loadGame error:', error);
    return null;
  }
  return data as SavedGame;
};

// ─── ELIMINAR PARTIDA ─────────────────────────────────────────

/**
 * Elimina una partida del usuario.
 */
export const deleteGame = async (
  saveId: string,
  userId: string
): Promise<boolean> => {
  const { error } = await supabase
    .from('partidas')
    .delete()
    .eq('id', saveId)
    .eq('user_id', userId);

  if (error) {
    console.error('[gameService] deleteGame error:', error);
    return false;
  }
  return true;
};

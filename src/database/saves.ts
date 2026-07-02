// ============================================================
// CONQUEST — GESTIÓN DE PARTIDAS (Supabase)
// Tablas: partidas, jugadores, tiempos, partida_habilidades
// ============================================================

import { supabase } from './supabaseClient';

// ─── INTERFAZ PÚBLICA ─────────────────────────────────────────
// Campos que usan SaveFilesMenu.tsx y App.tsx
export interface DBGameSave {
  id:              number;   // jugadores.jugador_id
  partida_id:      number;   // partidas.partida_id
  commanderID:     string;   // partidas.commander_id
  hq:              string;   // jugadores.hq_pais_id
  campaignDays:    number;   // partidas.dias_campana
  dominionPercent: number;   // partidas.porcentaje_dominio
  budget:          number;   // jugadores.oro
  troops:          number;   // sum tropas
  tropas_infanteria: number;
  tropas_caballeria: number;
  tropas_artilleria: number;
  habilidad_puntos:  number;
  velocidad:         number; // tiempos.velocidad
  pausado:           boolean;// tiempos.pausado
  creationDate:    string;   // partidas.fecha_creacion
  lastSaveDate:    string;   // partidas.ultima_vez_guardado
}

// ─── OBTENER PARTIDAS GUARDADAS ───────────────────────────────

export const fetchSavedGames = async (usuarioDbId: number): Promise<DBGameSave[]> => {
  try {
    const { data, error } = await supabase
      .from('jugadores')
      .select(`
        jugador_id,
        hq_pais_id,
        oro,
        habilidad_puntos,
        tropas_infanteria,
        tropas_caballeria,
        tropas_artilleria,
        partidas (
          partida_id,
          commander_id,
          dias_campana,
          porcentaje_dominio,
          fecha_creacion,
          ultima_vez_guardado,
          tiempos (
            velocidad,
            pausado
          )
        )
      `)
      .eq('usuario_id', usuarioDbId);

    if (error) {
      console.error('[fetchSavedGames] Error:', error);
      return [];
    }

    return (data ?? []).map((row: any) => {
      const p = row.partidas ?? {};
      // tiempos es array (1-to-many desde partidas), tomamos el primero
      const t = Array.isArray(p.tiempos) ? p.tiempos[0] : p.tiempos ?? {};
      return {
        id:               row.jugador_id,
        partida_id:       p.partida_id,
        commanderID:      p.commander_id ?? '',
        hq:               row.hq_pais_id,
        campaignDays:     p.dias_campana ?? 0,
        dominionPercent:  Number(p.porcentaje_dominio ?? 0),
        budget:           row.oro,
        troops:           row.tropas_infanteria + row.tropas_caballeria + row.tropas_artilleria,
        tropas_infanteria: row.tropas_infanteria,
        tropas_caballeria: row.tropas_caballeria,
        tropas_artilleria: row.tropas_artilleria,
        habilidad_puntos:  row.habilidad_puntos,
        velocidad:         t.velocidad ?? 1,
        pausado:           t.pausado ?? false,
        creationDate:     p.fecha_creacion ?? '',
        lastSaveDate:     p.ultima_vez_guardado ?? '',
      } as DBGameSave;
    });
  } catch (e) {
    console.error('[fetchSavedGames] Exception:', e);
    return [];
  }
};


// ─── INICIALIZAR NUEVA PARTIDA ────────────────────────────────

export const initializeNewGame = async (data: {
  usuario_id:        number;
  commander_id:      string;
  hq_pais_id:        string;
  oro?:              number;
  tropas_infanteria?: number;
  tropas_caballeria?: number;
  tropas_artilleria?: number;
  velocidad?:        number;
  pausado?:          boolean;
}): Promise<DBGameSave | null> => {
  try {
    // Usa la función RPC transaccional de Supabase (3 INSERTs atómicos en una sola llamada)
    const { data: result, error } = await supabase.rpc('inicializar_nueva_partida', {
      p_usuario_id:        data.usuario_id,
      p_commander_id:      data.commander_id,
      p_hq_pais_id:        data.hq_pais_id,
      p_oro:               data.oro               ?? 5000,
      p_tropas_infanteria: data.tropas_infanteria  ?? 5000,
      p_tropas_caballeria: data.tropas_caballeria  ?? 2000,
      p_tropas_artilleria: data.tropas_artilleria  ?? 500,
      p_velocidad:         data.velocidad          ?? 1,
    });

    if (error || !result) {
      console.error('[initializeNewGame] RPC error:', error);
      return null;
    }

    // Parsear la respuesta JSONB devuelta por inicializar_nueva_partida
    const inf  = result.tropas_infanteria ?? 0;
    const cab  = result.tropas_caballeria ?? 0;
    const art  = result.tropas_artilleria ?? 0;

    return {
      id:               result.jugador_id,
      partida_id:       result.partida_id,
      commanderID:      result.commander_id,
      hq:               result.hq_pais_id,
      campaignDays:     1,
      dominionPercent:  0,
      budget:           result.oro,
      troops:           inf + cab + art,
      tropas_infanteria: inf,
      tropas_caballeria: cab,
      tropas_artilleria: art,
      habilidad_puntos:  0,
      velocidad:         result.velocidad,
      pausado:           false,
      creationDate:     result.fecha_creacion,
      lastSaveDate:     result.fecha_creacion,
    };
  } catch (e) {
    console.error('[initializeNewGame] Exception:', e);
    return null;
  }
};

// ─── GUARDAR ESTADO DE PARTIDA ────────────────────────────────

export const saveGame = async (
  partidaId: number,
  jugadorId: number,
  data: {
    dias_campana:       number;
    porcentaje_dominio: number;
    oro:                number;
    tropas_infanteria:  number;
    tropas_caballeria:  number;
    tropas_artilleria:  number;
    habilidad_puntos:   number;
    velocidad:          number;
    pausado:            boolean;
  }
): Promise<boolean> => {
  try {
    // Usa la función RPC transaccional de Supabase (3 UPDATEs atómicos en una sola llamada)
    const { data: result, error } = await supabase.rpc('guardar_estado_partida', {
      p_partida_id:         partidaId,
      p_jugador_id:         jugadorId,
      p_oro:                data.oro,
      p_tropas_infanteria:  data.tropas_infanteria,
      p_tropas_caballeria:  data.tropas_caballeria,
      p_tropas_artilleria:  data.tropas_artilleria,
      p_habilidad_puntos:   data.habilidad_puntos,
      p_dias_campana:       data.dias_campana,
      p_porcentaje_dominio: data.porcentaje_dominio,
      p_velocidad:          data.velocidad,
      p_pausado:            data.pausado,
    });

    if (error) {
      console.error('[saveGame] RPC error:', error);
      return false;
    }

    // La respuesta JSONB contiene { success: true, partida_id, jugador_id, guardado_en }
    return result?.success === true;
  } catch (e) {
    console.error('[saveGame] Exception:', e);
    return false;
  }
};

// ─── ELIMINAR PARTIDA ─────────────────────────────────────────
// ON DELETE CASCADE: borra jugadores, tiempos y partida_habilidades

export const deleteGame = async (jugadorId: number): Promise<boolean> => {
  try {
    // Primero obtenemos el partida_id
    const { data: jug } = await supabase
      .from('jugadores')
      .select('partida_id')
      .eq('jugador_id', jugadorId)
      .single();

    if (!jug) return false;

    const { error } = await supabase
      .from('partidas')
      .delete()
      .eq('partida_id', jug.partida_id);

    return !error;
  } catch {
    return false;
  }
};



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
    // 1. Crear la partida
    const { data: partida, error: pErr } = await supabase
      .from('partidas')
      .insert({
        commander_id:      data.commander_id,
        estado_activo:     true,
        dias_campana:      1,
        porcentaje_dominio: 0,
      })
      .select()
      .single();

    if (pErr || !partida) throw pErr;

    // 2. Crear el jugador vinculado a la partida
    const { data: jugador, error: jErr } = await supabase
      .from('jugadores')
      .insert({
        usuario_id:       data.usuario_id,
        partida_id:       partida.partida_id,
        hq_pais_id:       data.hq_pais_id,
        oro:              data.oro              ?? 5000,
        habilidad_puntos: 0,
        tropas_infanteria: data.tropas_infanteria ?? 5000,
        tropas_caballeria: data.tropas_caballeria ?? 2000,
        tropas_artilleria: data.tropas_artilleria ?? 500,
      })
      .select()
      .single();

    if (jErr || !jugador) throw jErr;

    // 3. Crear registro de tiempo
    const { data: tiempo, error: tErr } = await supabase
      .from('tiempos')
      .insert({
        partida_id:  partida.partida_id,
        dias_campana: 1,
        velocidad:   data.velocidad ?? 1,
        pausado:     data.pausado   ?? false,
      })
      .select()
      .single();

    if (tErr || !tiempo) throw tErr;

    return {
      id:               jugador.jugador_id,
      partida_id:       partida.partida_id,
      commanderID:      partida.commander_id,
      hq:               jugador.hq_pais_id,
      campaignDays:     partida.dias_campana,
      dominionPercent:  Number(partida.porcentaje_dominio),
      budget:           jugador.oro,
      troops:           jugador.tropas_infanteria + jugador.tropas_caballeria + jugador.tropas_artilleria,
      tropas_infanteria: jugador.tropas_infanteria,
      tropas_caballeria: jugador.tropas_caballeria,
      tropas_artilleria: jugador.tropas_artilleria,
      habilidad_puntos:  jugador.habilidad_puntos,
      velocidad:         tiempo.velocidad,
      pausado:           tiempo.pausado,
      creationDate:     partida.fecha_creacion,
      lastSaveDate:     partida.ultima_vez_guardado,
    };
  } catch {
    return null;
  }
};

// ─── GUARDAR ESTADO DE PARTIDA ────────────────────────────────

export const saveGame = async (
  partidaId: number,
  data: {
    dias_campana:      number;
    porcentaje_dominio: number;
    oro:               number;
    tropas_infanteria: number;
    tropas_caballeria: number;
    tropas_artilleria: number;
    habilidad_puntos:  number;
    velocidad:         number;
    pausado:           boolean;
  }
): Promise<boolean> => {
  try {
    const now = new Date().toISOString();

    const [r1, r2, r3] = await Promise.all([
      supabase.from('partidas').update({
        dias_campana:       data.dias_campana,
        porcentaje_dominio: data.porcentaje_dominio,
        ultima_vez_guardado: now,
      }).eq('partida_id', partidaId),

      supabase.from('jugadores').update({
        oro:               data.oro,
        tropas_infanteria: data.tropas_infanteria,
        tropas_caballeria: data.tropas_caballeria,
        tropas_artilleria: data.tropas_artilleria,
        habilidad_puntos:  data.habilidad_puntos,
      }).eq('partida_id', partidaId),

      supabase.from('tiempos').update({
        velocidad: data.velocidad,
        pausado:   data.pausado,
        dias_campana: data.dias_campana,
      }).eq('partida_id', partidaId),
    ]);

    return !r1.error && !r2.error && !r3.error;
  } catch {
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

// ─── DESBLOQUEAR HABILIDAD ────────────────────────────────────

export const unlockHabilidad = async (
  partidaId:   number,
  habilidadId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // 1. Verificar que no esté ya desbloqueada
    const { data: ya } = await supabase
      .from('partida_habilidades')
      .select('habilidad_id')
      .eq('partida_id', partidaId)
      .eq('habilidad_id', habilidadId)
      .maybeSingle();

    if (ya) return { success: false, error: 'Ya desbloqueada' };

    // 2. Obtener prerrequisitos
    const { data: prereqs } = await supabase
      .from('habilidad_prerrequisitos')
      .select('habilidad_requerida_id')
      .eq('habilidad_id', habilidadId);

    if (prereqs && prereqs.length > 0) {
      // Verificar que todos los prerrequisitos estén desbloqueados
      const { data: unlocked } = await supabase
        .from('partida_habilidades')
        .select('habilidad_id')
        .eq('partida_id', partidaId)
        .in('habilidad_id', prereqs.map((p: any) => p.habilidad_requerida_id));

      const unlockedIds = new Set((unlocked ?? []).map((u: any) => u.habilidad_id));
      const missing = prereqs.filter((p: any) => !unlockedIds.has(p.habilidad_requerida_id));

      if (missing.length > 0) {
        return { success: false, error: 'Prerrequisitos no cumplidos' };
      }
    }

    // 3. Insertar el desbloqueo
    const { error } = await supabase
      .from('partida_habilidades')
      .insert({ partida_id: partidaId, habilidad_id: habilidadId });

    if (error) return { success: false, error: error.message };

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'Error desconocido' };
  }
};

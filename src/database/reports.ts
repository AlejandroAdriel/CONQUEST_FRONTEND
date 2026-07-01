// ============================================================
// CONQUEST — OBTENCIÓN DE REPORTES Y CLASIFICACIONES (Supabase)
// Vistas: reporte_usuarios_mas_partidas, reporte_ejercitos_por_partida,
//        reporte_habilidades_por_rama, reporte_paises_hq_populares
// ============================================================

import { supabase } from './supabaseClient';

export interface UserRanking {
  username: string;
  correo: string;
  total_partidas_jugadas: number;
}

export interface HQRanking {
  pais_base: string;
  veces_elegido: number;
}

export interface ArmyReport {
  partida_id: number;
  total_jugadores: number;
  gran_total_tropas: number;
}

export interface TechBranchReport {
  rama: string;
  cantidad_habilidades: number;
  costo_total_para_completar: number;
  costo_promedio: number;
}

export interface GlobalCommanderRanking {
  comandante: string;
  partida_id: number;
  pais_seleccionado: string;
  total_oro: number;
  total_tropas: number;
}

export interface CombatPowerRanking {
  comandante: string;
  partida_id: number;
  pais_seleccionado: string;
  total_oro: number;
  fuerza_total_combate: number;
}



/**
 * Endpoint 1: Obtiene la lista de usuarios y la cantidad de partidas jugadas (Ranking)
 */
export const fetchUserRankings = async (): Promise<UserRanking[]> => {
  try {
    const { data, error } = await supabase
      .from('reporte_usuarios_mas_partidas')
      .select('*');

    if (error) {
      console.error('[fetchUserRankings] Error:', error);
      return [];
    }
    return data || [];
  } catch (e) {
    console.error('[fetchUserRankings] Exception:', e);
    return [];
  }
};

/**
 * Endpoint 4: Obtiene los países base HQ más populares y el oro acumulado (Ranking)
 */
export const fetchHQRankings = async (): Promise<HQRanking[]> => {
  try {
    const { data, error } = await supabase
      .from('reporte_paises_hq_populares')
      .select('*');

    if (error) {
      console.error('[fetchHQRankings] Error:', error);
      return [];
    }
    return data || [];
  } catch (e) {
    console.error('[fetchHQRankings] Exception:', e);
    return [];
  }
};

/**
 * Endpoint 2: Obtiene el tamaño de ejércitos y jugadores por partida para enriquecer guardados
 */
export const fetchArmyReports = async (): Promise<ArmyReport[]> => {
  try {
    const { data, error } = await supabase
      .from('reporte_ejercitos_por_partida')
      .select('*');

    if (error) {
      console.error('[fetchArmyReports] Error:', error);
      return [];
    }
    return data || [];
  } catch (e) {
    console.error('[fetchArmyReports] Exception:', e);
    return [];
  }
};

/**
 * Endpoint 3: Obtiene el resumen de habilidades agrupadas por rama
 */
export const fetchTechBranchReports = async (): Promise<TechBranchReport[]> => {
  try {
    const { data, error } = await supabase
      .from('reporte_habilidades_por_rama')
      .select('*');

    if (error) {
      console.error('[fetchTechBranchReports] Error:', error);
      return [];
    }
    return data || [];
  } catch (e) {
    console.error('[fetchTechBranchReports] Exception:', e);
    return [];
  }
};

/**
 * Obtiene el ranking global de comandantes ordenado por oro/tropas
 */
export const fetchGlobalCommanderRankings = async (): Promise<GlobalCommanderRanking[]> => {
  try {
    const { data, error } = await supabase
      .from('ranking_comandantes_global')
      .select('*');

    if (error) {
      console.error('[fetchGlobalCommanderRankings] Error:', error);
      return [];
    }
    return data || [];
  } catch (e) {
    console.error('[fetchGlobalCommanderRankings] Exception:', e);
    return [];
  }
};

/**
 * Obtiene el ranking global de fuerza de combate/poder militar
 */
export const fetchCombatPowerRankings = async (): Promise<CombatPowerRanking[]> => {
  try {
    const { data, error } = await supabase
      .from('reporte_ranking_fuerza_combate')
      .select('*');

    if (error) {
      console.error('[fetchCombatPowerRankings] Error:', error);
      return [];
    }
    return data || [];
  } catch (e) {
    console.error('[fetchCombatPowerRankings] Exception:', e);
    return [];
  }
};



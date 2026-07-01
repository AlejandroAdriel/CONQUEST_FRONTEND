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
  oro_total_acumulado: number;
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

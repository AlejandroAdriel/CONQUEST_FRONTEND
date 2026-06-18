// ============================================================
// CONQUEST — COUNTRIES DATABASE SERVICE
// ============================================================

import { supabase } from './supabaseClient';
import type { PaisBase, PaisPreset } from '../types/paises';
import type { Tropas } from './troops';

// Cache interno para el índice de países (se construye al cargar datos)
let _paisesIndex: Record<string, PaisBase> = {};
let _paisesNombreESIndex: Record<string, string> = {};

/**
 * Construye los índices internos a partir del array de PaisBase cargado de la BD.
 * Se llama una sola vez al recibir los datos del backend.
 */
export const buildPaisesIndex = (paises: PaisBase[]): void => {
  _paisesIndex = {};
  _paisesNombreESIndex = {};
  for (const p of paises) {
    _paisesIndex[p.pais_id.toLowerCase()] = p;
    _paisesNombreESIndex[p.pais_id] = p.nombre_es;
  }
};

/**
 * Traduce el nombre de un país del inglés (GeoJSON) al español.
 * Si no hay traducción, devuelve el nombre original.
 */
export const translateCountry = (nameEN: string): string => {
  return _paisesNombreESIndex[nameEN] ?? nameEN;
};

/**
 * Devuelve el preset geopolítico completo de un país desde los datos de BD.
 */
export const getPresetForCountry = (name: string): PaisPreset => {
  const norm = name.toLowerCase();
  
  // Buscar en el índice (match exacto, luego parcial)
  let pais = _paisesIndex[norm];
  if (!pais) {
    for (const [key, p] of Object.entries(_paisesIndex)) {
      if (norm.includes(key) || key.includes(norm)) {
        pais = p;
        break;
      }
    }
  }

  if (pais) {
    return {
      gdpPerCapita: pais.gdp_per_capita_base,
      ejercitoMultiplicador: pais.ejercito_multiplicador,
      composicion: {
        infanteria: pais.pct_composicion_infanteria,
        caballeria: pais.pct_composicion_caballeria,
        artilleria: pais.pct_composicion_artilleria,
      },
      multiplicadorReclutamiento: pais.multiplicador_reclutamiento !== 1.0 ? pais.multiplicador_reclutamiento : undefined,
      multiplicadorPesadas: pais.multiplicador_pesadas !== 1.0 ? pais.multiplicador_pesadas : undefined,
      tasa_natalidad: pais.tasa_natalidad_diaria,
      tasa_mortalidad: pais.tasa_mortalidad_diaria,
    };
  }

  // Fallback para países no registrados en BD
  return {
    gdpPerCapita: 5000,
    ejercitoMultiplicador: 1.0,
    composicion: { infanteria: 0.70, caballeria: 0.20, artilleria: 0.10 },
    tasa_natalidad: 0.0033,
    tasa_mortalidad: 0.0022,
  };
};

/**
 * Obtiene las estadísticas de países desde Supabase.
 */
export const fetchCountryStats = async (): Promise<PaisBase[]> => {
  try {
    const { data, error } = await supabase
      .from('paises_base')
      .select('*');
    if (error) throw error;
    const paises = (data ?? []) as PaisBase[];
    buildPaisesIndex(paises);
    return paises;
  } catch (error) {
    console.error('[fetchCountryStats] Error fetching country stats:', error);
    // Tabla aún no disponible — el juego usa fallbacks locales
    return [];
  }
};

/**
 * Normaliza nombres de países para búsquedas geopolíticas.
 */
export const normalizeName = (name: string): string => {
  const norm = name.toLowerCase();
  if (norm.includes("united states") || norm === "usa") return "united states of america";
  if (norm.includes("congo") && (norm.includes("dem") || norm.includes("d.r."))) return "dr congo";
  if (norm.includes("central african")) return "central african rep.";
  if (norm.includes("dominican")) return "dominican rep.";
  if (norm.includes("falkland")) return "argentina";
  return norm;
};

/**
 * Genera la población real calculada a partir de los datos en BD y una semilla.
 */
export const getRealPopulation = (name: string, seed: number, _unused?: any): number => {
  const norm = normalizeName(name);
  
  // Buscar en el índice de países cargados de BD
  for (const [key, pais] of Object.entries(_paisesIndex)) {
    if (norm === key || norm.includes(key) || key.includes(norm)) {
      const growthFactor = 1.05 + ((seed % 15) / 100);
      return Math.floor(pais.poblacion_real_tierra * growthFactor);
    }
  }
  return Math.floor((2000000 + (seed * 150000) % 43000000) * 1.1);
};

/**
 * Calcula la economía en base al PIB per capita y la población.
 */
export const getRealEconomy = (name: string, population: number, seed: number): number => {
  const preset = getPresetForCountry(name);
  let gdpVar = 0;
  if (preset.gdpPerCapita >= 60000) {
    gdpVar = (seed % 20) * 1000;
  } else if (preset.gdpPerCapita >= 10000) {
    gdpVar = (seed % 15) * 800;
  } else {
    gdpVar = (seed % 10) * 500;
  }
  const finalGdpPerCapita = preset.gdpPerCapita + gdpVar;
  return Math.max(1, Math.floor((population * finalGdpPerCapita) / 1000000));
};

/**
 * Obtiene el detalle militar para países de la IA.
 */
export const getRealEjercitoDetalle = (isAliado: boolean, population: number, seed: number, nameEN: string): Tropas => {
  if (isAliado) return { infanteria: 0, caballeria: 0, artilleria: 0 };
  const preset = getPresetForCountry(nameEN);
  const baseSize = Math.max(100, Math.floor(Math.sqrt(population) * (5 + (seed % 5)) * preset.ejercitoMultiplicador));

  return {
    infanteria: Math.floor(baseSize * preset.composicion.infanteria),
    caballeria: Math.floor(baseSize * preset.composicion.caballeria),
    artilleria: Math.floor(baseSize * preset.composicion.artilleria),
  };
};

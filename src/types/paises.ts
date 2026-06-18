// ============================================================
// CONQUEST — TYPES FOR COUNTRIES (PAISES)
// ============================================================

import type { Tropas } from '../database/troops';
import type { TropasDetalle } from './tropas';

export type Pais = {
  id: string;
  nombre: string;
  economia: number;
  poblacion: number;
  ejercito_ia: number;
  conquistado: boolean;
  oro_ia: number;
  ejercito_ia_detalle: Tropas;
  ejercito_ia_detalle_nuevo?: TropasDetalle;
  tasa_natalidad: number;
  tasa_mortalidad: number;
  dias_reclutamiento_agresivo?: number;
};

export interface PaisBase {
  pais_id: string;                   // Nombre EN (clave del GeoJSON)
  nombre_es: string;                 // Traducción al español
  continente_id: number;
  poblacion_real_tierra: number;
  gdp_per_capita_base: number;
  ejercito_multiplicador: number;
  pct_composicion_infanteria: number;
  pct_composicion_caballeria: number;
  pct_composicion_artilleria: number;
  tasa_natalidad_diaria: number;
  tasa_mortalidad_diaria: number;
  multiplicador_reclutamiento: number;
  multiplicador_pesadas: number;
  nombre_continente?: string;
}

export interface PaisPreset {
  gdpPerCapita: number;
  ejercitoMultiplicador: number;
  composicion: {
    infanteria: number;
    caballeria: number;
    artilleria: number;
  };
  multiplicadorReclutamiento?: number;
  multiplicadorPesadas?: number;
  tasa_natalidad?: number;
  tasa_mortalidad?: number;
}

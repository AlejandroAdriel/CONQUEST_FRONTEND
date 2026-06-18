// ============================================================
// CONQUEST — TROOPS DATABASE SERVICE
// Responsable de:
//   · Tipos de tropa y totales (Tropas, TroopBaseCosts, CombatPowerMultipliers)
//   · Catálogo completo de unidades (desde Supabase con fallback local)
//   · Utilitarios de distribución, deducción y cálculo de fuerza
//
// Referencia de esquema (schema.sql + 04_seed_tropas.sql):
//   tropas       → tropa_id, nombre_tropa, costo_base, multiplicador_combate
//   infanterias  → tropa_id, bono_defensa_trinchera
//   caballerias  → tropa_id, bono_ataque_flanqueo
//   artillerias  → tropa_id, bono_perforacion_plasma
// ============================================================

import { supabase } from './supabaseClient';
import type { Tropa, TropasDetalle } from '../types/tropas';

// ─── TIPOS BASE DE TROPAS ─────────────────────────────────────
// Movidos aquí desde mockAPI.ts — fuente de verdad de estos tipos.

/** Totales lineales de tropas agrupados por subtipo */
export type Tropas = {
  infanteria: number;
  caballeria: number;
  artilleria: number;
};

/** Costos base por subtipo (derivados del catálogo al arrancar) */
export interface TroopBaseCosts {
  infanteria: number;
  caballeria: number;
  artilleria: number;
}

/** Multiplicadores de combate por subtipo (derivados del catálogo al arrancar) */
export interface CombatPowerMultipliers {
  infanteria: number;
  caballeria: number;
  artilleria: number;
}

// ─── CATÁLOGO FALLBACK (espeja 04_seed_tropas.sql) ────────────
// Usado cuando Supabase no está disponible o la tabla está vacía.

const FALLBACK_CATALOGO: Tropa[] = [
  // Infantería (IDs: 1, 2, 7, 8, 9) — bono = bono_defensa_trinchera
  { tropa_id: 1,  nombre_tropa: 'Cibersoldado de Asalto',    costo_base: 15,  multiplicador_combate: 1.0, subtipo: 'infanteria', bono_especial: 1.5 },
  { tropa_id: 2,  nombre_tropa: 'Guardia de Neo-Tokio',       costo_base: 25,  multiplicador_combate: 1.2, subtipo: 'infanteria', bono_especial: 2.0 },
  { tropa_id: 7,  nombre_tropa: 'Recluta con Escudo',         costo_base: 10,  multiplicador_combate: 0.9, subtipo: 'infanteria', bono_especial: 2.5 },
  { tropa_id: 8,  nombre_tropa: 'Espía Holográfico',          costo_base: 35,  multiplicador_combate: 1.1, subtipo: 'infanteria', bono_especial: 1.2 },
  { tropa_id: 9,  nombre_tropa: 'Exo-Soldado Pesado',         costo_base: 50,  multiplicador_combate: 1.6, subtipo: 'infanteria', bono_especial: 3.0 },
  // Caballería (IDs: 3, 4, 10, 11, 12) — bono = bono_ataque_flanqueo
  { tropa_id: 3,  nombre_tropa: 'Motorista de Asalto Cyber',  costo_base: 45,  multiplicador_combate: 1.5, subtipo: 'caballeria', bono_especial: 2.5 },
  { tropa_id: 4,  nombre_tropa: 'Nómada del Desierto',        costo_base: 60,  multiplicador_combate: 1.8, subtipo: 'caballeria', bono_especial: 3.5 },
  { tropa_id: 10, nombre_tropa: 'Cazador en Monorrueda',      costo_base: 55,  multiplicador_combate: 1.4, subtipo: 'caballeria', bono_especial: 2.0 },
  { tropa_id: 11, nombre_tropa: 'Jinete de Neodraco',         costo_base: 90,  multiplicador_combate: 2.2, subtipo: 'caballeria', bono_especial: 4.0 },
  { tropa_id: 12, nombre_tropa: 'Flanqueador Veloz',          costo_base: 40,  multiplicador_combate: 1.3, subtipo: 'caballeria', bono_especial: 1.8 },
  // Artillería (IDs: 5, 6, 13, 14, 15) — bono = bono_perforacion_plasma
  { tropa_id: 5,  nombre_tropa: 'Cañón de Plasma Pesado',     costo_base: 120, multiplicador_combate: 3.0, subtipo: 'artilleria', bono_especial: 4.5 },
  { tropa_id: 6,  nombre_tropa: 'Meca de Asedio Goliath',     costo_base: 250, multiplicador_combate: 4.0, subtipo: 'artilleria', bono_especial: 6.0 },
  { tropa_id: 13, nombre_tropa: 'Lanzamisiles Enjambre',      costo_base: 150, multiplicador_combate: 3.2, subtipo: 'artilleria', bono_especial: 5.0 },
  { tropa_id: 14, nombre_tropa: 'Mortero de Pulso EMP',       costo_base: 110, multiplicador_combate: 2.5, subtipo: 'artilleria', bono_especial: 3.8 },
  { tropa_id: 15, nombre_tropa: 'Batería de Riel Magnético',  costo_base: 300, multiplicador_combate: 5.0, subtipo: 'artilleria', bono_especial: 7.5 },
];

// ─── FETCH DESDE SUPABASE ─────────────────────────────────────

/**
 * Obtiene el catálogo completo de tropas desde Supabase
 * (tablas: tropas + infanterias + caballerias + artillerias).
 * Ante cualquier fallo devuelve FALLBACK_CATALOGO.
 */
export const fetchCatalogoTropas = async (): Promise<Tropa[]> => {
  try {
    const { data, error } = await supabase
      .from('tropas')
      .select(`
        tropa_id,
        nombre_tropa,
        costo_base,
        multiplicador_combate,
        infanterias (bono_defensa_trinchera),
        caballerias (bono_ataque_flanqueo),
        artillerias (bono_perforacion_plasma)
      `)
      .order('tropa_id', { ascending: true });

    if (error || !data || data.length === 0) {
      console.warn('[fetchCatalogoTropas] Usando fallback:', error?.message ?? 'tabla vacía');
      return FALLBACK_CATALOGO;
    }

    return data.map((row) => {
      // Supabase puede retornar relaciones como array o como objeto
      const inf = Array.isArray(row.infanterias) ? row.infanterias[0] : row.infanterias;
      const cab = Array.isArray(row.caballerias) ? row.caballerias[0] : row.caballerias;
      const art = Array.isArray(row.artillerias) ? row.artillerias[0] : row.artillerias;

      let subtipo: 'infanteria' | 'caballeria' | 'artilleria' = 'infanteria';
      let bono_especial = 1.0;

      if (inf) {
        subtipo = 'infanteria';
        bono_especial = Number(inf.bono_defensa_trinchera ?? 1.0);
      } else if (cab) {
        subtipo = 'caballeria';
        bono_especial = Number(cab.bono_ataque_flanqueo ?? 1.0);
      } else if (art) {
        subtipo = 'artilleria';
        bono_especial = Number(art.bono_perforacion_plasma ?? 1.0);
      }

      return {
        tropa_id: row.tropa_id as number,
        nombre_tropa: row.nombre_tropa as string,
        costo_base: Number(row.costo_base),
        multiplicador_combate: Number(row.multiplicador_combate),
        subtipo,
        bono_especial,
      } satisfies Tropa;
    });
  } catch (e) {
    console.error('[fetchCatalogoTropas] Exception:', e);
    return FALLBACK_CATALOGO;
  }
};

// ─── DERIVACIÓN DE COSTOS Y MULTIPLICADORES ───────────────────

/**
 * Calcula el costo base mínimo por subtipo a partir del catálogo.
 * (Se usa para inicializar troopCostsRef en App.tsx)
 */
export const derivarTroopBaseCosts = (catalogo: Tropa[]): TroopBaseCosts => ({
  infanteria: catalogo.find(t => t.subtipo === 'infanteria')?.costo_base ?? 10,
  caballeria: catalogo.find(t => t.subtipo === 'caballeria')?.costo_base ?? 25,
  artilleria: catalogo.find(t => t.subtipo === 'artilleria')?.costo_base ?? 60,
});

/**
 * Calcula el multiplicador de combate base por subtipo a partir del catálogo.
 * (Se usa para inicializar combatMultipliersRef en App.tsx)
 */
export const derivarCombatMultipliers = (catalogo: Tropa[]): CombatPowerMultipliers => ({
  infanteria: catalogo.find(t => t.subtipo === 'infanteria')?.multiplicador_combate ?? 1.0,
  caballeria: catalogo.find(t => t.subtipo === 'caballeria')?.multiplicador_combate ?? 1.5,
  artilleria: catalogo.find(t => t.subtipo === 'artilleria')?.multiplicador_combate ?? 3.0,
});

// ─── UTILITARIOS DE DISTRIBUCIÓN ─────────────────────────────

/**
 * Distribuye totales lineales de tropas entre las unidades del catálogo.
 * La distribución es equitativa dentro de cada subtipo.
 * DINÁMICO: usa el catálogo real en vez de IDs hardcodeados.
 */
export const distribuirTropasDetalle = (
  inf: number,
  cab: number,
  art: number,
  catalogo: Tropa[] = FALLBACK_CATALOGO
): TropasDetalle => {
  const infIds = catalogo.filter(t => t.subtipo === 'infanteria').map(t => t.tropa_id);
  const cabIds = catalogo.filter(t => t.subtipo === 'caballeria').map(t => t.tropa_id);
  const artIds = catalogo.filter(t => t.subtipo === 'artilleria').map(t => t.tropa_id);

  const detail: TropasDetalle = {};

  // Inicializar a 0
  [...infIds, ...cabIds, ...artIds].forEach(id => { detail[id] = 0; });

  const spread = (total: number, ids: number[]) => {
    if (total <= 0 || ids.length === 0) return;
    const base = Math.floor(total / ids.length);
    const remainder = total % ids.length;
    ids.forEach((id, idx) => {
      detail[id] = base + (idx === 0 ? remainder : 0);
    });
  };

  spread(inf, infIds);
  spread(cab, cabIds);
  spread(art, artIds);

  return detail;
};

/**
 * Sumariza un inventario detallado en totales por subtipo.
 */
export const syncTropasTotales = (
  detalle: TropasDetalle,
  catalogo: Tropa[]
): Tropas => {
  const totals: Tropas = { infanteria: 0, caballeria: 0, artilleria: 0 };
  for (const [tropaIdStr, cantidad] of Object.entries(detalle)) {
    const unit = catalogo.find(u => u.tropa_id === Number(tropaIdStr));
    if (unit) totals[unit.subtipo] += Number(cantidad);
  }
  return totals;
};

/**
 * Calcula la fuerza de combate ponderada (qty × multiplicador_combate).
 * Opcionalmente filtra por subtipo.
 */
export const calcularFuerzaTotal = (
  detalle: TropasDetalle,
  catalogo: Tropa[],
  tipoFiltro?: 'infanteria' | 'caballeria' | 'artilleria'
): number => {
  return Object.entries(detalle).reduce((total, [tropaIdStr, cantidad]) => {
    const unit = catalogo.find(u => u.tropa_id === Number(tropaIdStr));
    if (!unit) return total;
    if (tipoFiltro && unit.subtipo !== tipoFiltro) return total;
    return total + (Number(cantidad) * unit.multiplicador_combate);
  }, 0);
};

/**
 * Deduce secuencialmente bajas de un subtipo (de mayor a menor stock).
 */
export const deducirTropasDetalle = (
  detalle: TropasDetalle,
  catalogo: Tropa[],
  cantidadADeducir: number,
  subtipo: 'infanteria' | 'caballeria' | 'artilleria'
): TropasDetalle => {
  const copy = { ...detalle };
  let rest = cantidadADeducir;

  const units = catalogo
    .filter(u => u.subtipo === subtipo)
    .sort((a, b) => (copy[b.tropa_id] || 0) - (copy[a.tropa_id] || 0));

  for (const unit of units) {
    if (rest <= 0) break;
    const current = copy[unit.tropa_id] || 0;
    if (current > 0) {
      const toSub = Math.min(current, rest);
      copy[unit.tropa_id] = current - toSub;
      rest -= toSub;
    }
  }
  return copy;
};

/**
 * Suma o resta tropas de manera segura sobre el inventario detallado.
 * Incrementos se distribuyen equitativamente entre unidades del subtipo.
 */
export const ajustarTropasDetalle = (
  detalle: TropasDetalle,
  catalogo: Tropa[],
  cambio: number,
  subtipo: 'infanteria' | 'caballeria' | 'artilleria'
): TropasDetalle => {
  if (cambio === 0) return { ...detalle };

  if (cambio < 0) {
    return deducirTropasDetalle(detalle, catalogo, -cambio, subtipo);
  }

  const unitsOfSubtype = catalogo.filter(u => u.subtipo === subtipo);
  if (unitsOfSubtype.length === 0) return { ...detalle };

  const copy = { ...detalle };
  const addPerUnit = Math.floor(cambio / unitsOfSubtype.length);
  const extra = cambio % unitsOfSubtype.length;

  unitsOfSubtype.forEach((unit, idx) => {
    copy[unit.tropa_id] = (copy[unit.tropa_id] || 0) + addPerUnit + (idx === 0 ? extra : 0);
  });

  return copy;
};

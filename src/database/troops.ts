// ============================================================
// CONQUEST — TROOPS DATABASE SERVICE
// ============================================================

import { supabase } from './supabaseClient';
import type { Tropa } from '../types/tropas';

const FALLBACK_CATALOGO: Tropa[] = [
  { tropa_id: 1, nombre_tropa: 'Cibersoldado de Asalto', costo_base: 15, multiplicador_combate: 1.0, subtipo: 'infanteria', bono_especial: 1.5 },
  { tropa_id: 2, nombre_tropa: 'Guardia de Neo-Tokio', costo_base: 25, multiplicador_combate: 1.2, subtipo: 'infanteria', bono_especial: 2.0 },
  { tropa_id: 3, nombre_tropa: 'Motorista de Asalto Cyber', costo_base: 45, multiplicador_combate: 1.5, subtipo: 'caballeria', bono_especial: 2.5 },
  { tropa_id: 4, nombre_tropa: 'Nómada del Desierto', costo_base: 60, multiplicador_combate: 1.8, subtipo: 'caballeria', bono_especial: 3.5 },
  { tropa_id: 5, nombre_tropa: 'Cañón de Plasma Pesado', costo_base: 120, multiplicador_combate: 3.0, subtipo: 'artilleria', bono_especial: 4.5 },
  { tropa_id: 6, nombre_tropa: 'Meca de Asedio Goliath', costo_base: 250, multiplicador_combate: 4.0, subtipo: 'artilleria', bono_especial: 6.0 },
  { tropa_id: 7, nombre_tropa: 'Recluta con Escudo', costo_base: 10, multiplicador_combate: 0.9, subtipo: 'infanteria', bono_especial: 2.5 },
  { tropa_id: 8, nombre_tropa: 'Espía Holográfico', costo_base: 35, multiplicador_combate: 1.1, subtipo: 'infanteria', bono_especial: 1.2 },
  { tropa_id: 9, nombre_tropa: 'Exo-Soldado Pesado', costo_base: 50, multiplicador_combate: 1.6, subtipo: 'infanteria', bono_especial: 3.0 },
  { tropa_id: 10, nombre_tropa: 'Cazador en Monorrueda', costo_base: 55, multiplicador_combate: 1.4, subtipo: 'caballeria', bono_especial: 2.0 },
  { tropa_id: 11, nombre_tropa: 'Jinete de Neodraco', costo_base: 90, multiplicador_combate: 2.2, subtipo: 'caballeria', bono_especial: 4.0 },
  { tropa_id: 12, nombre_tropa: 'Flanqueador Veloz', costo_base: 40, multiplicador_combate: 1.3, subtipo: 'caballeria', bono_especial: 1.8 },
  { tropa_id: 13, nombre_tropa: 'Lanzamisiles Enjambre', costo_base: 150, multiplicador_combate: 3.2, subtipo: 'artilleria', bono_especial: 5.0 },
  { tropa_id: 14, nombre_tropa: 'Mortero de Pulso EMP', costo_base: 110, multiplicador_combate: 2.5, subtipo: 'artilleria', bono_especial: 3.8 },
  { tropa_id: 15, nombre_tropa: 'Batería de Riel Magnético', costo_base: 300, multiplicador_combate: 5.0, subtipo: 'artilleria', bono_especial: 7.5 }
];

/**
 * Obtiene el catálogo completo de tropas desde Supabase.
 * Si falla, devuelve el catálogo de fallback estructurado.
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
      `);

    if (error || !data || data.length === 0) {
      console.warn('[fetchCatalogoTropas] Usando catálogo de fallback por error o tabla vacía:', error?.message);
      return FALLBACK_CATALOGO;
    }

    return data.map((row: any) => {
      let subtipo: 'infanteria' | 'caballeria' | 'artilleria' = 'infanteria';
      let bono_especial = 1.0;

      // El formato de la unión en Supabase puede venir como un array o un objeto
      const inf = Array.isArray(row.infanterias) ? row.infanterias[0] : row.infanterias;
      const cab = Array.isArray(row.caballerias) ? row.caballerias[0] : row.caballerias;
      const art = Array.isArray(row.artillerias) ? row.artillerias[0] : row.artillerias;

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
        tropa_id: row.tropa_id,
        nombre_tropa: row.nombre_tropa,
        costo_base: Number(row.costo_base),
        multiplicador_combate: Number(row.multiplicador_combate),
        subtipo,
        bono_especial
      } as Tropa;
    });
  } catch (e) {
    console.error('[fetchCatalogoTropas] Exception:', e);
    return FALLBACK_CATALOGO;
  }
};

/**
 * Distribuye totales lineales de tropas en cantidades detalladas del catálogo.
 */
export const distribuirTropasDetalle = (
  inf: number,
  cab: number,
  art: number
): Record<number, number> => {
  const infIds = [1, 2, 7, 8, 9];
  const cabIds = [3, 4, 10, 11, 12];
  const artIds = [5, 6, 13, 14, 15];

  const detail: Record<number, number> = {};

  // Inicializar todas a 0
  const allIds = [...infIds, ...cabIds, ...artIds];
  allIds.forEach(id => { detail[id] = 0; });

  // Distribución equitativa aproximada
  if (inf > 0) {
    const dInf = Math.floor(inf / infIds.length);
    infIds.forEach((id, idx) => {
      detail[id] = idx === 0 ? dInf + (inf % infIds.length) : dInf;
    });
  }

  if (cab > 0) {
    const dCab = Math.floor(cab / cabIds.length);
    cabIds.forEach((id, idx) => {
      detail[id] = idx === 0 ? dCab + (cab % cabIds.length) : dCab;
    });
  }

  if (art > 0) {
    const dArt = Math.floor(art / artIds.length);
    artIds.forEach((id, idx) => {
      detail[id] = idx === 0 ? dArt + (art % artIds.length) : dArt;
    });
  }

  return detail;
};

/**
 * Sumariza cantidades detalladas en subtipos tradicionales.
 */
export const syncTropasTotales = (
  detalle: Record<number, number>,
  catalogo: Tropa[]
): { infanteria: number; caballeria: number; artilleria: number } => {
  const totals = { infanteria: 0, caballeria: 0, artilleria: 0 };
  
  Object.entries(detalle).forEach(([tropaIdStr, cantidad]) => {
    const tropaId = Number(tropaIdStr);
    const qty = Number(cantidad);
    const unit = catalogo.find(u => u.tropa_id === tropaId);
    if (unit) {
      totals[unit.subtipo] += qty;
    }
  });

  return totals;
};

/**
 * Calcula la fuerza de combate ponderada a partir de los stocks detallados.
 */
export const calcularFuerzaTotal = (
  detalle: Record<number, number>,
  catalogo: Tropa[],
  tipoFiltro?: 'infanteria' | 'caballeria' | 'artilleria'
): number => {
  return Object.entries(detalle).reduce((total, [tropaIdStr, cantidad]) => {
    const tropaId = Number(tropaIdStr);
    const qty = Number(cantidad);
    const unit = catalogo.find(u => u.tropa_id === tropaId);
    if (!unit) return total;
    if (tipoFiltro && unit.subtipo !== tipoFiltro) return total;
    return total + (qty * unit.multiplicador_combate);
  }, 0);
};

/**
 * Deduce secuencialmente una cantidad de tropas por subtipo de un inventario detallado.
 */
export const deducirTropasDetalle = (
  detalle: Record<number, number>,
  catalogo: Tropa[],
  cantidadADeducir: number,
  subtipo: 'infanteria' | 'caballeria' | 'artilleria'
): Record<number, number> => {
  const copy = { ...detalle };
  let rest = cantidadADeducir;
  // Ordenar para deducir primero de las unidades con mayor stock
  const units = catalogo
    .filter(u => u.subtipo === subtipo)
    .sort((a, b) => (copy[b.tropa_id] || 0) - (copy[a.tropa_id] || 0));

  for (const unit of units) {
    if (rest <= 0) break;
    const currentQty = copy[unit.tropa_id] || 0;
    if (currentQty > 0) {
      const toSub = Math.min(currentQty, rest);
      copy[unit.tropa_id] = currentQty - toSub;
      rest -= toSub;
    }
  }
  return copy;
};

/**
 * Ajusta (suma o resta) el inventario de tropas detalladas de manera segura.
 */
export const ajustarTropasDetalle = (
  detalle: Record<number, number>,
  catalogo: Tropa[],
  cambio: number,
  subtipo: 'infanteria' | 'caballeria' | 'artilleria'
): Record<number, number> => {
  if (cambio === 0) return { ...detalle };
  if (cambio < 0) {
    return deducirTropasDetalle(detalle, catalogo, -cambio, subtipo);
  } else {
    const unitsOfSubtype = catalogo.filter(u => u.subtipo === subtipo);
    if (unitsOfSubtype.length === 0) return { ...detalle };
    
    // Distribuir el incremento equitativamente entre las unidades del subtipo
    const copy = { ...detalle };
    const addPerUnit = Math.floor(cambio / unitsOfSubtype.length);
    const extra = cambio % unitsOfSubtype.length;
    
    unitsOfSubtype.forEach((unit, idx) => {
      const currentVal = copy[unit.tropa_id] || 0;
      copy[unit.tropa_id] = currentVal + addPerUnit + (idx === 0 ? extra : 0);
    });
    return copy;
  }
};

// ============================================================
// CONQUEST — TYPES FOR TROOPS
// ============================================================

export interface Tropa {
  tropa_id: number;
  nombre_tropa: string;
  costo_base: number;
  multiplicador_combate: number;
  subtipo: 'infanteria' | 'caballeria' | 'artilleria';
  bono_especial: number; // bono_defensa_trinchera, bono_ataque_flanqueo, or bono_perforacion_plasma
}

export type TropasDetalle = Record<number, number>; // maps tropa_id -> quantity

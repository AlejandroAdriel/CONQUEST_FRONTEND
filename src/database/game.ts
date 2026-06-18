// ============================================================
// CONQUEST — GAME/HABILIDADES SERVICE
// Gestión de habilidades y árbol tecnológico en Supabase
// ============================================================

import { supabase } from './supabaseClient';
import type { Habilidad } from '../types/habilidades';

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

// ─── CARGAR ÁRBOL DE HABILIDADES ──────────────────────────────

export const fetchTechTree = async (partidaId?: number): Promise<Habilidad[]> => {
  try {
    const { data: habs, error: habsErr } = await supabase
      .from('habilidades')
      .select('*');

    if (habsErr || !habs) {
      console.error('Error fetching habilidades:', habsErr);
      return [];
    }

    const { data: prereqs, error: prereqsErr } = await supabase
      .from('habilidad_prerrequisitos')
      .select('*');

    if (prereqsErr) {
      console.error('Error fetching prerequisites:', prereqsErr);
    }

    let unlockedSet = new Set<string>();
    if (partidaId) {
      const { data: unlocked, error: unlockedErr } = await supabase
        .from('partida_habilidades')
        .select('habilidad_id')
        .eq('partida_id', partidaId);

      if (unlockedErr) {
        console.error('Error fetching unlocked skills:', unlockedErr);
      } else if (unlocked) {
        unlocked.forEach((u: any) => unlockedSet.add(u.habilidad_id));
      }
    }

    const prereqMap: { [key: string]: string[] } = {};
    if (prereqs) {
      prereqs.forEach((p: any) => {
        if (!prereqMap[p.habilidad_id]) {
          prereqMap[p.habilidad_id] = [];
        }
        prereqMap[p.habilidad_id].push(p.habilidad_requerida_id);
      });
    }

    return habs.map((row: any) => {
      const x = row.eje_x;
      const y = row.eje_y;
      let nivel = 1;
      if (x === 200) nivel = 1;
      else if (x === 600) nivel = 2;
      else if (x === 1100) nivel = 3;
      else if (x === 1600) nivel = 4;
      else if (x === 2100 || x === 2200) nivel = 5;
      else if (x === 2700 || x === 2800) nivel = 6;
      else if (x === 3300) nivel = 7;

      let tiempo_investigacion_dias = 30;
      if (nivel === 2) tiempo_investigacion_dias = 90;
      else if (nivel === 3) tiempo_investigacion_dias = 180;
      else if (nivel === 4) tiempo_investigacion_dias = 270;
      else if (nivel === 5) tiempo_investigacion_dias = 365;
      else if (nivel === 6) tiempo_investigacion_dias = 540;
      else if (nivel === 7) tiempo_investigacion_dias = 730;

      const desc = row.descripcion || '';
      const bonoIndex = desc.indexOf("Bono:");
      const tipo_bono = bonoIndex !== -1 ? desc.substring(bonoIndex + 5).trim() : desc;

      return {
        id: row.habilidad_id,
        nombre: row.nombre,
        costo: row.costo,
        desbloqueada: unlockedSet.has(row.habilidad_id),
        prerrequisitos: prereqMap[row.habilidad_id] || [],
        tipo_bono: tipo_bono,
        categoria: row.categoria as "desarrollo" | "militar",
        rama: row.rama,
        nivel: nivel,
        x: x,
        y: y,
        tiempo_investigacion_dias: tiempo_investigacion_dias
      };
    });
  } catch (error) {
    console.error('Exception in fetchTechTree:', error);
    return [];
  }
};

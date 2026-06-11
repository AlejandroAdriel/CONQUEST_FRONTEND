import { api } from "./api";

export interface DBGameSave {
  id: number;
  commanderID: string;
  hq: string;
  creationDate: string;
  lastSaveDate: string;
  campaignDays: number;
  dominionPercent: number;
  budget: number;
  troops: number;
  tropas_infanteria: number;
  tropas_caballeria: number;
  tropas_artilleria: number;
  habilidad_puntos: number;
  velocidad: number;
  pausado: boolean;
}

// Obtener todas las partidas guardadas de un operario
export const fetchSavedGames = async (usuarioId: number): Promise<DBGameSave[]> => {
  try {
    return await api.get<DBGameSave[]>(`/api/saves?usuario_id=${usuarioId}`);
  } catch (error) {
    console.error("Error al obtener partidas guardadas:", error);
    return [];
  }
};

// Crear/inicializar una nueva partida
export const initializeNewGame = async (data: {
  usuario_id: number;
  commander_id: string;
  hq_pais_id: string;
  oro?: number;
  tropas_infanteria?: number;
  tropas_caballeria?: number;
  tropas_artilleria?: number;
  velocidad?: number;
  pausado?: boolean;
}): Promise<DBGameSave | null> => {
  try {
    return await api.post<DBGameSave>("/api/saves", data);
  } catch (error) {
    console.error("Error al crear partida nueva:", error);
    return null;
  }
};

// Guardar el estado de juego en una partida activa
export const saveGame = async (
  partidaId: number,
  data: {
    dias_campana: number;
    porcentaje_dominio: number;
    oro: number;
    tropas_infanteria: number;
    tropas_caballeria: number;
    tropas_artilleria: number;
    habilidad_puntos: number;
    velocidad: number;
    pausado: boolean;
  }
): Promise<boolean> => {
  try {
    const result = await api.put<{ success: boolean }>(`/api/saves/${partidaId}`, data);
    return result.success;
  } catch (error) {
    console.error("Error al guardar la partida:", error);
    return false;
  }
};

// Eliminar/purgar una partida
export const deleteGame = async (partidaId: number): Promise<boolean> => {
  try {
    const result = await api.delete<{ success: boolean }>(`/api/saves/${partidaId}`);
    return result.success;
  } catch (error) {
    console.error("Error al eliminar la partida:", error);
    return false;
  }
};

const API_BASE_URL = "http://localhost:3000/api";

export const fetchInitialGameState = async () => {
  const response = await fetch(`${API_BASE_URL}/game/initial`);
  if (!response.ok) throw new Error("Error al obtener estado inicial");
  return response.json();
};

export const fetchRandomEvents = async () => {
  const response = await fetch(`${API_BASE_URL}/eventos`);
  if (!response.ok) throw new Error("Error al obtener eventos");
  return response.json();
};

export const fetchTechTree = async (partidaId?: number) => {
  const url = partidaId
    ? `${API_BASE_URL}/habilidades?partidaId=${partidaId}`
    : `${API_BASE_URL}/habilidades`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Error al obtener árbol tecnológico");
  return response.json();
};

export const unlockHabilidad = async (
  partidaId: number,
  habilidadId: string
): Promise<{ success: true } | { success: false; error: string }> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/partidas/${partidaId}/habilidades/desbloquear`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habilidadId }),
      }
    );
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error ?? "Error desconocido del servidor." };
    }
    return { success: true };
  } catch {
    return { success: false, error: "ERROR_SERVIDOR" };
  }
};


export const fetchCountryStats = async () => {
  const response = await fetch(`${API_BASE_URL}/paises/stats`);
  if (!response.ok) throw new Error("Error al obtener estadísticas de países");
  return response.json();
};

export const fetchSavedGames = async (usuarioId: string = "1") => {
  const response = await fetch(`${API_BASE_URL}/partidas/${usuarioId}`);
  if (!response.ok) throw new Error("Error al obtener partidas guardadas");
  return response.json();
};

export const authenticateOperator = async (username: string, password: string): Promise<OperarioUser | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.user;
  } catch {
    return null;
  }
};

export const registerOperator = async (data: {
  nombre: string;
  email: string;
  username: string;
  password: string;
  pais: string;
}): Promise<{ success: true; user: OperarioUser } | { success: false; error: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    return result;
  } catch {
    return { success: false, error: "ERROR_SERVIDOR" };
  }
};

export const logoutOperator = () => {
  // Limpieza de sesión local si es requerido
};
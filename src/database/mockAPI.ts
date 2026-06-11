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

export const fetchTechTree = async () => {
  const response = await fetch(`${API_BASE_URL}/habilidades`);
  if (!response.ok) throw new Error("Error al obtener árbol tecnológico");
  return response.json();
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
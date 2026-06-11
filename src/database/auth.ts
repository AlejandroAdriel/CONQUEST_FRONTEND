import { api } from "./api";
import type { OperarioUser } from "../types/user";

const SESSION_KEY = "conquest_session";

// Devuelve el objeto OperarioUser completo si las credenciales son válidas, o null.
export const authenticateOperator = async (username: string, password: string): Promise<OperarioUser | null> => {
  try {
    const data = await api.post<any>("/api/auth/login", { username, password });
    if (data.success && data.user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
      return data.user;
    }
    return null;
  } catch (error) {
    return null;
  }
};

// Registra un nuevo operario. Devuelve el usuario creado o un mensaje de error.
export const registerOperator = async (data: {
  nombre: string;
  email: string;
  username: string;
  password: string;
  pais: string;
}): Promise<{ success: true; user: OperarioUser } | { success: false; error: string }> => {
  try {
    const result = await api.post<any>("/api/auth/register", data);
    if (result.success && result.user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(result.user));
    }
    return result;
  } catch (error: any) {
    return { success: false, error: error.message || "ERROR_DESCONOCIDO" };
  }
};

// Cierra la sesión activa en el navegador
export const logoutOperator = () => {
  localStorage.removeItem(SESSION_KEY);
};

// Recupera la sesión guardada del operario actual si existe
export const getPersistedOperator = (): OperarioUser | null => {
  const saved = localStorage.getItem(SESSION_KEY);
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
};

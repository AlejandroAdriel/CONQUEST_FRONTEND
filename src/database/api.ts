// ============================================================
// CONQUEST — CLIENTE DE CONEXIÓN A LA API DEL BACKEND
// Este archivo gestiona las llamadas HTTP reales al servidor backend.
// ============================================================

const API_BASE = "http://localhost:3000";

/**
 * Función auxiliar genérica para realizar peticiones HTTP Fetch.
 */
async function fetchAPI<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options?.headers || {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error de red en endpoint [${endpoint}]:`, error);
    throw error;
  }
}

// ─── MÉTODOS HTTP EXPUESTOS ───────────────────────────────────

export const api = {
  /**
   * Petición GET
   */
  get: <T = any>(endpoint: string, options?: RequestInit) =>
    fetchAPI<T>(endpoint, { ...options, method: "GET" }),

  /**
   * Petición POST
   */
  post: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    fetchAPI<T>(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    }),

  /**
   * Petición PUT
   */
  put: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    fetchAPI<T>(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    }),

  /**
   * Petición DELETE
   */
  delete: <T = any>(endpoint: string, options?: RequestInit) =>
    fetchAPI<T>(endpoint, { ...options, method: "DELETE" }),

  /**
   * Probar Conexión con el Servidor y Base de Datos
   */
  testConnection: async () => {
    try {
      const data = await fetchAPI("/api/status");
      console.log("Database connection successful:", data);
      return data;
    } catch (error) {
      console.error("Database connection failed:", error);
      throw error;
    }
  }
};
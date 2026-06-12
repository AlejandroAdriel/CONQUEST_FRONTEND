export type OperarioUser = {
  id: string;          // UUID de Supabase Auth
  dbId?: number;       // usuario_id SERIAL de la tabla public.usuarios (para joins con jugadores/partidas)
  username: string;
  email: string;
  nombre: string;
  pais: string;
  fechaRegistro: string;
  rango: string;
};

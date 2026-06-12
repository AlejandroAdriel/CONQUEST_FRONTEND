// ============================================================
// CONQUEST — AUTENTICACIÓN CON SUPABASE
// Supabase Auth maneja las contraseñas.
// public.usuarios almacena el perfil extendido.
// ============================================================

import { supabase } from './supabaseClient';
import type { OperarioUser } from '../types/user';

const SESSION_KEY = 'conquest_session';

// ─── HELPERS INTERNOS ─────────────────────────────────────────

type UsuarioRow = {
  usuario_id: number;
  username: string;
  correo: string;
  nombre: string;
  pais: string;
  rango: string;
  fecha_registro: string;
};

const rowToUser = (row: UsuarioRow, authId: string): OperarioUser => ({
  id:            authId,
  dbId:          row.usuario_id,
  username:      row.username,
  email:         row.correo,
  nombre:        row.nombre,
  pais:          row.pais,
  rango:         row.rango,
  fechaRegistro: row.fecha_registro,
});

const persistSession = (user: OperarioUser) =>
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));

const clearSession = () =>
  localStorage.removeItem(SESSION_KEY);

// ─── SESIÓN SÍNCRONA (sólo localStorage) ──────────────────────
// Usar en componentes que no pueden esperar async (SaveFilesMenu, etc.)
export const getPersistedOperator = (): OperarioUser | null => {
  const saved = localStorage.getItem(SESSION_KEY);
  if (!saved) return null;
  try {
    return JSON.parse(saved) as OperarioUser;
  } catch {
    clearSession();
    return null;
  }
};

// ─── RESTAURAR SESIÓN ASYNC (App.tsx useEffect) ───────────────
// Verifica sesión activa de Supabase y actualiza localStorage
export const refreshAuthSession = async (): Promise<OperarioUser | null> => {
  // Fast-path: sesión guardada válida
  const cached = getPersistedOperator();
  if (cached) return cached;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const { data: row } = await supabase
    .from('usuarios')
    .select('usuario_id, username, correo, nombre, pais, rango, fecha_registro')
    .eq('correo', session.user.email)
    .maybeSingle();

  if (!row) return null;

  const user = rowToUser(row as UsuarioRow, session.user.id);
  persistSession(user);
  return user;
};

// ─── AUTENTICAR ───────────────────────────────────────────────

export const authenticateOperator = async (
  usernameOrEmail: string,
  password: string
): Promise<OperarioUser | null> => {
  const input = usernameOrEmail.trim();
  const isEmail = input.includes('@');

  // Buscar por correo si el input parece un email, sino por username
  const query = supabase
    .from('usuarios')
    .select('usuario_id, username, correo, nombre, pais, rango, fecha_registro');

  const { data: row } = await (isEmail
    ? query.ilike('correo', input.toLowerCase())
    : query.ilike('username', input.toUpperCase())
  ).maybeSingle();

  if (!row) return null;

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email:    row.correo,
    password: password,
  });

  if (error || !authData.user) return null;

  const user = rowToUser(row as UsuarioRow, authData.user.id);
  persistSession(user);
  return user;
};

// ─── REGISTRAR ────────────────────────────────────────────────

export const registerOperator = async (data: {
  nombre:   string;
  email:    string;
  username: string;
  password: string;
  pais:     string;
}): Promise<{ success: true; user: OperarioUser } | { success: false; error: string }> => {

  const username = data.username.trim().toUpperCase();
  const correo   = data.email.trim().toLowerCase();

  // 1. Verificar unicidad del username
  const { data: existingUser } = await supabase
    .from('usuarios')
    .select('usuario_id')
    .ilike('username', username)
    .maybeSingle();

  if (existingUser) return { success: false, error: 'ID_TOMADO' };

  // 2. Verificar unicidad del correo
  const { data: existingEmail } = await supabase
    .from('usuarios')
    .select('usuario_id')
    .eq('correo', correo)
    .maybeSingle();

  if (existingEmail) return { success: false, error: 'EMAIL_TOMADO' };

  // 3. Registrar en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email:    correo,
    password: data.password,
    options: {
      data: { username, nombre: data.nombre.trim(), pais: data.pais.trim() }
    }
  });

  if (authError) {
    const msg = authError.message.toLowerCase();
    const isRateLimit =
      authError.status === 429 ||
      msg.includes('rate') ||
      msg.includes('too many') ||
      msg.includes('over_email') ||
      msg.includes('429');
    if (isRateLimit) return { success: false, error: 'RATE_LIMIT' };
    if (msg.includes('already') || msg.includes('registered')) {
      return { success: false, error: 'EMAIL_TOMADO' };
    }
    return { success: false, error: authError.message };
  }

  const authUserId    = authData.user?.id ?? crypto.randomUUID();
  const authCreatedAt = authData.user?.created_at ?? new Date().toISOString();

  // 4. Insertar en public.usuarios y obtener el usuario_id SERIAL
  const { data: inserted, error: insertError } = await supabase
    .from('usuarios')
    .insert({
      username:      username,
      correo:        correo,
      nombre:        data.nombre.trim(),
      pais:          data.pais.trim(),
      password_hash: 'SUPABASE_AUTH',
      rango:         'OPERARIO NOVATO',
    })
    .select('usuario_id')
    .single();

  if (insertError) {
    if (insertError.code === '23505') {
      return { success: false, error: 'ID_TOMADO' };
    }
    return { success: false, error: insertError.message };
  }

  const user: OperarioUser = {
    id:            authUserId,
    dbId:          inserted.usuario_id,
    username:      username,
    email:         correo,
    nombre:        data.nombre.trim(),
    pais:          data.pais.trim(),
    rango:         'OPERARIO NOVATO',
    fechaRegistro: authCreatedAt,
  };

  persistSession(user);
  return { success: true, user };
};

// ─── LOGOUT ───────────────────────────────────────────────────

export const logoutOperator = async (): Promise<void> => {
  await supabase.auth.signOut();
  clearSession();
};

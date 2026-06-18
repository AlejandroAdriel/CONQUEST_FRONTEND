// ============================================================
// CONQUEST — Auth Service
// Maneja registro, login, logout y sesión con Supabase Auth.
// Tabla auxiliar: public.perfiles (extiende auth.users)
// ============================================================
import { supabase } from './supabaseClient';

// ─── TIPO PÚBLICO DEL OPERARIO ────────────────────────────────
// Este es el tipo que consume toda la app (Login, UserProfile, App, etc.)
export type OperarioUser = {
  id: string;             // UUID de Supabase auth.users
  username: string;       // ID de operario único
  email: string;
  nombre: string;
  pais: string;
  rango: string;
  fechaRegistro: string;  // ISO string
};

// ─── HELPERS PRIVADOS ─────────────────────────────────────────

const mapProfile = (authUser: any, perfil: any): OperarioUser => ({
  id:             authUser.id,
  username:       perfil?.username  ?? authUser.email?.split('@')[0] ?? 'OPERARIO',
  email:          authUser.email    ?? '',
  nombre:         perfil?.nombre    ?? 'Sin nombre',
  pais:           perfil?.pais      ?? 'Desconocido',
  rango:          perfil?.rango     ?? 'OPERARIO NOVATO',
  fechaRegistro:  authUser.created_at ?? new Date().toISOString(),
});

// ─── SERVICIOS PÚBLICOS ───────────────────────────────────────

/**
 * Registra un nuevo operario en Supabase Auth y crea su perfil.
 */
export const signUp = async (data: {
  nombre: string;
  email: string;
  username: string;
  password: string;
  pais: string;
}): Promise<{ success: true; user: OperarioUser } | { success: false; error: string }> => {

  // 1. Registrar en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email:    data.email,
    password: data.password,
    options: {
      data: {
        username: data.username.toUpperCase(),
        nombre:   data.nombre,
        pais:     data.pais,
      }
    }
  });

  if (authError) {
    // Mapear errores de Supabase a códigos internos
    if (authError.message.includes('already registered') || authError.message.includes('User already')) {
      return { success: false, error: 'EMAIL_TOMADO' };
    }
    return { success: false, error: authError.message };
  }

  if (!authData.user) {
    return { success: false, error: 'ERROR_DESCONOCIDO' };
  }

  // 2. Insertar perfil en tabla public.perfiles
  const { error: profileError } = await supabase
    .from('perfiles')
    .insert({
      id:       authData.user.id,
      username: data.username.toUpperCase(),
      nombre:   data.nombre,
      pais:     data.pais,
      rango:    'OPERARIO NOVATO',
    });

  if (profileError) {
    // Si el username ya existe en perfiles (unique constraint)
    if (profileError.code === '23505') {
      return { success: false, error: 'ID_TOMADO' };
    }
    console.error('[authService] Error creando perfil:', profileError);
  }

  const user = mapProfile(authData.user, {
    username: data.username.toUpperCase(),
    nombre:   data.nombre,
    pais:     data.pais,
    rango:    'OPERARIO NOVATO',
  });

  return { success: true, user };
};

/**
 * Inicia sesión con email o username + contraseña.
 */
export const signIn = async (
  usernameOrEmail: string,
  password: string
): Promise<{ success: true; user: OperarioUser } | { success: false; error: 'WRONG_PASSWORD' | 'USER_NOT_FOUND' | string }> => {

  let email = usernameOrEmail.trim();

  // Si el input no parece un email, buscar el email correspondiente en perfiles
  if (!email.includes('@')) {
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('id, username, nombre, pais, rango')
      .ilike('username', usernameOrEmail.trim())
      .maybeSingle();

    if (!perfil) {
      return { success: false, error: 'USER_NOT_FOUND' };
    }

    // Obtener el email real del usuario por su ID
    const { data: adminUser } = await supabase
      .from('perfiles')
      .select('id')
      .eq('id', perfil.id)
      .maybeSingle();

    if (!adminUser) {
      return { success: false, error: 'USER_NOT_FOUND' };
    }

    // Necesitamos el email — lo obtenemos desde la sesión existente si existe
    // O pedimos al usuario que use su email directamente
    // Por ahora usamos el campo email del auth buscando por el perfil
    const { data: { session } } = await supabase.auth.getSession();
    if (session && session.user?.id === perfil.id) {
      email = session.user.email ?? '';
    } else {
      // No podemos obtener el email sin service_role. 
      // Pedimos al usuario que use su email para login por username
      return { success: false, error: 'USE_EMAIL_FOR_LOGIN' };
    }
  }

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    if (
      authError.message.includes('Invalid login') ||
      authError.message.includes('invalid credentials') ||
      authError.message.toLowerCase().includes('password')
    ) {
      return { success: false, error: 'WRONG_PASSWORD' };
    }
    if (authError.message.includes('not found') || authError.message.includes('No user')) {
      return { success: false, error: 'USER_NOT_FOUND' };
    }
    return { success: false, error: authError.message };
  }

  if (!authData.user) {
    return { success: false, error: 'USER_NOT_FOUND' };
  }

  // Obtener perfil extendido
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('username, nombre, pais, rango')
    .eq('id', authData.user.id)
    .maybeSingle();

  return { success: true, user: mapProfile(authData.user, perfil) };
};

/**
 * Cierra la sesión activa.
 */
export const signOut = async (): Promise<void> => {
  await supabase.auth.signOut();
};

/**
 * Devuelve el usuario activo desde la sesión persistida, o null.
 * Llamar al inicio de la app para restaurar sesión automáticamente.
 */
export const getCurrentSession = async (): Promise<OperarioUser | null> => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) return null;

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('username, nombre, pais, rango')
    .eq('id', session.user.id)
    .maybeSingle();

  return mapProfile(session.user, perfil);
};

/**
 * Obtiene el perfil de un usuario por su ID.
 */
export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) console.error('[authService] getProfile error:', error);
  return data;
};

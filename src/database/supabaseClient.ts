// ============================================================
// CONQUEST — Cliente de Supabase (singleton)
// Lee las variables de entorno de Vite (.env local)
// ============================================================
import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnon) {
  console.error(
    '[CONQUEST] VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY no definidas.\n' +
    'Crea un archivo .env en la raíz del proyecto con esas variables.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    // Persiste la sesión en localStorage automáticamente
    persistSession: true,
    autoRefreshToken: true,
  }
});

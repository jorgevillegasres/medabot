import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

/** null si no hay variables de entorno: la app funciona en modo local (Fase 1). */
export const supabase: SupabaseClient | null =
  url && publishableKey
    ? createClient(url, publishableKey, { auth: { persistSession: true, autoRefreshToken: true } })
    : null;

export const isOnline = supabase !== null;

export function db(): SupabaseClient {
  if (!supabase)
    throw new Error(
      'Supabase no está configurado (VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY).',
    );
  return supabase;
}

/** Sesión actual; si no hay, crea una anónima (estudiantes: sin email ni cuenta). */
export async function ensureStudentSession() {
  const sb = db();
  const { data } = await sb.auth.getSession();
  if (data.session) return data.session;
  const { data: anon, error } = await sb.auth.signInAnonymously();
  if (error) throw error;
  return anon.session!;
}

/** Mensaje en español para errores de Supabase/Postgres. */
export function explain(error: unknown): string {
  const e = error as { code?: string; message?: string } | null;
  if (!e) return 'Error desconocido.';
  if (e.code === 'P0002') return 'Ese código de curso no existe. Revísalo con tu profesor.';
  if (e.code === '42501' || /row-level security/i.test(e.message ?? ''))
    return 'No tienes permiso para hacer eso (¿la galería está cerrada?).';
  if (e.code === '23505') return 'Ya existe un registro igual.';
  if (/anonymous sign-ins are disabled/i.test(e.message ?? ''))
    return 'El curso aún no admite estudiantes: el profesor debe activar el acceso anónimo en Supabase.';
  if (/rate limit/i.test(e.message ?? '') || (e as { status?: number }).status === 429)
    return 'Se enviaron demasiados correos en poco tiempo. Usa el enlace del último correo que recibiste o espera una hora e inténtalo de nuevo.';
  if (/fetch/i.test(e.message ?? '')) return 'Sin conexión con el servidor. Intenta de nuevo.';
  return e.message ?? 'Error desconocido.';
}

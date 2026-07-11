import { createClient } from '@supabase/supabase-js'

/**
 * Cliente de Supabase.
 *
 * Las credenciales se leen de variables de entorno (archivo .env, ver
 * .env.example). Si NO están configuradas, la app funciona en modo local
 * (LocalStorage) automáticamente — ver BoardContext.
 */
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** True si hay credenciales de Supabase; controla el modo de la app. */
export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      realtime: { params: { eventsPerSecond: 5 } },
    })
  : null

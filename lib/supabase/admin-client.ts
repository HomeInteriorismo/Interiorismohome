import { createClient as create } from "@supabase/supabase-js";

// Cliente del panel. Usa flujo "implicit" porque las invitaciones y los correos
// de recuperación de Supabase regresan con el token en el #hash de la URL.
export function createAdminClient() {
  return create(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { flowType: "implicit", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: "hi-admin-auth" },
  });
}

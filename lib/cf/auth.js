// Verifica que quien llama sea personal activo del panel (token de sesión de Supabase).
export async function staffFromRequest(request, env) {
  const SB = env.NEXT_PUBLIC_SUPABASE_URL;
  const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const token = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!SB || !ANON || !token) return null;
  const u = await fetch(`${SB}/auth/v1/user`, { headers: { apikey: ANON, Authorization: `Bearer ${token}` } });
  if (!u.ok) return null;
  const user = await u.json();
  const p = await fetch(`${SB}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=id,role,active`, {
    headers: { apikey: ANON, Authorization: `Bearer ${token}` },
  });
  if (!p.ok) return null;
  const [profile] = await p.json();
  if (!profile || !profile.active || !["ADMIN", "COLABORADOR"].includes(profile.role)) return null;
  return { user, profile };
}

export function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
}

export function sameOrigin(request) {
  const o = request.headers.get("Origin");
  return !o || o === new URL(request.url).origin;
}

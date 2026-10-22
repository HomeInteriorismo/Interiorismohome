// POST /api/invite — solo ADMIN. Envía invitación por correo y crea el perfil.
// Usa SUPABASE_SERVICE_ROLE_KEY (secreto de Cloudflare; nunca llega al navegador).
import { staffFromRequest, json, sameOrigin } from "../../lib/cf/auth.js";

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ error: "Origen no permitido" }, 403);
  const who = await staffFromRequest(request, env);
  if (!who || who.profile.role !== "ADMIN") return json({ error: "Solo el administrador puede invitar" }, 403);
  const SB = env.NEXT_PUBLIC_SUPABASE_URL, SR = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SR) return json({ error: "Falta configurar SUPABASE_SERVICE_ROLE_KEY" }, 500);

  let b; try { b = await request.json(); } catch { return json({ error: "Datos inválidos" }, 400); }
  const email = String(b.email || "").trim().toLowerCase();
  const name = String(b.name || "").trim().slice(0, 80);
  const role = b.role === "ADMIN" ? "ADMIN" : "COLABORADOR";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160 || !name) return json({ error: "Nombre o correo inválido" }, 400);
  const redirect = new URL("/admin", request.url).toString();

  const H = { apikey: SR, Authorization: `Bearer ${SR}`, "Content-Type": "application/json" };
  const inv = await fetch(`${SB}/auth/v1/invite?redirect_to=${encodeURIComponent(redirect)}`, {
    method: "POST", headers: H, body: JSON.stringify({ email, data: { name } }),
  });
  const ij = await inv.json().catch(() => ({}));
  if (!inv.ok) {
    const m = ij.msg || ij.error_description || ij.message || "";
    if (/already|registered|exists/i.test(m)) return json({ error: "Ese correo ya tiene cuenta" }, 409);
    if (/rate/i.test(m)) return json({ error: "Límite de correos alcanzado; intenta en una hora" }, 429);
    return json({ error: "Supabase no pudo enviar la invitación" }, 502);
  }
  const uid = ij.id || ij.user?.id;
  const up = await fetch(`${SB}/rest/v1/profiles?on_conflict=id`, {
    method: "POST", headers: { ...H, Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ id: uid, name, email, role, active: true }),
  });
  if (!up.ok) return json({ error: "Invitación enviada, pero no se pudo crear el perfil" }, 502);
  return json({ ok: true });
}

// POST /api/publish — reconstruye el sitio (deploy hook de Cloudflare Pages).
import { staffFromRequest, json, sameOrigin } from "../../lib/cf/auth.js";

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ error: "Origen no permitido" }, 403);
  const who = await staffFromRequest(request, env);
  if (!who) return json({ error: "Sesión inválida o sin permiso" }, 401);
  if (!env.DEPLOY_HOOK_URL) return json({ error: "Falta configurar DEPLOY_HOOK_URL" }, 500);
  const r = await fetch(env.DEPLOY_HOOK_URL, { method: "POST" });
  if (!r.ok) return json({ error: `Cloudflare respondió ${r.status}` }, 502);
  return json({ ok: true });
}

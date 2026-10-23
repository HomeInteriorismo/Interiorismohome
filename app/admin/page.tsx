"use client";

/* ============================================================
   Panel de administración — Home Interiorismo
   - Sitio estático: toda la seguridad real la ponen las políticas (RLS) de
     Supabase; esta página solo es la interfaz.
   - Los cambios se guardan en Supabase y llegan al sitio público al dar
     "Publicar cambios" (reconstruye el sitio en Cloudflare en 1–2 min).
   ============================================================ */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LogOut, Package, MessageCircle, Users, Upload, Trash2, ChevronUp, ChevronDown, Star,
  Eye, EyeOff, ArrowLeft, Rocket, Check, Loader2, Plus, X,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin-client";

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const ADMIN_API = "/api"; // Cloudflare Pages Functions (carpeta functions/)
const BUCKET = "catalogo";

const K = {
  bg: "#F6F3EC", panel: "#FFFFFF", ink: "#221D17", sub: "#786E5E", line: "#E7E0D0",
  accent: "#BE7A4E", accentDark: "#8A5A3C", green: "#3F6B4A", red: "#A6432F", amber: "#AD7C2C",
};
const UNITS = [
  { v: "m2", l: "por m²" }, { v: "ml", l: "por metro lineal" }, { v: "pieza", l: "por pieza" }, { v: "cotizar", l: "A cotizar (sin precio)" },
];
const LEAD_STATUS = ["Nuevo", "Contactado", "Cotización enviada", "Seguimiento", "Ganado", "Perdido"];

/* Foto guardada como "/img/x.jpg" (incluida en el sitio) o "producto/archivo.jpg" (Supabase Storage) */
function photoUrl(path: string) {
  if (!path) return "";
  if (path.startsWith("/") || path.startsWith("http")) return path;
  return `${SB_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

/* Reduce la foto en el navegador antes de subirla (las del celular pesan 4–8 MB) */
async function shrinkImage(file: File, max = 1600, quality = 0.85): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((ok, bad) => { const i = new Image(); i.onload = () => ok(i); i.onerror = bad; i.src = url; });
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * scale); c.height = Math.round(img.naturalHeight * scale);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return await new Promise<Blob>((ok, bad) => c.toBlob((b) => (b ? ok(b) : bad(new Error("No se pudo procesar la imagen"))), "image/jpeg", quality));
  } finally { URL.revokeObjectURL(url); }
}

/* Link de WhatsApp: acepta "755 123 4567", "+52 755…" o "521755…" sin duplicar el 52 */
function waLink(raw: string) {
  let d = String(raw || "").replace(/\D/g, "");
  if (d.length === 10) d = "52" + d;
  else if (d.length === 13 && d.startsWith("521")) d = "52" + d.slice(3);
  return `https://wa.me/${d}`;
}

function cx(...a: any[]) { return a.filter(Boolean).join(" "); }

/* ---------------- UI básica ---------------- */
function Btn({ children, onClick, kind = "ghost", disabled, type = "button", className = "", title }: any) {
  const styles: any = {
    primary: { background: K.accent, color: "#fff", border: `1px solid ${K.accent}` },
    dark: { background: K.ink, color: "#fff", border: `1px solid ${K.ink}` },
    ghost: { background: "#fff", color: K.ink, border: `1px solid ${K.line}` },
    danger: { background: "#fff", color: K.red, border: `1px solid #E9C9C0` },
  };
  return (
    <button type={type} title={title} onClick={onClick} disabled={disabled}
      className={cx("inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-50", className)}
      style={styles[kind]}>
      {children}
    </button>
  );
}
function Field({ label, hint, children }: any) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold mb-1.5" style={{ color: K.sub }}>{label}</span>
      {children}
      {hint && <span className="block text-[11px] mt-1" style={{ color: K.sub }}>{hint}</span>}
    </label>
  );
}
const inputCls = "w-full rounded-lg px-3 py-2.5 text-sm bg-white outline-none focus:ring-2";
const inputSty = { border: `1px solid ${K.line}`, color: K.ink } as any;

function Toast({ msg, onDone }: any) {
  useEffect(() => { if (!msg) return; const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, [msg, onDone]);
  if (!msg) return null;
  const err = msg.startsWith("Error");
  return (
    <div role="status" className="fixed left-1/2 -translate-x-1/2 z-50 rounded-2xl px-5 py-3 text-sm shadow-lg text-center w-max max-w-[calc(100vw-2rem)]"
      style={{ background: err ? K.red : K.ink, color: "#fff", bottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))" }}>{msg}</div>
  );
}

/* ============================================================ */
export default function AdminPage() {
  const supabase = useMemo(() => createAdminClient(), []);
  const [session, setSession] = useState<any>(undefined);
  const [profile, setProfile] = useState<any>(null);
  const [needPassword, setNeedPassword] = useState(false);
  const [toast, setToast] = useState("");
  const say = useCallback((m: string) => setToast(m), []);

  useEffect(() => {
    // Enlaces de invitación / recuperación traen "type=invite|recovery" en la URL
    const h = typeof window !== "undefined" ? window.location.hash + window.location.search : "";
    if (/type=(invite|recovery)/.test(h)) setNeedPassword(true);
    supabase.auth.getSession().then(({ data }) => setSession(data.session || null));
    const { data: sub } = supabase.auth.onAuthStateChange((ev, s) => {
      if (ev === "PASSWORD_RECOVERY") setNeedPassword(true);
      setSession(s || null);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!session) { setProfile(null); return; }
    supabase.from("profiles").select("id,name,email,role,active").eq("id", session.user.id).maybeSingle()
      .then(({ data }) => setProfile(data || { missing: true }));
  }, [session, supabase]);

  const logout = async () => { await supabase.auth.signOut(); setSession(null); };

  let body: any;
  if (session === undefined) body = <Centered><Loader2 className="animate-spin" /></Centered>;
  else if (!session) body = <Login supabase={supabase} say={say} />;
  else if (needPassword) body = <SetPassword supabase={supabase} say={say} onDone={() => { setNeedPassword(false); history.replaceState(null, "", "/admin"); }} />;
  else if (!profile) body = <Centered><Loader2 className="animate-spin" /></Centered>;
  else if (profile.missing || !profile.active || !["ADMIN", "COLABORADOR"].includes(profile.role))
    body = <Centered><div className="text-center max-w-sm"><p className="font-semibold mb-2">Tu cuenta no tiene acceso al panel.</p><p className="text-sm mb-5" style={{ color: K.sub }}>Pídele al administrador que active tu usuario.</p><Btn onClick={logout}><LogOut size={15} /> Salir</Btn></div></Centered>;
  else body = <Dashboard supabase={supabase} session={session} profile={profile} say={say} onLogout={logout} />;

  return (
    <div style={{ background: K.bg, color: K.ink, minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
      {body}
      <Toast msg={toast} onDone={() => setToast("")} />
    </div>
  );
}

function Centered({ children }: any) {
  return <div className="min-h-screen flex items-center justify-center px-5">{children}</div>;
}

/* ---------------- Acceso ---------------- */
function Login({ supabase, say }: any) {
  const [email, setEmail] = useState(""); const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(""); const [mode, setMode] = useState<"login" | "forgot">("login");
  const submit = async (e: any) => {
    e.preventDefault(); setBusy(true); setErr("");
    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin + "/admin" });
      setBusy(false);
      if (error) setErr("No se pudo enviar el correo. Intenta más tarde.");
      else { say("Te enviamos un correo para crear una contraseña nueva"); setMode("login"); }
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pw });
    setBusy(false);
    if (error) setErr(/rate|many/i.test(error.message) ? "Demasiados intentos. Espera unos minutos." : "Correo o contraseña incorrectos.");
  };
  return (
    <Centered>
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl p-8" style={{ background: K.panel, border: `1px solid ${K.line}` }}>
        <p className="text-2xl mb-1" style={{ fontFamily: "'Fraunces', serif" }}>Panel administrativo</p>
        <p className="text-sm mb-7" style={{ color: K.sub }}>Home Interiorismo</p>
        <div className="flex flex-col gap-4">
          <Field label="Correo"><input required type="email" autoComplete="username" autoCapitalize="none" autoCorrect="off" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} style={inputSty} /></Field>
          {mode === "login" && <Field label="Contraseña"><input required type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} className={inputCls} style={inputSty} /></Field>}
          {err && <p className="text-xs" style={{ color: K.red }}>{err}</p>}
          <Btn type="submit" kind="dark" disabled={busy} className="py-3 mt-1">{busy ? <Loader2 size={16} className="animate-spin" /> : mode === "login" ? "Entrar" : "Enviar correo"}</Btn>
          <button type="button" className="text-xs underline" style={{ color: K.sub }} onClick={() => { setMode(mode === "login" ? "forgot" : "login"); setErr(""); }}>
            {mode === "login" ? "Olvidé mi contraseña" : "Volver a entrar"}
          </button>
          <a href="/" className="text-xs text-center" style={{ color: K.sub }}>← Volver al sitio</a>
        </div>
      </form>
    </Centered>
  );
}

function SetPassword({ supabase, say, onDone }: any) {
  const [pw, setPw] = useState(""); const [pw2, setPw2] = useState(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const submit = async (e: any) => {
    e.preventDefault(); setErr("");
    if (pw.length < 10) return setErr("Usa al menos 10 caracteres.");
    if (pw !== pw2) return setErr("Las contraseñas no coinciden.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) setErr("No se pudo guardar. Abre de nuevo el enlace del correo.");
    else { say("Contraseña guardada"); onDone(); }
  };
  return (
    <Centered>
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl p-8" style={{ background: K.panel, border: `1px solid ${K.line}` }}>
        <p className="text-2xl mb-1" style={{ fontFamily: "'Fraunces', serif" }}>Crea tu contraseña</p>
        <p className="text-sm mb-7" style={{ color: K.sub }}>Mínimo 10 caracteres.</p>
        <div className="flex flex-col gap-4">
          <Field label="Contraseña nueva"><input type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} className={inputCls} style={inputSty} /></Field>
          <Field label="Repítela"><input type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} className={inputCls} style={inputSty} /></Field>
          {err && <p className="text-xs" style={{ color: K.red }}>{err}</p>}
          <Btn type="submit" kind="dark" disabled={busy} className="py-3">{busy ? <Loader2 size={16} className="animate-spin" /> : "Guardar"}</Btn>
        </div>
      </form>
    </Centered>
  );
}

/* ---------------- Tablero ---------------- */
function Dashboard({ supabase, session, profile, say, onLogout }: any) {
  const isAdmin = profile.role === "ADMIN";
  const [tab, setTab] = useState<"productos" | "cotizaciones" | "usuarios">("productos");
  const [editing, setEditing] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => { try { setDirty(localStorage.getItem("hi_dirty") === "1"); } catch {} }, []);
  const markDirty = useCallback(() => { setDirty(true); try { localStorage.setItem("hi_dirty", "1"); } catch {} }, []);

  const publish = async () => {
    setPublishing(true);
    try {
      const { data } = await supabase.auth.getSession();
      const res = await fetch(`${ADMIN_API}/publish`, { method: "POST", headers: { Authorization: `Bearer ${data.session?.access_token}` } });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || `(${res.status})`);
      setDirty(false); try { localStorage.removeItem("hi_dirty"); } catch {}
      say("Publicando… el sitio se actualiza en 1–2 minutos");
    } catch (e: any) { say("Error al publicar: " + e.message); }
    setPublishing(false);
  };

  const tabs: any[] = [
    ["productos", "Productos", Package], ["cotizaciones", "Cotizaciones", MessageCircle],
    ...(isAdmin ? [["usuarios", "Usuarios", Users]] : []),
  ];
  return (
    <div>
      <header className="sticky top-0 z-30" style={{ background: K.panel, borderBottom: `1px solid ${K.line}` }}>
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex items-center gap-3 flex-wrap">
          <p className="text-lg mr-2" style={{ fontFamily: "'Fraunces', serif" }}>Home Interiorismo <span className="text-xs align-middle" style={{ color: K.sub }}>· Panel</span></p>
          <nav className="flex gap-1 order-3 md:order-none w-full md:w-auto overflow-x-auto">
            {tabs.map(([id, label, Ico]) => (
              <button key={id} onClick={() => { setTab(id); setEditing(null); }}
                className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-full whitespace-nowrap"
                style={{ background: tab === id ? K.ink : "transparent", color: tab === id ? "#fff" : K.ink }}>
                <Ico size={15} /> {label}
              </button>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Btn kind={dirty ? "primary" : "ghost"} onClick={publish} disabled={publishing} title="Lleva los cambios al sitio público">
              {publishing ? <Loader2 size={15} className="animate-spin" /> : <Rocket size={15} />} Publicar cambios{dirty ? " •" : ""}
            </Btn>
            <Btn onClick={onLogout} title="Salir"><LogOut size={15} /></Btn>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6">
        <p className="text-xs mb-5" style={{ color: K.sub }}>{profile.name} · {isAdmin ? "Administrador" : "Colaborador"}</p>
        {tab === "productos" && !editing && <ProductList supabase={supabase} say={say} onEdit={setEditing} markDirty={markDirty} />}
        {tab === "productos" && editing && <ProductEditor supabase={supabase} id={editing} say={say} onBack={() => setEditing(null)} markDirty={markDirty} />}
        {tab === "cotizaciones" && <Leads supabase={supabase} say={say} />}
        {tab === "usuarios" && isAdmin && <UsersAdmin supabase={supabase} say={say} me={profile} />}
      </main>
    </div>
  );
}

/* ---------------- Productos ---------------- */
function priceText(p: any) {
  if (p.price_unit === "cotizar" || p.price === null || p.price === undefined) return "A cotizar";
  const u = UNITS.find((x) => x.v === p.price_unit)?.l.replace("por ", "/ ") || "";
  return `${p.price_mode === "desde" ? "Desde " : ""}$${Number(p.price).toLocaleString("es-MX")} ${u}`;
}

function ProductList({ supabase, say, onEdit, markDirty }: any) {
  const [items, setItems] = useState<any[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [pending, setPending] = useState(false);
  const load = useCallback(async () => {
    const { data, error } = await supabase.from("products").select("id,name,price,price_unit,price_mode,visible,sort,cover_photo_url").order("sort").order("name");
    if (error) { setItems([]); setPending(/price|sort|visible|42703/.test(error.message + (error as any).code)); return say("Error al cargar productos"); }
    setItems(data);
    const { data: ph } = await supabase.from("product_photos").select("product_id");
    const c: Record<string, number> = {}; (ph || []).forEach((r: any) => { c[r.product_id] = (c[r.product_id] || 0) + 1; }); setCounts(c);
  }, [supabase, say]);
  useEffect(() => { load(); }, [load]);

  const move = async (i: number, d: number) => {
    if (!items) return; const j = i + d; if (j < 0 || j >= items.length) return;
    const a = items[i], b = items[j];
    const r1 = await supabase.from("products").update({ sort: j, updated_at: new Date().toISOString() }).eq("id", a.id);
    const r2 = await supabase.from("products").update({ sort: i, updated_at: new Date().toISOString() }).eq("id", b.id);
    if (r1.error || r2.error) return say("Error al ordenar");
    // normaliza el orden de todos para evitar empates
    const next = [...items]; next[i] = b; next[j] = a; setItems(next); markDirty();
    await Promise.all(next.map((p, k) => p.sort !== k ? supabase.from("products").update({ sort: k }).eq("id", p.id) : null));
  };
  const toggle = async (p: any) => {
    const { error } = await supabase.from("products").update({ visible: !p.visible, updated_at: new Date().toISOString() }).eq("id", p.id);
    if (error) return say("Error al cambiar visibilidad");
    setItems((it) => it!.map((x) => x.id === p.id ? { ...x, visible: !p.visible } : x)); markDirty();
    say(p.visible ? `${p.name} oculto del sitio (al publicar)` : `${p.name} visible en el sitio (al publicar)`);
  };

  if (!items) return <Loader2 className="animate-spin" />;
  if (pending) return (
    <div className="rounded-2xl p-6 max-w-lg" style={{ background: K.panel, border: `1px solid ${K.line}` }}>
      <p className="font-semibold mb-2">El catálogo editable todavía no está activado</p>
      <p className="text-sm" style={{ color: K.sub }}>Falta un paso de configuración en la base de datos. Mientras tanto, el sitio público sigue funcionando igual.</p>
    </div>
  );
  return (
    <div>
      <h1 className="text-2xl mb-1" style={{ fontFamily: "'Fraunces', serif" }}>Productos</h1>
      <p className="text-sm mb-6" style={{ color: K.sub }}>Toca un producto para cambiar su nombre, descripción, precio y fotos. Las flechas cambian el orden en el sitio.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((p, i) => (
          <div key={p.id} className="rounded-2xl overflow-hidden" style={{ background: K.panel, border: `1px solid ${K.line}`, opacity: p.visible ? 1 : 0.6 }}>
            <button onClick={() => onEdit(p.id)} className="block w-full text-left">
              <div className="aspect-[4/3] bg-cover bg-center flex items-center justify-center text-xs" style={{ backgroundImage: p.cover_photo_url ? `url(${photoUrl(p.cover_photo_url)})` : undefined, backgroundColor: K.line, color: K.sub }}>
                {!p.cover_photo_url && "Sin portada: elige una foto con ⭐"}
              </div>
              <div className="p-4">
                <p className="font-semibold [overflow-wrap:anywhere]">{p.name}</p>
                <p className="text-sm" style={{ color: K.accentDark }}>{priceText(p)}</p>
                <p className="text-xs mt-1" style={{ color: K.sub }}>{counts[p.id] || 0} {(counts[p.id] || 0) === 1 ? "foto" : "fotos"}{p.visible ? "" : " · OCULTO"}</p>
              </div>
            </button>
            <div className="flex items-center gap-1 px-3 pb-3">
              <Btn onClick={() => move(i, -1)} disabled={i === 0} title="Subir"><ChevronUp size={15} /></Btn>
              <Btn onClick={() => move(i, 1)} disabled={i === items.length - 1} title="Bajar"><ChevronDown size={15} /></Btn>
              <Btn onClick={() => toggle(p)} className="ml-auto" title={p.visible ? "Ocultar del sitio" : "Mostrar en el sitio"}>
                {p.visible ? <><Eye size={15} /> Visible</> : <><EyeOff size={15} /> Oculto</>}
              </Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductEditor({ supabase, id, say, onBack, markDirty }: any) {
  const [p, setP] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState("");
  const [newModel, setNewModel] = useState("");
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
    if (error || !data) return say("Error al cargar el producto");
    setP(data);
    const r = await supabase.from("product_photos").select("*").eq("product_id", id).order("sort").order("created_at");
    setPhotos(r.data || []);
  }, [supabase, id, say]);
  useEffect(() => { load(); }, [load]);

  const models = useMemo(() => Array.from(new Set(photos.map((f) => f.model).filter(Boolean))) as string[], [photos]);

  const save = async () => {
    if (!p.name.trim()) return say("Error: el nombre no puede ir vacío");
    const price = p.price === "" || p.price === null || p.price === undefined ? null : Number(p.price);
    if (price !== null && (isNaN(price) || price < 0 || price >= 1000000)) return say("Error: el precio debe ser entre $0 y $999,999.99");
    setSaving(true);
    const { error } = await supabase.from("products").update({
      name: p.name.trim(), short: (p.short || "").trim(), description: (p.description || "").trim(),
      price, price_unit: p.price_unit, price_mode: p.price_mode, visible: p.visible, updated_at: new Date().toISOString(),
    }).eq("id", id);
    setSaving(false);
    if (error) return say("Error al guardar: " + error.message);
    markDirty(); say("Guardado. Da \"Publicar cambios\" para verlo en el sitio.");
  };

  const updatePhoto = async (ph: any, patch: any) => {
    setPhotos((list) => list.map((x) => x.id === ph.id ? { ...x, ...patch } : x));
    const { error } = await supabase.from("product_photos").update(patch).eq("id", ph.id);
    if (error) say("Error al guardar la foto"); else markDirty();
  };
  const reorder = async (i: number, d: number) => {
    const j = i + d; if (j < 0 || j >= photos.length) return;
    const next = [...photos]; [next[i], next[j]] = [next[j], next[i]];
    const changed = next.map((x, k) => ({ x, k })).filter(({ x, k }) => x.sort !== k);
    setPhotos(next.map((x, k) => ({ ...x, sort: k })));
    const res = await Promise.all(changed.map(({ x, k }) => supabase.from("product_photos").update({ sort: k }).eq("id", x.id)));
    if (res.some((r: any) => r.error)) return say("Error al ordenar fotos");
    markDirty();
  };
  const setCover = async (ph: any) => {
    const { error } = await supabase.from("products").update({ cover_photo_url: ph.path, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) return say("Error al cambiar portada");
    setP({ ...p, cover_photo_url: ph.path }); markDirty(); say("Portada actualizada");
  };
  const removePhoto = async (ph: any) => {
    const { error } = await supabase.from("product_photos").delete().eq("id", ph.id);
    if (error) return say("Error al borrar la foto");
    if (!ph.path.startsWith("/")) await supabase.storage.from(BUCKET).remove([ph.path]);
    if (p.cover_photo_url === ph.path) {
      const other = photos.find((x) => x.id !== ph.id);
      await supabase.from("products").update({ cover_photo_url: other ? other.path : null }).eq("id", id);
      setP({ ...p, cover_photo_url: other ? other.path : null });
    }
    setPhotos((l) => l.filter((x) => x.id !== ph.id)); setConfirmDel(null); markDirty(); say("Foto borrada");
  };

  const upload = async (files: FileList | null) => {
    if (!files || !files.length) return;
    const model = newModel.trim();
    let base = photos.length; let ok = 0;
    const list = Array.from(files);
    for (let k = 0; k < list.length; k++) {
      const f = list[k];
      if (!/^image\//.test(f.type)) { say(`Error: ${f.name} no es una imagen`); continue; }
      setUploading(`Subiendo ${k + 1} de ${files.length}…`);
      try {
        const blob = await shrinkImage(f);
        const path = `${id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
        const up = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: "image/jpeg", upsert: false });
        if (up.error) throw up.error;
        const ins = await supabase.from("product_photos").insert({ product_id: id, path, model, caption: model, sort: base++ }).select().single();
        if (ins.error) { await supabase.storage.from(BUCKET).remove([path]); throw ins.error; }
        setPhotos((l) => [...l, ins.data]); ok++;
      } catch (e: any) { say("Error al subir " + f.name + ": " + (e.message || "")); }
    }
    setUploading(""); if (fileRef.current) fileRef.current.value = "";
    if (ok) { markDirty(); say(`${ok} foto(s) agregada(s)`); }
  };

  if (!p) return <Loader2 className="animate-spin" />;
  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm mb-4" style={{ color: K.sub }}><ArrowLeft size={15} /> Productos</button>
      <h1 className="text-2xl mb-6" style={{ fontFamily: "'Fraunces', serif" }}>{p.name}</h1>

      <section className="rounded-2xl p-5 md:p-6 mb-6" style={{ background: K.panel, border: `1px solid ${K.line}` }}>
        <div className="grid md:grid-cols-2 gap-5">
          <Field label="Nombre del producto"><input maxLength={80} value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} className={inputCls} style={inputSty} /></Field>
          <Field label="Texto corto (tarjeta del catálogo)" hint={`${(p.short || "").length}/200`}><input maxLength={200} value={p.short || ""} onChange={(e) => setP({ ...p, short: e.target.value })} className={inputCls} style={inputSty} /></Field>
          <div className="md:col-span-2">
            <Field label="Descripción (página del producto)" hint={`${(p.description || "").length}/2000`}>
              <textarea maxLength={2000} rows={5} value={p.description || ""} onChange={(e) => setP({ ...p, description: e.target.value })} className={inputCls} style={inputSty} />
            </Field>
          </div>
          <Field label="Cómo se cobra">
            <select value={p.price_unit} onChange={(e) => setP({ ...p, price_unit: e.target.value })} className={inputCls} style={inputSty}>
              {UNITS.map((u) => <option key={u.v} value={u.v}>{u.l}</option>)}
            </select>
          </Field>
          {p.price_unit !== "cotizar" && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Precio (MXN)"><input type="number" min={0} max={999999.99} step="0.01" inputMode="decimal" value={p.price ?? ""} onChange={(e) => setP({ ...p, price: e.target.value })} className={inputCls} style={inputSty} placeholder="Ej. 850" /></Field>
              <Field label="Se muestra como">
                <select value={p.price_mode} onChange={(e) => setP({ ...p, price_mode: e.target.value })} className={inputCls} style={inputSty}>
                  <option value="desde">"Desde $…"</option><option value="exacto">Precio exacto</option>
                </select>
              </Field>
            </div>
          )}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!p.visible} onChange={(e) => setP({ ...p, visible: e.target.checked })} /> Mostrar este producto en el sitio</label>
        </div>
        <p className="text-sm mt-5 mb-3" style={{ color: K.sub }}>Así se verá el precio: <b style={{ color: K.ink }}>{priceText({ ...p, price: p.price === "" ? null : p.price })}</b></p>
        <Btn kind="dark" onClick={save} disabled={saving}>{saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Guardar textos y precio</Btn>
      </section>

      <section className="rounded-2xl p-5 md:p-6" style={{ background: K.panel, border: `1px solid ${K.line}` }}>
        <h2 className="font-semibold mb-1">Fotos ({photos.length})</h2>
        <p className="text-sm mb-4" style={{ color: K.sub }}>Las fotos con el mismo "modelo" se agrupan en un solo recuadro en el sitio. La ⭐ marca la portada.</p>

        <div className="rounded-xl p-4 mb-5 flex flex-col md:flex-row md:items-end gap-3" style={{ background: K.bg, border: `1px dashed ${K.line}` }}>
          <div className="flex-1">
            <Field label="Modelo de las fotos nuevas" hint="Escribe uno nuevo o elige uno existente">
              <input list="modelos" value={newModel} onChange={(e) => setNewModel(e.target.value)} className={inputCls} style={inputSty} placeholder="Ej. Sheer Elegance" />
              <datalist id="modelos">{models.map((m) => <option key={m} value={m} />)}</datalist>
            </Field>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => upload(e.target.files)} />
          <Btn kind="primary" onClick={() => fileRef.current?.click()} disabled={!!uploading}>
            {uploading ? <><Loader2 size={15} className="animate-spin" /> {uploading}</> : <><Upload size={15} /> Agregar fotos</>}
          </Btn>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((ph, i) => (
            <div key={ph.id} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${p.cover_photo_url === ph.path ? K.accent : K.line}` }}>
              <div className="relative aspect-square bg-cover bg-center" style={{ backgroundImage: `url(${photoUrl(ph.path)})`, backgroundColor: K.line }}>
                {p.cover_photo_url === ph.path && <span className="absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: K.accent, color: "#fff" }}>PORTADA</span>}
              </div>
              <div className="p-2.5 flex flex-col gap-2">
                <input list="modelos" value={ph.model} maxLength={80} placeholder="Modelo"
                  onChange={(e) => setPhotos((l) => l.map((x) => x.id === ph.id ? { ...x, model: e.target.value } : x))}
                  onBlur={(e) => updatePhoto(ph, { model: e.target.value.trim() })}
                  className="w-full rounded-md px-2 py-1.5 text-xs" style={inputSty} />
                <input value={ph.caption} maxLength={160} placeholder="Nombre de la foto"
                  onChange={(e) => setPhotos((l) => l.map((x) => x.id === ph.id ? { ...x, caption: e.target.value } : x))}
                  onBlur={(e) => updatePhoto(ph, { caption: e.target.value.trim() })}
                  className="w-full rounded-md px-2 py-1.5 text-xs" style={inputSty} />
                <div className="flex items-center gap-1">
                  <button title="Antes" onClick={() => reorder(i, -1)} disabled={i === 0} className="p-1.5 rounded-md disabled:opacity-30" style={{ border: `1px solid ${K.line}` }}><ChevronUp size={13} /></button>
                  <button title="Después" onClick={() => reorder(i, 1)} disabled={i === photos.length - 1} className="p-1.5 rounded-md disabled:opacity-30" style={{ border: `1px solid ${K.line}` }}><ChevronDown size={13} /></button>
                  <button title="Usar como portada" onClick={() => setCover(ph)} className="p-1.5 rounded-md" style={{ border: `1px solid ${K.line}`, color: p.cover_photo_url === ph.path ? K.accent : K.ink }}><Star size={13} /></button>
                  {confirmDel === ph.id ? (
                    <span className="ml-auto flex gap-1">
                      <button onClick={() => removePhoto(ph)} className="px-2 py-1 rounded-md text-[11px] font-semibold" style={{ background: K.red, color: "#fff" }}>Borrar</button>
                      <button onClick={() => setConfirmDel(null)} className="p-1.5 rounded-md" style={{ border: `1px solid ${K.line}` }}><X size={13} /></button>
                    </span>
                  ) : (
                    <button title="Borrar foto" onClick={() => setConfirmDel(ph.id)} className="ml-auto p-1.5 rounded-md" style={{ border: `1px solid #E9C9C0`, color: K.red }}><Trash2 size={13} /></button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ---------------- Cotizaciones ---------------- */
function Leads({ supabase, say }: any) {
  const [items, setItems] = useState<any[] | null>(null);
  const [filter, setFilter] = useState("Todas");
  useEffect(() => {
    supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(300)
      .then(({ data, error }: any) => { if (error) say("Error al cargar cotizaciones"); setItems(data || []); });
  }, [supabase, say]);
  const setStatus = async (l: any, status: string) => {
    const { error } = await supabase.from("leads").update({ status }).eq("id", l.id);
    if (error) return say("Error al cambiar estado");
    setItems((it) => it!.map((x) => x.id === l.id ? { ...x, status } : x));
  };
  if (!items) return <Loader2 className="animate-spin" />;
  const shown = filter === "Todas" ? items : items.filter((l) => l.status === filter);
  return (
    <div>
      <h1 className="text-2xl mb-1" style={{ fontFamily: "'Fraunces', serif" }}>Cotizaciones</h1>
      <p className="text-sm mb-5" style={{ color: K.sub }}>Solicitudes que llegan desde el formulario del sitio.</p>
      <div className="flex gap-2 mb-5 overflow-x-auto">
        {["Todas", ...LEAD_STATUS].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className="text-xs px-3 py-1.5 rounded-full whitespace-nowrap"
            style={{ background: filter === s ? K.ink : K.panel, color: filter === s ? "#fff" : K.ink, border: `1px solid ${K.line}` }}>
            {s}{s !== "Todas" ? ` (${items.filter((l) => l.status === s).length})` : ` (${items.length})`}
          </button>
        ))}
      </div>
      {shown.length === 0 && <p className="text-sm" style={{ color: K.sub }}>No hay cotizaciones aquí todavía.</p>}
      <div className="flex flex-col gap-3">
        {shown.map((l) => (
          <div key={l.id} className="rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-3" style={{ background: K.panel, border: `1px solid ${K.line}` }}>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{l.name} <span className="text-xs font-normal" style={{ color: K.sub }}>· {new Date(l.created_at).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}</span></p>
              <p className="text-sm" style={{ color: K.sub }}>{[l.product, l.finish, l.space, l.medidas].filter(Boolean).join(" · ") || "Sin detalles"}</p>
              {l.message && <p className="text-sm mt-1 whitespace-pre-line [overflow-wrap:anywhere]">{l.message}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {l.whatsapp && (
                <a href={waLink(l.whatsapp)} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold whitespace-nowrap shrink-0" style={{ background: K.green, color: "#fff" }}>
                  <MessageCircle size={14} /> {l.whatsapp}
                </a>
              )}
              <select value={l.status} onChange={(e) => setStatus(l, e.target.value)} className="rounded-full px-3 py-2 text-sm" style={inputSty}>
                {LEAD_STATUS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Usuarios (solo administrador) ---------------- */
function UsersAdmin({ supabase, say, me }: any) {
  const [items, setItems] = useState<any[] | null>(null);
  const [form, setForm] = useState({ name: "", email: "", role: "COLABORADOR" });
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => supabase.from("profiles").select("id,name,email,role,active,created_at").order("created_at")
    .then(({ data, error }: any) => { if (error) say("Error al cargar usuarios"); setItems(data || []); }), [supabase, say]);
  useEffect(() => { load(); }, [load]);

  const invite = async (e: any) => {
    e.preventDefault(); setBusy(true);
    try {
      const { data } = await supabase.auth.getSession();
      const res = await fetch(`${ADMIN_API}/invite`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token}` },
        body: JSON.stringify(form),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || `(${res.status})`);
      say(`Invitación enviada a ${form.email}`); setForm({ name: "", email: "", role: "COLABORADOR" }); load();
    } catch (e: any) { say("Error al invitar: " + e.message); }
    setBusy(false);
  };
  const update = async (u: any, patch: any) => {
    if (u.id === me.id) return say("Error: no puedes cambiar tu propia cuenta");
    const { error } = await supabase.from("profiles").update(patch).eq("id", u.id);
    if (error) return say("Error al actualizar");
    setItems((l) => l!.map((x) => x.id === u.id ? { ...x, ...patch } : x)); say("Usuario actualizado");
  };

  if (!items) return <Loader2 className="animate-spin" />;
  return (
    <div>
      <h1 className="text-2xl mb-1" style={{ fontFamily: "'Fraunces', serif" }}>Usuarios</h1>
      <p className="text-sm mb-6" style={{ color: K.sub }}>Los colaboradores pueden editar productos, fotos, precios, cotizaciones y publicar. Solo el administrador maneja usuarios.</p>
      <form onSubmit={invite} className="rounded-2xl p-5 mb-6 grid md:grid-cols-4 gap-3 items-end" style={{ background: K.panel, border: `1px solid ${K.line}` }}>
        <Field label="Nombre"><input required maxLength={80} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} style={inputSty} /></Field>
        <Field label="Correo"><input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} style={inputSty} /></Field>
        <Field label="Rol">
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputCls} style={inputSty}>
            <option value="COLABORADOR">Colaborador</option><option value="ADMIN">Administrador</option>
          </select>
        </Field>
        <Btn type="submit" kind="dark" disabled={busy}>{busy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Invitar por correo</Btn>
      </form>
      <div className="flex flex-col gap-3">
        {items.map((u) => (
          <div key={u.id} className="rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-3" style={{ background: K.panel, border: `1px solid ${K.line}`, opacity: u.active ? 1 : 0.6 }}>
            <div className="flex-1">
              <p className="font-semibold">{u.name} {u.id === me.id && <span className="text-xs font-normal" style={{ color: K.sub }}>(tú)</span>}</p>
              <p className="text-sm [overflow-wrap:anywhere]" style={{ color: K.sub }}>{u.email}</p>
            </div>
            <select value={u.role} disabled={u.id === me.id} onChange={(e) => update(u, { role: e.target.value })} className="rounded-full px-3 py-2 text-sm" style={inputSty}>
              <option value="COLABORADOR">Colaborador</option><option value="ADMIN">Administrador</option>
            </select>
            <Btn kind={u.active ? "danger" : "ghost"} disabled={u.id === me.id} onClick={() => update(u, { active: !u.active })}>
              {u.active ? "Desactivar" : "Activar"}
            </Btn>
          </div>
        ))}
      </div>
    </div>
  );
}

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
  Eye, EyeOff, ArrowLeft, Rocket, Check, Loader2, Plus, X, LayoutDashboard, Menu, Search, CalendarClock, ChevronRight,
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
const STATUS_COLOR: Record<string, string> = {
  Nuevo: "#BE7A4E", Contactado: "#5B6B7A", "Cotización enviada": "#AD7C2C", Seguimiento: "#AD7C2C", Ganado: "#3F6B4A", Perdido: "#9A9184",
};

/* Almacenamiento: plan gratis de Supabase = 1 GB. Se bloquea al 95 % para no topar. */
const STORAGE_LIMIT = 1024 * 1024 * 1024;
const STORAGE_BLOCK = 0.95;
function fmtBytes(b: number) {
  if (b < 1024 * 1024) return `${Math.max(1, Math.round(b / 1024))} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(b < 10 * 1024 * 1024 ? 1 : 0)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
async function storageUsed(supabase: any): Promise<number> {
  const { data, error } = await supabase.rpc("storage_usage");
  if (error) return 0;
  return (data || []).reduce((t: number, r: any) => t + Number(r.bytes || 0), 0);
}
/* ¿Cabe un archivo de este tamaño? */
async function hasRoom(supabase: any, bytes: number) {
  return (await storageUsed(supabase)) + bytes <= STORAGE_LIMIT * STORAGE_BLOCK;
}
/* Limpieza automática (una vez al día): borra fotos subidas que ya no usa ningún producto */
async function autoClean(supabase: any) {
  try {
    const st = await supabase.from("app_state").select("value").eq("key", "last_cleanup").maybeSingle();
    const last = st.data?.value?.at ? new Date(st.data.value.at).getTime() : 0;
    if (Date.now() - last < 24 * 3600 * 1000) return st.data?.value || null;
    const { data } = await supabase.rpc("storage_orphans");
    const names = (data || []).map((r: any) => r.name);
    const bytes = (data || []).reduce((t: number, r: any) => t + Number(r.bytes || 0), 0);
    if (names.length) await supabase.storage.from(BUCKET).remove(names);
    const value = { at: new Date().toISOString(), removed: names.length, bytes };
    await supabase.from("app_state").upsert({ key: "last_cleanup", value, updated_at: value.at });
    return value;
  } catch { return null; }
}
const money = (n: any) => Number(n || 0).toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
const todayStr = () => new Date().toLocaleDateString("en-CA");
function ago(iso: string) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 2) return "hace un momento"; if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60); if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24); return d === 1 ? "ayer" : `hace ${d} días`;
}
function shortDate(d: string) {
  return new Date(d + (d.length === 10 ? "T12:00:00" : "")).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

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

/* ---------------- Tablero (menú lateral) ---------------- */
const SECTIONS: any[] = [
  { id: "inicio", label: "Inicio", Ico: LayoutDashboard },
  { id: "productos", label: "Productos", Ico: Package },
  { id: "cotizaciones", label: "Cotizaciones", Ico: MessageCircle },
  { id: "usuarios", label: "Usuarios", Ico: Users, admin: true },
];

function Dashboard({ supabase, session, profile, say, onLogout }: any) {
  const isAdmin = profile.role === "ADMIN";
  const sections = SECTIONS.filter((x) => !x.admin || isAdmin);
  const initial = typeof window !== "undefined" ? window.location.hash.replace("#", "") : "";
  const [tab, setTabState] = useState<string>(sections.some((x) => x.id === initial) ? initial : "inicio");
  const [editing, setEditing] = useState<string | null>(null);
  const [leadFilter, setLeadFilter] = useState("Todas");
  const [dirty, setDirty] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [used, setUsed] = useState<number | null>(null);

  const refreshStorage = useCallback(() => { storageUsed(supabase).then(setUsed); }, [supabase]);
  useEffect(() => { refreshStorage(); }, [refreshStorage]);
  useEffect(() => { try { setDirty(localStorage.getItem("hi_dirty") === "1"); } catch {} }, []);
  const markDirty = useCallback(() => { setDirty(true); try { localStorage.setItem("hi_dirty", "1"); } catch {} }, []);

  const go = (id: string, opts: any = {}) => {
    setTabState(id); setEditing(opts.edit || null); setDrawer(false);
    if (opts.filter) setLeadFilter(opts.filter);
    try { history.replaceState(null, "", "#" + id); } catch {}
    window.scrollTo(0, 0);
  };

  const publish = async () => {
    setPublishing(true);
    try {
      const { data } = await supabase.auth.getSession();
      const res = await fetch(`${ADMIN_API}/publish`, { method: "POST", headers: { Authorization: `Bearer ${data.session?.access_token}` } });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || `(${res.status})`);
      setDirty(false); try { localStorage.removeItem("hi_dirty"); } catch {}
      const at = new Date().toISOString();
      await supabase.from("app_state").upsert({ key: "last_publish", value: { at, by: profile.name }, updated_at: at });
      say("Publicando… el sitio se actualiza en 1–2 minutos");
    } catch (e: any) { say("Error al publicar: " + e.message); }
    setPublishing(false);
  };

  const current = sections.find((x) => x.id === tab) || sections[0];
  const nav = (
    <nav className="flex flex-col gap-0.5">
      {sections.map(({ id, label, Ico }) => (
        <button key={id} onClick={() => go(id)}
          className="flex items-center gap-3 text-[15px] px-3 py-2.5 rounded-lg text-left"
          style={{ background: tab === id ? K.bg : "transparent", color: tab === id ? K.ink : K.sub, fontWeight: tab === id ? 600 : 500 }}>
          <Ico size={18} strokeWidth={tab === id ? 2.2 : 1.8} /> {label}
        </button>
      ))}
    </nav>
  );
  const publishBtn = (full = false) => (
    <Btn kind={dirty ? "primary" : "ghost"} onClick={publish} disabled={publishing} className={full ? "w-full py-2.5" : ""} title="Lleva los cambios al sitio público">
      {publishing ? <Loader2 size={15} className="animate-spin" /> : <Rocket size={15} />} {full || dirty ? "Publicar cambios" : "Publicar"}
    </Btn>
  );
  const side = (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-5 pb-6">
        <p className="text-[19px] leading-tight" style={{ fontFamily: "'Fraunces', serif" }}>Home Interiorismo</p>
        <p className="text-xs mt-0.5" style={{ color: K.sub }}>Panel de administración</p>
      </div>
      {nav}
      <div className="mt-auto flex flex-col gap-4 pt-6">
        <div className="px-1">{publishBtn(true)}{dirty && <p className="text-[11px] mt-1.5 text-center" style={{ color: K.accentDark }}>Hay cambios sin publicar</p>}</div>
        <StorageBar used={used} compact />
        <div className="flex items-center gap-2 px-3 py-3" style={{ borderTop: `1px solid ${K.line}` }}>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">{profile.name}</p>
            <p className="text-[11px]" style={{ color: K.sub }}>{isAdmin ? "Administrador" : "Colaborador"}</p>
          </div>
          <button onClick={onLogout} title="Salir" className="p-2 rounded-lg" style={{ color: K.sub }}><LogOut size={17} /></button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="md:grid md:grid-cols-[248px_minmax(0,1fr)] min-h-screen">
      <aside className="hidden md:block sticky top-0 h-screen px-3 overflow-y-auto" style={{ background: K.panel, borderRight: `1px solid ${K.line}` }}>{side}</aside>

      {/* Celular: barra superior + menú lateral deslizable */}
      <header className="md:hidden sticky top-0 z-30 flex items-center gap-2 px-3 h-14" style={{ background: K.panel, borderBottom: `1px solid ${K.line}`, paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <button onClick={() => setDrawer(true)} aria-label="Abrir menú" className="p-2 -ml-1 rounded-lg"><Menu size={22} /></button>
        <p className="font-semibold text-[15px] flex-1 truncate">{current.label}</p>
        {publishBtn(false)}
      </header>
      {drawer && (
        <div className="md:hidden fixed inset-0 z-40" onClick={() => setDrawer(false)}>
          <div className="absolute inset-0" style={{ background: "rgba(34,29,23,0.35)" }} />
          <aside className="absolute left-0 top-0 bottom-0 w-[82%] max-w-[300px] px-3 overflow-y-auto" onClick={(e) => e.stopPropagation()}
            style={{ background: K.panel, paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)", overscrollBehavior: "contain" }}>
            {side}
          </aside>
        </div>
      )}

      <main className="min-w-0 px-4 md:px-10 py-6 md:py-9 max-w-5xl w-full">
        {tab === "inicio" && <Home supabase={supabase} profile={profile} used={used} go={go} />}
        {tab === "productos" && !editing && <ProductList supabase={supabase} say={say} onEdit={(id: string) => go("productos", { edit: id })} markDirty={markDirty} />}
        {tab === "productos" && editing && <ProductEditor supabase={supabase} id={editing} say={say} onBack={() => go("productos")} markDirty={markDirty} onStorage={refreshStorage} />}
        {tab === "cotizaciones" && <Leads supabase={supabase} say={say} isAdmin={isAdmin} filter={leadFilter} setFilter={setLeadFilter} />}
        {tab === "usuarios" && isAdmin && <UsersAdmin supabase={supabase} say={say} me={profile} />}
      </main>
    </div>
  );
}

/* Barra de almacenamiento: verde < 75 %, ámbar < 90 %, rojo después */
function StorageBar({ used, compact = false }: any) {
  if (used === null) return null;
  const pct = Math.min(100, (used / STORAGE_LIMIT) * 100);
  const color = pct >= 90 ? K.red : pct >= 75 ? K.amber : K.green;
  const full = used >= STORAGE_LIMIT * STORAGE_BLOCK;
  return (
    <div className={compact ? "px-3" : ""}>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className={compact ? "text-[11px] font-semibold uppercase tracking-wider" : "text-sm font-semibold"} style={{ color: compact ? K.sub : K.ink }}>Almacenamiento</span>
        <span className="text-[11px] tabular-nums" style={{ color: K.sub }}>{fmtBytes(used)} de 1 GB</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: K.line }} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full" style={{ width: `${Math.max(pct, 1.5)}%`, background: color }} />
      </div>
      {!compact && (
        <p className="text-xs mt-2" style={{ color: full ? K.red : K.sub }}>
          {full ? "Espacio lleno: borra fotos o videos que ya no uses para poder subir nuevos."
            : pct >= 75 ? `Queda ${fmtBytes(STORAGE_LIMIT - used)}. Considera borrar fotos que ya no uses.`
            : `Queda ${fmtBytes(STORAGE_LIMIT - used)} libre. Las fotos se reducen solas al subirlas.`}
        </p>
      )}
    </div>
  );
}

/* ---------------- Inicio ---------------- */
function Home({ supabase, profile, used, go }: any) {
  const [d, setD] = useState<any>(null);
  const [clean, setClean] = useState<any>(null);
  useEffect(() => {
    (async () => {
      const month = new Date(); month.setDate(1); month.setHours(0, 0, 0, 0);
      const [leads, prods, pub] = await Promise.all([
        supabase.from("leads").select("id,name,product,status,amount,follow_up,whatsapp,created_at,updated_at").order("created_at", { ascending: false }).limit(500),
        supabase.from("products").select("id,name,price,price_unit,visible").eq("visible", true).order("sort"),
        supabase.from("app_state").select("value").eq("key", "last_publish").maybeSingle(),
      ]);
      const L = leads.data || []; const today = todayStr();
      const open = (l: any) => !["Ganado", "Perdido"].includes(l.status);
      const inMonth = (iso: string) => new Date(iso) >= month;
      setD({
        nuevas: L.filter((l: any) => l.status === "Nuevo").length,
        due: L.filter((l: any) => open(l) && l.follow_up && l.follow_up <= today).sort((a: any, b: any) => a.follow_up.localeCompare(b.follow_up)),
        cotizado: L.filter((l: any) => l.amount && inMonth(l.created_at)).reduce((t: number, l: any) => t + Number(l.amount), 0),
        ganado: L.filter((l: any) => l.status === "Ganado" && l.amount && inMonth(l.updated_at || l.created_at)).reduce((t: number, l: any) => t + Number(l.amount), 0),
        sinPrecio: (prods.data || []).filter((p: any) => p.price_unit !== "cotizar" && (p.price === null || p.price === undefined)),
        pub: pub.data?.value || null,
      });
    })();
    autoClean(supabase).then(setClean);
  }, [supabase]);

  const first = String(profile.name || "").split(" ")[0];
  const fecha = new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
  if (!d) return <Loader2 className="animate-spin" />;
  const Stat = ({ label, value, sub, onClick, tone }: any) => (
    <button onClick={onClick} disabled={!onClick} className="text-left rounded-xl p-4 md:p-5 disabled:cursor-default" style={{ background: K.panel, border: `1px solid ${K.line}` }}>
      <p className="text-xs" style={{ color: K.sub }}>{label}</p>
      <p className="text-2xl md:text-[28px] mt-1 tabular-nums" style={{ fontFamily: "'Fraunces', serif", color: tone || K.ink }}>{value}</p>
      {sub && <p className="text-[11px] mt-1" style={{ color: K.sub }}>{sub}</p>}
    </button>
  );
  return (
    <div>
      <p className="text-sm first-letter:uppercase" style={{ color: K.sub }}>{fecha}</p>
      <h1 className="text-[28px] md:text-[34px] mt-0.5 mb-6" style={{ fontFamily: "'Fraunces', serif" }}>Hola, {first}</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <Stat label="Cotizaciones nuevas" value={d.nuevas} tone={d.nuevas ? K.accent : undefined} sub={d.nuevas ? "Toca para verlas" : "Al día"} onClick={() => go("cotizaciones", { filter: "Nuevo" })} />
        <Stat label="Seguimientos pendientes" value={d.due.length} tone={d.due.length ? K.amber : undefined} sub="Para hoy o atrasados" onClick={d.due.length ? () => go("cotizaciones", { filter: "Por seguir" }) : undefined} />
        <Stat label="Cotizado este mes" value={money(d.cotizado)} />
        <Stat label="Ganado este mes" value={money(d.ganado)} tone={d.ganado ? K.green : undefined} />
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
        <section>
          <h2 className="text-sm font-semibold mb-3">Para dar seguimiento</h2>
          {d.due.length === 0 ? (
            <p className="text-sm rounded-xl px-4 py-5" style={{ background: K.panel, border: `1px solid ${K.line}`, color: K.sub }}>Nada pendiente para hoy.</p>
          ) : (
            <div className="rounded-xl overflow-hidden" style={{ background: K.panel, border: `1px solid ${K.line}` }}>
              {d.due.slice(0, 6).map((l: any, i: number) => (
                <div key={l.id} className="flex items-center gap-3 px-4 py-3" style={{ borderTop: i ? `1px solid ${K.line}` : undefined }}>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{l.name}</p>
                    <p className="text-xs truncate" style={{ color: K.sub }}>{l.product || "Sin producto"} · {l.follow_up < todayStr() ? <span style={{ color: K.red }}>atrasado ({shortDate(l.follow_up)})</span> : "hoy"}</p>
                  </div>
                  {l.whatsapp && <a href={waLink(l.whatsapp)} target="_blank" rel="noopener noreferrer" className="shrink-0 p-2 rounded-lg" style={{ color: K.green }} aria-label={`WhatsApp a ${l.name}`}><MessageCircle size={18} /></a>}
                </div>
              ))}
            </div>
          )}

          {d.sinPrecio.length > 0 && (
            <>
              <h2 className="text-sm font-semibold mt-8 mb-3">Productos sin precio</h2>
              <div className="flex flex-wrap gap-2">
                {d.sinPrecio.map((p: any) => (
                  <button key={p.id} onClick={() => go("productos", { edit: p.id })} className="text-sm px-3 py-1.5 rounded-full inline-flex items-center gap-1" style={{ background: K.panel, border: `1px solid ${K.line}` }}>
                    {p.name} <ChevronRight size={14} style={{ color: K.sub }} />
                  </button>
                ))}
              </div>
              <p className="text-xs mt-2" style={{ color: K.sub }}>Se muestran como "A cotizar" en el sitio hasta que les pongas precio.</p>
            </>
          )}
        </section>

        <aside className="flex flex-col gap-4">
          <div className="rounded-xl p-4" style={{ background: K.panel, border: `1px solid ${K.line}` }}>
            <StorageBar used={used} />
            {clean?.removed > 0 && <p className="text-[11px] mt-2" style={{ color: K.green }}>Limpieza automática: se liberaron {fmtBytes(clean.bytes)} de fotos sin uso.</p>}
          </div>
          <div className="rounded-xl p-4" style={{ background: K.panel, border: `1px solid ${K.line}` }}>
            <p className="text-sm font-semibold">Última publicación</p>
            <p className="text-xs mt-1" style={{ color: K.sub }}>{d.pub ? `${ago(d.pub.at)}${d.pub.by ? ` · ${d.pub.by}` : ""}` : "Aún no se registra ninguna desde el panel."}</p>
          </div>
        </aside>
      </div>
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
      <h1 className="text-[28px] md:text-[32px] mb-1" style={{ fontFamily: "'Fraunces', serif" }}>Productos</h1>
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

function ProductEditor({ supabase, id, say, onBack, markDirty, onStorage }: any) {
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
    setPhotos((l) => l.filter((x) => x.id !== ph.id)); setConfirmDel(null); markDirty(); onStorage?.(); say("Foto borrada");
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
        if (!(await hasRoom(supabase, blob.size))) { say("Error: espacio lleno. Borra fotos que ya no uses para subir nuevas."); break; }
        const path = `${id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
        const up = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: "image/jpeg", upsert: false });
        if (up.error) throw up.error;
        const ins = await supabase.from("product_photos").insert({ product_id: id, path, model, caption: model, sort: base++ }).select().single();
        if (ins.error) { await supabase.storage.from(BUCKET).remove([path]); throw ins.error; }
        setPhotos((l) => [...l, ins.data]); ok++;
      } catch (e: any) { say("Error al subir " + f.name + ": " + (e.message || "")); }
    }
    setUploading(""); if (fileRef.current) fileRef.current.value = "";
    if (ok) { markDirty(); onStorage?.(); say(ok === 1 ? "Foto agregada" : `${ok} fotos agregadas`); }
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
function StatusPill({ status }: any) {
  const c = STATUS_COLOR[status] || K.sub;
  return <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold whitespace-nowrap" style={{ color: c }}><span className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />{status}</span>;
}

function Leads({ supabase, say, isAdmin, filter, setFilter }: any) {
  const [items, setItems] = useState<any[] | null>(null);
  const [products, setProducts] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<any>(null); // cotización abierta (o {} para nueva)
  const load = useCallback(async () => {
    const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(500);
    if (error) say("Error al cargar cotizaciones");
    setItems(data || []);
  }, [supabase, say]);
  useEffect(() => {
    load();
    supabase.from("products").select("name").order("sort").then(({ data }: any) => setProducts((data || []).map((p: any) => p.name)));
  }, [load, supabase]);

  if (!items) return <Loader2 className="animate-spin" />;
  const today = todayStr();
  const isDue = (l: any) => l.follow_up && l.follow_up <= today && !["Ganado", "Perdido"].includes(l.status);
  const filters = ["Todas", "Por seguir", ...LEAD_STATUS];
  const count = (f: string) => f === "Todas" ? items.length : f === "Por seguir" ? items.filter(isDue).length : items.filter((l) => l.status === f).length;
  const term = q.trim().toLowerCase();
  const shown = items
    .filter((l) => filter === "Todas" ? true : filter === "Por seguir" ? isDue(l) : l.status === filter)
    .filter((l) => !term || [l.name, l.whatsapp, l.product, l.notes].some((v) => String(v || "").toLowerCase().includes(term)));

  return (
    <div>
      <div className="flex items-end justify-between gap-3 mb-5">
        <div>
          <h1 className="text-[28px] md:text-[32px]" style={{ fontFamily: "'Fraunces', serif" }}>Cotizaciones</h1>
          <p className="text-sm" style={{ color: K.sub }}>Del sitio y las que capturas a mano.</p>
        </div>
        <Btn kind="dark" onClick={() => setOpen({})}><Plus size={16} /> Nueva</Btn>
      </div>

      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: K.sub }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, teléfono o producto" className={inputCls + " pl-9"} style={inputSty} />
      </div>
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
        {filters.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className="text-xs px-3 py-1.5 rounded-full whitespace-nowrap shrink-0"
            style={{ background: filter === f ? K.ink : K.panel, color: filter === f ? "#fff" : K.ink, border: `1px solid ${filter === f ? K.ink : K.line}` }}>
            {f} <span className="tabular-nums" style={{ opacity: 0.6 }}>{count(f)}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="text-sm rounded-xl px-4 py-6 text-center" style={{ background: K.panel, border: `1px solid ${K.line}`, color: K.sub }}>
          {items.length === 0 ? "Todavía no hay cotizaciones. Las del formulario del sitio aparecen aquí solas." : "No hay cotizaciones con este filtro."}
        </p>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ background: K.panel, border: `1px solid ${K.line}` }}>
          {shown.map((l, i) => (
            <button key={l.id} onClick={() => setOpen(l)} className="w-full text-left flex items-center gap-3 px-4 py-3.5" style={{ borderTop: i ? `1px solid ${K.line}` : undefined }}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-[15px] truncate">{l.name}</p>
                  {l.origen === "Manual" && <span className="text-[10px] px-1.5 py-0.5 rounded shrink-0" style={{ background: K.bg, color: K.sub }}>A mano</span>}
                </div>
                <p className="text-xs truncate mt-0.5" style={{ color: K.sub }}>
                  {[l.product, l.medidas].filter(Boolean).join(" · ") || "Sin detalles"} · {shortDate(l.created_at)}
                </p>
                <div className="flex items-center gap-3 mt-1.5">
                  <StatusPill status={l.status} />
                  {l.amount != null && <span className="text-[11px] tabular-nums" style={{ color: K.ink }}>{money(l.amount)}</span>}
                  {l.follow_up && !["Ganado", "Perdido"].includes(l.status) && (
                    <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: l.follow_up < today ? K.red : l.follow_up === today ? K.amber : K.sub }}>
                      <CalendarClock size={12} /> {l.follow_up === today ? "Hoy" : shortDate(l.follow_up)}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight size={18} className="shrink-0" style={{ color: K.line }} />
            </button>
          ))}
        </div>
      )}

      {open && <LeadSheet supabase={supabase} say={say} lead={open} products={products} isAdmin={isAdmin}
        onClose={() => setOpen(null)}
        onSaved={(row: any, isNew: boolean) => { setItems((it) => isNew ? [row, ...it!] : it!.map((x) => x.id === row.id ? row : x)); setOpen(null); }}
        onDeleted={(id: string) => { setItems((it) => it!.filter((x) => x.id !== id)); setOpen(null); }} />}
    </div>
  );
}

/* Ficha de una cotización (en celular ocupa la pantalla; en computadora, un panel a la derecha) */
function LeadSheet({ supabase, say, lead, products, isAdmin, onClose, onSaved, onDeleted }: any) {
  const isNew = !lead.id;
  const [f, setF] = useState<any>({
    name: lead.name || "", whatsapp: lead.whatsapp || "", product: lead.product || "", space: lead.space || "", medidas: lead.medidas || "",
    message: lead.message || "", status: lead.status || "Nuevo", amount: lead.amount ?? "", follow_up: lead.follow_up || "", notes: lead.notes || "",
  });
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });
  useEffect(() => {
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", esc); };
  }, [onClose]);

  const save = async () => {
    const wa = f.whatsapp.replace(/\D/g, "").replace(/^52(\d{10})$/, "$1");
    if (!f.name.trim()) return say("Error: falta el nombre");
    if (wa && wa.length !== 10) return say("Error: el WhatsApp debe tener 10 dígitos");
    const amount = f.amount === "" ? null : Number(f.amount);
    if (amount !== null && (isNaN(amount) || amount < 0)) return say("Error: monto inválido");
    const row: any = {
      name: f.name.trim().slice(0, 120), whatsapp: wa || null, product: f.product.trim() || null, space: f.space.trim() || null,
      medidas: f.medidas.trim() || null, message: f.message.trim() || null, status: f.status, amount,
      follow_up: f.follow_up || null, notes: f.notes.trim() || null, updated_at: new Date().toISOString(),
    };
    setBusy(true);
    const res = isNew
      ? await supabase.from("leads").insert({ ...row, origen: "Manual" }).select().single()
      : await supabase.from("leads").update(row).eq("id", lead.id).select().single();
    setBusy(false);
    if (res.error) return say("Error al guardar: " + res.error.message);
    say(isNew ? "Cotización agregada" : "Cambios guardados");
    onSaved(res.data, isNew);
  };
  const remove = async () => {
    const { error } = await supabase.from("leads").delete().eq("id", lead.id);
    if (error) return say("Error al borrar");
    say("Cotización borrada"); onDeleted(lead.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={isNew ? "Nueva cotización" : `Cotización de ${lead.name}`}>
      <div className="absolute inset-0 hidden md:block" style={{ background: "rgba(34,29,23,0.3)" }} onClick={onClose} />
      <div className="relative w-full md:max-w-[480px] h-full overflow-y-auto flex flex-col" style={{ background: K.panel, overscrollBehavior: "contain" }}>
        <div className="sticky top-0 z-10 flex items-center gap-2 px-4 h-14" style={{ background: K.panel, borderBottom: `1px solid ${K.line}`, paddingTop: "env(safe-area-inset-top, 0px)" }}>
          <button onClick={onClose} aria-label="Cerrar" className="p-2 -ml-2 rounded-lg"><X size={20} /></button>
          <p className="font-semibold flex-1 truncate">{isNew ? "Nueva cotización" : lead.name}</p>
          <Btn kind="dark" onClick={save} disabled={busy}>{busy ? <Loader2 size={15} className="animate-spin" /> : "Guardar"}</Btn>
        </div>

        <div className="px-4 py-5 flex flex-col gap-4">
          {!isNew && (
            <p className="text-xs" style={{ color: K.sub }}>
              {lead.origen === "Manual" ? "Capturada a mano" : "Llegó del sitio"} · {new Date(lead.created_at).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Estado">
              <select value={f.status} onChange={set("status")} className={inputCls} style={inputSty}>{LEAD_STATUS.map((s) => <option key={s}>{s}</option>)}</select>
            </Field>
            <Field label="Monto cotizado (MXN)">
              <input type="number" min={0} step="1" inputMode="decimal" value={f.amount} onChange={set("amount")} placeholder="Ej. 12500" className={inputCls} style={inputSty} />
            </Field>
          </div>
          <Field label="Volver a contactar el" hint="Aparece en Inicio cuando llegue el día.">
            <input type="date" value={f.follow_up} onChange={set("follow_up")} className={inputCls} style={inputSty} />
          </Field>
          <Field label="Notas internas" hint="Solo las ve tu equipo.">
            <textarea rows={4} maxLength={2000} value={f.notes} onChange={set("notes")} placeholder="Medidas tomadas, color elegido, qué se habló…" className={inputCls} style={inputSty} />
          </Field>

          <div className="h-px my-1" style={{ background: K.line }} />
          <Field label="Nombre del cliente"><input maxLength={120} value={f.name} onChange={set("name")} className={inputCls} style={inputSty} /></Field>
          <Field label="WhatsApp (10 dígitos)">
            <div className="flex gap-2">
              <input type="tel" inputMode="tel" autoComplete="off" value={f.whatsapp} onChange={set("whatsapp")} placeholder="7551234567" className={inputCls} style={inputSty} />
              {f.whatsapp.replace(/\D/g, "").length >= 10 && (
                <a href={waLink(f.whatsapp)} target="_blank" rel="noopener noreferrer" aria-label="Abrir WhatsApp" className="shrink-0 inline-flex items-center justify-center w-11 rounded-lg" style={{ background: K.green, color: "#fff" }}><MessageCircle size={18} /></a>
              )}
            </div>
          </Field>
          <Field label="Producto">
            <input list="lead-products" maxLength={120} value={f.product} onChange={set("product")} className={inputCls} style={inputSty} />
            <datalist id="lead-products">{products.map((p: string) => <option key={p} value={p} />)}</datalist>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Espacio"><input maxLength={120} value={f.space} onChange={set("space")} placeholder="Ej. Terraza" className={inputCls} style={inputSty} /></Field>
            <Field label="Medidas"><input maxLength={120} value={f.medidas} onChange={set("medidas")} placeholder="Ej. 3 × 2.5 m" className={inputCls} style={inputSty} /></Field>
          </div>
          <Field label="Mensaje del cliente"><textarea rows={3} maxLength={1000} value={f.message} onChange={set("message")} className={inputCls} style={inputSty} /></Field>

          {!isNew && isAdmin && (
            <div className="pt-2 pb-6">
              {confirmDel ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm flex-1" style={{ color: K.red }}>¿Borrar esta cotización? No se puede deshacer.</span>
                  <Btn kind="danger" onClick={remove}>Borrar</Btn><Btn onClick={() => setConfirmDel(false)}>No</Btn>
                </div>
              ) : (
                <button onClick={() => setConfirmDel(true)} className="text-sm inline-flex items-center gap-1.5" style={{ color: K.red }}><Trash2 size={15} /> Borrar cotización</button>
              )}
            </div>
          )}
        </div>
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
      <h1 className="text-[28px] md:text-[32px] mb-1" style={{ fontFamily: "'Fraunces', serif" }}>Usuarios</h1>
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

// Descarga el catálogo (productos + fotos) desde Supabase ANTES de compilar el sitio.
// - Las fotos subidas desde el panel (bucket "catalogo") se copian dentro del sitio
//   (public/cms/...), así el sitio publicado NO depende de Supabase para verse.
// - Si Supabase no responde, el build falla a propósito: Cloudflare deja en línea
//   la versión anterior en lugar de publicar un catálogo vacío.
// - Sin variables de entorno (desarrollo local) usa el data/catalog.json existente.
import fs from "node:fs/promises";
import path from "node:path";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const OUT_JSON = path.join(process.cwd(), "data", "catalog.json");
const CMS_DIR = path.join(process.cwd(), "public", "cms");

function fail(msg) {
  console.error("\n[catálogo] ERROR: " + msg + "\n[catálogo] Se detiene la publicación para no subir un catálogo incompleto.\n");
  process.exit(1);
}

class SchemaPending extends Error {}

async function getJson(url) {
  const res = await fetch(url, { headers: { apikey: KEY, Authorization: "Bearer " + KEY } });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    // Columna o tabla inexistente = aún no se corre supabase/001_catalogo.sql
    if (/42703|42P01|PGRST20[45]/.test(body)) throw new SchemaPending(body.slice(0, 160));
    fail(`Supabase respondió ${res.status} en ${url.replace(URL, "")}`);
  }
  return res.json();
}

async function main() {
  if (!URL || !KEY || KEY === "placeholder") {
    console.log("[catálogo] Sin conexión configurada: se usa data/catalog.json tal como está.");
    return;
  }
  const products = await getJson(
    `${URL}/rest/v1/products?select=id,code,name,short,description,cover_photo_url,sort,price,price_unit,price_mode,visible&visible=eq.true&order=sort.asc,name.asc`
  );
  const photos = await getJson(
    `${URL}/rest/v1/product_photos?select=product_id,path,model,caption,sort&order=product_id.asc,sort.asc,created_at.asc`
  );
  if (!Array.isArray(products) || products.length === 0) fail("el catálogo llegó vacío");

  // Copia local de las fotos que viven en Supabase Storage (las de /img/ ya están en el repo)
  const copied = new Map();
  async function localize(p) {
    if (!p || p.startsWith("/")) return p;
    if (copied.has(p)) return copied.get(p);
    const res = await fetch(`${URL}/storage/v1/object/public/catalogo/${encodeURI(p)}`);
    if (!res.ok) fail(`no se pudo descargar la foto ${p} (${res.status})`);
    const dest = path.join(CMS_DIR, p);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, Buffer.from(await res.arrayBuffer()));
    const local = "/cms/" + p;
    copied.set(p, local);
    return local;
  }

  const out = [];
  for (const pr of products) {
    const own = photos.filter((ph) => ph.product_id === pr.id);
    const list = [];
    for (const ph of own) list.push({ path: await localize(ph.path), model: ph.model || "", caption: ph.caption || "", sort: ph.sort });
    out.push({
      id: pr.id, code: pr.code, name: pr.name, short: pr.short || "", description: pr.description || "",
      cover: (await localize(pr.cover_photo_url)) || list[0]?.path || null,
      sort: pr.sort, price: pr.price === null ? null : Number(pr.price),
      price_unit: pr.price_unit, price_mode: pr.price_mode, visible: true, photos: list,
    });
  }
  await fs.writeFile(OUT_JSON, JSON.stringify({ products: out }, null, 1));
  console.log(`[catálogo] ${out.length} productos, ${photos.length} fotos (${copied.size} descargadas de Supabase).`);
}

main().catch((e) => {
  if (e instanceof SchemaPending) {
    console.warn("[catálogo] Supabase aún no tiene el catálogo editable (falta correr supabase/001_catalogo.sql). Se usa data/catalog.json.");
    return;
  }
  fail(e.message);
});

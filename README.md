# Home Interiorismo — sitio web

Sitio: https://interiorismohome.pages.dev · Panel: https://interiorismohome.pages.dev/admin

## Cómo funciona

- **Sitio público** (Next.js 15, exportación estática) alojado en **Cloudflare Pages**. Cada cambio en `main` se publica solo.
- **Catálogo editable**: nombres, descripciones, precios y fotos viven en Supabase (`products`, `product_photos`, bucket `catalogo`).
  Al compilar, `scripts/sync-catalog.mjs` los descarga a `data/catalog.json` y copia las fotos subidas a `public/cms/`,
  así el sitio publicado no depende de Supabase para verse. Si Supabase falla, la compilación se detiene y queda en línea la versión anterior.
- **Panel `/admin`** (dueño y empleados): productos, fotos, precios, cotizaciones, usuarios (solo dueño) y botón **Publicar cambios**.
  Los cambios se guardan al instante en Supabase, pero llegan al sitio público solo al publicar (1–2 min).
- **Funciones** (`functions/api/`): `publish` (reconstruye el sitio) e `invite` (invita empleados). Corren en Cloudflare Pages.
- **Seguridad**: las reglas (RLS) de Supabase son la seguridad real. Un usuario desactivado pierde el acceso de inmediato.
  Encabezados de seguridad en `public/_headers`.

## Variables en Cloudflare Pages (Configuración → Variables y secretos)

| Variable | Tipo | Para qué |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | texto | conexión a Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | texto | llave pública de Supabase |
| `NODE_VERSION` | texto | `22` |
| `DEPLOY_HOOK_URL` | **secreto** | botón "Publicar cambios" (Configuración → Compilaciones → Deploy hooks) |
| `SUPABASE_SERVICE_ROLE_KEY` | **secreto** | solo para invitar empleados. Nunca va en el código ni en el navegador |

## Base de datos

`supabase/001_catalogo.sql` crea el catálogo editable. Ya está aplicado; volver a correrlo no borra lo editado en el panel.

## Mantenimiento

- Supabase gratis se pausa tras 7 días sin uso: lo mantiene despierto el Worker `keepalive-supabase` (Cloudflare) y, de respaldo,
  `.github/workflows/keep-supabase-alive.yml`.
- Desarrollo local: `npm ci` y `npm run dev`. Sin variables de entorno se usa `data/catalog.json` tal como está.

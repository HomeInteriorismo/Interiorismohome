# Home Interiorismo — proyecto real

Este es el arranque real del sitio, conectado a tu Supabase. Ya funcionan:

- **Sitio público** (`/`): catálogo real desde la tabla `products`, cotizador
  que guarda el prospecto en la tabla `leads` y abre WhatsApp.
- **Login real** (`/admin/login`): usa Supabase Auth de verdad (ya no hay
  contraseñas escritas en el código).
- **Dashboard** (`/admin/dashboard`): protegido — si no hay sesión, redirige
  al login. Muestra conteos reales.
- **Productos** (`/admin/productos`): lista real desde Supabase.

## No subas `.env.local`

Ese archivo tiene tus llaves — está en `.gitignore` a propósito. En Vercel,
las variables de entorno se configuran en la página del proyecto, no en un
archivo subido.

## Desplegar en Vercel

1. Sube esta carpeta completa a un repositorio de GitHub.
2. En vercel.com → **Add New → Project** → importa el repo.
3. En **Environment Variables**, agrega:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_WHATSAPP_NUMBER`
4. Deploy.

## Qué falta agregar (siguiente fase)

Las demás secciones del admin (Prospectos con notas, Cotizaciones con
partidas, Clientes, Agenda, Proyectos con tablero, Usuarios) siguen el mismo
patrón que `app/admin/dashboard/page.tsx` y `app/admin/productos/page.tsx`:
una carpeta en `app/admin/<seccion>/page.tsx` que lee (o escribe) su tabla en
Supabase. Se pueden ir agregando una por una sin tocar lo que ya funciona.

El diseño completo (Configurador de acabados, selector de espacio,
antes/después, etc.) vive en `revestimientos-demo.jsx` — es la referencia
visual para ir portando cada sección.

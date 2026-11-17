-- =====================================================================
-- Home Interiorismo — Panel, etapa 1
--  * Cotizaciones: notas internas, monto cotizado, fecha de seguimiento,
--    y el personal puede capturar cotizaciones a mano.
--  * Estado del panel (última publicación, última limpieza).
--  * Almacenamiento: cuánto se usa (barra del panel) y qué fotos quedaron
--    "huérfanas" (subidas pero ya sin producto) para la limpieza automática.
-- Solo AGREGA. Seguro de correr varias veces.
-- =====================================================================
begin;

-- 1) Cotizaciones
alter table public.leads
  add column if not exists notes      text,
  add column if not exists amount     numeric(12,2),
  add column if not exists follow_up  date,
  add column if not exists updated_at timestamptz not null default now();

alter table public.leads drop constraint if exists leads_notes_len;
alter table public.leads add constraint leads_notes_len check (notes is null or char_length(notes) <= 2000);
alter table public.leads drop constraint if exists leads_amount_ok;
alter table public.leads add constraint leads_amount_ok check (amount is null or (amount >= 0 and amount < 100000000));

create index if not exists leads_follow_up_idx on public.leads (follow_up) where follow_up is not null;

drop policy if exists "Staff crea prospectos" on public.leads;
create policy "Staff crea prospectos" on public.leads for insert to authenticated
  with check (public.is_staff());

-- 2) Estado del panel (clave → valor)
create table if not exists public.app_state (
  key        text primary key check (char_length(key) <= 60),
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.app_state enable row level security;
drop policy if exists "Personal lee y guarda estado" on public.app_state;
create policy "Personal lee y guarda estado" on public.app_state for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- 3) Almacenamiento usado por carpeta (solo personal)
create or replace function public.storage_usage()
returns table (bucket text, files bigint, bytes bigint)
language sql stable security definer set search_path to 'public'
as $f$
  select o.bucket_id::text, count(*), coalesce(sum((o.metadata->>'size')::bigint), 0)
  from storage.objects o
  where public.is_staff()
  group by o.bucket_id
$f$;
revoke all on function public.storage_usage() from public;
grant execute on function public.storage_usage() to authenticated;

-- 4) Fotos huérfanas del catálogo: en la carpeta "catalogo" pero sin producto que las use.
--    Solo las de más de 1 hora (para no tocar una subida en curso).
create or replace function public.storage_orphans()
returns table (name text, bytes bigint)
language sql stable security definer set search_path to 'public'
as $f$
  select o.name::text, coalesce((o.metadata->>'size')::bigint, 0)
  from storage.objects o
  where public.is_staff()
    and o.bucket_id = 'catalogo'
    and o.created_at < now() - interval '1 hour'
    and not exists (select 1 from public.product_photos p where p.path = o.name)
    and not exists (select 1 from public.products p where p.cover_photo_url = o.name)
  limit 200
$f$;
revoke all on function public.storage_orphans() from public;
grant execute on function public.storage_orphans() to authenticated;

select
  (select count(*) from information_schema.columns where table_name = 'leads' and column_name in ('notes','amount','follow_up','updated_at')) as columnas_nuevas,
  (select count(*) from public.app_state) as estado,
  (select count(*) from pg_proc where proname in ('storage_usage','storage_orphans')) as funciones;
commit;

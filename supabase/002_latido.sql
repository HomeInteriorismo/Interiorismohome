-- =====================================================================
-- Home Interiorismo — "latido" para que Supabase (plan gratis) no se pause.
-- Supabase pausó el proyecto en nov 2026 aunque recibía lecturas cada 3 días:
-- ahora cada visita del vigilante ESCRIBE en la base (una sola fila que se actualiza).
-- Seguro de correr varias veces.
-- =====================================================================
begin;

create table if not exists public.heartbeat (
  id    int primary key default 1 check (id = 1),   -- siempre una sola fila
  at    timestamptz not null default now(),
  pings bigint not null default 0
);
alter table public.heartbeat enable row level security;   -- nadie la lee ni la edita directo

create or replace function public.ping()
returns timestamptz
language sql
security definer
set search_path to 'public'
as $f$
  insert into public.heartbeat (id, at, pings) values (1, now(), 1)
  on conflict (id) do update set at = now(), pings = public.heartbeat.pings + 1
  returning at;
$f$;

revoke all on function public.ping() from public;
grant execute on function public.ping() to anon, authenticated;

select public.ping() as latido, (select pings from public.heartbeat) as total;
commit;

-- =====================================================================
-- Home Interiorismo — Fase 1: catálogo editable desde el panel
-- Solo AGREGA columnas/tablas/permisos y carga los datos actuales.
-- Se corre una sola vez en Supabase > SQL Editor. Todo va en una transacción:
-- si algo falla, no se aplica nada.
-- =====================================================================
begin;

-- 1) Precio, orden y visibilidad en productos
alter table public.products
  add column if not exists price       numeric(10,2),
  add column if not exists price_unit  text not null default 'm2',
  add column if not exists price_mode  text not null default 'desde',
  add column if not exists sort        integer not null default 0,
  add column if not exists visible     boolean not null default true,
  add column if not exists updated_at  timestamptz not null default now();

alter table public.products
  drop constraint if exists products_price_ok,
  drop constraint if exists products_price_unit_ok,
  drop constraint if exists products_price_mode_ok,
  drop constraint if exists products_text_len;
alter table public.products
  add constraint products_price_ok      check (price is null or (price >= 0 and price < 1000000)),
  add constraint products_price_unit_ok check (price_unit in ('m2','ml','pieza','cotizar')),
  add constraint products_price_mode_ok check (price_mode in ('desde','exacto')),
  add constraint products_text_len      check (char_length(name) <= 80 and char_length(coalesce(short,'')) <= 200 and char_length(coalesce(description,'')) <= 2000);

-- 2) Fotos de cada producto (agrupadas por modelo)
create table if not exists public.product_photos (
  id          uuid primary key default gen_random_uuid(),
  product_id  text not null references public.products(id) on update cascade on delete cascade,
  path        text not null check (char_length(path) <= 300),
  model       text not null default '' check (char_length(model) <= 80),
  caption     text not null default '' check (char_length(caption) <= 160),
  sort        integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists product_photos_product_sort on public.product_photos (product_id, sort);
alter table public.product_photos enable row level security;

-- 3) Permisos: el público solo LEE el catálogo; el personal activo (dueño y empleados) lo edita
-- 3a) Un usuario DESACTIVADO pierde el acceso de inmediato (antes is_staff/is_admin no revisaban "active").
--     Seguro: si no existe un ADMIN activo, se cancela todo para no dejar a nadie fuera.
do $chk$ begin
  if not exists (select 1 from public.profiles where role = 'ADMIN' and active) then
    raise exception 'No hay un ADMIN activo en profiles: no se aplica nada.';
  end if;
end $chk$;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path to 'public' as $f$
  select exists (select 1 from profiles where id = auth.uid() and role = 'ADMIN' and active);
$f$;
create or replace function public.is_staff() returns boolean language sql stable security definer set search_path to 'public' as $f$
  select exists (select 1 from profiles where id = auth.uid() and role in ('ADMIN', 'COLABORADOR') and active);
$f$;
-- 3b) La regla de lectura de perfiles se consultaba a sí misma (error "infinite recursion"); se reemplaza.
drop policy if exists "(auth.uid() = id) OR is_admin()" on public.profiles;
drop policy if exists "Perfil propio o admin" on public.profiles;
create policy "Perfil propio o admin" on public.profiles for select to authenticated
  using (auth.uid() = id or public.is_admin());
-- 3c) Catálogo
drop policy if exists "Catalogo publico de fotos" on public.product_photos;
create policy "Catalogo publico de fotos" on public.product_photos for select using (true);
drop policy if exists "Personal edita fotos" on public.product_photos;
create policy "Personal edita fotos" on public.product_photos for all to authenticated
  using (public.is_staff()) with check (public.is_staff());
drop policy if exists "Personal edita productos" on public.products;
create policy "Personal edita productos" on public.products for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- 4) Almacenamiento de fotos nuevas: lectura pública, escritura solo personal; máx 5 MB, solo imágenes
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('catalogo', 'catalogo', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];
drop policy if exists "Personal sube fotos catalogo" on storage.objects;
create policy "Personal sube fotos catalogo" on storage.objects for insert to authenticated
  with check (bucket_id = 'catalogo' and public.is_staff());
drop policy if exists "Personal edita fotos catalogo" on storage.objects;
create policy "Personal edita fotos catalogo" on storage.objects for update to authenticated
  using (bucket_id = 'catalogo' and public.is_staff());
drop policy if exists "Personal borra fotos catalogo" on storage.objects;
create policy "Personal borra fotos catalogo" on storage.objects for delete to authenticated
  using (bucket_id = 'catalogo' and public.is_staff());

-- 5) Catálogo actual del sitio (10 productos). Los productos viejos de la demo se ocultan, no se borran.
-- Solo corre la PRIMERA vez (si aún no hay fotos cargadas): así, volver a correr este archivo
-- nunca pisa lo que se haya editado desde el panel.
do $seed$
begin
if exists (select 1 from public.product_photos) then
  raise notice 'Catálogo ya cargado: no se toca.';
  return;
end if;
update public.products set visible = false where id not in ('lambrin-wpc', 'panel-pvc', 'marmol-sintetico', 'paneles-decorativos', 'persianas', 'pasto-sintetico', 'palapa-sintetica', 'tapiceria-exterior', 'malla-toldos', 'muro-verde');

insert into public.products (id, code, name, short, description, catalog_group, featured, simple, cover_photo_url, sort, visible, price, price_unit, price_mode)
values ('lambrin-wpc', 'WPC', 'Lambrín WPC', 'Madera técnica de alto desempeño para muros y plafones interiores.', 'Un revestimiento de listones que reproduce la calidez de la madera maciza con la estabilidad de un composite. Ideal para acentos de muro, plafones y proyectos donde el material debe verse — y sentirse — como madera real.', 'revestimientos', true, false, '/img/wpc_tv_listones.jpg', 0, true, null, 'm2', 'desde')
on conflict (id) do update set code = excluded.code, name = excluded.name, short = excluded.short, description = excluded.description,
  catalog_group = excluded.catalog_group, cover_photo_url = excluded.cover_photo_url, sort = excluded.sort, visible = true, updated_at = now();
insert into public.products (id, code, name, short, description, catalog_group, featured, simple, cover_photo_url, sort, visible, price, price_unit, price_mode)
values ('panel-pvc', 'PVC', 'Piso WPC', 'Paneles ligeros con acabado tipo madera, listos para instalación rápida.', 'Paneles de instalación limpia pensados para remodelaciones ágiles. Reproducen vetas de madera clara con un acabado uniforme, ideal para desarrollos residenciales y comerciales con tiempos de entrega ajustados.', 'revestimientos', true, false, '/img/piso_wpc_cover_sala.jpg', 1, true, null, 'm2', 'desde')
on conflict (id) do update set code = excluded.code, name = excluded.name, short = excluded.short, description = excluded.description,
  catalog_group = excluded.catalog_group, cover_photo_url = excluded.cover_photo_url, sort = excluded.sort, visible = true, updated_at = now();
insert into public.products (id, code, name, short, description, catalog_group, featured, simple, cover_photo_url, sort, visible, price, price_unit, price_mode)
values ('marmol-sintetico', 'MS', 'Mármol Sintético', 'La presencia del mármol, sin las limitaciones de la piedra natural.', 'Superficies de gran formato con vetas continuas inspiradas en mármoles clásicos. Pensadas para muros protagonistas: recepciones, baños principales y proyectos donde el material es el punto focal.', 'revestimientos', true, false, '/img/proy_marmol_comedor.jpg', 2, true, null, 'm2', 'desde')
on conflict (id) do update set code = excluded.code, name = excluded.name, short = excluded.short, description = excluded.description,
  catalog_group = excluded.catalog_group, cover_photo_url = excluded.cover_photo_url, sort = excluded.sort, visible = true, updated_at = now();
insert into public.products (id, code, name, short, description, catalog_group, featured, simple, cover_photo_url, sort, visible, price, price_unit, price_mode)
values ('paneles-decorativos', 'PD', 'Paneles Decorativos', 'Lambrín de acabado liso — la calidez de la madera en superficie uniforme.', 'La misma familia de Lambrín, en acabado liso: superficie plana y uniforme, sin relieve. Ideal para quienes buscan la calidez de la madera con una terminación más minimalista y fácil de limpiar.', 'revestimientos', true, false, '/img/paneles_deco_cover.jpg', 3, true, null, 'm2', 'desde')
on conflict (id) do update set code = excluded.code, name = excluded.name, short = excluded.short, description = excluded.description,
  catalog_group = excluded.catalog_group, cover_photo_url = excluded.cover_photo_url, sort = excluded.sort, visible = true, updated_at = now();
insert into public.products (id, code, name, short, description, catalog_group, featured, simple, cover_photo_url, sort, visible, price, price_unit, price_mode)
values ('persianas', 'PER', 'Persianas', 'Persianas enrollables, de madera y doble tejido a la medida.', 'Persianas a la medida para cada espacio: enrollables tipo día y noche, de madera natural y doble tejido (screen), con instalación incluida. Ideales para controlar luz y privacidad sin perder estilo.', 'exterior', true, true, '/img/ph_persiana_screen.jpg', 4, true, null, 'm2', 'desde')
on conflict (id) do update set code = excluded.code, name = excluded.name, short = excluded.short, description = excluded.description,
  catalog_group = excluded.catalog_group, cover_photo_url = excluded.cover_photo_url, sort = excluded.sort, visible = true, updated_at = now();
insert into public.products (id, code, name, short, description, catalog_group, featured, simple, cover_photo_url, sort, visible, price, price_unit, price_mode)
values ('pasto-sintetico', 'PS', 'Pasto Sintético', 'Áreas verdes de bajo mantenimiento para patios, terrazas y jardines.', 'Pasto sintético premium para exteriores e interiores: menos consumo de agua, sin mantenimiento constante y con apariencia natural. Ideal para patios, áreas infantiles y espacios comerciales.', 'exterior', true, true, '/img/pasto_patio_bar.jpg', 5, true, null, 'm2', 'desde')
on conflict (id) do update set code = excluded.code, name = excluded.name, short = excluded.short, description = excluded.description,
  catalog_group = excluded.catalog_group, cover_photo_url = excluded.cover_photo_url, sort = excluded.sort, visible = true, updated_at = now();
insert into public.products (id, code, name, short, description, catalog_group, featured, simple, cover_photo_url, sort, visible, price, price_unit, price_mode)
values ('palapa-sintetica', 'PAL', 'Techos de Palapa', 'Techos de palapa sintética, resistentes al clima costero.', 'Techos de palapa sintética para albercas, terrazas y restaurantes: la apariencia natural de la palapa tradicional, sin el mantenimiento ni el deterioro por humedad y sol.', 'exterior', true, true, '/img/palapa_showroom.jpg', 6, true, null, 'm2', 'desde')
on conflict (id) do update set code = excluded.code, name = excluded.name, short = excluded.short, description = excluded.description,
  catalog_group = excluded.catalog_group, cover_photo_url = excluded.cover_photo_url, sort = excluded.sort, visible = true, updated_at = now();
insert into public.products (id, code, name, short, description, catalog_group, featured, simple, cover_photo_url, sort, visible, price, price_unit, price_mode)
values ('tapiceria-exterior', 'TAP', 'Tapicería de Exterior', 'Cojines y tapices para muebles de exterior, resistentes a la intemperie.', 'Tapicería especializada para muebles de exterior — telas resistentes al sol, la humedad y el uso constante. Renueva salas, camastros y equipales sin cambiar el mueble.', 'exterior', true, true, '/img/ph_tapiceria.jpg', 7, true, null, 'm2', 'desde')
on conflict (id) do update set code = excluded.code, name = excluded.name, short = excluded.short, description = excluded.description,
  catalog_group = excluded.catalog_group, cover_photo_url = excluded.cover_photo_url, sort = excluded.sort, visible = true, updated_at = now();
insert into public.products (id, code, name, short, description, catalog_group, featured, simple, cover_photo_url, sort, visible, price, price_unit, price_mode)
values ('malla-toldos', 'MSO', 'Malla Sombra y Toldos', 'Malla sombra, toldos retráctiles y de caída vertical, a la medida.', 'Soluciones de sombra a la medida en tres formatos: malla sombra tensada para albercas, terrazas y estacionamientos; toldos retráctiles para áreas de sombra variable; y toldos de caída vertical para cerrar y proteger espacios abiertos del sol y la lluvia. Instalación con anclajes resistentes al viento costero.', 'exterior', true, true, '/img/cortina_plisada.jpg', 8, true, null, 'm2', 'desde')
on conflict (id) do update set code = excluded.code, name = excluded.name, short = excluded.short, description = excluded.description,
  catalog_group = excluded.catalog_group, cover_photo_url = excluded.cover_photo_url, sort = excluded.sort, visible = true, updated_at = now();
insert into public.products (id, code, name, short, description, catalog_group, featured, simple, cover_photo_url, sort, visible, price, price_unit, price_mode)
values ('muro-verde', 'MVE', 'Muro Verde', 'Muros verdes artificiales de bajo mantenimiento para interior y exterior.', 'Muros verdes con follaje artificial de alta densidad — dan calidez y textura natural a plafones, muros y áreas de estar sin el mantenimiento de una planta real. Resistentes a sol y humedad.', 'exterior', true, true, '/img/ph_muro_verde_techo_restaurante.jpg', 9, true, null, 'm2', 'desde')
on conflict (id) do update set code = excluded.code, name = excluded.name, short = excluded.short, description = excluded.description,
  catalog_group = excluded.catalog_group, cover_photo_url = excluded.cover_photo_url, sort = excluded.sort, visible = true, updated_at = now();

-- Fotos actuales (se recargan limpias)
delete from public.product_photos where product_id in ('lambrin-wpc', 'panel-pvc', 'marmol-sintetico', 'paneles-decorativos', 'persianas', 'pasto-sintetico', 'palapa-sintetica', 'tapiceria-exterior', 'malla-toldos', 'muro-verde');
insert into public.product_photos (product_id, path, model, caption, sort) values
  ('lambrin-wpc', '/img/wpc_muro_alberca.jpg', 'Muro exterior', 'Muro exterior — junto a alberca', 0),
  ('lambrin-wpc', '/img/wpc_plafon.jpg', 'Plafón exterior', 'Plafón exterior — vigas WPC', 1),
  ('lambrin-wpc', '/img/wpc_tv_listones.jpg', 'Muro TV', 'Muro TV — listones de madera', 2),
  ('lambrin-wpc', '/img/wpc_cabecera_cama.jpg', 'Cabecera de cama', 'Cabecera de cama', 3),
  ('lambrin-wpc', '/img/wpc_muro_marmol_barra.jpg', 'Muro con barra de mármol', 'Muro con barra de mármol', 4),
  ('panel-pvc', '/img/piso_wpc_cover_sala.jpg', 'Sala con piso de madera y muro de listones', 'Sala con piso de madera y muro de listones', 0),
  ('marmol-sintetico', '/img/proy_marmol_oro.jpg', 'Muro con veta dorada y repisas', 'Muro con veta dorada y repisas', 0),
  ('marmol-sintetico', '/img/proy_marmol_negro.jpg', 'Área de espera', 'Área de espera — mármol negro', 1),
  ('marmol-sintetico', '/img/proy_marmol_comedor.jpg', 'Comedor', 'Comedor — mármol con lambrín', 2),
  ('paneles-decorativos', '/img/paneles_deco_cover.jpg', 'Sala con muro de paneles y luz dorada', 'Sala con muro de paneles y luz dorada', 0),
  ('persianas', '/img/persiana_madera_ventana.jpg', 'Madera', 'Madera — ventana con vista al jardín', 0),
  ('persianas', '/img/persiana_pasillo_cristal.jpg', 'Madera', 'Madera — pasillo con balcón', 1),
  ('persianas', '/img/persiana_sala_cojines.jpg', 'Madera', 'Madera — sala con cojines', 2),
  ('persianas', '/img/ph_sheer_elegance.jpg', 'Sheer Elegance', 'Sheer Elegance', 3),
  ('persianas', '/img/sheer_gris_infantil.jpg', 'Sheer Elegance', 'Sheer Elegance — recámara infantil', 4),
  ('persianas', '/img/sheer_azul_pasillo.jpg', 'Sheer Elegance', 'Sheer Elegance — pasillo azul marino', 5),
  ('persianas', '/img/sheer_taupe_esquina.jpg', 'Sheer Elegance', 'Sheer Elegance — instalación', 6),
  ('persianas', '/img/sheer_azul_tragaluz.jpg', 'Sheer Elegance', 'Sheer Elegance — con tragaluz', 7),
  ('persianas', '/img/ph_vertical_pvc.jpg', 'Vertical PVC', 'Vertical PVC', 8),
  ('persianas', '/img/vpvc_real_1.jpg', 'Vertical PVC', 'Vertical PVC — instalación real', 9),
  ('persianas', '/img/vpvc_real_2.jpg', 'Vertical PVC', 'Vertical PVC — instalación real', 10),
  ('persianas', '/img/vpvc_cafe.jpg', 'Vertical PVC', 'Vertical PVC — café', 11),
  ('persianas', '/img/vpvc_hueso.jpg', 'Vertical PVC', 'Vertical PVC — hueso', 12),
  ('persianas', '/img/vpvc_naranja.jpg', 'Vertical PVC', 'Vertical PVC — naranja', 13),
  ('persianas', '/img/ph_persiana_blackout.jpg', 'Blackout', 'Blackout', 14),
  ('persianas', '/img/blackout_cafe_ladrillo.jpg', 'Blackout', 'Blackout — muro de ladrillo', 15),
  ('persianas', '/img/blackout_gris_alberca.jpg', 'Blackout', 'Blackout — vista a la alberca', 16),
  ('persianas', '/img/blackout_gris_lampara.jpg', 'Blackout', 'Blackout — con lámpara colgante', 17),
  ('persianas', '/img/ph_persiana_screen.jpg', 'Screen Malla Solar', 'Screen Malla Solar — terraza con vista al mar', 18),
  ('persianas', '/img/screen_palapa_terraza.jpg', 'Screen Malla Solar', 'Screen Malla Solar — terraza palapa', 19),
  ('persianas', '/img/screen_vista_mar_1.jpg', 'Screen Malla Solar', 'Screen Malla Solar — vista al mar', 20),
  ('persianas', '/img/screen_vista_mar_2.jpg', 'Screen Malla Solar', 'Screen Malla Solar — vista al mar', 21),
  ('persianas', '/img/ph_cortinas_tela.jpg', 'Cortina', 'Cortina — instalación', 22),
  ('persianas', '/img/cortina_sheer_armchairs.jpg', 'Cortina', 'Cortina — ondulada crema', 23),
  ('persianas', '/img/toldo_vela_instalacion.jpg', 'Cortina', 'Cortina — plisada perla', 24),
  ('persianas', '/img/toldo_retractil_alberca.jpg', 'Cortina', 'Cortina — terracota con sheer', 25),
  ('persianas', '/img/persiana_zebra_azul.jpg', 'Sheer Elegance', 'Sheer Elegance — azul', 26),
  ('persianas', '/img/persiana_zebra_negra.jpg', 'Sheer Elegance', 'Sheer Elegance — negra', 27),
  ('persianas', '/img/persiana_zebra_taupe.jpg', 'Sheer Elegance', 'Sheer Elegance — taupe', 28),
  ('persianas', '/img/persiana_sheer_mar.jpg', 'Screen Malla Solar', 'Screen Malla Solar — vista al mar', 29),
  ('persianas', '/img/persiana_screen_ext.jpg', 'Screen Malla Solar', 'Screen Malla Solar — instalación exterior', 30),
  ('pasto-sintetico', '/img/proy_pasto_andador.jpg', 'Andador con iluminación de piso', 'Andador con iluminación de piso', 0),
  ('pasto-sintetico', '/img/proy_pasto_columpio.jpg', 'Área de juegos', 'Área de juegos', 1),
  ('pasto-sintetico', '/img/pasto_patio_ladrillo.jpg', 'Patio con muro de ladrillo', 'Patio con muro de ladrillo', 2),
  ('pasto-sintetico', '/img/pasto_palmeras_piedra.jpg', 'Palmeras con piedra decorativa', 'Palmeras con piedra decorativa', 3),
  ('pasto-sintetico', '/img/pasto_andador_nocturno.jpg', 'Andador nocturno con iluminación', 'Andador nocturno con iluminación', 4),
  ('pasto-sintetico', '/img/pasto_patio_bar.jpg', 'Patio con barra y palapa', 'Patio con barra y palapa', 5),
  ('pasto-sintetico', '/img/pasto_jardin_flores.jpg', 'Jardín con seto de flores', 'Jardín con seto de flores', 6),
  ('palapa-sintetica', '/img/palapa_apex_estructura.jpg', 'Estructura', 'Estructura — vigas radiales', 0),
  ('palapa-sintetica', '/img/palapa_exterior_real.jpg', 'Instalación exterior', 'Instalación exterior', 1),
  ('palapa-sintetica', '/img/palapa_textura_natural.jpg', 'Textura interior', 'Textura interior', 2),
  ('palapa-sintetica', '/img/palapa_showroom.jpg', 'Muestra en showroom', 'Muestra en showroom', 3),
  ('palapa-sintetica', '/img/palapa_material_sintetico.jpg', 'Material', 'Material — palma sintética', 4),
  ('tapiceria-exterior', '/img/ph_tapiceria_mesa_larga.jpg', 'Sillas de comedor', 'Sillas de comedor — cojín turquesa', 0),
  ('tapiceria-exterior', '/img/ph_tapiceria_banca.jpg', 'Banca de obra', 'Banca de obra — tapizado gris oscuro', 1),
  ('tapiceria-exterior', '/img/ph_tapiceria_sofa_gris.jpg', 'Sala tipo banca', 'Sala tipo banca — tapizado taupe', 2),
  ('tapiceria-exterior', '/img/tap_camastros_azules.jpg', 'Camastros', 'Camastros — cojín azul', 3),
  ('tapiceria-exterior', '/img/tap_sala_curva_azul.jpg', 'Sala curva', 'Sala curva — cojín azul', 4),
  ('malla-toldos', '/img/proy_malla_delfinario.jpg', 'Malla', 'Malla — delfinario', 0),
  ('malla-toldos', '/img/cortina_ondulada.jpg', 'Instalación de vela de sombra', 'Instalación de vela de sombra', 1),
  ('malla-toldos', '/img/toldo_vela_restaurante.jpg', 'Vela de sombra', 'Vela de sombra — restaurante', 2),
  ('malla-toldos', '/img/cortina_plisada.jpg', 'Toldo retráctil', 'Toldo retráctil — alberca', 3),
  ('malla-toldos', '/img/toldo_vertical_jardin.jpg', 'Toldo vertical', 'Toldo vertical — jardín', 4),
  ('muro-verde', '/img/proy_muro_verde_local.jpg', 'Fachada de local', 'Fachada de local — muro verde con flor', 0),
  ('muro-verde', '/img/proy_muro_verde_fuente.jpg', 'Patio con fuente y muro verde', 'Patio con fuente y muro verde', 1),
  ('muro-verde', '/img/ph_muro_verde_altar.jpg', 'Nicho decorativo con muro verde', 'Nicho decorativo con muro verde', 2),
  ('muro-verde', '/img/ph_muro_verde_techo_restaurante.jpg', 'Plafón de restaurante con muro verde y lámparas colgantes', 'Plafón de restaurante con muro verde y lámparas colgantes', 3),
  ('muro-verde', '/img/ph_muro_verde_mural_alberca.jpg', 'Alberca con mural y muro verde', 'Alberca con mural y muro verde', 4),
  ('muro-verde', '/img/muro_verde_rubens_restaurante.jpg', 'Restaurante', 'Restaurante — muro verde con letrero de neón', 5);

-- Las descripciones arrancan vacías: el sitio solo muestra lo que el dueño escriba en el panel.
update public.products set description = '' where id in ('lambrin-wpc', 'panel-pvc', 'marmol-sintetico', 'paneles-decorativos', 'persianas', 'pasto-sintetico', 'palapa-sintetica', 'tapiceria-exterior', 'malla-toldos', 'muro-verde');
end
$seed$;
commit;

-- Verificación (solo lectura)
select (select count(*) from public.products where visible) as productos_visibles,
       (select count(*) from public.product_photos) as fotos,
       (select public from storage.buckets where id = 'catalogo') as bucket_publico;

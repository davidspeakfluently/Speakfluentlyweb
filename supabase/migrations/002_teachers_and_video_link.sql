-- Migración: rol de profesor + recursos de video por link.
-- Correr completo en el SQL Editor de Supabase (proyecto ya existente).

-- Permitir el rol 'profesor' en profiles.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('admin', 'profesor', 'estudiante'));

-- Recursos de tipo video pueden apuntar a un link externo (YouTube/Vimeo)
-- en vez de (o además de) un archivo subido a Storage.
alter table public.resources add column if not exists video_url text;

-- is_staff(): admin o profesor — ambos administran estudiantes/recursos;
-- solo is_admin() puede gestionar cuentas de profesores.
create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role in ('admin', 'profesor')
  );
$$;

-- profiles: cada quien lee su propia fila; staff (admin/profesor) lee todas.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_staff());

-- profiles: staff puede actualizar cualquier fila (p.ej. display_name).
drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles
  for update to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- resources: admin o profesor pueden crear/editar/eliminar.
drop policy if exists resources_write_admin on public.resources;
create policy resources_write_admin on public.resources
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

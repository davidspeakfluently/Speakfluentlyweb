-- Migración: Temas y Tipos de recurso pasan de listas fijas en código a
-- tablas editables desde el panel admin.
-- Correr completo en el SQL Editor de Supabase (proyecto ya existente).

-- ============================================================
-- Tablas
-- ============================================================

create table if not exists public.temas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  orden int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.tipos_recurso (
  key text primary key,
  label text not null,
  kind text not null check (kind in ('documento', 'audio', 'video')),
  orden int not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Seed con los valores que ya existen hardcodeados hoy (mismos
-- keys/nombres que usan los recursos actuales, para no romperlos).
-- ============================================================

insert into public.temas (nombre, orden) values
  ('Gramática', 0),
  ('Vocabulario', 1),
  ('Conversación', 2),
  ('Pronunciación', 3),
  ('Business English', 4),
  ('Viajes', 5)
on conflict (nombre) do nothing;

insert into public.tipos_recurso (key, label, kind, orden) values
  ('cartilla', 'CARTILLA', 'documento', 0),
  ('guia', 'GUÍA', 'documento', 1),
  ('vocab', 'VOCABULARIO', 'documento', 2),
  ('ejercicio', 'EJERCICIO', 'documento', 3),
  ('video', 'VIDEO', 'video', 4),
  ('audio', 'NOTA DE VOZ', 'audio', 5)
on conflict (key) do nothing;

-- ============================================================
-- resources.tema / resources.tipo pasan de texto libre / check fijo
-- a referenciar estas tablas.
-- ============================================================

alter table public.resources
  add constraint resources_tema_fkey
  foreign key (tema) references public.temas (nombre)
  on update cascade on delete restrict;

alter table public.resources drop constraint if exists resources_tipo_check;

alter table public.resources
  add constraint resources_tipo_fkey
  foreign key (tipo) references public.tipos_recurso (key)
  on delete restrict;

-- ============================================================
-- RLS: mismo patrón que el resto (lectura para cualquier
-- autenticado, escritura solo staff).
-- ============================================================

alter table public.temas enable row level security;
alter table public.tipos_recurso enable row level security;

drop policy if exists temas_select on public.temas;
create policy temas_select on public.temas
  for select to authenticated using (true);

drop policy if exists temas_write_staff on public.temas;
create policy temas_write_staff on public.temas
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists tipos_recurso_select on public.tipos_recurso;
create policy tipos_recurso_select on public.tipos_recurso
  for select to authenticated using (true);

drop policy if exists tipos_recurso_write_staff on public.tipos_recurso;
create policy tipos_recurso_write_staff on public.tipos_recurso
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

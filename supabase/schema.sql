-- Speakfluently Portal — esquema inicial
-- Pegar y correr completo en el SQL Editor de Supabase (proyecto nuevo).

-- ============================================================
-- Tablas
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text not null,
  role text not null default 'estudiante' check (role in ('admin', 'profesor', 'estudiante')),
  created_at timestamptz not null default now()
);

-- Temas y tipos de recurso: catálogos editables desde /admin/categorias
-- (en vez de listas fijas en el código).
create table if not exists public.temas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  orden int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.tipos_recurso (
  key text primary key,
  label text not null,
  kind text not null check (kind in ('documento', 'audio', 'video', 'juego', 'ejercicio')),
  orden int not null default 0,
  created_at timestamptz not null default now()
);

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
  ('ejercicio', 'EJERCICIO', 'ejercicio', 3),
  ('video', 'VIDEO', 'video', 4),
  ('audio', 'NOTA DE VOZ', 'audio', 5),
  ('sopa_letras', 'SOPA DE LETRAS', 'juego', 6),
  ('ahorcado', 'AHORCADO', 'juego', 7)
on conflict (key) do nothing;

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text not null,
  tipo text not null references public.tipos_recurso (key) on delete restrict,
  tema text not null references public.temas (nombre) on update cascade on delete restrict,
  nivel text not null check (nivel in ('Básico', 'Intermedio', 'Avanzado')),
  autor text not null,
  meta text not null,
  storage_path text,
  video_url text,
  related_resource_id uuid references public.resources (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  resource_id uuid not null references public.resources (id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, resource_id)
);

create index if not exists resources_tema_idx on public.resources (tema);
create index if not exists resources_nivel_idx on public.resources (nivel);
create index if not exists resources_tipo_idx on public.resources (tipo);

-- ============================================================
-- Juegos de vocabulario (sopa de letras, ahorcado)
-- ============================================================

create table if not exists public.game_words (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources (id) on delete cascade,
  en text not null,
  es text not null,
  orden int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.game_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  resource_id uuid not null references public.resources (id) on delete cascade,
  score int not null,
  total int not null,
  completed_at timestamptz not null default now()
);
-- Sin PK compuesta a propósito: cada intento es una fila nueva (historial de
-- juego, no un checkbox de "completado" como progress).

create index if not exists game_words_resource_idx on public.game_words (resource_id);
create index if not exists game_attempts_resource_idx on public.game_attempts (resource_id);
create index if not exists game_attempts_user_idx on public.game_attempts (user_id);

-- ============================================================
-- Ejercicios interactivos (cuadernillos con retroalimentación
-- correcto/incorrecto)
-- ============================================================

create table if not exists public.exercise_items (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources (id) on delete cascade,
  source_exercise_id text not null,
  orden int not null default 0,
  type text not null check (type in (
    'error_hunt', 'multiple_choice', 'odd_one_out', 'sequencing',
    'transformation_chain', 'rewrite_improve', 'dialogue_completion', 'free_writing'
  )),
  title text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  unique (resource_id, source_exercise_id)
);

create table if not exists public.exercise_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  resource_id uuid not null references public.resources (id) on delete cascade,
  score int not null,
  total int not null,
  details jsonb not null default '[]'::jsonb,
  completed_at timestamptz not null default now()
);
-- Igual que game_attempts: sin PK compuesta, cada intento es una fila nueva
-- (los cuadernillos son reintentables).

create index if not exists exercise_items_resource_idx on public.exercise_items (resource_id);
create index if not exists exercise_attempts_resource_idx on public.exercise_attempts (resource_id);
create index if not exists exercise_attempts_user_idx on public.exercise_attempts (user_id);

-- ============================================================
-- Alta automática de perfil cuando se crea un auth.users
-- (el admin crea el usuario vía Admin API pasando display_name/role
-- en user_metadata; el estudiante que no trae role explícito queda
-- como 'estudiante' por default).
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'role', 'estudiante')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Helper: is_admin() — SECURITY DEFINER para evitar recursión de RLS
-- al leer el rol dentro de las policies de la propia tabla profiles.
-- ============================================================

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

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

-- ============================================================
-- RLS
-- ============================================================

alter table public.profiles enable row level security;
alter table public.resources enable row level security;
alter table public.progress enable row level security;
alter table public.temas enable row level security;
alter table public.tipos_recurso enable row level security;
alter table public.game_words enable row level security;
alter table public.game_attempts enable row level security;
alter table public.exercise_items enable row level security;
alter table public.exercise_attempts enable row level security;

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

-- resources: cualquier usuario autenticado puede leer.
drop policy if exists resources_select on public.resources;
create policy resources_select on public.resources
  for select to authenticated
  using (true);

-- resources: admin o profesor pueden crear/editar/eliminar.
drop policy if exists resources_write_admin on public.resources;
create policy resources_write_admin on public.resources
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- temas / tipos_recurso: cualquier autenticado lee, solo staff escribe.
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

-- progress: cada estudiante lee/escribe su propio progreso; staff puede
-- leer el de cualquier estudiante (para /admin/progreso), pero solo
-- escribir el propio.
drop policy if exists progress_own on public.progress;
create policy progress_own on public.progress
  for all to authenticated
  using (user_id = auth.uid() or public.is_staff())
  with check (user_id = auth.uid());

-- game_words: cualquier autenticado lee, solo staff escribe.
drop policy if exists game_words_select on public.game_words;
create policy game_words_select on public.game_words
  for select to authenticated using (true);

drop policy if exists game_words_write_staff on public.game_words;
create policy game_words_write_staff on public.game_words
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- game_attempts: cada estudiante inserta/lee lo propio; staff lee todo.
drop policy if exists game_attempts_insert_own on public.game_attempts;
create policy game_attempts_insert_own on public.game_attempts
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists game_attempts_select on public.game_attempts;
create policy game_attempts_select on public.game_attempts
  for select to authenticated
  using (user_id = auth.uid() or public.is_staff());

-- exercise_items: cualquier autenticado lee, solo staff escribe.
drop policy if exists exercise_items_select on public.exercise_items;
create policy exercise_items_select on public.exercise_items
  for select to authenticated using (true);

drop policy if exists exercise_items_write_staff on public.exercise_items;
create policy exercise_items_write_staff on public.exercise_items
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- exercise_attempts: cada estudiante inserta/lee lo propio; staff lee todo.
drop policy if exists exercise_attempts_insert_own on public.exercise_attempts;
create policy exercise_attempts_insert_own on public.exercise_attempts
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists exercise_attempts_select on public.exercise_attempts;
create policy exercise_attempts_select on public.exercise_attempts
  for select to authenticated
  using (user_id = auth.uid() or public.is_staff());

-- ============================================================
-- Storage: bucket privado para archivos de recursos.
-- Sin policies de storage.objects a propósito: todo acceso
-- (subida, descarga, URLs firmadas) pasa por server actions que
-- usan la service role key, nunca directo desde el navegador.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('recursos', 'recursos', false)
on conflict (id) do nothing;

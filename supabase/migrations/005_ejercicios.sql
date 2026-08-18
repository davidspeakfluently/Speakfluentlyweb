-- Migración: Ejercicios interactivos (cuadernillos con retroalimentación
-- correcto/incorrecto). Correr completo en el SQL Editor de Supabase
-- (proyecto ya existente).

-- ============================================================
-- Tablas
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
-- resources: columna nueva para vincular un cuadernillo con su cartilla
-- relacionada (opcional, resuelta por el script de ingesta).
-- ============================================================

alter table public.resources
  add column if not exists related_resource_id uuid references public.resources (id) on delete set null;

-- ============================================================
-- tipos_recurso.kind gana el valor 'ejercicio'; se reutiliza la fila
-- existente 'ejercicio' (hoy kind='documento', sin recursos usándola).
-- ============================================================

alter table public.tipos_recurso drop constraint if exists tipos_recurso_kind_check;
alter table public.tipos_recurso
  add constraint tipos_recurso_kind_check
  check (kind in ('documento', 'audio', 'video', 'juego', 'ejercicio'));

update public.tipos_recurso set kind = 'ejercicio' where key = 'ejercicio';

-- ============================================================
-- RLS
-- ============================================================

alter table public.exercise_items enable row level security;
alter table public.exercise_attempts enable row level security;

drop policy if exists exercise_items_select on public.exercise_items;
create policy exercise_items_select on public.exercise_items
  for select to authenticated using (true);

drop policy if exists exercise_items_write_staff on public.exercise_items;
create policy exercise_items_write_staff on public.exercise_items
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists exercise_attempts_insert_own on public.exercise_attempts;
create policy exercise_attempts_insert_own on public.exercise_attempts
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists exercise_attempts_select on public.exercise_attempts;
create policy exercise_attempts_select on public.exercise_attempts
  for select to authenticated
  using (user_id = auth.uid() or public.is_staff());

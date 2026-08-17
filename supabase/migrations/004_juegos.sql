-- Migración: Juegos de vocabulario (sopa de letras, ahorcado)
-- Correr completo en el SQL Editor de Supabase (proyecto ya existente).

-- ============================================================
-- Tablas
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
-- tipos_recurso.kind gana el valor 'juego'
-- ============================================================

alter table public.tipos_recurso drop constraint if exists tipos_recurso_kind_check;
alter table public.tipos_recurso
  add constraint tipos_recurso_kind_check
  check (kind in ('documento', 'audio', 'video', 'juego'));

insert into public.tipos_recurso (key, label, kind, orden) values
  ('sopa_letras', 'SOPA DE LETRAS', 'juego', 6),
  ('ahorcado', 'AHORCADO', 'juego', 7)
on conflict (key) do nothing;

-- ============================================================
-- RLS
-- ============================================================

alter table public.game_words enable row level security;
alter table public.game_attempts enable row level security;

drop policy if exists game_words_select on public.game_words;
create policy game_words_select on public.game_words
  for select to authenticated using (true);

drop policy if exists game_words_write_staff on public.game_words;
create policy game_words_write_staff on public.game_words
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists game_attempts_insert_own on public.game_attempts;
create policy game_attempts_insert_own on public.game_attempts
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists game_attempts_select on public.game_attempts;
create policy game_attempts_select on public.game_attempts
  for select to authenticated
  using (user_id = auth.uid() or public.is_staff());

-- ============================================================
-- Fix: el staff ahora puede LEER el progreso de otros estudiantes
-- (antes solo cada estudiante podía ver su propio progreso, ni admin
-- ni profesor podían ver el de nadie más). Solo lectura, la escritura
-- sigue restringida a user_id = auth.uid().
-- ============================================================

drop policy if exists progress_own on public.progress;
create policy progress_own on public.progress
  for all to authenticated
  using (user_id = auth.uid() or public.is_staff())
  with check (user_id = auth.uid());

-- Speakfluently Portal — esquema inicial
-- Pegar y correr completo en el SQL Editor de Supabase (proyecto nuevo).

-- ============================================================
-- Tablas
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text not null,
  role text not null default 'estudiante' check (role in ('admin', 'estudiante')),
  created_at timestamptz not null default now()
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text not null,
  tipo text not null check (tipo in ('cartilla', 'guia', 'vocab', 'ejercicio', 'video', 'audio')),
  tema text not null,
  nivel text not null check (nivel in ('Básico', 'Intermedio', 'Avanzado')),
  autor text not null,
  meta text not null,
  storage_path text,
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

-- ============================================================
-- RLS
-- ============================================================

alter table public.profiles enable row level security;
alter table public.resources enable row level security;
alter table public.progress enable row level security;

-- profiles: cada quien lee su propia fila; admin lee todas.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

-- profiles: admin puede actualizar cualquier fila (p.ej. display_name).
drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- resources: cualquier usuario autenticado puede leer.
drop policy if exists resources_select on public.resources;
create policy resources_select on public.resources
  for select to authenticated
  using (true);

-- resources: solo admin puede crear/editar/eliminar.
drop policy if exists resources_write_admin on public.resources;
create policy resources_write_admin on public.resources
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- progress: cada estudiante solo ve/edita su propio progreso.
drop policy if exists progress_own on public.progress;
create policy progress_own on public.progress
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================
-- Storage: bucket privado para archivos de recursos.
-- Sin policies de storage.objects a propósito: todo acceso
-- (subida, descarga, URLs firmadas) pasa por server actions que
-- usan la service role key, nunca directo desde el navegador.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('recursos', 'recursos', false)
on conflict (id) do nothing;

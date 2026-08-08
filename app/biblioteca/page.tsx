import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { getFilteredResources, getProfile, getTemas, getTiposRecurso } from "@/lib/queries";
import { NIVELES } from "@/lib/types";
import { AppHeader } from "@/components/AppHeader";
import { SearchInput } from "@/components/SearchInput";
import { FilterGroup, type FilterOption } from "@/components/FilterGroup";
import { ResourceCard } from "@/components/ResourceCard";
import { signOut } from "@/lib/actions/auth";

type SP = Record<string, string | undefined>;

export default async function BibliotecaPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [profile, temas, tipos] = await Promise.all([
    user ? getProfile(supabase, user.id) : Promise.resolve(null),
    getTemas(supabase),
    getTiposRecurso(supabase),
  ]);

  const resources = await getFilteredResources(supabase, {
    nivel: sp.nivel,
    tema: sp.tema,
    tipo: sp.tipo,
    q: sp.q,
  });

  const tipoLabelByKey = Object.fromEntries(tipos.map((t) => [t.key, t.label]));

  const nivelOptions: FilterOption[] = [
    { value: "Todos", label: "Todos" },
    ...NIVELES.map((n) => ({ value: n, label: n })),
  ];
  const temaOptions: FilterOption[] = [
    { value: "Todos", label: "Todos" },
    ...temas.map((t) => ({ value: t.nombre, label: t.nombre })),
  ];
  const tipoOptions: FilterOption[] = [
    { value: "Todos", label: "Todos" },
    ...tipos.map((t) => ({ value: t.key, label: t.label })),
  ];

  return (
    <div>
      <AppHeader>
        <SearchInput defaultValue={sp.q ?? ""} />
        <div className="flex items-center gap-4">
          {(profile?.role === "admin" || profile?.role === "profesor") && (
            <Link href="/admin" className="font-mono text-[13px] text-border hover:text-white">
              Admin
            </Link>
          )}
          <div className="font-mono text-[13px] text-border">
            {profile?.display_name ?? "Estudiante"}
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="font-mono text-[13px] text-slate hover:text-border"
            >
              Salir
            </button>
          </form>
        </div>
      </AppHeader>

      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 p-4 sm:p-6 lg:grid-cols-[240px_1fr] lg:gap-10 lg:p-10">
        <div className="flex flex-col gap-5 lg:gap-7">
          <FilterGroup
            label="Nivel"
            options={nivelOptions}
            current={sp.nivel ?? "Todos"}
            paramKey="nivel"
            searchParams={sp}
          />
          <FilterGroup
            label="Tema"
            options={temaOptions}
            current={sp.tema ?? "Todos"}
            paramKey="tema"
            searchParams={sp}
          />
          <FilterGroup
            label="Tipo de recurso"
            options={tipoOptions}
            current={sp.tipo ?? "Todos"}
            paramKey="tipo"
            searchParams={sp}
          />
        </div>

        <div>
          <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-0">
            <div className="text-[20px] font-bold sm:text-[22px]">
              Tu próximo paso en inglés está aquí
            </div>
            <div className="font-mono text-[13px] text-accent">
              {resources.length} recursos
            </div>
          </div>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-[18px]">
            {resources.map((r) => (
              <ResourceCard key={r.id} resource={r} tipoLabel={tipoLabelByKey[r.tipo] ?? r.tipo} />
            ))}
          </div>

          {resources.length === 0 && (
            <div className="py-[60px] text-center text-[15px] text-slate">
              No encontramos recursos con esos filtros. Prueba con otra combinación.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

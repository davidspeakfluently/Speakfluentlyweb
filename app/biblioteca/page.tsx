import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { getFilteredResources, getProfile } from "@/lib/queries";
import { NIVELES, TEMAS, TIPO_LABELS, TIPO_ORDER } from "@/lib/types";
import { AppHeader } from "@/components/AppHeader";
import { SearchInput } from "@/components/SearchInput";
import { FilterGroup } from "@/components/FilterGroup";
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
  const profile = user ? await getProfile(supabase, user.id) : null;

  const resources = await getFilteredResources(supabase, {
    nivel: sp.nivel,
    tema: sp.tema,
    tipo: sp.tipo,
    q: sp.q,
  });

  const tipoOptions = ["Todos", ...TIPO_ORDER.map((t) => TIPO_LABELS[t])];

  return (
    <div>
      <AppHeader>
        <SearchInput defaultValue={sp.q ?? ""} />
        <div className="flex items-center gap-4">
          {profile?.role === "admin" && (
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

      <div className="mx-auto grid max-w-[1400px] grid-cols-[240px_1fr] gap-10 p-10">
        <div className="flex flex-col gap-7">
          <FilterGroup
            label="Nivel"
            options={["Todos", ...NIVELES]}
            current={sp.nivel ?? "Todos"}
            paramKey="nivel"
            searchParams={sp}
          />
          <FilterGroup
            label="Tema"
            options={["Todos", ...TEMAS]}
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
          <div className="mb-5 flex items-baseline justify-between">
            <div className="text-[22px] font-bold">Tu próximo paso en inglés está aquí</div>
            <div className="font-mono text-[13px] text-accent">
              {resources.length} recursos
            </div>
          </div>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-[18px]">
            {resources.map((r) => (
              <ResourceCard key={r.id} resource={r} />
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

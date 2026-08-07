import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getResource } from "@/lib/queries";
import { createServerSupabase } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { ResourceFields } from "@/components/admin/ResourceFields";
import { updateResource } from "@/lib/actions/admin-resources";

export default async function EditarRecursoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createServerSupabase();
  const resource = await getResource(supabase, id);
  if (!resource) notFound();

  const boundUpdate = updateResource.bind(null, id);

  return (
    <div>
      <AppHeader>
        <Link
          href="/admin/recursos"
          className="self-start rounded border border-accent bg-navy-2 px-4 py-[9px] text-[13px] text-bg hover:bg-accent sm:ml-auto sm:self-auto"
        >
          ← Recursos
        </Link>
      </AppHeader>

      <div className="mx-auto max-w-[560px] p-4 sm:p-6 lg:p-10">
        <div className="mb-6 text-[22px] font-bold">Editar recurso</div>

        <form action={boundUpdate} className="flex flex-col gap-[18px]">
          <ResourceFields resource={resource} />

          {error && (
            <div className="text-[13px] text-[#c1121f]">
              Revisa los campos obligatorios e intenta de nuevo.
            </div>
          )}

          <button
            type="submit"
            className="mt-2 rounded bg-accent p-3.5 text-[15px] font-semibold text-white hover:bg-navy"
          >
            Guardar cambios
          </button>
        </form>
      </div>
    </div>
  );
}

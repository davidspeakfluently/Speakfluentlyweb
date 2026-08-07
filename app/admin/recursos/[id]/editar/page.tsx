import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { getResource } from "@/lib/queries";
import { createServerSupabase } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { ResourceForm } from "@/components/admin/ResourceForm";

export default async function EditarRecursoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  const supabase = await createServerSupabase();
  const resource = await getResource(supabase, id);
  if (!resource) notFound();

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
        <ResourceForm resource={resource} />
      </div>
    </div>
  );
}

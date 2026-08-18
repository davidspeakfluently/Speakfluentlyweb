import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  getBestExerciseAttempt,
  getExerciseItems,
  getResource,
  getTiposRecurso,
} from "@/lib/queries";
import { nivelBadgeClassFor } from "@/lib/resource-ui";
import { AppHeader } from "@/components/AppHeader";
import { ExerciseWorkbookRunner } from "@/components/exercises/ExerciseWorkbookRunner";

export default async function EjercicioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const resource = await getResource(supabase, id);
  if (!resource) notFound();

  const [tipos, items, best, related] = await Promise.all([
    getTiposRecurso(supabase),
    getExerciseItems(supabase, id),
    user ? getBestExerciseAttempt(supabase, user.id, id) : Promise.resolve(null),
    resource.related_resource_id ? getResource(supabase, resource.related_resource_id) : Promise.resolve(null),
  ]);

  const tipo = tipos.find((t) => t.key === resource.tipo);
  if (tipo?.kind !== "ejercicio") notFound();
  const tipoLabel = tipo?.label ?? resource.tipo;

  return (
    <div>
      <AppHeader>
        <Link
          href="/biblioteca"
          className="flex items-center gap-1.5 self-start rounded-md border border-accent bg-navy-2 px-4 py-[9px] text-[13px] text-bg transition-colors duration-[var(--transition-hover)] hover:bg-accent sm:ml-auto sm:self-auto"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a la biblioteca
        </Link>
      </AppHeader>

      <div className="mx-auto max-w-[1000px] p-4 sm:p-6 lg:p-10">
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="rounded-sm bg-accent px-2 py-1 font-mono text-[11px] tracking-[0.06em] text-white">
            {tipoLabel}
          </span>
          <span
            className={"rounded-sm px-2 py-1 font-mono text-[11px] " + nivelBadgeClassFor(resource.nivel)}
          >
            {resource.nivel}
          </span>
          <span className="rounded-sm border border-border px-2 py-1 font-mono text-[11px] text-accent">
            {resource.tema}
          </span>
        </div>

        <div className="text-[24px] font-extrabold leading-[1.2] sm:text-[30px]">
          {resource.titulo}
        </div>
        <div className="mt-2.5 max-w-[640px] text-[15px] leading-[1.5] text-accent">
          {resource.descripcion}
        </div>
        <div className="mt-2 text-[13px] text-slate">
          Por {resource.autor} · {resource.meta}
          {best && (
            <span> · Tu mejor puntaje: {best.score}/{best.total}</span>
          )}
          {related && (
            <span>
              {" "}
              · Cartilla relacionada:{" "}
              <Link href={`/recursos/${related.id}`} className="text-accent underline hover:text-navy">
                {related.titulo}
              </Link>
            </span>
          )}
        </div>

        <div className="mt-8">
          {items.length === 0 ? (
            <div className="rounded-lg border border-border bg-white p-8 text-center text-slate">
              Este cuadernillo todavía no tiene ejercicios — vuelve pronto.
            </div>
          ) : (
            <ExerciseWorkbookRunner resourceId={id} items={items} />
          )}
        </div>
      </div>
    </div>
  );
}

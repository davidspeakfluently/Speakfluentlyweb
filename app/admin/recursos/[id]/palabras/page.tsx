import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { getGameWords, getResource, getTiposRecurso } from "@/lib/queries";
import { createServerSupabase } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { GameWordsManager } from "@/components/admin/GameWordsManager";

export default async function PalabrasRecursoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  const supabase = await createServerSupabase();
  const [resource, tipos] = await Promise.all([
    getResource(supabase, id),
    getTiposRecurso(supabase),
  ]);
  if (!resource) notFound();

  const tipo = tipos.find((t) => t.key === resource.tipo);
  if (tipo?.kind !== "juego") redirect("/admin/recursos");

  const words = await getGameWords(supabase, id);

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

      <div className="mx-auto max-w-[720px] p-4 sm:p-6 lg:p-10">
        <div className="mb-1 text-[22px] font-bold">Palabras: {resource.titulo}</div>
        <div className="mb-6 text-sm text-accent">
          Estas palabras alimentan el juego. Escribe la pista en español y la palabra en inglés
          que el estudiante debe encontrar o adivinar.
        </div>
        <GameWordsManager resourceId={id} words={words} />
      </div>
    </div>
  );
}

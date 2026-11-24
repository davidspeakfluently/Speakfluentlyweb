import { notFound } from "next/navigation";
import { getBestExerciseAttempt, getCompletedResourceIds, getExerciseItems, getResource } from "@/lib/queries";
import { toCatalogItem } from "@/lib/portal/catalog";
import { getRelatedItems, getTipoMetas, getViewer } from "@/lib/portal/server";
import { DetailShell, PaperSection, RelatedAside } from "@/components/portal/detail/DetailShell";
import { Worksheet } from "@/components/portal/detail/Stages";
import { RememberItems, ScrollToButton } from "@/components/portal/detail/ClientBits";
import { MiniCard } from "@/components/portal/ResourceCard";
import { ExerciseWorkbookRunner } from "@/components/exercises/ExerciseWorkbookRunner";

export default async function EjercicioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await getViewer();

  const resource = await getResource(supabase, id);
  if (!resource) notFound();

  const [{ metas }, items, best, relatedCartilla, completedIds] = await Promise.all([
    getTipoMetas(),
    getExerciseItems(supabase, id),
    user ? getBestExerciseAttempt(supabase, user.id, id) : Promise.resolve(null),
    resource.related_resource_id ? getResource(supabase, resource.related_resource_id) : Promise.resolve(null),
    user ? getCompletedResourceIds(supabase, user.id) : Promise.resolve(new Set<string>()),
  ]);

  const item = toCatalogItem(resource, metas);
  if (item.kind !== "ejercicio") notFound();

  const theory = relatedCartilla ? toCatalogItem(relatedCartilla, metas) : null;
  const related = await getRelatedItems(resource.tema, resource.nivel, [resource.id, ...(theory ? [theory.id] : [])]);

  const lead = theory ? (
    <div className="sf-aside__block">
      <p className="sf-aside__label">Cartilla relacionada</p>
      <div className="sf-minis">
        <MiniCard item={theory} done={completedIds.has(theory.id)} />
      </div>
    </div>
  ) : null;

  const bestScore = best ? (
    <span className="sf-best">
      Tu mejor puntaje: {best.score}/{best.total}
    </span>
  ) : null;

  return (
    <>
      <RememberItems items={[item, ...(theory ? [theory] : []), ...related]} />
      <DetailShell item={item} ready aside={<RelatedAside items={related} done={completedIds} lead={lead} />}>
        <Worksheet
          item={item}
          ready
          rows={items.length}
          ok={items.length ? "Listo para practicar" : "Todavía no tiene ejercicios"}
          extra={bestScore}
        />
        {items.length > 0 ? (
          <>
            <div className="sf-actions">
              <ScrollToButton targetId="practica" className="sf-btn-amber">
                Practicar ejercicio
              </ScrollToButton>
            </div>
            <PaperSection id="practica" kicker="Cuadernillo" title={item.meta || item.en}>
              <ExerciseWorkbookRunner resourceId={id} items={items} />
            </PaperSection>
          </>
        ) : (
          <PaperSection kicker="Cuadernillo">
            <p className="text-sm text-slate">Este cuadernillo todavía no tiene ejercicios — vuelve pronto.</p>
          </PaperSection>
        )}
      </DetailShell>
    </>
  );
}

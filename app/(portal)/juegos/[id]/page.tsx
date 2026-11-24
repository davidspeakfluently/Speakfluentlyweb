import { notFound } from "next/navigation";
import { getBestGameAttempt, getCompletedResourceIds, getGameWords, getResource } from "@/lib/queries";
import { toCatalogItem } from "@/lib/portal/catalog";
import { getRelatedItems, getTipoMetas, getViewer } from "@/lib/portal/server";
import { DetailShell, PaperSection, RelatedAside } from "@/components/portal/detail/DetailShell";
import { GameHead } from "@/components/portal/detail/Stages";
import { RememberItems } from "@/components/portal/detail/ClientBits";
import { WordSearchGame } from "@/components/games/WordSearchGame";
import { HangmanGame } from "@/components/games/HangmanGame";

export default async function JuegoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await getViewer();

  const resource = await getResource(supabase, id);
  if (!resource) notFound();

  const [{ metas }, words, best, related, completedIds] = await Promise.all([
    getTipoMetas(),
    getGameWords(supabase, id),
    user ? getBestGameAttempt(supabase, user.id, id) : Promise.resolve(null),
    getRelatedItems(resource.tema, resource.nivel, [resource.id]),
    user ? getCompletedResourceIds(supabase, user.id) : Promise.resolve(new Set<string>()),
  ]);

  const item = toCatalogItem(resource, metas);
  const byExtra = best ? (
    <>
      {" · "}
      <b>
        Tu mejor puntaje: {best.score}/{best.total}
      </b>
    </>
  ) : null;

  return (
    <>
      <RememberItems items={[item, ...related]} />
      <DetailShell item={item} ready byExtra={byExtra} aside={<RelatedAside items={related} done={completedIds} />}>
        <GameHead item={item} />
        <PaperSection kicker="Juego">
          {words.length === 0 ? (
            <p className="text-sm text-slate">Este juego todavía no tiene palabras — vuelve pronto.</p>
          ) : resource.tipo === "ahorcado" ? (
            <HangmanGame resourceId={id} words={words} />
          ) : (
            <WordSearchGame resourceId={id} words={words} />
          )}
        </PaperSection>
      </DetailShell>
    </>
  );
}

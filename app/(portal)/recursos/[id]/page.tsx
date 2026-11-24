import { notFound } from "next/navigation";
import { getCompletedResourceIds, getExerciseItems, getResource, isCompleted } from "@/lib/queries";
import { getSignedFileUrl } from "@/lib/storage";
import { getVideoEmbedUrl } from "@/lib/video";
import { ACTION_LABEL_BY_KIND } from "@/lib/types";
import { toCatalogItem } from "@/lib/portal/catalog";
import { getRelatedItems, getTipoMetas, getViewer } from "@/lib/portal/server";
import { DetailShell, PaperSection, RelatedAside } from "@/components/portal/detail/DetailShell";
import { DocumentDesk, VideoStage } from "@/components/portal/detail/Stages";
import { AudioStage } from "@/components/portal/detail/AudioStage";
import { CompleteButton } from "@/components/portal/detail/CompleteButton";
import { RememberItems } from "@/components/portal/detail/ClientBits";
import { ListeningExercises } from "@/components/ListeningExercises";

export default async function ResourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await getViewer();

  const resource = await getResource(supabase, id);
  if (!resource) notFound();

  const [{ metas }, related, completed, fileUrl, completedIds, exerciseItems] = await Promise.all([
    getTipoMetas(),
    getRelatedItems(resource.tema, resource.nivel, [resource.id]),
    user ? isCompleted(supabase, user.id, resource.id) : Promise.resolve(false),
    resource.storage_path ? getSignedFileUrl(resource.storage_path) : Promise.resolve(null),
    user ? getCompletedResourceIds(supabase, user.id) : Promise.resolve(new Set<string>()),
    getExerciseItems(supabase, resource.id),
  ]);

  const item = toCatalogItem(resource, metas);
  const kind = item.kind;
  const embedUrl = resource.video_url ? getVideoEmbedUrl(resource.video_url) : null;
  const complete = <CompleteButton resourceId={resource.id} completed={completed} />;

  // Botón principal, igual que antes: el video externo, el archivo o el aviso de que falta.
  const cta = resource.video_url ? (
    <a href={resource.video_url} target="_blank" rel="noopener noreferrer" className="sf-btn-amber">
      {ACTION_LABEL_BY_KIND[kind]}
    </a>
  ) : fileUrl ? (
    <a href={fileUrl} target="_blank" rel="noopener noreferrer" download={kind === "documento"} className="sf-btn-amber">
      {ACTION_LABEL_BY_KIND[kind]}
    </a>
  ) : (
    <button type="button" className="sf-btn-amber is-off" disabled>
      Archivo pendiente de carga
    </button>
  );

  let stage: React.ReactNode;
  if (embedUrl || (kind === "video" && fileUrl)) {
    stage = (
      <>
        <VideoStage item={item} embedUrl={embedUrl} src={embedUrl ? null : fileUrl} />
        <div className="sf-actions">
          {cta}
          {complete}
        </div>
      </>
    );
  } else if (kind === "audio") {
    stage = (
      <AudioStage item={item} src={fileUrl}>
        {complete}
      </AudioStage>
    );
  } else {
    stage = (
      <>
        <DocumentDesk item={item} ready ok={fileUrl ? "Listo para descargar" : "Archivo pendiente de carga"} />
        <div className="sf-actions">
          {cta}
          {complete}
        </div>
        {fileUrl && kind === "documento" ? (
          <section className="sf-pdf" aria-label="Vista previa del documento">
            <p className="sf-pdf__k">Vista previa</p>
            <embed src={fileUrl} type="application/pdf" />
          </section>
        ) : null}
      </>
    );
  }

  const hasPractice = !!resource.transcript || exerciseItems.length > 0;

  return (
    <>
      <RememberItems items={[item, ...related]} />
      <DetailShell item={item} ready aside={<RelatedAside items={related} done={completedIds} />}>
        {stage}
        {hasPractice ? (
          <PaperSection kicker="Práctica">
            <ListeningExercises resourceId={resource.id} transcript={resource.transcript} items={exerciseItems} />
          </PaperSection>
        ) : null}
      </DetailShell>
    </>
  );
}

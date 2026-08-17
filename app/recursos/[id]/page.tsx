import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CircleCheck } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  getCompletedResourceIds,
  getRelatedResources,
  getResource,
  getTiposRecurso,
  isCompleted,
} from "@/lib/queries";
import { getSignedFileUrl } from "@/lib/storage";
import { ACTION_LABEL_BY_KIND } from "@/lib/types";
import { nivelBadgeClassFor, previewClassFor, previewIconFor, previewLabelFor } from "@/lib/resource-ui";
import { getVideoEmbedUrl } from "@/lib/video";
import { AppHeader } from "@/components/AppHeader";
import { ResourceCard } from "@/components/ResourceCard";
import { toggleCompleted } from "@/lib/actions/progress";

export default async function ResourceDetailPage({
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

  const [related, completed, fileUrl, tipos, completedIds] = await Promise.all([
    getRelatedResources(supabase, resource.tema, resource.id),
    user ? isCompleted(supabase, user.id, resource.id) : Promise.resolve(false),
    resource.storage_path ? getSignedFileUrl(resource.storage_path) : Promise.resolve(null),
    getTiposRecurso(supabase),
    user ? getCompletedResourceIds(supabase, user.id) : Promise.resolve(new Set<string>()),
  ]);

  const tipoByKey = Object.fromEntries(tipos.map((t) => [t.key, t]));
  const tipo = tipoByKey[resource.tipo];
  const kind = tipo?.kind ?? "documento";
  const tipoLabel = tipo?.label ?? resource.tipo;
  const actionLabel = ACTION_LABEL_BY_KIND[kind];

  const boundToggle = toggleCompleted.bind(null, resource.id);
  const embedUrl = resource.video_url ? getVideoEmbedUrl(resource.video_url) : null;
  const PreviewIcon = previewIconFor(kind);

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

      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-8 p-4 sm:p-6 lg:grid-cols-[1fr_300px] lg:gap-10 lg:p-10">
        <div>
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
          </div>

          <div className="mt-8 overflow-hidden rounded-lg border border-border bg-white">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                className="aspect-video w-full bg-navy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : fileUrl && kind === "video" ? (
              <video controls src={fileUrl} className="aspect-video w-full bg-navy" />
            ) : fileUrl && kind === "audio" ? (
              <div className="flex h-[220px] items-center justify-center bg-navy p-6">
                <audio controls src={fileUrl} className="w-full max-w-md" />
              </div>
            ) : fileUrl ? (
              <embed src={fileUrl} type="application/pdf" className="h-[600px] w-full" />
            ) : (
              <div
                className={`flex h-[220px] items-center justify-center ${previewClassFor(kind)}`}
              >
                <div className="flex items-center gap-2 rounded-md bg-white px-3 py-1.5 font-mono text-[13px] text-accent">
                  <PreviewIcon className="h-4 w-4" />
                  {previewLabelFor(kind)}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3 p-4 sm:p-5">
              {resource.video_url ? (
                <a
                  href={resource.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md bg-amber px-5 py-3 text-sm font-semibold text-navy transition-[background-color,box-shadow] duration-[var(--transition-standard)] ease-[var(--ease-standard)] hover:bg-amber-strong hover:text-white hover:shadow-[var(--glow-amber)]"
                >
                  {actionLabel}
                </a>
              ) : fileUrl ? (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={kind === "documento"}
                  className="rounded-md bg-amber px-5 py-3 text-sm font-semibold text-navy transition-[background-color,box-shadow] duration-[var(--transition-standard)] ease-[var(--ease-standard)] hover:bg-amber-strong hover:text-white hover:shadow-[var(--glow-amber)]"
                >
                  {actionLabel}
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="cursor-not-allowed rounded-md bg-border px-5 py-3 text-sm font-semibold text-white/80"
                >
                  Archivo pendiente de carga
                </button>
              )}

              <form action={boundToggle}>
                <button
                  type="submit"
                  className={
                    "flex items-center gap-2 rounded-md border px-5 py-3 text-sm transition-colors duration-[var(--transition-hover)] " +
                    (completed
                      ? "border-accent bg-accent text-white hover:bg-navy"
                      : "border-border bg-white text-navy hover:border-slate")
                  }
                >
                  {completed && <CircleCheck className="h-4 w-4" />}
                  {completed ? "Completado" : "Marcar como completado"}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-3.5 font-mono text-xs uppercase tracking-[0.06em] text-accent">
            También te puede servir
          </div>
          <div className="flex flex-col gap-3">
            {related.map((r) => (
              <ResourceCard
                key={r.id}
                resource={r}
                tipoLabel={tipoByKey[r.tipo]?.label ?? r.tipo}
                kind={tipoByKey[r.tipo]?.kind}
                completed={completedIds.has(r.id)}
                variant="compact"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getRelatedResources, getResource, isCompleted } from "@/lib/queries";
import { getSignedFileUrl } from "@/lib/storage";
import { ACTION_LABELS, TIPO_LABELS } from "@/lib/types";
import { previewClassFor, previewLabelFor } from "@/lib/resource-ui";
import { getVideoEmbedUrl } from "@/lib/video";
import { AppHeader } from "@/components/AppHeader";
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

  const [related, completed, fileUrl] = await Promise.all([
    getRelatedResources(supabase, resource.tema, resource.id),
    user ? isCompleted(supabase, user.id, resource.id) : Promise.resolve(false),
    resource.storage_path ? getSignedFileUrl(resource.storage_path) : Promise.resolve(null),
  ]);

  const boundToggle = toggleCompleted.bind(null, resource.id);
  const embedUrl = resource.video_url ? getVideoEmbedUrl(resource.video_url) : null;

  return (
    <div>
      <AppHeader>
        <Link
          href="/biblioteca"
          className="self-start rounded border border-accent bg-navy-2 px-4 py-[9px] text-[13px] text-bg hover:bg-accent sm:ml-auto sm:self-auto"
        >
          ← Volver a la biblioteca
        </Link>
      </AppHeader>

      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-8 p-4 sm:p-6 lg:grid-cols-[1fr_300px] lg:gap-10 lg:p-10">
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="rounded-[3px] bg-accent px-2 py-1 font-mono text-[11px] tracking-[0.06em] text-white">
              {TIPO_LABELS[resource.tipo]}
            </span>
            <span className="rounded-[3px] border border-border px-2 py-1 font-mono text-[11px] text-accent">
              {resource.nivel}
            </span>
            <span className="rounded-[3px] border border-border px-2 py-1 font-mono text-[11px] text-accent">
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

          <div className="mt-8 overflow-hidden rounded-md border border-border bg-white">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                className="aspect-video w-full bg-navy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : fileUrl && resource.tipo === "video" ? (
              <video controls src={fileUrl} className="aspect-video w-full bg-navy" />
            ) : fileUrl && resource.tipo === "audio" ? (
              <div className="flex h-[220px] items-center justify-center bg-navy p-6">
                <audio controls src={fileUrl} className="w-full max-w-md" />
              </div>
            ) : fileUrl ? (
              <embed src={fileUrl} type="application/pdf" className="h-[600px] w-full" />
            ) : (
              <div
                className={`flex h-[220px] items-center justify-center ${previewClassFor(
                  resource.tipo,
                )}`}
              >
                <div className="rounded bg-white px-3 py-1.5 font-mono text-[13px] text-accent">
                  {previewLabelFor(resource.tipo)}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3 p-4 sm:p-5">
              {resource.video_url ? (
                <a
                  href={resource.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-navy"
                >
                  {ACTION_LABELS[resource.tipo]}
                </a>
              ) : fileUrl ? (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={resource.tipo !== "video" && resource.tipo !== "audio"}
                  className="rounded bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-navy"
                >
                  {ACTION_LABELS[resource.tipo]}
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="cursor-not-allowed rounded bg-border px-5 py-3 text-sm font-semibold text-white/80"
                >
                  Archivo pendiente de carga
                </button>
              )}

              <form action={boundToggle}>
                <button
                  type="submit"
                  className="rounded border border-border bg-white px-5 py-3 text-sm text-navy hover:border-slate"
                >
                  {completed ? "Completado ✓" : "Marcar como completado"}
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
              <Link
                key={r.id}
                href={`/recursos/${r.id}`}
                className="rounded border border-border bg-white p-3.5 hover:border-slate"
              >
                <div className="mb-1.5 font-mono text-[10px] text-slate">
                  {TIPO_LABELS[r.tipo]} · {r.nivel}
                </div>
                <div className="text-sm font-bold leading-[1.3]">{r.titulo}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

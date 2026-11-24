"use client";

import type { CSSProperties } from "react";
import { useParams, usePathname } from "next/navigation";
import type { CatalogItem } from "@/lib/portal/catalog";
import { recallItem } from "@/lib/portal/client-store";
import { Icon } from "@/components/portal/Icon";
import { AsideSkeleton, DetailShell } from "@/components/portal/detail/DetailShell";
import { ActionsSkeleton, DocumentDesk, GameHead, VideoStage, Worksheet } from "@/components/portal/detail/Stages";
import { AudioStage } from "@/components/portal/detail/AudioStage";
import { TopBar } from "@/components/portal/TopBar";

/**
 * Pantalla de carga de un recurso. Si el estudiante viene de la biblioteca ya
 * conocemos la portada y el título, así que se muestran al instante (la
 * portada viaja desde la tarjeta) y solo lo demás espera al servidor.
 */
export function DetailLoading() {
  const params = useParams<{ id?: string }>();
  const pathname = usePathname();
  const id = (typeof params?.id === "string" ? params.id : null) ?? pathname.split("/").filter(Boolean).pop() ?? "";
  const item = id ? recallItem(id) : null;

  return (
    <>
      <TopBar />
      <p className="sf-sr" role="status">
        Cargando el recurso…
      </p>
      {item ? (
        <DetailShell item={item} ready={false} aside={<AsideSkeleton />}>
          <Stage item={item} />
        </DetailShell>
      ) : (
        <GenericSkeleton />
      )}
    </>
  );
}

function Stage({ item }: { item: CatalogItem }) {
  if (item.kind === "audio") return <AudioStage item={item} src={null} ready={false} />;
  if (item.kind === "video")
    return (
      <>
        <VideoStage item={item} embedUrl={null} src={null} />
        <ActionsSkeleton label="Marcar como completado" />
      </>
    );
  if (item.kind === "ejercicio")
    return (
      <>
        <Worksheet item={item} ready={false} rows={parseInt(item.meta, 10) || 5} ok="" />
        <ActionsSkeleton />
      </>
    );
  if (item.kind === "juego") return <GameHead item={item} />;
  return (
    <>
      <DocumentDesk item={item} ready={false} ok="" />
      <ActionsSkeleton label="Marcar como completado" />
    </>
  );
}

function GenericSkeleton() {
  return (
    <div className="sf-wrap sf-gut sf-detail" aria-hidden="true">
      <span className="sf-back sf-back--sk">
        <Icon name="arrow-l" /> Volver a la biblioteca
      </span>
      <div className="sf-detail__grid">
        <div className="sf-detail__main">
          <div className="sf-badges">
            {[86, 104, 92].map((w) => (
              <span key={w} className="sf-sk sf-skl" style={{ width: w, height: 28, borderRadius: 999 }} />
            ))}
          </div>
          <div className="sf-title-sk">
            <span className="sf-sk sf-skl" style={{ width: "72%" }} />
            <span className="sf-sk sf-skl" style={{ width: "44%" }} />
          </div>
          <span className="sf-sk sf-skl" style={{ width: "58%", marginTop: 18 }} />
          <div className="sf-stagewrap">
            <div className="sf-stage sf-stage--sk">
              <div className="sf-sk" style={{ "--h": "220px" } as CSSProperties} />
            </div>
          </div>
        </div>
        <aside className="sf-detail__aside">
          <AsideSkeleton />
        </aside>
      </div>
    </div>
  );
}

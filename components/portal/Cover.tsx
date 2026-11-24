import { ViewTransition, type ReactNode } from "react";
import type { CatalogItem } from "@/lib/portal/catalog";
import { artFor } from "@/lib/portal/art";
import { isHit } from "@/lib/portal/search";
import { Icon } from "@/components/portal/Icon";

type CoverItem = Pick<CatalogItem, "id" | "en" | "tipoLabel" | "icon" | "art">;

/**
 * Portada de un recurso.
 *  - card: tarjeta de la biblioteca (etiqueta, título arriba, dibujo abajo)
 *  - page: hoja principal del escritorio en el detalle (dibujo en el centro, título abajo)
 *  - band: cabecera de la hoja de ejercicios (solo etiqueta y título)
 *  - thumb: miniatura cuadrada (solo dibujo)
 */
export function Cover({
  item,
  mode,
  done = false,
  title,
}: {
  item: CoverItem;
  mode: "card" | "page" | "band" | "thumb";
  done?: boolean;
  title?: ReactNode;
}) {
  const art =
    mode === "band" ? null : (
      <div className="sf-cover__art">
        <Art item={item} mode={mode} />
      </div>
    );
  const heading = (
    <p className={"sf-cover__title" + (item.en.length > 26 ? " is-long" : "")}>{title ?? item.en}</p>
  );

  return (
    <div className={`sf-cover sf-cover--${mode}`} data-art={item.art} data-morph={item.id}>
      {mode !== "thumb" && (
        <div className="sf-cover__top">
          <span className="sf-chip">
            <Icon name={item.icon} />
            {item.tipoLabel}
          </span>
          {done && (
            <span className="sf-done" title="Completado">
              <Icon name="check" />
              <span className="sf-sr">Completado</span>
            </span>
          )}
        </div>
      )}
      {mode === "card" && heading}
      {art}
      {(mode === "page" || mode === "band") && heading}
    </div>
  );
}

function Art({ item, mode }: { item: CoverItem; mode: "card" | "page" | "thumb" }) {
  const a = artFor(item.art, mode, item.id);
  return (
    <svg
      className="sf-art"
      viewBox={a.viewBox}
      preserveAspectRatio={a.par}
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: a.inner }}
    />
  );
}

/**
 * Une la portada de la tarjeta con la del detalle: al abrir un recurso la
 * portada viaja de la biblioteca a su lugar en la página (y vuelve al regresar).
 */
export function Morph({ id, children }: { id: string; children: ReactNode }) {
  return (
    <ViewTransition name={`sf-cover-${id}`} share="sf-morph" default="none">
      {children}
    </ViewTransition>
  );
}

/** Resalta en un texto las palabras que coinciden con la búsqueda. */
export function Hi({ text, hits }: { text: string; hits?: string[] | null }) {
  if (!hits || !hits.length) return <>{text}</>;
  const parts = String(text).split(/([^A-Za-zÀ-ÿ0-9']+)/);
  return (
    <>
      {parts.map((part, i) =>
        isHit(part, hits) ? (
          <mark key={i} className="sf-mark">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

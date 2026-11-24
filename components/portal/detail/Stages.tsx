import type { CSSProperties, ReactNode } from "react";
import type { CatalogItem } from "@/lib/portal/catalog";
import { Cover, Morph } from "@/components/portal/Cover";
import { StateLine } from "@/components/portal/detail/DetailShell";

/**
 * Escenarios del detalle. Cada uno reserva su propio espacio para la animación
 * (las hojas que se abren en abanico tienen un margen a la derecha), así que la
 * ilustración nunca tapa el texto de al lado.
 */

export function DocumentDesk({ item, ready, ok }: { item: CatalogItem; ready: boolean; ok: string }) {
  return (
    <div className="sf-stagewrap">
      <div className="sf-stage sf-desk">
        <div className="sf-stack">
          <div className="sf-sheet sf-sheet--2" aria-hidden="true" />
          <div className="sf-sheet sf-sheet--1" aria-hidden="true" />
          <Morph id={item.id}>
            <div className="sf-page">
              <Cover item={item} mode="page" />
            </div>
          </Morph>
        </div>
        <div className="sf-stage__info">
          <p className="sf-stage__k">{item.tipoLabel} · PDF</p>
          {item.meta ? <p className="sf-stage__m">{item.meta}</p> : null}
          <StateLine ready={ready} wait="Preparando el documento…" ok={ok} />
        </div>
      </div>
    </div>
  );
}

export function Worksheet({
  item,
  ready,
  rows,
  ok,
  extra,
}: {
  item: CatalogItem;
  ready: boolean;
  rows: number;
  ok: string;
  extra?: ReactNode;
}) {
  const n = Math.min(8, Math.max(3, rows || 5));
  return (
    <div className="sf-stagewrap">
      <div className="sf-stage sf-work">
        <div className="sf-work__page">
          <Morph id={item.id}>
            <div className="sf-work__head">
              <Cover item={item} mode="band" />
            </div>
          </Morph>
          <ol className="sf-work__rows" aria-hidden="true">
            {Array.from({ length: n }, (_, k) => (
              <li key={k} style={{ "--k": k } as CSSProperties}>
                <span className="sf-work__box">
                  <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                    <path pathLength={1} d="M3.5 8.4l3 3 6-6.6" />
                  </svg>
                </span>
                <span className="sf-work__line" style={{ width: `${50 + ((k * 37) % 42)}%` }} />
              </li>
            ))}
          </ol>
        </div>
        <div className="sf-stage__info">
          <p className="sf-stage__k">Cuadernillo interactivo</p>
          {item.meta ? <p className="sf-stage__m">{item.meta}</p> : null}
          <StateLine ready={ready} wait="Preparando los ejercicios…" ok={ok} />
          {extra}
        </div>
      </div>
    </div>
  );
}

export function VideoStage({ item, embedUrl, src }: { item: CatalogItem; embedUrl: string | null; src: string | null }) {
  return (
    <Morph id={item.id}>
      <div className="sf-video" data-morph={item.id}>
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={item.en}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : src ? (
          <video controls src={src} />
        ) : (
          <div className="sf-video__wait">
            <span className="sf-spin" />
          </div>
        )}
      </div>
    </Morph>
  );
}

export function GameHead({ item }: { item: CatalogItem }) {
  return (
    <div className="sf-gamehead">
      <Morph id={item.id}>
        <div className="sf-work__head sf-gamehead__band">
          <Cover item={item} mode="band" />
        </div>
      </Morph>
    </div>
  );
}

export function ActionsSkeleton({ label }: { label?: string }) {
  return (
    <div className="sf-actions">
      <button type="button" className="sf-btn-amber" disabled>
        <span className="sf-spin" /> Preparando…
      </button>
      {label ? (
        <span className="sf-btn-line sf-btn-line--ghost" aria-hidden="true">
          {label}
        </span>
      ) : null}
    </div>
  );
}
